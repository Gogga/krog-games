/**
 * Gesture help overlay for first-time mobile users
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'krog-gesture-help-seen';

interface GestureHelpProps {
  onDismiss?: () => void;
}

export function GestureHelp({ onDismiss }: GestureHelpProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Check if user has seen the help before
    const hasSeenHelp = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenHelp) {
      // Small delay to let the app render first
      const timer = setTimeout(() => setShowHelp(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowHelp(false);
    onDismiss?.();
  };

  if (!showHelp) return null;

  return (
    <div className="gesture-help-overlay" onClick={handleDismiss}>
      <div className="gesture-help-content" onClick={(e) => e.stopPropagation()}>
        <h2>Touch Gestures</h2>

        <div className="gesture-list">
          <div className="gesture-item">
            <span className="gesture-icon">👆</span>
            <div className="gesture-info">
              <strong>Tap</strong>
              <p>Select and move pieces</p>
            </div>
          </div>

          <div className="gesture-item">
            <span className="gesture-icon">👆💫</span>
            <div className="gesture-info">
              <strong>Long Press</strong>
              <p>View piece information</p>
            </div>
          </div>

          <div className="gesture-item">
            <span className="gesture-icon">👈👉</span>
            <div className="gesture-info">
              <strong>Swipe Left/Right</strong>
              <p>Navigate move history</p>
            </div>
          </div>

          <div className="gesture-item">
            <span className="gesture-icon">🔄</span>
            <div className="gesture-info">
              <strong>Two-Finger Rotate</strong>
              <p>Flip board orientation</p>
            </div>
          </div>

          <div className="gesture-item">
            <span className="gesture-icon">⬇️</span>
            <div className="gesture-info">
              <strong>Pull Down</strong>
              <p>Refresh daily puzzle</p>
            </div>
          </div>
        </div>

        <button className="gesture-help-dismiss" onClick={handleDismiss}>
          Got it!
        </button>
      </div>
    </div>
  );
}

/**
 * Reset gesture help (for testing or settings)
 */
export function resetGestureHelp() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if gesture help has been seen
 */
export function hasSeenGestureHelp(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export default GestureHelp;
