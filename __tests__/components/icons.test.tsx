import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { BotIcon, UserIcon, AttachmentIcon } from '@/components/icons';

describe('Icons', () => {
  describe('BotIcon', () => {
    it('should render bot icon with correct attributes', () => {
      render(<BotIcon />);
      const svg = document.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('height', '16');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
    });

    it('should have correct styling', () => {
      render(<BotIcon />);
      const svg = document.querySelector('svg');

      expect(svg).toHaveStyle({ color: 'currentcolor' });
    });
  });

  describe('UserIcon', () => {
    it('should render user icon with correct attributes', () => {
      render(<UserIcon />);
      const svg = screen.getByTestId('geist-icon');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('height', '16');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
    });

    it('should have correct styling', () => {
      render(<UserIcon />);
      const svg = screen.getByTestId('geist-icon');

      expect(svg).toHaveStyle({ color: 'currentcolor' });
    });
  });

  describe('AttachmentIcon', () => {
    it('should render attachment icon with correct attributes', () => {
      render(<AttachmentIcon />);
      const svg = document.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('height', '16');
      expect(svg).toHaveAttribute('width', '16');
      expect(svg).toHaveAttribute('viewBox', '0 0 16 16');
    });

    it('should have correct styling', () => {
      render(<AttachmentIcon />);
      const svg = document.querySelector('svg');

      expect(svg).toHaveStyle({ color: 'currentcolor' });
    });
  });
});
