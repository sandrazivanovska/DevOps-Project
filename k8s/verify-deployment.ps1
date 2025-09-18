# PowerShell script to verify Kubernetes deployment
Write-Host "🔍 Verifying DevOps Project Deployment..." -ForegroundColor Green

# Check namespace
Write-Host "📋 Checking namespace..." -ForegroundColor Yellow
kubectl get namespace devops-app

# Check all resources
Write-Host ""
Write-Host "📦 Checking all resources..." -ForegroundColor Yellow
kubectl get all -n devops-app

# Check ConfigMaps
Write-Host ""
Write-Host "🔧 Checking ConfigMaps..." -ForegroundColor Yellow
kubectl get configmaps -n devops-app

# Check Secrets
Write-Host ""
Write-Host "🔐 Checking Secrets..." -ForegroundColor Yellow
kubectl get secrets -n devops-app

# Check StatefulSet
Write-Host ""
Write-Host "🗄️ Checking StatefulSet..." -ForegroundColor Yellow
kubectl get statefulset -n devops-app

# Check pod logs
Write-Host ""
Write-Host "📝 Checking pod logs..." -ForegroundColor Yellow
Write-Host "Backend logs:" -ForegroundColor Cyan
kubectl logs -l app=backend -n devops-app --tail=10

Write-Host ""
Write-Host "Frontend logs:" -ForegroundColor Cyan
kubectl logs -l app=frontend -n devops-app --tail=10

Write-Host ""
Write-Host "MongoDB logs:" -ForegroundColor Cyan
kubectl logs -l app=mongodb -n devops-app --tail=10

# Check service endpoints
Write-Host ""
Write-Host "🌐 Checking service endpoints..." -ForegroundColor Yellow
kubectl get endpoints -n devops-app

# Test connectivity
Write-Host ""
Write-Host "🔗 Testing internal connectivity..." -ForegroundColor Yellow
Write-Host "Testing DNS resolution..." -ForegroundColor Cyan
kubectl run test-pod --image=busybox --rm -it --restart=Never -- nslookup backend-service.devops-app.svc.cluster.local

Write-Host ""
Write-Host "✅ Verification completed!" -ForegroundColor Green
Write-Host ""
Write-Host "To access your application:" -ForegroundColor Cyan
Write-Host "1. Port forward: kubectl port-forward service/nginx-service 8080:80 -n devops-app" -ForegroundColor Yellow
Write-Host "2. Visit: http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "To check logs:" -ForegroundColor Cyan
Write-Host "kubectl logs -f deployment/backend -n devops-app" -ForegroundColor Yellow
Write-Host "kubectl logs -f deployment/frontend -n devops-app" -ForegroundColor Yellow
Write-Host "kubectl logs -f statefulset/mongodb -n devops-app" -ForegroundColor Yellow