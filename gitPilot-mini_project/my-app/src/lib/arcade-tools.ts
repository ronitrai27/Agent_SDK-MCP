import { Arcade } from "@arcadeai/arcadejs";
import {
  toZodToolSet,
  executeOrAuthorizeZodTool,
} from "@arcadeai/arcadejs/lib/index";

// ================================================================
// =================GOOGLE DOCS TOOLKIT============================
// ================================================================
const config = {
  mcpServers: ["GoogleDocs"],
  individualTools: [
    "GoogleDocs.CreateDocumentFromText",
    "GoogleDocs.EditDocument",
    "GoogleDocs.InsertTextAtEndOfDocument",
    "GoogleDocs.SearchDocuments",
    "GoogleDocs.GetDocumentById",
    "GoogleDocs.WhoAmI",
  ],
  toolLimit: 30,
};

// Strip null and undefined values from tool inputs
// Some LLMs send null for optional params, which can cause tool failures
function stripNullValues(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// Adapter to convert Arcade tools to Vercel AI SDK v6 format
function toVercelTools(
  arcadeTools: Record<string, unknown>,
): Record<string, unknown> {
  const vercelTools: Record<string, unknown> = {};

  for (const [name, tool] of Object.entries(arcadeTools)) {
    const t = tool as {
      description: string;
      parameters: unknown;
      execute: Function;
    };
    vercelTools[name] = {
      description: t.description,
      inputSchema: t.parameters, // AI SDK v6 uses inputSchema, not parameters
      execute: async (input: Record<string, unknown>) => {
        const cleanedInput = stripNullValues(input);
        return t.execute(cleanedInput);
      },
    };
  }

  return vercelTools;
}

export async function getArcadeTools(userId: string) {
  const arcade = new Arcade();

  // Fetch tools from MCP servers
  const mcpServerTools = await Promise.all(
    config.mcpServers.map(async (serverName) => {
      const response = await arcade.tools.list({
        toolkit: serverName,
        limit: config.toolLimit,
      });
      return response.items;
    }),
  );

  // Fetch individual tools
  const individualToolDefs = await Promise.all(
    config.individualTools.map((toolName) => arcade.tools.get(toolName)),
  );

  // Combine and deduplicate
  const allTools = [...mcpServerTools.flat(), ...individualToolDefs];
  const uniqueTools = Array.from(
    new Map(allTools.map((tool) => [tool.qualified_name, tool])).values(),
  );

  // Convert to Arcade's Zod format, then adapt for Vercel AI SDK
  const arcadeTools = toZodToolSet({
    tools: uniqueTools,
    client: arcade,
    userId,
    executeFactory: executeOrAuthorizeZodTool,
  });

  return toVercelTools(arcadeTools);
}
