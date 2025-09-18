# 🚀 AWS EKS Deployment Guide

This guide will walk you through deploying your DevOps project to Amazon EKS (Elastic Kubernetes Service).

## 📋 Prerequisites

### 1. AWS Account Setup
- [ ] AWS Account created and verified
- [ ] AWS CLI v2 installed
- [ ] Docker Desktop running
- [ ] kubectl installed
- [ ] eksctl installed

### 2. Required Tools Installation

#### Windows (PowerShell)
```powershell
# Install AWS CLI
winget install Amazon.AWSCLI

# Install eksctl
choco install eksctl

# Install kubectl
choco install kubernetes-cli
```

#### macOS
```bash
# Install AWS CLI
brew install awscli

# Install eksctl
brew install eksctl

# Install kubectl
brew install kubectl
```

#### Linux
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

## 🔧 AWS Configuration

### 1. Configure AWS CLI
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (`json`)

### 2. Verify Configuration
```bash
aws sts get-caller-identity
```

## 🏗️ EKS Cluster Creation

### Option 1: Using eksctl (Recommended)
```bash
eksctl create cluster \
  --name devops-cluster \
  --region us-east-1 \
  --nodegroup-name devops-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed
```

### Option 2: Using AWS Console
1. Go to EKS service in AWS Console
2. Click "Create cluster"
3. Configure cluster settings
4. Create node group

## 🚀 Automated Deployment

### Quick Deployment (PowerShell)
```powershell
# Replace <YOUR_AWS_ACCOUNT_ID> with your actual AWS account ID
.\deploy-to-aws.ps1 -AWSAccountId <YOUR_AWS_ACCOUNT_ID>
```

### Manual Deployment Steps

#### 1. Update kubeconfig
```bash
aws eks update-kubeconfig --region us-east-1 --name devops-cluster
```

#### 2. Create ECR Repositories
```bash
aws ecr create-repository --repository-name devops-project-backend --region us-east-1
aws ecr create-repository --repository-name devops-project-frontend --region us-east-1
```

#### 3. Build and Push Images
```bash
# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t devops-project-backend ../backend
docker tag devops-project-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-project-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-project-backend:latest

# Build and push frontend
docker build -t devops-project-frontend ../frontend
docker tag devops-project-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-project-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/devops-project-frontend:latest
```

#### 4. Update Deployment Files
Replace `<ACCOUNT_ID>` in `aws-deployments.yaml` with your AWS account ID.

#### 5. Deploy to Kubernetes
```bash
# Create namespace
kubectl apply -f aws-namespace.yaml

# Create secrets
kubectl apply -f aws-secrets.yaml

# Create configmaps
kubectl apply -f aws-configmaps.yaml

# Deploy MongoDB
kubectl apply -f aws-mongodb.yaml

# Wait for MongoDB
kubectl wait --for=condition=ready pod -l app=mongodb -n devops-app --timeout=300s

# Deploy other services
kubectl apply -f aws-deployments.yaml
kubectl apply -f aws-services.yaml
```

## 🔍 Verification

### Check Pod Status
```bash
kubectl get pods -n devops-app
```

### Check Services
```bash
kubectl get services -n devops-app
```

### Get LoadBalancer URL
```bash
kubectl get service nginx-service -n devops-app
```

## 🌐 Accessing Your Application

### LoadBalancer URL
Your application will be available at the LoadBalancer URL provided by AWS:
```bash
kubectl get service nginx-service -n devops-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### Port Forwarding (Alternative)
```bash
kubectl port-forward service/nginx-service 8080:80 -n devops-app
```
Then access at `http://localhost:8080`

## 📊 Monitoring

### View Logs
```bash
# Backend logs
kubectl logs -l app=backend -n devops-app

# Frontend logs
kubectl logs -l app=frontend -n devops-app

# MongoDB logs
kubectl logs -l app=mongodb -n devops-app
```

### Scale Services
```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n devops-app

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n devops-app
```

## 💰 Cost Optimization

### Use Spot Instances
```bash
eksctl create nodegroup \
  --cluster=devops-cluster \
  --name=spot-nodes \
  --node-type=t3.medium \
  --nodes=2 \
  --spot=true
```

### Auto Scaling
```bash
kubectl autoscale deployment backend --cpu-percent=70 --min=1 --max=5 -n devops-app
```

## 🧹 Cleanup

### Delete EKS Cluster
```bash
eksctl delete cluster --name devops-cluster --region us-east-1
```

### Delete ECR Repositories
```bash
aws ecr delete-repository --repository-name devops-project-backend --region us-east-1 --force
aws ecr delete-repository --repository-name devops-project-frontend --region us-east-1 --force
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Pod Stuck in Pending
```bash
kubectl describe pod <pod-name> -n devops-app
```

#### 2. Image Pull Errors
```bash
kubectl describe pod <pod-name> -n devops-app
# Check if ECR permissions are correct
```

#### 3. LoadBalancer Not Available
```bash
kubectl get service nginx-service -n devops-app
# Wait a few minutes for AWS to provision the LoadBalancer
```

#### 4. MongoDB Connection Issues
```bash
kubectl logs -l app=mongodb -n devops-app
kubectl logs -l app=backend -n devops-app
```

### Useful Commands
```bash
# Get all resources
kubectl get all -n devops-app

# Describe a resource
kubectl describe <resource-type> <resource-name> -n devops-app

# Edit a resource
kubectl edit <resource-type> <resource-name> -n devops-app

# Delete a resource
kubectl delete <resource-type> <resource-name> -n devops-app
```

## 📚 Additional Resources

- [EKS Documentation](https://docs.aws.amazon.com/eks/)
- [eksctl Documentation](https://eksctl.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)

## 🎯 Next Steps

1. **Set up CI/CD**: Use GitHub Actions with AWS
2. **Add monitoring**: Integrate with CloudWatch
3. **Implement security**: Use AWS IAM roles
4. **Add SSL/TLS**: Use AWS Certificate Manager
5. **Set up backups**: Configure MongoDB backups
6. **Implement logging**: Use AWS CloudWatch Logs

---

**🎉 Congratulations! Your DevOps project is now running on AWS EKS!**
