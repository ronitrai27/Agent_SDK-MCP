// This file now contains both server actions and client hooks.
// 'use server' is applied to the action functions directly.
import { useQuery } from "@tanstack/react-query";
import { getRepoHealthData, getRepoLanguages } from "../github";

import { inngest } from "@/inngest/client";
import { auth } from "@clerk/nextjs/server";

export async function triggerRepoIndexing(owner: string, repo: string) {
  "use server";
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  await inngest.send({
    name: "repository-connected",
    data: {
      owner,
      repo,
      userId,
    },
  });

  return { success: true };
}

// ============================================
// TANSTACK QUERY HOOKS
// ============================================

const CACHE_TIME = 30 * 60 * 1000; // 30 minutes

export const useRepoHealthData = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["repo-health", owner, repo],
    queryFn: () => getRepoHealthData(owner, repo),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
};

export const useRepoLanguages = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["repo-languages", owner, repo],
    queryFn: () => getRepoLanguages(owner, repo),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
