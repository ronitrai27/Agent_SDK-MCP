import { inngest } from "@/inngest/client";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { z } from "zod";
import { getPullReqDiff } from "@/modules/github";
import { retrieveContext } from "@/modules/pinecone";

const ReviewSchema = z.object({
  summary: z.string().describe("2-3 sentence overview of changes"),
  walkthrough: z.array(
    z.object({
      filename: z.string(),
      changes: z
        .string()
        .describe("Brief explanation of what changed in files in a concise manner."),
    }),
  ),
  sequenceDiagram: z
    .string()
    .describe("Mermaid sequence diagram visualizing the flow of changes (if applicable)."),
  criticalIssue: z
    .object({
      title: z.string(),
      file: z.string(),
      line: z.number().optional(),
      description: z.string(),
      fix: z.string(),
    })
    .optional()
    .describe(
      "Only the most critical issue if found, otherwise undefined (eg - code syntax error, major bug, API keys in code etc)",
    ),
});

export const handlePrReview = inngest.createFunction(
  { id: "handle-pr-review" },
  { event: "pr/analyse" },
  async ({ event, step }) => {
    const { reviewId, prNumber, owner, repoName, token, repoId } = event.data;
    console.log(`PR Review - PR #${prNumber} in ${owner}/${repoName}`);
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Step 1: Get Pull Request Diff
    const prDiff = await step.run("get-pr-diff", async () => {
      console.log("Fetching PR diff...");
      const diff = await getPullReqDiff(token, owner, repoName, prNumber);
      console.log("PR diff fetched successfully");
      return diff;
    });

    // Step 2: Retrieve relevant context from Pinecone
    const context = await step.run("retrieve-context", async () => {
      console.log("Retrieving context from Pinecone...");
      const query = `${prDiff.title}\n\n${prDiff.description}\n\n${prDiff.diff.slice(0, 2000)}`;
      const contextResults = await retrieveContext(query, 5);
      console.log(`Retrieved ${contextResults.length} context chunks`);
      return contextResults;
    });

    // Step 3: Generate AI Review
    const reviewContent = await step.run("generate-ai-review", async () => {
      const contextSection = context.length > 0
        ? `## Related Codebase Context:\n${context.join("\n\n---\n\n")}`
        : "";

      const { output } = await generateText({
        model: google("gemini-2.5-flash"),
        output: Output.object({
          schema: z.object({
            review: ReviewSchema,
          }),
        }),
        prompt: `You are an expert code reviewer. Analyze this pull request and provide a comprehensive review in MARKDOWN format.

**PR Title**: ${prDiff.title}

**PR Description**: 
${prDiff.description || "No description provided"}

**Changes (Diff)**:
\`\`\`diff
${prDiff.diff.slice(0, 8000)}
\`\`\`

${contextSection}

Provide:
1. **summary**: Brief 2-3 sentence overview of what changed and the impact
2. **walkthrough**: Array of key changes with explanations (focus on important changes)
3. **sequenceDiagram**: A Mermaid sequence diagram showing the flow of changes (if applicable). Use simple syntax, avoid special characters in labels.
4. **criticalIssue**: ONLY the most critical bug, security vulnerability, or breaking change
   - Only include if there's a MAJOR issue (syntax error, security flaw, API keys exposed, etc.)
   - Ignore minor issues or style problems
   - Leave undefined if no critical issue exists
   - Must be in markdown format`,
      });

      return output.review;
    });

    // Step 4: Update review in database and handle critical issues
    await step.run("update-review", async () => {
      const hasActualIssue = reviewContent.criticalIssue !== undefined;

      // Format review as markdown
      let markdownReview = `## Summary\n${reviewContent.summary}\n\n`;

      markdownReview += `## Walkthrough\n`;
      reviewContent.walkthrough.forEach((w) => {
        markdownReview += `### ${w.filename}\n${w.changes}\n\n`;
      });

      // Add sequence diagram if present
      if (reviewContent.sequenceDiagram) {
        markdownReview += `## Sequence Diagram\n\`\`\`mermaid\n${reviewContent.sequenceDiagram}\n\`\`\`\n\n`;
      }

      markdownReview += `## Critical Issue\n`;
      if (!hasActualIssue) {
        markdownReview += `None found.\n`;
      } else {
        const issue = reviewContent.criticalIssue!;
        markdownReview += `**${issue.title}**\n\n`;
        markdownReview += `- **File**: ${issue.file}\n`;
        if (issue.line) markdownReview += `- **Line**: ${issue.line}\n`;
        markdownReview += `- **Description**: ${issue.description}\n`;
        markdownReview += `- **Fix**: ${issue.fix}\n`;
      }

      await convex.mutation(api.repo.updateReview, {
        reviewId,
        review: markdownReview,
        reviewStatus: "completed",
        ctiticalIssueFound: hasActualIssue,
      });

      // Create issue if critical bug found
      if (hasActualIssue) {
        const issue = reviewContent.criticalIssue!;

        const issueMarkdown = `# ${issue.title}

**File**: ${issue.file}
${issue.line ? `**Line**: ${issue.line}` : ""}

## Description
${issue.description}

## Fix
${issue.fix}`;

        await convex.mutation(api.repo.createIssue, {
          repoId: repoId,
          issueTitle: `Critical issue in PR #${prNumber}: ${issue.title}`,
          issueDescription: issueMarkdown,
          issueStatus: "pending",
        });
      }
    });

    return {
      success: true,
      reviewId,
    };
  }
);