# ── Backend Dockerfile ───────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Expose port
EXPOSE 5000

# Start with transpile-only (no type-checking in prod container)
CMD ["npx", "ts-node", "--transpile-only", "src/index.ts"]
