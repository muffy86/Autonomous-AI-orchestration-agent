/**
 * AI Conversation Context Manager
 * Manages conversation context, memory, and intelligent context optimization
 */

import { z } from 'zod';
import type { Message } from 'ai';

export interface ConversationContext {
  id: string;
  userId: string;
  chatId: string;
  messages: Message[];
  summary: string;
  topics: string[];
  entities: Record<string, any>;
  preferences: UserPreferences;
  metadata: ContextMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  preferredModel: string;
  responseStyle: 'concise' | 'detailed' | 'technical' | 'casual';
  codeLanguages: string[];
  domains: string[];
  temperature: number;
  maxTokens: number;
  useReasoning: boolean;
  enableVision: boolean;
}

export interface ContextMetadata {
  tokenCount: number;
  messageCount: number;
  averageResponseTime: number;
  lastActivity: Date;
  contextWindow: number;
  compressionRatio: number;
  qualityScore: number;
}

export interface ContextSummary {
  mainTopics: string[];
  keyEntities: Record<string, any>;
  userIntent: string;
  conversationFlow: string[];
  importantMessages: string[];
  codeSnippets: Array<{ language: string; code: string; purpose: string }>;
  decisions: Array<{ question: string; answer: string; reasoning: string }>;
}

export class ConversationContextManager {
  private static instance: ConversationContextManager;
  private contexts: Map<string, ConversationContext>;
  private summaries: Map<string, ContextSummary>;

  private constructor() {
    this.contexts = new Map();
    this.summaries = new Map();
  }

  static getInstance(): ConversationContextManager {
    if (!ConversationContextManager.instance) {
      ConversationContextManager.instance = new ConversationContextManager();
    }
    return ConversationContextManager.instance;
  }

  async createContext(
    chatId: string,
    userId: string,
    initialPreferences?: Partial<UserPreferences>
  ): Promise<ConversationContext> {
    const defaultPreferences: UserPreferences = {
      preferredModel: 'grok-2-vision-1212',
      responseStyle: 'detailed',
      codeLanguages: ['python', 'javascript', 'typescript'],
      domains: ['general'],
      temperature: 0.7,
      maxTokens: 2048,
      useReasoning: false,
      enableVision: true,
    };

    const context: ConversationContext = {
      id: `ctx_${chatId}_${Date.now()}`,
      userId,
      chatId,
      messages: [],
      summary: '',
      topics: [],
      entities: {},
      preferences: { ...defaultPreferences, ...initialPreferences },
      metadata: {
        tokenCount: 0,
        messageCount: 0,
        averageResponseTime: 0,
        lastActivity: new Date(),
        contextWindow: 131072,
        compressionRatio: 1.0,
        qualityScore: 1.0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contexts.set(chatId, context);
    return context;
  }

  getContext(chatId: string): ConversationContext | null {
    return this.contexts.get(chatId) || null;
  }

  async updateContext(
    chatId: string,
    messages: Message[],
    responseTime?: number
  ): Promise<ConversationContext | null> {
    const context = this.contexts.get(chatId);
    if (!context) return null;

    context.messages = messages;
    context.metadata.messageCount = messages.length;
    context.metadata.tokenCount = this.estimateTokenCount(messages);
    context.metadata.lastActivity = new Date();
    context.updatedAt = new Date();

    if (responseTime) {
      const currentAvg = context.metadata.averageResponseTime;
      const messageCount = context.metadata.messageCount;
      context.metadata.averageResponseTime = 
        (currentAvg * (messageCount - 1) + responseTime) / messageCount;
    }

    // Update topics and entities
    await this.extractTopicsAndEntities(context);

    // Check if context needs compression
    if (this.shouldCompressContext(context)) {
      await this.compressContext(context);
    }

    // Update quality score
    context.metadata.qualityScore = this.calculateQualityScore(context);

    this.contexts.set(chatId, context);
    return context;
  }

  private estimateTokenCount(messages: Message[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    return messages.reduce((total, message) => {
      const content = typeof message.content === 'string' 
        ? message.content 
        : JSON.stringify(message.content);
      return total + Math.ceil(content.length / 4);
    }, 0);
  }

  private async extractTopicsAndEntities(context: ConversationContext): Promise<void> {
    const recentMessages = context.messages.slice(-10); // Last 10 messages
    const text = recentMessages
      .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
      .join(' ');

    // Simple topic extraction (in a real implementation, you'd use NLP)
    const topics = this.extractTopics(text);
    const entities = this.extractEntities(text);

    context.topics = [...new Set([...context.topics, ...topics])].slice(0, 20);
    context.entities = { ...context.entities, ...entities };
  }

  private extractTopics(text: string): string[] {
    // Simple keyword-based topic extraction
    const topicKeywords = {
      'programming': ['code', 'function', 'variable', 'programming', 'development', 'software'],
      'ai': ['ai', 'artificial intelligence', 'machine learning', 'neural network', 'model'],
      'web': ['html', 'css', 'javascript', 'react', 'website', 'frontend', 'backend'],
      'data': ['data', 'database', 'sql', 'analytics', 'visualization', 'statistics'],
      'science': ['research', 'experiment', 'hypothesis', 'analysis', 'scientific'],
      'business': ['business', 'strategy', 'marketing', 'sales', 'revenue', 'profit'],
      'education': ['learn', 'teach', 'education', 'course', 'tutorial', 'study'],
    };

    const lowerText = text.toLowerCase();
    const detectedTopics: string[] = [];

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedTopics.push(topic);
      }
    });

    return detectedTopics;
  }

