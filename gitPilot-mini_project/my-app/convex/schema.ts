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
});
