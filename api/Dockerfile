# api/Dockerfile

# ── Estágio 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências (inclui devDeps para tsc)
COPY package.json package-lock.json ./
RUN npm ci

# Copia código-fonte e configurações
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Compila TypeScript → dist/
RUN npm run build

# Gera o Prisma Client a partir do schema
RUN npx prisma generate

# ── Estágio 2: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Apenas dependências de produção
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copia artefatos do build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Cloud Run injeta PORT via env; fallback para 3333
ENV PORT=3333
EXPOSE 3333

CMD ["node", "dist/server.js"]
