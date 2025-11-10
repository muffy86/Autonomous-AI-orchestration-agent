/**
 * AI Prompt Optimization System
 * Provides intelligent prompt engineering, optimization, and template management
 */

import { z } from 'zod';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'coding' | 'writing' | 'analysis' | 'creative' | 'business' | 'educational' | 'general';
  template: string;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
    required: boolean;
    defaultValue?: any;
  }>;
  examples: Array<{
    input: Record<string, any>;
    expectedOutput: string;
  }>;
  tags: string[];
  effectiveness: number; // 0-1 score
  usage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptOptimization {
  original: string;
  optimized: string;
  improvements: Array<{
    type: 'clarity' | 'specificity' | 'structure' | 'context' | 'examples';
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  score: {
    original: number;
    optimized: number;
    improvement: number;
  };
  reasoning: string;
}

export interface PromptAnalysis {
  clarity: number;
  specificity: number;
  structure: number;
  context: number;
  examples: number;
  overall: number;
  issues: Array<{
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
    suggestion: string;
  }>;
  strengths: string[];
  weaknesses: string[];
}

export class PromptOptimizer {
  private static instance: PromptOptimizer;
  private templates: Map<string, PromptTemplate>;
  private optimizationHistory: Map<string, PromptOptimization[]>;

  private constructor() {
    this.templates = new Map();
    this.optimizationHistory = new Map();
    this.initializeDefaultTemplates();
  }

  static getInstance(): PromptOptimizer {
    if (!PromptOptimizer.instance) {
      PromptOptimizer.instance = new PromptOptimizer();
    }
    return PromptOptimizer.instance;
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'code-review',
        name: 'Code Review Assistant',
        description: 'Comprehensive code review with suggestions',
        category: 'coding',
        template: `Please review the following {{language}} code and provide:

1. **Code Quality Assessment**
   - Overall quality score (1-10)
   - Readability and maintainability
   - Adherence to best practices

2. **Issues and Improvements**
   - Security vulnerabilities
   - Performance bottlenecks
   - Bug risks
   - Code smells

3. **Specific Suggestions**
   - Refactoring recommendations
   - Alternative approaches
   - Optimization opportunities

4. **Positive Aspects**
   - Well-implemented features
   - Good practices observed

**Code to Review:**
\`\`\`{{language}}
{{code}}
\`\`\`

{{#if context}}
**Additional Context:**
{{context}}
{{/if}}

Please provide detailed, actionable feedback with specific examples.`,
        variables: [
          { name: 'language', type: 'string', description: 'Programming language', required: true },
          { name: 'code', type: 'string', description: 'Code to review', required: true },
          { name: 'context', type: 'string', description: 'Additional context', required: false },
        ],
        examples: [
          {
            input: { language: 'python', code: 'def add(a, b): return a + b' },
            expectedOutput: 'Code quality assessment with suggestions for improvement',
          },
        ],
        tags: ['code', 'review', 'quality', 'feedback'],
        effectiveness: 0.9,
        usage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'technical-writer',
        name: 'Technical Documentation Writer',
        description: 'Create comprehensive technical documentation',
        category: 'writing',
        template: `Create comprehensive technical documentation for {{topic}}.

**Requirements:**
- Target audience: {{audience}}
- Documentation type: {{docType}}
- Technical level: {{level}}

**Structure to include:**
1. **Overview**
   - Brief introduction
   - Purpose and scope
   - Prerequisites

2. **Main Content**
   {{#if includeExamples}}
   - Step-by-step instructions
   - Code examples with explanations
   - Common use cases
   {{/if}}

3. **Reference Material**
   - API documentation (if applicable)
   - Configuration options
   - Troubleshooting guide

4. **Additional Resources**
   - Related documentation
   - External links
   - Further reading

**Style Guidelines:**
- Use clear, concise language
- Include practical examples
- Provide context for decisions
- Use consistent formatting
- Add visual aids where helpful

{{#if existingContent}}
**Existing Content to Build Upon:**
{{existingContent}}
{{/if}}

Please create documentation that is both comprehensive and accessible to the target audience.`,
        variables: [
          { name: 'topic', type: 'string', description: 'Topic to document', required: true },
          { name: 'audience', type: 'string', description: 'Target audience', required: true },
          { name: 'docType', type: 'string', description: 'Type of documentation', required: true },
          { name: 'level', type: 'string', description: 'Technical level', required: true },
          { name: 'includeExamples', type: 'boolean', description: 'Include examples', required: false, defaultValue: true },
          { name: 'existingContent', type: 'string', description: 'Existing content', required: false },
        ],
        examples: [
          {
            input: { topic: 'REST API', audience: 'developers', docType: 'API guide', level: 'intermediate' },
            expectedOutput: 'Comprehensive API documentation with examples',
          },
        ],
        tags: ['documentation', 'technical', 'writing', 'api'],
        effectiveness: 0.85,
        usage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'data-analyst',
        name: 'Data Analysis Assistant',
        description: 'Comprehensive data analysis and insights',
        category: 'analysis',
        template: `Analyze the following data and provide comprehensive insights:

**Data Overview:**
- Dataset: {{datasetName}}
- Size: {{dataSize}}
- Type: {{dataType}}

**Analysis Requirements:**
{{#each analysisTypes}}
- {{this}}
{{/each}}

**Data:**
{{data}}

**Please provide:**

1. **Data Summary**
   - Key statistics
   - Data quality assessment
   - Missing values and outliers

2. **Exploratory Analysis**
   - Distribution patterns
   - Correlations and relationships
   - Trends and seasonality

3. **Key Insights**
   - Most significant findings
   - Unexpected patterns
   - Business implications

4. **Recommendations**
   - Actionable insights
   - Further analysis suggestions
   - Data collection improvements

5. **Visualizations**
   - Suggested chart types
   - Key metrics to visualize
   - Dashboard recommendations

{{#if businessContext}}
**Business Context:**
{{businessContext}}
{{/if}}

Please provide detailed analysis with statistical backing and practical recommendations.`,
        variables: [
          { name: 'datasetName', type: 'string', description: 'Name of dataset', required: true },
          { name: 'dataSize', type: 'string', description: 'Size of dataset', required: true },
          { name: 'dataType', type: 'string', description: 'Type of data', required: true },
          { name: 'analysisTypes', type: 'array', description: 'Types of analysis needed', required: true },
          { name: 'data', type: 'string', description: 'The actual data', required: true },
          { name: 'businessContext', type: 'string', description: 'Business context', required: false },
        ],
        examples: [
          {
            input: { 
              datasetName: 'Sales Data', 
              dataSize: '1000 rows', 
              dataType: 'CSV', 
              analysisTypes: ['trend analysis', 'correlation'], 
              data: 'sample data' 
            },
            expectedOutput: 'Comprehensive data analysis with insights and recommendations',
          },
        ],
        tags: ['data', 'analysis', 'statistics', 'insights'],
        effectiveness: 0.88,
        usage: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  analyzePrompt(prompt: string): PromptAnalysis {
    const analysis: PromptAnalysis = {
      clarity: this.assessClarity(prompt),
      specificity: this.assessSpecificity(prompt),
      structure: this.assessStructure(prompt),
      context: this.assessContext(prompt),
      examples: this.assessExamples(prompt),
      overall: 0,
      issues: [],
      strengths: [],
      weaknesses: [],
    };

    analysis.overall = (
      analysis.clarity + 
      analysis.specificity + 
      analysis.structure + 
      analysis.context + 
      analysis.examples
    ) / 5;

    this.identifyIssuesAndStrengths(prompt, analysis);

    return analysis;
  }

  private assessClarity(prompt: string): number {
    let score = 0.5; // Base score

    // Check for clear instructions
    const instructionWords = ['please', 'create', 'analyze', 'explain', 'describe', 'list', 'provide'];
    const hasInstructions = instructionWords.some(word => prompt.toLowerCase().includes(word));
    if (hasInstructions) score += 0.2;

    // Check for ambiguous language
    const ambiguousWords = ['maybe', 'perhaps', 'might', 'could be', 'possibly'];
    const hasAmbiguity = ambiguousWords.some(word => prompt.toLowerCase().includes(word));
    if (hasAmbiguity) score -= 0.2;

    // Check for question marks (clear questions)
    const questionCount = (prompt.match(/\?/g) || []).length;
    if (questionCount > 0) score += Math.min(0.2, questionCount * 0.1);

    // Check for clear formatting
    const hasFormatting = /\*\*|\*|#|1\.|2\.|3\.|-/.test(prompt);
    if (hasFormatting) score += 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private assessSpecificity(prompt: string): number {
    let score = 0.3; // Base score

    // Check for specific requirements
    const specificWords = ['exactly', 'specifically', 'must', 'should', 'required', 'include'];
    const specificityCount = specificWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.3, specificityCount * 0.1);

    // Check for constraints
    const constraintWords = ['limit', 'maximum', 'minimum', 'between', 'within', 'no more than'];
    const constraintCount = constraintWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.2, constraintCount * 0.1);

    // Check for format specifications
    const formatWords = ['format', 'structure', 'template', 'style', 'length'];
    const formatCount = formatWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.2, formatCount * 0.1);

    // Check for vague language
    const vagueWords = ['some', 'various', 'different', 'several', 'many', 'few'];
    const vagueness = vagueWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score -= Math.min(0.3, vagueness * 0.1);

    return Math.max(0, Math.min(1, score));
  }

  private assessStructure(prompt: string): number {
    let score = 0.2; // Base score

    // Check for numbered lists
    const numberedLists = (prompt.match(/\d+\./g) || []).length;
    if (numberedLists >= 3) score += 0.3;
    else if (numberedLists >= 1) score += 0.2;

    // Check for bullet points
    const bulletPoints = (prompt.match(/^[-*+]\s/gm) || []).length;
    if (bulletPoints >= 3) score += 0.2;
    else if (bulletPoints >= 1) score += 0.1;

    // Check for headers
    const headers = (prompt.match(/^#+\s/gm) || []).length;
    if (headers >= 2) score += 0.2;
    else if (headers >= 1) score += 0.1;

    // Check for sections
    const sections = (prompt.match(/\*\*[^*]+\*\*/g) || []).length;
    if (sections >= 3) score += 0.2;
    else if (sections >= 1) score += 0.1;

    // Check for logical flow
    const flowWords = ['first', 'second', 'then', 'next', 'finally', 'lastly'];
    const flowCount = flowWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.2, flowCount * 0.05);

    return Math.max(0, Math.min(1, score));
  }

  private assessContext(prompt: string): number {
    let score = 0.3; // Base score

    // Check for background information
    const contextWords = ['background', 'context', 'situation', 'scenario', 'purpose', 'goal'];
    const contextCount = contextWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.3, contextCount * 0.1);

    // Check for role definition
    const roleWords = ['you are', 'act as', 'role', 'expert', 'assistant', 'specialist'];
    const roleCount = roleWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.2, roleCount * 0.1);

    // Check for audience specification
    const audienceWords = ['audience', 'reader', 'user', 'client', 'customer', 'beginner', 'expert'];
    const audienceCount = audienceWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.2, audienceCount * 0.1);

    return Math.max(0, Math.min(1, score));
  }

  private assessExamples(prompt: string): number {
    let score = 0.1; // Base score

    // Check for explicit examples
    const exampleWords = ['example', 'for instance', 'such as', 'like', 'including'];
    const exampleCount = exampleWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.4, exampleCount * 0.2);

    // Check for code blocks
    const codeBlocks = (prompt.match(/```/g) || []).length / 2;
    score += Math.min(0.3, codeBlocks * 0.15);

    // Check for sample data
    const sampleWords = ['sample', 'demo', 'test', 'mock'];
    const sampleCount = sampleWords.filter(word => prompt.toLowerCase().includes(word)).length;
    score += Math.min(0.2, sampleCount * 0.1);

    return Math.max(0, Math.min(1, score));
  }

  private identifyIssuesAndStrengths(prompt: string, analysis: PromptAnalysis): void {
    // Identify issues
    if (analysis.clarity < 0.6) {
      analysis.issues.push({
        type: 'clarity',
        message: 'Prompt lacks clear instructions',
        severity: 'high',
        suggestion: 'Use specific action words and clear directives',
      });
    }

    if (analysis.specificity < 0.5) {
      analysis.issues.push({
        type: 'specificity',
        message: 'Prompt is too vague',
        severity: 'high',
        suggestion: 'Add specific requirements, constraints, and expected outcomes',
      });
    }

    if (analysis.structure < 0.4) {
      analysis.issues.push({
        type: 'structure',
        message: 'Poor organization and structure',
        severity: 'medium',
        suggestion: 'Use numbered lists, headers, and clear sections',
      });
    }

    if (analysis.context < 0.4) {
      analysis.issues.push({
        type: 'context',
        message: 'Insufficient context provided',
        severity: 'medium',
        suggestion: 'Add background information, role definition, and purpose',
      });
    }

    if (analysis.examples < 0.3) {
      analysis.issues.push({
        type: 'examples',
        message: 'No examples provided',
        severity: 'low',
        suggestion: 'Include examples to clarify expectations',
      });
    }

    // Identify strengths (lowered thresholds to be more generous)
    if (analysis.clarity >= 0.6) {
      analysis.strengths.push('Clear and unambiguous instructions');
    }

    if (analysis.specificity >= 0.5) {
      analysis.strengths.push('Specific requirements and constraints');
    }

    if (analysis.structure >= 0.5) {
      analysis.strengths.push('Well-organized and structured');
    }

    if (analysis.context >= 0.5) {
      analysis.strengths.push('Rich contextual information');
    }

    if (analysis.examples >= 0.4) {
      analysis.strengths.push('Good use of examples');
    }

    // Add strength for overall good score
    if (analysis.overall >= 0.7) {
      analysis.strengths.push('Overall well-crafted prompt');
    }

    // Identify weaknesses
    const scores = [
      { name: 'clarity', score: analysis.clarity },
      { name: 'specificity', score: analysis.specificity },
      { name: 'structure', score: analysis.structure },
      { name: 'context', score: analysis.context },
      { name: 'examples', score: analysis.examples },
    ];

    const weakest = scores.sort((a, b) => a.score - b.score)[0];
    if (weakest.score < 0.6) {
      analysis.weaknesses.push(`Needs improvement in ${weakest.name}`);
    }
  }

  optimizePrompt(prompt: string, targetCategory?: string): PromptOptimization {
    const originalAnalysis = this.analyzePrompt(prompt);
    const optimized = this.generateOptimizedPrompt(prompt, originalAnalysis, targetCategory);
    const optimizedAnalysis = this.analyzePrompt(optimized);

    const improvements: PromptOptimization['improvements'] = [];

    // Compare scores and identify improvements
    if (optimizedAnalysis.clarity > originalAnalysis.clarity) {
      improvements.push({
        type: 'clarity',
        description: 'Improved clarity with more specific instructions',
        impact: 'high',
      });
    }

    if (optimizedAnalysis.specificity > originalAnalysis.specificity) {
      improvements.push({
        type: 'specificity',
        description: 'Added specific requirements and constraints',
        impact: 'high',
      });
    }

    if (optimizedAnalysis.structure > originalAnalysis.structure) {
      improvements.push({
        type: 'structure',
        description: 'Enhanced organization with clear sections',
        impact: 'medium',
      });
    }

    if (optimizedAnalysis.context > originalAnalysis.context) {
      improvements.push({
        type: 'context',
        description: 'Added contextual information and role definition',
        impact: 'medium',
      });
    }

    if (optimizedAnalysis.examples > originalAnalysis.examples) {
      improvements.push({
        type: 'examples',
        description: 'Included examples to clarify expectations',
        impact: 'low',
      });
    }

    const optimization: PromptOptimization = {
      original: prompt,
      optimized,
      improvements,
      score: {
        original: originalAnalysis.overall,
        optimized: optimizedAnalysis.overall,
        improvement: optimizedAnalysis.overall - originalAnalysis.overall,
      },
      reasoning: this.generateOptimizationReasoning(originalAnalysis, optimizedAnalysis, improvements),
    };

    // Store in history
    const history = this.optimizationHistory.get(prompt) || [];
    history.push(optimization);
    this.optimizationHistory.set(prompt, history);

    return optimization;
  }

  private generateOptimizedPrompt(prompt: string, analysis: PromptAnalysis, targetCategory?: string): string {
    let optimized = prompt;

    // Add role definition if missing
    if (analysis.context < 0.5 && !prompt.toLowerCase().includes('you are')) {
      const rolePrefix = targetCategory 
        ? `You are an expert ${targetCategory} assistant. `
        : 'You are a helpful AI assistant. ';
      optimized = rolePrefix + optimized;
    }

    // Add structure if missing
    if (analysis.structure < 0.5) {
      optimized = this.addStructure(optimized);
    }

    // Add specificity if missing
    if (analysis.specificity < 0.5) {
      optimized = this.addSpecificity(optimized);
    }

    // Add examples if missing
    if (analysis.examples < 0.3) {
      optimized = this.addExampleRequest(optimized);
    }

    // Add clear output format
    if (!optimized.toLowerCase().includes('format') && !optimized.toLowerCase().includes('structure')) {
      optimized += '\n\nPlease provide your response in a clear, well-structured format.';
    }

    return optimized.trim();
  }

  private addStructure(prompt: string): string {
    if (prompt.includes('\n')) return prompt; // Already has some structure

    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 2) return prompt;

    // Convert to structured format
    let structured = sentences[0].trim() + '.\n\n';
    structured += 'Please provide:\n';
    
    sentences.slice(1).forEach((sentence, index) => {
      structured += `${index + 1}. ${sentence.trim()}\n`;
    });

    return structured;
  }

  private addSpecificity(prompt: string): string {
    let specific = prompt;

    // Add specific requirements
    if (!specific.toLowerCase().includes('specific')) {
      specific += '\n\nPlease be specific and detailed in your response.';
    }

    // Add length requirement if missing
    if (!specific.match(/\d+\s*(word|character|sentence|paragraph)/i)) {
      specific += ' Provide a comprehensive response with sufficient detail.';
    }

    return specific;
  }

  private addExampleRequest(prompt: string): string {
    if (prompt.toLowerCase().includes('example')) return prompt;
    return prompt + '\n\nPlease include relevant examples to illustrate your points.';
  }

  private generateOptimizationReasoning(
    original: PromptAnalysis,
    optimized: PromptAnalysis,
    improvements: PromptOptimization['improvements']
  ): string {
    let reasoning = 'The prompt was optimized based on the following analysis:\n\n';

    reasoning += `Original score: ${(original.overall * 100).toFixed(1)}%\n`;
    reasoning += `Optimized score: ${(optimized.overall * 100).toFixed(1)}%\n`;
    reasoning += `Improvement: ${((optimized.overall - original.overall) * 100).toFixed(1)}%\n\n`;

    reasoning += 'Key improvements made:\n';
    improvements.forEach((improvement, index) => {
      reasoning += `${index + 1}. ${improvement.description} (${improvement.impact} impact)\n`;
    });

    if (improvements.length === 0) {
      reasoning += 'The prompt was already well-structured with minimal improvements needed.\n';
    }

    return reasoning;
  }

  getTemplate(id: string): PromptTemplate | null {
    return this.templates.get(id) || null;
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }

  searchTemplates(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  createTemplate(template: Omit<PromptTemplate, 'id' | 'usage' | 'createdAt' | 'updatedAt'>): string {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: PromptTemplate = {
      ...template,
      id,
      usage: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.templates.set(id, newTemplate);
    return id;
  }

  updateTemplate(id: string, updates: Partial<PromptTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    const updatedTemplate = {
      ...template,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    return true;
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  renderTemplate(id: string, variables: Record<string, any>): string | null {
    const template = this.templates.get(id);
    if (!template) return null;

    // Increment usage
    template.usage++;
    template.updatedAt = new Date();

    // Simple template rendering (in a real implementation, use a proper template engine)
    let rendered = template.template;

    // Replace variables
    template.variables.forEach(variable => {
      const value = variables[variable.name] ?? variable.defaultValue ?? '';
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    // Handle conditional blocks (simplified)
    rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return variables[condition] ? content : '';
    });

    // Handle loops (simplified)
    rendered = rendered.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        return content.replace(/{{this}}/g, String(item));
      }).join('');
    });

    return rendered;
  }

  getOptimizationHistory(prompt: string): PromptOptimization[] {
    return this.optimizationHistory.get(prompt) || [];
  }

  getStats(): {
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    mostUsedTemplates: Array<{ id: string; name: string; usage: number }>;
    averageEffectiveness: number;
    totalOptimizations: number;
  } {
    const templates = this.getAllTemplates();
    
    const templatesByCategory = templates.reduce((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedTemplates = templates
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)
      .map(template => ({
        id: template.id,
        name: template.name,
        usage: template.usage,
      }));

    const averageEffectiveness = templates.reduce((sum, template) => sum + template.effectiveness, 0) / templates.length || 0;

    const totalOptimizations = Array.from(this.optimizationHistory.values())
      .reduce((sum, history) => sum + history.length, 0);

    return {
      totalTemplates: templates.length,
      templatesByCategory,
      mostUsedTemplates,
      averageEffectiveness,
      totalOptimizations,
    };
  }
}

// Validation schemas
export const promptAnalysisSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  targetCategory: z.enum(['coding', 'writing', 'analysis', 'creative', 'business', 'educational', 'general']).optional(),
});

export const templateCreationSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['coding', 'writing', 'analysis', 'creative', 'business', 'educational', 'general']),
  template: z.string().min(1, 'Template content is required'),
  variables: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean', 'array']),
    description: z.string().min(1),
    required: z.boolean(),
    defaultValue: z.any().optional(),
  })),
  tags: z.array(z.string()),
  effectiveness: z.number().min(0).max(1).optional().default(0.5),
});

export type PromptAnalysisRequest = z.infer<typeof promptAnalysisSchema>;
export type TemplateCreationRequest = z.infer<typeof templateCreationSchema>;

// Export singleton instance
export const promptOptimizer = PromptOptimizer.getInstance();