# 🤖 AI Chatbot - Simple User Guide

**No technical knowledge needed!** This guide explains everything in plain English.

---

## 📖 Table of Contents

1. [What is this?](#what-is-this)
2. [Quick Start (5 minutes)](#quick-start)
3. [Using the Application](#using-the-application)
4. [Common Tasks](#common-tasks)
5. [Troubleshooting](#troubleshooting)
6. [Getting Help](#getting-help)

---

## What is this?

This is your AI-powered chatbot application. Think of it like ChatGPT, but one that you control completely. It can:

- Answer questions
- Help with writing
- Generate code
- Edit documents
- And much more!

Everything runs automatically - you don't need to understand how it works.

---

## Quick Start

### First Time Setup (Do this once)

1. **Open your terminal** (the black window where you type commands)

2. **Run the automatic setup:**
   ```bash
   ./scripts/setup-everything.sh
   ```
   
   That's it! The script does everything automatically:
   - Installs all needed software
   - Sets up the database
   - Creates your configuration
   - Verifies everything works

3. **Wait for it to finish** (takes 5-10 minutes)
   
   You'll see green checkmarks ✅ when each step completes.

### Starting the Application

Once setup is complete:

```bash
pnpm dev
```

Your chatbot will start and open at: **http://localhost:3000**

That's it! You're ready to use your chatbot.

---

## Using the Application

### Creating an Account

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter your email and create a password
4. Click "Create Account"

**Demo Account** (already created for you):
- Email: `demo@example.com`
- Password: `Demo123!@#`

### Starting a Chat

1. Click "New Chat" button
2. Type your message
3. Press Enter or click Send
4. The AI will respond!

### What You Can Ask

- **General Questions:** "What's the weather in Paris?"
- **Writing Help:** "Write me a professional email about..."
- **Code Help:** "Explain this code to me..."
- **Document Editing:** "Help me improve this paragraph..."

---

## Common Tasks

### ✅ Check if Everything is Working

```bash
pnpm verify:connections
```

You'll see green checkmarks ✅ if everything is OK.

### 💾 Create a Backup

Your data is automatically backed up, but you can create a manual backup:

```bash
pnpm db:backup
```

Backups are saved in the `backups/` folder.

### 📥 Restore from Backup

If something goes wrong:

```bash
pnpm db:restore
```

Choose a backup file from the list.

### 🔄 Update the Application

When updates are available:

```bash
git pull
pnpm install
pnpm db:migrate
```

### 🛑 Stop the Application

Press `Ctrl+C` in the terminal where it's running.

---

## Troubleshooting

### Problem: "Can't connect to database"

**Solution:**
```bash
sudo service postgresql start
sudo service redis-server start
pnpm verify:connections
```

### Problem: "Port 3000 already in use"

**Solution:** Something else is using port 3000. Either:
- Stop the other application, or
- Use a different port:
  ```bash
  PORT=3001 pnpm dev
  ```

### Problem: "Module not found" errors

**Solution:**
```bash
pnpm install
```

### Problem: Something broke!

**Solution 1 - Restore from backup:**
```bash
pnpm db:restore
```

**Solution 2 - Fresh start:**
```bash
./scripts/setup-everything.sh
```

---

## Helpful Commands (Copy & Paste)

| What You Want | Command to Run |
|---------------|---------------|
| Start the app | `pnpm dev` |
| Check if working | `pnpm verify:connections` |
| Create backup | `pnpm db:backup` |
| Run tests | `pnpm test:all` |
| See logs | `tail -f logs/application.log` |
| Clean install | `rm -rf node_modules && pnpm install` |

---

## Understanding the Files

You don't need to touch these, but here's what they do:

| Folder/File | What It Does |
|-------------|--------------|
| `app/` | Your chatbot's web pages |
| `lib/` | Behind-the-scenes code |
| `scripts/` | Automation scripts (the helpers) |
| `logs/` | Records of what happened |
| `backups/` | Your database backups |
| `.env.local` | Your secret settings (never share this!) |

---

## Automated Features

### Things That Happen Automatically

✅ **Backups** - Creates backups when you run the command
✅ **Security** - Blocks suspicious activity
✅ **Updates** - GitHub Actions test everything
✅ **Monitoring** - Tracks performance 
✅ **Error Logging** - Records problems for fixing
✅ **Testing** - Runs tests when you push code

---

## Security Notes

### ⚠️ Important!

1. **Never share your `.env.local` file** - it contains your passwords
2. **Use strong passwords** - at least 8 characters with numbers and symbols
3. **Backup regularly** - run `pnpm db:backup` weekly
4. **Keep it updated** - pull updates from GitHub regularly

---

## Getting Help

### 1. Check the Logs

```bash
tail -f logs/application.log
```

This shows what's happening in real-time.

### 2. Check System Health

```bash
pnpm verify:connections
```

Go to: http://localhost:3000/api/health

### 3. View Metrics

Go to: http://localhost:3000/api/metrics

This shows how your system is performing.

### 4. Common Issues

Most problems are solved by:
```bash
sudo service postgresql start
sudo service redis-server start
pnpm install
```

---

## Cheat Sheet

**Quick Commands:**
```bash
# Start
pnpm dev

# Check Health
pnpm verify:connections

# Backup
pnpm db:backup

# View Logs
tail -f logs/application.log

# Restart Services
sudo service postgresql restart
sudo service redis-server restart

# Fresh Setup
./scripts/setup-everything.sh
```

---

## Next Steps

### Want to Deploy Online?

The system is ready to deploy to:
- **Vercel** (easiest, recommended)
- **AWS**
- **Google Cloud**
- **Docker** (included configuration)

See `DEPLOYMENT_GUIDE.md` for instructions.

### Want to Customize?

- Change colors/theme: Edit `app/layout.tsx`
- Add features: Check `lib/ai/tools/`
- Modify AI behavior: Edit `lib/ai/prompts.ts`

---

## Remember

- ✅ Everything is automated
- ✅ Your data is safe (regular backups!)
- ✅ No technical knowledge needed
- ✅ Help is always available

**Just run `pnpm dev` and start chatting!** 🚀
