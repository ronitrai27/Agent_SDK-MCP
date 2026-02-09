"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "octokit";

// ========================================
// GETTING GITHUB ACCESS TOKEN FROM CLERK
// ========================================
export async function getGithubAccessToken() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const client = await clerkClient();

  const tokens = await client.users.getUserOauthAccessToken(userId, "github");

  const accessToken = tokens.data[0]?.token;
  console.log("accessToken", accessToken);
  return accessToken;
}
// ============================================
// GETTING GITHUB REPOSITORIES
// ============================================
export const getRepositories = async (
  page: number = 1,
  perPage: number = 10,
) => {
  const token = await getGithubAccessToken();

  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    direction: "desc",
    visibility: "all",
    page: page,
    per_page: perPage,
  });

  return data;
};
// ============================================
// GETTING REPO HEALTH DATA
// ============================================
export const getRepoHealthData = async (owner: string, repo: string) => {
  console.log(`Fetching health data for: ${owner}/${repo}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  try {
    console.log("Fetching open issues...");
    const { data: openIssuesData } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "open",
      per_page: 1,
    });
    const openIssuesCount = openIssuesData.length;
    console.log(`Open issues: ${openIssuesCount}`);

    console.log("Fetching closed issues...");
    const { data: closedIssuesData } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "closed",
      per_page: 1,
    });

    const closedIssuesCount = closedIssuesData.length;
    console.log(`Closed issues: ${closedIssuesCount}`);
    console.log("Fetching last commit date...");
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    const lastCommitDate = repoData.pushed_at;
    console.log(`Last commit date: ${lastCommitDate}`);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    console.log("Fetching commits from last 60 days...");
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      since: sixtyDaysAgo.toISOString(),
      per_page: 100,
    });
    const commitsLast60Days = commits.length;
    console.log(`Commits in last 60 days: ${commitsLast60Days}`);

    console.log("🔍 Fetching pull requests...");
    const { data: allPRs } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: 100,
    });

    const totalPRs = allPRs.length;
    const mergedPRs = allPRs.filter((pr:any) => pr.merged_at !== null).length;
    const prMergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;

    console.log(`Total PRs: ${totalPRs}, Merged: ${mergedPRs}`);
    console.log(`PR merge rate: ${prMergeRate.toFixed(1)}%`);

    return {
      openIssuesCount,
      closedIssuesCount,
      lastCommitDate,
      commitsLast60Days,
      totalPRs,
      mergedPRs,
      prMergeRate: Math.round(prMergeRate),
    };
  } catch (error) {
    console.error("❌ Error fetching health data:", error);
    throw new Error("Failed to fetch project health data");
  }
};
// ============================================
// GETTING REPO LANGUAGES
// Array of { name, bytes, percentage } sorted by usage
// ============================================
export const getRepoLanguages = async (owner: string, repo: string) => {
  console.log(`Fetching languages for: ${owner}/${repo}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  try {
    console.log("Fetching languages...");
    const { data: languages } = await octokit.rest.repos.listLanguages({
      owner,
      repo,
    });

    console.log("Raw language data:", languages);

    // Calculate total bytes
    const totalBytes = Object.values(languages).reduce(
      (sum, bytes) => sum + bytes,
      0
    );

    // Convert to array with percentages
    const languageData = Object.entries(languages).map(([name, bytes]) => ({
      name,
      bytes,
      percentage: parseFloat(((bytes / totalBytes) * 100).toFixed(2)),
    }));

    // Sort by percentage descending
    languageData.sort((a, b) => b.percentage - a.percentage);

    console.log("Languages with percentages:");
    languageData.forEach((lang) => {
      console.log(`   ${lang.name}: ${lang.percentage}%`);
    });

    return languageData;
  } catch (error) {
    console.error("❌ Error fetching languages:", error);
    throw new Error("Failed to fetch project languages");
  }
};

// ============================================
// GETTING PROJECT README
// ============================================
export const getReadme = async (owner: string, repo: string) => {
  console.log(`Fetching README for: ${owner}/${repo}`);

  const token = await getGithubAccessToken();
  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.rest.repos.getReadme({
      owner,
      repo,
      mediaType: {
        format: "raw",
      },
    });

    console.log("README fetched successfully");
    return data as unknown as string;
  } catch (error) {
    console.error("❌ Error fetching README:", error);
    return null;
  }
};
