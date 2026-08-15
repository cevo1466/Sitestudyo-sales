# Cok asamali derleme: derleme araclari nihai imaja girmez.
# Ayni imaj hem API hem isci olarak calisir (ROLE degiskeni ayirir).

# ─────────────────────────────────────────────────────────── deps
FROM node:22-alpine AS deps
WORKDIR /app
# argon2 yerel derleme gerektirebilir (hazir ikili yoksa)
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# ────────────────────────────────────────────────────────── build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ─────────────────────────────────────────────────────── runtime
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Prisma'nin OpenSSL'e ihtiyaci var; tzdata olmadan tarihler UTC'de kalir
RUN apk add --no-cache openssl tzdata && \
    addgroup -S app && adduser -S app -G app
ENV TZ=Europe/Istanbul

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./
COPY prisma ./prisma

# Root olarak calistirma: bir zafiyet durumunda etki alani kucuk kalsin.
USER app

EXPOSE 5080
CMD ["node", "dist/main.js"]
