"use client";

import { useQuery } from "@tanstack/react-query";
import { getRepoHealthData, getRepoLanguages } from "../github";

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
};
