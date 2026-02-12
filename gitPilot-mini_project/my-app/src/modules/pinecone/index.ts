// import { pineconeIndex } from "@/lib/pinecone";
// import { embed } from "ai";
// import { google } from "@ai-sdk/google";

// interface FileItem {
//   path: string; // File path (e.g. src/app/page.tsx)
//   content: string; // Full file content as string
// }

// type batch = {
//   id: string;
//   values: number[];
//   metadata: {
//     repoId: string;
//     path: string;
//     content: string;
//   };
// };

// export async function generateEmbedding(text: string): Promise<number[]> {
//   const { embedding } = await embed({
//     model: google.embeddingModel("gemini-embedding-001"),
//     value: text,
//   });

//   return embedding;
// }

// export async function indexCodebase(
//   repoId: string,
//   files: FileItem[],
// ): Promise<void> {
//   const vectors = [];

//   for (const file of files) {
//     const content = `File ${file.path}:\n\n${file.content}`;
//     const truncatedContent = content.substring(0, 8000);

//     try {
//       const embedding = await generateEmbedding(truncatedContent);

//       vectors.push({
//         id: `${repoId}-${file.path.replace(/\//g, "_")}`,

//         values: embedding,
//         metadata: {
//           repoId, // Repository identifier
//           path: file.path, // Original file path
//           content: truncatedContent,
//         },
//       });
//     } catch (error) {
//       console.error(`Failed to generate embedding for ${file.path}:`, error);
//     }
//   }
//   if (vectors.length > 0) {
//     const batchSize = 100;

//     for (let i = 0; i < vectors.length; i += batchSize) {
//       const batch = vectors.slice(i, i + batchSize);

//       console.log(`Indexing ${batch.length} vectors...`);

//       // await pineconeIndex.upsert(batch);
//       // THIS IS THE KEY CHANGE FOR v7.0.0+
//       await pineconeIndex.upsert({ records: batch });
//     }
//   }
// }

import { pineconeIndex } from "@/lib/pinecone";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

interface FileItem {
  path: string;
  content: string;
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

// ========== CONFIG ==========
const MAX_CHUNK_SIZE = 4000;
const EMBEDDING_CONCURRENCY = 10; // Parallel requests (adjust based on API limits)
const UPSERT_BATCH_SIZE = 100;

// ========== SMART CHUNKING ==========
function smartChunk(file: FileItem): string[] {
  const { path, content } = file;

  // Small files - return as-is
  if (content.length <= MAX_CHUNK_SIZE) {
    return [`File: ${path}\n\n${content}`];
  }

  // Large files - chunk intelligently
  const chunks: string[] = [];
  const lines = content.split("\n");
  let currentChunk = `File: ${path}\n\n`;
  let isFirstChunk = true;

  for (const line of lines) {
    if (!isFirstChunk) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("import ") ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*")
      ) {
        continue;
      }
    }

    if ((currentChunk + line).length > MAX_CHUNK_SIZE) {
      chunks.push(currentChunk.trim());
      currentChunk = `File: ${path} (part ${chunks.length + 1})\n\n${line}\n`;
      isFirstChunk = false;
    } else {
      currentChunk += line + "\n";
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks.slice(0, 3);
}

// ========== PARALLEL EMBEDDING ==========
async function generateEmbeddingsBatch(
  texts: string[],
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = [];

  // Process in batches of EMBEDDING_CONCURRENCY
  for (let i = 0; i < texts.length; i += EMBEDDING_CONCURRENCY) {
    const batch = texts.slice(i, i + EMBEDDING_CONCURRENCY);

    const batchResults = await Promise.all(
      batch.map(async (text) => {
        try {
          const { embedding } = await embed({
            model: google.embeddingModel("gemini-embedding-001"),
            value: text,
          });
          return embedding;
        } catch (error) {
          console.error("Embedding failed:", error);
          return null;
        }
      }),
    );

    results.push(...batchResults);

    // Progress log
    console.log(
      `Embedded ${Math.min(i + EMBEDDING_CONCURRENCY, texts.length)}/${texts.length}`,
    );
  }

  return results;
}

// ========== MAIN INDEXING ==========
export async function indexCodebase(
  repoId: string,
  files: FileItem[],
): Promise<void> {
  console.time("⏱️ Total indexing time");

  // 1. Smart chunk all files
  const allChunks: { chunk: string; path: string; index: number }[] = [];

  for (const file of files) {
    const chunks = smartChunk(file);
    chunks.forEach((chunk, i) => {
      allChunks.push({ chunk, path: file.path, index: i });
    });
  }

  console.log(
    `📦 Created ${allChunks.length} chunks from ${files.length} files`,
  );

  // Generate embeddings in parallel (KEY SPEEDUP )
  console.log("🚀 Generating embeddings in parallel...");
  const embeddings = await generateEmbeddingsBatch(
    allChunks.map((c) => c.chunk),
  );

  //  Prepare vectors (filter out failed embeddings)
  const vectors = allChunks
    .map((chunk, i) => {
      if (!embeddings[i]) return null;

      return {
        id: `${repoId}-${chunk.path.replace(/\//g, "_")}-${chunk.index}`,
        values: embeddings[i]!,
        metadata: {
          repoId,
          path: chunk.path,
          content: chunk.chunk,
        },
      };
    })
    .filter((v) => v !== null) as batch[];

  console.log(`✅ Generated ${vectors.length} vectors`);

  //  Batch upsert to Pinecone
  if (vectors.length > 0) {
    for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
      const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
      await pineconeIndex.upsert({ records: batch });
      console.log(
        `📤 Upserted batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(vectors.length / UPSERT_BATCH_SIZE)}`,
      );
    }
  }

  console.timeEnd("⏱️ Total indexing time");
}

//=========== Generating simple text embedding.===========
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: google.embeddingModel("gemini-embedding-001"),
    value: text,
  });

  return embedding;
}

//=========== Retrieving context from Pinecone.===========
export async function retrieveContext(query: string, topK: number = 5) {
  const embeddings = await generateEmbedding(query);

  const result = await pineconeIndex.query({
    vector: embeddings,
    topK,
    includeMetadata: true,
  });

  console.log("Results found while retrieving context:", result);

  return result.matches
    .map((match) => match.metadata?.content as string)
    .filter(Boolean);
}
