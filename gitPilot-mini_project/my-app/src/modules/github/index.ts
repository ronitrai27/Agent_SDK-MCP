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
// ---------------------------------------
// GITHUB TOKEN JUST FOR INNGEST
// -------------------------------------
export async function getUserGithubToken(userId: string) {
  const client = await clerkClient();
  const tokens = await client.users.getUserOauthAccessToken(userId, "github");
  return tokens.data[0]?.token;
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
    const mergedPRs = allPRs.filter((pr: any) => pr.merged_at !== null).length;
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
      0,
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

// =================================
// GETTING REPO ALL FILES (TEXT PART)
// =================================

// export async function getRepoFileContents(
//   owner: string,
//   repo: string,
//   accessToken: string,
//   path: string = "",
// ): Promise<{ path: string; content: string }[]> {
//   const token = accessToken;
//   console.log("Token for file contents: ", token);
//   const octokit = new Octokit({ auth: token });
//   const { data } = await octokit.rest.repos.getContent({
//     owner,
//     repo,
//     path,
//   });

//   // JUST A CHECK
//   if (!Array.isArray(data)) {
//     if (data.type === "file" && data.content) {
//       // Check if file should be included
//       if (shouldIncludeFile(data.path)) {
//         return [
//           {
//             path: data.path,
//             content: Buffer.from(data.content, "base64").toString("utf-8"),
//           },
//         ];
//       }
//     }
//     return [];
//   }

//   let files: { path: string; content: string }[] = [];

//   for (const item of data) {
//     if (item.type === "dir" && shouldSkipDirectory(item.path)) {
//       console.log(`⏭️  Skipping directory: ${item.path}`);
//       continue;
//     }

//     if (item.type === "file") {
//       // Skip excluded files
//       if (!shouldIncludeFile(item.path)) {
//         console.log(`⏭️  Skipping file: ${item.path}`);
//         continue;
//       }

//       const { data: fileData } = await octokit.rest.repos.getContent({
//         owner,
//         repo,
//         path: item.path,
//       });

//       // CHECKING
//       if (
//         !Array.isArray(fileData) &&
//         fileData.type === "file" &&
//         fileData.content
//       ) {
//         files.push({
//           path: item.path,
//           content: Buffer.from(fileData.content, "base64").toString("utf-8"),
//         });
//       }
//     } else if (item.type === "dir") {
//       const subFiles = await getRepoFileContents(
//         owner,
//         repo,
//         accessToken,
//         item.path,
//       );

//       files = files.concat(subFiles);
//     }
//   }

//   return files;
// }

export async function getRepoFileContents(
  owner: string,
  repo: string,
  accessToken: string,
  path: string = "",
): Promise<{ path: string; content: string }[]> {
  const token = accessToken;
  console.log("Token for file contents: ", token);
  const octokit = new Octokit({ auth: token });

  // 🔥 Collect all file paths first (without fetching content)
  const filePaths = await collectFilePaths(octokit, owner, repo, path);
  console.log(`📁 Found ${filePaths.length} files to fetch`);

  // 🔥 Fetch all file contents in parallel
  const files = await fetchFileContentsParallel(
    octokit,
    owner,
    repo,
    filePaths,
  );
  console.log(`✅ Fetched ${files.length} files`);

  return files;
}

// ========== STEP 1: Collect all file paths (fast, no content) ==========
async function collectFilePaths(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string = "",
): Promise<string[]> {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
  });

  // Handle single file
  if (!Array.isArray(data)) {
    if (data.type === "file" && shouldIncludeFile(data.path)) {
      return [data.path];
    }
    return [];
  }

  // 🔥 Process directories in parallel
  const promises = data.map(async (item) => {
    // Skip excluded directories
    if (item.type === "dir" && shouldSkipDirectory(item.path)) {
      console.log(`⏭️  Skipping directory: ${item.path}`);
      return [];
    }

    // Include file if it passes filter
    if (item.type === "file") {
      if (shouldIncludeFile(item.path)) {
        return [item.path];
      } else {
        console.log(`⏭️  Skipping file: ${item.path}`);
        return [];
      }
    }

    // Recursively collect from subdirectories (in parallel)
    if (item.type === "dir") {
      return collectFilePaths(octokit, owner, repo, item.path);
    }

    return [];
  });

  const results = await Promise.all(promises);
  return results.flat();
}

// ========== STEP 2: Fetch file contents in parallel batches ==========
async function fetchFileContentsParallel(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePaths: string[],
): Promise<{ path: string; content: string }[]> {
  const BATCH_SIZE = 20; // 🔥 Fetch 20 files at once
  const files: { path: string; content: string }[] = [];

  for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
    const batch = filePaths.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (filePath) => {
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: filePath,
          });

          if (
            !Array.isArray(fileData) &&
            fileData.type === "file" &&
            fileData.content
          ) {
            return {
              path: filePath,
              content: Buffer.from(fileData.content, "base64").toString(
                "utf-8",
              ),
            };
          }
          return null;
        } catch (error) {
          console.error(`❌ Failed to fetch ${filePath}:`, error);
          return null;
        }
      }),
    );

    // Add successful results
    batchResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        files.push(result.value);
      }
    });

    console.log(
      `📥 Fetched batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(filePaths.length / BATCH_SIZE)} (${files.length}/${filePaths.length} files)`,
    );
  }

  return files;
}

function shouldSkipDirectory(path: string): boolean {
  const excludedDirs = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    "out",
    "coverage",
    ".turbo",
    ".vercel",
    ".cache",
    "public/assets", // Large asset folders
    "public/images",
    ".husky",
    ".vscode",
    ".idea",
  ];

  const dirName = path.split("/").pop() || "";
  return excludedDirs.includes(dirName);
}

function shouldIncludeFile(filePath: string): boolean {
  const fileName = filePath.split("/").pop() || "";

  // Exclude lock files
  const lockFiles = [
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
  ];
  if (lockFiles.includes(fileName)) {
    return false;
  }

  const excludedConfigs = [
    "eslint.config.mjs",
    "eslint.config.js",
    ".eslintrc",
    ".eslintrc.js",
    ".eslintrc.json",
    ".prettierrc",
    ".prettierrc.js",
    ".prettierrc.json",
    "prettier.config.js",
    "next.config.mjs",
    "next.config.ts",
    "next.config.js",
    "components.json",
    "postcss.config.js",
    "postcss.config.mjs",
    ".editorconfig",
    ".nvmrc",
    ".npmrc",
    "vercel.json",
  ];
  if (excludedConfigs.includes(fileName)) {
    return false;
  }

  if (fileName === ".gitignore" || fileName === ".gitattributes") {
    return false;
  }
  if (fileName.match(/^\.env/)) {
    return false;
  }

  if (
    filePath.match(
      /\.(png|jpg|jpeg|gif|ico|svg|webp|bmp|tiff|pdf|zip|tar|gz|rar|7z|exe|dmg|woff|woff2|ttf|eot|mp4|mp3|wav|avi|mov)$/i,
    )
  ) {
    return false;
  }

  if (filePath.endsWith(".map")) {
    return false;
  }

  if (fileName.match(/^LICENSE/i) || fileName.match(/^LICENCE/i)) {
    return false;
  }
  if (fileName.match(/^CHANGELOG/i)) {
    return false;
  }

  // Include everything else (code files)
  return true;
}
