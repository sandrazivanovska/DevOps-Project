# DevOps Project - Kubernetes Deployment Demonstration
# This script demonstrates the complete deployment and verification

Write-Host "🚀 DevOps Project - Kubernetes Deployment Demo" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Step 1: Create namespace
Write-Host "`n📦 Step 1: Creating namespace 'devops-app'..." -ForegroundColor Yellow
kubectl apply -f namespace.yaml

# Step 2: Deploy ConfigMaps and Secrets
Write-Host "`n⚙️  Step 2: Deploying ConfigMaps and Secrets..." -ForegroundColor Yellow
kubectl apply -f configmaps.yaml
kubectl apply -f secrets.yaml

# Step 3: Deploy StatefulSet (Database)
Write-Host "`n🗄️  Step 3: Deploying PostgreSQL StatefulSet..." -ForegroundColor Yellow
kubectl apply -f statefulset.yaml

# Wait for database to be ready
Write-Host "`n⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=postgres -n devops-app --timeout=300s

# Step 4: Deploy Applications
Write-Host "`n🚀 Step 4: Deploying application services..." -ForegroundColor Yellow
kubectl apply -f deployments.yaml

# Step 5: Deploy Services
Write-Host "`n🌐 Step 5: Deploying Services..." -ForegroundColor Yellow
kubectl apply -f services.yaml

# Step 6: Deploy Ingress
Write-Host "`n🔗 Step 6: Deploying Ingress..." -ForegroundColor Yellow
kubectl apply -f ingress.yaml

# Wait for deployments
Write-Host "`n⏳ Waiting for all deployments to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available deployment/backend -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/redis -n devops-app --timeout=300s
kubectl wait --for=condition=available deployment/nginx -n devops-app --timeout=300s

Write-Host "`n✅ All deployments are ready!" -ForegroundColor Green

# Step 7: Show deployment status
Write-Host "`n📊 Step 7: Deployment Status" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Write-Host "`n🔍 Namespace:" -ForegroundColor White
kubectl get namespace devops-app

Write-Host "`n📦 Pods:" -ForegroundColor White
kubectl get pods -n devops-app

Write-Host "`n🌐 Services:" -ForegroundColor White
kubectl get services -n devops-app

Write-Host "`n🔗 Ingress:" -ForegroundColor White
kubectl get ingress -n devops-app

Write-Host "`n📋 ConfigMaps:" -ForegroundColor White
kubectl get configmaps -n devops-app

Write-Host "`n🔐 Secrets:" -ForegroundColor White
kubectl get secrets -n devops-app

# Step 8: Test the application
Write-Host "`n🧪 Step 8: Testing the Application" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host "`n🔍 Testing backend API..." -ForegroundColor White
kubectl port-forward service/backend-service 5000:5000 -n devops-app &
Start-Sleep 5
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    Write-Host "✅ Backend API is working: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Stop-Process -Name "kubectl" -Force -ErrorAction SilentlyContinue

Write-Host "`n🔍 Testing frontend..." -ForegroundColor White
kubectl port-forward service/frontend-service 3000:3000 -n devops-app &
Start-Sleep 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is working (Status: $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Stop-Process -Name "kubectl" -Force -ErrorAction SilentlyContinue

# Step 9: Show access information
Write-Host "`n🌐 Step 9: Access Information" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

Write-Host "`n📱 To access the application:" -ForegroundColor White
Write-Host "1. Port forward the nginx service:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward service/nginx-service 8080:80 -n devops-app" -ForegroundColor Gray
Write-Host "2. Open your browser and go to: http://localhost:8080" -ForegroundColor Yellow

Write-Host "`n🔧 Management Commands:" -ForegroundColor White
Write-Host "• View all resources: kubectl get all -n devops-app" -ForegroundColor Gray
Write-Host "• View logs: kubectl logs -f deployment/backend -n devops-app" -ForegroundColor Gray
Write-Host "• Scale services: kubectl scale deployment backend --replicas=3 -n devops-app" -ForegroundColor Gray
Write-Host "• Delete everything: kubectl delete namespace devops-app" -ForegroundColor Gray

Write-Host "`n🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your DevOps project is now running in Kubernetes!" -ForegroundColor Green






