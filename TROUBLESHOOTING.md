# 🔧 Sentineli - Troubleshooting Guide

Common issues and solutions for getting Sentineli running smoothly.

---

## 🚨 Quick Diagnostics

**Run this first to check system health:**

```bash
# Check all services  
curl http://localhost:8766/health     # Docker Bridge (main backend)
curl http://localhost:3100/api/health # Dashboard server

# View recent logs
docker logs kg_ai_cobol_modernizer --tail=50

# Check environment
cat .env | grep -v "^#" | grep -v "^$"
```

---

## ❌ Installation Issues

### Problem: `npm install` fails

**Symptoms:**
- Permission errors
- Network timeouts
- Dependency conflicts

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# On Windows with permission issues
npm install --global windows-build-tools

# If specific package fails
npm install --legacy-peer-deps
```

---

### Problem: Docker not installed or not running

**Symptoms:**
- `docker: command not found`
- `Cannot connect to Docker daemon`

**Solutions:**

**Windows:**
1. Download [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Install and restart computer
3. Open Docker Desktop
4. Verify: `docker --version`

**macOS:**
```bash
brew install --cask docker
# Open Docker Desktop from Applications
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER  # Add yourself to docker group
# Logout and login again
```

---

## 🌐 Port Conflicts

### Problem: Port already in use

**Symptoms:**
- `EADDRINUSE: address already in use :::3000`
- `bind: address already in use`

**Find what's using the port:**

**Windows:**
```powershell
# Find process on port 8766 (Docker Bridge)
netstat -ano | findstr :8766
# Or check dashboard port
netstat -ano | findstr :3100
# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

**macOS/Linux:**
```bash
# Find process on port 8766 (Docker Bridge) 
lsof -i :8766
# Or check dashboard port
lsof -i :3100
# Kill the process
kill -9 <PID>
```

**Change port in environment:**
```bash
# Edit .env file
PORT=3050  # Change to different port

# Or use environment variable
PORT=3050 node src/bridge/server.js
```

---

## 🔐 Authentication Issues

### Problem: API key not working

**Symptoms:**
- `401 Unauthorized`
- `Invalid API key`

**Solutions:**

1. **Check .env file:**
```bash
cat .env | grep API_KEYS
# Should show: API_KEYS=demo-api-key-sentineli-2026
```

2. **Verify header format:**
```bash
# Correct
curl -H "X-API-Key: demo-api-key-sentineli-2026" http://localhost:8766/api/run/main

# Wrong (no space after colon)
curl -H "X-API-Key:demo-api-key-sentineli-2026" http://localhost:8766/api/run/main
```

3. **Generate new API key:**
```bash
# Generate secure random key
openssl rand -hex 32
# Add to .env: API_KEYS=<generated-key>
```

4. **Restart services** after changing .env:
```bash
docker-compose restart
# Or if manual: Ctrl+C and restart
```

---

### Problem: OpenAI API key invalid

**Symptoms:**
- `AI: disabled` in health check
- `OpenAI API error: Invalid API key`
- Cost showing `$0.00` for all requests

**Solutions:**

1. **Verify key format:**
```bash
# Should start with sk-
echo $OPENAI_API_KEY
# Should show: sk-proj-... or sk-...
```

2. **Check key on OpenAI dashboard:**
- Go to https://platform.openai.com/api-keys
- Verify key is active
- Check usage limits not exceeded

3. **Update .env correctly:**
```bash
# Wrong (with quotes)
OPENAI_API_KEY="sk-your-key"

# Correct (no quotes)
OPENAI_API_KEY=sk-your-key-here
```

4. **Test key directly:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key-here"
```

---

## 🗄️ Database Issues

### Problem: Database connection failed

**Symptoms:**
- `database: unhealthy` in health check
- `Connection refused` error
- `ECONNREFUSED ::1:5432`

**Solutions:**

**Docker (Recommended):**
```bash
# Check if PostgreSQL container is running
docker-compose ps

# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

