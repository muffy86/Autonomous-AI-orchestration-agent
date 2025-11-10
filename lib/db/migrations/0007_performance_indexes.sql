-- Performance optimization indexes
-- Created for enhanced query performance

-- Chat queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_user_created 
ON "Chat" (userId, createdAt DESC);

-- Message queries optimization  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_chat_created 
ON "Message_v2" (chatId, createdAt ASC);

-- Message role filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_role 
ON "Message_v2" (role);

-- Document queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_user_created 
ON "Document" (userId, createdAt DESC);

-- Document kind filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_kind 
ON "Document" (kind);

-- Full-text search on documents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_search 
ON "Document" USING gin(to_tsvector('english', title || ' ' || coalesce(content, '')));

-- Vote queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_chat_message 
ON "Vote_v2" (chatId, messageId);

-- Vote filtering by type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vote_upvoted 
ON "Vote_v2" (isUpvoted);

-- Stream queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_chat_created 
ON "Stream" (chatId, createdAt DESC);

-- Suggestion queries optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_document 
ON "Suggestion" (documentId, documentCreatedAt);

-- Suggestion status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_resolved 
ON "Suggestion" (isResolved);

-- User email lookup (if not already exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email 
ON "User" (email);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_user_visibility 
ON "Chat" (userId, visibility, createdAt DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_user_kind 
ON "Document" (userId, kind, createdAt DESC);

-- Partial indexes for better performance on filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_public 
ON "Chat" (createdAt DESC) WHERE visibility = 'public';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suggestion_unresolved 
ON "Suggestion" (documentId, createdAt DESC) WHERE isResolved = false;