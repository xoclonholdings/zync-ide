# How to Upload and Deploy Zync

## Method 1: Traditional Web Hosting (cPanel/Shared Hosting)

### Step 1: Prepare Files
1. Download the `zync-export` folder to your computer
2. Compress it to `zync-export.zip`

### Step 2: Upload via cPanel
1. Log into your hosting cPanel
2. Go to **File Manager**
3. Navigate to your domain's root folder (usually `public_html` or `www`)
4. Upload `zync-export.zip`
5. Extract the zip file
6. Move all contents from `zync-export/` to your domain root

### Step 3: Install Dependencies
1. Open **Terminal** in cPanel (if available)
2. Run: `npm install --only=production`
3. If no terminal access, contact your hosting provider

### Step 4: Start Application
1. Create a startup script or contact hosting support
2. Point your domain to run: `node dist/index.js`

## Method 2: VPS/Cloud Server (Recommended)

### Step 1: Upload Files
```bash
# Upload via SCP
scp -r zync-export/ user@your-server.com:/home/user/

# Or upload via SFTP using FileZilla
```

### Step 2: Server Setup
```bash
# SSH into your server
ssh user@your-server.com

# Navigate to uploaded folder
cd zync-export/

# Install dependencies
npm install --only=production

# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start dist/index.js --name zync

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 3: Configure Reverse Proxy (Nginx)
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Method 3: Docker Deployment

### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY dist/ ./dist/
COPY data/ ./data/
RUN mkdir -p projects
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

### Step 2: Build and Run
```bash
docker build -t zync .
docker run -d -p 5000:5000 -v $(pwd)/data:/app/data -v $(pwd)/projects:/app/projects zync
```

## Method 4: Cloud Platforms

### Heroku
1. Create `Procfile`: `web: node dist/index.js`
2. Push to Heroku Git repository
3. Set environment variables if needed

### DigitalOcean App Platform
1. Connect your Git repository
2. Set build command: `npm install --only=production`
3. Set run command: `node dist/index.js`

### Railway/Render
1. Connect repository
2. Set start command: `node dist/index.js`
3. Deploy automatically

## Post-Deployment Checklist

✅ **Test Login**: Visit your domain and login with admin_dgn/admin123
✅ **Create Project**: Test project creation functionality
✅ **File Operations**: Test file upload/download
✅ **Settings**: Verify settings are saved
✅ **Offline Mode**: Disconnect internet and test core functions

## Troubleshooting

### Port Issues
```bash
# Change port if 5000 is occupied
PORT=8080 node dist/index.js
```

### Permission Issues
```bash
# Fix database permissions
chmod 664 data/zync.db
```

### Memory Issues
```bash
# Monitor resource usage
htop
# Or
pm2 monit
```

## Security Notes
- Change admin password after first login
- Set up SSL certificate for HTTPS
- Configure firewall to only allow necessary ports
- Regular backups of the data/ folder

## Support
All files are self-contained. No external APIs or services required for core functionality.