import { inngest } from "@/inngest/client";
import { getRepoFileContents } from "@/modules/github";
import { indexCodebase } from "@/modules/pinecone";

export const indexRepo = inngest.createFunction(
  { id: "index-repo" },
  { event: "connect-repo" },

  async ({ event, step }) => {
    const { owner, repo } = event.data;

    //=========== FILES =============
    const files = await step.run("fetch-files", async () => {
      return await getRepoFileContents(owner, repo);
    });

    await step.run("index-codebase", async () => {
      await indexCodebase(`${owner}/${repo}`, files);
    });

    return { success: true, indexedFiles: files.length };
  },
);