  private extractEntities(text: string): Record<string, any> {
    // Simple entity extraction (in a real implementation, you'd use NER)
    const entities: Record<string, any> = {};

    // Extract code languages
    const codeLanguages = ['python', 'javascript', 'typescript', 'java', 'c++', 'rust', 'go'];
    const detectedLanguages = codeLanguages.filter(lang => 
      text.toLowerCase().includes(lang)
    );
    if (detectedLanguages.length > 0) {
      entities.codeLanguages = detectedLanguages;
    }

    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex);
    if (urls) {
      entities.urls = urls;
    }

    // Extract file extensions
    const fileExtRegex = /\.\w{2,4}\b/g;
    const extensions = text.match(fileExtRegex);
    if (extensions) {
      entities.fileExtensions = [...new Set(extensions)];
    }

    return entities;
  }

  private shouldCompressContext(context: ConversationContext): boolean {
    const maxTokens = context.metadata.contextWindow * 0.8; // Use 80% of context window
    return context.metadata.tokenCount > maxTokens;
  }

  private async compressContext(context: ConversationContext): Promise<void> {
    // Create summary of older messages
    const messagesToCompress = context.messages.slice(0, -20); // Keep last 20 messages
    const summary = await this.createSummary(messagesToCompress);
    
    // Update context
    context.summary = summary.userIntent + '\n\n' + summary.conversationFlow.join('\n');
    context.messages = context.messages.slice(-20); // Keep only recent messages
    context.metadata.compressionRatio = 
      context.metadata.tokenCount / this.estimateTokenCount(context.messages);
    context.metadata.tokenCount = this.estimateTokenCount(context.messages);

    // Store detailed summary separately
    this.summaries.set(context.chatId, summary);
  }

  private async createSummary(messages: Message[]): Promise<ContextSummary> {
    // In a real implementation, this would use an AI model to create summaries
    const text = messages
      .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
      .join('\n');

    return {
      mainTopics: this.extractTopics(text),
      keyEntities: this.extractEntities(text),
      userIntent: this.inferUserIntent(messages),
      conversationFlow: this.extractConversationFlow(messages),
      importantMessages: this.extractImportantMessages(messages),
      codeSnippets: this.extractCodeSnippets(messages),
      decisions: this.extractDecisions(messages),
    };
  }

  private inferUserIntent(messages: Message[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 'General conversation';

    const firstMessage = userMessages[0];
    const content = typeof firstMessage.content === 'string' 
      ? firstMessage.content 
      : JSON.stringify(firstMessage.content);

    // Simple intent classification
    if (content.toLowerCase().includes('help') || content.includes('?')) {
      return 'Seeking help or information';
    }
    if (content.toLowerCase().includes('create') || content.toLowerCase().includes('build')) {
      return 'Creating or building something';
    }
    if (content.toLowerCase().includes('explain') || content.toLowerCase().includes('how')) {
      return 'Learning or understanding';
    }
    if (content.toLowerCase().includes('fix') || content.toLowerCase().includes('error')) {
      return 'Troubleshooting or debugging';
    }

    return 'General conversation';
  }

  private extractConversationFlow(messages: Message[]): string[] {
    return messages
      .filter(m => m.role === 'user')
      .map(m => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return content.substring(0, 100) + (content.length > 100 ? '...' : '');
      })
      .slice(0, 10);
  }

  private extractImportantMessages(messages: Message[]): string[] {
    // Extract messages that contain important information
    return messages
      .filter(m => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return content.length > 200 || 
               content.includes('```') || 
               content.toLowerCase().includes('important') ||
               content.toLowerCase().includes('remember');
      })
      .map(m => {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        return content.substring(0, 200) + (content.length > 200 ? '...' : '');
      })
      .slice(0, 5);
  }

  private extractCodeSnippets(messages: Message[]): Array<{ language: string; code: string; purpose: string }> {
    const codeSnippets: Array<{ language: string; code: string; purpose: string }> = [];
    
    messages.forEach(message => {
      const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[1] || 'unknown';
        const code = match[2].trim();
        const purpose = this.inferCodePurpose(code);

        codeSnippets.push({ language, code, purpose });
      }
    });

    return codeSnippets.slice(0, 10);
  }

  private inferCodePurpose(code: string): string {
    if (code.includes('function') || code.includes('def ')) return 'Function definition';
    if (code.includes('class ')) return 'Class definition';
    if (code.includes('import ') || code.includes('require(')) return 'Import/dependency';
    if (code.includes('if ') || code.includes('for ') || code.includes('while ')) return 'Logic/control flow';
    if (code.includes('console.log') || code.includes('print(')) return 'Debug/output';
    return 'Code snippet';
  }

  private extractDecisions(messages: Message[]): Array<{ question: string; answer: string; reasoning: string }> {
    // Extract Q&A pairs and decisions made during conversation
    const decisions: Array<{ question: string; answer: string; reasoning: string }> = [];
    
    for (let i = 0; i < messages.length - 1; i++) {
      const current = messages[i];
      const next = messages[i + 1];

      if (current.role === 'user' && next.role === 'assistant') {
        const question = typeof current.content === 'string' ? current.content : JSON.stringify(current.content);
        const answer = typeof next.content === 'string' ? next.content : JSON.stringify(next.content);

        if (question.includes('?') || question.toLowerCase().includes('should') || 
            question.toLowerCase().includes('which') || question.toLowerCase().includes('how')) {
          decisions.push({
            question: question.substring(0, 200),
            answer: answer.substring(0, 300),
            reasoning: 'Based on conversation context'
          });
        }
      }
    }

    return decisions.slice(0, 5);
  }

  private calculateQualityScore(context: ConversationContext): number {
    let score = 1.0;

    // Penalize for high compression ratio
    if (context.metadata.compressionRatio > 2) {
      score -= 0.2;
    }

    // Reward for diverse topics
    if (context.topics.length > 3) {
      score += 0.1;
    }

    // Penalize for very long response times
    if (context.metadata.averageResponseTime > 10000) { // 10 seconds
      score -= 0.1;
    }

    // Reward for rich entities
    if (Object.keys(context.entities).length > 5) {
      score += 0.1;
    }

    return Math.max(0.1, Math.min(1.0, score));
  }

  getSummary(chatId: string): ContextSummary | null {
    return this.summaries.get(chatId) || null;
  }

  updatePreferences(chatId: string, preferences: Partial<UserPreferences>): boolean {
    const context = this.contexts.get(chatId);
    if (!context) return false;

    context.preferences = { ...context.preferences, ...preferences };
    context.updatedAt = new Date();
    return true;
  }

  getOptimalModel(chatId: string): string {
    const context = this.contexts.get(chatId);
    if (!context) return 'grok-2-vision-1212';

    // Choose model based on context and preferences
    if (context.topics.includes('programming') && context.preferences.codeLanguages.length > 0) {
      return 'grok-2-1212'; // Good for coding
    }

    if (context.topics.includes('ai') || context.preferences.useReasoning) {
      return 'grok-3-mini-beta'; // Good for reasoning
    }

    if (context.entities.urls || context.preferences.enableVision) {
      return 'grok-2-vision-1212'; // Good for multimodal
    }

    return context.preferences.preferredModel;
  }

  cleanup(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleaned = 0;
    for (const [chatId, context] of this.contexts.entries()) {
      if (context.metadata.lastActivity < cutoffDate) {
        this.contexts.delete(chatId);
        this.summaries.delete(chatId);
        cleaned++;
      }
    }

    return cleaned;
  }

  getStats(): {
    totalContexts: number;
    averageTokenCount: number;
    averageQualityScore: number;
    topTopics: Array<{ topic: string; count: number }>;
  } {
    const contexts = Array.from(this.contexts.values());
    
    const totalContexts = contexts.length;
    const averageTokenCount = contexts.reduce((sum, ctx) => sum + ctx.metadata.tokenCount, 0) / totalContexts || 0;
    const averageQualityScore = contexts.reduce((sum, ctx) => sum + ctx.metadata.qualityScore, 0) / totalContexts || 0;

    // Count topics
    const topicCounts = new Map<string, number>();
    contexts.forEach(ctx => {
      ctx.topics.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    return {
      totalContexts,
      averageTokenCount,
      averageQualityScore,
      topTopics,
    };
  }
}

// Validation schemas
export const contextPreferencesSchema = z.object({
  preferredModel: z.string().optional(),
  responseStyle: z.enum(['concise', 'detailed', 'technical', 'casual']).optional(),
  codeLanguages: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
  useReasoning: z.boolean().optional(),
  enableVision: z.boolean().optional(),
});

export type ContextPreferencesUpdate = z.infer<typeof contextPreferencesSchema>;

// Export singleton instance
export const contextManager = ConversationContextManager.getInstance();