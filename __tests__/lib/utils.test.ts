import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  cn,
  fetcher,
  fetchWithErrorHandlers,
  getLocalStorage,
  generateUUID,
  getMostRecentUserMessage,
  getDocumentTimestampByIndex,
  getTrailingMessageId,
  sanitizeText,
} from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    onLine: true,
  },
  writable: true,
});

describe('utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    });

    it('should handle undefined and null values', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('fetcher', () => {
    it('should fetch and return JSON data successfully', async () => {
      const mockData = { message: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await fetcher('/api/test');
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test');
    });

    it('should throw ChatSDKError when response is not ok', async () => {
      const errorResponse = { code: 'bad_request:api', cause: 'Invalid input' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      } as Response);

      await expect(fetcher('/api/test')).rejects.toThrow(ChatSDKError);
    });
  });

  describe('fetchWithErrorHandlers', () => {
    it('should return response when successful', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
      } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await fetchWithErrorHandlers('/api/test');
      expect(result).toBe(mockResponse);
    });

    it('should throw ChatSDKError when response is not ok', async () => {
      const errorResponse = { code: 'bad_request:api', cause: 'Invalid input' };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      } as Response);

      await expect(fetchWithErrorHandlers('/api/test')).rejects.toThrow(
        ChatSDKError,
      );
    });

    it('should throw offline error when navigator is offline', async () => {
      Object.defineProperty(window, 'navigator', {
        value: { onLine: false },
        writable: true,
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchWithErrorHandlers('/api/test')).rejects.toThrow(
        ChatSDKError,
      );
    });

    it('should rethrow other errors', async () => {
      // Ensure navigator is online to avoid offline error
      Object.defineProperty(window, 'navigator', {
        value: { onLine: true },
        writable: true,
      });

      const customError = new Error('Custom error');
      mockFetch.mockRejectedValueOnce(customError);

      await expect(fetchWithErrorHandlers('/api/test')).rejects.toThrow(
        customError,
      );
    });
  });

  describe('getLocalStorage', () => {
    it('should return parsed data from localStorage', () => {
      const testData = ['item1', 'item2'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));

      const result = getLocalStorage('testKey');
      expect(result).toEqual(testData);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should return empty array when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getLocalStorage('testKey');
      expect(result).toEqual([]);
    });

    it('should return empty array when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const result = getLocalStorage('testKey');
      expect(result).toEqual([]);

      global.window = originalWindow;
    });
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID format', () => {
      const uuid = generateUUID();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('getMostRecentUserMessage', () => {
    it('should return the most recent user message', () => {
      const messages = [
        { id: '1', role: 'user', content: 'First message' },
        { id: '2', role: 'assistant', content: 'Assistant response' },
        { id: '3', role: 'user', content: 'Second message' },
      ] as any[];

      const result = getMostRecentUserMessage(messages);
      expect(result).toEqual({
        id: '3',
        role: 'user',
        content: 'Second message',
      });
    });

    it('should return undefined when no user messages exist', () => {
      const messages = [
        { id: '1', role: 'assistant', content: 'Assistant response' },
        { id: '2', role: 'system', content: 'System message' },
      ] as any[];

      const result = getMostRecentUserMessage(messages);
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty messages array', () => {
      const result = getMostRecentUserMessage([]);
      expect(result).toBeUndefined();
    });
  });

  describe('getDocumentTimestampByIndex', () => {
    it('should return the timestamp of document at given index', () => {
      const testDate = new Date('2023-12-25T10:30:00Z');
      const documents = [
        { id: '1', createdAt: new Date('2023-12-24T10:30:00Z') },
        { id: '2', createdAt: testDate },
        { id: '3', createdAt: new Date('2023-12-26T10:30:00Z') },
      ] as any[];

      const result = getDocumentTimestampByIndex(documents, 1);
      expect(result).toBe(testDate);
    });

    it('should return current date when documents is null', () => {
      const result = getDocumentTimestampByIndex(null as any, 0);
      expect(result).toBeInstanceOf(Date);
    });

    it('should return current date when index is out of bounds', () => {
      const documents = [
        { id: '1', createdAt: new Date('2023-12-24T10:30:00Z') },
      ] as any[];

      const result = getDocumentTimestampByIndex(documents, 5);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('getTrailingMessageId', () => {
    it('should return the ID of the last message', () => {
      const messages = [
        { id: 'msg1', role: 'user', content: 'Hello' },
        { id: 'msg2', role: 'assistant', content: 'Hi there' },
        { id: 'msg3', role: 'user', content: 'How are you?' },
      ] as any[];

      const result = getTrailingMessageId({ messages });
      expect(result).toBe('msg3');
    });

    it('should return null for empty messages array', () => {
      const result = getTrailingMessageId({ messages: [] });
      expect(result).toBeNull();
    });
  });

  describe('sanitizeText', () => {
    it('should remove function call markers', () => {
      const text = 'Hello <has_function_call>world';
      const result = sanitizeText(text);
      expect(result).toBe('Hello world');
    });

    it('should handle text without function call markers', () => {
      const text = 'Hello world';
      const result = sanitizeText(text);
      expect(result).toBe('Hello world');
    });

    it('should handle multiple function call markers', () => {
      const text = 'Hello <has_function_call>world<has_function_call> test';
      const result = sanitizeText(text);
      expect(result).toBe('Hello world<has_function_call> test');
    });

    it('should handle empty string', () => {
      const result = sanitizeText('');
      expect(result).toBe('');
    });
  });
});
