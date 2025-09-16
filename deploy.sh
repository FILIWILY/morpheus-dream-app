#!/bin/bash
# ==============================================================================
#                      Morpheus Dream App - Deployment Script
# ==============================================================================
#
# This script automates the deployment process for the application.
# It handles cache-busting for the Telegram Web App, rebuilds, and restarts
# the Docker containers.
#
# USAGE:
#   1. Make sure this script is executable: chmod +x deploy.sh
#   2. Run it from the root of the project: ./deploy.sh
#
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status.

echo " "
echo "🚀  Starting deployment for Morpheus Dream App..."
echo " "

# --- Step 1: Update Environment for Cache Busting ---
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: .env file not found. Please create it from env.example."
    exit 1
fi

# Source the .env file to read BASE_WEB_APP_URL
# Temporarily disable unbound variable errors for this command
set +u
source "$ENV_FILE"
set -u

if [ -z "${BASE_WEB_APP_URL}" ]; then
    echo "❌ ERROR: BASE_WEB_APP_URL is not set in your .env file."
    exit 1
fi

echo "🔄 [1/4] Generating new version for cache busting..."
NEW_VERSION=$(date +%Y%m%d%H%M%S)
NEW_WEB_APP_URL="${BASE_WEB_APP_URL}?v=${NEW_VERSION}"

# Use sed to update the .env file. This is safer than rewriting the whole file.
# It handles both cases: if the variable exists or not.
if grep -q "^TELEGRAM_WEB_APP_URL=" "$ENV_FILE"; then
    sed -i "s|^TELEGRAM_WEB_APP_URL=.*|TELEGRAM_WEB_APP_URL=${NEW_WEB_APP_URL}|" "$ENV_FILE"
else
    echo -e "\nTELEGRAM_WEB_APP_URL=${NEW_WEB_APP_URL}" >> "$ENV_FILE"
fi
echo "✅  New URL set in .env: ${NEW_WEB_APP_URL}"


# --- Step 2: Pull Latest Changes from Git ---
echo "🔄 [2/4] Pulling latest changes from Git..."
git pull
echo "✅  Code updated."

# --- Step 3: Rebuild Docker Images ---
echo "🔄 [3/4] Rebuilding Docker images without cache..."
docker compose build --no-cache
echo "✅  Images rebuilt successfully."

# --- Step 4: Restart Docker Containers ---
echo "🔄 [4/4] Restarting Docker containers..."
docker compose up -d --force-recreate
echo "✅  Containers restarted successfully."

echo " "
echo "🎉  Deployment finished successfully!"
echo " "
exit 0
