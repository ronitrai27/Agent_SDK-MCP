import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkToken: v.string(),
    clerkUserId: v.optional(v.string()), // Clerk User ID for OAuth token retrieval
    userName: v.string(), // rox
    imageUrl: v.optional(v.string()),
    githubName: v.optional(v.string()), // ronitrai27
    userPlan: v.optional(
      v.union(v.literal("free"), v.literal("pro"), v.literal("elite")),
    ),
    aiLimits: v.optional(
      v.object({
        commit: v.number(),
        pr: v.number(),
        dateTime: v.number(), // stores date and time ( 24 hr to refresh)
      }),
    ),
    createdAt: v.number(),
  }).index("by_token", ["clerkToken"]),

  // ===============================
  // REPOSITORIES TABLE
  // ===============================
  repositories: defineTable({
    githubId: v.int64(),
    repoName: v.string(),
    repoOwner: v.string(),
    fullRepoName: v.string(),
    repoUrl: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.optional(
      v.union(
        v.literal("indexing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_github_id", ["githubId"]),

  // =========REVIEWS TABLE===========
  reviews: defineTable({
    repoId: v.id("repositories"),
    prOrCommitTitle: v.string(),
    prOrCommitUrl: v.optional(v.string()),
    authorUserName: v.optional(v.string()),
    authorAvatar: v.optional(v.string()),
    prNumber: v.optional(v.number()), // for pr
    commitHash: v.optional(v.string()), // for commit
    reviewType: v.union(v.literal("pr"), v.literal("commit")),
    reviewStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    ctiticalIssueFound: v.optional(v.boolean()),
    review: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_pr", ["prNumber"])
    .index("by_commit", ["commitHash"])
    .index("by_type", ["reviewType"]),

  // ===============Issues Table==============
  issues: defineTable({
    repoId: v.id("repositories"),
    issueTitle: v.string(),
    issueDescription: v.string(),
    issueCreatedBy: v.optional(v.string()),
    issueAssignedTo: v.optional(v.id("users")),
    issueStatus: v.optional(
      v.union(
        v.literal("assigned"),
        v.literal("ignored"),
        v.literal("pending"),
        v.literal("resolved"),
      ),
    ),
    issueCreatedAt: v.number(),
    issueUpdatedAt: v.number(),
  })
    .index("by_repo", ["repoId"])
    .index("by_status", ["issueStatus"])
    .index("by_assigned_to", ["issueAssignedTo"]),
});