**Local PostgreSQL:**
```bash
# Check if PostgreSQL is running
# Windows
sc query postgresql-x64-15
# macOS
brew services list | grep postgresql
# Linux
sudo systemctl status postgresql

# Start PostgreSQL
# Windows
net start postgresql-x64-15
# macOS
brew services start postgresql
# Linux
sudo systemctl start postgresql
```

**Update connection string:**
```bash
# Edit .env
DATABASE_URL=postgres://username:password@localhost:5432/sentineli_db

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

---

### Problem: Tables not created

**Symptoms:**
- `relation "knowledge_graph" does not exist`

**Solution:**
```bash
# Run migrations (if available)
npm run migrate

# Or manually create tables
psql $DATABASE_URL -f scripts/schema.sql
```

---

## 📦 Redis Issues

### Problem: Redis connection failed

**Symptoms:**
- `cache: unhealthy` in health check
- `ECONNREFUSED ::1:6385`

**Solutions:**

**Docker:**
```bash
# Restart Redis
docker-compose restart redis

# Check Redis logs
docker-compose logs redis
```

**Local Redis:**
```bash
# Start Redis
# Windows (if installed)
redis-server

# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Test connection
redis-cli ping  # Should return PONG
```

**Update Redis URL:**
```bash
# Edit .env
REDIS_URL=redis://localhost:6379
```

---

## 🤖 AI Analysis Issues

### Problem: AI analysis returns empty/generic results

**Symptoms:**
- Analysis has no business rules extracted
- Generic summaries like "This is a COBOL program"

**Solutions:**

1. **Check AI is enabled:**
```bash
curl http://localhost:8766/health | grep ai
# Should show: "ai": "enabled"
```

2. **Verify OpenAI model:**
```bash
# Edit .env
OPENAI_MODEL=gpt-4o  # Use latest model
```

3. **Increase analysis quality:**
```bash
# In ai_agent.js, increase temperature for creativity
# Or decrease for deterministic results
```

---

### Problem: AI analysis too slow

**Symptoms:**
- Takes >10 seconds per analysis
- Timeouts on large files

**Solutions:**

1. **Enable Redis caching:**
```bash
# Check cache is working
curl http://localhost:8766/api/analyze/bank/loan_approval.cob
# Second call should be faster (cache hit)
```

2. **Reduce code size:**
```bash
# Split large files into smaller modules
# Remove comments before analysis
```

3. **Use faster model:**
```bash
# Edit .env
OPENAI_MODEL=gpt-4o-mini  # Faster, cheaper
```

---

## 🖥️ Dashboard Issues

### Problem: Dashboard shows blank page

**Symptoms:**
- White screen
- No errors in console

**Solutions:**

1. **Hard refresh:**
```
Press: Ctrl+Shift+F5 (Windows/Linux)
Press: Cmd+Shift+R (macOS)
```

2. **Rebuild frontend:**
```bash
cd dashboard
npm run build
node server.js
```

3. **Check console errors:**
```
Press F12 → Console tab
Look for error messages
```

4. **Verify backend is running:**
```bash
curl http://localhost:8766/health
# Should return 200 OK
```

---

### Problem: WebSocket not connecting

**Symptoms:**
- "WEBSOCKET: DISCONNECTED" in dashboard
- No real-time updates

**Solutions:**

1. **Check WebSocket port:**
```bash
# Dashboard uses same port as HTTP
# WebSocket: ws://localhost:3100
```

2. **Check firewall:**
```bash
# Windows: Allow port 3100 in Windows Firewall
# macOS: System Preferences → Security → Firewall
```

3. **Check logs:**
```bash
# Dashboard logs should show:
# "WebSocket connection opened"
```

4. **Restart services:**
```bash
# Kill dashboard
taskkill /IM node.exe /F
# Restart
cd dashboard && node server.js
```

---

## ⚡ Performance Issues

### Problem: Slow response times

**Symptoms:**
- API calls take >5 seconds
- High CPU usage
- Memory warnings

**Solutions:**

1. **Check system resources:**
```bash
# Windows
taskmgr

