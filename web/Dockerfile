# web/Dockerfile

# ── Estágio 1: build Vite ─────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variáveis embutidas em build-time pelo Vite (não funcionam como env vars de runtime no Cloud Run)
# VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são credenciais públicas — seguro hardcodar
ENV VITE_SUPABASE_URL="https://hbulqhysiquorurpuviu.supabase.co"
ENV VITE_SUPABASE_ANON_KEY="sb_publishable_oHoo9Almfw-szuDwhBMZzw_elL3OQuN"
ENV VITE_API_URL="https://if-literario-798700706860.southamerica-east1.run.app"

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
