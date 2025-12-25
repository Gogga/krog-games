import { useState, useEffect, useCallback, useRef } from 'react';

// Breakpoints
const MOBILE_MAX = 767;
const TABLET_MAX = 1023;

// Debounce delay for resize events
const RESIZE_DEBOUNCE_MS = 100;

interface MediaQueryResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}

/**
 * Custom hook for responsive design with mobile, tablet, and desktop detection.
 *
 * Breakpoints:
 * - Mobile: 320px - 767px
 * - Tablet: 768px - 1023px
 * - Desktop: 1024px+
 */
export function useMediaQuery(): MediaQueryResult {
  const getScreenState = useCallback((): MediaQueryResult => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return {
      isMobile: width <= MOBILE_MAX,
      isTablet: width > MOBILE_MAX && width <= TABLET_MAX,
      isDesktop: width > TABLET_MAX,
      screenWidth: width,
    };
  }, []);

  const [state, setState] = useState<MediaQueryResult>(getScreenState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => {
      // Debounce resize events
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setState(getScreenState());
      }, RESIZE_DEBOUNCE_MS);
    };

    // Also listen for orientation change on mobile devices
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [getScreenState]);

  return state;
}

// Re-export for backwards compatibility with existing useIsMobile usage
export function useIsMobile(): boolean {
  const { isMobile } = useMediaQuery();
  return isMobile;
}

// Board sizing hook with proper constraints
interface BoardDimensions {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  boardSize: number;
  screenWidth: number;
}

/**
 * Custom hook for chess board sizing with proper responsive constraints.
 *
 * Board size constraints:
 * - Mobile: min 280px, max 480px (or screen width - 16px)
 * - Tablet: 400px - 520px
 * - Desktop: 480px - 600px
 */
export function useResponsiveBoard(): BoardDimensions {
  const { isMobile, isTablet, isDesktop, screenWidth } = useMediaQuery();

  const calculateBoardSize = useCallback((): number => {
    if (isMobile) {
      // Mobile: account for padding, margins, and container constraints
      // Use 90% of screen width or max 480px, whichever is smaller
      const availableWidth = screenWidth * 0.9;
      return Math.min(Math.max(availableWidth, 280), 480);
    } else if (isTablet) {
      // Tablet: 400px - 520px based on screen width
      const tabletSize = Math.min(520, Math.max(400, screenWidth * 0.5));
      return tabletSize;
    } else {
      // Desktop: 480px - 600px
      return Math.min(600, Math.max(480, screenWidth * 0.4));
    }
  }, [isMobile, isTablet, screenWidth]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    boardSize: calculateBoardSize(),
    screenWidth,
  };
}

export default useMediaQuery;
