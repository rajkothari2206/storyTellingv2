import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { crossDomain } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel, Id } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins/email-otp";
import { v } from "convex/values";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);

function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false },
) {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    trustedOrigins: [
      siteUrl,
      "http://localhost:3000",
      "https://story-tellingv2-web.vercel.app",
      // v2 branch alias (stable across commits on nextjs-v2)
      "https://story-tellingv2-web-git-n-8c7fbe-raj-kotharis-projects-cbc53c03.vercel.app",
      "https://www.lallifafa.com",
      "https://lallifafa.com",
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: "Lalli Fafa <raj@lallifafa.com>",
              to: [user.email],
              subject: "Verify your Lalli Fafa email ✨",
              html: `
                <div style="font-family:'Nunito',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fffef9;border-radius:16px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
                  <div style="background:#1a1a2e;padding:32px;text-align:center">
                    <h1 style="color:#fff;font-size:24px;margin:0;font-weight:800">Lalli <span style="color:#4ecdc4">Fafa</span></h1>
                    <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:6px 0 0">Personalised stories for your little one</p>
                  </div>
                  <div style="padding:40px 32px">
                    <h2 style="color:#1a1a2e;font-size:22px;font-weight:800;margin:0 0 12px">Almost there! ✨</h2>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px">
                      Hi ${user.name || "there"},<br/><br/>
                      Please verify your email address to activate your Lalli Fafa account and start creating magical stories for your child.
                    </p>
                    <a href="${url}" style="display:inline-block;background:#f9c700;color:#1a1a2e;text-decoration:none;font-weight:800;font-size:15px;padding:14px 36px;border-radius:50px">
                      Verify my email →
                    </a>
                    <p style="color:#999;font-size:12px;margin:28px 0 0;line-height:1.6">
                      This link expires in 24 hours. If you didn't create a Lalli Fafa account, you can safely ignore this email.
                    </p>
                  </div>
                </div>
              `,
              text: `Hi ${user.name || "there"},\n\nPlease verify your Lalli Fafa email by visiting:\n${url}\n\nThis link expires in 24 hours.`,
            });
          } catch (err) {
            console.error("Failed to send verification email:", err);
          }
        } else {
          console.log(`[email-verify] Verification URL for ${user.email}: ${url}`);
        }
      },
      sendResetPassword: async ({ user, url }) => {
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          try {
            const { Resend } = await import("resend");
            const resend = new Resend(resendKey);
            await resend.emails.send({
              from: "Lalli Fafa <raj@lallifafa.com>",
              to: [user.email],
              subject: "Reset your Lalli Fafa password 🔐",
              html: `
                <div style="font-family:'Nunito',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fffef9;border-radius:16px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
                  <div style="background:#1a1a2e;padding:32px;text-align:center">
                    <h1 style="color:#fff;font-size:24px;margin:0;font-weight:800">Lalli <span style="color:#4ecdc4">Fafa</span></h1>
                    <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:6px 0 0">Personalised stories for your little one</p>
                  </div>
                  <div style="padding:40px 32px">
                    <h2 style="color:#1a1a2e;font-size:22px;font-weight:800;margin:0 0 12px">Reset your password 🔐</h2>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px">
                      Hi ${user.name || "there"},<br/><br/>
                      We received a request to reset your Lalli Fafa password. Click the button below to choose a new one. This link expires in 1 hour.
                    </p>
                    <a href="${url}" style="display:inline-block;background:#f9c700;color:#1a1a2e;text-decoration:none;font-weight:800;font-size:15px;padding:14px 36px;border-radius:50px">
                      Reset my password →
                    </a>
                    <p style="color:#999;font-size:12px;margin:28px 0 0;line-height:1.6">
                      If you didn't request a password reset, you can safely ignore this email — your password won't change.
                    </p>
                  </div>
                </div>
              `,
              text: `Hi ${user.name || "there"},\n\nReset your Lalli Fafa password by visiting:\n${url}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
            });
          } catch (err) {
            console.error("Failed to send password reset email:", err);
          }
        } else {
          console.log(`[password-reset] Reset URL for ${user.email}: ${url}`);
        }
      },
    },
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    plugins: [
      crossDomain({ siteUrl }),
      convex(),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          // Prefer a real email provider when available; fallback to console for development
          const resendKey = process.env.RESEND_API_KEY;
          if (resendKey) {
            try {
              // Dynamic import to avoid bundling if not configured
              const { Resend } = await import("resend");
              const resend = new Resend(resendKey);
              await resend.emails.send({
                from: "Lalli Fafa <raj@lallifafa.com>",
                to: [email],
                subject:
                  type === "forget-password"
                    ? "Reset your password"
                    : "Your verification code",
                text:
                  type === "forget-password"
                    ? `Use this code to reset your password: ${otp}\nThis code expires in 5 minutes.`
                    : `Your verification code is: ${otp}\nThis code expires in 5 minutes.`,
              });
              return;
            } catch (err) {
              // If sending fails, log and continue to console output to avoid blocking dev
              console.error("Failed to send OTP email via Resend:", err);
            }
          }
          // Dev fallback
          console.log(`[email-otp] (${type}) OTP for ${email}: ${otp}`);
        },
        otpLength: 6,
        expiresIn: 60 * 5,
      }),
    ],
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  returns: v.any(),
  handler: async function (ctx, args) {
    try {
      return await authComponent.getAuthUser(ctx);
    } catch {
      // Return null instead of throwing to avoid noisy unauthenticated errors
      return null;
    }
  },
});

export const getUserRole = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async function (ctx, args) {
    try {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) return null;

      // Use userId or _id as the identifier
      const userIdentifier = (user as any).userId || (user as any)._id;

      // Query the user_roles table
      const userRole = await ctx.db
        .query("user_roles")
        .withIndex("by_user", (q) => q.eq("userId", userIdentifier))
        .first();

      // Return the role, defaulting to "user" if not found
      return userRole?.role ?? "user";
    } catch {
      return null;
    }
  },
});

// Set the current authenticated user's role to admin
export const setCurrentUserRole = mutation({
  args: {
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async function (ctx, args) {
	console.log("Setting current user role");
    const user = await authComponent.getAuthUser(ctx);
	console.log("User:", user);
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Use the same identifier scheme as getUserRole/initializeUserRole
    const userIdentifier = (user as any).userId || (user as any)._id;
	console.log("User identifier:", userIdentifier);
    if (!userIdentifier) {
      throw new Error("User identifier not found for admin role assignment");
    }

    const existingRole = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", userIdentifier))
      .first();

	console.log("Existing role:", existingRole);
    const now = Date.now();

    if (existingRole) {
      // Update existing role
      await ctx.db.patch(existingRole._id, {
        role: args.role,
        updatedAt: now,
      });
    } else {
      // Create new role entry
      await ctx.db.insert("user_roles", {
        userId: userIdentifier,
        role: args.role,
        email: user.email,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// List all users with their profiles, credits, subscriptions, and story stats (admin only)
export const listAllUsers = query({
  args: {},
  returns: v.array(v.any()),
  handler: async function (ctx, args) {
    // Check if user is admin
    const user = await authComponent.getAuthUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const userIdentifier = (user as any).userId || (user as any)._id;
    const userRole = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", userIdentifier))
      .first();
    if (userRole?.role !== "admin") throw new Error("Admin access required");

    // Fetch all supporting data in parallel
    const [allRoles, allProfiles, allCredits, allSubscriptions, allStories] = await Promise.all([
      ctx.db.query("user_roles").collect(),
      ctx.db.query("user_profiles").collect(),
      ctx.db.query("user_credits").collect(),
      ctx.db.query("user_subscriptions").collect(),
      ctx.db.query("stories").collect(),
    ]);

    const profilesMap = new Map(allProfiles.map(p => [p.userId, p]));
    const creditsMap = new Map(allCredits.map(c => [c.userId, c]));
    const rolesMap = new Map(allRoles.map(r => [r.userId, r]));

    // Build the unified user list: start from roles (non-admin), then add any
    // profiles that have NO role entry (e.g. onboarding failed mid-way).
    const nonAdminRoles = allRoles.filter(r => r.role !== "admin");
    const roleUserIds = new Set(allRoles.map(r => r.userId));
    const orphanProfiles = allProfiles.filter(p => !roleUserIds.has(p.userId));

    // Represent orphan profiles as synthetic role-like objects so we can
    // iterate a single list below.
    const syntheticEntries = orphanProfiles.map(p => ({
      userId: p.userId,
      email: "",      // no role row → no email stored there; will fall back to profile
      role: "NO_ROLE" as const,
      createdAt: p.createdAt,
    }));

    const allEntries = [...nonAdminRoles, ...syntheticEntries];

    // Keep only the most-recent subscription per user (prefer active)
    const subscriptionsMap = new Map<string, any>();
    for (const sub of allSubscriptions) {
      const prev = subscriptionsMap.get(sub.userId);
      if (!prev || sub.status === "active" || sub.createdAt > (prev.createdAt ?? 0)) {
        subscriptionsMap.set(sub.userId, sub);
      }
    }

    // Count stories and record latest story date per user.
    // Stories are stored with userId = String(user._id), but user_roles may use
    // a different identifier (user.userId). We index stories by every known alias
    // so the count is accurate regardless of which format was used at creation time.
    const storyCountMap = new Map<string, number>();
    const lastStoryMap = new Map<string, number>();

    for (const story of allStories) {
      // Normalise: try to map the story's userId to the role's userId
      const uid = story.userId;
      storyCountMap.set(uid, (storyCountMap.get(uid) ?? 0) + 1);
      const prev = lastStoryMap.get(uid);
      if (!prev || story.createdAt > prev) lastStoryMap.set(uid, story.createdAt);
    }

    const usersWithDetails = await Promise.all(allEntries.map(async (role) => {
      const profile = profilesMap.get(role.userId);

      // Resolve storage URLs
      const childProfilePictureUrl = profile?.childProfilePicture
        ? await ctx.storage.getUrl(profile.childProfilePicture as Id<"_storage">)
        : null;
      const childAvatarUrl = profile?.childAvatarStorageId
        ? await ctx.storage.getUrl(profile.childAvatarStorageId as Id<"_storage">)
        : null;
      const child2ProfilePictureUrl = profile?.child2ProfilePicture
        ? await ctx.storage.getUrl(profile.child2ProfilePicture as Id<"_storage">)
        : null;
      const child2AvatarUrl = profile?.child2AvatarStorageId
        ? await ctx.storage.getUrl(profile.child2AvatarStorageId as Id<"_storage">)
        : null;

      const credit = creditsMap.get(role.userId);
      const subscription = subscriptionsMap.get(role.userId);

      // Story counts: try role.userId first, then profile.userId as fallback
      // (stories may have been written with a different ID format than user_roles)
      const storyUserId = role.userId;
      const storyUserIdAlt = profile?.userId;
      const storyCount =
        storyCountMap.get(storyUserId) ??
        (storyUserIdAlt ? storyCountMap.get(storyUserIdAlt) : undefined) ??
        0;
      const lastStoryAt =
        lastStoryMap.get(storyUserId) ??
        (storyUserIdAlt ? lastStoryMap.get(storyUserIdAlt) : undefined) ??
        null;

      return {
        id: role.userId,
        email: role.email || profile?.userId || "",
        name: profile?.parentName,
        role: (role as any).role ?? "user",
        createdAt: role.createdAt,
        // Credits
        credits: credit
          ? { available: credit.availableCredits, total: credit.totalCredits, used: credit.usedCredits }
          : null,
        // Subscription
        subscription: subscription
          ? { interval: subscription.interval, status: subscription.status, createdAt: subscription.createdAt }
          : null,
        // Story stats
        storyCount,
        lastStoryAt,
        // Profile
        profile: profile ? {
          parentName: profile.parentName,
          childName: profile.childName,
          childNickName: profile.childNickName,
          childAge: profile.childAge,
          childGender: profile.childGender,
          favoriteColor: profile.favoriteColor,
          favoriteAnimal: profile.favoriteAnimal,
          childAvatarStorageId: profile.childAvatarStorageId,
          childProfilePicture: profile.childProfilePicture,
          childProfilePictureUrl,
          childAvatarUrl,
          child2Name: profile.child2Name,
          child2Age: profile.child2Age,
          child2Gender: profile.child2Gender,
          child2NickName: profile.child2NickName,
          child2FavoriteColor: profile.child2FavoriteColor,
          child2FavoriteAnimal: profile.child2FavoriteAnimal,
          child2AvatarStorageId: profile.child2AvatarStorageId,
          child2ProfilePicture: profile.child2ProfilePicture,
          child2ProfilePictureUrl,
          child2AvatarUrl,
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak,
          lastStoryDate: profile.lastStoryDate,
        } : null,
      };
    }));

    usersWithDetails.sort((a, b) => b.createdAt - a.createdAt);
    return usersWithDetails;
  },
});

// Admin: adjust a user's credits and optionally notify them by email
export const adminAddCredits = mutation({
  args: {
    userId: v.string(),
    userEmail: v.string(),
    credits: v.number(),  // positive = add, negative = deduct
    note: v.optional(v.string()),
    sendEmail: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean(), newBalance: v.number() }),
  handler: async function (ctx, { userId, userEmail, credits, note, sendEmail }) {
    // Verify admin
    const admin = await authComponent.getAuthUser(ctx);
    if (!admin) throw new Error("Not authenticated");
    const adminId = (admin as any).userId || (admin as any)._id;
    const adminRole = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("userId", adminId))
      .first();
    if (adminRole?.role !== "admin") throw new Error("Admin access required");

    // Find or create credit record
    const userCredit = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    let newAvailable: number;
    let newTotal: number;

    if (!userCredit) {
      newTotal = Math.max(0, credits);
      newAvailable = newTotal;
      await ctx.db.insert("user_credits", {
        userId,
        totalCredits: newTotal,
        usedCredits: 0,
        availableCredits: newAvailable,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      newAvailable = Math.max(0, userCredit.availableCredits + credits);
      newTotal = credits > 0
        ? userCredit.totalCredits + credits
        : userCredit.totalCredits;
      await ctx.db.patch(userCredit._id, {
        totalCredits: newTotal,
        availableCredits: newAvailable,
        updatedAt: Date.now(),
      });
    }

    // Send email notification when credits are added (opt-in)
    const shouldEmail = sendEmail !== false && credits > 0;
    const resendKey = process.env.RESEND_API_KEY;
    if (shouldEmail && resendKey && userEmail) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Lalli Fafa <raj@lallifafa.com>",
            to: [userEmail],
            subject: `🌟 ${credits} credits added to your Lalli Fafa account!`,
            html: `
              <div style="font-family:'Nunito',Arial,sans-serif;max-width:520px;margin:0 auto;background:#fffef9;border-radius:16px;overflow:hidden;border:1.5px solid rgba(0,0,0,0.06)">
                <div style="background:#1a1a2e;padding:32px;text-align:center">
                  <h1 style="color:#fff;font-size:24px;margin:0;font-weight:800">Lalli <span style="color:#4ecdc4">Fafa</span></h1>
                  <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:6px 0 0">Personalised stories for your little one</p>
                </div>
                <div style="padding:40px 32px">
                  <h2 style="color:#1a1a2e;font-size:22px;font-weight:800;margin:0 0 12px">✨ Credits added!</h2>
                  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">
                    Great news! <strong>${credits} credits</strong> have been added to your Lalli Fafa account.${note ? `<br/><br/><em>Note from team: ${note}</em>` : ""}
                  </p>
                  <div style="background:#f5f5f4;border-radius:12px;padding:20px 24px;margin-bottom:28px">
                    <p style="margin:0;font-size:13px;color:rgba(45,45,45,0.6);font-weight:700;text-transform:uppercase;letter-spacing:0.05em">New credit balance</p>
                    <p style="margin:4px 0 0;font-size:32px;font-weight:800;color:#1a1a2e">${newAvailable}</p>
                  </div>
                  <a href="https://www.lallifafa.com/dashboard" style="display:inline-block;background:#f9c700;color:#1a1a2e;text-decoration:none;font-weight:800;font-size:15px;padding:14px 36px;border-radius:50px">
                    Go to Storyboard →
                  </a>
                </div>
              </div>
            `,
            text: `${credits} credits have been added to your Lalli Fafa account! Your new balance is ${newAvailable} credits.${note ? ` Note: ${note}` : ""} Go to https://www.lallifafa.com/dashboard`,
          }),
        });
      } catch (err) {
        console.error("Failed to send credit notification email:", err);
      }
    }

    return { success: true, newBalance: newAvailable };
  },
});
