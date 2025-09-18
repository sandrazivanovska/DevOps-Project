# PowerShell script to set up local Kubernetes cluster for DevOps Project demo
# This script sets up a local Kubernetes cluster using Docker Desktop or minikube

Write-Host "🚀 Setting up Kubernetes cluster for DevOps Project demo..." -ForegroundColor Green

# Check if Docker Desktop is running
Write-Host "📋 Checking Docker Desktop..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not installed or not running. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if kubectl is installed
Write-Host "📋 Checking kubectl..." -ForegroundColor Yellow
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    Write-Host "✅ kubectl is installed" -ForegroundColor Green
} else {
    Write-Host "❌ kubectl is not installed. Please install kubectl first." -ForegroundColor Red
    Write-Host "Download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/" -ForegroundColor Yellow
    exit 1
}

# Check if minikube is installed
Write-Host "📋 Checking minikube..." -ForegroundColor Yellow
if (Get-Command minikube -ErrorAction SilentlyContinue) {
    Write-Host "✅ minikube is installed" -ForegroundColor Green
    
    # Start minikube if not running
    Write-Host "🚀 Starting minikube cluster..." -ForegroundColor Yellow
    minikube start --driver=docker --memory=4096 --cpus=2
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Minikube cluster started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start minikube cluster" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  minikube is not installed. Using Docker Desktop Kubernetes instead..." -ForegroundColor Yellow
    
    # Check if Docker Desktop Kubernetes is enabled
    Write-Host "📋 Checking Docker Desktop Kubernetes..." -ForegroundColor Yellow
    $kubectlContext = kubectl config current-context
    if ($kubectlContext -like "*docker-desktop*") {
        Write-Host "✅ Docker Desktop Kubernetes is available" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker Desktop Kubernetes is not enabled. Please enable it in Docker Desktop settings." -ForegroundColor Red
        Write-Host "Go to Docker Desktop > Settings > Kubernetes > Enable Kubernetes" -ForegroundColor Yellow
        exit 1
    }
}

# Verify cluster is accessible
Write-Host "📋 Verifying cluster connectivity..." -ForegroundColor Yellow
kubectl cluster-info
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cluster is accessible" -ForegroundColor Green
} else {
    Write-Host "❌ Cannot connect to cluster" -ForegroundColor Red
    exit 1
}

# Deploy the application
Write-Host "🚀 Deploying DevOps Project to Kubernetes..." -ForegroundColor Green
Write-Host "📦 Creating namespace..." -ForegroundColor Yellow
kubectl apply -f namespace.yaml

Write-Host "🔧 Creating ConfigMaps..." -ForegroundColor Yellow
kubectl apply -f configmaps.yaml

Write-Host "🔐 Creating Secrets..." -ForegroundColor Yellow
kubectl apply -f secrets.yaml

Write-Host "🗄️ Creating StatefulSet for MongoDB..." -ForegroundColor Yellow
kubectl apply -f statefulset.yaml

Write-Host "⏳ Waiting for MongoDB to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=mongodb -n devops-app --timeout=300s

Write-Host "🚀 Creating Deployments..." -ForegroundColor Yellow
kubectl apply -f deployments.yaml

Write-Host "🌐 Creating Services..." -ForegroundColor Yellow
kubectl apply -f services.yaml

Write-Host "🔗 Creating Ingress..." -ForegroundColor Yellow
kubectl apply -f ingress.yaml

Write-Host "⏳ Waiting for all pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend -n devops-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n devops-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=nginx -n devops-app --timeout=300s

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Status:" -ForegroundColor Cyan
kubectl get pods -n devops-app
Write-Host ""
kubectl get services -n devops-app
Write-Host ""
kubectl get ingress -n devops-app

Write-Host ""
Write-Host "🌐 Access your application:" -ForegroundColor Green
Write-Host "1. Port forward: kubectl port-forward service/nginx-service 8080:80 -n devops-app" -ForegroundColor Yellow
Write-Host "2. Visit: http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 To verify deployment, run: .\verify-deployment.ps1" -ForegroundColor Cyan
