import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export async function sendEmail(resendKey: string, payload: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Lalli Fafa <raj@lallifafa.com>",
      ...payload,
    }),
  });
}

export const HEADER = `
  <div style="background:#1a1a2e;padding:32px;text-align:center">
    <h1 style="color:#fff;font-size:26px;margin:0;font-weight:800;font-family:'Nunito',Arial,sans-serif">
      Lalli <span style="color:#4ecdc4">Fafa</span>
    </h1>
    <p style="color:rgba(255,255,255,0.45);font-size:13px;margin:6px 0 0;font-family:'Nunito',Arial,sans-serif">
      Personalised AI stories for your little one
    </p>
  </div>`;

export const FOOTER = `
  <div style="padding:24px 32px;background:#f9f6ef;text-align:center">
    <p style="color:#aaa;font-size:11px;margin:0;font-family:'Nunito',Arial,sans-serif">
      © ${new Date().getFullYear()} Lalli Fafa ·
      <a href="https://www.lallifafa.com" style="color:#4ecdc4;text-decoration:none">lallifafa.com</a>
    </p>
  </div>`;

// The 4-pillar benefit grid, factored out of sendWelcomeEmail so every
// lifecycle email uses the exact same brand block instead of a copy that
// can drift out of sync.
export const PILLAR_GRID = `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    <tr>
      <td width="48%" style="vertical-align:top;padding:16px;background:#f5fffe;border-radius:14px;border:1px solid rgba(0,201,167,0.15)">
        <div style="font-size:28px;margin-bottom:8px">👂</div>
        <div style="font-size:13px;font-weight:800;color:#1a1a2e;margin-bottom:4px">Listening Skills</div>
        <div style="font-size:12px;color:#666;line-height:1.5">Listen. Understand. Remember.</div>
      </td>
      <td width="4%"></td>
      <td width="48%" style="vertical-align:top;padding:16px;background:#fffdf0;border-radius:14px;border:1px solid rgba(249,199,0,0.2)">
        <div style="font-size:28px;margin-bottom:8px">🎯</div>
        <div style="font-size:13px;font-weight:800;color:#1a1a2e;margin-bottom:4px">Attention & Focus</div>
        <div style="font-size:12px;color:#666;line-height:1.5">Stay engaged. Follow the story.</div>
      </td>
    </tr>
    <tr><td colspan="3" style="height:12px"></td></tr>
    <tr>
      <td width="48%" style="vertical-align:top;padding:16px;background:#fff5f6;border-radius:14px;border:1px solid rgba(230,70,100,0.14)">
        <div style="font-size:28px;margin-bottom:8px">❤️</div>
        <div style="font-size:13px;font-weight:800;color:#1a1a2e;margin-bottom:4px">Emotional Intelligence</div>
        <div style="font-size:12px;color:#666;line-height:1.5">Understand feelings. Build empathy.</div>
      </td>
      <td width="4%"></td>
      <td width="48%" style="vertical-align:top;padding:16px;background:#f0faff;border-radius:14px;border:1px solid rgba(0,150,220,0.12)">
        <div style="font-size:28px;margin-bottom:8px">🧠</div>
        <div style="font-size:13px;font-weight:800;color:#1a1a2e;margin-bottom:4px">Cognitive Growth</div>
        <div style="font-size:12px;color:#666;line-height:1.5">Remember. Reason. Solve.</div>
      </td>
    </tr>
  </table>`;

