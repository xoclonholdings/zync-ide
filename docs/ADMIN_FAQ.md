# Zync Admin FAQ & How-To Guide

## Table of Contents

1. [General Administration](#general-administration)
2. [User Management](#user-management)
3. [Configuration Management](#configuration-management)
4. [Integration Setup](#integration-setup)
5. [Security & Access Control](#security--access-control)
6. [Performance & Monitoring](#performance--monitoring)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Features](#advanced-features)

## General Administration

### Q: How do I access the admin dashboard?

**A:** Currently, admin functions are managed through configuration files and command line. A web-based admin dashboard can be added as a future enhancement.

**Admin access via CLI:**
```bash
# Create admin user
npm run create-admin

# View system status
npm run health-check

# View logs
tail -f logs/zync.log
```

### Q: How do I change the application branding?

**A:** Update the UI configuration in your config file:

```json
{
  "ui": {
    "branding": {
      "appName": "Your Company IDE",
      "logoPath": "/assets/your-logo.svg",
      "favicon": "/assets/your-favicon.ico"
    }
  }
}
```

Place your logo files in the `client/src/assets/` directory and rebuild:
```bash
npm run build
```

### Q: How do I configure CORS for multiple domains?

**A:** Edit your configuration file:

```json
{
  "server": {
    "cors": {
      "enabled": true,
      "origins": [
        "https://main-domain.com",
        "https://dev-domain.com",
        "https://staging-domain.com"
      ]
    }
  }
}
```

## User Management

### Q: How do I create new users?

**A:** Users can register through the web interface, or you can create them via the API:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "securepassword",
    "email": "user@company.com"
  }'
```

### Q: How do I reset a user's password?

**A:** Connect to the database and update the password:

```bash
# For SQLite
sqlite3 data/zync.db "UPDATE users SET password = 'new_hashed_password' WHERE username = 'username';"
```

Or create a password reset API endpoint (recommended for production).

### Q: How do I disable user registration?

**A:** Add authentication middleware to prevent new registrations:

```javascript
// In server/routes.ts
app.post("/api/auth/register", (req, res) => {
  res.status(403).json({ 
    success: false, 
    error: "Registration disabled by administrator" 
  });
});
```

### Q: How do I view all registered users?

**A:** Query the database:

```bash
# SQLite
sqlite3 data/zync.db "SELECT id, username, email, createdAt FROM users;"

# Or via API (if admin endpoints exist)
curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/api/admin/users
```

## Configuration Management

### Q: What's the difference between config files?

**A:** 
- `default.json` - Base configuration for all environments
- `production.json` - Production-specific overrides
- `local.json` - Your local overrides (not tracked in git)
- Environment variables override all file settings

### Q: How do I enable/disable features?

**A:** Use the features section in your config:

```json
{
  "features": {
    "terminal": {
      "enabled": false,
      "allowedCommands": ["npm", "node", "git"]
    },
    "codeExecution": {
      "enabled": true,
      "timeout": 30000,
      "memoryLimit": "256MB"
    }
  }
}
```

### Q: How do I change the maximum file upload size?

**A:** Configure storage limits:

```json
{
  "storage": {
    "maxFileSize": "50MB",
    "maxProjectSize": "500MB",
    "allowedFileTypes": [".js", ".ts", ".html", ".css", ".json"]
  }
}
```

### Q: How do I configure rate limiting?

**A:** Set rate limiting in server config:

```json
{
  "server": {
    "rateLimit": {
      "enabled": true,
      "windowMs": 900000,
      "max": 100
    }
  }
}
```

## Integration Setup

### Q: How do I configure Fantasma Firewall integration?

**A:** 

1. **Get API credentials** from your Fantasma Firewall admin
2. **Update configuration:**

```json
{
  "integrations": {
    "fantasmaFirewall": {
      "enabled": true,
      "endpoint": "https://your-fantasma-server.com/api",
      "apiKey": "your-api-key",
      "timeout": 30000
    }
  }
}
```

3. **Test the connection:**
```bash
curl -H "Authorization: Bearer <your-api-key>" https://your-fantasma-server.com/api/health
```

4. **Restart Zync** to apply changes

### Q: How do I set up Zebulon Oracle Interface?

**A:**

1. **Configure the integration:**

```json
{
  "integrations": {
    "zebulonOracle": {
      "enabled": true,
      "endpoint": "https://zebulon-oracle.replit.com/api",
      "apiKey": "your-zebulon-api-key",
      "timeout": 30000
    }
  }
}
```

2. **Users can configure in Settings > Integrations** or admin can set globally

### Q: How do I add custom integrations?

**A:** 

1. **Create integration service:**

```typescript
// server/services/custom-integration.ts
export class CustomIntegration {
  private config: IntegrationConfig;
  
  constructor(config: IntegrationConfig) {
    this.config = config;
  }
  
  async connect(): Promise<boolean> {
    // Implementation
  }
  
  async executeCommand(command: string): Promise<any> {
    // Implementation
  }
}
```

2. **Add to configuration schema**
3. **Update routes to handle the integration**

## Security & Access Control

### Q: How do I enable HTTPS?

**A:** Configure your reverse proxy (nginx/Apache) with SSL certificates:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### Q: How do I configure Content Security Policy?

**A:** Update security configuration:

```json
{
  "security": {
    "contentSecurityPolicy": {
      "enabled": true,
      "directives": {
        "defaultSrc": ["'self'"],
        "scriptSrc": ["'self'", "'unsafe-inline'", "trusted-domain.com"],
        "styleSrc": ["'self'", "'unsafe-inline'"],
        "imgSrc": ["'self'", "data:", "blob:", "*.trusted-cdn.com"]
      }
    }
  }
}
```

### Q: How do I set up authentication timeouts?

**A:** Configure auth settings:

```json
{
  "auth": {
    "sessionTimeout": "7d",
    "maxLoginAttempts": 5,
    "lockoutDuration": "15m"
  }
}
```

### Q: How do I change the JWT secret?

**A:** 

**For development:**
```json
{
  "auth": {
    "jwtSecret": "your-new-secret-key"
  }
}
```

**For production:**
```bash
export JWT_SECRET="your-production-secret"
```

**Note:** Changing the secret will invalidate all existing sessions.

## Performance & Monitoring

### Q: How do I monitor system performance?

**A:** 

1. **Enable metrics:**
```json
{
  "monitoring": {
    "metrics": {
      "enabled": true,
      "interval": "1m"
    }
  }
}
```

2. **Check system resources:**
```bash
# Memory usage
ps aux | grep node

# Disk usage
df -h

# Active connections
netstat -an | grep :3000
```

3. **View application logs:**
```bash
tail -f logs/zync.log
```

### Q: How do I optimize database performance?

**A:** The system includes automatic optimization, but you can manually tune:

1. **Increase cache size:**
```json
{
  "database": {
    "sqlite": {
      "cacheSize": 256000,
      "mmapSize": 1073741824
    }
  }
}
```

2. **Run manual optimization:**
```bash
sqlite3 data/zync.db "VACUUM; ANALYZE;"
```

### Q: How do I handle high load?

**A:** 

1. **Use process clustering:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'zync',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster'
  }]
};
```

2. **Set up load balancing with nginx:**
```nginx
upstream zync_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

### Q: How do I set up log rotation?

**A:** Configure logrotate:

```bash
# /etc/logrotate.d/zync
/opt/zync/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        pm2 reload zync
    endscript
}
```

## Backup & Recovery

### Q: How do I backup the system?

**A:** 

1. **Automatic backups** are configured in:
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

2. **Manual backup:**
```bash
# Database
cp data/zync.db backups/zync-$(date +%Y%m%d).db

# Configuration
tar -czf backups/config-$(date +%Y%m%d).tar.gz config/

# User projects (if using file storage)
tar -czf backups/projects-$(date +%Y%m%d).tar.gz data/projects/
```

### Q: How do I restore from backup?

**A:** 

1. **Stop the service:**
```bash
pm2 stop zync
```

2. **Restore database:**
```bash
cp backups/zync-20241220.db data/zync.db
```

3. **Restore configuration:**
```bash
tar -xzf backups/config-20241220.tar.gz
```

4. **Restart service:**
```bash
pm2 start zync
```

### Q: How do I migrate to a new server?

**A:** 

1. **On old server:**
```bash
./scripts/create-migration-backup.sh
```

2. **Transfer files to new server**

3. **On new server:**
```bash
./scripts/restore-from-migration.sh backup-file.tar.gz
```

## Troubleshooting

### Q: Application won't start - "Port already in use"

**A:** 

1. **Find process using the port:**
```bash
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000
```

2. **Kill the process:**
```bash
sudo kill -9 <PID>
```

3. **Or change the port:**
```json
{
  "server": {
    "port": 3001
  }
}
```

### Q: Database errors - "database is locked"

**A:** 

1. **Stop all processes:**
```bash
pm2 stop zync
```

2. **Remove lock files:**
```bash
rm data/zync.db-wal
rm data/zync.db-shm
```

3. **Check database integrity:**
```bash
sqlite3 data/zync.db "PRAGMA integrity_check;"
```

4. **Restart application:**
```bash
pm2 start zync
```

### Q: Memory usage keeps increasing

**A:** 

1. **Check for memory leaks:**
```bash
pm2 monit
```

2. **Set memory limits:**
```javascript
// ecosystem.config.js
{
  max_memory_restart: '1G'
}
```

3. **Review logs for errors:**
```bash
tail -f logs/zync.log | grep ERROR
```

### Q: SSL/HTTPS issues

**A:** 

1. **Check certificate validity:**
```bash
openssl x509 -in certificate.crt -text -noout
```

2. **Test SSL configuration:**
```bash
curl -I https://your-domain.com
```

3. **Check nginx/Apache logs:**
```bash
tail -f /var/log/nginx/error.log
```

### Q: Integration connection failures

**A:** 

1. **Test connectivity:**
```bash
curl -v https://integration-endpoint.com/api/health
```

2. **Check DNS resolution:**
```bash
nslookup integration-endpoint.com
```

3. **Verify API keys:**
```bash
curl -H "Authorization: Bearer <api-key>" https://integration-endpoint.com/api/test
```

4. **Review integration logs:**
```bash
grep "integration" logs/zync.log
```

## Advanced Features

### Q: How do I set up custom themes?

**A:** 

1. **Create theme configuration:**
```json
{
  "ui": {
    "theme": {
      "custom": {
        "primary": "#your-color",
        "secondary": "#your-color",
        "background": "#your-color"
      }
    }
  }
}
```

2. **Update CSS variables in the client**

### Q: How do I add custom project templates?

**A:** 

1. **Create template directory:**
```bash
mkdir -p templates/custom-template
```

2. **Add template files:**
```json
// templates/custom-template/template.json
{
  "name": "Custom Template",
  "description": "Your custom project template",
  "files": [
    {
      "path": "package.json",
      "content": "..."
    }
  ]
}
```

3. **Register in configuration:**
```json
{
  "templates": {
    "custom-template": {
      "enabled": true,
      "path": "./templates/custom-template"
    }
  }
}
```

### Q: How do I implement custom authentication?

**A:** 

1. **Create auth provider:**
```typescript
// server/auth/custom-auth.ts
export class CustomAuthProvider {
  async authenticate(credentials: any): Promise<User | null> {
    // Custom authentication logic
  }
}
```

2. **Update auth configuration:**
```json
{
  "auth": {
    "provider": "custom",
    "customProvider": {
      "endpoint": "https://your-auth-server.com",
      "clientId": "your-client-id"
    }
  }
}
```

### Q: How do I set up webhooks?

**A:** 

1. **Configure webhook endpoints:**
```json
{
  "webhooks": {
    "enabled": true,
    "endpoints": [
      {
        "url": "https://your-server.com/webhook",
        "events": ["project.created", "user.registered"],
        "secret": "webhook-secret"
      }
    ]
  }
}
```

2. **Implement webhook service in the application**

---

## Need More Help?

- **Documentation:** Check the `/docs` directory for detailed guides
- **Logs:** Review application logs in `/logs/zync.log`
- **Configuration:** Validate config with `npm run config:validate`
- **Health Check:** Run `npm run health-check` for system status

For additional support or feature requests, consult your development team or create an issue in your issue tracking system.