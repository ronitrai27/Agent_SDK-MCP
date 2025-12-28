import 'dotenv/config';
import { Agent, hostedMcpTool, run } from '@openai/agents';
import { OpenAI } from 'openai';

const agent = new Agent({
    name: 'MCP Assistant',
    instructions: 'You must always use the MCP tools to answer questions.',
    tools: [
        hostedMcpTool({
            serverLabel: "productivity",
            serverUrl: "https://stormmcp.ai/gateway/24e2a3e5-36f4-4e34-a7ae-6c7064c9b9ee/mcp",
            headers: {
                "X-API-Key": "ag_q3mLjoenBkSWgIt9AvixE7yXIw1HMJSn+ykIZLf/4E8="
            }
        })
    ]
});

async function main(q = "") {
    const result = await run(agent, q)
    console.log(result.finalOutput)

}

// main("can u find the repo clario-career-platform and then put the title into the notion please?")

// tsx file name
// tools: [
//     hostedMcpTool({
//         serverLabel: 'notion-new',
//         serverUrl: 'https://stormmcp.ai/gateway/e8450499-9a0b-41ba-ad46-5a1bdacd375c/mcp',
//         headers: {
//             "X-API-Key": "ag_q3mLjoenBkSWgIt9AvixE7yXIw1HMJSn+ykIZLf/4E8="
//         }
//     }),
// ],
