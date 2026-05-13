#!/bin/bash

# Script to update code on server for all groups

set -e

echo "=== Updating Hangman Web Application ==="
echo ""

# Pull latest code
echo "Pulling latest code from git..."
git pull

# Install/update dependencies
echo "Installing/updating dependencies..."
npm install

echo ""
echo "=== Restarting services for all groups ==="
echo ""

# Restart all group services
for i in {1..4}; do
    echo "Restarting hangman-web-grupo$i..."
    sudo systemctl restart hangman-web-grupo$i

    # Check if service started successfully
    if sudo systemctl is-active --quiet hangman-web-grupo$i; then
        echo "✓ hangman-web-grupo$i restarted successfully"
    else
        echo "✗ hangman-web-grupo$i failed to restart"
        sudo systemctl status hangman-web-grupo$i
    fi
    echo ""
done

echo "=== Update Complete ==="
echo ""
echo "Checking status of all services:"
sudo systemctl status hangman-web-grupo{1..4} --no-pager | grep -E "(grupo[0-9]|Active:)"
