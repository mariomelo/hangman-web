#!/bin/bash

# Script to update code on server for grupo0

set -e

echo "=== Updating Hangman Web Application (Grupo 0) ==="
echo ""

# Pull latest code
echo "Pulling latest code from git..."
git pull

# Install/update dependencies
echo "Installing/updating dependencies..."
npm install

echo ""
echo "=== Restarting service for grupo0 ==="
echo ""

echo "Restarting hangman-web-grupo0..."
sudo systemctl restart hangman-web-grupo0

# Check if service started successfully
if sudo systemctl is-active --quiet hangman-web-grupo0; then
    echo "✓ hangman-web-grupo0 restarted successfully"
else
    echo "✗ hangman-web-grupo0 failed to restart"
    sudo systemctl status hangman-web-grupo0
fi

echo ""
echo "=== Update Complete ==="
echo ""
echo "Service status:"
sudo systemctl status hangman-web-grupo0 --no-pager
