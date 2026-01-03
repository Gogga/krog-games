import React from 'react';
import { formatEvaluation } from '../utils/stockfish';

interface EvaluationBarProps {
  /** Evaluation in centipawns from white's perspective */
  evaluation: number;
  /** Mate in N moves (positive = white wins) */
  mate?: number;
  /** Height of the bar (matches board height for vertical, bar height for horizontal) */
  height: number;
  /** Whether to flip for black's perspective */
  flipped?: boolean;
  /** Horizontal mode for mobile */
  horizontal?: boolean;
}

/**
 * Evaluation bar showing who's winning
 *
 * Vertical: White portion on top, black on bottom
 * Horizontal: White on left, black on right
 * Center = equal position (0.0)
 * Scale: ±5 pawns fills bar, beyond clips
 */
const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation,
  mate,
  height,
  flipped = false,
  horizontal = false
}) => {
  // Calculate white's portion of the bar (0-100%)
  let whitePercent: number;

  if (mate !== undefined) {
    // Mate found - show decisive advantage
    whitePercent = mate > 0 ? 95 : 5;
  } else {
    // Convert centipawns to percentage
    // ±500cp (5 pawns) = full bar
    const clampedEval = Math.max(-500, Math.min(500, evaluation));
    // Map -500..+500 to 5%..95% (keeping some margin)
    whitePercent = 50 + (clampedEval / 500) * 45;
  }

  // Flip if viewing from black's perspective
  if (flipped) {
    whitePercent = 100 - whitePercent;
  }

  const evalText = formatEvaluation(evaluation, mate);
  const isWhiteWinning = mate !== undefined ? mate > 0 : evaluation > 0;

  // Horizontal mode for mobile
  if (horizontal) {
    return (
      <div
        style={{
          width: '100%',
          height: height,
          display: 'flex',
          flexDirection: 'row',
          borderRadius: '0',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#1a1a1a'
        }}
      >
        {/* White portion (left) */}
        <div
          style={{
            height: '100%',
            width: `${whitePercent}%`,
            backgroundColor: '#e8e8e8',
            transition: 'width 0.3s ease-out',
            background: 'linear-gradient(to right, #ffffff, #d0d0d0)'
          }}
        />

        {/* Black portion (right) */}
        <div
          style={{
            height: '100%',
            flex: 1,
            backgroundColor: '#2a2a2a',
            background: 'linear-gradient(to right, #3a3a3a, #1a1a1a)'
          }}
        />

        {/* Center line indicator (equal position) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#81b64c',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 4px rgba(129, 182, 76, 0.5)'
          }}
        />

        {/* Score display - centered */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: isWhiteWinning ? '#333' : '#fff',
            backgroundColor: isWhiteWinning ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.8)',
            padding: '4px 10px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          {evalText}
        </div>
      </div>
    );
  }

  // Vertical mode (default)
  return (
    <div
      style={{
        width: '28px',
        minHeight: '200px',
        height: height,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '2px solid #555',
        position: 'relative',
        backgroundColor: '#1a1a1a',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}
    >
      {/* White portion (top) */}
      <div
        style={{
          width: '100%',
          height: `${whitePercent}%`,
          backgroundColor: '#e8e8e8',
          transition: 'height 0.3s ease-out',
          background: 'linear-gradient(to bottom, #ffffff, #d0d0d0)'
        }}
      />

      {/* Black portion (bottom) */}
      <div
        style={{
          width: '100%',
          flex: 1,
          backgroundColor: '#2a2a2a',
          background: 'linear-gradient(to bottom, #3a3a3a, #1a1a1a)'
        }}
      />

      {/* Center line indicator (equal position) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: '#81b64c',
          transform: 'translateY(-50%)',
          boxShadow: '0 0 4px rgba(129, 182, 76, 0.5)'
        }}
      />

      {/* Score display - positioned in the winning side */}
      <div
        style={{
          position: 'absolute',
          top: isWhiteWinning ? '50%' : 'auto',
          bottom: isWhiteWinning ? 'auto' : '50%',
          left: '50%',
          transform: isWhiteWinning
            ? 'translate(-50%, -150%)'
            : 'translate(-50%, 150%)',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          color: isWhiteWinning ? '#333' : '#fff',
          backgroundColor: isWhiteWinning ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
          padding: '2px 4px',
          borderRadius: '3px',
          whiteSpace: 'nowrap'
        }}
      >
        {evalText}
      </div>
    </div>
  );
};

export default EvaluationBar;
