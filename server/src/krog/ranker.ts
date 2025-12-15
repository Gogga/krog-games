/**
 * KROG Move Ranker
 *
 * Ranks all legal moves and generates suggestions with explanations.
 */

import { Chess } from 'chess.js';
import { Square } from './types';
import { scoreAllMoves, MoveScore, ScoringContext, explainScore } from './scorer';

// Move classification
export type MoveClassification = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

// Move suggestion with full details
export interface MoveSuggestion {
  move: string;           // SAN notation
  from: Square;
  to: Square;
  score: number;          // 0-1 combined score
  rank: number;           // 1 = best
  classification: MoveClassification;
  isBookMove: boolean;
  bookStats?: {
    white: number;        // win %
    draw: number;         // draw %
    black: number;        // loss %
  };
  principlesSatisfied: string[];
  tacticalPatterns: string[];
  explanation: {
    en: string;
    no: string;
  };
}

// Suggestions response
export interface SuggestionsResponse {
  suggestions: MoveSuggestion[];
  bestMove: string;
  totalLegalMoves: number;
  context: ScoringContext;
}

/**
 * Classify a move based on score difference from best
 */
export function classifyMove(scoreDifference: number): MoveClassification {
  if (scoreDifference < 0.02) return 'best';
  if (scoreDifference < 0.05) return 'excellent';
  if (scoreDifference < 0.10) return 'good';
  if (scoreDifference < 0.20) return 'inaccuracy';
  if (scoreDifference < 0.35) return 'mistake';
  return 'blunder';
}

/**
 * Generate human-readable explanation for a suggestion
 */
function generateSuggestionExplanation(
  score: MoveScore,
  rank: number,
  classification: MoveClassification
): { en: string; no: string } {
  const partsEn: string[] = [];
  const partsNo: string[] = [];

  // Classification comment
  if (rank === 1) {
    partsEn.push('Best move.');
    partsNo.push('Beste trekk.');
  } else if (classification === 'excellent') {
    partsEn.push('Excellent alternative.');
    partsNo.push('Utmerket alternativ.');
  } else if (classification === 'good') {
    partsEn.push('Good option.');
    partsNo.push('Godt valg.');
  }

  // Book info
  if (score.bookData) {
    const winPct = Math.round(score.bookData.winRate * 100);
    if (score.bookData.isMainLine) {
      partsEn.push(`Main line theory (${winPct}% win rate).`);
      partsNo.push(`Hovedlinjeteori (${winPct}% vinnrate).`);
    } else {
      partsEn.push(`Book move: ${score.bookData.openingName.en}.`);
      partsNo.push(`Boktrekk: ${score.bookData.openingName.no}.`);
    }
  }

  // Principles
  const satisfied = score.krogAnalysis.satisfiedPrinciples;
  if (satisfied.length > 0) {
    const principleNames: Record<string, { en: string; no: string }> = {
      control_center: { en: 'controls center', no: 'kontrollerer sentrum' },
      develop_pieces: { en: 'develops piece', no: 'utvikler brikke' },
      king_safety: { en: 'improves king safety', no: 'forbedrer kongesikkerhet' },
      dont_move_piece_twice: { en: 'new piece', no: 'ny brikke' }
    };

    const principleDescEn = satisfied
      .slice(0, 2)
      .map(p => principleNames[p]?.en || p)
      .join(', ');
    const principleDescNo = satisfied
      .slice(0, 2)
      .map(p => principleNames[p]?.no || p)
      .join(', ');

    if (principleDescEn) {
      partsEn.push(`${principleDescEn.charAt(0).toUpperCase()}${principleDescEn.slice(1)}.`);
      partsNo.push(`${principleDescNo.charAt(0).toUpperCase()}${principleDescNo.slice(1)}.`);
    }
  }

  // Tactics
  const tactics = score.krogAnalysis.tacticalPatterns;
  if (tactics.length > 0) {
    partsEn.push(tactics[0].explanation.en);
    partsNo.push(tactics[0].explanation.no);
  }

  // Fallback
  if (partsEn.length === 0) {
    partsEn.push('Solid move.');
    partsNo.push('Solid trekk.');
  }

  return {
    en: partsEn.join(' '),
    no: partsNo.join(' ')
  };
}

/**
 * Convert MoveScore to MoveSuggestion
 */
function toSuggestion(
  score: MoveScore,
  rank: number,
  bestScore: number
): MoveSuggestion {
  const scoreDiff = bestScore - score.totalScore;
  const classification = classifyMove(scoreDiff);

  return {
    move: score.move,
    from: score.from,
    to: score.to,
    score: score.totalScore,
    rank,
    classification,
    isBookMove: !!score.bookData,
    bookStats: score.bookData ? {
      white: Math.round(score.bookData.winRate * 100),
      draw: 0, // Would need to pass through from book data
      black: Math.round((1 - score.bookData.winRate) * 100)
    } : undefined,
    principlesSatisfied: score.krogAnalysis.satisfiedPrinciples,
    tacticalPatterns: score.krogAnalysis.tacticalPatterns.map(t => t.pattern),
    explanation: generateSuggestionExplanation(score, rank, classification)
  };
}

