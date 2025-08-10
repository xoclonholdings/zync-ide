# Zync Unlimited Features & Admin Controls

## Overview

Zync includes comprehensive unlimited scalability features designed for enterprise deployment and high-volume usage. All traditional limits have been removed or made configurable by administrators.

## Unlimited Features

### 🚀 **Complete Limit Removal**

- **No file size limits** - Upload files of any size
- **No project limits** - Create unlimited projects per user
- **No user limits** - Support unlimited concurrent users
- **No storage limits** - Unlimited disk space usage
- **No timeout limits** - Long-running operations supported
- **No connection limits** - Handle unlimited concurrent connections

### 📁 **Storage & Files**

```json
{
  "storage": {
    "maxFileSize": "unlimited",
    "maxProjectSize": "unlimited", 
    "maxProjects": "unlimited",
    "maxUsers": "unlimited",
    "allowedFileTypes": ["*"]
  }
}
```

**Features:**
- Stream large file uploads (64MB chunks)
- Parallel upload processing (50 concurrent)
- All file types supported (no restrictions)
- Automatic compression with highest level
- Unlimited file watching and real-time sync

### 💻 **Code Execution & Terminal**

```json
{
  "features": {
    "terminal": {
      "allowedCommands": ["*"],
      "maxSessions": "unlimited",
      "timeout": 0,
      "rootAccess": true,
      "sudoEnabled": true
    },
    "codeExecution": {
      "timeout": 0,
      "memoryLimit": "unlimited",
      "cpuLimit": "unlimited",
      "networkAccess": true,
      "fileSystemAccess": "full"
    }
  }
}
```

**Capabilities:**
- Execute any command (no whitelist restrictions)
- Unlimited terminal sessions per user
- No execution timeouts
- Full file system access
- Network access enabled
- Root/sudo privileges available

### 🗄️ **Database & Performance**

```json
{
  "database": {
    "sqlite": {
      "cacheSize": -2000000,
      "mmapSize": 8589934592,
      "synchronous": "OFF",
      "maxConnections": "unlimited"
    }
  }
}
```

**Optimizations:**
- 2GB database cache
- 8GB memory-mapped I/O
- Maximum performance mode (safety checks disabled)
- Unlimited connection pooling
- 2TB+ database size support
- Incremental vacuum for large datasets

### 🌐 **Network & Connections**

```json
{
  "server": {
    "cors": {
      "origins": ["*"]
    },
    "rateLimit": {
      "enabled": false,
      "max": 999999999
    },
    "bodyLimit": "unlimited",
    "timeout": 0,
    "maxConnections": 0
  }
}
```

**Features:**
- No CORS restrictions
- Rate limiting disabled
- Unlimited request body size
- No connection timeouts
- Unlimited concurrent connections

## Admin API Endpoints

### System Control

```bash
# Remove all system limits
POST /api/admin/remove-limits

# Emergency override for any limit
POST /api/admin/emergency-override
{
  "overrides": {
    "MAX_PROJECTS": "unlimited",
    "MAX_USERS": "unlimited"
  }
}

# Enable admin bypass for specific user
POST /api/admin/enable-bypass/123
```

### Configuration Management

```bash
# Get current configuration
GET /api/admin/config

# Reload configuration without restart
POST /api/admin/config/reload

# Override specific limits dynamically
POST /api/admin/limits/override
{
  "limits": {
    "fileSize": "unlimited",
    "projects": "unlimited"
  }
}
```

### System Monitoring

```bash
# Get detailed system capabilities
GET /api/admin/capabilities

# Get comprehensive system statistics
GET /api/admin/stats/detailed

# Force database optimization
POST /api/admin/optimize/database
```

### Data Access

```bash
# Get all users (no pagination)
GET /api/admin/users/all

# Get all projects (no pagination)
GET /api/admin/projects/all
```

### Feature Control

```bash
# Enable all features with unlimited capabilities
POST /api/admin/features/enable-all
```

## Environment Variables

Override any configuration using environment variables:

```bash
# Remove all limits
export UNLIMITED_MODE=true
export ADMIN_MODE=true
export SCALABILITY_MODE=true

# Database optimization
export DB_CACHE_SIZE=-2000000
export DB_MMAP_SIZE=8589934592

# Server limits
export MAX_CONNECTIONS=0
export BODY_LIMIT=unlimited
export REQUEST_TIMEOUT=0

# Storage limits
export MAX_FILE_SIZE=unlimited
export MAX_PROJECT_SIZE=unlimited
export MAX_USERS=unlimited
```

