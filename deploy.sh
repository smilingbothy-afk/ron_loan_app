#!/bin/bash

# Thinkific Alert App - Netlify Deployment Script

echo "🚀 Starting deployment to Netlify..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI is not installed. Installing now..."
    npm install -g netlify-cli
fi

# Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Netlify
echo "🌐 Deploying to Netlify..."
netlify deploy --prod --dir=build

if [ $? -eq 0 ]; then
    echo "🎉 Deployment completed successfully!"
    echo "📝 Don't forget to set your environment variables in Netlify:"
    echo "   - REACT_APP_GOOGLE_SHEETS_API_KEY"
    echo "   - REACT_APP_SPREADSHEET_ID"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
