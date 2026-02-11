"use client";

import { useQuery } from "@tanstack/react-query";
import { getRepoHealthData, getRepoLanguages } from "../github";

export const useRepoHealthData = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["repo-health", owner, repo],
    queryFn: () => getRepoHealthData(owner, repo),
    staleTime: 30 * 60 * 1000, // 30 mins
    gcTime: 30 * 60 * 1000, // 30 mins
    enabled: !!owner && !!repo, // Only fetch if owner and repo are present
    refetchOnWindowFocus: false,
  });
};

export const useRepoLanguages = (owner: string, repo: string) => {
  return useQuery({
    queryKey: ["repo-languages", owner, repo],
    queryFn: () => getRepoLanguages(owner, repo),
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!owner && !!repo,
    refetchOnWindowFocus: false,
  });
};
