/**
 * @jest-environment jsdom
 */
import DOMPurify from 'dompurify';

describe('XSS Protection with DOMPurify', () => {
  it('should sanitize malicious script tags', () => {
    const maliciousInput = '<script>alert("XSS")</script><p>Safe content</p>';
    const sanitized = DOMPurify.sanitize(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<p>Safe content</p>');
  });

  it('should sanitize event handlers', () => {
    const maliciousInput = '<img src="x" onerror="alert(\'XSS\')">';
    const sanitized = DOMPurify.sanitize(maliciousInput);
    
    expect(sanitized).not.toContain('onerror');
  });

  it('should sanitize javascript: URLs', () => {
    const maliciousInput = '<a href="javascript:alert(\'XSS\')">Click me</a>';
    const sanitized = DOMPurify.sanitize(maliciousInput);
    
    expect(sanitized).not.toContain('javascript:');
  });

  it('should preserve safe HTML content', () => {
    const safeInput = '<div><h1>Title</h1><p>Paragraph</p></div>';
    const sanitized = DOMPurify.sanitize(safeInput);
    
    expect(sanitized).toContain('<h1>Title</h1>');
    expect(sanitized).toContain('<p>Paragraph</p>');
  });

  it('should handle empty input', () => {
    const emptyInput = '';
    const sanitized = DOMPurify.sanitize(emptyInput);
    
    expect(sanitized).toBe('');
  });
});
