# DevOps Project - Kubernetes Deployment

This directory contains all the Kubernetes manifests and deployment scripts for the DevOps Project application.

## 📁 Files Overview

### Core Manifests
- `namespace.yaml` - Creates the `devops-app` namespace
- `configmaps.yaml` - Application configuration (non-sensitive data)
- `secrets.yaml` - Sensitive configuration (passwords, keys)
- `statefulset.yaml` - PostgreSQL database with persistent storage
- `deployments.yaml` - Application deployments (backend, frontend, redis, nginx)
- `services.yaml` - Service definitions for internal communication
- `ingress.yaml` - External access configuration

### Deployment Scripts
- `deploy.sh` - Bash deployment script (Linux/macOS)
- `deploy.ps1` - PowerShell deployment script (Windows)

## 🚀 Quick Start

### Prerequisites
- Kubernetes cluster (local or cloud)
- `kubectl` configured to connect to your cluster
- Docker images built and available (see CI/CD section)

### Deploy to Kubernetes

#### Option 1: Using PowerShell (Windows)
```powershell
cd k8s
.\deploy.ps1
```

#### Option 2: Using Bash (Linux/macOS)
```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

#### Option 3: Manual Deployment
```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmaps.yaml
kubectl apply -f secrets.yaml
kubectl apply -f statefulset.yaml
kubectl apply -f deployments.yaml
kubectl apply -f services.yaml
kubectl apply -f ingress.yaml
```

## 🌐 Accessing the Application

### Method 1: Port Forward (Recommended for local testing)
```bash
kubectl port-forward service/nginx-service 8080:80 -n devops-app
```
Then open: http://localhost:8080

### Method 2: LoadBalancer (if supported)
```bash
kubectl get service nginx-service -n devops-app
```
Use the external IP from the output.

### Method 3: Ingress (if ingress controller is installed)
```bash
kubectl get ingress -n devops-app
```
Add the host entries to your `/etc/hosts` file if using localhost.

## 📊 Monitoring

### Check Pod Status
```bash
kubectl get pods -n devops-app
```

### Check Services
```bash
kubectl get services -n devops-app
```

### Check All Resources
```bash
kubectl get all -n devops-app
```

### View Logs
```bash
# Backend logs
kubectl logs -f deployment/backend -n devops-app

# Frontend logs
kubectl logs -f deployment/frontend -n devops-app

# Database logs
kubectl logs -f statefulset/postgres -n devops-app
```

## 🔧 Configuration

### Environment Variables
All configuration is managed through ConfigMaps and Secrets:

- **ConfigMaps**: Database connection strings, API URLs, non-sensitive settings
- **Secrets**: Passwords, JWT secrets, API keys

### Scaling
To scale the application:
```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n devops-app

# Scale frontend to 3 replicas
kubectl scale deployment frontend --replicas=3 -n devops-app
```

### Persistent Storage
The PostgreSQL database uses a StatefulSet with persistent volume claims:
- **Storage**: 1Gi persistent volume
- **Access Mode**: ReadWriteOnce
- **Reclaim Policy**: Retain (data persists across pod restarts)

## 🧹 Cleanup

To remove all resources:
```bash
kubectl delete namespace devops-app
```

Or remove individual resources:
```bash
kubectl delete -f ingress.yaml
kubectl delete -f services.yaml
kubectl delete -f deployments.yaml
kubectl delete -f statefulset.yaml
kubectl delete -f secrets.yaml
kubectl delete -f configmaps.yaml
kubectl delete -f namespace.yaml
```

## 🔒 Security Notes

### Secrets Management
- Current secrets are base64 encoded for demonstration
- In production, use proper secret management (e.g., HashiCorp Vault, AWS Secrets Manager)
- Rotate secrets regularly

### Network Policies
Consider implementing NetworkPolicies for additional security:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: devops-app-network-policy
  namespace: devops-app
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: devops-app
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: devops-app
```

## 📈 Production Considerations

### Resource Limits
All containers have resource requests and limits defined:
- **CPU**: 50m-500m
- **Memory**: 64Mi-512Mi

### Health Checks
All services include:
- **Liveness Probes**: Restart unhealthy containers
- **Readiness Probes**: Only route traffic to ready containers

### High Availability
- **Multiple Replicas**: Backend and frontend have 2 replicas each
- **StatefulSet**: Database ensures ordered deployment and stable network identity
- **Persistent Storage**: Database data survives pod restarts

## 🐛 Troubleshooting

### Common Issues

1. **Pods stuck in Pending**
   ```bash
   kubectl describe pod <pod-name> -n devops-app
   ```

2. **Database connection issues**
   ```bash
   kubectl logs statefulset/postgres -n devops-app
   ```

3. **Service not accessible**
   ```bash
   kubectl get endpoints -n devops-app
   ```

4. **Image pull errors**
   - Ensure Docker images are built and pushed to registry
   - Check image names and tags in deployment manifests

### Debug Commands
```bash
# Get detailed pod information
kubectl describe pod <pod-name> -n devops-app

# Execute commands in pod
kubectl exec -it <pod-name> -n devops-app -- /bin/bash

# Check service endpoints
kubectl get endpoints -n devops-app

# View events
kubectl get events -n devops-app --sort-by='.lastTimestamp'
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Kubernetes ConfigMaps and Secrets](https://kubernetes.io/docs/concepts/configuration/)
