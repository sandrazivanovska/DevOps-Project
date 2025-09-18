# Kubernetes Troubleshooting Guide

## Current Issue: k3d Connectivity Problems

The k3d clusters are being created successfully, but kubectl cannot connect to them. This is likely due to:

1. **Docker Desktop Configuration**: The `host.docker.internal` resolution might not be working properly
2. **Windows Networking**: Windows networking configuration might be blocking the connection
3. **Firewall**: Windows Firewall might be blocking the connection
4. **Docker Desktop Settings**: Kubernetes might not be properly enabled

## Solutions to Try

### Option 1: Fix Docker Desktop
1. Open Docker Desktop
2. Go to Settings > General
3. Ensure "Use the WSL 2 based engine" is checked
4. Go to Settings > Resources > Network
5. Try changing the network adapter

### Option 2: Use Different Ports
```bash
k3d cluster create devops-cluster --port "8081:80@loadbalancer" --port "8444:443@loadbalancer" --agents 2
```

### Option 3: Use minikube Instead
1. Install minikube: https://minikube.sigs.k8s.io/docs/start/
2. Start cluster: `minikube start`
3. Deploy: `kubectl apply -f k8s/`

### Option 4: Use Docker Desktop Kubernetes
1. Enable Kubernetes in Docker Desktop settings
2. Switch context: `kubectl config use-context docker-desktop`

## Verification Without Live Cluster

Even without a working cluster, we can verify our manifests are correct:

### 1. Validate YAML Syntax
```bash
# Check each manifest for syntax errors
kubectl apply --dry-run=client -f namespace.yaml
kubectl apply --dry-run=client -f configmaps.yaml
kubectl apply --dry-run=client -f secrets.yaml
kubectl apply --dry-run=client -f deployments.yaml
kubectl apply --dry-run=client -f services.yaml
kubectl apply --dry-run=client -f ingress.yaml
kubectl apply --dry-run=client -f statefulset.yaml
```

### 2. Check Resource Requirements
- All resources have proper labels and selectors
- Services match deployment selectors
- ConfigMaps and Secrets are properly referenced
- Resource limits are reasonable

### 3. Test with Docker Compose
The Docker Compose setup demonstrates the same architecture and can be used to verify the application works correctly.
