#!/bin/sh
set -e

# Variables
APP_DIR="/app"
SCHEMA_PATH="prisma/schema.prisma"
DB_HOST="ms-postgres"
DB_PORT="5432"
DB_USER="microservices"
DB_NAME="mseagrie"
MICROSERVICES_PASSWORD="microservices"
DB_URL="postgresql://$DB_USER:$MICROSERVICES_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo "📦 Sauvegarde conseillée de la base avant de continuer !"
echo "🔍 Démarrage du déploiement Prisma..."

cd "$APP_DIR"

# Vérifier les migrations échouées
FAILED=$(npx prisma migrate status --schema="$SCHEMA_PATH" | grep "FAILED" || echo "")
if [ -n "$FAILED" ]; then
  echo "⚠️  Migrations échouées détectées, résolution automatique..."
  for MIG in $(echo "$FAILED" | awk '{print $1}'); do
    echo "🛠 Marque migration $MIG comme appliquée sans toucher aux données"
    npx prisma migrate resolve --applied "$MIG" --schema="$SCHEMA_PATH"
  done
else
  echo "✅ Aucune migration échouée détectée"
fi

# Vérifier si une migration init existe localement
INIT_MIG=$(ls prisma/migrations | grep "_init" || echo "")

# Vérifier si la base contient déjà une migration init
INIT_IN_DB=$(npx prisma migrate status --schema="$SCHEMA_PATH" | grep "_init" || echo "")

if [ -n "$INIT_MIG" ] && [ -n "$INIT_IN_DB" ]; then
  echo "⚠️  Migration init détectée en local et en base, comparaison des hash..."

  # Calcul du hash local
  INIT_LOCAL_HASH=$(sha256sum "prisma/migrations/$INIT_MIG/migration.sql" | awk '{print $1}')

  if command -v psql >/dev/null 2>&1; then
    # Récupération du hash en base
    INIT_DB_HASH=$(PGPASSWORD="$MICROSERVICES_PASSWORD" psql "$DB_URL" -t -c \
      "SELECT checksum FROM _prisma_migrations WHERE migration_name LIKE '%_init%' ORDER BY finished_at DESC LIMIT 1;" | xargs)

    echo "🔍 Hash local : $INIT_LOCAL_HASH"
    echo "🔍 Hash base  : $INIT_DB_HASH"

    if [ "$INIT_LOCAL_HASH" = "$INIT_DB_HASH" ]; then
      echo "✅ Migration init identique → marquée comme appliquée"
      npx prisma migrate resolve --applied "$INIT_MIG" --schema="$SCHEMA_PATH" || true
    else
      echo "⚠️ Attention : hash différent → Prisma appliquera la migration locale"
    fi
  else
    echo "⚠️  psql non disponible → skip comparaison des hash, Prisma gèrera automatiquement"
  fi
fi

# Déployer toutes les migrations restantes
echo "🚀 Déploiement des migrations (y compris _init si nécessaire)"
npx prisma migrate deploy --schema="$SCHEMA_PATH"

# Générer le client Prisma
echo "🛠 Génération du client Prisma"
npx prisma generate --schema="$SCHEMA_PATH"

echo "✅ Prisma et la base sont maintenant synchronisés."
echo "🚀 Démarrage de l'application..."
exec node dist/main.js
