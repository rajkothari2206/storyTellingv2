// Lifecycle / re-engagement emails — three cadences, each gated by
// lifecycle_emails so a daily cron check never re-sends within a window:
//
// 1. "lapsed_active"   — has generated >=1 story ever, but nothing in 15+ days.
//                        Re-sent every 15 days while still lapsed.
// 2. "never_generated" — signed up, has a profile, but has NEVER generated a
//                        story. Re-sent every 30 days while still zero.
// 3. "challenge_waiting" — a specific story has been ready for >=12h and its
//                        Story Challenge is still untaken. One-time per story,
//                        never repeated (keyed by storyId, not userId).
//
// Deliberately conservative cadence per explicit product direction: infrequent
// enough to protect inbox placement, not a daily nag. Domain-level
// deliverability (SPF/DKIM/DMARC) is a separate, real prerequisite — see the
// SPF finding flagged separately; sending "strategic" emails from a domain
// that's failing SPF checks undermines this regardless of send frequency.

import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { sendEmail, HEADER, FOOTER, PILLAR_GRID } from "./emailActions";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const LAPSED_ACTIVE_AFTER_DAYS = 15;
const NEVER_GENERATED_AFTER_DAYS = 30;
const CHALLENGE_WAITING_AFTER_HOURS = 12;
// Don't nudge "never generated" the same week as signup/welcome/1h re-engagement
// emails already cover that window — this cadence is for the longer tail.
const MIN_ACCOUNT_AGE_FOR_NEVER_GENERATED_DAYS = 3;

// ─── Bucket 1: lapsed active ──────────────────────────────────────────────────

export const _findLapsedActive = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const roles = await ctx.db.query("user_roles").filter((q) => q.eq(q.field("role"), "user")).collect();
    const allStories = await ctx.db.query("stories").collect();
    const profiles = await ctx.db.query("user_profiles").collect();
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

    const storiesByUser = new Map<string, typeof allStories>();
    for (const s of allStories) {
      if (!storiesByUser.has(s.userId)) storiesByUser.set(s.userId, []);
      storiesByUser.get(s.userId)!.push(s);
    }

    const results: Array<{ userId: string; email: string; childName?: string; storyCount: number }> = [];
    for (const role of roles) {
      const userStories = storiesByUser.get(role.userId);
      if (!userStories || userStories.length === 0) continue; // bucket 2's territory
      const mostRecent = Math.max(...userStories.map((s) => s._creationTime));
      if (now - mostRecent < LAPSED_ACTIVE_AFTER_DAYS * DAY_MS) continue; // still recently active

      const lastSent = await ctx.db
        .query("lifecycle_emails")
        .withIndex("by_user_type", (q) => q.eq("userId", role.userId).eq("emailType", "lapsed_active"))
        .order("desc")
        .first();
      if (lastSent && now - lastSent.sentAt < LAPSED_ACTIVE_AFTER_DAYS * DAY_MS) continue; // already nudged this window

      const profile = profileByUser.get(role.userId);
      results.push({ userId: role.userId, email: role.email, childName: profile?.childName, storyCount: userStories.length });
    }
    return results;
  },
});

// ─── Bucket 2: never generated ────────────────────────────────────────────────

export const _findNeverGenerated = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const roles = await ctx.db.query("user_roles").filter((q) => q.eq(q.field("role"), "user")).collect();
    const allStories = await ctx.db.query("stories").collect();
    const usersWithStories = new Set(allStories.map((s) => s.userId));
    const profiles = await ctx.db.query("user_profiles").collect();
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

    const results: Array<{ userId: string; email: string; parentName?: string }> = [];
    for (const role of roles) {
      if (usersWithStories.has(role.userId)) continue; // bucket 1's territory
      if (now - role.createdAt < MIN_ACCOUNT_AGE_FOR_NEVER_GENERATED_DAYS * DAY_MS) continue; // too new — welcome/1h emails cover this

      const lastSent = await ctx.db
        .query("lifecycle_emails")
        .withIndex("by_user_type", (q) => q.eq("userId", role.userId).eq("emailType", "never_generated"))
        .order("desc")
        .first();
      if (lastSent && now - lastSent.sentAt < NEVER_GENERATED_AFTER_DAYS * DAY_MS) continue;

      const profile = profileByUser.get(role.userId);
      results.push({ userId: role.userId, email: role.email, parentName: profile?.parentName });
    }
    return results;
  },
});

// ─── Bucket 3: Story Challenge waiting ────────────────────────────────────────

