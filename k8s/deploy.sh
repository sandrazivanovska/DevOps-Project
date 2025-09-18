#!/bin/bash

# Kubernetes Deployment Script for DevOps Project
echo "🚀 Deploying DevOps Project to Kubernetes..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"

# Apply manifests in order
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

echo "🔧 Creating ConfigMaps..."
kubectl apply -f configmaps.yaml

echo "🔐 Creating Secrets..."
kubectl apply -f secrets.yaml

echo "🗄️ Creating StatefulSet for MongoDB..."
kubectl apply -f statefulset.yaml

echo "⏳ Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n devops-app --timeout=300s

echo "🚀 Creating Deployments..."
kubectl apply -f deployments.yaml

echo "🌐 Creating Services..."
kubectl apply -f services.yaml

echo "🔗 Creating Ingress..."
kubectl apply -f ingress.yaml

echo "⏳ Waiting for all pods to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n devops-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n devops-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=nginx -n devops-app --timeout=300s

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Deployment Status:"
kubectl get pods -n devops-app
echo ""
kubectl get services -n devops-app
echo ""
kubectl get ingress -n devops-app

echo ""
echo "🌐 Access your application:"
echo "1. Add to /etc/hosts: <EXTERNAL-IP> devops-app.local"
echo "2. Visit: http://devops-app.local"
echo ""
echo "To get the external IP:"
echo "kubectl get service nginx-service -n devops-app"