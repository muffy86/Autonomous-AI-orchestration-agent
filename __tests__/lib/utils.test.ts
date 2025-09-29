import { describe, it, expect } from '@jest/globals'
import { cn, formatDate, sanitizeResponseMessages } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
    })

    it('should handle undefined and null values', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Dec 25, 2023/)
    })

    it('should handle different locales', () => {
      const date = new Date('2023-12-25T10:30:00Z')
      const formatted = formatDate(date, 'en-GB')
      expect(formatted).toMatch(/25 Dec 2023/)
    })
  })

  describe('sanitizeResponseMessages', () => {
    it('should remove empty messages', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: '' },
        { id: '3', role: 'user', content: 'How are you?' },
      ]
      
      const sanitized = sanitizeResponseMessages(messages)
      expect(sanitized).toHaveLength(2)
      expect(sanitized[0].content).toBe('Hello')
      expect(sanitized[1].content).toBe('How are you?')
    })

    it('should handle messages with only whitespace', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: '   \n\t  ' },
        { id: '3', role: 'user', content: 'How are you?' },
      ]
      
      const sanitized = sanitizeResponseMessages(messages)
      expect(sanitized).toHaveLength(2)
    })

    it('should preserve valid messages', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
        { id: '3', role: 'user', content: 'How are you?' },
      ]
      
      const sanitized = sanitizeResponseMessages(messages)
      expect(sanitized).toHaveLength(3)
      expect(sanitized).toEqual(messages)
    })
  })
})