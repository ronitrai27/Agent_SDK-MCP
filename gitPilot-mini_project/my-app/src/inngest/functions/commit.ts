import { inngest } from "@/inngest/client";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { z } from "zod";

const ReviewSchema = z.object({
  summary: z.string().describe("2-3 sentence overview of changes"),
  walkthrough: z.array(
    z.object({
      filename: z.string(),
      changes: z
        .string()
        .describe("Brief explanation of what changed in concise manner."),
    }),
  ),
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
      "Only the most critical issue if found, otherwise undefined (eg - code syntax error , major bug , APi keys in code etc)",
    ),
});

export const handleCommitReview = inngest.createFunction(
  { id: "handle-commit-review" },
  { event: "commit/analyze" },
  async ({ event, step }) => {
    const { reviewId, commitDetails, repoId } = event.data;
    console.log("commit details: ", commitDetails);
    console.log("commit details author: ", commitDetails.author.name);
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Step 1: Generate AI Review
    const reviewContent = await step.run("generate-ai-review", async () => {
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

      const { output } = await generateText({
        model: google("gemini-2.5-flash"),
        output: Output.object({
          schema: z.object({
            review: ReviewSchema,
          }),
        }),
        prompt: `You are an expert code reviewer. Analyze this commit and provide a concise review in MARKDOWN format.

**Commit Message**: ${commitDetails.message || "No message"}

${fileContext}

Provide:
1. **summary**: Brief 2-3 sentence overview of what changed and why
2. **walkthrough**: Array of file-by-file explanations with context (keep it short)
3. **criticalIssue**: ONLY the most important BUG (or other major bugs), security vulnerability, or breaking change
   - Only include if there's a MAJOR issue that needs immediate attention (eg - code syntax error , major bug , APi keys in code etc)
   - Ignore minor issues, style problems, or suggestions
   - Leave undefined if no critical issue exists
   - Must have: title, file, line (optional), description, and fix
   - Must be respond in markdown format`,
      });

      return output.review;
    });

    // Step 2: Update review in database and handle critical issues
    await step.run("update-review", async () => {
      const hasActualIssue = reviewContent.criticalIssue !== undefined;

      // Format review as markdown
      let markdownReview = `## Summary\n${reviewContent.summary}\n\n`;

      markdownReview += `## Walkthrough\n`;
      reviewContent.walkthrough.forEach((w) => {
        markdownReview += `### ${w.filename}\n${w.changes}\n\n`;
      });

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

      if (hasActualIssue) {
        const shortSha = commitDetails.sha.substring(0, 7);
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
          issueTitle: `Critical issue in ${shortSha}: ${issue.title}`,
          issueDescription: issueMarkdown,
          issueStatus: "pending",
        });
      }
    });

    // Next step to:do send email if found critical issue!

    return {
      success: true,
      reviewId,
    };
  },
);
