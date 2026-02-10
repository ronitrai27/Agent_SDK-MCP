import { inngest } from "@/inngest/client";
import { getRepoFileContents, getUserGithubToken } from "@/modules/github";
import { indexCodebase } from "@/modules/pinecone";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export const indexRepo = inngest.createFunction(
  { id: "index-repo" },
  { 
    event: "repository-connected",
    onFailure: async ({ event, error }: { event: any; error: any }) => {
      const { owner, repo } = event.data.event.data;
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      console.error(`Indexing failed for ${owner}/${repo}:`, error);
      await convex.mutation(api.repo.updateRepoStatus, {
        repoOwner: owner,
        repoName: repo,
        status: "failed",
      });
    }
  },

  async ({ event, step }) => {
    const { owner, repo, userId } = event.data;
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    //=========== FILES =============
    const files = await step.run("fetch-files", async () => {
      const token = await getUserGithubToken(userId);
      console.log("Token fetched in Inggest Function..");
      return await getRepoFileContents(owner, repo, token);
    });

    await step.run("index-codebase", async () => {
      await indexCodebase(`${owner}/${repo}`, files);
    });
    
    await step.run("update-status-completed", async () => {
        await convex.mutation(api.repo.updateRepoStatus, {
          repoOwner: owner,
          repoName: repo,
          status: "completed"
        });
    });

    return { success: true, indexedFiles: files.length };
  },
);
