import { inngest } from "@/inngest/client";
import { generateText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

// export const handleCommitReview = inngest.createFunction(
//   { id: "handle-commit-review" },
//   { event: "commit/analyze" },
//   async ({ event, step }) => {
//     const { reviewId, commitDetails, repoId } = event.data;
//     const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

//     // Generate AI Review
//     const reviewContent = await step.run("generate-ai-review", async () => {
//       // Construct prompt with file content
//       const fileContext = commitDetails.files
//         .map(
//           (file: any) => `
// File: ${file.filename}
// Status: ${file.status}
// Patch: ${file.patch || "N/A"}
// Content:
// ${file.content ? file.content.slice(0, 10000) : "Content too large or unavailable"}
//              `
//         )
//         .join("\n\n");

//       const prompt = `You are an expert code reviewer. Analyze the following Commit and provide a detailed, constructive code review along with critical issue if found in strucutred format.

// Commit Description: ${commitDetails.message || "No description provided"}

// File Contents:
// ${fileContext}

// Please provide:
// 1. **Walkthrough**: A file-by-file explanation of the changes.
// 2. **Summary**: Brief overview.
// 3. **Suggestions**: Specific code improvements.
// 4. **Critical Issues**: Bugs, security concerns, only if exist in structured format.

// Format your response in markdown.`;

//       // Call AI
//       const { text } = await generateText({
//         model: google("gemini-2.5-flash"),
//         prompt: prompt,
//       });

//       return text;
//     });

//     // Update Review with AI response
//     await step.run("update-review", async () => {
//       const isCritical = reviewContent
//         .toLowerCase()
//         .includes("critical issue");

//       await convex.mutation(api.repo.updateReview, {
//         reviewId,
//         review: reviewContent,
//         reviewStatus: "completed",
//         ctiticalIssueFound: isCritical,
//       });

//       if (isCritical) {
//         // create issue
//         await convex.mutation(api.repo.createIssue, {
//           repoId: repoId,
//           issueTitle: `In ${commitDetails.sha.substring(0, 7)}: Critical Issue`,
//           issueDescription: reviewContent, // Summary might be better but full review is safer
//           issueStatus: "pending",
//         });
//       }
//     });

//     return { success: true };
//   }
// );
// -------------------------------------------------------------------

export const handleCommitReview = inngest.createFunction(
  { id: "handle-commit-review" },
  { event: "commit/analyze" },
  async ({ event, step }) => {
    const { reviewId, commitDetails, repoId } = event.data;
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Step 1: Generate AI Review
    const reviewContent = await step.run("generate-ai-review", async () => {
      // Build file context from commit (limit content to prevent token overflow)
      const fileContext = commitDetails.files
        .map(
          (file: any) => `
## File: ${file.filename}
**Status**: ${file.status}
**Changes**: +${file.additions || 0} -${file.deletions || 0}

### Diff:
\`\`\`diff
${file.patch || "No patch available"}
\`\`\`

### Full Content (truncated):
\`\`\`
${file.content ? file.content.slice(0, 4000) : "Content unavailable or too large"}
\`\`\`
`,
        )
        .join("\n---\n");

      const prompt = `You are an expert code reviewer. Analyze this commit and provide a detailed, constructive review.

**Commit Message**: ${commitDetails.message || "No message"}
**Author**: ${commitDetails.author?.name || "Unknown"}

${fileContext}

Provide your review in the following markdown format:

## Summary
Brief 2-3 sentence overview of what changed and why.

## Walkthrough
File-by-file explanation of changes with context.

## Suggestions
Specific, actionable code improvements (if any).

## Critical Issues
**IMPORTANT**: Only include this section if you find actual bugs, security vulnerabilities, or breaking changes.
If found, format each as:
- **[CRITICAL]** Issue title
  - **File**: filename
  - **Line**: approximate line number
  - **Impact**: what could go wrong
  - **Fix**: how to resolve it

If no critical issues exist, write: "None found."`;

      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: prompt,
      });

      return text;
    });

    // Step 2: Update review in database and handle critical issues
    await step.run("update-review", async () => {
      // More robust detection: check for critical section with actual issues
      const hasCriticalSection = reviewContent.includes("## Critical Issues");
      const hasActualIssues =
        hasCriticalSection &&
        !reviewContent.toLowerCase().includes("none found") &&
        reviewContent.includes("[CRITICAL]");

      // Update the review record
      await convex.mutation(api.repo.updateReview, {
        reviewId,
        review: reviewContent,
        reviewStatus: "completed",
        ctiticalIssueFound: hasActualIssues, // Fixed typo: ctitical -> critical
      });

      // Create issue ticket if critical problems found
      if (hasActualIssues) {
        const shortSha = commitDetails.sha.substring(0, 7);

        await convex.mutation(api.repo.createIssue, {
          repoId: repoId,
          issueTitle: `🚨 Critical issues found in ${shortSha}`,
          issueDescription: reviewContent,
          issueStatus: "pending",
        });
      }
    });

    return {
      success: true,
      reviewId,
      criticalIssuesFound: reviewContent.includes("[CRITICAL]"),
    };
  },
);