export const sendWelcomeEmail = internalAction({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (_ctx, { email, name }) => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const greeting = name ? `Hi ${name.split(" ")[0]}` : "Hi there";

    const html = `
      <div style="font-family:'Nunito',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
        ${HEADER}
        <div style="padding:40px 32px">
          <h2 style="color:#1a1a2e;font-size:24px;font-weight:800;margin:0 0 8px">
            ${greeting}, welcome to Lalli Fafa! 🎉
          </h2>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 4px">
            You've just unlocked a world of magical, personalised bedtime stories for your child, starring <strong>Lalli</strong> (the curious big sister) and <strong>Fafa</strong> (her adventurous little brother).
          </p>
          <p style="color:#999;font-size:13px;font-weight:700;font-style:italic;line-height:1.6;margin:0 0 28px">
            Personalised storytelling for growing minds.
          </p>

          <!-- Benefit grid -->
          ${PILLAR_GRID}

          <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 28px">
            Research shows children who have regular story time develop <strong>vocabulary 2–3× faster</strong> and show stronger empathy and social skills. With Lalli Fafa, every story is a little investment in your child's future. 💛
          </p>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://www.lallifafa.com/dashboard"
               style="display:inline-block;background:linear-gradient(135deg,#f9c700,#ffab00);color:#1a1a2e;text-decoration:none;font-weight:800;font-size:15px;padding:16px 40px;border-radius:50px;box-shadow:0 4px 20px rgba(249,199,0,0.35)">
              ✨ Create your first story →
            </a>
          </div>

          <p style="color:#888;font-size:13px;line-height:1.6;margin:0">
            Your account starts with <strong>200 free credits</strong>, enough for 2 stories to start. Short stories cost 80 credits, longer ones up to 150. Happy storytelling! 🌙
          </p>
        </div>
        ${FOOTER}
      </div>`;

    const text = `${greeting}, welcome to Lalli Fafa!\n\nYou've unlocked personalised bedtime stories for your child, featuring Lalli and Fafa.\n\nPersonalised storytelling for growing minds.\n\n- Listening Skills: Listen. Understand. Remember.\n- Attention & Focus: Stay engaged. Follow the story.\n- Emotional Intelligence: Understand feelings. Build empathy.\n- Cognitive Growth: Remember. Reason. Solve.\n\nYour account starts with 200 free credits. Create your first story at https://www.lallifafa.com/dashboard\n\nThe Lalli Fafa team`;

    try {
      await sendEmail(resendKey, {
        to: [email],
        subject: "Welcome to Lalli Fafa: your child's story journey begins 🌙",
        html,
        text,
      });
    } catch (err) {
      console.error("Failed to send welcome email:", err);
    }
  },
});

export const sendCreditAddedEmail = internalAction({
  args: {
    email: v.string(),
    credits: v.number(),
    newBalance: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (_ctx, { email, credits, newBalance, note }) => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    const html = `
      <div style="font-family:'Nunito',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
        ${HEADER}
        <div style="padding:40px 32px">
          <h2 style="color:#1a1a2e;font-size:24px;font-weight:800;margin:0 0 12px">
            ✨ You've got more stories!
          </h2>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px">
            Great news, <strong>${credits} credits</strong> have just been added to your Lalli Fafa account.${note ? `<br/><br/><em style="color:#777">Note from the team: ${note}</em>` : ""}
          </p>

          <!-- Balance card -->
          <div style="background:linear-gradient(135deg,#1a1a2e,#2d2b50);border-radius:16px;padding:24px;margin-bottom:28px;text-align:center">
            <p style="color:rgba(255,255,255,0.55);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px">New credit balance</p>
            <p style="color:#f9c700;font-size:48px;font-weight:800;margin:0;line-height:1">
              ${newBalance}
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:8px 0 0">
              Each story costs 80 credits · ${Math.floor(newBalance / 80)} stor${Math.floor(newBalance / 80) === 1 ? "y" : "ies"} available
            </p>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:28px">
            <a href="https://www.lallifafa.com/dashboard"
               style="display:inline-block;background:linear-gradient(135deg,#f9c700,#ffab00);color:#1a1a2e;text-decoration:none;font-weight:800;font-size:15px;padding:16px 40px;border-radius:50px;box-shadow:0 4px 20px rgba(249,199,0,0.35)">
              Create a new story →
            </a>
          </div>

          <p style="color:#aaa;font-size:12px;text-align:center;margin:0">
            Questions? Reply to this email or visit <a href="https://www.lallifafa.com" style="color:#4ecdc4">lallifafa.com</a>
          </p>
        </div>
        ${FOOTER}
      </div>`;

    const text = `Great news! ${credits} credits have been added to your Lalli Fafa account.${note ? `\n\nNote from the team: ${note}` : ""}\n\nNew balance: ${newBalance} credits (${Math.floor(newBalance / 80)} stories available)\n\nCreate your next story at https://www.lallifafa.com/dashboard`;

    try {
      await sendEmail(resendKey, {
        to: [email],
        subject: `✨ ${credits} credits added to your Lalli Fafa account`,
        html,
        text,
      });
    } catch (err) {
      console.error("Failed to send credit email:", err);
    }
  },
});

// Internal query: check whether a user has completed onboarding (has a profile).
export const _checkHasProfile = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("user_profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId as any))
      .first();
    return profile !== null;
  },
});

