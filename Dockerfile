FROM node:24-slim AS base

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=7860
ENV BASE_PATH=/

RUN pnpm --filter @workspace/admin-panel run build
RUN pnpm --filter @workspace/api-server run build
RUN cp -r artifacts/admin-panel/dist/public artifacts/api-server/dist/public

EXPOSE 7860

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
