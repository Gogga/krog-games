/**
 * Advanced gesture hooks for mobile interactions
 */
import { useGesture } from '@use-gesture/react';
import { useState, useCallback, useRef } from 'react';

interface SwipeGestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface ChessGestureCallbacks extends SwipeGestureCallbacks {
  onLongPress?: (position: { x: number; y: number }) => void;
  onRotate?: (direction: 'cw' | 'ccw') => void;
}

interface UseChessGesturesOptions {
  swipeThreshold?: number;
  longPressDelay?: number;
  rotationThreshold?: number;
}

/**
 * Hook for chess board gestures including swipe, long press, and rotation
 */
export function useChessGestures(
  callbacks: ChessGestureCallbacks,
  options: UseChessGesturesOptions = {}
) {
  const {
    swipeThreshold = 50,
    longPressDelay = 500,
    rotationThreshold = 30,
  } = options;

  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredRotation = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    setIsLongPressing(false);
  }, []);

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx, my], direction: [dx, dy], velocity: [vx, vy], first, last }) => {
        // Clear long press on any drag
        if (first) {
          clearLongPress();
        }

        // Only trigger swipe on release with sufficient movement
        if (!last) return;

        const absX = Math.abs(mx);
        const absY = Math.abs(my);
        const speed = Math.max(vx, vy);

        // Need sufficient movement or velocity
        if (absX < swipeThreshold && absY < swipeThreshold && speed < 0.5) return;

        // Horizontal swipe (move history)
        if (absX > absY) {
          if (dx > 0 && callbacks.onSwipeRight) {
            callbacks.onSwipeRight();
          } else if (dx < 0 && callbacks.onSwipeLeft) {
            callbacks.onSwipeLeft();
          }
        }
        // Vertical swipe
        else {
          if (dy > 0 && callbacks.onSwipeDown) {
            callbacks.onSwipeDown();
          } else if (dy < 0 && callbacks.onSwipeUp) {
            callbacks.onSwipeUp();
          }
        }
      },

      onPinch: ({ da: [, angle], first, memo }) => {
        if (first) {
          hasTriggeredRotation.current = false;
          return angle;
        }

        const initialAngle = memo as number;
        const rotation = angle - initialAngle;

        // Detect significant rotation
        if (!hasTriggeredRotation.current && Math.abs(rotation) > rotationThreshold) {
          hasTriggeredRotation.current = true;
          if (callbacks.onRotate) {
            callbacks.onRotate(rotation > 0 ? 'cw' : 'ccw');
          }
        }

        return initialAngle;
      },

      onPointerDown: ({ event }) => {
        // Start long press timer
        const target = event.target as HTMLElement;
        const rect = target.getBoundingClientRect();
        const x = (event as PointerEvent).clientX - rect.left;
        const y = (event as PointerEvent).clientY - rect.top;

        longPressTimeout.current = setTimeout(() => {
          setIsLongPressing(true);
          if (callbacks.onLongPress) {
            callbacks.onLongPress({ x, y });
          }
        }, longPressDelay);
      },

      onPointerUp: () => {
        clearLongPress();
      },

      onPointerCancel: () => {
        clearLongPress();
      },
    },
    {
      drag: {
        threshold: 10,
        filterTaps: true,
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 2 },
      },
    }
  );

  return { bind, isLongPressing };
}

/**
 * Simple swipe gesture hook for navigation
 */
export function useSwipeGestures(
  callbacks: SwipeGestureCallbacks,
  threshold = 50
) {
  const bind = useGesture({
    onDrag: ({ movement: [mx, my], direction: [dx, dy], last }) => {
      if (!last) return;

      const absX = Math.abs(mx);
      const absY = Math.abs(my);

      if (absX < threshold && absY < threshold) return;

      // Horizontal swipe
      if (absX > absY) {
        if (dx > 0 && callbacks.onSwipeRight) {
          callbacks.onSwipeRight();
        } else if (dx < 0 && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft();
        }
      }
      // Vertical swipe
      else {
        if (dy > 0 && callbacks.onSwipeDown) {
          callbacks.onSwipeDown();
        } else if (dy < 0 && callbacks.onSwipeUp) {
          callbacks.onSwipeUp();
        }
      }
    },
  });

  return bind;
}

/**
 * Hook for board flip gesture (two-finger rotate)
 */
export function useBoardFlipGesture(onFlip: () => void, threshold = 30) {
  const hasTriggered = useRef(false);

  const bind = useGesture({
    onPinch: ({ da: [, angle], first, memo }) => {
      if (first) {
        hasTriggered.current = false;
        return angle;
      }

      const initialAngle = memo as number;
      const rotation = angle - initialAngle;

      if (!hasTriggered.current && Math.abs(rotation) > threshold) {
        hasTriggered.current = true;
        onFlip();
      }

      return initialAngle;
    },
  });

  return bind;
}

/**
 * Hook for long press detection
 */
export function useLongPress(
  onLongPress: () => void,
  delay = 500
) {
  const [isPressed, setIsPressed] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timeout.current = setTimeout(() => {
      setIsPressed(true);
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    setIsPressed(false);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    isPressed,
  };
}
