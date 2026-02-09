import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { streamText, Message } from 'ai';
import { getPromptPartDefinition } from '@/modules/agent/agent/shared/types/PromptPart';
import { PromptPart } from '@/modules/agent/agent/shared/types/PromptPart';

export async function POST(req: Request) {
  const { parts, provider } = await req.json();

  const modelProvider = provider === 'openai' ? openai('gpt-4o') : google('gemini-1.5-pro');

  // Build messages from parts
  const messages: any[] = [];
  const systemPromptParts: string[] = [];

  // Sort parts by priority
  const sortedParts = [...parts].sort((a: any, b: any) => {
    const defA = getPromptPartDefinition(a.type);
    const defB = getPromptPartDefinition(b.type);
    return (defA.priority ?? 0) - (defB.priority ?? 0);
  });

  for (const part of sortedParts) {
    const definition = getPromptPartDefinition(part.type);
    
    if (definition.buildMessages) {
      const partMessages = definition.buildMessages(part);
      messages.push(...partMessages);
    } else if (definition.buildContent) {
      const content = definition.buildContent(part);
      if (content.length > 0) {
        systemPromptParts.push(...content);
      }
    }
  }

  // Prepend a base system prompt instructions
  const baseInstructions = `
You are an AI assistant that can manipulate a tldraw canvas.
You must output actions in a JSON format.
Example:
{
  "actions": [
    { "_type": "message", "text": "I am creating a circle." },
    { "_type": "create", "shape": { "type": "geo", "x": 100, "y": 100, "props": { "geo": "ellipse", "w": 100, "h": 100 } } }
  ]
}

IMPORTANT: Output ONLY the JSON object.
`;

  const finalSystemPrompt = [baseInstructions, ...systemPromptParts].join('\n\n');

  // Convert AgentMessages to ai-sdk Messages if needed
  // In tldraw-agent, AgentMessage has { role, content: [{ type, text }] }
  const formattedMessages: Message[] = messages.map(m => ({
    role: m.role as any,
    content: m.content.map((c: any) => c.text).join('\n')
  }));

  const result = await streamText({
    model: modelProvider,
    system: finalSystemPrompt,
    messages: formattedMessages,
  });

  return result.toTextStreamResponse();
}
