# Zync - Local Development Environment

## Quick Start Guide

### 1. Prerequisites
- Node.js 18 or higher
- 512MB RAM minimum
- 1GB disk space

### 2. Installation
```bash
# Install dependencies
npm install --only=production

# Start the application
npm start
```

### 3. Access
- Open your browser to: **http://localhost:5000**
- Or change port: **PORT=8080 npm start**

## Login Credentials
- **Username**: admin_dgn
- **Password**: admin123
- **Email**: devin@xoclonholdings.property

## Features
✅ **Complete Offline IDE** - No internet required for core functions
✅ **Project Templates** - Node.js, Python, React, Vue, and more
✅ **Code Editor** - Monaco Editor with syntax highlighting
✅ **Terminal Integration** - Execute code directly
✅ **User Management** - Create and manage multiple users
✅ **Settings Persistence** - All preferences saved locally
✅ **File Management** - Full project file operations
✅ **Zero Dependencies** - Completely self-contained

## Advanced Configuration

### Production Deployment
```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name zync
pm2 save
pm2 startup

# Or direct Node.js
nohup node dist/index.js > logs/app.log 2>&1 &
```

### Environment Variables
```bash
PORT=5000          # Server port (default: 5000)
NODE_ENV=production # Environment mode
```

### Database
- **Type**: SQLite (included in data/zync.db)
- **Backup**: Simply copy the data/ folder
- **No external database required**

## File Structure
```
zync-export/
├── dist/           # Production application
├── data/           # SQLite database
├── projects/       # User projects directory
├── package.json    # Dependencies
└── README.md       # This file
```

## Support
This is a completely self-contained application with no external dependencies. All data stays on your server.

For technical support, all configuration is in the local files - no external services involved.