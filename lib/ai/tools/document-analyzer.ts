/**
 * Advanced Document Analysis Tool
 * Provides comprehensive document analysis, summarization, and insights
 */

import { tool } from 'ai';
import { z } from 'zod';

interface DocumentAnalysisResult {
  metadata: {
    wordCount: number;
    characterCount: number;
    paragraphCount: number;
    sentenceCount: number;
    readingTime: number; // in minutes
    language: string;
    documentType: string;
  };
  structure: {
    headings: Array<{ level: number; text: string; position: number }>;
    sections: Array<{ title: string; wordCount: number; summary: string }>;
    outline: string[];
  };
  content: {
    summary: string;
    keyPoints: string[];
    topics: string[];
    entities: Array<{ type: string; value: string; confidence: number }>;
    sentiment: {
      overall: 'positive' | 'negative' | 'neutral';
      score: number;
      confidence: number;
    };
  };
  quality: {
    readabilityScore: number;
    readabilityLevel: string;
    issues: Array<{
      type: 'grammar' | 'style' | 'clarity' | 'structure';
      message: string;
      severity: 'high' | 'medium' | 'low';
      position?: number;
    }>;
    suggestions: string[];
  };
  insights: {
    complexity: 'simple' | 'moderate' | 'complex';
    audience: string;
    purpose: string;
    tone: string;
    strengths: string[];
    improvements: string[];
  };
}

export const documentAnalyzer = tool({
  description:
    'Analyze documents for structure, content, quality, and provide insights and suggestions',
  parameters: z.object({
    content: z.string().min(1, 'Document content is required'),
    analysisType: z
      .enum(['full', 'summary', 'structure', 'quality', 'insights'])
      .default('full'),
    language: z
      .string()
      .optional()
      .describe('Document language (auto-detected if not provided)'),
    documentType: z
      .string()
      .optional()
      .describe('Type of document (auto-detected if not provided)'),
  }),
  execute: async ({ content, analysisType, language, documentType }) => {
    try {
      const detectedLanguage = language || detectLanguage(content);
      const detectedType = documentType || detectDocumentType(content);

      const analysis = await analyzeDocument(
        content,
        analysisType,
        detectedLanguage,
        detectedType,
      );

      return {
        success: true,
        analysis,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        timestamp: new Date().toISOString(),
      };
    }
  },
});

function detectLanguage(content: string): string {
  // Simple language detection based on common words
  const languagePatterns = {
    english: ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with'],
    spanish: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'],
    french: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'],
    german: [
      'der',
      'die',
      'und',
      'in',
      'den',
      'von',
      'zu',
      'das',
      'mit',
      'sich',
    ],
    italian: ['il', 'di', 'che', 'e', 'la', 'per', 'in', 'un', 'è', 'con'],
  };

  const lowerContent = content.toLowerCase();
  let bestMatch = 'english';
  let maxMatches = 0;

  Object.entries(languagePatterns).forEach(([lang, words]) => {
    const matches = words.filter((word) =>
      lowerContent.includes(` ${word} `),
    ).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = lang;
    }
  });

  return bestMatch;
}

function detectDocumentType(content: string): string {
  const typePatterns = {
    academic: [
      /abstract/i,
      /introduction/i,
      /methodology/i,
      /conclusion/i,
      /references/i,
      /bibliography/i,
    ],
    technical: [
      /api/i,
      /function/i,
      /parameter/i,
      /configuration/i,
      /installation/i,
      /usage/i,
    ],
    business: [
      /executive summary/i,
      /market/i,
      /revenue/i,
      /strategy/i,
      /proposal/i,
      /budget/i,
    ],
    legal: [
      /whereas/i,
      /hereby/i,
      /pursuant/i,
      /agreement/i,
      /contract/i,
      /terms/i,
    ],
    creative: [/chapter/i, /story/i, /character/i, /plot/i, /narrative/i],
    news: [/breaking/i, /reported/i, /according to/i, /sources/i, /update/i],
    blog: [/posted/i, /share/i, /comment/i, /subscribe/i, /follow/i],
    email: [/subject/i, /dear/i, /sincerely/i, /regards/i, /from:/i, /to:/i],
  };

  for (const [type, patterns] of Object.entries(typePatterns)) {
    const matches = patterns.filter((pattern) => pattern.test(content)).length;
    if (matches >= 2) {
      return type;
    }
  }

  return 'general';
}

