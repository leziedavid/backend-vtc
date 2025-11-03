#!/bin/sh
# wait-for-it.sh host:port [timeout]

hostport=$1
timeout=${2:-30}

echo "🔍 Script lancé avec hostport=$hostport et timeout=$timeout"

# Séparer host et port sans utiliser '<<<'
host=$(echo "$hostport" | cut -d: -f1)
port=$(echo "$hostport" | cut -d: -f2)

i=0
while [ $i -lt $timeout ]; do
  nc -z "$host" "$port" >/dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ $host:$port est disponible"
    exit 0
  fi
  echo "⏳ Waiting for $host:$port..."
  i=$((i + 1))
  sleep 1
done

echo "❌ Timeout waiting for $host:$port" 1>&2
exit 1
