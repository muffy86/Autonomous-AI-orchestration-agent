# Architecture Documentation

## System Overview

The AI Chatbot is a modern, scalable web application built with Next.js 15, leveraging React Server Components, edge functions, and a PostgreSQL database for real-time AI-powered conversations.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐          │
│  │   Browser  │  │   Mobile   │  │  Desktop App │          │
│  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘          │
│         │                │                │                  │
│         └────────────────┴────────────────┘                  │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                  Application Layer (Next.js)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           App Router (React Server Components)        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Pages    │  API Routes  │  Middleware  │  Actions   │   │
│  └──────────────────────────────────────────────────────┘   │
│         │              │            │            │            │
│  ┌──────┴──────┐  ┌───┴────┐  ┌───┴────┐  ┌───┴────┐      │
│  │ Components  │  │   AI   │  │Security│  │Database│      │
│  │   Library   │  │  Layer │  │ Layer  │  │ Layer  │      │
│  └─────────────┘  └────────┘  └────────┘  └────────┘      │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                   Infrastructure Layer                        │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐    │
│  │PostgreSQL│  │  Redis  │  │ AI Models│  │  Vercel  │    │
│  │    DB    │  │  Cache  │  │  (xAI)   │  │  Edge    │    │
│  └──────────┘  └─────────┘  └──────────┘  └──────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **React**: v19 RC (Server Components)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks + SWR
- **Type Safety**: TypeScript 5.9

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes + Server Actions
- **Database ORM**: Drizzle ORM
- **Authentication**: NextAuth.js v5

### Database & Storage
- **Primary Database**: PostgreSQL (Neon/Vercel Postgres)
- **Caching**: Redis (optional)
- **File Storage**: Vercel Blob
- **Search**: PostgreSQL Full-Text Search

### AI & ML
- **Primary Provider**: xAI (Grok models)
- **Framework**: Vercel AI SDK
- **Fallback**: OpenAI, Anthropic support

### DevOps & CI/CD
- **Hosting**: Vercel (Edge Functions)
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics
- **Error Tracking**: Built-in logging

## Directory Structure

```
ai-chatbot/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (chat)/                   # Main chat interface
│   │   ├── page.tsx             # Chat home
│   │   ├── [id]/                # Individual chat
│   │   └── api/                 # Chat API routes
│   └── api/                      # API endpoints
│       ├── auth/                # Auth endpoints
│       ├── chat/                # Chat operations
│       ├── files/               # File operations
│       └── vote/                # Message voting
│
├── components/                   # React components
│   ├── ui/                      # Base UI components (shadcn)
│   ├── auth-form.tsx            # Authentication forms
│   ├── chat.tsx                 # Main chat component
│   ├── message.tsx              # Message display
│   └── ...                      # Other components
│
├── lib/                          # Shared utilities & logic
│   ├── ai/                      # AI-related code
│   │   ├── enhanced-models.ts   # Model management
│   │   ├── prompt-optimizer.ts  # Prompt optimization
│   │   ├── context-manager.ts   # Context management
│   │   └── tools/               # AI tools
│   ├── db/                      # Database layer
│   │   ├── schema.ts            # Database schema
│   │   ├── queries.ts           # Query functions
│   │   ├── optimizations.ts     # Query optimization
│   │   ├── analytics.ts         # DB analytics
│   │   ├── connection-pool.ts   # Connection pooling
│   │   └── migrations/          # SQL migrations
│   ├── security.ts              # Security utilities
│   ├── utils.ts                 # General utilities
│   └── errors.ts                # Error handling
│
├── __tests__/                    # Test files
│   ├── integration/             # Integration tests
│   ├── ai/                      # AI tests
│   ├── db/                      # Database tests
│   ├── security/                # Security tests
│   └── ...                      # Other tests
│
├── docs/                         # Documentation
├── public/                       # Static assets
└── .github/                      # GitHub configuration
    └── workflows/               # CI/CD workflows
```

## Data Flow

### User Authentication Flow

