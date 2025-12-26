/**
 * Pull-to-refresh hook for mobile interactions
 */
import { useState, useRef, useEffect, useCallback } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

interface PullToRefreshState {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number;
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: PullToRefreshOptions): PullToRefreshState {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isTouching = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;

    // Only start pull if at top of scroll
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isTouching.current = true;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTouching.current || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    // Only pull down (positive distance) and when at top
    if (distance > 0 && container.scrollTop <= 0) {
      e.preventDefault();

      // Apply resistance to pull (slower as you pull more)
      const resistedDistance = Math.min(
        distance * 0.5,
        maxPull
      );

      setPullDistance(resistedDistance);
      setIsPulling(true);
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isTouching.current) return;

    isTouching.current = false;
    setIsPulling(false);

    // Trigger refresh if pulled past threshold
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Keep indicator visible during refresh

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use passive: false for touchmove to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1),
  };
}

/**
 * Pull-to-refresh indicator component props
 */
export interface PullIndicatorProps {
  pullProgress: number;
  isRefreshing: boolean;
  pullDistance: number;
}
