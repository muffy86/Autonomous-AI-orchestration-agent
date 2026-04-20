/**
 * Security tests for the AI Chatbot application
 */

import {
  sanitizeHtml,
  sanitizeText,
  generateSecureToken,
  validateAndSanitize,
  securitySchemas,
  checkRateLimit,
  cleanupRateLimiter,
} from '@/lib/security';

describe('Security Utils', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous script tags', () => {
      const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = sanitizeHtml(maliciousHtml);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('should remove event handlers', () => {
      const maliciousHtml = '<div onclick="alert(\'xss\')">Click me</div>';
      const sanitized = sanitizeHtml(maliciousHtml);
      expect(sanitized).not.toContain('onclick');
    });

    it('should allow safe HTML tags', () => {
      const safeHtml = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      const sanitized = sanitizeHtml(safeHtml);
      expect(sanitized).toContain('<strong>Bold</strong>');
      expect(sanitized).toContain('<em>italic</em>');
    });
  });

  describe('sanitizeText', () => {
    it('should escape HTML entities', () => {
      const text = '<script>alert("xss")</script>';
      const sanitized = sanitizeText(text);
      expect(sanitized).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
    });

    it('should escape quotes and ampersands', () => {
      const text = 'Test & "quotes" & \'apostrophes\'';
      const sanitized = sanitizeText(text);
      expect(sanitized).toBe(
        'Test &amp; &quot;quotes&quot; &amp; &#x27;apostrophes&#x27;',
      );
    });
  });

  describe('generateSecureToken', () => {
    it('should generate tokens of specified length', () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(32);
    });

    it('should generate different tokens each time', () => {
      const token1 = generateSecureToken(16);
      const token2 = generateSecureToken(16);
      expect(token1).not.toBe(token2);
    });

    it('should only contain valid characters', () => {
      const token = generateSecureToken(100);
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('validateAndSanitize', () => {
    it('should validate valid email', () => {
      const result = validateAndSanitize(
        'test@example.com',
        securitySchemas.email,
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const result = validateAndSanitize(
        'invalid-email',
        securitySchemas.email,
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid email format');
      }
    });

    it('should reject email with suspicious patterns', () => {
      const result = validateAndSanitize(
        'test<script>@example.com',
        securitySchemas.email,
      );
      expect(result.success).toBe(false);
    });

    it('should validate strong password', () => {
      const result = validateAndSanitize(
        'StrongP@ssw0rd123',
        securitySchemas.password,
      );
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const result = validateAndSanitize('weak', securitySchemas.password);
      expect(result.success).toBe(false);
    });

    it('should validate UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = validateAndSanitize(uuid, securitySchemas.uuid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = validateAndSanitize('not-a-uuid', securitySchemas.uuid);
      expect(result.success).toBe(false);
    });
  });

  // Note: isTrustedOrigin tests skipped due to NextRequest dependency in Jest environment

  describe('RateLimiter', () => {
    beforeEach(() => {
      // Clear rate limiter state before each test
      cleanupRateLimiter();
    });

    it('should allow requests within limit', () => {
      const config = { windowMs: 60000, max: 5 };
      const result = checkRateLimit('test-ip', 'test-endpoint', config);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should block requests exceeding limit', () => {
      const config = { windowMs: 60000, max: 2 };

      // First request - should be allowed
      let result = checkRateLimit('test-ip-2', 'test-endpoint-2', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      // Second request - should be allowed
      result = checkRateLimit('test-ip-2', 'test-endpoint-2', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);

      // Third request - should be blocked
      result = checkRateLimit('test-ip-2', 'test-endpoint-2', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle different IPs independently', () => {
      const config = { windowMs: 60000, max: 1 };

      // First IP - should be allowed
      let result1 = checkRateLimit('ip1', 'test-endpoint', config);
      expect(result1.allowed).toBe(true);

      // Second IP - should also be allowed
      let result2 = checkRateLimit('ip2', 'test-endpoint', config);
      expect(result2.allowed).toBe(true);

      // First IP second request - should be blocked
      result1 = checkRateLimit('ip1', 'test-endpoint', config);
      expect(result1.allowed).toBe(false);

      // Second IP second request - should be blocked
      result2 = checkRateLimit('ip2', 'test-endpoint', config);
      expect(result2.allowed).toBe(false);
    });
  });
});

describe('Security Schemas', () => {
  describe('email schema', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
      ];

      validEmails.forEach((email) => {
        const result = securitySchemas.email.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test<script>@example.com',
        'test@example.com<script>',
      ];

      invalidEmails.forEach((email) => {
        const result = securitySchemas.email.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('password schema', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'StrongP@ssw0rd123',
        'MySecure!Pass1',
        'C0mpl3x&P@ssw0rd',
      ];

      strongPasswords.forEach((password) => {
        const result = securitySchemas.password.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        'password',
        '12345678',
        'PASSWORD',
        'Pass123', // Missing special character
        'Pass@word', // Missing number
        'pass@123', // Missing uppercase
        'PASS@123', // Missing lowercase
      ];

      weakPasswords.forEach((password) => {
        const result = securitySchemas.password.safeParse(password);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('chatMessage schema', () => {
    it('should accept safe messages', () => {
      const safeMessages = [
        'Hello, how are you?',
        'This is a normal chat message.',
        'Can you help me with coding?',
      ];

      safeMessages.forEach((message) => {
        const result = securitySchemas.chatMessage.safeParse(message);
        expect(result.success).toBe(true);
      });
    });

    it('should reject dangerous messages', () => {
      const dangerousMessages = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        '<img onerror="alert(\'xss\')" src="x">',
      ];

      dangerousMessages.forEach((message) => {
        const result = securitySchemas.chatMessage.safeParse(message);
        expect(result.success).toBe(false);
      });
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(5000);
      const result = securitySchemas.chatMessage.safeParse(longMessage);
      expect(result.success).toBe(false);
    });
  });

  describe('url schema', () => {
    it('should accept valid HTTPS URLs', () => {
      const validUrls = [
        'https://example.com',
        'https://api.example.com/endpoint',
        'http://localhost:3000',
      ];

      validUrls.forEach((url) => {
        const result = securitySchemas.url.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid or dangerous URLs', () => {
      const invalidUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'ftp://example.com',
        'not-a-url',
      ];

      invalidUrls.forEach((url) => {
        const result = securitySchemas.url.safeParse(url);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('fileUpload schema', () => {
    it('should accept valid file uploads', () => {
      const validFile = {
        name: 'document.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf',
      };

      const result = securitySchemas.fileUpload.safeParse(validFile);
      expect(result.success).toBe(true);
    });

    it('should reject files with dangerous names', () => {
      // Test directory traversal
      let result = securitySchemas.fileUpload.safeParse({
        name: '../../../etc/passwd.txt',
        size: 1024,
        type: 'text/plain',
      });
      expect(result.success).toBe(false);

      // Test invalid characters
      result = securitySchemas.fileUpload.safeParse({
        name: 'file<script>.txt',
        size: 1024,
        type: 'text/plain',
      });
      expect(result.success).toBe(false);

      // Test Windows reserved name
      result = securitySchemas.fileUpload.safeParse({
        name: 'con.txt',
        size: 1024,
        type: 'text/plain',
      });
      expect(result.success).toBe(false);
    });

    it('should reject files that are too large', () => {
      const largeFile = {
        name: 'large.pdf',
        size: 20 * 1024 * 1024, // 20MB
        type: 'application/pdf',
      };

      const result = securitySchemas.fileUpload.safeParse(largeFile);
      expect(result.success).toBe(false);
    });

    it('should reject disallowed file types', () => {
      const disallowedFile = {
        name: 'malware.exe',
        size: 1024,
        type: 'application/x-executable',
      };

      const result = securitySchemas.fileUpload.safeParse(disallowedFile);
      expect(result.success).toBe(false);
    });
  });
});
