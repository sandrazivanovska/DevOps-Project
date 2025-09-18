#!/bin/bash

# Verification Script for Kubernetes Deployment
echo "🔍 Verifying DevOps Project Deployment..."

# Check namespace
echo "📋 Checking namespace..."
kubectl get namespace devops-app

# Check all resources
echo ""
echo "📦 Checking all resources..."
kubectl get all -n devops-app

# Check ConfigMaps
echo ""
echo "🔧 Checking ConfigMaps..."
kubectl get configmaps -n devops-app

# Check Secrets
echo ""
echo "🔐 Checking Secrets..."
kubectl get secrets -n devops-app

# Check StatefulSet
echo ""
echo "🗄️ Checking StatefulSet..."
kubectl get statefulset -n devops-app

# Check pod logs
echo ""
echo "📝 Checking pod logs..."
echo "Backend logs:"
kubectl logs -l app=backend -n devops-app --tail=10

echo ""
echo "Frontend logs:"
kubectl logs -l app=frontend -n devops-app --tail=10

echo ""
echo "MongoDB logs:"
kubectl logs -l app=mongodb -n devops-app --tail=10

# Check service endpoints
echo ""
echo "🌐 Checking service endpoints..."
kubectl get endpoints -n devops-app

# Test connectivity
echo ""
echo "🔗 Testing internal connectivity..."
kubectl run test-pod --image=busybox --rm -it --restart=Never -- nslookup backend-service.devops-app.svc.cluster.local

echo ""
echo "✅ Verification completed!"
echo ""
echo "To access your application:"
echo "1. Port forward: kubectl port-forward service/nginx-service 8080:80 -n devops-app"
echo "2. Visit: http://localhost:8080"




