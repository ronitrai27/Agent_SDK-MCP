"use server";
import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import {
  getRepoHealthData,
  getRepoLanguages,
  getUserGithubToken,
} from "../github";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export const ConnectRepo = async (details: {
  owner: string;
  repo: string;
  githubId: number;
  fullName: string;
  url: string;
}) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Trigger Inngest indexing in background
  console.log("Triggering Inngest indexing...");
  await inngest.send({
    name: "repository-connected",
    data: {
      owner: details.owner,
      repo: details.repo,
      userId,
    },
  });

  // Get initial data to return to client
  console.log("Fetching initial data...");
  const [healthData, languages] = await Promise.all([
    getRepoHealthData(details.owner, details.repo),
    getRepoLanguages(details.owner, details.repo),
  ]);

  return {
    success: true,
    data: {
      healthData,
      languages,
    },
  };
};

// export async function handlePushEvent(body: any) {
//   const commits = body.commits || [];
//   const repo = body.repository.full_name;
//   const [owner, repoName] = repo.split("/");
//   const branch = body.ref.replace("refs/heads/", "");
//   const pusher = body.pusher;

//   console.log(`📦 Processing ${commits.length} commit(s) to ${repo}/${branch}`);
//   console.log("commits by owner and on reponame", owner, repoName);

//   const commitActivities = commits.map((commit: any) => {
//     return {
//       // Owner/Author info
//       authorName: commit.author.name,
//       authorEmail: commit.author.email,
//       authorUsername: commit.author.username || pusher.name,
//       authorAvatar: `https://github.com/${commit.author.username || pusher.name}.png`,

//       // Commit details
//       commitId: commit.id,
//       commitMessage: commit.message,
//       commitUrl: commit.url,
//       timestamp: new Date(commit.timestamp),

//       // Repo info
//       repoOwner: owner,
//       repoName: repoName,
//       repoFullName: repo,
//       branch: branch,
//       repoUrl: body.repository.html_url,

//       // Changes
//       addedFiles: commit.added || [],
//       modifiedFiles: commit.modified || [],
//       removedFiles: commit.removed || [],
//       totalFilesChanged:
//         (commit.added?.length || 0) +
//         (commit.modified?.length || 0) +
//         (commit.removed?.length || 0),
//     };
//   });

//   console.log("commits:", commits);
//   console.log("commitActivities:", commitActivities);

//   //  also need to ge tthe comit files content for AI to analyse

//   // reviews: defineTable({
//   //   repoId: v.id("repositories"),
//   //   prOrCommitTitle: v.string(),
//   //   prOrCommitUrl: v.optional(v.string()),
//   //   authorUserName: v.optional(v.string()),
//   //   authorAvatar: v.optional(v.string()),
//   //   prNumber: v.optional(v.number()), // for pr
//   //   commitHash: v.optional(v.string()), // for commit
//   //   reviewType: v.union(v.literal("pr"), v.literal("commit")),
//   //   reviewStatus: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"))),
//   //   ctiticalIssueFound: v.optional(v.boolean()),
//   //   review: v.string(),
//   //   createdAt: v.number(),
//   //   updatedAt: v.number(),
//   // })

//   // save the basic detail to db with reviewStatus as pending

//   // now call the inngest function to process the commits
//   // await inngest.send({
//   //   name: "commit-processed",
//   //   data: {
//   //     commitActivities,
//   //   },
//   // });
// }

export const HandlePrEvent = async ({
  owner,
  repoName,
  prNumber,
  prTitle,
  prUrl,
  author,
}: {
  owner: string;
  repoName: string;
  prNumber: any;
  prTitle: string;
  prUrl: string;
  author: string;
}) => {
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  try {
    console.log("Fetching repo data");
    const repoData = await convex.query(api.repo.getRepoByOwnerAndName, {
      owner,
      name: repoName,
    });
    console.log("Repo data fetched:", repoData);

    if (!repoData) {
      console.log("Repository not found in database:", owner + "/" + repoName);
      return { message: "Repository not found", status: "skipped" };
    }

    const userData = await convex.query(api.users.getUser, {
      userId: repoData.userId,
    });

    if (!userData) {
      console.log("User not found for repo:", repoData.repoName);
      return { message: "User not found", status: "skipped" };
    }
    // Check limits
    if (userData.aiLimits && userData.aiLimits.pr >= 5) {
      console.log("Usage limit exceeded for user", userData.userName);
      return { message: "Usage limit exceeded", status: "skipped" };
    }
    // Get GitHub token using clerkUserId from database
    if (!userData.clerkUserId) {
      console.error("Clerk User ID not found for user:", userData.userName);
      return { message: "Clerk User ID not found", status: "failed" };
    }

    const token = await getUserGithubToken(userData.clerkUserId);

    if (!token) {
      console.error("GitHub token not found for user:", userData.userName);
      return { message: "GitHub token not found", status: "failed" };
    }
    console.log("Token found for user:", userData.userName);

    // now call the inngest function here and it will further call prdiff etc
    console.log("Limit passed for the user. !!!");
    // creating review in db
     const reviewId = await convex.mutation(api.repo.createReview, {
      repoId: repoData._id,
      prOrCommitTitle: prTitle,
      prOrCommitUrl: prUrl,
      prNumber: prNumber,
      authorUserName: author,
      reviewType: "pr",
      reviewStatus: "pending",
    });
    console.log("Review created:", reviewId);
    await inngest.send({
      name: "pr/analyse",
      data: {
        reviewId,
        repoId: repoData._id,
        prNumber,
        owner,
        repoName,
        token,
        userId: userData.clerkUserId,
      },
    });
  } catch (e) {
    console.log("error==========>", e);
  }
};
