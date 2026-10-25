# bidcore.in (Next.js, standalone output) for Azure Container Apps.
#   docker build \
#     --build-arg NEXT_PUBLIC_APP_URL=https://app.bidcoreai.com \
#     --build-arg NEXT_PUBLIC_US_SITE_URL=https://www.bidcoreai.com \
#     --build-arg SITE_URL=https://www.bidcore.in -t bidcore-in-website .
# Secrets (DATABASE_URL, SESSION_SECRET, SMTP_*, ...) are NOT baked in: they are set on the running container.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are compiled into the browser bundle, and SITE_URL into the page metadata, so they must be known at build time.
ARG NEXT_PUBLIC_APP_URL=https://app.bidcoreai.com
ARG NEXT_PUBLIC_US_SITE_URL=https://www.bidcoreai.com
ARG NEXT_PUBLIC_CONTACT_EMAIL=info@bidcore.in
ARG NEXT_PUBLIC_BIDCORE_API_URL=
ARG BIDCORE_API_URL=
ARG SITE_URL=https://www.bidcore.in
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_US_SITE_URL=$NEXT_PUBLIC_US_SITE_URL \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_BIDCORE_API_URL=$NEXT_PUBLIC_BIDCORE_API_URL \
    BIDCORE_API_URL=$BIDCORE_API_URL \
    SITE_URL=$SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
# `prisma generate` only reads the schema; it never connects. A placeholder keeps it (and the build) from needing the real database.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
