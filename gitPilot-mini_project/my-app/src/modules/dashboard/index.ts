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
