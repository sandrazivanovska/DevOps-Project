#!/bin/bash

# Test script for CI/CD pipeline
echo "🚀 Testing CI/CD Pipeline Setup"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check if GitHub Actions workflow exists
if [ ! -f ".github/workflows/ci-cd.yml" ]; then
    echo "❌ GitHub Actions workflow not found"
    exit 1
fi

# Check if Dockerfiles exist
echo "🔍 Checking Dockerfiles..."
for service in backend frontend nginx; do
    if [ -f "$service/Dockerfile" ]; then
        echo "✅ $service/Dockerfile exists"
    else
        echo "❌ $service/Dockerfile missing"
    fi
done

# Check if package.json files exist
echo "🔍 Checking package.json files..."
for service in backend frontend; do
    if [ -f "$service/package.json" ]; then
        echo "✅ $service/package.json exists"
    else
        echo "❌ $service/package.json missing"
    fi
done

# Check if docker-compose.yml exists
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml exists"
else
    echo "❌ docker-compose.yml missing"
fi

# Check if .dockerignore exists
if [ -f ".dockerignore" ]; then
    echo "✅ .dockerignore exists"
else
    echo "❌ .dockerignore missing"
fi

echo "🎉 Pipeline setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Push this code to GitHub"
echo "2. Set up GitHub Secrets (DOCKER_USERNAME, DOCKER_PASSWORD)"
echo "3. Watch the pipeline run in GitHub Actions"
