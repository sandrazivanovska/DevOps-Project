# DevOps E-Commerce Application

A full-stack e-commerce web application built as a final project for Continuous Integration and Deployment course. The application demonstrates modern DevOps practices including containerization, CI/CD pipelines, and Kubernetes orchestration.

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18.2.0 with Tailwind CSS
- **Backend**: Node.js/Express with RESTful API
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for performance optimization
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with Kustomize
- **CI/CD**: GitHub Actions with automated deployment
- **Cloud**: AWS EC2 deployment

### Application Features
- **User Management**: Registration, authentication, and authorization
- **Product Management**: CRUD operations for products with admin panel
- **Shopping Cart**: Add/remove items with persistent cart
- **Order Management**: Complete order processing workflow
- **Admin Dashboard**: Comprehensive admin interface for managing the application
- **Search & Filtering**: Advanced product search and category filtering
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- kubectl (for Kubernetes deployment)

### Local Development with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd devops-project
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Admin Dashboard: http://localhost:3000/admin

### Kubernetes Deployment

1. **Deploy to Kubernetes**
   ```bash
   kubectl apply -k k8s/
   ```

2. **Check deployment status**
   ```bash
   kubectl get all -n devops-app
   ```

3. **Access the application**
   ```bash
   kubectl port-forward service/nginx-service 8080:80 -n devops-app
   ```
   Then open: http://localhost:8080

## 📁 Project Structure

```
devops-project/
├── backend/                 # Node.js/Express API
│   ├── config/             # Database and Redis configuration
│   ├── middleware/         # Authentication and error handling
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   └── Dockerfile         # Backend container image
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API service layer
│   │   └── contexts/      # React context providers
│   └── Dockerfile         # Frontend container image
├── k8s/                   # Kubernetes configurations
│   ├── namespace.yaml     # Resource isolation
│   ├── statefulset.yaml   # MongoDB with persistent storage
│   ├── deployments.yaml   # Application deployments
│   ├── services.yaml      # Service definitions
│   ├── ingress.yaml       # External access configuration
│   ├── configmaps.yaml    # Configuration management
│   ├── secrets.yaml       # Sensitive data management
│   └── kustomization.yml  # Kustomize configuration
├── nginx/                 # Reverse proxy configuration
├── database/              # Database initialization scripts
└── docker-compose.yml     # Local development setup
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/devops_app
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=/api
REACT_APP_ENV=production
```

## 🐳 Docker Images

The application uses multi-stage Docker builds for optimization:

- **Backend**: Node.js Alpine with production dependencies
- **Frontend**: Nginx Alpine serving static React build
- **Database**: Official MongoDB 7.0 image
- **Cache**: Official Redis 7 Alpine image

## ☸️ Kubernetes Architecture

### Components
- **Namespace**: `devops-app` for resource isolation
- **StatefulSet**: MongoDB with persistent volumes
- **Deployments**: Frontend, Backend, Redis, and Nginx
- **Services**: Internal communication and load balancing
- **ConfigMaps**: Application configuration
- **Secrets**: Database credentials and JWT secrets
- **Ingress**: External access and routing

### Resource Management
- **CPU/Memory Limits**: Defined for all containers
- **Health Checks**: Liveness and readiness probes
- **Scaling**: Horizontal Pod Autoscaling ready
- **Persistence**: MongoDB data persistence with PVCs

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
1. **Code Push**: Triggers on push to main branch
2. **Build**: Creates Docker images for frontend and backend
3. **Test**: Runs automated tests (if configured)
4. **Push**: Publishes images to Docker Hub
5. **Deploy**: Automatically deploys to AWS EC2

### Pipeline Features
- **Multi-architecture builds**: AMD64 and ARM64 support
- **Image optimization**: Multi-stage builds for smaller images
- **Security scanning**: Vulnerability checks
- **Rollback capability**: Easy rollback to previous versions

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📊 Monitoring & Logging

- **Health Endpoints**: `/health` for service monitoring
- **Structured Logging**: JSON format for better parsing
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Response time monitoring

## 🔒 Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control (Admin/User)
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: API rate limiting with express-rate-limit
- **CORS**: Configured Cross-Origin Resource Sharing
- **Helmet**: Security headers with Helmet.js
- **Password Hashing**: bcryptjs for secure password storage

## 🚀 Deployment

### Production Deployment
1. **AWS EC2 Setup**: Configure EC2 instance with Docker
2. **Kubernetes Installation**: Install k3s or EKS
3. **Image Registry**: Push images to Docker Hub
4. **Deploy**: Apply Kubernetes configurations
5. **Monitor**: Check deployment status and logs

### Environment-Specific Configurations
- **Development**: Docker Compose with hot reload
- **Staging**: Kubernetes with test data
- **Production**: Kubernetes with production configurations

## 📈 Performance Optimizations

- **Redis Caching**: Product listings and user data caching
- **Database Indexing**: Optimized MongoDB queries
- **Image Optimization**: Compressed Docker images
- **CDN Ready**: Static asset optimization
- **Connection Pooling**: Database connection optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

DevOps Project - Final Assignment for Continuous Integration and Deployment Course

## 📞 Support

For support or questions, please open an issue in the repository.

---

**Note**: This project demonstrates modern DevOps practices including Infrastructure as Code, containerization, automated testing, and continuous deployment. It serves as a comprehensive example of a production-ready e-commerce application with full DevOps integration.
