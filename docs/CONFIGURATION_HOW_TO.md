# Zync - Configuration Guide (Simple Steps)

## What is Configuration?
Configuration means setting up Zync to work the way you want it to. Think of it like customizing your phone settings - you're telling the system your preferences.

## Getting Started

### 1. First Things First

Before configuring anything, make sure:
- You're logged in as an admin
- Zync is running properly
- You have your passwords and access keys ready

### 2. Basic System Settings

**Changing System Name:**
1. Go to Settings (click your username, then "Settings")
2. Find "General" tab
3. Change "System Name" from "Zync" to whatever you want
4. Click "Save"

**Setting Time Zone:**
1. Still in Settings → General
2. Find "Time Zone" dropdown
3. Pick your location
4. Save changes

**Language Settings:**
1. In Settings → General
2. Choose your preferred language
3. Save (the interface will update)

### 3. User Settings

**Who Can Register:**
1. Go to Settings → Users
2. Choose one option:
   - "Open Registration" - Anyone can create an account
   - "Invite Only" - Only people you invite can join
   - "Closed" - No new users allowed

**Default User Permissions:**
When someone new joins, what can they do?
1. Settings → Users → Default Permissions
2. Choose:
   - "Basic" - Need approval for everything (recommended)
   - "Advanced" - Can do simple tasks without approval
   - "Limited" - Very restricted access

### 4. Security Settings

**Password Rules:**
Make passwords stronger for everyone:
1. Settings → Security → Password Policy
2. Set minimum length (recommend 8 or more)
3. Require numbers? (Yes/No)
4. Require symbols like !, @, #? (Yes/No)
5. Save changes

**Session Timeout:**
How long someone stays logged in:
1. Settings → Security → Sessions
2. Pick timeout duration:
   - 1 hour (high security)
   - 8 hours (normal work day)
   - 24 hours (convenient but less secure)

**Two-Factor Authentication (Extra Security):**
1. Settings → Security → Two-Factor
2. Turn it on for admins (recommended)
3. Users will need their phone to log in

### 5. Storage Settings

**Where Files Are Saved:**
1. Settings → Storage → Location
2. Choose folder on your computer
3. Make sure there's enough space
4. Test by creating a small file

**File Size Limits:**
How big can uploaded files be?
1. Settings → Storage → Limits
2. Set maximum file size:
   - 10MB for small files (documents)
   - 100MB for medium files (presentations)
   - 1GB for large files (videos)

**Cleanup Rules:**
Automatically delete old files:
1. Settings → Storage → Cleanup
2. Delete temp files after: 7 days (recommended)
3. Archive old projects after: 90 days
4. Turn on automatic cleanup

### 6. Integration Settings

**Connecting External Services:**

Think of integrations like connecting your phone to your car - they work together.

**Fantasma Firewall Setup:**
1. Settings → Integrations → Fantasma
2. Enter the web address (URL) they gave you
3. Enter your access key (like a password)
4. Click "Test Connection"
5. If green checkmark appears, click "Save"

**Zebulon Database Setup:**
1. Settings → Integrations → Zebulon
2. Enter their web address
3. Enter your username and password
4. Test connection
5. Choose which features to enable
6. Save settings

### 7. Backup Configuration

**Automatic Backups:**
Like having a safety copy of everything important.

1. Settings → Backup → Schedule
2. Turn on "Enable Automatic Backup"
3. Choose frequency:
   - Daily (recommended for active use)
   - Weekly (for lighter use)
   - Monthly (minimum recommendation)
4. Pick backup time (when computer isn't busy)
5. Choose where to save backups

**What Gets Backed Up:**
1. Settings → Backup → Content
2. Check boxes for:
   - User accounts ✓
   - Projects and files ✓
   - System settings ✓
   - Integration configs ✓
   - Security logs ✓

### 8. Email Notifications

**Setting Up Email Alerts:**
1. Settings → Notifications → Email
2. Enter your email server details:
   - **Server:** Usually something like smtp.gmail.com
   - **Username:** Your email address
   - **Password:** Your email password or app password
   - **Port:** Usually 587 (your email provider will tell you)
3. Test by sending yourself an email
4. Choose what to get notified about:
   - New user registrations
   - Approval requests
   - System errors
   - Security alerts

### 9. Performance Settings

**Making Zync Run Faster:**

**Memory Settings:**
1. Settings → Performance → Memory
2. Allocate RAM (computer memory):
   - 2GB for small teams (under 10 users)
   - 4GB for medium teams (10-50 users)
   - 8GB for large teams (50+ users)

**Database Optimization:**
1. Settings → Performance → Database
2. Turn on "Auto-optimize" (recommended)
3. Set optimization schedule to "Weekly"

### 10. Troubleshooting Configuration

**Settings Not Saving?**
- Check if you're still logged in
- Make sure you clicked "Save" button
- Look for red error messages
- Try refreshing the page

**Can't Connect to External Services?**
- Double-check the web address (URL)
- Verify your username and password
- Test your internet connection
- Contact the service provider for help

**Users Can't Log In After Changes?**
- Check password policy isn't too strict
- Verify user accounts are still active
- Look at security logs for clues
- Try logging in as admin first

**Email Notifications Not Working?**
- Test email server settings
- Check spam/junk folder
- Verify email addresses are correct
- Try sending a test email manually

### 11. Recommended Settings for Beginners

**Safe Starting Configuration:**
- Registration: Invite Only
- Default Permissions: Basic
- Password Policy: 8 characters minimum
- Session Timeout: 8 hours
- File Size Limit: 100MB
- Backups: Daily at 2 AM
- Email Notifications: On for errors and approvals

**Security-First Configuration:**
- Registration: Closed
- Default Permissions: Limited
- Password Policy: 12 characters, numbers and symbols required
- Session Timeout: 1 hour
- Two-Factor Authentication: Required for admins
- Backups: Daily
- All notifications enabled

---

**Important Tips:**
- Always test changes with a non-admin account first
- Write down your configuration choices
- Take screenshots of working settings
- Ask for help if something seems wrong
- Change default passwords immediately