# Install dependencies only when needed
FROM node:alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git openssh
RUN npm install -g corepack && corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:alpine AS builder
# NODE_OPTIONS environment variable was added to workaround webpack issue
RUN apk add --no-cache git openssh
RUN npm install -g corepack && corepack enable && corepack prepare pnpm@latest --activate
ENV NODE_OPTIONS=--openssl-legacy-provider

ARG BACKEND_HOST
ARG NEXTAUTH_URL
ARG MIPER_MODULE_BACKEND
ARG MIPER_MODULE_FRONTEND
ARG AUTH_MODULE_FRONTEND

ENV BACKEND_HOST $BACKEND_HOST
ENV MIPER_MODULE_BACKEND $MIPER_MODULE_BACKEND
ENV MIPER_MODULE_FRONTEND $MIPER_MODULE_FRONTEND
ENV AUTH_MODULE_FRONTEND $AUTH_MODULE_FRONTEND

ENV NEXT_PUBLIC_BACKEND_HOST $BACKEND_HOST
ENV NEXT_PUBLIC_NEXTAUTH_URL $NEXTAUTH_URL
ENV NEXT_PUBLIC_MIPER_MODULE_BACKEND $MIPER_MODULE_BACKEND
ENV NEXT_PUBLIC_MIPER_MODULE_FRONTEND $MIPER_MODULE_FRONTEND
ENV NEXT_PUBLIC_AUTH_MODULE_FRONTEND $AUTH_MODULE_FRONTEND

WORKDIR /app

COPY .git .git
RUN mkdir -p ~/.ssh && ssh-keyscan -H gitlab.safetyclub.cl >> ~/.ssh/known_hosts
RUN --mount=type=ssh git submodule update --init --recursive

COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm run build && pnpm install --prod --ignore-scripts --prefer-offline

# Production image, copy all the files and run next
FROM node:alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN npm install -g corepack && corepack enable && corepack prepare pnpm@latest --activate

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# You only need to copy next.config.ts if you are NOT using the default configuration
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
# ENV NEXT_TELEMETRY_DISABLED 1

CMD ["pnpm", "start"]
