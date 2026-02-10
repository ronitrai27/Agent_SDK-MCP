import { pineconeIndex } from "@/lib/pinecone";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

interface FileItem {
  path: string; // File path (e.g. src/app/page.tsx)
  content: string; // Full file content as string
}

type batch = {
  id: string;
  values: number[];
  metadata: {
    repoId: string;
    path: string;
    content: string;
  };
};

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embeddingModel("gemini-embedding-001"),
    value: text,
  });

  return embedding;
}

export async function indexCodebase(
  repoId: string,
  files: FileItem[],
): Promise<void> {
  const vectors = [];

  for (const file of files) {
    const content = `File ${file.path}:\n\n${file.content}`;
    const truncatedContent = content.substring(0, 8000);

    try {
      const embedding = await generateEmbedding(truncatedContent);

      vectors.push({
        id: `${repoId}-${file.path.replace(/\//g, "_")}`,

        values: embedding,
        metadata: {
          repoId, // Repository identifier
          path: file.path, // Original file path
          content: truncatedContent,
        },
      });
    } catch (error) {
      console.error(`Failed to generate embedding for ${file.path}:`, error);
    }
  }
  if (vectors.length > 0) {
    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      console.log(`Indexing ${batch.length} vectors...`);

      // await pineconeIndex.upsert(batch);
      // THIS IS THE KEY CHANGE FOR v7.0.0+
      await pineconeIndex.upsert({ records: batch });
    }
  }
}
