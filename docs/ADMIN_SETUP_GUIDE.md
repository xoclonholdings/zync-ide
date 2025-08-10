# Zync - Admin Setup Guide (Beginner-Friendly)

## Getting Started as an Administrator

### What is an Administrator?
As an administrator (or "admin"), you have special permission to control Zync. Think of yourself as the manager who approves requests and keeps everything running smoothly.

### 1. Your First Login

When you start Zync for the first time, use these login details:
- **Username:** admin
- **Password:** admin

**Important:** Change this password right away! It's like leaving your front door key under the mat - anyone could find it.

### 2. Changing Your Password

Here's how to make your account secure:

1. After logging in, look for your username in the top-right corner
2. Click on it and choose "Settings"
3. Find the "Security" section
4. Create a new, strong password

**What makes a good password?**
- At least 12 letters and numbers
- Mix capital letters (A, B, C) with small letters (a, b, c)
- Add some numbers (1, 2, 3) and symbols (!, @, #)
- Don't use your name, birthday, or common words like "password"

### 3. How Zync Works (The Approval System)

Zync is designed to be very safe. Users can't do anything without your permission first.

**What needs your approval?**
- Creating new projects
- Running any code
- Using the terminal (command line)
- Installing new software
- Creating or deleting files
- Connecting to other services

**How it works:**
1. A user tries to do something
2. Zync asks for your permission
3. You say "yes" or "no"
4. The user gets told your decision

### 4. Approving User Requests

You'll see requests in the Admin Panel. Here's how to handle them:

**To access the Admin Panel:**
- Look for an "Admin" button in your main menu
- Or type this in your web browser: `http://localhost:5000/admin`

**What you can do:**
- See all waiting requests
- Approve safe requests
- Reject dangerous or unnecessary requests
- See a history of past decisions
- Set emergency mode (automatically approves everything for 1 hour)

### 5. Adding New Users

When someone new needs to use Zync:

1. Go to Admin Panel
2. Find "Users" section
3. Click "Add User"
4. Fill in their name and email
5. Choose their permission level:
   - **Basic User:** Needs approval for everything (most common)
   - **Power User:** Same as basic but gets faster responses
   - **Admin:** Can approve requests like you (be careful with this!)

### 6. Connecting to External Services

Zync can work with other security and database systems:

**Fantasma Firewall (for extra security):**
1. Go to Settings → Integrations
2. Click "Setup Fantasma Firewall"
3. Enter the web address they gave you
4. Enter your special access key
5. Test it works
6. Save your settings

**Zebulon Oracle Interface (for database features):**
1. Go to Settings → Integrations
2. Click "Setup Zebulon Interface"
3. Enter their web address
4. Enter your login details
5. Test the connection
6. Turn on the features you want

### 7. Keeping an Eye on Things

**System Health Check:**
Your admin dashboard shows important information:
- Is the database working properly?
- How much storage space is left?
- How many people are logged in?
- How many requests are waiting for approval?
- Is the computer running smoothly?

**Security Records:**
Zync keeps track of everything important:
- When people log in and out
- What you approved or rejected
- Any changes to settings
- Security alerts
- Any problems that occurred

### 8. Backing Up Your Data

Think of backups like making photocopies of important documents.

**Manual Backup (do this monthly):**
1. Find your Zync folder on your computer
2. Look for "data" folder
3. Copy the "database.sqlite" file
4. Save it somewhere safe with today's date in the name

**Automatic Backups:**
1. Go to Admin Panel → Backup Settings
2. Turn on "Automatic Backups"
3. Choose how long to keep old backups
4. Pick where to save them
5. Test that it works

### 9. When Things Go Wrong

**Can't log in?**
- Double-check your username and password
- Make sure Zync is running
- Look at the error messages for clues

**Approval system not working?**
- Check that you're still logged in as admin
- Look for error messages
- Restart Zync if needed

**External services not connecting?**
- Check your internet connection
- Verify the web addresses are correct
- Make sure your access keys haven't expired

### 10. Daily Admin Tasks

**Every morning:**
- Check for approval requests (don't keep users waiting!)
- Look at the health dashboard (is everything green?)
- Read any overnight alerts
- Make sure backups completed
- Check how much storage space is left

**Regular maintenance:**
- **Weekly:** Review who has access and what permissions they have
- **Monthly:** Check security settings and update passwords if needed
- **Every few months:** Review how well the system is performing
- **When needed:** Train new users on how to make requests properly

---

**Remember:**
- Always keep at least one admin account active (don't lock yourself out!)
- Test any changes in a safe environment first
- Keep your admin password secret and strong
- Check the approval queue regularly so users don't get stuck waiting