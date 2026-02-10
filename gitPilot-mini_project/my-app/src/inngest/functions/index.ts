import { inngest } from "@/inngest/client";
import { getRepoFileContents, getUserGithubToken } from "@/modules/github";
import { indexCodebase } from "@/modules/pinecone";

export const indexRepo = inngest.createFunction(
  { id: "index-repo" },
  { event: "repository-connected" },

  async ({ event, step }) => {
    const { owner, repo, userId } = event.data;

    //=========== FILES =============
    const files = await step.run("fetch-files", async () => {
      const token = await getUserGithubToken(userId);
      console.log("Token fetched in Inggest Function..");
      return await getRepoFileContents(owner, repo, token);
    });

    await step.run("index-codebase", async () => {
      await indexCodebase(`${owner}/${repo}`, files);
    });

    return { success: true, indexedFiles: files.length };
  },
);