```
User Input → Auth Form → Server Action → NextAuth
                                ↓
                          Verify Credentials
                                ↓
                         Update Database
                                ↓
                          Set Session Cookie
                                ↓
                           Redirect User
```

### Chat Message Flow

```
User Types Message
    ↓
Client validates input
    ↓
Send to API route (/api/chat)
    ↓
Rate limiting check
    ↓
Sanitize input
    ↓
Save to database
    ↓
Stream to AI model (xAI)
    ↓
Stream response back to client
    ↓
Save AI response to database
    ↓
Update UI in real-time
```

### Database Query Flow

```
Request Data
    ↓
Check cache (if enabled)
    ├─ Cache Hit → Return cached data
    └─ Cache Miss ↓
              Query Database
                    ↓
              Apply optimizations
                    ↓
              Cache result
                    ↓
              Return data
```

## Core Components

### 1. Authentication System

**Location**: `app/(auth)/`, `lib/auth/`

**Flow**:
1. User submits credentials
2. Server Action validates input
3. NextAuth verifies credentials
4. Session created
5. User redirected

**Security**:
- Password hashing with bcrypt
- CSRF protection
- Secure session cookies
- Rate limiting on auth endpoints

### 2. Chat System

**Location**: `app/(chat)/`, `components/chat.tsx`

**Components**:
- **Chat List**: Displays user's chats
- **Chat Window**: Active conversation
- **Message Input**: User input area
- **Message Display**: Renders messages with syntax highlighting

**Features**:
- Real-time streaming responses
- Markdown rendering
- Code syntax highlighting
- File attachments
- Message reactions

### 3. AI Integration

**Location**: `lib/ai/`

**Components**:
- **Model Manager**: Manages AI models and selection
- **Prompt Optimizer**: Optimizes user prompts
- **Context Manager**: Manages conversation context
- **Tools**: Code analyzer, document analyzer, etc.

**Workflow**:
```
User Prompt
    ↓
Prompt Optimization
    ↓
Context Building
    ↓
Model Selection
    ↓
API Call to xAI
    ↓
Response Streaming
    ↓
Context Update
```

### 4. Database Layer

**Location**: `lib/db/`

**Schema**:
- `users` - User accounts
- `chats` - Chat sessions
- `messages` - Chat messages
- `documents` - Uploaded documents
- `votes` - Message votes
- `stream` - AI stream data

**Optimizations**:
- Query caching
- Connection pooling
- Batch operations
- Prepared statements
- Index optimization

### 5. Security Layer

**Location**: `lib/security.ts`, `middleware.ts`

**Features**:
- Input sanitization (HTML, text)
- Rate limiting per endpoint
- Security headers (CSP, HSTS, etc.)
- CSRF protection
- SQL injection prevention
- XSS protection

## API Design

### RESTful Endpoints

```
GET    /api/chat              # List user's chats
POST   /api/chat              # Create new chat
GET    /api/chat/[id]         # Get chat details
DELETE /api/chat/[id]         # Delete chat

GET    /api/chat/[id]/messages    # Get messages
POST   /api/chat/[id]/messages    # Send message

POST   /api/files/upload      # Upload file
GET    /api/files/[id]        # Download file

POST   /api/vote              # Vote on message
```

### Server Actions

```typescript
// app/(auth)/actions.ts
export async function login(formData: FormData)
export async function register(formData: FormData)

// app/(chat)/actions.ts
export async function saveChat(chat: Chat)
export async function deleteChat(chatId: string)
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Chats Table

```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Messages Table

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Full-text search
CREATE INDEX idx_messages_content_fts ON messages 
  USING GIN (to_tsvector('english', content));
```

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────┐
│   Client-Side Validation            │
├─────────────────────────────────────┤
│   Rate Limiting (Middleware)        │
├─────────────────────────────────────┤
│   Input Sanitization                │
├─────────────────────────────────────┤
│   Authentication & Authorization    │
├─────────────────────────────────────┤
│   SQL Injection Prevention (ORM)    │
├─────────────────────────────────────┤
│   Security Headers                  │
├─────────────────────────────────────┤
│   HTTPS/TLS                         │
└─────────────────────────────────────┘
```

