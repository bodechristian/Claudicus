import { createServer } from "node:http";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { McpServer, acceptedContent, createMcpHandler, inputRequired } from "@modelcontextprotocol/server";
import { z } from "zod";

function buildServer(): McpServer {
  const server = new McpServer({ name: "claudicus-demo", version: "0.1.0" });

  server.registerTool(
    "echo",
    {
      description: "Echoes back the given text.",
      inputSchema: { text: z.string() },
    },
    async ({ text }) => ({ content: [{ type: "text", text }] }),
  );

  const feedbackSchema = z.object({
    rating: z.number().min(1).max(5),
    comments: z.string().optional(),
  });

  server.registerTool(
    "collect_feedback",
    {
      description: "Collects structured feedback from the user (via elicitation) before completing.",
      inputSchema: { topic: z.string() },
    },
    async ({ topic }, ctx) => {
      const feedback = acceptedContent(ctx.mcpReq.inputResponses, "feedback", feedbackSchema);
      if (!feedback) {
        return inputRequired({
          inputRequests: {
            feedback: inputRequired.elicit({
              message: `Please rate "${topic}" from 1 to 5 and leave optional comments.`,
              requestedSchema: feedbackSchema,
            }),
          },
        });
      }
      return {
        content: [{ type: "text", text: `Thanks! Received rating ${feedback.rating} for "${topic}".` }],
      };
    },
  );

  return server;
}

const handler = createMcpHandler(() => buildServer());
const port = Number(process.env.PORT ?? 3100);

createServer(toNodeHandler(handler)).listen(port, () => {
  console.log(`MCP demo server listening on http://localhost:${port}/mcp`);
});
