# Deployment Guide

This document provides comprehensive instructions for deploying the AI Chatbot application in various environments.

## 🚀 Quick Start

### Vercel (Recommended)

The easiest way to deploy is using Vercel:

1. **Connect your repository**
   ```bash
   npx vercel --prod
   ```

2. **Set environment variables** in Vercel dashboard:
   - `AUTH_SECRET`
   - `POSTGRES_URL`
   - `BLOB_READ_WRITE_TOKEN`
   - `REDIS_URL`

3. **Deploy**
   ```bash
   git push origin main
   ```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/muffy86/Autonomous-AI-orchestration-agent.git
   cd Autonomous-AI-orchestration-agent
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Application: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

### Using Docker only

1. **Build the image**
   ```bash
   docker build -t ai-chatbot .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 \
     -e AUTH_SECRET=your-secret \
     -e POSTGRES_URL=your-db-url \
     -e BLOB_READ_WRITE_TOKEN=your-token \
     -e REDIS_URL=your-redis-url \
     ai-chatbot
   ```

## ☁️ Cloud Deployments

### AWS

#### Using AWS App Runner

1. **Create `apprunner.yaml`**
   ```yaml
   version: 1.0
   runtime: nodejs20
   build:
     commands:
       build:
         - npm install -g pnpm
         - pnpm install --frozen-lockfile
         - pnpm build
   run:
     runtime-version: 20
     command: pnpm start
     network:
       port: 3000
       env: PORT
   ```

2. **Deploy via AWS Console**
   - Create new App Runner service
   - Connect to your GitHub repository
   - Configure environment variables

#### Using ECS with Fargate

1. **Push image to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   docker build -t ai-chatbot .
   docker tag ai-chatbot:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-chatbot:latest
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-chatbot:latest
   ```

2. **Create ECS task definition**
3. **Create ECS service**
4. **Configure load balancer**

### Google Cloud Platform

#### Using Cloud Run

1. **Build and push to Container Registry**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT-ID/ai-chatbot
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy --image gcr.io/PROJECT-ID/ai-chatbot --platform managed
   ```

### Azure

#### Using Container Instances

1. **Push to Azure Container Registry**
   ```bash
   az acr build --registry myregistry --image ai-chatbot .
   ```

2. **Deploy container instance**
   ```bash
   az container create \
     --resource-group myResourceGroup \
     --name ai-chatbot \
     --image myregistry.azurecr.io/ai-chatbot:latest
   ```

## 🗄️ Database Setup

### PostgreSQL

#### Managed Services
- **Vercel Postgres**: Integrated with Vercel deployments
- **AWS RDS**: Managed PostgreSQL service
- **Google Cloud SQL**: Managed database service
- **Azure Database**: PostgreSQL as a service

#### Self-hosted
```bash
# Using Docker
docker run -d \
  --name postgres \
  -e POSTGRES_DB=ai_chatbot \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15-alpine
```

#### Database Migration
```bash
# Run migrations
pnpm db:push

# Or using Drizzle Kit
pnpm db:migrate
```

### Redis

#### Managed Services
- **Vercel KV**: Redis-compatible key-value store
- **AWS ElastiCache**: Managed Redis service
- **Google Cloud Memorystore**: Managed Redis service
- **Azure Cache**: Redis as a service

#### Self-hosted
```bash
# Using Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

## 🔧 Environment Configuration

### Required Variables

```bash
# Authentication
AUTH_SECRET=your-random-secret-key

# Database
POSTGRES_URL=postgresql://user:password@host:port/database

# Storage
BLOB_READ_WRITE_TOKEN=your-blob-storage-token

# Cache
REDIS_URL=redis://host:port
```

### Optional Variables

```bash
# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id

# Feature Flags
ENABLE_REASONING=true
ENABLE_ARTIFACTS=true
```

## 🔒 Security Considerations

### HTTPS/TLS
- Always use HTTPS in production
- Configure proper SSL certificates
- Use security headers

### Environment Variables
- Never commit secrets to version control
- Use secure secret management services
- Rotate secrets regularly

### Database Security
- Use connection pooling
- Enable SSL connections
- Implement proper access controls

### Rate Limiting
- Configure rate limiting for API endpoints
- Use Redis for distributed rate limiting
- Monitor for abuse patterns

## 📊 Monitoring and Logging

### Application Monitoring
```bash
# Add to your environment
SENTRY_DSN=your-sentry-dsn
```

### Performance Monitoring
- Use APM tools (New Relic, DataDog, etc.)
- Monitor database performance
- Track API response times

### Logging
```bash
# Configure log levels
LOG_LEVEL=info

# Log aggregation
LOGFLARE_API_KEY=your-logflare-key
```

## 🔄 CI/CD Pipeline

### GitHub Actions

The repository includes automated workflows:

- **Lint and Test**: Runs on every PR
- **Build and Deploy**: Runs on main branch
- **Security Scan**: Runs on schedule
- **Performance Test**: Runs on PR

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📈 Scaling

### Horizontal Scaling
- Use load balancers
- Deploy multiple instances
- Implement session affinity if needed

### Database Scaling
- Use read replicas
- Implement connection pooling
- Consider database sharding

### Caching Strategy
- Use Redis for session storage
- Implement application-level caching
- Use CDN for static assets

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules .next
   pnpm install
   pnpm build
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   pnpm db:check
   ```

3. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" pnpm start
   ```

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/db

# Redis health
curl http://localhost:3000/api/health/redis
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Create an issue on GitHub
4. Join our Discord community

## 🔄 Rollback Strategy

### Vercel
- Use Vercel dashboard to rollback to previous deployment
- Or redeploy a specific commit

### Docker
```bash
# Rollback to previous image
docker-compose down
docker-compose up -d --scale app=0
docker-compose up -d
```

### Database Migrations
```bash
# Rollback database changes
pnpm db:rollback
```

## 📋 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Health checks configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Performance testing completed
- [ ] Rollback plan documented