# Zync - Export Package Instructions

## Complete Export Package Contents

### Core Application Files
```
zync-export/
├── dist/                    # Production build
│   ├── index.js            # Server bundle
│   └── public/             # Frontend assets
├── data/                   # Database directory
│   └── zync.db            # SQLite database
├── projects/              # User projects directory
├── package.json           # Dependencies
├── package-lock.json      # Lock file
└── README.md              # Setup instructions
```

### Export Command
```bash
# Create export package
mkdir zync-export
cp -r dist/ zync-export/
cp -r data/ zync-export/
cp -r projects/ zync-export/ 2>/dev/null || mkdir zync-export/projects
cp package.json zync-export/
cp package-lock.json zync-export/
```

### README.md for Export Package
```markdown
# Zync - Local Development Environment

## Quick Start
1. Install Node.js 18+
2. Run: npm install --only=production
3. Run: npm start
4. Open: http://localhost:5000

## Login Credentials
- Username: admin_dgn
- Password: admin123
- Email: devin@xoclonholdings.property

## Features
- Complete offline IDE
- Project templates (Node.js, Python, React, etc.)
- Code editor with syntax highlighting
- Terminal integration
- User management
- Settings persistence
- No external dependencies

## Support
Fully self-contained with local SQLite database.
No internet connection required for core functionality.
```

## Deployment Verification Steps

### 1. Dependency Check
```bash
# Verify no external service dependencies
npm list --prod | grep -E "(postgres|mysql|redis|mongo)"
# Should return empty - only SQLite used
```

### 2. Offline Test
```bash
# Disconnect from internet and verify all functions work:
# - Login/logout
# - Project creation
# - File editing
# - Settings changes
# - User management
```

### 3. Port Configuration
```bash
# Default port: 5000
# Change via: PORT=8080 npm start
```

### 4. Database Verification
```bash
# SQLite file should exist and be readable
ls -la data/zync.db
# Should show database file with proper permissions
```

## Production Deployment Script

Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying Zync..."

# Install dependencies
npm install --only=production

# Set permissions
chmod 644 data/zync.db 2>/dev/null || echo "Database will be created on first run"
mkdir -p projects logs

# Start application
if command -v pm2 &> /dev/null; then
    echo "Starting with PM2..."
    pm2 start dist/index.js --name zync
    pm2 save
else
    echo "Starting with Node.js..."
    nohup node dist/index.js > logs/app.log 2>&1 &
    echo $! > zync.pid
fi

echo "✅ Zync deployed successfully!"
echo "Access at: http://localhost:5000"
echo "Login: admin_dgn / admin123"
```

## Environment Compatibility

### Supported Platforms
- ✅ Linux (Ubuntu, CentOS, Debian)
- ✅ macOS (Intel, Apple Silicon)
- ✅ Windows (with Node.js)
- ✅ Docker containers
- ✅ Cloud platforms (AWS, DigitalOcean, etc.)

### Requirements
- Node.js 18+ (only requirement)
- 512MB RAM minimum
- 1GB disk space minimum
- No external database required
- No internet required for core functions

### Optional Integrations
- Fantasma Firewall (user-configurable)
- Zebulon Oracle Interface (user-configurable)
- Both require user-provided API keys/endpoints

## Security Notes
- Local authentication only
- No data transmitted to external servers
- SQLite database with local file storage
- User passwords securely hashed
- Session management with JWT tokens
- All operations logged locally

## Export Verification Checklist

✅ Database contains admin user (admin_dgn)
✅ All tables created (users, projects, files, integrations, sessions, userSettings)
✅ Build files optimized and minified
✅ No external service dependencies
✅ Offline functionality verified
✅ Settings persistence working
✅ Project creation/editing functional
✅ User authentication working
✅ File operations successful
✅ Deployment documentation complete

**Status: Ready for external deployment**