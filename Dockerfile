FROM node:22-bookworm-slim AS base
# better-sqlite3 has no prebuilt binary for this platform/Node combo and
# compiles from source via node-gyp, which needs Python + a C++ toolchain.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/domain/package.json packages/domain/
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @claudicus/domain build \
 && pnpm --filter @claudicus/backend build \
 && pnpm --filter @claudicus/frontend build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=build /repo/packages/domain/package.json ./packages/domain/package.json
COPY --from=build /repo/packages/domain/dist ./packages/domain/dist
COPY --from=build /repo/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist
# Frontend ships as static files; its package.json is kept only so the
# lockfile-verified `pnpm install --prod` below stays consistent with the
# workspace it was generated from (its deps are never imported at runtime).
COPY --from=build /repo/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=build /repo/apps/frontend/dist ./apps/frontend/dist
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3000
VOLUME ["/data"]
ENV DB_PATH=/data/claudicus.db
CMD ["node", "apps/backend/dist/index.js"]