/**
 * Get ranked move suggestions
 */
export function suggestMoves(
  game: Chess,
  context: ScoringContext = 'learning',
  limit: number = 5
): SuggestionsResponse {
  const scores = scoreAllMoves(game, context);

  if (scores.length === 0) {
    return {
      suggestions: [],
      bestMove: '',
      totalLegalMoves: 0,
      context
    };
  }

  const bestScore = scores[0].totalScore;
  const suggestions: MoveSuggestion[] = [];

  for (let i = 0; i < Math.min(limit, scores.length); i++) {
    const suggestion = toSuggestion(scores[i], i + 1, bestScore);
    suggestions.push(suggestion);
  }

  return {
    suggestions,
    bestMove: scores[0].move,
    totalLegalMoves: scores.length,
    context
  };
}

/**
 * Get quick suggestions (just moves + scores, no full analysis)
 */
export function quickSuggestMoves(
  game: Chess,
  limit: number = 3
): Array<{ move: string; score: number; isBook: boolean }> {
  const scores = scoreAllMoves(game, 'learning');

  return scores.slice(0, limit).map(s => ({
    move: s.move,
    score: s.totalScore,
    isBook: !!s.bookData
  }));
}

/**
 * Evaluate a played move against suggestions
 */
export function evaluatePlayedMove(
  game: Chess,
  playedMove: { from: Square; to: Square },
  context: ScoringContext = 'learning'
): {
  played: MoveSuggestion;
  wasInTop: number | null;  // null if not in top 5
  bestAlternative: MoveSuggestion | null;
  scoreLoss: number;
} {
  const { suggestions, bestMove } = suggestMoves(game, context, 10);

  // Find played move in suggestions
  const playedIndex = suggestions.findIndex(
    s => s.from === playedMove.from && s.to === playedMove.to
  );

  let played: MoveSuggestion;
  if (playedIndex >= 0) {
    played = suggestions[playedIndex];
  } else {
    // Move wasn't in top 10, calculate it separately
    const scores = scoreAllMoves(game, context);
    const playedScore = scores.find(
      s => s.from === playedMove.from && s.to === playedMove.to
    );

    if (!playedScore) {
      throw new Error('Invalid move');
    }

    played = toSuggestion(playedScore, scores.length, scores[0].totalScore);
  }

  const wasInTop = playedIndex >= 0 && playedIndex < 5 ? playedIndex + 1 : null;
  const bestAlternative = played.rank === 1 ? null : suggestions[0];
  const scoreLoss = bestAlternative
    ? bestAlternative.score - played.score
    : 0;

  return {
    played,
    wasInTop,
    bestAlternative,
    scoreLoss
  };
}

/**
 * Get teaching feedback for a move
 */
export function getTeachingFeedback(
  game: Chess,
  playedMove: { from: Square; to: Square },
  language: 'en' | 'no' = 'en'
): {
  classification: MoveClassification;
  feedback: string;
  betterMoves: string[];
  principles: {
    satisfied: string[];
    violated: string[];
  };
} {
  const evaluation = evaluatePlayedMove(game, playedMove, 'learning');
  const { played, bestAlternative, wasInTop } = evaluation;

  let feedback: string;

  if (played.classification === 'best') {
    feedback = language === 'en'
      ? 'Excellent! This is the best move.'
      : 'Utmerket! Dette er det beste trekket.';
  } else if (played.classification === 'excellent') {
    feedback = language === 'en'
      ? 'Very good move! Almost as good as the best.'
      : 'Veldig godt trekk! Nesten like bra som det beste.';
  } else if (played.classification === 'good') {
    feedback = language === 'en'
      ? `Good move. ${bestAlternative?.move} was slightly better.`
      : `Godt trekk. ${bestAlternative?.move} var litt bedre.`;
  } else if (played.classification === 'inaccuracy') {
    feedback = language === 'en'
      ? `Inaccuracy. ${bestAlternative?.move} was better because ${bestAlternative?.explanation.en.toLowerCase()}`
      : `Unøyaktighet. ${bestAlternative?.move} var bedre fordi ${bestAlternative?.explanation.no.toLowerCase()}`;
  } else if (played.classification === 'mistake') {
    feedback = language === 'en'
      ? `Mistake! Consider ${bestAlternative?.move} next time.`
      : `Feil! Vurder ${bestAlternative?.move} neste gang.`;
  } else {
    feedback = language === 'en'
      ? `Blunder! ${bestAlternative?.move} was much better.`
      : `Bukk! ${bestAlternative?.move} var mye bedre.`;
  }

  // Get better moves (up to 3)
  const { suggestions } = suggestMoves(game, 'learning', 3);
  const betterMoves = suggestions
    .filter(s => s.score > played.score)
    .map(s => s.move);

  return {
    classification: played.classification,
    feedback,
    betterMoves,
    principles: {
      satisfied: played.principlesSatisfied,
      violated: [] // TODO: Add violated principles
    }
  };
}