export const _findChallengeWaiting = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const readyStories = await ctx.db
      .query("stories")
      .withIndex("by_status", (q) => q.eq("status", "ready"))
      .collect();

    const roles = await ctx.db.query("user_roles").collect();
    const emailByUser = new Map(roles.map((r) => [r.userId, r.email]));

    const results: Array<{ storyId: string; userId: string; email: string; title: string; childName?: string }> = [];
    for (const story of readyStories) {
      if (now - story.createdAt < CHALLENGE_WAITING_AFTER_HOURS * HOUR_MS) continue; // not old enough yet

      const alreadySent = await ctx.db
        .query("lifecycle_emails")
        .withIndex("by_story_type", (q) => q.eq("storyId", story._id).eq("emailType", "challenge_waiting"))
        .first();
      if (alreadySent) continue;

      const challenge = await ctx.db
        .query("testserver_challenges")
        .withIndex("by_story", (q) => q.eq("storyId", story._id))
        .first();
      if (!challenge || challenge.status === "completed") continue; // no challenge, or already taken

      const email = emailByUser.get(story.userId);
      if (!email) continue;
      results.push({ storyId: story._id, userId: story.userId, email, title: story.title, childName: story.params?.childName });
    }
    return results;
  },
});

// ─── Logging (idempotency record) ─────────────────────────────────────────────

export const _logSent = internalMutation({
  args: {
    userId: v.string(),
    emailType: v.union(v.literal("lapsed_active"), v.literal("never_generated"), v.literal("challenge_waiting")),
    storyId: v.optional(v.id("stories")),
  },
  handler: async (ctx, { userId, emailType, storyId }) => {
    await ctx.db.insert("lifecycle_emails", { userId, emailType, storyId, sentAt: Date.now() });
  },
});

// ─── Email templates + senders ─────────────────────────────────────────────────

function ctaButton(href: string, label: string) {
  return `
    <div style="text-align:center;margin-bottom:24px">
      <a href="${href}"
         style="display:inline-block;background:linear-gradient(135deg,#f9c700,#ffab00);color:#1a1a2e;text-decoration:none;font-weight:800;font-size:15px;padding:16px 40px;border-radius:50px;box-shadow:0 4px 20px rgba(249,199,0,0.35)">
        ${label}
      </a>
    </div>`;
}

async function sendLapsedActiveEmail(resendKey: string, { email, childName, storyCount, subjectPrefix = "" }: { email: string; childName?: string; storyCount: number; subjectPrefix?: string }) {
  const childLabel = childName || "your child";
  const html = `
    <div style="font-family:'Nunito',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
      ${HEADER}
      <div style="padding:40px 32px">
        <h2 style="color:#1a1a2e;font-size:22px;font-weight:800;margin:0 0 8px">
          ${childLabel}'s next adventure is waiting ✨
        </h2>
        <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px">
          It's been a couple of weeks since your last Lalli &amp; Fafa story${storyCount > 1 ? ` (you've made ${storyCount} so far!)` : ""}. A new personalised, illustrated, narrated story is still just two minutes away.
        </p>
        ${PILLAR_GRID}
        ${ctaButton("https://www.lallifafa.com/generate", "✨ Create a new story →")}
        <p style="color:#aaa;font-size:12px;text-align:center;margin:0">
          Questions? Just reply to this email.
        </p>
      </div>
      ${FOOTER}
    </div>`;
  const text = `${childLabel}'s next adventure is waiting.\n\nIt's been a couple of weeks since your last Lalli & Fafa story. Create a new one at https://www.lallifafa.com/generate`;
  await sendEmail(resendKey, { to: [email], subject: `${subjectPrefix}${childLabel}'s next Lalli & Fafa story is waiting ✨`, html, text });
}

async function sendNeverGeneratedEmail(resendKey: string, { email, parentName, subjectPrefix = "" }: { email: string; parentName?: string; subjectPrefix?: string }) {
  const greeting = parentName ? `Hi ${parentName.split(" ")[0]}` : "Hi there";
  const html = `
    <div style="font-family:'Nunito',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
      ${HEADER}
      <div style="padding:40px 32px">
        <h2 style="color:#1a1a2e;font-size:22px;font-weight:800;margin:0 0 8px">
          ${greeting}, your 200 free credits are still waiting 🌙
        </h2>
        <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px">
          You signed up for Lalli Fafa but haven't created your first story yet. It takes about two minutes — no credit card, credits never expire.
        </p>
        ${PILLAR_GRID}
        ${ctaButton("https://www.lallifafa.com/generate", "✨ Create your first story →")}
        <p style="color:#aaa;font-size:12px;text-align:center;margin:0">
          Questions? Just reply to this email.
        </p>
      </div>
      ${FOOTER}
    </div>`;
  const text = `${greeting}, your 200 free credits are still waiting.\n\nCreate your first story at https://www.lallifafa.com/generate`;
  await sendEmail(resendKey, { to: [email], subject: `${subjectPrefix}Your 200 free Lalli Fafa credits are still waiting ✨`, html, text });
}

async function sendChallengeWaitingEmail(resendKey: string, { email, title, childName, storyId, subjectPrefix = "" }: { email: string; title: string; childName?: string; storyId: string; subjectPrefix?: string }) {
  const childLabel = childName || "your child";
  const html = `
    <div style="font-family:'Nunito',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
      ${HEADER}
      <div style="padding:40px 32px">
        <h2 style="color:#1a1a2e;font-size:22px;font-weight:800;margin:0 0 8px">
          🏆 ${childLabel}'s Story Challenge is waiting!
        </h2>
        <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px">
          After "<strong>${title}</strong>", Lalli and Fafa have a few playful questions ready — answer them to earn <strong>stars</strong> and see which skill ${childLabel} is growing in most.
        </p>
        <div style="background:linear-gradient(135deg,#1a1a2e,#2d2b50);border-radius:16px;padding:22px;margin-bottom:24px;text-align:center">
          <p style="color:rgba(255,255,255,0.55);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">Reward waiting</p>
          <p style="color:#f9c700;font-size:32px;font-weight:800;margin:0;line-height:1">⭐ Stars + a Growth badge</p>
        </div>
        ${ctaButton(`https://www.lallifafa.com/testserver/challenge/${storyId}`, "🏆 Take the Story Challenge →")}
        <p style="color:#aaa;font-size:12px;text-align:center;margin:0">
          Takes about 2 minutes. Questions? Just reply to this email.
        </p>
      </div>
      ${FOOTER}
    </div>`;
  const text = `${childLabel}'s Story Challenge for "${title}" is waiting! Take it at https://www.lallifafa.com/testserver/challenge/${storyId}`;
  await sendEmail(resendKey, { to: [email], subject: `${subjectPrefix}🏆 ${childLabel}'s Story Challenge is waiting — win stars!`, html, text });
}

// ─── Preview: send all 3 templates with sample data to one address ───────────
// For reviewing actual rendered content/branding before the cron is
// re-enabled. Uses fictional sample data, not any real user's info, and
// tags every subject with [PREVIEW] so it's unmistakable in an inbox.
export const sendPreviewEmails = internalAction({
  args: { to: v.string() },
  handler: async (_ctx, { to }) => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    await sendLapsedActiveEmail(resendKey, { email: to, childName: "Vanya", storyCount: 5, subjectPrefix: "[PREVIEW] " });
    await sendNeverGeneratedEmail(resendKey, { email: to, parentName: "Priya", subjectPrefix: "[PREVIEW] " });
    await sendChallengeWaitingEmail(resendKey, { email: to, title: "Lalli, Fafa and Vanya's Magical Forest Adventure", childName: "Vanya", storyId: "SAMPLE_STORY_ID", subjectPrefix: "[PREVIEW] " });

    return { sent: 3 };
  },
});

