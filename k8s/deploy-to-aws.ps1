# AWS EKS Deployment Script for DevOps Project
# This script deploys the DevOps project to Amazon EKS

param(
    [Parameter(Mandatory=$true)]
    [string]$AWSAccountId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$ClusterName = "devops-cluster"
)

Write-Host "🚀 Starting AWS EKS Deployment..." -ForegroundColor Green

# Step 1: Verify AWS CLI is configured
Write-Host "📋 Step 1: Verifying AWS CLI configuration..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ AWS CLI configured. Account: $($awsIdentity.Account)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Step 2: Check if EKS cluster exists
Write-Host "📋 Step 2: Checking EKS cluster..." -ForegroundColor Yellow
try {
    $clusterExists = aws eks describe-cluster --name $ClusterName --region $Region --output json | ConvertFrom-Json
    Write-Host "✅ EKS cluster '$ClusterName' found." -ForegroundColor Green
} catch {
    Write-Host "❌ EKS cluster '$ClusterName' not found. Please create it first with:" -ForegroundColor Red
    Write-Host "eksctl create cluster --name $ClusterName --region $Region --nodegroup-name devops-nodes --node-type t3.medium --nodes 2 --managed" -ForegroundColor Cyan
    exit 1
}

# Step 3: Update kubeconfig
Write-Host "📋 Step 3: Updating kubeconfig..." -ForegroundColor Yellow
aws eks update-kubeconfig --region $Region --name $ClusterName
Write-Host "✅ Kubeconfig updated." -ForegroundColor Green

# Step 4: Create ECR repositories
Write-Host "📋 Step 4: Creating ECR repositories..." -ForegroundColor Yellow
$repositories = @("devops-project-backend", "devops-project-frontend")

foreach ($repo in $repositories) {
    try {
        aws ecr describe-repositories --repository-names $repo --region $Region --output json | Out-Null
        Write-Host "✅ Repository '$repo' already exists." -ForegroundColor Green
    } catch {
        Write-Host "📦 Creating repository '$repo'..." -ForegroundColor Cyan
        aws ecr create-repository --repository-name $repo --region $Region
        Write-Host "✅ Repository '$repo' created." -ForegroundColor Green
    }
}

# Step 5: Build and push Docker images
Write-Host "📋 Step 5: Building and pushing Docker images..." -ForegroundColor Yellow

# Login to ECR
Write-Host "🔐 Logging into ECR..." -ForegroundColor Cyan
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AWSAccountId.dkr.ecr.$Region.amazonaws.com"

# Build and push backend
Write-Host "🏗️ Building backend image..." -ForegroundColor Cyan
docker build -t devops-project-backend ../backend
docker tag devops-project-backend:latest "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-project-backend:latest"
docker push "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-project-backend:latest"
Write-Host "✅ Backend image pushed." -ForegroundColor Green

# Build and push frontend
Write-Host "🏗️ Building frontend image..." -ForegroundColor Cyan
docker build -t devops-project-frontend ../frontend
docker tag devops-project-frontend:latest "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-project-frontend:latest"
docker push "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-project-frontend:latest"
Write-Host "✅ Frontend image pushed." -ForegroundColor Green

# Step 6: Update deployment files with actual AWS account ID
Write-Host "📋 Step 6: Updating deployment files..." -ForegroundColor Yellow
$deploymentFile = "aws-deployments.yaml"
$content = Get-Content $deploymentFile -Raw
$content = $content -replace "<ACCOUNT_ID>", $AWSAccountId
Set-Content $deploymentFile $content
Write-Host "✅ Deployment files updated." -ForegroundColor Green

# Step 7: Deploy to Kubernetes
Write-Host "📋 Step 7: Deploying to Kubernetes..." -ForegroundColor Yellow

# Create namespace
kubectl apply -f aws-namespace.yaml
Write-Host "✅ Namespace created." -ForegroundColor Green

# Create secrets
kubectl apply -f aws-secrets.yaml
Write-Host "✅ Secrets created." -ForegroundColor Green

# Create configmaps
kubectl apply -f aws-configmaps.yaml
Write-Host "✅ ConfigMaps created." -ForegroundColor Green

# Deploy MongoDB
kubectl apply -f aws-mongodb.yaml
Write-Host "✅ MongoDB deployed." -ForegroundColor Green

# Wait for MongoDB to be ready
Write-Host "⏳ Waiting for MongoDB to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=mongodb -n devops-app --timeout=300s

# Deploy other services
kubectl apply -f aws-deployments.yaml
kubectl apply -f aws-services.yaml
Write-Host "✅ All services deployed." -ForegroundColor Green

# Step 8: Wait for all pods to be ready
Write-Host "📋 Step 8: Waiting for all pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=backend -n devops-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n devops-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n devops-app --timeout=300s
kubectl wait --for=condition=ready pod -l app=nginx -n devops-app --timeout=300s

# Step 9: Get LoadBalancer URL
Write-Host "📋 Step 9: Getting LoadBalancer URL..." -ForegroundColor Yellow
$loadBalancerUrl = kubectl get service nginx-service -n devops-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
if ([string]::IsNullOrEmpty($loadBalancerUrl)) {
    Write-Host "⏳ LoadBalancer is still provisioning. This may take a few minutes..." -ForegroundColor Yellow
    Write-Host "Run this command to check: kubectl get service nginx-service -n devops-app" -ForegroundColor Cyan
} else {
    Write-Host "✅ LoadBalancer URL: http://$loadBalancerUrl" -ForegroundColor Green
}

# Step 10: Display deployment status
Write-Host "📋 Step 10: Deployment Status" -ForegroundColor Yellow
kubectl get pods -n devops-app
kubectl get services -n devops-app

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your application will be available at: http://$loadBalancerUrl" -ForegroundColor Cyan
Write-Host "📊 Monitor your deployment with: kubectl get pods -n devops-app" -ForegroundColor Cyan