// Scheduled 1 hour after signup — sends a re-engagement email if the user
// never finished onboarding (i.e. has no profile record yet).
export const sendReengagementIfNeeded = internalAction({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { userId, email, name }) => {
    const hasProfile = await ctx.runQuery(internal.emailActions._checkHasProfile, { userId });
    if (hasProfile) return; // Already onboarded — nothing to do

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey || !email) return;

    const first = name ? name.split(" ")[0] : "there";

    const html = `
      <div style="font-family:'Nunito',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
        ${HEADER}
        <div style="padding:40px 32px">
          <h2 style="color:#1a1a2e;font-size:24px;font-weight:800;margin:0 0 8px">
            Hi ${first}, your first story is waiting! ✨
          </h2>
          <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 24px">
            You created your Lalli Fafa account an hour ago but haven't set up your child's profile yet.
            It only takes 2 minutes, and your <strong>200 free credits</strong> are ready and waiting.
          </p>

          <!-- Story preview card -->
          <div style="background:linear-gradient(135deg,#1a1a2e,#2d2b50);border-radius:18px;padding:24px;margin-bottom:28px;text-align:center">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 10px">What's waiting for you</p>
            <p style="color:#fff;font-size:18px;font-weight:800;margin:0 0 8px;line-height:1.3">A personalised illustrated story<br/>starring your child 🌟</p>
            <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0">With AI narration · In English or Hindi · Ready in 60 seconds</p>
          </div>

          <!-- Steps -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
            <tr>
              <td style="vertical-align:top;padding:0 0 16px">
                <div style="display:flex;align-items:flex-start;gap:12px">
                  <div style="width:28px;height:28px;border-radius:50%;background:#f9c700;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#1a1a2e;flex-shrink:0">1</div>
                  <div>
                    <div style="font-weight:800;color:#1a1a2e;font-size:14px;margin-bottom:2px">Tell us about your child</div>
                    <div style="color:#666;font-size:13px">Name, age, favourite colour: they become the hero</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="vertical-align:top;padding:0 0 16px">
                <div style="display:flex;align-items:flex-start;gap:12px">
                  <div style="width:28px;height:28px;border-radius:50%;background:#4ecdc4;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#1a1a2e;flex-shrink:0">2</div>
                  <div>
                    <div style="font-weight:800;color:#1a1a2e;font-size:14px;margin-bottom:2px">Pick a theme</div>
                    <div style="color:#666;font-size:13px">Adventure, bedtime, silly, moral lessons: your choice</div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="vertical-align:top">
                <div style="display:flex;align-items:flex-start;gap:12px">
                  <div style="width:28px;height:28px;border-radius:50%;background:#c084fc;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff;flex-shrink:0">3</div>
                  <div>
                    <div style="font-weight:800;color:#1a1a2e;font-size:14px;margin-bottom:2px">Your story is ready in ~60 seconds</div>
                    <div style="color:#666;font-size:13px">Illustrated, narrated, and personalised just for them</div>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:24px">
            <a href="https://www.lallifafa.com/onboarding"
               style="display:inline-block;background:linear-gradient(135deg,#f9c700,#ffab00);color:#1a1a2e;text-decoration:none;font-weight:800;font-size:15px;padding:16px 40px;border-radius:50px;box-shadow:0 4px 20px rgba(249,199,0,0.35)">
              ✨ Finish setup: takes 2 minutes →
            </a>
          </div>

          <p style="color:#aaa;font-size:12px;text-align:center;margin:0;line-height:1.6">
            Your 200 free credits never expire. No credit card needed.<br/>
            Questions? Just reply to this email.
          </p>
        </div>
        ${FOOTER}
      </div>`;

    const text = `Hi ${first}!\n\nYou created your Lalli Fafa account an hour ago but haven't set up your child's profile yet.\n\nIt only takes 2 minutes, and your 200 free credits are ready and waiting.\n\nFinish setup at: https://www.lallifafa.com/onboarding\n\nNo credit card needed. Your credits never expire.\n\nThe Lalli Fafa team`;

    try {
      await sendEmail(resendKey, {
        to: [email],
        subject: `${first}, your child's first story is waiting ✨`,
        html,
        text,
      });
    } catch (err) {
      console.error("Failed to send re-engagement email:", err);
    }
  },
});