// ─── Orchestrator, run by the daily cron ──────────────────────────────────────

export const runLifecycleEmailSweep = internalAction({
  args: {},
  handler: async (ctx): Promise<{ lapsedActive: number; neverGenerated: number; challengeWaiting: number }> => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn("[lifecycleEmails] RESEND_API_KEY not set — skipping sweep");
      return { lapsedActive: 0, neverGenerated: 0, challengeWaiting: 0 };
    }

    let lapsedActive = 0, neverGenerated = 0, challengeWaiting = 0;

    const lapsed = await ctx.runQuery(internal.lifecycleEmails._findLapsedActive, {});
    for (const u of lapsed) {
      try {
        await sendLapsedActiveEmail(resendKey, u);
        await ctx.runMutation(internal.lifecycleEmails._logSent, { userId: u.userId, emailType: "lapsed_active" });
        lapsedActive++;
      } catch (err) {
        console.error(`[lifecycleEmails] lapsed_active failed for ${u.userId}:`, err);
      }
    }

    const neverGen = await ctx.runQuery(internal.lifecycleEmails._findNeverGenerated, {});
    for (const u of neverGen) {
      try {
        await sendNeverGeneratedEmail(resendKey, u);
        await ctx.runMutation(internal.lifecycleEmails._logSent, { userId: u.userId, emailType: "never_generated" });
        neverGenerated++;
      } catch (err) {
        console.error(`[lifecycleEmails] never_generated failed for ${u.userId}:`, err);
      }
    }

    const waiting = await ctx.runQuery(internal.lifecycleEmails._findChallengeWaiting, {});
    for (const s of waiting) {
      try {
        await sendChallengeWaitingEmail(resendKey, s);
        await ctx.runMutation(internal.lifecycleEmails._logSent, { userId: s.userId, emailType: "challenge_waiting", storyId: s.storyId as any });
        challengeWaiting++;
      } catch (err) {
        console.error(`[lifecycleEmails] challenge_waiting failed for story ${s.storyId}:`, err);
      }
    }

    console.log(`[lifecycleEmails] sweep complete: lapsed=${lapsedActive} neverGenerated=${neverGenerated} challengeWaiting=${challengeWaiting}`);
    return { lapsedActive, neverGenerated, challengeWaiting };
  },
});
