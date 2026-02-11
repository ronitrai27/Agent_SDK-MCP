"use server";

import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";
import { getRepoHealthData, getRepoLanguages } from "../github";

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

export async function handlePushEvent(body: any) {
  const commits = body.commits || [];
  const repo = body.repository.full_name;
  const [owner, repoName] = repo.split("/");
  const branch = body.ref.replace("refs/heads/", "");
  const pusher = body.pusher;

  console.log(`📦 Processing ${commits.length} commit(s) to ${repo}/${branch}`);
  console.log("commits by owner and on reponame", owner, repoName);

  const commitActivities = commits.map((commit: any) => {
    return {
      // Owner/Author info
      authorName: commit.author.name,
      authorEmail: commit.author.email,
      authorUsername: commit.author.username || pusher.name,
      authorAvatar: `https://github.com/${commit.author.username || pusher.name}.png`,

      // Commit details
      commitId: commit.id,
      commitMessage: commit.message,
      commitUrl: commit.url,
      timestamp: new Date(commit.timestamp),

      // Repo info
      repoOwner: owner,
      repoName: repoName,
      repoFullName: repo,
      branch: branch,
      repoUrl: body.repository.html_url,

      // Changes
      addedFiles: commit.added || [],
      modifiedFiles: commit.modified || [],
      removedFiles: commit.removed || [],
      totalFilesChanged:
        (commit.added?.length || 0) +
        (commit.modified?.length || 0) +
        (commit.removed?.length || 0),
    };
  });

  console.log("commits:", commits);
  console.log("commitActivities:", commitActivities);
}

export async function reveiewPullRequest(
  owner: string,
  repo: string,
  prNumber: number,
) {
  try {
    // first check that repo name is there in users repo table.
    // found proceed , otherwise stop there only.
  } catch (error) {
    console.log("error", error);
  }
}
