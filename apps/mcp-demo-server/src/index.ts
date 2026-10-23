import { createServer } from "node:http";
import { toNodeHandler } from "@modelcontextprotocol/node";
import { McpServer, acceptedContent, createMcpHandler, inputRequired, inputResponse } from "@modelcontextprotocol/server";
import { z } from "zod";

const OAUTH_TOKEN_HEADER = "X-OAuth-Token";

// Demo-only "OAuth": the token is valid iff it's a non-negative integer divisible by 15.
function isValidOAuthToken(token: string | null | undefined): boolean {
  return token != null && /^\d+$/.test(token) && BigInt(token) % 15n === 0n;
}

// Returns an error tool result if the tool call's HTTP request lacks a valid token, otherwise undefined.
function rejectUnauthorized(ctx: { http?: { req?: Request } }) {
  const token = ctx.http?.req?.headers.get(OAUTH_TOKEN_HEADER);
  if (isValidOAuthToken(token)) return undefined;
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: token
          ? `Unauthorized: invalid ${OAUTH_TOKEN_HEADER} header.`
          : `Unauthorized: missing ${OAUTH_TOKEN_HEADER} header.`,
      },
    ],
  };
}

function buildServer(): McpServer {
  const server = new McpServer({ name: "claudicus-demo", version: "0.1.0" });

  server.registerTool(
    "echo",
    {
      description: "Echoes back the given text.",
      inputSchema: { text: z.string() },
    },
    async ({ text }, ctx) => rejectUnauthorized(ctx) ?? { content: [{ type: "text", text }] },
  );

  // Elicitation enums are string-only, so door counts are "2" / "4" rather than numbers.
  const carSchema = z.object({
    name: z.string().min(1),
    doors: z.enum(["2", "4"]),
    attachments: z.array(z.enum(["navi", "radio", "tv"])),
    price: z.number(),
    used: z.boolean(),
    // Legacy titled single select: `enum` plus positional `enumNames` labels (deprecated in the spec, still valid).
    color: z.enum(["red", "blue", "black"]).meta({ enumNames: ["Racing red", "Ocean blue", "Midnight black"] }),
  });

  server.registerTool(
    "create_car",
    {
      description: "Creates a car, asking the user (via elicitation) for its name, door count, and attachments.",
      inputSchema: {},
    },
    async (_args, ctx) => {
      const unauthorized = rejectUnauthorized(ctx);
      if (unauthorized) return unauthorized;
      // acceptedContent() can't tell "not asked yet" from "declined/cancelled" — check first, or we'd re-elicit forever.
      const response = inputResponse(ctx.mcpReq.inputResponses, "car");
      if (response.kind === "elicit" && response.action !== "accept") {
        return {
          isError: true,
          content: [{ type: "text", text: `User ${response.action === "decline" ? "declined" : "cancelled"} the car configuration; no car was created.` }],
        };
      }
      const car = acceptedContent(ctx.mcpReq.inputResponses, "car", carSchema);
      if (!car) {
        return inputRequired({
          inputRequests: {
            car: inputRequired.elicit({
              message:
                "Configure your new car: give it a name, pick the number of doors, choose any attachments, set a price, say whether it's used, and pick a color.",
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
            text: `Created ${car.used ? "used" : "new"} ${car.color} car "${car.name}" with ${car.doors} doors, attachments: ${attachments}, price: ${car.price}.`,
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
