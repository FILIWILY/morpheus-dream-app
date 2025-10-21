#!/bin/bash
# ==============================================================================
#                 Morpheus Dream App - Full Redeployment Script
# ==============================================================================
#
# This script performs a complete redeployment of the application.
# It STOPS containers, DELETES associated volumes (including the database),
# pulls the latest code, rebuilds images, and starts everything fresh.
#
# WARNING: This will permanently delete all data in the database.
#          Use with caution, especially in a production environment with real user data.
#
# USAGE:
#   1. Make sure your server's DNS is working (e.g., `ping github.com`).
#   2. Make this script executable: `chmod +x redeploy.sh`
#   3. Run it from the root of the project: `./redeploy.sh`
#
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

echo " "
echo "💣  Starting FULL redeployment for Morpheus Dream App..."
echo "⚠️  WARNING: This will delete the database volume."
echo " "

# --- Step 1: Update Environment for Cache Busting ---
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: .env file not found. Please create it from env.example."
    exit 1
fi

# Source the .env file to read BASE_WEB_APP_URL
set +u
source "$ENV_FILE"
set -u

if [ -z "${BASE_WEB_APP_URL}" ]; then
    echo "❌ ERROR: BASE_WEB_APP_URL is not set in your .env file."
    exit 1
fi

echo "🔄 [1/5] Generating new version for cache busting..."
NEW_VERSION=$(date +%Y%m%d%H%M%S)
NEW_WEB_APP_URL="${BASE_WEB_APP_URL}?v=${NEW_VERSION}"

if grep -q "^TELEGRAM_WEB_APP_URL=" "$ENV_FILE"; then
    sed -i "s|^TELEGRAM_WEB_APP_URL=.*|TELEGRAM_WEB_APP_URL=${NEW_WEB_APP_URL}|" "$ENV_FILE"
else
    echo -e "\nTELEGRAM_WEB_APP_URL=${NEW_WEB_APP_URL}" >> "$ENV_FILE"
fi
echo "✅  New URL set in .env: ${NEW_WEB_APP_URL}"

# --- Step 2: Stop and Remove Everything ---
echo "🔄 [2/5] Stopping containers and removing volumes..."
docker compose down -v --remove-orphans
echo "✅  All containers and volumes have been removed."


# --- Step 3: Pull Latest Changes from Git ---
echo "🔄 [3/5] Pulling latest changes from Git..."
git pull
echo "✅  Code updated."

# --- Step 4: Rebuild Docker Images ---
echo "🔄 [4/5] Rebuilding Docker images without cache..."
docker compose build --no-cache
echo "✅  Images rebuilt successfully."

# --- Step 5: Start Docker Containers ---
echo "🔄 [5/5] Starting Docker containers in detached mode..."
docker compose up -d
echo "✅  Containers started successfully."

echo " "
echo "🎉  Full redeployment finished successfully!"
echo " "
exit 0
