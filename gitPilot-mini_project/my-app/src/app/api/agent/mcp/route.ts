import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { getArcadeTools } from "@/lib/arcade-tools";

// const config = {
//   // Get all tools from these MCP servers
//   mcpServers: ["Slack"],
//   // Add specific individual tools
//   individualTools: ["Gmail_ListEmails", "Gmail_SendEmail", "Gmail_WhoAmI"],
//   // Maximum tools to fetch per MCP server
//   toolLimit: 30,
//   // System prompt defining the assistant's behavior
//   systemPrompt: `You are a helpful assistant that can access Gmail and Slack.
// Always use the available tools to fulfill user requests. Do not tell users to authorize manually - just call the tool and the system will handle authorization if needed.

// For Gmail:
// - To find sent emails, use the query parameter with "in:sent"
// - To find received emails, use "in:inbox" or no query

// After completing any action (sending emails, Slack messages, etc.), always confirm what you did with specific details.

// IMPORTANT: When calling tools, if an argument is optional, do not set it. Never pass null for optional parameters.`,
// };

// ==============================================================
// =================NOTION TOOLKIT=================================
// ================================================================
// const config = {
//   mcpServers: ["NotionToolkit"],
//   individualTools: [
//     "NotionToolkit.CreatePage",
//     "NotionToolkit.AppendContentToEndOfPage",
//     "NotionToolkit.GetPageContentByTitle",
//     "NotionToolkit.SearchByTitle",
//     "NotionToolkit.WhoAmI",
//   ],
//   toolLimit: 30,
//   systemPrompt: `You are a helpful assistant that can access Notion.
// Always use the available tools to fulfill user requests.
// ...`,
// };

// -------------------------------------------------

// const config = {
//   mcpServers: ["GoogleDocs", "NotionToolkit"],
//   individualTools: [],  // mcpServers already pulls all tools from each toolkit
//   toolLimit: 30,
//   systemPrompt: `You are a helpful assistant that can access Google Docs and Notion.
// Always use the available tools to fulfill user requests.
// ...`,
// };

const systemPrompt = `You are a helpful assistant that can access Google Docs.
Always use the available tools to fulfill user requests.
...`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userId = process.env.ARCADE_USER_ID || "default-user";

    const tools = await getArcadeTools(userId);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
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
      { status: 500 },
    );
  }
}
