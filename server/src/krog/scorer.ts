/**
 * KROG Combined Scoring Algorithm
 *
 * Combines statistics, engine evaluation, and KROG analysis into a single score.
 * Formula: Score = α·Stats + β·Engine + γ·KROG
 */

import { Chess } from 'chess.js';
import { Square } from './types';
import { analyzeMove, KROGMoveAnalysis } from './analyzer';
import { getBookMoves, isBookMove, BookMove, getBookMoveWinRate } from './openingBook';
import { GamePhase, determinePhase } from './evaluator';

// Scoring context types
export type ScoringContext = 'learning' | 'competitive' | 'analysis' | 'opening' | 'endgame';

// Weight configuration for different contexts
export interface ScoringWeights {
  statistical: number;  // α
  engine: number;       // β
  krog: number;         // γ
}

// Weight presets by context
const WEIGHT_PRESETS: Record<ScoringContext, ScoringWeights> = {
  // For learning/teaching - KROG explanations matter most
  learning: { statistical: 0.2, engine: 0.3, krog: 0.5 },

  // For competitive play - engine accuracy matters most
  competitive: { statistical: 0.2, engine: 0.6, krog: 0.2 },

  // For analysis - balanced
  analysis: { statistical: 0.33, engine: 0.34, krog: 0.33 },

  // Opening phase - statistics matter most (theory)
  opening: { statistical: 0.5, engine: 0.25, krog: 0.25 },

  // Endgame - engine precision matters most
  endgame: { statistical: 0.15, engine: 0.65, krog: 0.2 }
};

// Individual score components
export interface ScoreComponents {
  statistical: number;  // 0-1, from book/statistics
  engine: number;       // 0-1, from engine eval (stubbed)
  krog: number;         // 0-1, from KROG analysis
}

// Full move score
export interface MoveScore {
  move: string;
  from: Square;
  to: Square;

  // Component scores (all normalized 0-1)
  components: ScoreComponents;

  // Combined score
  totalScore: number;

  // Confidence (how reliable is this score)
  confidence: number;

  // Book data if available
  bookData?: {
    openingName: { en: string; no: string };
    eco: string;
    winRate: number;
    isMainLine: boolean;
  };

  // KROG analysis
  krogAnalysis: KROGMoveAnalysis;
}

/**
 * Stub engine evaluation (returns neutral 0.5)
 * In a full implementation, this would call Stockfish
 */
function getEngineScore(game: Chess, from: Square, to: Square): number {
  // For MVP: return neutral score
  // TODO: Replace with actual Stockfish evaluation
  return 0.5;
}

/**
 * Normalize KROG score from range ~[-200, +200] to [0, 1]
 */
function normalizeKrogScore(krogScore: number): number {
  // Clamp to expected range
  const clamped = Math.max(-200, Math.min(200, krogScore));
  // Map to 0-1
  return (clamped + 200) / 400;
}

/**
 * Normalize statistical score with Bayesian adjustment
 */
function normalizeStatisticalScore(
  winRate: number,
  sampleSize: number,
  priorWinRate: number = 0.5,
  priorStrength: number = 10
): number {
  // Bayesian average: (prior * strength + observed * n) / (strength + n)
  const adjusted = (priorWinRate * priorStrength + winRate * sampleSize) / (priorStrength + sampleSize);
  return adjusted;
}

/**
 * Calculate confidence based on available data
 */
function calculateConfidence(
  hasBookData: boolean,
  bookSampleSize: number,
  hasEngineEval: boolean, // Always false in MVP
  engineDepth: number
): number {
  let confidence = 0.3; // Base confidence from KROG analysis

  // Book data confidence (max 0.4)
  if (hasBookData) {
    confidence += Math.min(0.4, bookSampleSize / 250);
  }

  // Engine confidence (max 0.3) - stubbed for MVP
  if (hasEngineEval) {
    confidence += Math.min(0.3, engineDepth / 30);
  }

  return Math.min(1, confidence);
}

/**
 * Get appropriate weights based on context and game phase
 */
export function getWeights(context: ScoringContext, phase?: GamePhase): ScoringWeights {
  // Use phase-specific weights if in opening/endgame
  if (phase === 'opening' && context !== 'competitive') {
    return WEIGHT_PRESETS.opening;
  }
  if (phase === 'endgame' && context !== 'learning') {
    return WEIGHT_PRESETS.endgame;
  }

  return WEIGHT_PRESETS[context];
}

/**
 * Calculate combined score for a move
 */
