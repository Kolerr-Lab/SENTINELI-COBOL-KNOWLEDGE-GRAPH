# 🚀 Sentineli - Production Deployment Guide

Complete guide for deploying Sentineli to production with security best practices.

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests passing (`npm test`)
- [ ] ESLint clean (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database backup strategy in place
- [ ] SSL/TLS certificates ready
- [ ] Monitoring and logging configured
- [ ] Rate limiting configured
- [ ] API keys rotated from default values
- [ ] Security audit completed

---

## 🔐 Security Hardening

### 1. Generate Strong Secrets

**Never use default/example values in production!**

```bash
# Generate JWT secret (64 bytes)
openssl rand -base64 64

# Generate API keys (32 bytes each)
openssl rand -hex 32

# Generate database password
openssl rand -base64 24 | tr -d "=+/" | cut -c1-20
```

**Update .env:**
```bash
JWT_SECRET=<generated-jwt-secret>
API_KEYS=<key1>,<key2>,<key3>
DATABASE_URL=postgres://admin:<generated-password>@localhost:5432/sentineli
```

---

### 2. Environment Configuration

**Create production .env file:**

```bash
# Copy template
cp .env.example .env.production

# Edit with production values
nano .env.production
```

**Production .env example:**
```bash
# Production Environment
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# OpenAI (Production Key)
OPENAI_API_KEY=sk-prod-your-actual-production-key
OPENAI_MODEL=gpt-4o

# Security (CHANGE THESE!)
JWT_SECRET=your-super-secure-jwt-secret-64-chars-min
API_KEYS=prod-key-1,prod-key-2,prod-key-3

# Database (Production)
DATABASE_URL=postgres://admin:secure_password@prod-db.example.com:5432/sentineli?sslmode=require

# Redis (Production)
REDIS_URL=redis://:password@prod-redis.example.com:6379

# CORS (Your domains only)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Dashboard
DASHBOARD_PORT=3102
```

---

### 3. SSL/TLS Setup

**Option A: Using reverse proxy (Recommended)**

```nginx
# /etc/nginx/sites-available/sentineli
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**Enable configuration:**
```bash
sudo ln -s /etc/nginx/sites-available/sentineli /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

**Option B: Let's Encrypt certificate**

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com -d dashboard.yourdomain.com

# Auto-renewal (runs twice daily)
sudo systemctl enable certbot.timer
```

---

## 🐳 Docker Production Deployment

### 1. Production Docker Compose

**Create `docker-compose.prod.yml`:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: sentineli
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - sentineli_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - sentineli_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  bridge:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgres://admin:${DB_PASSWORD}@postgres:5432/sentineli
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      API_KEYS: ${API_KEYS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - sentineli_network
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3102:3102"
    environment:
      NODE_ENV: production
      DASHBOARD_PORT: 3102
    depends_on:
      - bridge
    networks:
      - sentineli_network

networks:
  sentineli_network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

---

### 2. Deploy with Docker

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f bridge
```

---

## 🔄 PM2 Production Deployment

**Recommended for bare-metal or VPS deployments**

### 1. Install PM2

```bash
# Global install
npm install -g pm2

# Start on system boot
pm2 startup
# Follow the command it outputs
```

---

### 2. Configure PM2

**Create `ecosystem.config.js`:**

```javascript
module.exports = {
  apps: [
    {
      name: 'sentineli-bridge',
      script: 'src/bridge/server.js',
      instances: 4,  // Number of CPU cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/bridge-error.log',
      out_file: './logs/bridge-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'sentineli-dashboard',
      script: 'dashboard/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        DASHBOARD_PORT: 3102
      },
      error_file: './logs/dashboard-error.log',
      out_file: './logs/dashboard-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ]
};
```

---

### 3. Deploy with PM2

```bash
# Start applications
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs

# Restart
pm2 restart all

# Stop
pm2 stop all

# Delete
pm2 delete all
```

---

###  4. PM2 Useful Commands

```bash
# Status
pm2 status

# CPU/Memory monitoring
pm2 monit

# Logs (all apps)
pm2 logs

# Logs (specific app)
pm2 logs sentineli-bridge

# Flush logs
pm2 flush

# Reload (zero-downtime)
pm2 reload all

# restart without downtime
pm2 reload sentineli-bridge

# Show app info
pm2 show sentineli-bridge

# Web dashboard
pm2 web
```

---

## ☁️ Cloud Platform Deployments

### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 sentineli

# Create environment
eb create sentineli-prod \
  --database.engine postgres \
  --database.size 10 \
  --instance-type t3.medium

# Set environment variables
eb setenv OPENAI_API_KEY=sk-your-key \
          JWT_SECRET=your-secret \
          NODE_ENV=production

# Deploy
eb deploy

# Open app
eb open
```

---

### Heroku

```bash
# Login
heroku login

# Create app
heroku create sentineli-prod

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set config
heroku config:set OPENAI_API_KEY=sk-your-key
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=2:standard-2x

# View logs
heroku logs --tail
```

---

### DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Configure build:**
   - Build command: `npm install && npm run build`
   - Run command: `npm start`
3. **Add environment variables** in dashboard
4. **Add PostgreSQL database** (managed)
5. **Add Redis** (managed)
6. **Deploy**

---

### Google Cloud Run

```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/sentineli

# Deploy
gcloud run deploy sentineli \
  --image gcr.io/PROJECT_ID/sentineli \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=sk-your-key

# Add Cloud SQL (PostgreSQL)
gcloud sql instances create sentineli-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Connect to Cloud SQL
gcloud run services update sentineli \
  --add-cloudsql-instances PROJECT_ID:us-central1:sentineli-db
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring

**Install monitoring tools:**

```bash
npm install @sentry/node prom-client
```

**Add to server.js:**

```javascript
const Sentry = require('@sentry/node');
const promClient = require('prom-client');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Prometheus metrics
const register = new promClient.Registry();
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestDuration);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

### 2. Centralized Logging

**Winston + CloudWatch/LogDNA:**

```javascript
const winston = require('winston');
const CloudWatchTransport = require('winston-cloudwatch');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new CloudWatchTransport({
      logGroupName: 'sentineli-logs',
      logStreamName: 'bridge',
      awsRegion: 'us-east-1'
    })
  ]
});
```

---

### 3. Health Monitoring

**UptimeRobot / Pingdom:**

```bash
# Endpoints to monitor
https://api.yourdomain.com/health  # Every 5 minutes
https://dashboard.yourdomain.com/  # Every 5 minutes

