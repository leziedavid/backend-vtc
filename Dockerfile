# Étape 1 : Builder - installation dev + build + prisma generate
FROM node:20-alpine AS builder

WORKDIR /app

# Installer OpenSSL requis par Prisma
RUN apk add --no-cache openssl

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (prod + dev)
RUN npm install

# Copier fichiers Prisma et sources
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./
COPY nest-cli.json ./

# Générer le client Prisma
RUN npx prisma generate

# Builder le projet
RUN npm run build

# Étape 2 : Runner - image finale minimaliste
FROM node:20-alpine AS runner

WORKDIR /app

# Installer OpenSSL et netcat pour wait-for-it
RUN apk add --no-cache openssl netcat-openbsd bash

# Copier package.json et installer dépendances prod
COPY package*.json ./
RUN npm install --omit=dev

# Copier le build, node_modules et prisma depuis builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Créer dossier storage
RUN mkdir -p /app/storage

# Copier le script wait-for-it.sh
COPY wait-for-it.sh /app/wait-for-it.sh
RUN chmod +x /app/wait-for-it.sh


# Copier le script entrypoint Prisma
COPY prisma-entrypoint.sh /app/prisma-entrypoint.sh
RUN chmod +x /app/prisma-entrypoint.sh

# Exposer le port utilisé par l'app
EXPOSE 4000

# Lancer le backend via entrypoint
CMD ["/bin/sh", "-c", "/app/wait-for-it.sh ms-postgres:5432 30 && /app/prisma-entrypoint.sh"]

# Lancer le backend seulement après que PostgreSQL soit prêt
# ET appliquer les mises à jour du schéma Prisma sans écraser les données
# CMD ["/bin/sh", "-c", "/app/wait-for-it.sh ms-postgres:5432 30 && npx prisma generate && npx prisma migrate deploy && node dist/main.js"]
