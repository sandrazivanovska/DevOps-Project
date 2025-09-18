# 🐳 Docker on AWS - Simple Deployment Guide

This guide will deploy your DevOps project to AWS using Docker containers with ECS Fargate - much simpler than Kubernetes!

## 🎯 **Why Docker on AWS?**

- ✅ **Easier Setup**: No Kubernetes complexity
- ✅ **Serverless**: No server management
- ✅ **Cost Effective**: Pay only for running containers
- ✅ **Quick Deployment**: Deploy in 15-30 minutes
- ✅ **AWS Managed**: Automatic scaling and health checks

## 📋 **Prerequisites**

- AWS Account
- AWS CLI installed and configured
- Docker Desktop running
- Your application already working locally

## 🚀 **Step-by-Step Deployment**

### **Step 1: Create ECR Repositories**

```bash
# Create repositories for your images
aws ecr create-repository --repository-name devops-backend --region us-east-1
aws ecr create-repository --repository-name devops-frontend --region us-east-1
aws ecr create-repository --repository-name devops-nginx --region us-east-1
```

### **Step 2: Build and Push Images**

```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t devops-backend ../backend
docker tag devops-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-backend:latest

# Build and push frontend
docker build -t devops-frontend ../frontend
docker tag devops-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-frontend:latest

# Build and push nginx
docker build -t devops-nginx ../nginx
docker tag devops-nginx:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-nginx:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-nginx:latest
```

### **Step 3: Create ECS Cluster**

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name devops-cluster --region us-east-1
```

### **Step 4: Create Task Definitions**

Create task definition files for each service.

### **Step 5: Create ECS Services**

```bash
# Create backend service
aws ecs create-service \
  --cluster devops-cluster \
  --service-name devops-backend \
  --task-definition devops-backend-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"

# Create frontend service
aws ecs create-service \
  --cluster devops-cluster \
  --service-name devops-frontend \
  --task-definition devops-frontend-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"

# Create nginx service
aws ecs create-service \
  --cluster devops-cluster \
  --service-name devops-nginx \
  --task-definition devops-nginx-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
```

## 🌐 **Access Your Application**

Your application will be accessible via the Application Load Balancer URL.

## 💰 **Cost Estimate**

- **ECS Fargate**: ~$30-50/month
- **Application Load Balancer**: ~$16/month
- **ECR Storage**: ~$5/month
- **Total**: ~$50-70/month

## 🎯 **Benefits of This Approach**

1. **Simple**: No Kubernetes complexity
2. **Managed**: AWS handles infrastructure
3. **Scalable**: Auto-scaling based on CPU/memory
4. **Secure**: Built-in security groups and IAM
5. **Cost Effective**: Pay only for what you use

## 🧹 **Cleanup**

```bash
# Delete services
aws ecs delete-service --cluster devops-cluster --service devops-backend --force
aws ecs delete-service --cluster devops-cluster --service devops-frontend --force
aws ecs delete-service --cluster devops-cluster --service devops-nginx --force

# Delete cluster
aws ecs delete-cluster --cluster devops-cluster

# Delete ECR repositories
aws ecr delete-repository --repository-name devops-backend --force
aws ecr delete-repository --repository-name devops-frontend --force
aws ecr delete-repository --repository-name devops-nginx --force
```

---

**🎉 Your DevOps project is now running on AWS with Docker!**
