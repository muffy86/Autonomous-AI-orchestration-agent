import { describe, it, expect, jest } from '@jest/globals'
import { ChatSDKError, getMessageByErrorCode } from '@/lib/errors'

// Mock Response
global.Response = {
  json: jest.fn((data, options?: { status?: number }) => ({
    json: async () => data,
    status: options?.status || 200,
  })),
} as any

// Mock console.error
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

describe('errors', () => {
  afterEach(() => {
    consoleSpy.mockClear()
  })

  describe('ChatSDKError', () => {
    it('should create error with correct properties', () => {
      const error = new ChatSDKError('bad_request:api', 'Invalid input')
      
      expect(error.type).toBe('bad_request')
      expect(error.surface).toBe('api')
      expect(error.cause).toBe('Invalid input')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe("The request couldn't be processed. Please check your input and try again.")
    })

    it('should handle error without cause', () => {
      const error = new ChatSDKError('unauthorized:auth')
      
      expect(error.type).toBe('unauthorized')
      expect(error.surface).toBe('auth')
      expect(error.cause).toBeUndefined()
      expect(error.statusCode).toBe(401)
    })

    it('should return response for visible errors', () => {
      const error = new ChatSDKError('bad_request:api', 'Test cause')
      const response = error.toResponse()
      
      expect(response).toBeDefined()
      expect(typeof response).toBe('object')
    })

    it('should log and return generic response for database errors', () => {
      const error = new ChatSDKError('bad_request:database', 'SQL error')
      const response = error.toResponse()
      
      expect(consoleSpy).toHaveBeenCalledWith({
        code: 'bad_request:database',
        message: 'An error occurred while executing a database query.',
        cause: 'SQL error',
      })
      expect(response).toBeDefined()
      expect(typeof response).toBe('object')
    })
  })

  describe('getMessageByErrorCode', () => {
    it('should return database error message for database errors', () => {
      const message = getMessageByErrorCode('bad_request:database')
      expect(message).toBe('An error occurred while executing a database query.')
    })

    it('should return specific API error message', () => {
      const message = getMessageByErrorCode('bad_request:api')
      expect(message).toBe("The request couldn't be processed. Please check your input and try again.")
    })

    it('should return auth error messages', () => {
      expect(getMessageByErrorCode('unauthorized:auth')).toBe('You need to sign in before continuing.')
      expect(getMessageByErrorCode('forbidden:auth')).toBe('Your account does not have access to this feature.')
    })

    it('should return chat error messages', () => {
      expect(getMessageByErrorCode('rate_limit:chat')).toBe('You have exceeded your maximum number of messages for the day. Please try again later.')
      expect(getMessageByErrorCode('not_found:chat')).toBe('The requested chat was not found. Please check the chat ID and try again.')
      expect(getMessageByErrorCode('forbidden:chat')).toBe('This chat belongs to another user. Please check the chat ID and try again.')
      expect(getMessageByErrorCode('unauthorized:chat')).toBe('You need to sign in to view this chat. Please sign in and try again.')
      expect(getMessageByErrorCode('offline:chat')).toBe("We're having trouble sending your message. Please check your internet connection and try again.")
    })

    it('should return document error messages', () => {
      expect(getMessageByErrorCode('not_found:document')).toBe('The requested document was not found. Please check the document ID and try again.')
      expect(getMessageByErrorCode('forbidden:document')).toBe('This document belongs to another user. Please check the document ID and try again.')
      expect(getMessageByErrorCode('unauthorized:document')).toBe('You need to sign in to view this document. Please sign in and try again.')
      expect(getMessageByErrorCode('bad_request:document')).toBe('The request to create or update the document was invalid. Please check your input and try again.')
    })

    it('should return default message for unknown error codes', () => {
      const message = getMessageByErrorCode('unknown:surface' as any)
      expect(message).toBe('Something went wrong. Please try again later.')
    })
  })

  describe('status codes', () => {
    it('should return correct status codes for different error types', () => {
      expect(new ChatSDKError('bad_request:api').statusCode).toBe(400)
      expect(new ChatSDKError('unauthorized:auth').statusCode).toBe(401)
      expect(new ChatSDKError('forbidden:chat').statusCode).toBe(403)
      expect(new ChatSDKError('not_found:document').statusCode).toBe(404)
      expect(new ChatSDKError('rate_limit:chat').statusCode).toBe(429)
      expect(new ChatSDKError('offline:chat').statusCode).toBe(503)
    })

    it('should return 500 for unknown error types', () => {
      const error = new ChatSDKError('unknown:surface' as any)
      expect(error.statusCode).toBe(500)
    })
  })
})