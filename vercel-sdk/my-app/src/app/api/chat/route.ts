// =======================================
// OPEN GENERATE TEXT
// =======================================

// import { openai } from '@ai-sdk/openai';
// import { generateText } from 'ai';

// export async function POST(req: Request) {
//   try {
//     const { prompt } = await req.json();

//     console.log("Prompt received at server:", prompt);

//     const { text } = await generateText({
//       model: openai('gpt-4-turbo'),
//       prompt,
//     });

//     return Response.json({ text });
//   } catch (error) {
//     console.error('Error:', error);
//     return Response.json({ error: 'Failed to generate response' }, { status: 500 });
//   }
// }
// ====================================
// GEMINI GENERATE TEXT
// ====================================
// import { google } from "@ai-sdk/google";
// import { generateText } from 'ai';

// export async function POST(req: Request) {
//   try {
//     const { prompt } = await req.json();

//     console.log("Prompt received at server (GEMINI):", prompt);

//     const { text } = await generateText({
//       model: google('gemini-2.5-flash'),
//       system:
//     'You are a professional content writer. ' +
//     'You need to Highligh heavy tasks , bold important points and make sure that the content is easily digestible and easy to understand.',
//       prompt,
//     });

//     return Response.json({ text });
//   } catch (error) {
//     console.error('Error:', error);
//     return Response.json({ error: 'Failed to generate response' }, { status: 500 });
//   }
// }
// =====================================
// STREAM GEMINI TEXT
//  =====================================

import { google } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log("Messages received at server (GEMINI):", messages);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system:
        "You are a professional content writer. " +
        "You need to highlight heavy tasks, bold important points and make sure that the content is easily digestible and easy to understand.",
      messages: await convertToModelMessages(messages),
    });

   return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
