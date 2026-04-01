#!/bin/bash

# Build script for Doctors Farms - Frontend + Backend

echo "🏗️  Building Doctors Farms Application..."

# Build the React frontend
echo "📦 Building React frontend..."
cd ..
npm run build

# Copy build files to Spring Boot static directory
echo "📋 Copying frontend build to Spring Boot..."
mkdir -p whatsapp-backend/src/main/resources/static/dist
cp -r dist/* whatsapp-backend/src/main/resources/static/dist/

echo "✅ Build complete!"
echo ""
echo "🚀 To run the Spring Boot backend:"
echo "   cd whatsapp-backend"
echo "   mvn spring-boot:run -Dspring-boot.run.profiles=dev"
echo ""
echo "🌐 Frontend will be available at: http://localhost:8080"
echo "🔧 API will be available at: http://localhost:8080/api/"