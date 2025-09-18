# Kubernetes Deployment for DevOps Project

This directory contains all the necessary Kubernetes manifests to deploy the DevOps Project application on a Kubernetes cluster.

## 📋 Prerequisites

- Kubernetes cluster (local or cloud)
- kubectl configured to connect to your cluster
- Docker images built and pushed to a registry

## 🏗️ Architecture

The application consists of the following components:

### Applications (Deployments)
- **Backend**: Node.js API server
- **Frontend**: React application
- **Nginx**: Reverse proxy and load balancer
- **Redis**: Caching layer

### Database (StatefulSet)
- **MongoDB**: Primary database with persistent storage

### Services
- **backend-service**: ClusterIP service for backend
- **frontend-service**: ClusterIP service for frontend
- **nginx-service**: LoadBalancer service for external access
- **mongodb-service**: ClusterIP service for MongoDB
- **redis-service**: ClusterIP service for Redis

### Configuration
- **ConfigMaps**: Application configuration
- **Secrets**: Sensitive data (passwords, JWT secrets)
- **Ingress**: External access routing

## 🚀 Quick Start

### Option 1: Using PowerShell Scripts (Windows)

1. **Setup local cluster and deploy:**
   ```powershell
   .\demo-setup.ps1
   ```

2. **Verify deployment:**
   ```powershell
   .\verify-deployment.ps1
   ```

### Option 2: Manual Deployment

1. **Create namespace:**
   ```bash
   kubectl apply -f namespace.yaml
   ```

2. **Deploy configuration:**
   ```bash
   kubectl apply -f configmaps.yaml
   kubectl apply -f secrets.yaml
   ```

3. **Deploy database:**
   ```bash
   kubectl apply -f statefulset.yaml
   kubectl wait --for=condition=ready pod -l app=mongodb -n devops-app --timeout=300s
   ```

4. **Deploy applications:**
   ```bash
   kubectl apply -f deployments.yaml
   kubectl apply -f services.yaml
   kubectl apply -f ingress.yaml
   ```

5. **Wait for all pods to be ready:**
   ```bash
   kubectl wait --for=condition=ready pod -l app=backend -n devops-app --timeout=300s
   kubectl wait --for=condition=ready pod -l app=frontend -n devops-app --timeout=300s
   kubectl wait --for=condition=ready pod -l app=nginx -n devops-app --timeout=300s
   ```

## 🔍 Verification

### Check deployment status:
```bash
kubectl get pods -n devops-app
kubectl get services -n devops-app
kubectl get ingress -n devops-app
```

### Check logs:
```bash
kubectl logs -f deployment/backend -n devops-app
kubectl logs -f deployment/frontend -n devops-app
kubectl logs -f statefulset/mongodb -n devops-app
```

### Test connectivity:
```bash
kubectl run test-pod --image=busybox --rm -it --restart=Never -- nslookup backend-service.devops-app.svc.cluster.local
```

## 🌐 Accessing the Application

### Local Development (Port Forward)
```bash
kubectl port-forward service/nginx-service 8080:80 -n devops-app
```
Then visit: http://localhost:8080

### Production (LoadBalancer)
If using a cloud provider with LoadBalancer support:
```bash
kubectl get service nginx-service -n devops-app
```
Use the EXTERNAL-IP to access the application.

### Ingress (if supported)
Add to your hosts file:
```
<INGRESS-IP> devops-app.local
<INGRESS-IP> api.devops-app.local
```
Then visit: http://devops-app.local

## 📊 Monitoring and Debugging

### View all resources:
```bash
kubectl get all -n devops-app
```

### Describe resources:
```bash
kubectl describe pod <pod-name> -n devops-app
kubectl describe service <service-name> -n devops-app
```

### Check events:
```bash
kubectl get events -n devops-app --sort-by='.lastTimestamp'
```

## 🗑️ Cleanup

To remove all resources:
```bash
kubectl delete namespace devops-app
```

## 📁 File Structure

- `namespace.yaml` - Namespace definition
- `configmaps.yaml` - Application configuration
- `secrets.yaml` - Sensitive data
- `deployments.yaml` - Application deployments
- `services.yaml` - Service definitions
- `ingress.yaml` - Ingress configuration
- `statefulset.yaml` - MongoDB StatefulSet
- `deploy.sh` - Linux deployment script
- `verify-deployment.sh` - Linux verification script
- `demo-setup.ps1` - Windows setup script
- `verify-deployment.ps1` - Windows verification script

## 🔧 Configuration Details

### Environment Variables
- `NODE_ENV`: production
- `PORT`: 5000 (backend)
- `MONGODB_URI`: mongodb://mongodb-service:27017/devops_app
- `REDIS_HOST`: redis-service
- `REDIS_PORT`: 6379

### Resource Limits
- **Backend**: 256Mi-512Mi memory, 250m-500m CPU
- **Frontend**: 128Mi-256Mi memory, 100m-200m CPU
- **MongoDB**: 256Mi-512Mi memory, 250m-500m CPU
- **Redis**: 64Mi-128Mi memory, 50m-100m CPU
- **Nginx**: 64Mi-128Mi memory, 50m-100m CPU

### Storage
- **MongoDB**: 1Gi persistent volume claim

## 🚨 Troubleshooting

### Common Issues

1. **Pods not starting:**
   - Check resource limits
   - Verify image availability
   - Check logs: `kubectl logs <pod-name> -n devops-app`

2. **Services not accessible:**
   - Verify service selectors match pod labels
   - Check service ports configuration

3. **Database connection issues:**
   - Ensure MongoDB StatefulSet is ready
   - Check MongoDB service DNS resolution

4. **Ingress not working:**
   - Verify ingress controller is installed
   - Check ingress annotations
   - Verify host configuration

### Debug Commands
```bash
# Check pod status
kubectl get pods -n devops-app -o wide

# Check service endpoints
kubectl get endpoints -n devops-app

# Check persistent volumes
kubectl get pv,pvc -n devops-app

# Check ingress status
kubectl describe ingress devops-app-ingress -n devops-app
```

## 📈 Scaling

### Scale applications:
```bash
kubectl scale deployment backend --replicas=3 -n devops-app
kubectl scale deployment frontend --replicas=3 -n devops-app
```

### Scale database (not recommended for single instance):
```bash
kubectl scale statefulset mongodb --replicas=1 -n devops-app
```

## 🔒 Security Considerations

- Secrets are base64 encoded (not encrypted)
- Use proper RBAC for production
- Consider using external secret management
- Enable network policies for micro-segmentation
- Use TLS for all communications in production