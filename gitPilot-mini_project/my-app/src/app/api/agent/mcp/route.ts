import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { Arcade } from "@arcadeai/arcadejs";
import {
  toZodToolSet,
  executeOrAuthorizeZodTool,
} from "@arcadeai/arcadejs/lib/index";

const config = {
  // Get all tools from these MCP servers
  mcpServers: ["Slack"],
  // Add specific individual tools
  individualTools: ["Gmail_ListEmails", "Gmail_SendEmail", "Gmail_WhoAmI"],
  // Maximum tools to fetch per MCP server
  toolLimit: 30,
  // System prompt defining the assistant's behavior
  systemPrompt: `You are a helpful assistant that can access Gmail and Slack.
Always use the available tools to fulfill user requests. Do not tell users to authorize manually - just call the tool and the system will handle authorization if needed.
 
For Gmail:
- To find sent emails, use the query parameter with "in:sent"
- To find received emails, use "in:inbox" or no query
 
After completing any action (sending emails, Slack messages, etc.), always confirm what you did with specific details.
 
IMPORTANT: When calling tools, if an argument is optional, do not set it. Never pass null for optional parameters.`,
};
// Strip null and undefined values from tool inputs
// Some LLMs send null for optional params, which can cause tool failures
function stripNullValues(
  obj: Record<string, unknown>
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
function toVercelTools(arcadeTools: Record<string, unknown>): Record<string, unknown> {
  const vercelTools: Record<string, unknown> = {};
 
  for (const [name, tool] of Object.entries(arcadeTools)) {
    const t = tool as { description: string; parameters: unknown; execute: Function; };
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
 
async function getArcadeTools(userId: string) {
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
    config.individualTools.map((toolName) => arcade.tools.get(toolName))
  );
 
  // Combine and deduplicate
  const allTools = [...mcpServerTools.flat(), ...individualToolDefs];
  const uniqueTools = Array.from(
    new Map(allTools.map((tool) => [tool.qualified_name, tool])).values()
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

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userId = process.env.ARCADE_USER_ID || "default-user";
 
    const tools = await getArcadeTools(userId);
 
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: config.systemPrompt,
      messages: await convertToModelMessages(messages),
    //   @ts-ignore
      tools,
      stopWhen: stepCountIs(5),
    });
 
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}