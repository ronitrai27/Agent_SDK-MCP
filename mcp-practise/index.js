import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// import fs from "fs/promises";
// import path from "path";


const server = new McpServer({
    name: "rox-server",
    version: "1.0.0",

});

// ADD TOOL===========================

// server.registerTool(
//     'add',
//     {
//         title: 'Addition Tool',
//         description: 'Add two numbers',
//         inputSchema: z.object({ a: z.number(), b: z.number() }),
//         outputSchema: z.object({ result: z.number() })
//     },
//     async ({ a, b }) => {
//         const output = { result: a + b };
//         return {
//             content: [{ type: 'text', text: JSON.stringify(output) }],
//             structuredContent: output
//         };
//     }
// );

// GITHUB REPO SEARCH TOOL===========================
server.registerTool(
    "Github-Repo-Search",
    {
        title: "Github Repository Search Tool",
        description: "Search for all repository on Github from the given username",
        inputSchema: z.object({ username: z.string() }),
        outputSchema: z.object({
            result: z.string(),
            repositories: z.any()
        })

    },
    async ({ username }) => {
        const res = await fetch(`https://api.github.com/users/${username}/repos`, {
            "User-Agent": "MCP-Server",
            "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch repositories: ${res.statusText}`);
        }
        const repos = await res.json();
        const repoList = repos.map((repo) => repo.name).join("\n");

        return {
            content: [{ type: 'text', text: `Repositories for ${username}:\n${repoList}` }],
            structuredContent: {
                result: repoList,
                repositories: repos
            }
        }

    }
)

// WEATHER CHECK TOOL==============================
// server.registerTool(
//     "Weather-Check",
//     {
//         title: "Weather Check Tool",
//         description: "Get current weather for any city without API key",
//         inputSchema: z.object({ city: z.string() }),
//         outputSchema: z.object({
//             temp: z.string(),
//             weather: z.string(),
//         })
//     },
//     async ({ city }) => {
//         const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

//         const res = await fetch(url, {
//             headers: {
//                 "User-Agent": "MCP-Server"
//             }
//         });

//         if (!res.ok) {
//             throw new Error(`Failed to fetch weather: ${res.statusText}`);
//         }

//         const data = await res.json();

//         // extract useful fields
//         const current = data.current_condition?.[0];
//         const temp = current?.temp_C || "N/A";
//         const desc = current?.weatherDesc?.[0]?.value || "N/A";

//         return {
//             content: [
//                 {
//                     type: "text",
//                     text: `Weather in ${city}:\nTemperature: ${temp}°C\nCondition: ${desc}`
//                 }
//             ],
//             structuredContent: {
//                 temp: temp,
//                 weather: desc,
//                 raw: data
//             }
//         };
//     }
// );

// RESOURCE DOC===================================  
// server.registerResource(
//     "protocol-doc",
//     "file://protocol",
//     {
//         title: "Protocol Document",
//         description: "Exposes the protocol.doc file",
//         mimeType: "text/plain"
//     },
//     async (uri) => {

//         const cleanUri = uri.href.replace(/\/$/, "");

//         if (cleanUri !== "file://protocol") {
//             throw new Error(`Resource ${uri.href} not found`);
//         }

//         const filePath = path.resolve("protocol.doc");

//         const content = await fs.readFile(filePath, "utf8");

//         return {
//             contents: [
//                 {
//                     uri: uri.href,
//                     text: content
//                 }
//             ]
//         };
//     }
// );

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(" MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});