## Programmatic Access

### JavaScript/Node.js

```javascript
import { unlimitedFeatures } from './server/services/unlimited-features';

// Initialize unlimited mode
await unlimitedFeatures.initializeUnlimitedMode();

// Enable admin bypass for user
unlimitedFeatures.enableAdminBypass(userId);

// Check system capabilities
const capabilities = unlimitedFeatures.getSystemCapabilities();

// Emergency override
unlimitedFeatures.emergencyOverride({
  MAX_PROJECTS: Infinity,
  MAX_USERS: Infinity
});
```

### Configuration Files

Create `config/local.json` for permanent overrides:

```json
{
  "unlimited": true,
  "storage": {
    "maxFileSize": "unlimited",
    "maxProjectSize": "unlimited",
    "maxUsers": "unlimited"
  },
  "features": {
    "terminal": {
      "allowedCommands": ["*"],
      "rootAccess": true
    },
    "codeExecution": {
      "timeout": 0,
      "memoryLimit": "unlimited"
    }
  }
}
```

## Deployment Configurations

### High-Volume Production

```json
{
  "server": {
    "maxConnections": 0,
    "keepAlive": true,
    "timeout": 0
  },
  "database": {
    "sqlite": {
      "cacheSize": -2000000,
      "mmapSize": 8589934592,
      "walAutocheckpoint": 0
    }
  },
  "features": {
    "multiUser": {
      "maxConcurrentUsers": "unlimited"
    },
    "realTimeSync": {
      "maxConnections": "unlimited"
    }
  }
}
```

### Development Environment

```json
{
  "unlimited": true,
  "debug": true,
  "features": {
    "terminal": {
      "allowedCommands": ["*"],
      "sudoEnabled": true
    }
  }
}
```

## Security Considerations

While unlimited features provide maximum flexibility, consider these security implications:

### Recommended Safeguards

1. **Network Security**
   - Use firewall rules to restrict access
   - Implement VPN for admin access
   - Enable HTTPS with strong certificates

2. **Access Control**
   - Use admin bypass only for trusted users
   - Implement proper authentication
   - Monitor admin actions

3. **Resource Monitoring**
   - Monitor disk space usage
   - Track memory consumption
   - Set up alerts for unusual activity

4. **Backup Strategy**
   - Automated backups every hour
   - Unlimited retention policy
   - Off-site backup storage

## Performance Optimization

### Database Tuning

```sql
-- SQLite optimizations for unlimited mode
PRAGMA synchronous = OFF;
PRAGMA cache_size = -2000000;
PRAGMA mmap_size = 8589934592;
PRAGMA wal_autocheckpoint = 0;
PRAGMA temp_store = memory;
```

### System Limits

```bash
# Increase system limits
ulimit -n 65536          # File descriptors
ulimit -u 32768          # Processes
ulimit -m unlimited      # Memory
ulimit -s unlimited      # Stack size
```

### Node.js Optimization

```bash
# Environment variables for maximum performance
export NODE_OPTIONS="--max-old-space-size=8192"
export UV_THREADPOOL_SIZE=128
```

## Troubleshooting

### Common Issues

1. **"spawn ulimit ENOENT" error**
   - This is normal on some systems
   - Unlimited features still work
   - Set system limits manually if needed

2. **Memory usage high**
   - Expected with unlimited caching
   - Monitor with `GET /api/admin/stats/detailed`
   - Restart if needed

3. **Database locked**
   - Use `POST /api/admin/optimize/database`
   - Check WAL mode is enabled
   - Increase timeout values

### Emergency Recovery

```bash
# If system becomes unresponsive
curl -X POST http://localhost:5000/api/admin/emergency-override \
  -H "Content-Type: application/json" \
  -d '{"overrides": {"EMERGENCY_MODE": true}}'
```

## Migration from Limited to Unlimited

1. **Update configuration**
2. **Restart application**
3. **Run admin initialization**
4. **Verify unlimited mode active**
5. **Monitor performance**

```bash
# Check unlimited mode status
curl http://localhost:5000/api/admin/capabilities
```

## Support

For unlimited features support:

1. Check system capabilities: `GET /api/admin/capabilities`
2. Review detailed stats: `GET /api/admin/stats/detailed`
3. Check configuration: `GET /api/admin/config`
4. Monitor logs: `tail -f logs/zync.log`

---

**Note:** Unlimited features are designed for enterprise environments with proper infrastructure. Monitor resource usage and implement appropriate safeguards for your deployment scenario.