async function analyzeDocument(
  content: string,
  analysisType: string,
  language: string,
  documentType: string,
): Promise<DocumentAnalysisResult> {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0);
  const words = content.split(/\s+/).filter((w) => w.length > 0);

  const analysis: DocumentAnalysisResult = {
    metadata: {
      wordCount: words.length,
      characterCount: content.length,
      paragraphCount: paragraphs.length,
      sentenceCount: sentences.length,
      readingTime: Math.ceil(words.length / 200), // Average reading speed
      language,
      documentType,
    },
    structure: analyzeStructure(content, paragraphs),
    content: analyzeContent(content, sentences, words),
    quality: analyzeQuality(content, sentences, words),
    insights: generateInsights(content, documentType, words, sentences),
  };

  return analysis;
}

function analyzeStructure(
  content: string,
  paragraphs: string[],
): DocumentAnalysisResult['structure'] {
  const headings: Array<{ level: number; text: string; position: number }> = [];
  const sections: Array<{ title: string; wordCount: number; summary: string }> =
    [];
  const outline: string[] = [];

  // Extract headings (markdown-style)
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      headings.push({ level, text, position: index });
      outline.push('  '.repeat(level - 1) + text);
    }
  });

  // Create sections based on headings or paragraphs
  if (headings.length > 0) {
    for (let i = 0; i < headings.length; i++) {
      const currentHeading = headings[i];
      const nextHeading = headings[i + 1];

      const startPos = currentHeading.position;
      const endPos = nextHeading ? nextHeading.position : lines.length;

      const sectionContent = lines.slice(startPos + 1, endPos).join('\n');
      const sectionWords = sectionContent
        .split(/\s+/)
        .filter((w) => w.length > 0);

      sections.push({
        title: currentHeading.text,
        wordCount: sectionWords.length,
        summary: generateSectionSummary(sectionContent),
      });
    }
  } else {
    // Create sections from paragraphs if no headings
    paragraphs.forEach((paragraph, index) => {
      const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
      sections.push({
        title: `Section ${index + 1}`,
        wordCount: words.length,
        summary: generateSectionSummary(paragraph),
      });
    });
  }

  return { headings, sections, outline };
}

function generateSectionSummary(content: string): string {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return '';

  // Return first sentence as summary, truncated if too long
  const firstSentence = sentences[0].trim();
  return firstSentence.length > 100
    ? `${firstSentence.substring(0, 100)}...`
    : firstSentence;
}

function analyzeContent(
  content: string,
  sentences: string[],
  words: string[],
): DocumentAnalysisResult['content'] {
  const summary = generateSummary(content, sentences);
  const keyPoints = extractKeyPoints(sentences);
  const topics = extractTopics(content, words);
  const entities = extractEntities(content);
  const sentiment = analyzeSentiment(content);

  return {
    summary,
    keyPoints,
    topics,
    entities,
    sentiment,
  };
}

function generateSummary(content: string, sentences: string[]): string {
  // Simple extractive summarization
  if (sentences.length <= 3) {
    return content.trim();
  }

  // Score sentences based on word frequency and position
  const wordFreq = new Map<string, number>();
  const words = content
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  words.forEach((word) => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  const sentenceScores = sentences.map((sentence, index) => {
    const sentenceWords = sentence
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const score = sentenceWords.reduce(
      (sum, word) => sum + (wordFreq.get(word) || 0),
      0,
    );
    const positionScore = index < 3 ? 2 : 1; // Boost early sentences
    return { sentence, score: score * positionScore, index };
  });

  // Select top 3 sentences
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence.trim());

  return topSentences.join(' ');
}

