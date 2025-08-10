# Zync Local Server Setup Guide

## Overview

Zync is a comprehensive local development environment that can be deployed on your own infrastructure. This guide will walk you through the complete setup process for hosting Zync on a local server.

## Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **Domain or IP** for your local server
- **SSL Certificate** (optional but recommended)
- **Reverse Proxy** (nginx, Apache, or Caddy)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-zync-repository>
cd zync
npm install
```

### 2. Environment Configuration

Create your environment configuration:

```bash
cp config/default.json config/local.json
```

Edit `config/local.json` with your specific settings:

```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "cors": {
      "origins": ["https://your-domain.com", "http://localhost:3000"]
    }
  },
  "auth": {
    "jwtSecret": "your-unique-secret-key-here"
  },
  "integrations": {
    "fantasmaFirewall": {
      "enabled": true,
      "endpoint": "https://your-fantasma-endpoint.com",
      "apiKey": "your-fantasma-api-key"
    },
    "zebulonOracle": {
      "enabled": true,
      "endpoint": "https://your-zebulon-endpoint.com", 
      "apiKey": "your-zebulon-api-key"
    }
  }
}
```

### 3. Database Setup

Initialize the SQLite database:

```bash
npm run db:push
```

Create the admin user:

```bash
npm run create-admin
```

### 4. Build for Production

```bash
npm run build
```

### 5. Start the Server

```bash
NODE_ENV=production npm start
```

## Detailed Configuration

### Server Configuration

The server configuration is located in `config/` directory:

- `default.json` - Base configuration
- `production.json` - Production overrides
- `local.json` - Your local overrides (create this)

#### Key Settings:

**Port and Host:**
```json
{
  "server": {
    "port": 3000,
    "host": "0.0.0.0"
  }
}
```

**CORS Configuration:**
```json
{
  "server": {
    "cors": {
      "enabled": true,
      "origins": ["https://your-domain.com"]
    }
  }
}
```

### Database Configuration

**SQLite (Default):**
```json
{
  "database": {
    "type": "sqlite",
    "path": "./data/zync.db",
    "backup": {
      "enabled": true,
      "interval": "24h",
      "retention": 7
    }
  }
}
```

**PostgreSQL (Optional):**
```json
{
  "database": {
    "type": "postgresql",
    "url": "postgresql://user:password@localhost:5432/zync"
  }
}
```

### Security Configuration

**Authentication:**
```json
{
  "auth": {
    "jwtSecret": "your-unique-secret-key",
    "sessionTimeout": "7d",
    "maxLoginAttempts": 5,
    "lockoutDuration": "15m"
  }
}
```

**Content Security Policy:**
```json
{
  "security": {
    "contentSecurityPolicy": {
      "enabled": true,
      "directives": {
        "defaultSrc": ["'self'"],
        "scriptSrc": ["'self'", "'unsafe-inline'"]
      }
    }
  }
}
```

### Integration Configuration

Configure external services:

```json
{
  "integrations": {
    "fantasmaFirewall": {
      "enabled": true,
      "endpoint": "https://api.fantasma.com",
      "apiKey": "your-api-key",
      "timeout": 30000
    },
    "zebulonOracle": {
      "enabled": true,
      "endpoint": "https://zebulon-oracle.com/api",
      "apiKey": "your-api-key",
      "timeout": 30000
    }
  }
}
```

## Reverse Proxy Setup

### Nginx Configuration

Create `/etc/nginx/sites-available/zync`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

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
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/zync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache Configuration

Create `/etc/apache2/sites-available/zync.conf`:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
</VirtualHost>
```

## Process Management

### Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'zync',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/zync',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Systemd

Create `/etc/systemd/system/zync.service`:

```ini
[Unit]
Description=Zync Development Environment
After=network.target

[Service]
Type=simple
User=zync
WorkingDirectory=/opt/zync
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable zync
sudo systemctl start zync
sudo systemctl status zync
```

## Monitoring and Logs

### Log Configuration

Configure logging in your config:

```json
{
  "monitoring": {
    "logging": {
      "level": "info",
      "file": "./logs/zync.log",
      "maxSize": "10MB",
      "maxFiles": 5
    }
  }
}
```

### Log Rotation

Setup logrotate for Zync logs:

Create `/etc/logrotate.d/zync`:
```
/opt/zync/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 zync zync
    postrotate
        systemctl reload zync
    endscript
}
```

## Backup Strategy

### Automated Database Backups

The system includes automatic backup functionality:

```json
{
  "database": {
    "backup": {
      "enabled": true,
      "interval": "24h",
      "retention": 7,
      "path": "./data/backups"
    }
  }
}
```

### Manual Backup

Create a backup script:

```bash
#!/bin/bash
BACKUP_DIR="/opt/zync/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
cp /opt/zync/data/zync.db "$BACKUP_DIR/zync_$DATE.db"

# Backup config
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" /opt/zync/config/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

## Security Hardening

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### SSL/TLS Configuration

For production, obtain SSL certificates:

**Using Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Security Headers

The application includes security headers by default. Additional nginx security:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Permission denied:**
   ```bash
   sudo chown -R zync:zync /opt/zync
   sudo chmod -R 755 /opt/zync
   ```

3. **Database locked:**
   ```bash
   sudo systemctl stop zync
   rm /opt/zync/data/zync.db-wal
   rm /opt/zync/data/zync.db-shm
   sudo systemctl start zync
   ```

### Health Check

Create a health check endpoint test:

```bash
curl -f http://localhost:3000/api/health || exit 1
```

## Performance Optimization

### System Limits

Increase system limits in `/etc/security/limits.conf`:
```
zync soft nofile 65536
zync hard nofile 65536
```

### Node.js Optimization

Set Node.js options in your process manager:
```bash
NODE_OPTIONS="--max-old-space-size=2048"
```

## Updates and Maintenance

### Update Process

1. Backup current installation
2. Pull latest changes
3. Install dependencies
4. Run migrations
5. Restart services

```bash
# Backup
./scripts/backup.sh

# Update
git pull origin main
npm install
npm run db:push

# Restart
pm2 restart zync
```

### Scheduled Maintenance

Setup cron jobs for maintenance:

```cron
# Daily backup at 2 AM
0 2 * * * /opt/zync/scripts/backup.sh

# Weekly log cleanup at 3 AM Sunday
0 3 * * 0 /opt/zync/scripts/cleanup-logs.sh

# Monthly system update at 4 AM on 1st
0 4 1 * * /opt/zync/scripts/system-update.sh
```

For more detailed information, see the [Admin FAQ](./ADMIN_FAQ.md).