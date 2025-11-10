/**
 * Tests for Prompt Optimizer system
 */

import { PromptOptimizer, promptOptimizer } from '@/lib/ai/prompt-optimizer';

describe('Prompt Optimizer', () => {
  describe('PromptOptimizer', () => {
    let optimizer: PromptOptimizer;

    beforeEach(() => {
      optimizer = PromptOptimizer.getInstance();
    });

    it('should be a singleton', () => {
      const optimizer1 = PromptOptimizer.getInstance();
      const optimizer2 = PromptOptimizer.getInstance();
      expect(optimizer1).toBe(optimizer2);
    });

    describe('analyzePrompt', () => {
      it('should analyze a simple prompt', () => {
        const prompt = 'Write a function to add two numbers';
        const analysis = optimizer.analyzePrompt(prompt);

        expect(analysis).toHaveProperty('clarity');
        expect(analysis).toHaveProperty('specificity');
        expect(analysis).toHaveProperty('structure');
        expect(analysis).toHaveProperty('context');
        expect(analysis).toHaveProperty('examples');
        expect(analysis).toHaveProperty('overall');
        expect(analysis).toHaveProperty('issues');
        expect(analysis).toHaveProperty('strengths');
        expect(analysis).toHaveProperty('weaknesses');

        expect(typeof analysis.clarity).toBe('number');
        expect(typeof analysis.specificity).toBe('number');
        expect(typeof analysis.structure).toBe('number');
        expect(typeof analysis.context).toBe('number');
        expect(typeof analysis.examples).toBe('number');
        expect(typeof analysis.overall).toBe('number');

        expect(analysis.clarity).toBeGreaterThanOrEqual(0);
        expect(analysis.clarity).toBeLessThanOrEqual(1);
        expect(analysis.overall).toBeGreaterThanOrEqual(0);
        expect(analysis.overall).toBeLessThanOrEqual(1);
      });

      it('should give higher scores to well-structured prompts', () => {
        const simplePrompt = 'Write code';
        const structuredPrompt = `
Please write a Python function that:

1. Takes two numbers as parameters
2. Returns their sum
3. Includes error handling for invalid inputs
4. Has proper documentation

Example:
\`\`\`python
def add(a, b):
    return a + b
\`\`\`
        `;

        const simpleAnalysis = optimizer.analyzePrompt(simplePrompt);
        const structuredAnalysis = optimizer.analyzePrompt(structuredPrompt);

        expect(structuredAnalysis.overall).toBeGreaterThan(simpleAnalysis.overall);
        expect(structuredAnalysis.structure).toBeGreaterThan(simpleAnalysis.structure);
        expect(structuredAnalysis.specificity).toBeGreaterThan(simpleAnalysis.specificity);
      });

      it('should identify issues in poor prompts', () => {
        const poorPrompt = 'maybe write something';
        const analysis = optimizer.analyzePrompt(poorPrompt);

        expect(analysis.issues.length).toBeGreaterThan(0);
        expect(analysis.overall).toBeLessThan(0.6);
      });

      it('should identify strengths in good prompts', () => {
        const goodPrompt = `
You are a Python expert. Please create a comprehensive function that calculates the factorial of a number.

Requirements:
1. Handle edge cases (negative numbers, zero)
2. Include proper error handling
3. Add comprehensive documentation
4. Provide usage examples

The function should be efficient and follow Python best practices.
        `;

        const analysis = optimizer.analyzePrompt(goodPrompt);
        expect(analysis.strengths.length).toBeGreaterThan(0);
        expect(analysis.overall).toBeGreaterThan(0.5);
      });
    });

    describe('optimizePrompt', () => {
      it('should optimize a simple prompt', () => {
        const prompt = 'Write code';
        const optimization = optimizer.optimizePrompt(prompt);

        expect(optimization).toHaveProperty('original');
        expect(optimization).toHaveProperty('optimized');
        expect(optimization).toHaveProperty('improvements');
        expect(optimization).toHaveProperty('score');
        expect(optimization).toHaveProperty('reasoning');

        expect(optimization.original).toBe(prompt);
        expect(optimization.optimized).not.toBe(prompt);
        expect(optimization.score.optimized).toBeGreaterThanOrEqual(optimization.score.original);
        expect(optimization.score.improvement).toBeGreaterThanOrEqual(0);
      });

      it('should provide meaningful improvements', () => {
        const prompt = 'Help me with something';
        const optimization = optimizer.optimizePrompt(prompt, 'coding');

        expect(optimization.improvements.length).toBeGreaterThan(0);
        expect(optimization.optimized).toContain('coding');
        expect(optimization.reasoning).toContain('improvement');
      });

      it('should handle already good prompts', () => {
        const goodPrompt = `
You are an expert software developer. Please create a well-documented Python function that:

1. Calculates the factorial of a positive integer
2. Handles edge cases (0, negative numbers)
3. Includes comprehensive error handling
4. Provides clear documentation with examples
5. Follows Python best practices

Please provide:
- The complete function implementation
- Usage examples
- Test cases
- Performance considerations

Example usage:
\`\`\`python
result = factorial(5)  # Should return 120
\`\`\`
        `;

        const optimization = optimizer.optimizePrompt(goodPrompt);
        expect(optimization.score.improvement).toBeLessThan(0.3); // Minimal improvement needed
      });
    });

    describe('Template Management', () => {
      it('should get all templates', () => {
        const templates = optimizer.getAllTemplates();
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);

        templates.forEach(template => {
          expect(template).toHaveProperty('id');
          expect(template).toHaveProperty('name');
          expect(template).toHaveProperty('description');
          expect(template).toHaveProperty('category');
          expect(template).toHaveProperty('template');
          expect(template).toHaveProperty('variables');
        });
      });

      it('should get templates by category', () => {
        const codingTemplates = optimizer.getTemplatesByCategory('coding');
        codingTemplates.forEach(template => {
          expect(template.category).toBe('coding');
        });
      });

      it('should search templates', () => {
        const searchResults = optimizer.searchTemplates('code');
        expect(Array.isArray(searchResults)).toBe(true);
        
        searchResults.forEach(template => {
          const matchesName = template.name.toLowerCase().includes('code');
          const matchesDescription = template.description.toLowerCase().includes('code');
          const matchesTags = template.tags.some(tag => tag.toLowerCase().includes('code'));
          
          expect(matchesName || matchesDescription || matchesTags).toBe(true);
        });
      });

      it('should create new templates', () => {
        const templateData = {
          name: 'Test Template',
          description: 'A test template',
          category: 'general' as const,
          template: 'This is a test template with {{variable}}',
          variables: [
            {
              name: 'variable',
              type: 'string' as const,
              description: 'A test variable',
              required: true,
            }
          ],
          tags: ['test'],
          effectiveness: 0.8,
        };

        const templateId = optimizer.createTemplate(templateData);
        expect(typeof templateId).toBe('string');
        expect(templateId).toMatch(/^template_/);

        const createdTemplate = optimizer.getTemplate(templateId);
        expect(createdTemplate).toBeTruthy();
        expect(createdTemplate!.name).toBe(templateData.name);
      });

      it('should update templates', () => {
        const templates = optimizer.getAllTemplates();
        if (templates.length > 0) {
          const templateId = templates[0].id;
          const originalName = templates[0].name;
          
          const updated = optimizer.updateTemplate(templateId, {
            name: 'Updated Name'
          });
          
          expect(updated).toBe(true);
          
          const updatedTemplate = optimizer.getTemplate(templateId);
          expect(updatedTemplate!.name).toBe('Updated Name');
          expect(updatedTemplate!.name).not.toBe(originalName);
        }
      });

      it('should render templates with variables', () => {
        const templates = optimizer.getAllTemplates();
        const template = templates.find(t => t.variables.length > 0);
        
        if (template) {
          const variables: Record<string, any> = {};
          template.variables.forEach(variable => {
            if (variable.type === 'string') {
              variables[variable.name] = 'test value';
            } else if (variable.type === 'boolean') {
              variables[variable.name] = true;
            } else if (variable.type === 'array') {
              variables[variable.name] = ['item1', 'item2'];
            }
          });

          const rendered = optimizer.renderTemplate(template.id, variables);
          expect(rendered).toBeTruthy();
          expect(typeof rendered).toBe('string');
          
          // Check that variables were replaced
          template.variables.forEach(variable => {
            if (variable.required) {
              expect(rendered).not.toContain(`{{${variable.name}}}`);
            }
          });
        }
      });
    });

    describe('Statistics', () => {
      it('should provide meaningful stats', () => {
        const stats = optimizer.getStats();
        
        expect(stats).toHaveProperty('totalTemplates');
        expect(stats).toHaveProperty('templatesByCategory');
        expect(stats).toHaveProperty('mostUsedTemplates');
        expect(stats).toHaveProperty('averageEffectiveness');
        expect(stats).toHaveProperty('totalOptimizations');

        expect(typeof stats.totalTemplates).toBe('number');
        expect(typeof stats.averageEffectiveness).toBe('number');
        expect(typeof stats.totalOptimizations).toBe('number');
        expect(Array.isArray(stats.mostUsedTemplates)).toBe(true);
      });
    });

    describe('Optimization History', () => {
      it('should track optimization history', () => {
        const prompt = 'Test prompt for history';
        
        // Perform optimization
        optimizer.optimizePrompt(prompt);
        
        // Check history
        const history = optimizer.getOptimizationHistory(prompt);
        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeGreaterThan(0);
        
        const lastOptimization = history[history.length - 1];
        expect(lastOptimization.original).toBe(prompt);
      });
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(promptOptimizer).toBeDefined();
      expect(promptOptimizer).toBeInstanceOf(PromptOptimizer);
    });

    it('should maintain state across calls', () => {
      const prompt = 'Test prompt for state';
      
      // Perform optimization
      promptOptimizer.optimizePrompt(prompt);
      
      // Check that history is maintained
      const history = promptOptimizer.getOptimizationHistory(prompt);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompts', () => {
      const analysis = promptOptimizer.analyzePrompt('');
      expect(analysis.overall).toBeLessThan(0.5);
      expect(analysis.issues.length).toBeGreaterThan(0);
    });

    it('should handle very long prompts', () => {
      const longPrompt = 'a'.repeat(10000);
      const analysis = promptOptimizer.analyzePrompt(longPrompt);
      expect(typeof analysis.overall).toBe('number');
      expect(analysis.overall).toBeGreaterThanOrEqual(0);
      expect(analysis.overall).toBeLessThanOrEqual(1);
    });

    it('should handle prompts with special characters', () => {
      const specialPrompt = 'Write code with @#$%^&*(){}[]|\\:";\'<>?,./`~';
      const analysis = promptOptimizer.analyzePrompt(specialPrompt);
      expect(typeof analysis.overall).toBe('number');
    });

    it('should handle non-existent template operations', () => {
      const template = promptOptimizer.getTemplate('non-existent-id');
      expect(template).toBeNull();

      const updated = promptOptimizer.updateTemplate('non-existent-id', { name: 'test' });
      expect(updated).toBe(false);

      const deleted = promptOptimizer.deleteTemplate('non-existent-id');
      expect(deleted).toBe(false);

      const rendered = promptOptimizer.renderTemplate('non-existent-id', {});
      expect(rendered).toBeNull();
    });
  });
});