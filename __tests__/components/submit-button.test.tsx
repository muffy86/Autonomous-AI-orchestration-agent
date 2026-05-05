import '@testing-library/jest-dom'
import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { SubmitButton } from '@/components/submit-button'

describe('SubmitButton', () => {
  it('should render children', () => {
    render(
      <SubmitButton isSuccessful={false}>
        Submit
      </SubmitButton>
    )

    expect(screen.getByRole('button')).toHaveTextContent('Submit')
  })

  it('should be disabled when successful', () => {
    render(
      <SubmitButton isSuccessful={true}>
        Submit
      </SubmitButton>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
  })

  it('should show loading text when successful', () => {
    render(
      <SubmitButton isSuccessful={true}>
        Submit
      </SubmitButton>
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('should have relative class', () => {
    render(
      <SubmitButton isSuccessful={false}>
        Submit
      </SubmitButton>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('relative')
  })

  it('should show spinner when successful', () => {
    render(
      <SubmitButton isSuccessful={true}>
        Submit
      </SubmitButton>
    )

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should have accessibility output element', () => {
    render(
      <SubmitButton isSuccessful={false}>
        Submit
      </SubmitButton>
    )

    const output = screen.getByText('Submit form')
    expect(output).toHaveAttribute('aria-live', 'polite')
    expect(output).toHaveClass('sr-only')
  })
})