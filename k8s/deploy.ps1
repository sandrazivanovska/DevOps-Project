# DevOps Project Kubernetes Deployment Script (PowerShell)
# This script deploys the entire application to Kubernetes

Write-Host "🚀 Starting DevOps Project Kubernetes Deployment..." -ForegroundColor Green

# Check if kubectl is installed
try {
    kubectl version --client | Out-Null
    Write-Host "✅ kubectl is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl is not installed. Please install kubectl first." -ForegroundColor Red
    exit 1
}

# Check if kubectl can connect to cluster
try {
    kubectl cluster-info | Out-Null
    Write-Host "✅ Kubernetes cluster connection verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig." -ForegroundColor Red
    exit 1
}

# Create namespace
Write-Host "📦 Creating namespace..." -ForegroundColor Yellow
kubectl apply -f namespace.yaml

# Apply ConfigMaps
Write-Host "⚙️  Applying ConfigMaps..." -ForegroundColor Yellow
kubectl apply -f configmaps.yaml

# Apply Secrets
Write-Host "🔐 Applying Secrets..." -ForegroundColor Yellow
kubectl apply -f secrets.yaml

# Apply StatefulSet for PostgreSQL
Write-Host "🗄️  Deploying PostgreSQL StatefulSet..." -ForegroundColor Yellow
kubectl apply -f statefulset.yaml

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres -n devops-app --timeout=300s

# Apply Deployments
Write-Host "🚀 Deploying application services..." -ForegroundColor Yellow
kubectl apply -f deployments.yaml

# Apply Services
Write-Host "🌐 Applying Services..." -ForegroundColor Yellow
kubectl apply -f services.yaml

# Apply Ingress
Write-Host "🔗 Applying Ingress..." -ForegroundColor Yellow
kubectl apply -f ingress.yaml

# Wait for deployments to be ready
Write-Host "⏳ Waiting for deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available deployment/backend -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/redis -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/nginx -n devops-app --timeout=300s

Write-Host "✅ All deployments are ready!" -ForegroundColor Green

# Display deployment status
Write-Host "📊 Deployment Status:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
kubectl get pods -n devops-app
Write-Host ""
kubectl get services -n devops-app
Write-Host ""
kubectl get ingress -n devops-app

# Get service URLs
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

# Get LoadBalancer IP (if available)
$LB_IP = kubectl get service nginx-service -n devops-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
if ($LB_IP) {
    Write-Host "LoadBalancer IP: http://$LB_IP" -ForegroundColor Green
} else {
    Write-Host "LoadBalancer IP: Not available (using NodePort or Port-Forward)" -ForegroundColor Yellow
}

# Port forward instructions
Write-Host ""
Write-Host "🔧 To access the application locally:" -ForegroundColor Cyan
Write-Host "kubectl port-forward service/nginx-service 8080:80 -n devops-app" -ForegroundColor White
Write-Host "Then open: http://localhost:8080" -ForegroundColor White

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📝 Check the status with: kubectl get all -n devops-app" -ForegroundColor Cyan