### Rate Limiting Strategy

```typescript
const rateLimitConfig = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                    // 5 attempts
  },
  chat: {
    windowMs: 60 * 1000,       // 1 minute
    max: 30,                   // 30 messages
  },
  upload: {
    windowMs: 60 * 1000,       // 1 minute
    max: 10,                   // 10 uploads
  },
};
```

## Performance Optimizations

### 1. React Server Components

- Render components on server
- Reduce JavaScript bundle size
- Improve initial page load
- Automatic code splitting

### 2. Database Optimizations

- Query caching (5-minute TTL)
- Connection pooling (max 20 connections)
- Prepared statements
- Batch operations
- Read replicas for scaling

### 3. Asset Optimization

- Next.js Image optimization
- Font subsetting
- Code splitting
- Tree shaking
- Minification

### 4. Caching Strategy

```
Browser Cache (Static Assets)
    ↓
CDN Cache (Vercel Edge)
    ↓
Application Cache (Redis)
    ↓
Database Query Cache
    ↓
Database
```

## Scalability Considerations

### Horizontal Scaling

- **Application**: Multiple Next.js instances via Vercel
- **Database**: Read replicas for read-heavy operations
- **Cache**: Redis cluster for distributed caching
- **AI**: Multiple model endpoints with load balancing

### Vertical Scaling

- **Database**: Increase connection pool size
- **Memory**: Optimize React component rendering
- **CPU**: Efficient algorithms, minimize computations

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| TTFB | < 200ms | ~150ms |
| FCP | < 1.0s | ~1.2s |
| LCP | < 2.5s | ~2.1s |
| API Response | < 200ms | ~180ms |
| Database Query | < 50ms | ~45ms |

## Deployment Architecture

### Vercel Edge Network

```
User Request
    ↓
Vercel Edge (CDN)
    ├─ Static Assets → Cached
    ├─ API Routes → Edge Function
    └─ Pages → Server-Side Rendering
         ↓
    Next.js Application
         ↓
    ├─ Database (PostgreSQL)
    ├─ AI Models (xAI)
    └─ File Storage (Vercel Blob)
```

### CI/CD Pipeline

```
Git Push
    ↓
GitHub Actions Triggered
    ├─ Linting
    ├─ Type Checking
    ├─ Unit Tests
    ├─ Integration Tests
    ├─ Build
    └─ Security Audit
        ↓
    All Checks Pass
        ↓
    Deploy to Vercel
        ├─ Staging (preview)
        └─ Production (main branch)
            ↓
        Post-Deploy Verification
            ├─ Health Checks
            ├─ Smoke Tests
            └─ Monitoring
```

## Monitoring & Observability

### Metrics Tracked

1. **Application Metrics**
   - Request rate
   - Response time
   - Error rate
   - Success rate

2. **Database Metrics**
   - Query performance
   - Connection pool usage
   - Slow queries
   - Index usage

3. **User Metrics**
   - Active users
   - Session duration
   - Feature usage
   - Conversion rates

4. **Infrastructure Metrics**
   - CPU usage
   - Memory usage
   - Network I/O
   - Disk I/O

## Future Architecture Considerations

### Short-term (Next Quarter)

- **Edge Functions**: Move more logic to edge
- **GraphQL**: Add GraphQL layer for flexible queries
- **WebSockets**: Real-time collaboration features
- **Service Worker**: Offline support

### Long-term (Next Year)

- **Micro-frontends**: Split into independent modules
- **Event-Driven**: Event sourcing for audit trails
- **Multi-tenant**: Support multiple organizations
- **Global CDN**: Edge caching worldwide

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Platform](https://vercel.com/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

---

**Last Updated**: 2024-11-10  
**Version**: 3.0.24  
**Maintainers**: Engineering Team
