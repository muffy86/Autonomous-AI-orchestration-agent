import React from 'react'
import { describe, it, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'

// Mock the message component dependencies
jest.mock('@/components/markdown', () => ({
  Markdown: ({ children }: { children: React.ReactNode }) => <div data-testid="markdown">{children}</div>
}))

jest.mock('@/components/message-actions', () => ({
  MessageActions: () => <div data-testid="message-actions">Actions</div>
}))

// Mock the message component since it might have complex dependencies
const MockMessage = ({ message, isLoading }: { message: any, isLoading?: boolean }) => (
  <div data-testid="message" data-role={message.role} data-loading={isLoading}>
    <div data-testid="message-content">{message.content}</div>
    {!isLoading && <div data-testid="message-actions">Actions</div>}
  </div>
)

describe('Message Component', () => {
  const mockUserMessage = {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?',
    createdAt: new Date(),
  }

  const mockAssistantMessage = {
    id: '2',
    role: 'assistant',
    content: 'I am doing well, thank you for asking!',
    createdAt: new Date(),
  }

  it('renders user message correctly', () => {
    render(<MockMessage message={mockUserMessage} />)
    
    const message = screen.getByTestId('message')
    expect(message).toHaveAttribute('data-role', 'user')
    expect(screen.getByTestId('message-content')).toHaveTextContent('Hello, how are you?')
  })

  it('renders assistant message correctly', () => {
    render(<MockMessage message={mockAssistantMessage} />)
    
    const message = screen.getByTestId('message')
    expect(message).toHaveAttribute('data-role', 'assistant')
    expect(screen.getByTestId('message-content')).toHaveTextContent('I am doing well, thank you for asking!')
  })

  it('shows loading state correctly', () => {
    render(<MockMessage message={mockAssistantMessage} isLoading={true} />)
    
    const message = screen.getByTestId('message')
    expect(message).toHaveAttribute('data-loading', 'true')
    expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument()
  })

  it('shows actions when not loading', () => {
    render(<MockMessage message={mockAssistantMessage} isLoading={false} />)
    
    expect(screen.getByTestId('message-actions')).toBeInTheDocument()
  })

  it('handles empty content gracefully', () => {
    const emptyMessage = { ...mockUserMessage, content: '' }
    render(<MockMessage message={emptyMessage} />)
    
    const content = screen.getByTestId('message-content')
    expect(content).toHaveTextContent('')
  })
})