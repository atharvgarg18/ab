#!/bin/bash

echo "🚀 Smart Timetable - Vercel Deployment Script"
echo "=============================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📦 Step 1: Deploying Backend..."
cd backend
echo "Setting up backend environment..."
vercel --prod

echo ""
echo "✅ Backend deployed!"
echo "📝 Please copy the backend URL and update frontend/.env"
read -p "Enter backend URL (e.g., https://your-backend.vercel.app): " BACKEND_URL

echo ""
echo "📦 Step 2: Deploying Frontend..."
cd ../frontend
echo "VITE_API_URL=$BACKEND_URL" > .env.production
vercel --prod

echo ""
echo "✅ Frontend deployed!"
echo ""
echo "🎉 Deployment complete!"
echo "Don't forget to set environment variables in Vercel Dashboard:"
echo "  - Backend: MONGODB_URI, GEMINI_API_KEY, PORT"
echo "  - Frontend: VITE_API_URL"
