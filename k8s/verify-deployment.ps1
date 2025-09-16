# DevOps Project - Kubernetes Deployment Verification
# This script verifies that all components are working correctly

Write-Host "🔍 DevOps Project - Deployment Verification" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Check namespace
Write-Host "`n📦 Checking namespace..." -ForegroundColor Yellow
kubectl get namespace devops-app

# Check all resources
Write-Host "`n📊 All resources in devops-app namespace:" -ForegroundColor Yellow
kubectl get all -n devops-app

# Check pod status
Write-Host "`n🔍 Pod status:" -ForegroundColor Yellow
kubectl get pods -n devops-app -o wide

# Check services
Write-Host "`n🌐 Services:" -ForegroundColor Yellow
kubectl get services -n devops-app

# Check ingress
Write-Host "`n🔗 Ingress:" -ForegroundColor Yellow
kubectl get ingress -n devops-app

# Check configmaps
Write-Host "`n⚙️  ConfigMaps:" -ForegroundColor Yellow
kubectl get configmaps -n devops-app

# Check secrets
Write-Host "`n🔐 Secrets:" -ForegroundColor Yellow
kubectl get secrets -n devops-app

# Test backend API
Write-Host "`n🧪 Testing Backend API..." -ForegroundColor Yellow
kubectl port-forward service/backend-service 5000:5000 -n devops-app &
$backendJob = Start-Job -ScriptBlock {
    Start-Sleep 3
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
        return "SUCCESS: $($response.message)"
    } catch {
        return "ERROR: $($_.Exception.Message)"
    }
}
Wait-Job $backendJob -Timeout 10
$backendResult = Receive-Job $backendJob
Remove-Job $backendJob
Stop-Process -Name "kubectl" -Force -ErrorAction SilentlyContinue
Write-Host "Backend API: $backendResult" -ForegroundColor $(if ($backendResult -like "SUCCESS*") { "Green" } else { "Red" })

# Test frontend
Write-Host "`n🧪 Testing Frontend..." -ForegroundColor Yellow
kubectl port-forward service/frontend-service 3000:3000 -n devops-app &
$frontendJob = Start-Job -ScriptBlock {
    Start-Sleep 3
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET
        return "SUCCESS: Status $($response.StatusCode)"
    } catch {
        return "ERROR: $($_.Exception.Message)"
    }
}
Wait-Job $frontendJob -Timeout 10
$frontendResult = Receive-Job $frontendJob
Remove-Job $frontendJob
Stop-Process -Name "kubectl" -Force -ErrorAction SilentlyContinue
Write-Host "Frontend: $frontendResult" -ForegroundColor $(if ($frontendResult -like "SUCCESS*") { "Green" } else { "Red" })

Write-Host "`n✅ Verification completed!" -ForegroundColor Green


