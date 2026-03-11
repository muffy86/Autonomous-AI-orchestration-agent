# System Connection Setup

This document describes the system connections configured for the AI Chatbot application.

## ✅ Completed Setup

### 1. PostgreSQL Database
- **Status**: Connected and ready
- **Database**: `ai_chatbot`
- **User**: `chatbot_user`
- **Host**: `localhost:5432`
- **Tables**: All schema tables created via migrations

### 2. Redis Cache
- **Status**: Connected and ready
- **Host**: `localhost:6379`
- **Purpose**: Caching and session management

### 3. Environment Variables
The following environment variables have been configured in `.env.local`:

#### Required (Configured):
- ✅ `AUTH_SECRET` - Authentication secret key
- ✅ `POSTGRES_URL` - PostgreSQL connection string
- ✅ `REDIS_URL` - Redis connection URL
- ✅ `OPENAI_API_KEY` - OpenAI API key for AI features

#### Optional (Not Configured):
- ⚠️ `XAI_API_KEY` - xAI API key (can be added if needed)
- ⚠️ `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (for file uploads)

## 🚀 Running the Application

### Start Development Server
```bash
pnpm dev
```

The application will be available at: http://localhost:3000

### Verify Connections
Run the verification script to check all connections:
```bash
node scripts/verify-connections.js
```

## 🗄️ Database Management

### Run Migrations
```bash
pnpm db:migrate
```

### Access Database Studio
```bash
pnpm db:studio
```

### Generate New Migrations
```bash
pnpm db:generate
```

## 📊 Database Schema

The following tables have been created:
- `User` - User accounts
- `Chat` - Chat conversations
- `Message` / `Message_v2` - Chat messages
- `Vote` / `Vote_v2` - Message votes
- `Document` - Document storage
- `Suggestion` - Document suggestions
- `Stream` - Streaming sessions

## 🔧 Services

### PostgreSQL
```bash
sudo service postgresql status
sudo service postgresql start
sudo service postgresql stop
```

### Redis
```bash
sudo service redis-server status
sudo service redis-server start
sudo service redis-server stop
```

## 🔐 Security Notes

- The `.env.local` file is excluded from git for security
- Database credentials are local development credentials
- For production, use environment-specific credentials
- Never commit API keys or secrets to version control

## 📝 Next Steps

1. **Add xAI API Key** (optional): If you want to use xAI's Grok models, add your API key to `.env.local`
2. **Add Blob Storage** (optional): For file upload functionality, configure Vercel Blob storage
3. **Customize Configuration**: Modify environment variables as needed for your setup

## ✨ Features Available

With the current setup, you have access to:
- ✅ User authentication
- ✅ Chat conversations with AI (using OpenAI)
- ✅ Message history persistence
- ✅ Document editing and suggestions
- ✅ Session caching via Redis
- ⚠️ File uploads (requires Blob storage configuration)

## 🆘 Troubleshooting

If you encounter connection issues:

1. Check service status:
   ```bash
   sudo service postgresql status
   sudo service redis-server status
   ```

2. Verify connections:
   ```bash
   node scripts/verify-connections.js
   ```

3. Check logs:
   ```bash
   # PostgreSQL logs
   sudo tail -f /var/log/postgresql/postgresql-16-main.log
   
   # Redis logs
   sudo tail -f /var/log/redis/redis-server.log
   ```

4. Test database connection:
   ```bash
   psql postgresql://chatbot_user:chatbot_password@localhost:5432/ai_chatbot
   ```

5. Test Redis connection:
   ```bash
   redis-cli ping
   ```
