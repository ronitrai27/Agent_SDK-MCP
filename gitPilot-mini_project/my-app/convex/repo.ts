import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const ConnectRepository = mutation({
  args: {
    githubId: v.int64(),
    name: v.string(),
    owner: v.string(),
    fullName: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    } 

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("clerkToken", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }


    const repositoryId = await ctx.db.insert("repositories", {
      githubId: args.githubId,
      repoName: args.name,
      repoOwner: args.owner,
      fullRepoName: args.fullName,
      repoUrl: args.url,
      userId: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "indexing",
    });

    return { repositoryId, userId: user.clerkToken };
  },
});

export const updateRepoStatus = mutation({
  args: {
    repoOwner: v.string(),
    repoName: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    
    const existingRepo = await ctx.db
        .query("repositories")
        .filter((q) => q.and(
            q.eq(q.field("repoOwner"), args.repoOwner),
            q.eq(q.field("repoName"), args.repoName)
        ))
        .first();

    if (!existingRepo) {
        // Can't update what doesn't exist
        return null; 
    }

    await ctx.db.patch(existingRepo._id, {
        status: args.status as any,
    });
  }
});

export const getAllConnectedRepo = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("clerkToken", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    return await ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});