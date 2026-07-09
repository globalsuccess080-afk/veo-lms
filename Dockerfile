FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configurations first to leverage Docker layer caching
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the shared package first, then the server
RUN npm run build -w @veolms/shared
RUN npm run build -w @veolms/server

# Production stage
FROM node:20-alpine AS runner

RUN apk add --no-cache ffmpeg

WORKDIR /app
ENV NODE_ENV=production

# Copy root workspace configurations and node_modules
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy built shared package
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy built server package
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 5000

# Start the server using the workspace command
CMD ["npm", "run", "start", "-w", "@veolms/server"]