export function calculateMoveScore(
  game: Chess,
  from: Square,
  to: Square,
  context: ScoringContext = 'learning'
): MoveScore {
  const phase = determinePhase(game);
  const weights = getWeights(context, phase);
  const turn = game.turn();

  // Get KROG analysis
  const krogAnalysis = analyzeMove(game, from, to);

  // Get book data if available
  const bookMoves = getBookMoves(game);
  const bookMove = bookMoves.find(bm => bm.from === from && bm.to === to);

  // Calculate component scores
  let statisticalScore = 0.5; // Default neutral
  let sampleSize = 0;

  if (bookMove) {
    statisticalScore = getBookMoveWinRate(bookMove, turn);
    sampleSize = bookMove.statistics.total;
  }

  const adjustedStatScore = normalizeStatisticalScore(statisticalScore, sampleSize);
  const engineScore = getEngineScore(game, from, to);
  const krogScore = normalizeKrogScore(krogAnalysis.totalKrogScore);

  // Combined score using weights
  const totalScore =
    weights.statistical * adjustedStatScore +
    weights.engine * engineScore +
    weights.krog * krogScore;

  // Calculate confidence
  const confidence = calculateConfidence(
    !!bookMove,
    sampleSize,
    false, // Engine not available in MVP
    0
  );

  return {
    move: krogAnalysis.move,
    from,
    to,
    components: {
      statistical: adjustedStatScore,
      engine: engineScore,
      krog: krogScore
    },
    totalScore,
    confidence,
    bookData: bookMove ? {
      openingName: bookMove.openingName,
      eco: bookMove.eco,
      winRate: statisticalScore,
      isMainLine: bookMove.isMainLine
    } : undefined,
    krogAnalysis
  };
}

/**
 * Calculate scores for all legal moves
 */
export function scoreAllMoves(
  game: Chess,
  context: ScoringContext = 'learning'
): MoveScore[] {
  const moves = game.moves({ verbose: true });
  const scores: MoveScore[] = [];

  for (const move of moves) {
    try {
      const score = calculateMoveScore(
        game,
        move.from as Square,
        move.to as Square,
        context
      );
      scores.push(score);
    } catch {
      // Skip moves that fail analysis
    }
  }

  // Sort by total score descending
  scores.sort((a, b) => b.totalScore - a.totalScore);

  return scores;
}

/**
 * Get the best move according to combined scoring
 */
export function getBestMove(
  game: Chess,
  context: ScoringContext = 'learning'
): MoveScore | null {
  const scores = scoreAllMoves(game, context);
  return scores.length > 0 ? scores[0] : null;
}

/**
 * Compare a move's score to the best move
 */
export function getMoveQuality(
  game: Chess,
  from: Square,
  to: Square,
  context: ScoringContext = 'learning'
): {
  score: MoveScore;
  bestScore: number;
  difference: number;
  percentile: number;
} {
  const allScores = scoreAllMoves(game, context);
  const moveScore = calculateMoveScore(game, from, to, context);

  const bestScore = allScores.length > 0 ? allScores[0].totalScore : moveScore.totalScore;
  const difference = bestScore - moveScore.totalScore;

  // Calculate percentile (what % of moves is this better than)
  const betterCount = allScores.filter(s => moveScore.totalScore >= s.totalScore).length;
  const percentile = allScores.length > 0 ? (betterCount / allScores.length) * 100 : 50;

  return {
    score: moveScore,
    bestScore,
    difference,
    percentile
  };
}

/**
 * Get score breakdown explanation
 */
export function explainScore(score: MoveScore, language: 'en' | 'no' = 'en'): string {
  const parts: string[] = [];

  // Total score
  const pct = Math.round(score.totalScore * 100);
  if (language === 'en') {
    parts.push(`Score: ${pct}%`);
  } else {
    parts.push(`Poeng: ${pct}%`);
  }

  // Book data
  if (score.bookData) {
    const winPct = Math.round(score.bookData.winRate * 100);
    if (language === 'en') {
      parts.push(`Book move (${winPct}% win rate)`);
    } else {
      parts.push(`Boktrekk (${winPct}% vinnrate)`);
    }
  }

  // KROG contribution
  const krogPct = Math.round(score.components.krog * 100);
  if (score.krogAnalysis.satisfiedPrinciples.length > 0) {
    const principles = score.krogAnalysis.satisfiedPrinciples.slice(0, 2).join(', ');
    if (language === 'en') {
      parts.push(`Satisfies: ${principles}`);
    } else {
      parts.push(`Tilfredsstiller: ${principles}`);
    }
  }

  // Tactics
  if (score.krogAnalysis.tacticalPatterns.length > 0) {
    const tactic = score.krogAnalysis.tacticalPatterns[0];
    parts.push(tactic.explanation[language]);
  }

  return parts.join('. ');
}
