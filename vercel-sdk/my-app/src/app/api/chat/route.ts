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
// ===========================================
// TOOLS AND AGENTS
// ===========================================
// import { google } from "@ai-sdk/google";
// import { streamText, convertToModelMessages } from "ai";
// import { z } from "zod";

// export const maxDuration = 30;

// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();

//     console.log("Messages received at server (GEMINI):", messages);

//     const result = streamText({
//       model: google("gemini-2.5-flash"),
//       system:
//         "You are a professional content writer and assistant. " +
//         "You need to highlight heavy tasks, bold important points and make sure that the content is easily digestible and easy to understand. " +
//         "When user asks you to send an email, use the sendEmail tool and wait for confirmation.",
//       messages: await convertToModelMessages(messages),
//       tools: {
//         // Interactive tool - requires user confirmation
//         sendEmail: {
//           description:
//             "Send an email to a recipient. Always ask for user confirmation before sending.",
//           inputSchema: z.object({
//             to: z.string().describe("Recipient email address"),
//             subject: z.string().describe("Email subject"),
//             body: z.string().describe("Email body content"),
//           }),
//           // NO execute function - this makes it a client-side interactive tool
//         },
//       },
//     });

//     return result.toUIMessageStreamResponse();
//   } catch (error) {
//     console.error("Error:", error);
//     return Response.json(
//       { error: "Failed to generate response" },
//       { status: 500 }
//     );
//   }
// }

// ======================================
// MULTIPLE TOOLS AND PERMISSIONS
// ======================================
// import { google } from "@ai-sdk/google";
// import { streamText, convertToModelMessages } from "ai";
// import { z } from "zod";
// import { Resend } from "resend";

// export const maxDuration = 30;

// // Initialize Resend
// const resend = new Resend(process.env.RESEND_API_KEY);
// const employeeDatabase = [
//   {
//     id: 1,
//     name: "John Smith",
//     position: "Senior Developer",
//     wifeNumber: "+1-555-0101",
//   },
//   {
//     id: 2,
//     name: "Sarah Johnson",
//     position: "Product Manager",
//     wifeNumber: "+1-555-0102",
//   },
//   {
//     id: 3,
//     name: "Michael Chen",
//     position: "UX Designer",
//     wifeNumber: "+1-555-0103",
//   },
//   {
//     id: 4,
//     name: "Emily Davis",
//     position: "Data Analyst",
//     wifeNumber: "+1-555-0104",
//   },
//   {
//     id: 5,
//     name: "Robert Wilson",
//     position: "DevOps Engineer",
//     wifeNumber: "+1-555-0105",
//   },
// ];

// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();

//     console.log("Messages received at server (GEMINI):", messages);

//     const result = streamText({
//       model: google("gemini-2.5-flash"),
//       system:
//         "You are a professional Assistant. " +
//         "You can help with: " +
//         "1. Sending emails (always ask for user confirmation first) " +
//         "2. Looking up employee wife's contact numbers from the company database " +
//         "Always be professional and ensure data privacy.",
//       messages: await convertToModelMessages(messages),
//       tools: {
//         // Interactive tool - requires user confirmation before sending email
//         sendEmail: {
//           description:
//             "Send an email to a recipient using Resend. Always ask for user confirmation before sending.",
//           inputSchema: z.object({
//             to: z.string().email().describe("Recipient email address"),
//             subject: z.string().describe("Email subject"),
//             body: z.string().describe("Email body content"),
//           }),
//           execute: async ({ to, subject, body }) => {
//             try {
//               console.log("Attempting to send email to:", to);

//               const { data, error } = await resend.emails.send({
//                 from: "onboarding@resend.dev", 
//                 to: to,
//                 subject: subject,
//                 html: `
//                   <div style="font-family: Arial, sans-serif; padding: 20px;">
//                     <h2 style="color: #333;">${subject}</h2>
//                     <div style="line-height: 1.6; color: #666;">
//                       ${body.replace(/\n/g, "<br>")}
//                     </div>
//                     <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
//                     <p style="color: #999; font-size: 12px;">
//                       Sent via AI Assistant
//                     </p>
//                   </div>
//                 `,
//               });

//               if (error) {
//                 console.error("Resend error:", error);
//                 return {
//                   success: false,
//                   message: `Failed to send email: ${error.message}`,
//                 };
//               }

//               console.log("Email sent successfully:", data);
//               return {
//                 success: true,
//                 message: `Email successfully sent to ${to}! Email ID: ${data?.id}`,
//               };
//             } catch (error: any) {
//               console.error("Error sending email:", error);
//               return {
//                 success: false,
//                 message: `Error: ${error.message}`,
//               };
//             }
//           },
//           approval: {
//             type: "user",
//             message: "Do you want to send this email?",
//           },
//         },

//         // Auto-execute tool - fetches employee wife's number
//         getEmployeeWifeNumber: {
//           description:
//             "Get the wife's contact number for an employee from the company database. Search by employee name.",
//           inputSchema: z.object({
//             employeeName: z
//               .string()
//               .describe("The name of the employee to search for"),
//           }),
//           execute: async ({ employeeName }) => {
//             console.log("Searching for employee:", employeeName);

//             // Search employee database (case-insensitive, partial match)
//             const employee = employeeDatabase.find((emp) =>
//               emp.name.toLowerCase().includes(employeeName.toLowerCase())
//             );

//             if (employee) {
//               return {
//                 success: true,
//                 employee: {
//                   name: employee.name,
//                   position: employee.position,
//                   wifeNumber: employee.wifeNumber,
//                 },
//                 message: `Found: ${employee.name} (${employee.position}). Wife's number: ${employee.wifeNumber}`,
//               };
//             } else {
//               return {
//                 success: false,
//                 message: `No employee found with name containing "${employeeName}". Available employees: ${employeeDatabase
//                   .map((e) => e.name)
//                   .join(", ")}`,
//               };
//             }
//           },
//         },
//       },
//     });

//     return result.toUIMessageStreamResponse();
//   } catch (error) {
//     console.error("Error:", error);
//     return Response.json(
//       { error: "Failed to generate response" },
//       { status: 500 }
//     );
//   }
// }