function extractKeyPoints(sentences: string[]): string[] {
  const keyPoints: string[] = [];

  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();

    // Look for sentences that start with key indicators
    const keyIndicators = [
      /^(importantly|significantly|notably|crucially)/i,
      /^(first|second|third|finally|lastly)/i,
      /^(the main|the primary|the key|the most)/i,
      /^(in conclusion|to summarize|in summary)/i,
    ];

    const isKeyPoint =
      keyIndicators.some((pattern) => pattern.test(trimmed)) ||
      trimmed.includes('important') ||
      trimmed.includes('significant') ||
      trimmed.includes('crucial') ||
      trimmed.includes('essential');

    if (isKeyPoint && trimmed.length > 20 && trimmed.length < 200) {
      keyPoints.push(trimmed);
    }
  });

  // If no key indicators found, extract sentences with high information density
  if (keyPoints.length === 0) {
    const informativeSentences = sentences
      .filter((s) => s.trim().length > 30 && s.trim().length < 150)
      .slice(0, 5);

    keyPoints.push(...informativeSentences.map((s) => s.trim()));
  }

  return keyPoints.slice(0, 5);
}

function extractTopics(content: string, words: string[]): string[] {
  // Simple topic extraction based on word frequency
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'can',
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'it',
    'we',
    'they',
    'me',
    'him',
    'her',
    'us',
    'them',
    'my',
    'your',
    'his',
    'her',
    'its',
    'our',
    'their',
  ]);

  const wordFreq = new Map<string, number>();

  words
    .map((word) => word.toLowerCase().replace(/[^\w]/g, ''))
    .filter((word) => word.length > 3 && !stopWords.has(word))
    .forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function extractEntities(
  content: string,
): Array<{ type: string; value: string; confidence: number }> {
  const entities: Array<{ type: string; value: string; confidence: number }> =
    [];

  // Extract dates
  const dateRegex =
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;
  const dates = content.match(dateRegex);
  if (dates) {
    dates.forEach((date) => {
      entities.push({ type: 'date', value: date, confidence: 0.9 });
    });
  }

  // Extract emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = content.match(emailRegex);
  if (emails) {
    emails.forEach((email) => {
      entities.push({ type: 'email', value: email, confidence: 0.95 });
    });
  }

  // Extract URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlRegex);
  if (urls) {
    urls.forEach((url) => {
      entities.push({ type: 'url', value: url, confidence: 0.9 });
    });
  }

  // Extract phone numbers
  const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b/g;
  const phones = content.match(phoneRegex);
  if (phones) {
    phones.forEach((phone) => {
      entities.push({ type: 'phone', value: phone, confidence: 0.85 });
    });
  }

  // Extract numbers/amounts
  const numberRegex = /\$[\d,]+\.?\d*|\b\d+%|\b\d{1,3}(,\d{3})*(\.\d+)?\b/g;
  const numbers = content.match(numberRegex);
  if (numbers) {
    numbers.slice(0, 10).forEach((number) => {
      entities.push({ type: 'number', value: number, confidence: 0.8 });
    });
  }

  return entities;
}

