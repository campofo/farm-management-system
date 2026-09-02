# Frontend: TanStack Start (Vite + Nitro) built as a Node server
FROM node:22-slim AS build

WORKDIR /app
RUN corepack enable

# Install deps first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Build a self-hostable Node server output (.output/server/index.mjs)
COPY . .
ENV NITRO_PRESET=node-server
RUN pnpm run build

# --- Runtime image ---
FROM node:22-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
