import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRepositoryTool } from "../tools/create-repository.js";
import { createIssueTool } from "../tools/create-issue.js";
import { listRepositoriesTool } from "../tools/list-repositories.js";
import { createCommitTool } from "../tools/create-commit.js";
import { listIssuesTool } from "../tools/list-issues.js";
import { logger } from "./logging.js";

const server = new McpServer({
    name: "github-mcp-agent",
    version: "1.0.0",
});

const tools = [
    createRepositoryTool,
    createIssueTool,
    listRepositoriesTool,
    createCommitTool,
    listIssuesTool,
];

for (const tool of tools) {
    server.registerTool(
        tool.name,
        {
            description: tool.description,
            inputSchema: tool.inputSchema.shape,
        },
        async (args: Record<string, unknown>) => {
            const result = await tool.handler(args);
            return {
                content: [{ type: "text" as const, text: result.message }],
                isError: !result.success,
            };
        }
    );
}

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info("MCP server iniciado y conectado por stdio");
}

main().catch((error) => {
    logger.error("Error fatal al iniciar el server", { error });
    process.exit(1);
});