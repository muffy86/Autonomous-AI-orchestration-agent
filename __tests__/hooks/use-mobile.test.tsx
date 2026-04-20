import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock window.matchMedia
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: 1024,
});

describe('useIsMobile', () => {
  let mockMediaQueryList: any;
  let mockAddEventListener: jest.MockedFunction<any>;
  let mockRemoveEventListener: jest.MockedFunction<any>;

  beforeEach(() => {
    mockAddEventListener = jest.fn();
    mockRemoveEventListener = jest.fn();

    mockMediaQueryList = {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      matches: false,
    };

    mockMatchMedia.mockReturnValue(mockMediaQueryList);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false for desktop width', () => {
    // Set desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('should return true for mobile width', () => {
    // Set mobile width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 600,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('should return true for exactly mobile breakpoint', () => {
    // Set width to exactly 767px (mobile breakpoint)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 767,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('should return false for exactly desktop breakpoint', () => {
    // Set width to exactly 768px (desktop breakpoint)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('should add and remove event listener on mount/unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('should update when media query changes', () => {
    // Start with desktop width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Simulate media query change to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 600,
      });

      // Get the change handler that was registered
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      changeHandler();
    });

    expect(result.current).toBe(true);
  });

  it('should handle undefined initial state', () => {
    const { result } = renderHook(() => useIsMobile());

    // The hook should return a boolean, not undefined
    expect(typeof result.current).toBe('boolean');
  });
});
