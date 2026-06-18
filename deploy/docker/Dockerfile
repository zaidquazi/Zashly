# Production multi-stage build — minimal attack surface
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=backend-build /app/backend /app/backend
COPY --from=frontend-build /app/frontend/dist /app/backend/frontend/dist
USER nodejs
WORKDIR /app/backend
EXPOSE 5002
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:5002/healthcheck || exit 1
CMD ["node", "src/server.js"]
