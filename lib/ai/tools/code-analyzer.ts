/**
 * Advanced Code Analysis Tool
 * Provides comprehensive code analysis, optimization suggestions, and quality metrics
 */

import { tool } from 'ai';
import { z } from 'zod';

interface CodeAnalysisResult {
  language: string;
  complexity: {
    cyclomatic: number;
    cognitive: number;
    lines: number;
    functions: number;
    classes: number;
  };
  quality: {
    score: number;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      line?: number;
      severity: 'high' | 'medium' | 'low';
    }>;
    suggestions: string[];
  };
  security: {
    vulnerabilities: Array<{
      type: string;
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      line?: number;
      fix?: string;
    }>;
    score: number;
  };
  performance: {
    bottlenecks: string[];
    optimizations: string[];
    estimatedComplexity: string;
  };
  documentation: {
    coverage: number;
    missing: string[];
    suggestions: string[];
  };
  dependencies: {
    imports: string[];
    external: string[];
    unused: string[];
  };
}

export const codeAnalyzer = tool({
  description: 'Analyze code for quality, security, performance, and provide optimization suggestions',
  parameters: z.object({
    code: z.string().min(1, 'Code is required'),
    language: z.string().optional().describe('Programming language (auto-detected if not provided)'),
    analysisType: z.enum(['full', 'security', 'performance', 'quality']).default('full'),
    includeOptimizations: z.boolean().default(true),
  }),
  execute: async ({ code, language, analysisType, includeOptimizations }) => {
    try {
      const detectedLanguage = language || detectLanguage(code);
      const analysis = await analyzeCode(code, detectedLanguage, analysisType, includeOptimizations);
      
      return {
        success: true,
        language: detectedLanguage,
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

function detectLanguage(code: string): string {
  const patterns = {
    python: [/def\s+\w+\s*\(/, /import\s+\w+/, /from\s+\w+\s+import/, /print\s*\(/, /if\s+__name__\s*==\s*['""]__main__['""]:/],
    javascript: [/function\s+\w+\s*\(/, /const\s+\w+\s*=/, /let\s+\w+\s*=/, /var\s+\w+\s*=/, /console\.log\s*\(/, /=>\s*{?/],
    typescript: [/interface\s+\w+/, /type\s+\w+\s*=/, /:\s*string/, /:\s*number/, /:\s*boolean/, /export\s+(interface|type)/],
    java: [/public\s+class\s+\w+/, /public\s+static\s+void\s+main/, /System\.out\.println/, /import\s+java\./],
    cpp: [/#include\s*</, /std::/, /cout\s*<</, /int\s+main\s*\(/, /namespace\s+\w+/],
    rust: [/fn\s+\w+\s*\(/, /let\s+mut\s+/, /println!\s*\(/, /use\s+std::/, /impl\s+\w+/],
    go: [/func\s+\w+\s*\(/, /package\s+\w+/, /import\s+\(/, /fmt\.Print/, /var\s+\w+\s+\w+/],
    php: [/<\?php/, /function\s+\w+\s*\(/, /echo\s+/, /\$\w+\s*=/, /class\s+\w+/],
    ruby: [/def\s+\w+/, /class\s+\w+/, /puts\s+/, /require\s+/, /end$/m],
    csharp: [/using\s+System/, /public\s+class\s+\w+/, /Console\.WriteLine/, /namespace\s+\w+/],
  };

  for (const [lang, langPatterns] of Object.entries(patterns)) {
    const matches = langPatterns.filter(pattern => pattern.test(code)).length;
    if (matches >= 2) {
      return lang;
    }
  }

  return 'unknown';
}

async function analyzeCode(
  code: string, 
  language: string, 
  analysisType: string, 
  includeOptimizations: boolean
): Promise<CodeAnalysisResult> {
  const lines = code.split('\n');
  const analysis: CodeAnalysisResult = {
    language,
    complexity: analyzeComplexity(code, lines),
    quality: analyzeQuality(code, lines, language),
    security: analyzeSecurity(code, lines, language),
    performance: analyzePerformance(code, lines, language),
    documentation: analyzeDocumentation(code, lines, language),
    dependencies: analyzeDependencies(code, lines, language),
  };

  if (includeOptimizations) {
    analysis.quality.suggestions.push(...generateOptimizations(code, language, analysis));
  }

  return analysis;
}

function analyzeComplexity(code: string, lines: string[]): CodeAnalysisResult['complexity'] {
  const functionCount = (code.match(/function\s+\w+|def\s+\w+|fn\s+\w+/g) || []).length;
  const classCount = (code.match(/class\s+\w+/g) || []).length;
  
  // Simple cyclomatic complexity calculation
  const complexityKeywords = ['if', 'else', 'elif', 'for', 'while', 'switch', 'case', 'catch', '&&', '||'];
  let cyclomaticComplexity = 1; // Base complexity
  
  complexityKeywords.forEach(keyword => {
    const matches = code.match(new RegExp(`\\b${keyword}\\b`, 'g'));
    if (matches) {
      cyclomaticComplexity += matches.length;
    }
  });

  // Cognitive complexity (simplified)
  const cognitiveComplexity = Math.floor(cyclomaticComplexity * 1.2);

  return {
    cyclomatic: cyclomaticComplexity,
    cognitive: cognitiveComplexity,
    lines: lines.length,
    functions: functionCount,
    classes: classCount,
  };
}

function analyzeQuality(code: string, lines: string[], language: string): CodeAnalysisResult['quality'] {
  const issues: CodeAnalysisResult['quality']['issues'] = [];
  const suggestions: string[] = [];

  // Check for common quality issues
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();

    // Long lines
    if (line.length > 120) {
      issues.push({
        type: 'warning',
        message: 'Line too long (>120 characters)',
        line: lineNum,
        severity: 'low',
      });
    }

    // TODO comments
    if (trimmedLine.includes('TODO') || trimmedLine.includes('FIXME')) {
      issues.push({
        type: 'info',
        message: 'TODO/FIXME comment found',
        line: lineNum,
        severity: 'low',
      });
    }

    // Empty catch blocks
    if (trimmedLine.includes('catch') && lines[index + 1]?.trim() === '}') {
      issues.push({
        type: 'warning',
        message: 'Empty catch block',
        line: lineNum,
        severity: 'medium',
      });
    }

    // Magic numbers
    const magicNumberRegex = /\b\d{2,}\b/g;
    if (magicNumberRegex.test(trimmedLine) && !trimmedLine.includes('//') && !trimmedLine.includes('#')) {
      issues.push({
        type: 'info',
        message: 'Consider using named constants instead of magic numbers',
        line: lineNum,
        severity: 'low',
      });
    }
  });

  // Language-specific checks
  if (language === 'javascript' || language === 'typescript') {
    if (code.includes('var ')) {
      suggestions.push('Consider using "let" or "const" instead of "var"');
    }
    if (code.includes('==') && !code.includes('===')) {
      suggestions.push('Use strict equality (===) instead of loose equality (==)');
    }
  }

  if (language === 'python') {
    if (!code.includes('"""') && !code.includes("'''")) {
      suggestions.push('Add docstrings to functions and classes');
    }
  }

  // Calculate quality score
  const totalLines = lines.filter(line => line.trim().length > 0).length;
  const issueWeight = issues.reduce((sum, issue) => {
    const weights = { high: 3, medium: 2, low: 1 };
    return sum + weights[issue.severity];
  }, 0);
  
  const qualityScore = Math.max(0, Math.min(10, 10 - (issueWeight / totalLines) * 10));

  return {
    score: Math.round(qualityScore * 10) / 10,
    issues,
    suggestions,
  };
}

function analyzeSecurity(code: string, lines: string[], language: string): CodeAnalysisResult['security'] {
  const vulnerabilities: CodeAnalysisResult['security']['vulnerabilities'] = [];

  // Common security patterns
  const securityPatterns = {
    'SQL Injection': {
      patterns: [/SELECT.*\+.*FROM/i, /INSERT.*\+.*INTO/i, /UPDATE.*\+.*SET/i],
      severity: 'high' as const,
      fix: 'Use parameterized queries or prepared statements',
    },
    'XSS Vulnerability': {
      patterns: [/innerHTML\s*=/, /document\.write\s*\(/, /eval\s*\(/],
      severity: 'high' as const,
      fix: 'Sanitize user input and use safe DOM manipulation methods',
    },
    'Hardcoded Secrets': {
      patterns: [/password\s*=\s*["'][^"']+["']/, /api_key\s*=\s*["'][^"']+["']/, /secret\s*=\s*["'][^"']+["']/i],
      severity: 'critical' as const,
      fix: 'Use environment variables or secure configuration management',
    },
    'Insecure Random': {
      patterns: [/Math\.random\(\)/, /random\.randint\(/],
      severity: 'medium' as const,
      fix: 'Use cryptographically secure random number generators',
    },
    'Path Traversal': {
      patterns: [/\.\.\//g, /\.\.\\\\/, /path.*\+.*\.\./],
      severity: 'high' as const,
      fix: 'Validate and sanitize file paths',
    },
  };

  lines.forEach((line, index) => {
    Object.entries(securityPatterns).forEach(([vulnType, config]) => {
      config.patterns.forEach(pattern => {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type: vulnType,
            description: `Potential ${vulnType.toLowerCase()} vulnerability detected`,
            severity: config.severity,
            line: index + 1,
            fix: config.fix,
          });
        }
      });
    });
  });

  // Calculate security score
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
  
  const securityScore = Math.max(0, 10 - (criticalCount * 4 + highCount * 2 + mediumCount * 1));

  return {
    vulnerabilities,
    score: Math.round(securityScore * 10) / 10,
  };
}

function analyzePerformance(code: string, lines: string[], language: string): CodeAnalysisResult['performance'] {
  const bottlenecks: string[] = [];
  const optimizations: string[] = [];

  // Common performance issues
  if (code.includes('for') && code.includes('for')) {
    const nestedLoops = (code.match(/for.*for/g) || []).length;
    if (nestedLoops > 0) {
      bottlenecks.push(`${nestedLoops} nested loop(s) detected - O(n²) complexity`);
      optimizations.push('Consider using more efficient algorithms or data structures');
    }
  }

  // Language-specific performance checks
  if (language === 'javascript' || language === 'typescript') {
    if (code.includes('document.getElementById') && code.match(/document\.getElementById/g)?.length > 3) {
      bottlenecks.push('Multiple DOM queries detected');
      optimizations.push('Cache DOM elements in variables');
    }
    
    if (code.includes('JSON.parse') && code.includes('JSON.stringify')) {
      optimizations.push('Consider using more efficient serialization methods for large objects');
    }
  }

  if (language === 'python') {
    if (code.includes('list(') && code.includes('for')) {
      optimizations.push('Consider using list comprehensions for better performance');
    }
    
    if (code.includes('range(len(')) {
      optimizations.push('Use enumerate() instead of range(len()) for better readability and performance');
    }
  }

  // Estimate algorithmic complexity
  let estimatedComplexity = 'O(1)';
  if (code.includes('for') || code.includes('while')) {
    const loopCount = (code.match(/for|while/g) || []).length;
    if (loopCount === 1) {
      estimatedComplexity = 'O(n)';
    } else if (loopCount >= 2) {
      estimatedComplexity = `O(n^${loopCount})`;
    }
  }

  return {
    bottlenecks,
    optimizations,
    estimatedComplexity,
  };
}

function analyzeDocumentation(code: string, lines: string[], language: string): CodeAnalysisResult['documentation'] {
  const missing: string[] = [];
  const suggestions: string[] = [];

  // Count documented vs undocumented functions
  const functionRegexes = {
    python: /def\s+(\w+)/g,
    javascript: /function\s+(\w+)/g,
    typescript: /function\s+(\w+)/g,
    java: /public\s+\w+\s+(\w+)\s*\(/g,
  };

  const docRegexes = {
    python: /"""|'''/g,
    javascript: /\/\*\*|\*\/|\/\//g,
    typescript: /\/\*\*|\*\/|\/\//g,
    java: /\/\*\*|\*\/|\/\//g,
  };

  const functionRegex = functionRegexes[language as keyof typeof functionRegexes];
  const docRegex = docRegexes[language as keyof typeof docRegexes];

  if (functionRegex && docRegex) {
    const functions = code.match(functionRegex) || [];
    const docComments = code.match(docRegex) || [];
    
    const coverage = functions.length > 0 ? (docComments.length / functions.length) * 100 : 100;
    
    if (coverage < 50) {
      missing.push('Function documentation');
      suggestions.push('Add documentation comments to functions');
    }
    
    if (coverage < 25) {
      missing.push('Class documentation');
      suggestions.push('Add class-level documentation');
    }

    return {
      coverage: Math.round(coverage),
      missing,
      suggestions,
    };
  }

  return {
    coverage: 0,
    missing: ['Unable to analyze documentation for this language'],
    suggestions: ['Add comprehensive documentation comments'],
  };
}

function analyzeDependencies(code: string, lines: string[], language: string): CodeAnalysisResult['dependencies'] {
  const imports: string[] = [];
  const external: string[] = [];
  const unused: string[] = [];

  // Extract imports based on language
  const importPatterns = {
    python: [/^import\s+(\w+)/, /^from\s+(\w+)\s+import/],
    javascript: [/^import.*from\s+['"]([^'"]+)['"]/, /^const\s+\w+\s*=\s*require\(['"]([^'"]+)['"]\)/],
    typescript: [/^import.*from\s+['"]([^'"]+)['"]/, /^import\s+['"]([^'"]+)['"]/],
    java: [/^import\s+([\w.]+)/],
  };

  const patterns = importPatterns[language as keyof typeof importPatterns];
  if (patterns) {
    lines.forEach(line => {
      patterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          const importName = match[1];
          imports.push(importName);
          
          // Check if it's an external dependency (simplified)
          if (!importName.startsWith('.') && !importName.includes('/')) {
            external.push(importName);
          }
        }
      });
    });
  }

  // Simple unused import detection (check if import name appears elsewhere in code)
  imports.forEach(importName => {
    const baseName = importName.split('.')[0];
    const usageRegex = new RegExp(`\\b${baseName}\\b`, 'g');
    const matches = code.match(usageRegex) || [];
    
    // If only appears once (in the import statement), it might be unused
    if (matches.length <= 1) {
      unused.push(importName);
    }
  });

  return {
    imports,
    external,
    unused,
  };
}

function generateOptimizations(code: string, language: string, analysis: CodeAnalysisResult): string[] {
  const optimizations: string[] = [];

  // Based on complexity
  if (analysis.complexity.cyclomatic > 10) {
    optimizations.push('Consider breaking down complex functions into smaller, more manageable pieces');
  }

  // Based on quality issues
  if (analysis.quality.score < 7) {
    optimizations.push('Address code quality issues to improve maintainability');
  }

  // Based on security vulnerabilities
  if (analysis.security.vulnerabilities.length > 0) {
    optimizations.push('Fix security vulnerabilities before deploying to production');
  }

  // Based on performance
  if (analysis.performance.bottlenecks.length > 0) {
    optimizations.push('Optimize performance bottlenecks for better user experience');
  }

  // Based on documentation
  if (analysis.documentation.coverage < 50) {
    optimizations.push('Improve code documentation for better team collaboration');
  }

  return optimizations;
}