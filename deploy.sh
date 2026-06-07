#!/bin/bash
set -e

echo "📦 Pulling latest code..."
cd /mnt/easyvyapaar-webapp
git checkout -- .
git pull origin main

echo "📥 Installing dependencies..."
npm install

echo "🔨 Building Next.js..."
npm run build

echo "🔁 Restarting service..."
sudo systemctl restart easyvyapaar

echo "✅ Deployed successfully!"