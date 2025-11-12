# Dockerfile for Next.js multi-stage build (ARM compatible)
FROM node:20-bullseye-slim AS builder
WORKDIR /app
# copy manifests first for caching
COPY package*.json package-lock.json ./
RUN npm ci
# copy sources
COPY . .
# generate prisma client if present (non-fatal)
RUN npx prisma generate || true
# build next
RUN npm run build

# production image
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# copy built app
COPY --from=builder /app/ ./
# install only production deps
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
