# CI/CD Setup Guide

This guide will help you set up a complete CI/CD pipeline for your DevOps project using GitHub Actions.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Docker Hub Account**: For storing Docker images
3. **Kubernetes Cluster** (Optional): For deployment (bonus points)

## Step 1: Set up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

### Required Secrets:
- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password or access token

### Optional Secrets (for Kubernetes deployment):
- `KUBE_CONFIG`: Base64 encoded kubeconfig file

## Step 2: Repository Structure

Your repository should have this structure:
```
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── backend/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
├── k8s/
│   ├── namespace.yaml
│   ├── configmaps.yaml
│   ├── secrets.yaml
│   ├── statefulset.yaml
│   ├── deployments.yaml
│   ├── services.yaml
│   └── ingress.yaml
├── docker-compose.yml
└── .dockerignore
```

## Step 3: Pipeline Overview

The CI/CD pipeline has 3 main jobs:

### 1. CI Job (Continuous Integration)
- **Triggers**: Push to main/develop, Pull requests
- **Actions**:
  - Checkout code
  - Install dependencies
  - Run tests
  - Build frontend

### 2. CD Job (Continuous Deployment)
- **Triggers**: Push to main/develop branches
- **Actions**:
  - Build Docker images
  - Push to Docker Hub
  - Tag images appropriately

### 3. Deploy Job (Optional - Bonus Points)
- **Triggers**: Push to main branch only
- **Actions**:
  - Deploy to Kubernetes
  - Verify deployment

## Step 4: Docker Hub Setup

1. **Create Docker Hub Account**: https://hub.docker.com
2. **Create Repository**: Create repositories for:
   - `your-username/devops-project-backend`
   - `your-username/devops-project-frontend`
   - `your-username/devops-project-nginx`

## Step 5: Testing the Pipeline

1. **Push to develop branch**:
   ```bash
   git add .
   git commit -m "Add CI/CD pipeline"
   git push origin develop
   ```

2. **Check GitHub Actions**:
   - Go to your repository
   - Click on "Actions" tab
   - Watch the pipeline run

3. **Verify Docker Hub**:
   - Check your Docker Hub repositories
   - Images should be pushed with appropriate tags

## Step 6: Kubernetes Deployment (Bonus)

If you want to deploy to Kubernetes:

1. **Set up Kubernetes cluster** (local or cloud)
2. **Get kubeconfig file**
3. **Encode kubeconfig**:
   ```bash
   cat ~/.kube/config | base64 -w 0
   ```
4. **Add KUBE_CONFIG secret** in GitHub
5. **Push to main branch** to trigger deployment

## Pipeline Features

### ✅ CI Features:
- Automated testing
- Code quality checks
- Build verification
- Multi-environment support

### ✅ CD Features:
- Automated Docker image building
- Multi-architecture support
- Semantic versioning
- Registry publishing

### ✅ Deployment Features:
- Kubernetes deployment
- Health checks
- Rollback capability
- Environment-specific configs

## Troubleshooting

### Common Issues:

1. **Docker Hub Authentication**:
   - Use access token instead of password
   - Check repository permissions

2. **Build Failures**:
   - Check Dockerfile syntax
   - Verify all dependencies are included

3. **Kubernetes Deployment**:
   - Verify kubeconfig is correct
   - Check cluster connectivity
   - Ensure manifests are valid

## Monitoring

- **GitHub Actions**: View pipeline status and logs
- **Docker Hub**: Monitor image builds and pushes
- **Kubernetes**: Check pod status and logs

## Next Steps

1. Set up the secrets in GitHub
2. Push your code to trigger the pipeline
3. Monitor the pipeline execution
4. Verify Docker images are pushed
5. (Optional) Set up Kubernetes deployment

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Ensure Docker Hub repositories exist
4. Check Kubernetes cluster connectivity
