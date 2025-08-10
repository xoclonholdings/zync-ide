# Zync - Deployment Guide

## Overview
Zync is a standalone local development environment with no external dependencies for core functionality. This guide covers deployment options for various environments.

## Dependencies Status
✅ **ZERO External Dependencies for Core Functions:**
- Login/Authentication: Local SQLite database only
- Project Creation: Local file system operations
- Code Editing: Built-in Monaco Editor
- File Management: Local storage
- Settings: Local database persistence
- User Management: Local authentication system
- Data Export/Import: Local file operations
- Deployment: Self-contained build

## Pre-Deployment Checklist

### Database Requirements
- **SQLite Database**: `data/zync.db` (auto-created)
- **No PostgreSQL Required**: All operations use local SQLite
- **No External Services**: Completely offline-capable

### Environment Variables
```bash
# Optional - only for development
NODE_ENV=production
PORT=5000

# Not Required (these are optional integrations):
# DATABASE_URL (not used - SQLite only)
# SESSION_SECRET (auto-generated)
```

## Deployment Options

### 1. Docker Deployment (Recommended)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY data/ ./data/
COPY config/ ./config/

EXPOSE 5000
CMD ["node", "dist/index.js"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  zync:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./data:/app/data
      - ./projects:/app/projects
    restart: unless-stopped
```

### 2. VPS/Server Deployment

1. **Upload Build Files:**
   ```bash
   # Upload these directories to your server:
   dist/          # Built application
   data/          # SQLite database
   node_modules/  # Dependencies
   package.json   # Package info
   ```

2. **Install Process Manager:**
   ```bash
   npm install -g pm2
   ```

3. **Create PM2 Config (`ecosystem.config.js`):**
   ```javascript
   module.exports = {
     apps: [{
       name: 'zync',
       script: 'dist/index.js',
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       }
     }]
   };
   ```

4. **Start Application:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### 3. Shared Hosting Deployment

For shared hosting providers that support Node.js:

1. **Upload Files:**
   - Upload `dist/` folder
   - Upload `data/` folder 
   - Upload `package.json`

2. **Install Dependencies:**
   ```bash
   npm install --only=production
   ```

3. **Start Script:**
   ```bash
   node dist/index.js
   ```

### 4. Cloud Platform Deployment

#### Heroku
```json
// package.json scripts
"scripts": {
  "start": "node dist/index.js",
  "build": "npm run build"
}
```

#### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: zync
services:
- name: api
  source_dir: /
  github:
    repo: your-repo
    branch: main
  run_command: node dist/index.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
```

## Security Configuration

### Production Settings
```javascript
// server/config.ts adjustments for production
const config = {
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0', // Allow external connections
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'auto-generated-secret',
    sessionTimeout: '7d'
  }
};
```

### Firewall Configuration
```bash
# Open required ports
ufw allow 5000/tcp
ufw enable
```

### SSL/HTTPS Setup
Use nginx reverse proxy:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Performance Optimization

### Database Optimization
- SQLite WAL mode enabled (automatic)
- 2GB cache configured
- Memory-mapped I/O optimized
- Automatic vacuum enabled

### File System
```bash
# Create projects directory with proper permissions
mkdir -p projects
chmod 755 projects
```

### Resource Limits
- Memory: 1GB minimum recommended
- Storage: 10GB+ for user projects
- CPU: Single core sufficient

## Backup Strategy

### Database Backup
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp data/zync.db backups/zync_backup_$DATE.db
```

### Full System Backup
```bash
# Backup entire application
tar -czf zync_backup_$(date +%Y%m%d).tar.gz \
  dist/ data/ projects/ package.json
```

## Monitoring

### Health Check Endpoint
```bash
curl http://localhost:5000/api/health
```

### Log Monitoring
```bash
# View application logs
pm2 logs zync

# Or for Docker
docker logs zync-container
```

### Resource Monitoring
```bash
# Monitor resource usage
pm2 monit

# Or system resources
htop
df -h
```

## Troubleshooting

### Common Issues

1. **Database Permission Error:**
   ```bash
   chmod 664 data/zync.db
   chown www-data:www-data data/zync.db
   ```

2. **Port Already in Use:**
   ```bash
   lsof -i :5000
   kill -9 <PID>
   ```

3. **File Upload Issues:**
   ```bash
   # Increase file size limits in nginx
   client_max_body_size 100M;
   ```

### Debug Mode
```bash
NODE_ENV=development node dist/index.js
```

## Migration from Development

1. **Export Data:**
   - Copy `data/zync.db`
   - Copy any existing projects from `projects/`

2. **Build for Production:**
   ```bash
   npm run build
   ```

3. **Transfer Files:**
   ```bash
   rsync -av dist/ data/ user@server:/path/to/zync/
   ```

## Independence Verification

✅ **Authentication**: Local SQLite - no external auth services
✅ **File Storage**: Local filesystem - no cloud storage
✅ **Database**: SQLite only - no PostgreSQL/external DB required
✅ **Session Management**: Local database storage
✅ **User Management**: Local admin controls
✅ **Project Operations**: Local file operations only
✅ **Settings Storage**: Local database persistence
✅ **Export/Import**: Local file operations
✅ **Deployment**: Self-contained application bundle

**Result**: Zync operates completely independently with zero external service dependencies for all core functionality.