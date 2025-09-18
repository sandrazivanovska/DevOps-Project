# Docker on AWS ECS Deployment Script
# This script deploys the DevOps project to AWS using ECS Fargate

param(
    [Parameter(Mandatory=$true)]
    [string]$AWSAccountId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$ClusterName = "devops-cluster"
)

Write-Host "🐳 Starting Docker on AWS ECS Deployment..." -ForegroundColor Green

# Step 1: Verify AWS CLI is configured
Write-Host "📋 Step 1: Verifying AWS CLI configuration..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ AWS CLI configured. Account: $($awsIdentity.Account)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Step 2: Create ECR repositories
Write-Host "📋 Step 2: Creating ECR repositories..." -ForegroundColor Yellow
$repositories = @("devops-backend", "devops-frontend", "devops-nginx")

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

# Step 3: Create CloudWatch Log Groups
Write-Host "📋 Step 3: Creating CloudWatch Log Groups..." -ForegroundColor Yellow
$logGroups = @("/ecs/devops-backend", "/ecs/devops-frontend", "/ecs/devops-nginx", "/ecs/devops-mongodb", "/ecs/devops-redis")

foreach ($logGroup in $logGroups) {
    try {
        aws logs describe-log-groups --log-group-name-prefix $logGroup --region $Region --output json | ConvertFrom-Json | Select-Object -ExpandProperty logGroups | Where-Object { $_.logGroupName -eq $logGroup } | Out-Null
        Write-Host "✅ Log group '$logGroup' already exists." -ForegroundColor Green
    } catch {
        Write-Host "📝 Creating log group '$logGroup'..." -ForegroundColor Cyan
        aws logs create-log-group --log-group-name $logGroup --region $Region
        Write-Host "✅ Log group '$logGroup' created." -ForegroundColor Green
    }
}

# Step 4: Create ECS cluster
Write-Host "📋 Step 4: Creating ECS cluster..." -ForegroundColor Yellow
try {
    aws ecs describe-clusters --clusters $ClusterName --region $Region --output json | ConvertFrom-Json | Select-Object -ExpandProperty clusters | Where-Object { $_.clusterName -eq $ClusterName } | Out-Null
    Write-Host "✅ ECS cluster '$ClusterName' already exists." -ForegroundColor Green
} catch {
    Write-Host "🏗️ Creating ECS cluster '$ClusterName'..." -ForegroundColor Cyan
    aws ecs create-cluster --cluster-name $ClusterName --region $Region
    Write-Host "✅ ECS cluster '$ClusterName' created." -ForegroundColor Green
}

# Step 5: Build and push Docker images
Write-Host "📋 Step 5: Building and pushing Docker images..." -ForegroundColor Yellow

# Login to ECR
Write-Host "🔐 Logging into ECR..." -ForegroundColor Cyan
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AWSAccountId.dkr.ecr.$Region.amazonaws.com"

# Build and push backend
Write-Host "🏗️ Building backend image..." -ForegroundColor Cyan
docker build -t devops-backend ../backend
docker tag devops-backend:latest "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-backend:latest"
docker push "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-backend:latest"
Write-Host "✅ Backend image pushed." -ForegroundColor Green

# Build and push frontend
Write-Host "🏗️ Building frontend image..." -ForegroundColor Cyan
docker build -t devops-frontend ../frontend
docker tag devops-frontend:latest "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-frontend:latest"
docker push "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-frontend:latest"
Write-Host "✅ Frontend image pushed." -ForegroundColor Green

# Build and push nginx
Write-Host "🏗️ Building nginx image..." -ForegroundColor Cyan
docker build -t devops-nginx ../nginx
docker tag devops-nginx:latest "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-nginx:latest"
docker push "$AWSAccountId.dkr.ecr.$Region.amazonaws.com/devops-nginx:latest"
Write-Host "✅ Nginx image pushed." -ForegroundColor Green

# Step 6: Update task definition files
Write-Host "📋 Step 6: Updating task definition files..." -ForegroundColor Yellow
$taskFiles = @("ecs-backend-task.json", "ecs-frontend-task.json", "ecs-nginx-task.json", "ecs-mongodb-task.json", "ecs-redis-task.json")

foreach ($taskFile in $taskFiles) {
    $content = Get-Content $taskFile -Raw
    $content = $content -replace "<ACCOUNT_ID>", $AWSAccountId
    Set-Content $taskFile $content
}
Write-Host "✅ Task definition files updated." -ForegroundColor Green

# Step 7: Register task definitions
Write-Host "📋 Step 7: Registering task definitions..." -ForegroundColor Yellow

