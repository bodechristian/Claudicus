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

  // Elicitation enums are string-only, so door counts are "2" / "4" rather than numbers.
  const carSchema = z.object({
    name: z.string().min(1),
    doors: z.enum(["2", "4"]),
    attachments: z.array(z.enum(["navi", "radio", "tv"])),
    price: z.number(),
    used: z.boolean(),
  });

  server.registerTool(
    "create_car",
    {
      description: "Creates a car, asking the user (via elicitation) for its name, door count, and attachments.",
      inputSchema: {},
    },
    async (_args, ctx) => {
      const car = acceptedContent(ctx.mcpReq.inputResponses, "car", carSchema);
      if (!car) {
        return inputRequired({
          inputRequests: {
            car: inputRequired.elicit({
              message:
                "Configure your new car: give it a name, pick the number of doors, choose any attachments, set a price, and say whether it's used.",
              requestedSchema: carSchema,
            }),
          },
        });
      }
      const attachments = car.attachments.length > 0 ? car.attachments.join(", ") : "none";
      return {
        content: [
          {
            type: "text",
            text: `Created ${car.used ? "used" : "new"} car "${car.name}" with ${car.doors} doors, attachments: ${attachments}, price: ${car.price}.`,
          },
        ],
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
