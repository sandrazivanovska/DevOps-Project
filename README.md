# DevOps Project - Full Stack E-commerce Application

A comprehensive full-stack web application built for a DevOps project, featuring multiple services including frontend, backend, database, caching, and reverse proxy.

## 🏗️ Architecture

This application consists of the following services:

- **Frontend**: React.js application with modern UI
- **Backend**: Node.js/Express.js REST API
- **Database**: MongoDB with comprehensive schema
- **Cache**: Redis for performance optimization
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **Containerization**: Docker and Docker Compose for orchestration
- **CI/CD**: GitHub Actions pipeline for automated deployment
- **Orchestration**: Kubernetes manifests for production deployment

## 🚀 Features

### Frontend Features
- Modern React.js application with Tailwind CSS
- User authentication and authorization
- Product catalog with search and filtering
- Shopping cart functionality
- Order management
- Admin dashboard
- Responsive design

### Backend Features
- RESTful API with Express.js
- JWT-based authentication
- MongoDB database with document-based schema
- Redis caching for performance
- Input validation and error handling
- Rate limiting and security middleware
- Audit logging system

### Database Features
- Users management with roles
- Product catalog with categories
- Order management system
- Audit logging for all changes
- Optimized indexes for performance

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- MongoDB 7+ (for local development)
- Redis 7+ (for local development)

## 🛠️ Installation & Setup

### Using Docker Compose (Recommended)

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
   - Database: localhost:27017
   - Redis: localhost:6379

## 🔄 CI/CD Pipeline

The project includes a complete GitHub Actions CI/CD pipeline:

### Pipeline Features
- **Automated Testing**: Runs tests on every push and PR
- **Docker Image Building**: Builds and pushes images to DockerHub
- **Multi-Platform Support**: Supports different branches and environments
- **Kubernetes Deployment**: Automatically deploys to Kubernetes cluster

### Setup CI/CD
1. **Fork the repository** to your GitHub account
2. **Set up secrets** in GitHub repository settings:
   - `DOCKERHUB_USERNAME`: Your DockerHub username
   - `DOCKERHUB_TOKEN`: Your DockerHub access token
   - `KUBE_CONFIG`: Base64 encoded kubeconfig file
3. **Push to main branch** to trigger deployment

### Pipeline Workflow
```yaml
# .github/workflows/ci-cd.yml
- Test: Run backend and frontend tests
- Build: Build Docker images for all services
- Push: Push images to DockerHub registry
- Deploy: Deploy to Kubernetes cluster
```

## ☸️ Kubernetes Deployment

The application is fully containerized and ready for Kubernetes deployment:

### Kubernetes Features
- **Namespace Isolation**: All resources in `devops-app` namespace
- **StatefulSet**: MongoDB with persistent storage
- **Deployments**: Scalable backend and frontend services
- **Services**: Internal service communication
- **Ingress**: External access configuration
- **ConfigMaps & Secrets**: Configuration management
- **Health Checks**: Liveness and readiness probes
- **Resource Limits**: CPU and memory constraints

### Deploy to Kubernetes

#### Prerequisites
- Kubernetes cluster (local or cloud)
- `kubectl` configured
- Docker images available in registry

#### Quick Deployment
```bash
# Using PowerShell (Windows)
cd k8s
.\deploy.ps1

# Using Bash (Linux/macOS)
cd k8s
chmod +x deploy.sh
./deploy.sh
```

#### Manual Deployment
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/statefulset.yaml
kubectl apply -f k8s/deployments.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/ingress.yaml
```

#### Access the Application
```bash
# Port forward to access locally
kubectl port-forward service/nginx-service 8080:80 -n devops-app

# Then open: http://localhost:8080
```

### Kubernetes Manifests Overview
- `namespace.yaml` - Creates isolated namespace
- `configmaps.yaml` - Application configuration
- `secrets.yaml` - Sensitive data (passwords, keys)
- `statefulset.yaml` - PostgreSQL with persistent storage
- `deployments.yaml` - Application services
- `services.yaml` - Service definitions
- `ingress.yaml` - External access rules

For detailed Kubernetes documentation, see [k8s/README.md](k8s/README.md).

### Local Development Setup

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Database Setup**
   ```bash
   # Start MongoDB and Redis
   # The init-mongo.js script will run automatically when MongoDB starts
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/devops_app
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## 📊 Database Schema

The application includes the following main collections:

- **users**: User accounts with authentication
- **products**: Product catalog with categories
- **orders**: Order management with embedded order items
- **auditlogs**: System audit trail

## 🔐 Authentication

The application uses JWT-based authentication with the following features:

- User registration and login
- Password hashing with bcrypt
- Role-based access control (admin/user)
- Token expiration and refresh
- Secure password requirements

### Demo Credentials
- **Admin**: admin@devops-app.com / password123
- **User**: john@example.com / password123

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products (with pagination, search, filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/categories` - Get product categories

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (admin only)
- `PUT /api/orders/:id/cancel` - Cancel order

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `PUT /api/users/:id/password` - Change password
- `DELETE /api/users/:id` - Delete user (admin only)

### Audit
- `GET /api/audit` - Get audit logs (admin only)
- `GET /api/audit/:id` - Get single audit log (admin only)
- `GET /api/audit/stats` - Get audit statistics (admin only)

## 🐳 Docker Services

The application is containerized with the following services:

1. **mongodb**: MongoDB 7.0 database
2. **redis**: Redis 7 cache
3. **backend**: Node.js API server
4. **frontend**: React.js application (served by Nginx)
5. **nginx**: Reverse proxy and load balancer

## 📈 Performance Features

- **Redis Caching**: Frequently accessed data is cached
- **Database Indexing**: Optimized queries with proper indexes
- **Gzip Compression**: Reduced payload sizes
- **Connection Pooling**: Efficient database connections
- **Rate Limiting**: API protection against abuse

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Request validation and sanitization
- **Rate Limiting**: API rate limiting
- **JWT Security**: Secure token-based authentication
- **Password Hashing**: Bcrypt password hashing
- **NoSQL Injection Protection**: Input validation and sanitization

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Monitoring & Logging

- **Health Checks**: Built-in health check endpoints
- **Audit Logging**: Complete audit trail of all changes
- **Error Logging**: Comprehensive error logging
- **Performance Monitoring**: Request timing and metrics

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export MONGODB_URI=your-production-mongodb-uri
   export REDIS_HOST=your-production-redis-host
   ```

2. **Build and Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **SSL Configuration**
   - Update nginx configuration with SSL certificates
   - Configure domain names and DNS

## 📚 API Documentation

The API includes comprehensive documentation available at:
- Swagger UI: `http://localhost:5000/api-docs` (when implemented)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Version History

- **v1.0.0**: Initial release with full-stack functionality
  - React frontend with modern UI
  - Node.js backend API
  - MongoDB database
  - Redis caching
  - Docker containerization
  - Nginx reverse proxy

---

**Note**: This application is built for educational purposes as part of a DevOps project. It demonstrates modern web development practices, containerization, and microservices architecture.
