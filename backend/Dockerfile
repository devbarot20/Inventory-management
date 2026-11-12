FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Copy dependency specifications
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source and scripts
COPY src/ ./src/
COPY scripts/ ./scripts/

EXPOSE 5001

CMD ["node", "src/server.js"]
