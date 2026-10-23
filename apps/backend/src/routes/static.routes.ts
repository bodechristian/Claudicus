import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import type { FastifyInstance } from "fastify";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(moduleDir, "../../../frontend/dist");

export async function registerStaticRoutes(app: FastifyInstance): Promise<void> {
  if (!existsSync(frontendDist)) {
    app.log.warn(`Frontend build not found at ${frontendDist}; skipping static serving (dev mode uses Vite directly).`);
    return;
  }

  await app.register(fastifyStatic, { root: frontendDist });

  app.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith("/api") || request.raw.url?.startsWith("/ws")) {
      reply.code(404).send({ message: "Not found" });
      return;
    }
    reply.sendFile("index.html");
  });
}
