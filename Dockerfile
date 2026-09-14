FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/scripts/telegram-monitor.mjs ./scripts/telegram-monitor.mjs
COPY --from=build /app/src/depeg-monitor.mjs ./src/depeg-monitor.mjs
COPY --from=build /app/src/lib/telegram.mjs ./src/lib/telegram.mjs
COPY --from=build /app/src/lib/depeg-telegram-monitor.mjs ./src/lib/depeg-telegram-monitor.mjs
EXPOSE 3000
CMD ["node", "server.js"]
