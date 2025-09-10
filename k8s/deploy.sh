#!/bin/bash

# DevOps Project Kubernetes Deployment Script
# This script deploys the entire application to Kubernetes

set -e

echo "🚀 Starting DevOps Project Kubernetes Deployment..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if kubectl can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster connection verified"

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Apply ConfigMaps
echo "⚙️  Applying ConfigMaps..."
kubectl apply -f configmaps.yaml

# Apply Secrets
echo "🔐 Applying Secrets..."
kubectl apply -f secrets.yaml

# Apply StatefulSet for PostgreSQL
echo "🗄️  Deploying PostgreSQL StatefulSet..."
kubectl apply -f statefulset.yaml

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n devops-app --timeout=300s

# Apply Deployments
echo "🚀 Deploying application services..."
kubectl apply -f deployments.yaml

# Apply Services
echo "🌐 Applying Services..."
kubectl apply -f services.yaml

# Apply Ingress
echo "🔗 Applying Ingress..."
kubectl apply -f ingress.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/backend -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/redis -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/nginx -n devops-app --timeout=300s

echo "✅ All deployments are ready!"

# Display deployment status
echo "📊 Deployment Status:"
echo "===================="
kubectl get pods -n devops-app
echo ""
kubectl get services -n devops-app
echo ""
kubectl get ingress -n devops-app

# Get service URLs
echo ""
echo "🌐 Access URLs:"
echo "==============="

# Get LoadBalancer IP (if available)
LB_IP=$(kubectl get service nginx-service -n devops-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -n "$LB_IP" ]; then
    echo "LoadBalancer IP: http://$LB_IP"
else
    echo "LoadBalancer IP: Not available (using NodePort or Port-Forward)"
fi

# Port forward instructions
echo ""
echo "🔧 To access the application locally:"
echo "kubectl port-forward service/nginx-service 8080:80 -n devops-app"
echo "Then open: http://localhost:8080"

echo ""
echo "🎉 Deployment completed successfully!"
echo "📝 Check the status with: kubectl get all -n devops-app"
