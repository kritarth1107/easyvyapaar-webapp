#!/bin/bash
set -e

echo "📦 Pulling latest code...."
cd /mnt/easyvyapaar-webapp
git pull origin main

echo "📥 Installing dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "🔁 Restarting service..."
sudo systemctl restart easyvyapaar

echo "✅ Deployed successfully!"