# macOS/Linux
top
htop
```

2. **Increase Node.js memory:** ```bash
# Set environment variable
NODE_OPTIONS="--max-old-space-size=4096"
```

3. **Enable response caching:**
```bash
# Redis should be running
docker-compose ps | grep redis
```

4. **Reduce concurrent requests:**
```bash
# Implement request queuing
# Or increase rate limits
```

---

### Problem: High OpenAI costs

**Symptoms:**
- Unexpected billing
- Cost metric increasing rapidly

**Solutions:**

1. **Check metrics:**
```bash
curl http://localhost:8766/api/metrics
# Review totalCostUSD
```

2. **Enable aggressive caching:**
```bash
# Verify Redis is working
# Cache hit rate should be >50%
```

3. **Use cheaper model:**
```bash
# Edit .env
OPENAI_MODEL=gpt-4o-mini  # 10x cheaper
```

4. **Implement rate limiting:**
```bash
# Limit free tier usage
# Add authentication to /api/analyze
```

---

## 🐳 Docker Issues

### Problem: Docker build fails

**Symptoms:**
- `ERROR [internal] load metadata`
- Build time errors
- Permission denied

**Solutions:**

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Docker disk space
docker system df

# Clean unused volumes
docker volume prune
```

---

### Problem: Container keeps restarting

**Symptoms:**
- `Restarting (1) X seconds ago`
- Services not accessible

**Solutions:**

```bash
# Check logs for error
docker-compose logs bridge

# Common issues:
# - Missing environment variables
# - Port conflicts
# - Database not ready

# Fix: Add depends_on and healthchecks in docker-compose.yml
```

---

## 🧪 Testing Issues

### Problem: Tests failing

**Symptoms:**
- Jest errors
- Timeout errors
- Connection refused

**Solutions:**

1. **Ensure services are running:**
```bash
# Stop services before running tests
docker-compose down
npm test
```

2. **Clear Jest cache:**
```bash
npm test -- --clearCache
```

3. **Run specific test:**
```bash
npm test -- tests/unit/errorHandler.test.js
```

4. **Disable coverage for speed:**
```bash
npm test -- --no-coverage
```

---

## 📝 Logging Issues

### Problem: No logs appearing

**Symptoms:**
- Empty log files
- No console output

**Solutions:**

```bash
# Check LOG_LEVEL in .env
LOG_LEVEL=debug  # Most verbose

# View logs in realtime
docker-compose logs -f bridge

# Check log file
cat logs/app.log
```

---

## 🆘 Still Having Issues?

### Get Help:

1. **Check existing issues:**
   https://github.com/Kolerr-Lab/sentineli/issues

2. **Search discussions:**
   https://github.com/Kolerr-Lab/sentineli/discussions

3. **Create new issue with:**
   - Operating system and version
   - Node.js version (`node --version`)
   - Docker version (`docker --version`)
   - Complete error message
   - Steps to reproduce
   - Relevant log files

4. **Contact:**
   - 📧 Email: ricky@orchesity.com
   - 💬 Discussions: GitHub
   - 🐛 Bug reports: GitHub Issues

---

## 🧰 Diagnostic Commands Cheat Sheet

```bash
# System health
curl http://localhost:8766/health

# View all environment variables
printenv | grep -E "(PORT|OPENAI|DATABASE|REDIS)"

# Check ports in use
netstat -an | findstr "3000 3100 5432 6385"

# Docker status
docker-compose ps
docker-compose logs --tail=100

# Test database
psql $DATABASE_URL -c "SELECT 1;"

# Test Redis
redis-cli -u $REDIS_URL PING

# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# View logs
tail -f logs/app.log

# Check Node.js processes
ps aux | grep node
```

---

**💡 Pro Tip:** Enable DEBUG mode for verbose logging:

```bash
# Edit .env
LOG_LEVEL=debug
DEBUG=sentineli:*

# Restart services
docker-compose restart
```

---

**Built with ❤️ by Ricky Anh Nguyen | OrchesityAI & Kolerr Lab**
