import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkToken: v.string(),
    userName: v.string(), // rox
    imageUrl: v.optional(v.string()),
    githubName: v.optional(v.string()), // ronitrai27
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
  })
    .index("by_user", ["userId"])
    .index("by_github_id", ["githubId"]),
});
