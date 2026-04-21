# Autonomous Agent OS - Deployment Guide

Complete guide for deploying and running your personalized autonomous agentic operating system.

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **Package Manager**: pnpm 9.x (recommended) or npm
- **Memory**: Minimum 4GB RAM, 8GB+ recommended
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows with WSL2

### Optional Requirements

- **Docker**: For containerized deployment
- **Kubernetes**: For production orchestration
- **PostgreSQL**: For persistent storage
- **Redis**: For caching and session management

## 🚀 Quick Deploy

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd <repo-name>

# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your credentials:

```bash
# Required: Add at least one AI provider API key
OPENAI_API_KEY=sk-...
# or
PUBLIC_AI_API_KEY=...

# Optional: Add blockchain credentials if using blockchain features
ETHEREUM_PRIVATE_KEY=0x...
POLYGON_PRIVATE_KEY=0x...
```

### 3. Run Development Server

```bash
# Start the development server
pnpm dev

# Or run the autonomous agent system directly
pnpm tsx examples/autonomous-agent-demo.ts
```

### 4. Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t autonomous-agent-os:latest .

# Run container
docker run -d \
  --name agent-os \
  -p 3000:3000 \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e PUBLIC_AI_API_KEY=$PUBLIC_AI_API_KEY \
  autonomous-agent-os:latest
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  agent-os:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PUBLIC_AI_API_KEY=${PUBLIC_AI_API_KEY}
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=agentpassword
      - POSTGRES_DB=agentdb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres-data:
```

## ☸️ Kubernetes Deployment

### 1. Create Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: autonomous-agents
```

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

```bash
# Create secret for API keys
kubectl create secret generic agent-secrets \
  --from-literal=openai-api-key=$OPENAI_API_KEY \
  --from-literal=public-ai-api-key=$PUBLIC_AI_API_KEY \
  -n autonomous-agents
```

### 3. Deploy Application

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autonomous-agent-os
  namespace: autonomous-agents
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agent-os
  template:
    metadata:
      labels:
        app: agent-os
    spec:
      containers:
      - name: agent-os
        image: autonomous-agent-os:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: openai-api-key
        - name: PUBLIC_AI_API_KEY
          valueFrom:
            secretKeyRef:
              name: agent-secrets
              key: public-ai-api-key
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: agent-os-service
  namespace: autonomous-agents
spec:
  selector:
    app: agent-os
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

```bash
kubectl apply -f deployment.yaml
```

### 4. Horizontal Pod Autoscaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-os-hpa
  namespace: autonomous-agents
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: autonomous-agent-os
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
kubectl apply -f hpa.yaml
```

## 🌐 Cloud Platform Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add PUBLIC_AI_API_KEY

# Deploy to production
vercel --prod
```

### AWS (EC2 + ECS)

```bash
# 1. Build Docker image
docker build -t autonomous-agent-os:latest .

# 2. Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag autonomous-agent-os:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-os:latest

# 3. Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/agent-os:latest

# 4. Deploy via ECS or EC2
# Use AWS Console or Terraform/CloudFormation
```

### Google Cloud Platform

```bash
# 1. Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/agent-os

# 2. Deploy to Cloud Run
gcloud run deploy autonomous-agent-os \
  --image gcr.io/<project-id>/agent-os \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=$OPENAI_API_KEY

# 3. Deploy to GKE (Kubernetes)
gcloud container clusters create agent-cluster --num-nodes=3
kubectl apply -f deployment.yaml
```

## 🔒 Production Configuration

### Security Hardening

1. **API Keys**: Use secret management (Vault, AWS Secrets Manager)
2. **HTTPS**: Enable SSL/TLS certificates
3. **Rate Limiting**: Configure rate limits in `.env`
4. **Authentication**: Enable JWT authentication
5. **Network**: Use VPC/firewall rules

### Performance Optimization

```env
# .env.production
NODE_ENV=production

# Agent Configuration
ORCHESTRATION_STRATEGY=autonomous
MAX_CONCURRENT_TASKS=20
ENABLE_CACHING=true

# Resource Limits
MAX_MEMORY_MB=4096
MAX_CPU_CORES=4

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
LOG_LEVEL=info
```

### Monitoring Setup

```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'autonomous-agent-os'
    static_configs:
      - targets: ['localhost:9090']
```

```bash
# Start Prometheus
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/prometheus-config.yaml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Start Grafana
docker run -d \
  --name grafana \
  -p 3001:3000 \
  grafana/grafana
```

## 📊 Health Checks

### API Endpoints

```typescript
// Add to your Next.js app
// app/api/health/route.ts
export async function GET() {
  const status = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  
  return Response.json(status);
}
```

### Monitoring Script

```bash
#!/bin/bash
# health-check.sh

while true; do
  STATUS=$(curl -s http://localhost:3000/api/health | jq -r '.status')
  
  if [ "$STATUS" != "healthy" ]; then
    echo "⚠️ System unhealthy! Restarting..."
    docker-compose restart agent-os
  else
    echo "✅ System healthy"
  fi
  
  sleep 60
done
```

## 🔄 Updates and Maintenance

### Rolling Updates

```bash
# Build new version
docker build -t autonomous-agent-os:v2.0.0 .

# Update Kubernetes deployment
kubectl set image deployment/autonomous-agent-os \
  agent-os=autonomous-agent-os:v2.0.0 \
  -n autonomous-agents

# Monitor rollout
kubectl rollout status deployment/autonomous-agent-os -n autonomous-agents

# Rollback if needed
kubectl rollout undo deployment/autonomous-agent-os -n autonomous-agents
```

### Database Migrations

```bash
# Run migrations
pnpm db:migrate

# In production with Docker
docker exec -it agent-os pnpm db:migrate
```

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

# Backup database
docker exec postgres pg_dump -U postgres agentdb > backup-$(date +%Y%m%d).sql

# Backup agent data
tar -czf agent-data-$(date +%Y%m%d).tar.gz ./data

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql s3://backups/
aws s3 cp agent-data-$(date +%Y%m%d).tar.gz s3://backups/
```

## 🚨 Troubleshooting

### Common Issues

**Agent not starting**
```bash
# Check logs
docker logs agent-os

# Verify environment variables
docker exec agent-os env | grep API_KEY

# Check resource usage
docker stats agent-os
```

**Out of memory errors**
```bash
# Increase memory limit
docker run --memory=8g autonomous-agent-os:latest

# Or in docker-compose.yaml
services:
  agent-os:
    mem_limit: 8g
```

**Blockchain connection issues**
```bash
# Test RPC endpoint
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $ETHEREUM_RPC_URL

# Use alternative RPC providers
ETHEREUM_RPC_URL=https://eth.llamarpc.com
# or
ETHEREUM_RPC_URL=https://rpc.ankr.com/eth
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Docker Swarm
docker service scale agent-os=5

# Kubernetes
kubectl scale deployment autonomous-agent-os --replicas=5 -n autonomous-agents
```

### Load Balancing

```yaml
# nginx.conf
upstream agent_os {
  least_conn;
  server agent-os-1:3000;
  server agent-os-2:3000;
  server agent-os-3:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://agent_os;
  }
}
```

## 🎯 Next Steps

1. ✅ Deploy to your chosen platform
2. 📊 Set up monitoring and alerts
3. 🔒 Configure security and backups
4. 🚀 Scale based on usage
5. 📖 Review documentation and customize

## 📞 Support

- GitHub Issues: [Report deployment issues]
- Documentation: [Full deployment docs]
- Community: [Join our Discord]

---

Ready to deploy your autonomous agent OS! 🚀