function analyzeSentiment(
  content: string,
): DocumentAnalysisResult['content']['sentiment'] {
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'fantastic',
    'awesome',
    'brilliant',
    'outstanding',
    'superb',
    'magnificent',
    'marvelous',
    'terrific',
    'fabulous',
    'incredible',
    'success',
    'achieve',
    'accomplish',
    'win',
    'victory',
    'triumph',
    'benefit',
    'advantage',
    'improve',
    'enhance',
    'optimize',
    'effective',
    'efficient',
    'productive',
    'valuable',
  ];

  const negativeWords = [
    'bad',
    'terrible',
    'awful',
    'horrible',
    'disgusting',
    'disappointing',
    'frustrating',
    'annoying',
    'irritating',
    'infuriating',
    'outrageous',
    'unacceptable',
    'inadequate',
    'fail',
    'failure',
    'lose',
    'loss',
    'defeat',
    'problem',
    'issue',
    'difficulty',
    'challenge',
    'obstacle',
    'barrier',
    'limitation',
    'weakness',
    'flaw',
    'defect',
  ];

  const words = content.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (positiveWords.includes(cleanWord)) positiveCount++;
    if (negativeWords.includes(cleanWord)) negativeCount++;
  });

  const totalSentimentWords = positiveCount + negativeCount;
  if (totalSentimentWords === 0) {
    return { overall: 'neutral', score: 0, confidence: 0.5 };
  }

  const score = (positiveCount - negativeCount) / totalSentimentWords;
  const confidence = Math.min((totalSentimentWords / words.length) * 10, 1);

  let overall: 'positive' | 'negative' | 'neutral';
  if (score > 0.1) overall = 'positive';
  else if (score < -0.1) overall = 'negative';
  else overall = 'neutral';

  return {
    overall,
    score: Math.round(score * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  };
}

function analyzeQuality(
  content: string,
  sentences: string[],
  words: string[],
): DocumentAnalysisResult['quality'] {
  const issues: DocumentAnalysisResult['quality']['issues'] = [];
  const suggestions: string[] = [];

  // Calculate readability score (simplified Flesch Reading Ease)
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllables =
    words.reduce((sum, word) => sum + countSyllables(word), 0) / words.length;

  const readabilityScore =
    206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllables;

  let readabilityLevel: string;
  if (readabilityScore >= 90) readabilityLevel = 'Very Easy';
  else if (readabilityScore >= 80) readabilityLevel = 'Easy';
  else if (readabilityScore >= 70) readabilityLevel = 'Fairly Easy';
  else if (readabilityScore >= 60) readabilityLevel = 'Standard';
  else if (readabilityScore >= 50) readabilityLevel = 'Fairly Difficult';
  else if (readabilityScore >= 30) readabilityLevel = 'Difficult';
  else readabilityLevel = 'Very Difficult';

  // Check for quality issues
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();

    // Very long sentences
    if (trimmed.split(/\s+/).length > 30) {
      issues.push({
        type: 'clarity',
        message: 'Sentence is too long and may be hard to follow',
        severity: 'medium',
        position: index,
      });
    }

    // Very short sentences (might indicate incomplete thoughts)
    if (trimmed.split(/\s+/).length < 3 && trimmed.length > 0) {
      issues.push({
        type: 'structure',
        message: 'Very short sentence - consider expanding',
        severity: 'low',
        position: index,
      });
    }

    // Passive voice detection (simplified)
    if (/\b(was|were|is|are|been)\s+\w+ed\b/.test(trimmed)) {
      issues.push({
        type: 'style',
        message: 'Consider using active voice instead of passive voice',
        severity: 'low',
        position: index,
      });
    }
  });

  // Check for repetitive words
  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (cleanWord.length > 3) {
      wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1);
    }
  });

  const repetitiveWords = Array.from(wordFreq.entries())
    .filter(([word, count]) => count > words.length * 0.02) // More than 2% of total words
    .map(([word]) => word);

  if (repetitiveWords.length > 0) {
    suggestions.push(
      `Consider varying word choice. Frequently repeated words: ${repetitiveWords.slice(0, 3).join(', ')}`,
    );
  }

  // General suggestions based on readability
  if (readabilityScore < 50) {
    suggestions.push(
      'Consider simplifying sentence structure and using shorter sentences',
    );
    suggestions.push('Use more common words where possible');
  }

  if (avgSentenceLength > 25) {
    suggestions.push('Break down long sentences into shorter, clearer ones');
  }

  return {
    readabilityScore: Math.round(readabilityScore),
    readabilityLevel,
    issues,
    suggestions,
  };
}

