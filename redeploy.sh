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

# --- Step 1: Stop and Remove Everything ---
echo "🔄 [1/4] Stopping containers and removing volumes..."
docker compose down -v --remove-orphans
echo "✅  All containers and volumes have been removed."


# --- Step 2: Pull Latest Changes from Git ---
echo "🔄 [2/4] Pulling latest changes from Git..."
git pull
echo "✅  Code updated."

# --- Step 3: Rebuild Docker Images ---
echo "🔄 [3/4] Rebuilding Docker images without cache..."
docker compose build --no-cache
echo "✅  Images rebuilt successfully."

# --- Step 4: Start Docker Containers ---
echo "🔄 [4/4] Starting Docker containers in detached mode..."
docker compose up -d
echo "✅  Containers started successfully."

echo " "
echo "🎉  Full redeployment finished successfully!"
echo " "
exit 0
