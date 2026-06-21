# web/Dockerfile

# ── Estágio 1: build Vite ─────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_URL é injetada em build-time via ARG → ENV
# No Cloud Run, passe --build-arg VITE_API_URL=https://api-xxxxx.run.app
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Estágio 2: nginx para servir o SPA ───────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove config padrão
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run injeta PORT=8080; nginx escuta na porta configurada
ENV PORT=8080
EXPOSE 8080

# Substitui ${PORT} no conf e inicia nginx
CMD ["/bin/sh", "-c", "sed -i 's/__PORT__/'\"$PORT\"'/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