# Alert channels
- Email
- Slack
- PagerDuty
```

---

## 🗄️ Database Management

### 1. Automated Backups

**PostgreSQL backup script:**

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sentineli_$TIMESTAMP.sql"

# Backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://your-bucket/backups/

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Add to crontab:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-db.sh
```

---

### 2. Database Migrations

```bash
# Create migration
npm run migrate:create add_new_column

# Run migrations
npm run migrate:up

# Rollback
npm run migrate:down
```

---

## 🔄 Deployment Workflow

### CI/CD Pipeline (GitHub Actions)

**Create `.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Deploy to server
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          HOST: ${{ secrets.HOST }}
          USER: ${{ secrets.USER }}
        run: |
          echo "$SSH_PRIVATE_KEY" > key.pem
          chmod 600 key.pem
          scp -i key.pem -r . $USER@$HOST:/app/sentineli
          ssh -i key.pem $USER@$HOST "cd /app/sentineli && pm2 reload all"
```

---

## 🔒 Security Best Practices

### 1. Regular updates
```bash
# Update dependencies monthly
npm update
npm audit fix

# Check for vulnerabilities
npm audit
```

### 2. Rate limiting
Already configured in `src/bridge/middleware/rateLimiting.js`

### 3. Input validation
Already configured in `src/bridge/middleware/validation.js`

### 4. CORS configuration
```javascript
// Restrict to your domains only
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
```

### 5. API key rotation
```bash
# Rotate keys quarterly
# Generate new key
openssl rand -hex 32
# Add to API_KEYS
# Remove old key after migration period
```

---

## 📈 Performance Optimization

### 1. Enable compression
```javascript
const compression = require('compression');
app.use(compression());
```

### 2. Redis caching
Already configured - verify cache hit rate:
```bash
curl http://localhost:3000/api/metrics
# Look for cache statistics
```

### 3. Database connection pooling
```javascript
// Already configured in database connection
const pool = new Pool({
  max: 20,  // Maximum connections
  idleTimeoutMillis: 30000
});
```

### 4. PM2 cluster mode
```javascript
// ecosystem.config.js
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] All services healthy (`/health` returns 200)
- [ ] SSL certificate valid
- [ ] Database backups running
- [ ] Logs being collected
- [ ] Monitoring alerts configured
- [ ] API keys rotated from defaults
- [ ] Rate limiting working
- [ ] CORS configured correctly
- [ ] Error tracking (Sentry) working
- [ ] Performance monitoring active
- [ ] Documentation updated
- [ ] Team notified of new deployment

---

## 🆘 Rollback Procedure

If deployment fails:

```bash
# Docker
docker-compose -f docker-compose.prod.yml down
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d

# PM2
pm2 stop all
git checkout <previous-commit>
npm install
pm2 restart all

# Cloud platforms
# Use platform's rollback feature
heroku releases:rollback
# OR
eb abort  # If deployment in progress
```

---

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PM2 Production Guide](https://pm2.keymetrics.io/docs/usage/deployment/)
- [Node.js Production Checklist](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

## 💬 Support

Production deployment issues? Contact:

- 📧 Email: ricky@orchesity.com
- 💬 [GitHub Discussions](https://github.com/Kolerr-Lab/sentineli/discussions)
- 🚨 [Report Critical Issues](https://github.com/Kolerr-Lab/sentineli/issues/new?labels=critical)

---

**🎉 Congratulations on your production deployment!**

*Built with ❤️ by Ricky Anh Nguyen | OrchesityAI & Kolerr Lab*