function countSyllables(word: string): number {
  // Simple syllable counting algorithm
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length === 0) return 0;

  const vowels = 'aeiouy';
  let syllables = 0;
  let previousWasVowel = false;

  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !previousWasVowel) {
      syllables++;
    }
    previousWasVowel = isVowel;
  }

  // Handle silent 'e'
  if (cleanWord.endsWith('e') && syllables > 1) {
    syllables--;
  }

  return Math.max(1, syllables);
}

function generateInsights(
  content: string,
  documentType: string,
  words: string[],
  sentences: string[],
): DocumentAnalysisResult['insights'] {
  const avgWordsPerSentence = words.length / sentences.length;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase())).size;
  const lexicalDiversity = uniqueWords / words.length;

  // Determine complexity
  let complexity: 'simple' | 'moderate' | 'complex';
  if (avgWordsPerSentence < 15 && lexicalDiversity > 0.6) {
    complexity = 'simple';
  } else if (avgWordsPerSentence < 25 && lexicalDiversity > 0.4) {
    complexity = 'moderate';
  } else {
    complexity = 'complex';
  }

  // Determine audience
  let audience: string;
  if (complexity === 'simple') {
    audience = 'General public, beginners';
  } else if (complexity === 'moderate') {
    audience = 'Educated readers, professionals';
  } else {
    audience = 'Experts, academics, specialists';
  }

  // Determine purpose based on document type and content
  const purposeMap: Record<string, string> = {
    academic: 'Research and knowledge sharing',
    technical: 'Instruction and documentation',
    business: 'Decision making and strategy',
    legal: 'Legal compliance and agreements',
    creative: 'Entertainment and artistic expression',
    news: 'Information and current events',
    blog: 'Opinion sharing and engagement',
    email: 'Communication and correspondence',
    general: 'Information sharing',
  };

  const purpose = purposeMap[documentType] || 'General communication';

  // Determine tone
  const formalWords = [
    'therefore',
    'furthermore',
    'consequently',
    'nevertheless',
    'moreover',
  ];
  const informalWords = [
    'really',
    'pretty',
    'quite',
    'very',
    'just',
    'actually',
  ];
  const technicalWords = [
    'system',
    'process',
    'method',
    'analysis',
    'implementation',
  ];

  const lowerContent = content.toLowerCase();
  const formalCount = formalWords.filter((word) =>
    lowerContent.includes(word),
  ).length;
  const informalCount = informalWords.filter((word) =>
    lowerContent.includes(word),
  ).length;
  const technicalCount = technicalWords.filter((word) =>
    lowerContent.includes(word),
  ).length;

  let tone: string;
  if (technicalCount > formalCount && technicalCount > informalCount) {
    tone = 'Technical and professional';
  } else if (formalCount > informalCount) {
    tone = 'Formal and academic';
  } else if (informalCount > formalCount) {
    tone = 'Informal and conversational';
  } else {
    tone = 'Neutral and balanced';
  }

  // Generate strengths and improvements
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (lexicalDiversity > 0.5) {
    strengths.push('Rich vocabulary and varied word choice');
  } else {
    improvements.push('Increase vocabulary diversity');
  }

  if (avgWordsPerSentence > 10 && avgWordsPerSentence < 20) {
    strengths.push('Well-balanced sentence length');
  } else if (avgWordsPerSentence > 25) {
    improvements.push('Shorten overly long sentences');
  } else if (avgWordsPerSentence < 8) {
    improvements.push('Consider combining short sentences for better flow');
  }

  if (words.length > 500) {
    strengths.push('Comprehensive coverage of the topic');
  } else if (words.length < 100) {
    improvements.push('Consider expanding with more details and examples');
  }

  return {
    complexity,
    audience,
    purpose,
    tone,
    strengths,
    improvements,
  };
}
