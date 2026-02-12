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
        q.eq("clerkToken", identity.tokenIdentifier),
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
      .filter((q) =>
        q.and(
          q.eq(q.field("repoOwner"), args.repoOwner),
          q.eq(q.field("repoName"), args.repoName),
        ),
      )
      .first();

    if (!existingRepo) {
      // Can't update what doesn't exist
      return null;
    }

    await ctx.db.patch(existingRepo._id, {
      status: args.status as any,
    });
  },
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
        q.eq("clerkToken", identity.tokenIdentifier),
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

export const getRepoByGithubId = query({
  args: { githubId: v.int64() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();
  },
});

export const getRepoByOwnerAndName = query({
  args: { owner: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      return null;
    }
    return await ctx.db
      .query("repositories")
      .filter((q) =>
        q.and(
          q.eq(q.field("repoOwner"), args.owner),
          q.eq(q.field("repoName"), args.name),
        ),
      )
      .first();
  },
});

export const createReview = mutation({
  args: {
    repoId: v.id("repositories"),
    prOrCommitTitle: v.string(),
    prOrCommitUrl: v.optional(v.string()),
    commitHash: v.optional(v.string()),
    prNumber: v.optional(v.number()),
    authorUserName: v.string(),
    reviewType: v.union(v.literal("pr"), v.literal("commit")),
    reviewStatus: v.union(v.literal("pending"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reviews", {
      repoId: args.repoId,
      prOrCommitTitle: args.prOrCommitTitle,
      prOrCommitUrl: args.prOrCommitUrl,
      commitHash: args.commitHash,
      prNumber: args.prNumber,
      authorUserName: args.authorUserName,
      reviewType: args.reviewType,
      reviewStatus: args.reviewStatus, // pending
      review: "", // Initial empty review
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    review: v.string(),
    reviewStatus: v.union(v.literal("completed"), v.literal("failed")),
    ctiticalIssueFound: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reviewId, {
      review: args.review,
      reviewStatus: args.reviewStatus,
      ctiticalIssueFound: args.ctiticalIssueFound,
      updatedAt: Date.now(),
    });
  },
});

export const createIssue = mutation({
  args: {
    repoId: v.id("repositories"),
    issueTitle: v.string(),
    issueDescription: v.string(),
    issueStatus: v.union(
      v.literal("assigned"),
      v.literal("ignored"),
      v.literal("pending"),
      v.literal("resolved"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("issues", {
      repoId: args.repoId,
      issueTitle: args.issueTitle,
      issueDescription: args.issueDescription,
      issueStatus: args.issueStatus,
      issueCreatedAt: Date.now(),
      issueUpdatedAt: Date.now(),
    });
  },
});

export const getReviewsByRepoId = query({
  args: { repoId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviews")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .collect();
  },
});

export const getIssuesByRepoId = query({
  args: { repoId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .collect();
  },
});


// TOOL USED BY AGENT TO GET RECENT ISSUE OR NUMBER OF ISSUE
export const getIssueTool = query({
  args: {
    repoId: v.id("repositories"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const takeCount = args.limit && args.limit > 0 ? args.limit : 1;

    const issues = await ctx.db
      .query("issues")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .take(takeCount);

    if (!issues || issues.length === 0) {
      return {
        success: false,
        message: "No issues found",
        data: [],
      };
    }

    return {
      success: true,
      data: issues,
    };
  },
});

