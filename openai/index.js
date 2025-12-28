import 'dotenv/config';
import { Agent, run, tool } from '@openai/agents';
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';
import { z } from 'zod';
import { email } from 'zod/v4';


// =======================EMAXPLE 1===============================================
// const roxAgent = new Agent({
//     name: "ROX",
//     instructions: "You are ROX, a 20x Hackathon winner. You have in depth knowlege of how to win hackathons and build products that win awards.",
// })

// run(roxAgent, "Hello, how are you?").then(result => {
//     console.log(result.finalOutput);
// }).catch(error => {
//     console.error(error);
// });

// =======================EMAXPLE 2===============================================

// const occupation = "student";
// const roxAgent = new Agent({
//     name: "ROX",
//     instructions: function () {
//         if (occupation === "student") {
//             return "You are a student advisor and u need to help the student with their questions and problems.";
//         } else if (occupation === "teacher") {
//             return "You are a teacher advisor and u need to help the teacher with their questions and problems.";
//         } else if (occupation === "doctor") {
//             return "You are a doctor advisor and u need to help the doctor with their questions and problems.";
//         } else if (occupation === "engineer") {
//             return "You are an engineer advisor and u need to help the engineer with their questions and problems.";
//         } else {
//             return "You are a citizen advisor and u need to help the citizen with their questions and problems.";
//         }
//     }
// })

// run(roxAgent, "Hello, may i know , who are you?").then(result => {
//     console.log(result.finalOutput);
// }).catch(error => {
//     console.error(error);
// });

// =======================EMAXPLE 3===============================================
// const getWeather = tool({
//     name: 'get_weather',
//     description: 'Return the weather for a given city.',
//     parameters: z.object({ city: z.string() }),
//     async execute({ city }) {
//         console.log(`Getting weather for ${city}.`);
//         return `The weather in ${city} is sunny.`;
//     },
// });

// const email = tool({
//     name: "send-email",
//     description: "Send an email to a given email address.",
//     parameters: z.object({ to: z.string(), subject: z.string(), body: z.string() }),
//     async execute({ to, subject, body }) {
//         console.log(`Email sent to ${to} with subject ${subject} and body ${body}.`);
//         return `Email sent to ${to} with subject ${subject} and body ${body}.`;
//     },
// })

// const agent = new Agent({
//     name: "Assistant",
//     instructions: "You are a helpful assistant and u need to help the user with their questions and problems.",
//     tools: [getWeather, email],
//     model: "gpt-4o-mini",
//     maxTokens: 50,
// });

// run(agent, "Hello, kindly send the temperature of new york to ronitrai1237@gmail.com").then(result => {
//     console.log(result.finalOutput);
// }).catch(error => {
//     console.error(error);
// });

// =======================EMAXPLE 4===============================================

// const weatherSchema = z.object({
//     city: z.string().describe("The city to get the weather for."),
//     temperature: z.number().describe("The temperature in the city."),
//     description: z.string().describe("The description of the weather in the city."),
// });
// const getWeather = tool({
//     name: 'get_weather',
//     description: 'Return the weather for a given city.',
//     parameters: z.object({ city: z.string() }),
//     async execute({ city }) {
//         console.log(`Getting weather for ${city}.`);
//         return `The weather in ${city} is sunny. and temperature is 20 degrees Celsius.`;
//     },
// });


// const agent = new Agent({
//     name: "Assistant",
//     instructions: "You are a Weather assistant and u need to help the user with their questions and problems.",
//     tools: [getWeather],
//     model: "gpt-4o-mini",
//     maxTokens: 50,
//     outputType: weatherSchema,
// });

// run(agent, "Hello, kindly send the temperature of new york and Ludhiana.").then(result => {
//     console.log(result.finalOutput);
// }).catch(error => {
//     console.error(error);
// });


// =======================EMAXPLE 5===============================================

// const refundProcess = tool({
//     name: 'refund process',
//     description: 'Return the refund process of the internet plan.',
//     parameters: z.object({
//         plan: z.string().describe("The plan to refund."),
//         customerName: z.string().describe("The name of the customer."),
//         reason: z.string().describe("The reason for refund."),
//     }),
//     execute: async function ({ plan, customerName, reason }) {
//         return `The refund process of the ${plan}. by the customer ${customerName} for the reason ${reason}`;
//     },
// })

// const internetPlans = tool({
//     name: 'get internet plan',
//     description: 'Return the plans of internet .',
//     parameters: z.object({}),
//     execute: async function () {
//         return [
//             {
//                 name: '100MB',
//                 price: 100,
//                 speed: 100,
//                 description: '100MB internet plan',
//             },
//             {
//                 name: '200MB',
//                 price: 400,
//                 speed: 200,
//                 description: '200MB internet plan',
//             },
//             {
//                 name: '300MB',
//                 price: 600,
//                 speed: 300,
//                 description: '300MB internet plan',
//             },
//         ];
//     },
// });


// const RefundAgent = new Agent({
//     name: "Refund Agent",
//     instructions: "You are a Refund agent and u need to help the user with refunds, for refund u only need name and plan.",
//     tools: [refundProcess],
//     model: "gpt-4.1-mini",
//     // maxTokens: 50,
// });

// const SalesAgent = new Agent({
//     name: "Sales Agent",
//     instructions: "You are a Sales agent and u need to help the user with their questions and problems.",
//     tools: [internetPlans, RefundAgent.asTool({
//         toolName: 'refund-process',
//         toolDescription: 'Return the refund process of the internet plan for the customer.',
//     })],
//     model: "gpt-4.1-mini",
//     // maxTokens: 50,
// });



// run(SalesAgent, "Hello, can u make refund of my plan 100MB. my name is Ronit Rai").then(result => {
//     console.log(result.finalOutput);
// }).catch(error => {
//     console.error(error);
// });


