# AWS Resources Setup Script
# This script creates the necessary AWS resources for ECS deployment

param(
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "🔧 Setting up AWS resources for ECS deployment..." -ForegroundColor Green

# Step 1: Create IAM roles for ECS
Write-Host "📋 Step 1: Creating IAM roles..." -ForegroundColor Yellow

# ECS Task Execution Role
$taskExecutionRolePolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
"@

$taskExecutionRolePolicy | Out-File -FilePath "ecs-task-execution-role-policy.json" -Encoding UTF8

try {
    aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file://ecs-task-execution-role-policy.json --region $Region
    Write-Host "✅ ECS Task Execution Role created." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ ECS Task Execution Role already exists." -ForegroundColor Yellow
}

# Attach managed policy
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy --region $Region
Write-Host "✅ ECS Task Execution Role policy attached." -ForegroundColor Green

# ECS Task Role
$taskRolePolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
"@

$taskRolePolicy | Out-File -FilePath "ecs-task-role-policy.json" -Encoding UTF8

try {
    aws iam create-role --role-name ecsTaskRole --assume-role-policy-document file://ecs-task-role-policy.json --region $Region
    Write-Host "✅ ECS Task Role created." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ ECS Task Role already exists." -ForegroundColor Yellow
}

# Step 2: Create Secrets Manager secret for JWT
Write-Host "📋 Step 2: Creating Secrets Manager secret..." -ForegroundColor Yellow

$jwtSecret = "devops_jwt_secret_key_1234567890"
$secretValue = @{
    "JWT_SECRET" = $jwtSecret
} | ConvertTo-Json

try {
    aws secretsmanager create-secret --name "devops/jwt-secret" --description "JWT Secret for DevOps Project" --secret-string $secretValue --region $Region
    Write-Host "✅ JWT Secret created in Secrets Manager." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ JWT Secret already exists in Secrets Manager." -ForegroundColor Yellow
}

# Step 3: Create Application Load Balancer
Write-Host "📋 Step 3: Creating Application Load Balancer..." -ForegroundColor Yellow

# Get VPC information
$vpcInfo = aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $Region --output json | ConvertFrom-Json
$subnetInfo = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$($vpcInfo.Vpcs[0].VpcId)" --region $Region --output json | ConvertFrom-Json

$vpcId = $vpcInfo.Vpcs[0].VpcId
$subnetIds = $subnetInfo.Subnets | Select-Object -First 2 | ForEach-Object { $_.SubnetId }

Write-Host "VPC ID: $vpcId" -ForegroundColor Cyan
Write-Host "Subnet IDs: $($subnetIds -join ', ')" -ForegroundColor Cyan

# Create security group for ALB
$securityGroupName = "devops-alb-sg"
try {
    $sgInfo = aws ec2 create-security-group --group-name $securityGroupName --description "Security group for DevOps ALB" --vpc-id $vpcId --region $Region --output json | ConvertFrom-Json
    $albSecurityGroupId = $sgInfo.GroupId
    Write-Host "✅ ALB Security Group created: $albSecurityGroupId" -ForegroundColor Green
} catch {
    $sgInfo = aws ec2 describe-security-groups --filters "Name=group-name,Values=$securityGroupName" --region $Region --output json | ConvertFrom-Json
    $albSecurityGroupId = $sgInfo.SecurityGroups[0].GroupId
    Write-Host "ℹ️ ALB Security Group already exists: $albSecurityGroupId" -ForegroundColor Yellow
}

# Add inbound rules to ALB security group
aws ec2 authorize-security-group-ingress --group-id $albSecurityGroupId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region
aws ec2 authorize-security-group-ingress --group-id $albSecurityGroupId --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region
Write-Host "✅ ALB Security Group rules added." -ForegroundColor Green

# Create Application Load Balancer
$albName = "devops-alb"
try {
    $albInfo = aws elbv2 create-load-balancer --name $albName --subnets $subnetIds --security-groups $albSecurityGroupId --region $Region --output json | ConvertFrom-Json
    $albArn = $albInfo.LoadBalancers[0].LoadBalancerArn
    $albDnsName = $albInfo.LoadBalancers[0].DNSName
    Write-Host "✅ Application Load Balancer created: $albDnsName" -ForegroundColor Green
    Write-Host "🌐 ALB DNS Name: $albDnsName" -ForegroundColor Cyan
} catch {
    Write-Host "ℹ️ Application Load Balancer already exists." -ForegroundColor Yellow
}

# Step 4: Create Target Group
Write-Host "📋 Step 4: Creating Target Group..." -ForegroundColor Yellow

$targetGroupName = "devops-targets"
try {
    $tgInfo = aws elbv2 create-target-group --name $targetGroupName --protocol HTTP --port 80 --vpc-id $vpcId --target-type ip --health-check-path / --region $Region --output json | ConvertFrom-Json
    $targetGroupArn = $tgInfo.TargetGroups[0].TargetGroupArn
    Write-Host "✅ Target Group created: $targetGroupArn" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Target Group already exists." -ForegroundColor Yellow
}

# Step 5: Create Listener
Write-Host "📋 Step 5: Creating ALB Listener..." -ForegroundColor Yellow

try {
    aws elbv2 create-listener --load-balancer-arn $albArn --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$targetGroupArn --region $Region
    Write-Host "✅ ALB Listener created." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ ALB Listener already exists." -ForegroundColor Yellow
}

# Cleanup temporary files
Remove-Item "ecs-task-execution-role-policy.json" -ErrorAction SilentlyContinue
Remove-Item "ecs-task-role-policy.json" -ErrorAction SilentlyContinue

Write-Host "🎉 AWS resources setup completed successfully!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "  - ECS Task Execution Role: ecsTaskExecutionRole" -ForegroundColor Cyan
Write-Host "  - ECS Task Role: ecsTaskRole" -ForegroundColor Cyan
Write-Host "  - JWT Secret: devops/jwt-secret" -ForegroundColor Cyan
Write-Host "  - Application Load Balancer: $albName" -ForegroundColor Cyan
Write-Host "  - Target Group: $targetGroupName" -ForegroundColor Cyan
Write-Host "🌐 Your application will be accessible at: http://$albDnsName" -ForegroundColor Green