# Register backend task
aws ecs register-task-definition --cli-input-json file://ecs-backend-task.json --region $Region
Write-Host "✅ Backend task definition registered." -ForegroundColor Green

# Register frontend task
aws ecs register-task-definition --cli-input-json file://ecs-frontend-task.json --region $Region
Write-Host "✅ Frontend task definition registered." -ForegroundColor Green

# Register nginx task
aws ecs register-task-definition --cli-input-json file://ecs-nginx-task.json --region $Region
Write-Host "✅ Nginx task definition registered." -ForegroundColor Green

# Register mongodb task
aws ecs register-task-definition --cli-input-json file://ecs-mongodb-task.json --region $Region
Write-Host "✅ MongoDB task definition registered." -ForegroundColor Green

# Register redis task
aws ecs register-task-definition --cli-input-json file://ecs-redis-task.json --region $Region
Write-Host "✅ Redis task definition registered." -ForegroundColor Green

# Step 8: Get VPC and Subnet information
Write-Host "📋 Step 8: Getting VPC and Subnet information..." -ForegroundColor Yellow
$vpcInfo = aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $Region --output json | ConvertFrom-Json
$subnetInfo = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$($vpcInfo.Vpcs[0].VpcId)" --region $Region --output json | ConvertFrom-Json
$securityGroupInfo = aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$($vpcInfo.Vpcs[0].VpcId)" "Name=group-name,Values=default" --region $Region --output json | ConvertFrom-Json

$vpcId = $vpcInfo.Vpcs[0].VpcId
$subnetId = $subnetInfo.Subnets[0].SubnetId
$securityGroupId = $securityGroupInfo.SecurityGroups[0].GroupId

Write-Host "✅ VPC: $vpcId, Subnet: $subnetId, Security Group: $securityGroupId" -ForegroundColor Green

# Step 9: Create ECS services
Write-Host "📋 Step 9: Creating ECS services..." -ForegroundColor Yellow

# Create MongoDB service
aws ecs create-service `
  --cluster $ClusterName `
  --service-name devops-mongodb `
  --task-definition devops-mongodb-task `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$subnetId],securityGroups=[$securityGroupId],assignPublicIp=ENABLED}" `
  --region $Region
Write-Host "✅ MongoDB service created." -ForegroundColor Green

# Wait for MongoDB to be running
Write-Host "⏳ Waiting for MongoDB to be running..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Create Redis service
aws ecs create-service `
  --cluster $ClusterName `
  --service-name devops-redis `
  --task-definition devops-redis-task `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$subnetId],securityGroups=[$securityGroupId],assignPublicIp=ENABLED}" `
  --region $Region
Write-Host "✅ Redis service created." -ForegroundColor Green

# Wait for Redis to be running
Write-Host "⏳ Waiting for Redis to be running..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Create Backend service
aws ecs create-service `
  --cluster $ClusterName `
  --service-name devops-backend `
  --task-definition devops-backend-task `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$subnetId],securityGroups=[$securityGroupId],assignPublicIp=ENABLED}" `
  --region $Region
Write-Host "✅ Backend service created." -ForegroundColor Green

# Wait for Backend to be running
Write-Host "⏳ Waiting for Backend to be running..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Create Frontend service
aws ecs create-service `
  --cluster $ClusterName `
  --service-name devops-frontend `
  --task-definition devops-frontend-task `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$subnetId],securityGroups=[$securityGroupId],assignPublicIp=ENABLED}" `
  --region $Region
Write-Host "✅ Frontend service created." -ForegroundColor Green

# Wait for Frontend to be running
Write-Host "⏳ Waiting for Frontend to be running..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Create Nginx service
aws ecs create-service `
  --cluster $ClusterName `
  --service-name devops-nginx `
  --task-definition devops-nginx-task `
  --desired-count 1 `
  --launch-type FARGATE `
  --network-configuration "awsvpcConfiguration={subnets=[$subnetId],securityGroups=[$securityGroupId],assignPublicIp=ENABLED}" `
  --region $Region
Write-Host "✅ Nginx service created." -ForegroundColor Green

# Step 10: Display deployment status
Write-Host "📋 Step 10: Deployment Status" -ForegroundColor Yellow
aws ecs list-services --cluster $ClusterName --region $Region
aws ecs list-tasks --cluster $ClusterName --region $Region

Write-Host "🎉 Docker on AWS ECS deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Check your ECS console to see running services: https://console.aws.amazon.com/ecs/home?region=$Region#/clusters/$ClusterName/services" -ForegroundColor Cyan
Write-Host "📊 Monitor your deployment with: aws ecs list-services --cluster $ClusterName --region $Region" -ForegroundColor Cyan