// =====================================================EXAMPLE 6 (HANDOFFS)=======================
// REFUND AGENT
// const refundProcess = tool({
//     name: 'refund process',
//     description: 'Return the refund process of the internet plan.',
//     parameters: z.object({
//         plan: z.string().describe("The plan to refund."),
//         customerName: z.string().describe("The name of the customer."),
//         reason: z.string().describe("The reason for refund."),
//     }),
//     execute: async function ({ plan, customerName, reason }) {
//         return `The refund process of the ${plan}. by the customer ${customerName} for the reason ${reason}`;
//     },
// })

// const RefundAgent = new Agent({
//     name: "Refund Agent",
//     instructions: "You are a Refund agent and u need to help the user with refunds, for refund u only need name and plan.",
//     tools: [refundProcess],
//     model: "gpt-4.1-mini",
//     // maxTokens: 50,
// });

// // SALES AGENT

// const internetPlans = tool({
//     name: 'get internet plan',
//     description: 'Return the plans of internet .',
//     parameters: z.object({}),
//     execute: async function () {
//         return [
//             {
//                 name: '100MB',
//                 price: 100,
//                 speed: 100,
//                 description: '100MB internet plan',
//             },
//             {
//                 name: '200MB',
//                 price: 400,
//                 speed: 200,
//                 description: '200MB internet plan',
//             },
//             {
//                 name: '300MB',
//                 price: 600,
//                 speed: 300,
//                 description: '300MB internet plan',
//             },
//         ];
//     },
// });

// const SalesAgent = new Agent({
//     name: "Sales Agent",
//     instructions: "You are a Sales agent and u need to help users to select Plans that are provided. u can use 2 tools , one to see the internetPLans and another to call refund agent if user wants refund.",
//     tools: [internetPlans, RefundAgent.asTool({
//         toolName: 'refund-process',
//         toolDescription: 'Return the refund process of the internet plan for the customer.',
//     })],
//     model: "gpt-4.1-mini",
//     // maxTokens: 50,
// });

// // RECEPTION AGENT
// const ReceptionAgent = new Agent({
//     name: "Reception Agent",
//     instructions: "You are a Customer facing agent expert in understanding what customer needs and then handoff  them to right agent.",
//     handoffDescription: `You have 2 agents available:
//     Sales agent - expertise in seeing what customer needs and helping them buy/choose right internet plan.
//     Refund agent - expertise in refunding the payment of the customers and solving their issues.`,
//     handoffs: [SalesAgent, RefundAgent],

// });

// async function main(query = '') {
//     const result = await run(ReceptionAgent, query)
//     console.log("RESULT--->", result.finalOutput)
//     console.log("HISTORY--->", result.history)

// }

// main("hey can u tell me best plans for me? and with pricing")

// ================================================EXAMPLE 7 (CHAT THREADS)==================================
// let sharedHistory = [];
// const dbSchema = tool({
//     name: 'get Users info from database',
//     description: 'Return the data of the particular Users from the database.',
//     parameters: z.object({
//         email: z.string().describe("The email of the user need to look into database"),
//         name: z.string().describe("The name of the user for which need to look into database"),
//     }),
//     execute: async function () {
//         return [
//             {
//                 name: 'rox',
//                 email: "rox@gmail.com",
//                 id: 100,
//                 status: "online",
//             },
//             {
//                 name: 'riya',
//                 email: "riya@gmail.com",
//                 id: 102,
//                 status: "online",
//             },
//             {
//                 name: 'myra',
//                 email: "myra@gmail.com",
//                 id: 109,
//                 status: "offline",
//             },
//         ];
//     },
// });

// const newAgent = new Agent({
//     name: "Query Agent",
//     instructions: "You are a Helful Assistant , which helps users with their query. You can make query into database for the user for their data/info for which you need their name and email.",
//     tools: [dbSchema],
//     // model: "gpt-4.1-mini",
// });


// async function main(q = '') {
//     sharedHistory.push({ role: "user", content: q })
//     const result = await run(newAgent, sharedHistory)

//     sharedHistory = result.history
//     console.log("RESULT--->", result.finalOutput)

// }

// main("Hello my name is rox ").then(() =>
//     main("and email is rox@gmail.com, please find my data"))

// ==============================================EXAMPLE 8 (SESSION) =================================
// const dbSchema = tool({
//     name: 'get Users info from database',
//     description: 'Return the data of the particular Users from the database.',
//     parameters: z.object({
//         email: z.string().describe("The email of the user need to look into database"),
//         name: z.string().describe("The name of the user for which need to look into database"),
//     }),
//     execute: async function () {
//         // console.log(`NAME: `, name`EMAIL`, email)
//         return [
//             {
//                 name: 'rox',
//                 email: "rox@gmail.com",
//                 id: 100,
//                 status: "online",
//             },
//             {
//                 name: 'riya',
//                 email: "riya@gmail.com",
//                 id: 102,
//                 status: "online",
//             },
//             {
//                 name: 'myra',
//                 email: "myra@gmail.com",
//                 id: 109,
//                 status: "offline",
//             },
//         ];
//     },
// });

// const newAgent = new Agent({
//     name: "Query Agent",
//     instructions: "You are a Helful Assistant , which helps users with their query. You can make query into database for the user for their data/info for which you need their name and email.",
//     tools: [dbSchema],
//     // model: "gpt-4.1-mini",
// });


// async function main(q = '') {
//     const result = await run(newAgent, q, {
//         conversationId: ""
//     })

//     console.log("RESULT--->", result.finalOutput)

// }

// main("Hello my name is rox ").then(() =>
//     main("and email is rox@gmail.com, please find my data"))

// =========================================EXAMPLE 9 (STREAMING)===============================
