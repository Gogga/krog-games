/**
 * KROG Position Evaluator
 *
 * Evaluates positions using KROG principles and determines game phase.
 */

import { Chess, Square as ChessSquare, PieceSymbol } from 'chess.js';
import { Square } from './types';
import { evaluatePositionPrinciples, OPENING_PRINCIPLES, KROGPrinciple } from './principles';
import { getCurrentTactics, TacticalResult } from './tactics';

// Game phase type
export type GamePhase = 'opening' | 'middlegame' | 'endgame';

// Position evaluation result
export interface PositionEvaluation {
  fen: string;
  phase: GamePhase;
  sideToMove: 'white' | 'black';

  // Material count
  material: {
    white: number;
    black: number;
    balance: number;  // Positive = white ahead
  };

  // KROG principle evaluation
  principles: {
    satisfied: string[];
    violated: string[];
    score: number;
  };

  // Current tactical patterns
  tactics: TacticalResult[];

  // Overall KROG score
  krogScore: number;

  // Explanation
  explanation: {
    en: string;
    no: string;
  };
}

// Piece values for material counting
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0  // King doesn't count for material
};

/**
 * Count material for both sides
 */
function countMaterial(game: Chess): { white: number; black: number; balance: number } {
  let white = 0;
  let black = 0;

  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const sq = `${String.fromCharCode('a'.charCodeAt(0) + file)}${rank + 1}` as ChessSquare;
      const piece = game.get(sq);
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        if (piece.color === 'w') {
          white += value;
        } else {
          black += value;
        }
      }
    }
  }

  return { white, black, balance: white - black };
}

/**
 * Count total pieces on the board (excluding pawns and kings)
 */
function countPieces(game: Chess): number {
  let count = 0;
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const sq = `${String.fromCharCode('a'.charCodeAt(0) + file)}${rank + 1}` as ChessSquare;
      const piece = game.get(sq);
      if (piece && piece.type !== 'p' && piece.type !== 'k') {
        count++;
      }
    }
  }
  return count;
}

/**
 * Determine game phase based on move count and material
 */
export function determinePhase(game: Chess): GamePhase {
  const moveCount = game.history().length;
  const pieceCount = countPieces(game);
  const material = countMaterial(game);
  const totalMaterial = material.white + material.black;

  // Opening: first ~10-12 moves (20-24 half-moves)
  if (moveCount < 16) {
    return 'opening';
  }

  // Endgame: low material (queens traded, few pieces)
  // Roughly: no queens and total material <= 26 (starting is 78)
  // Or total pieces <= 4 (excluding pawns and kings)
  const hasWhiteQueen = game.board().flat().some(p => p?.type === 'q' && p.color === 'w');
  const hasBlackQueen = game.board().flat().some(p => p?.type === 'q' && p.color === 'b');

  if ((!hasWhiteQueen && !hasBlackQueen) || totalMaterial <= 14 || pieceCount <= 4) {
    return 'endgame';
  }

  // Otherwise middlegame
  return 'middlegame';
}

/**
 * Generate position summary explanation
 */
function generateExplanation(
  phase: GamePhase,
  material: { white: number; black: number; balance: number },
  principleScore: number,
  tactics: TacticalResult[],
  sideToMove: 'w' | 'b'
): { en: string; no: string } {
  const parts: { en: string[]; no: string[] } = { en: [], no: [] };

  // Phase
  const phaseNames = {
    opening: { en: 'Opening', no: 'Åpning' },
    middlegame: { en: 'Middlegame', no: 'Mellomspill' },
    endgame: { en: 'Endgame', no: 'Sluttspill' }
  };
  parts.en.push(`${phaseNames[phase].en} position.`);
  parts.no.push(`${phaseNames[phase].no}posisjon.`);

  // Material
  if (material.balance > 2) {
    parts.en.push('White has material advantage.');
    parts.no.push('Hvit har materiell fordel.');
  } else if (material.balance < -2) {
    parts.en.push('Black has material advantage.');
    parts.no.push('Svart har materiell fordel.');
  } else {
    parts.en.push('Material is balanced.');
    parts.no.push('Materiell er balansert.');
  }

  // Tactics
  if (tactics.length > 0) {
    const tacticType = tactics[0].pattern;
    if (tacticType === 'fork') {
      parts.en.push('Fork threat present!');
      parts.no.push('Gaffeltrussel til stede!');
    } else if (tacticType.includes('pin')) {
      parts.en.push('Pin active on the board.');
      parts.no.push('Binding er aktiv på brettet.');
    }
  }

  // Principle score
  if (principleScore > 30) {
    parts.en.push(sideToMove === 'w' ? 'White has good position.' : 'Black has good position.');
    parts.no.push(sideToMove === 'w' ? 'Hvit har god posisjon.' : 'Svart har god posisjon.');
  } else if (principleScore < -30) {
    parts.en.push(sideToMove === 'w' ? 'White\'s position needs improvement.' : 'Black\'s position needs improvement.');
    parts.no.push(sideToMove === 'w' ? 'Hvits posisjon trenger forbedring.' : 'Svarts posisjon trenger forbedring.');
  }

  return {
    en: parts.en.join(' '),
    no: parts.no.join(' ')
  };
}

/**
 * Evaluate a position comprehensively
 */
export function evaluatePosition(game: Chess): PositionEvaluation {
  const fen = game.fen();
  const turn = game.turn();
  const sideToMove = turn === 'w' ? 'white' : 'black';

  // Determine game phase
  const phase = determinePhase(game);

  // Count material
  const material = countMaterial(game);

  // Evaluate principles
  const principleEval = evaluatePositionPrinciples(game);

  // Get current tactics
  const tactics = getCurrentTactics(game);

  // Calculate overall KROG score
  // Principle score + tactical bonus
  const tacticalBonus = tactics.reduce((sum, t) => sum + t.score, 0);
  const krogScore = principleEval.totalScore + tacticalBonus;

  // Generate explanation
  const explanation = generateExplanation(
    phase,
    material,
    principleEval.totalScore,
    tactics,
    turn
  );

  return {
    fen,
    phase,
    sideToMove,
    material,
    principles: {
      satisfied: principleEval.satisfiedPrinciples,
      violated: principleEval.violatedPrinciples,
      score: principleEval.totalScore
    },
    tactics,
    krogScore,
    explanation
  };
}

/**
 * Get quick phase check without full evaluation
 */
export function getGamePhase(game: Chess): GamePhase {
  return determinePhase(game);
}

/**
 * Check if position is in opening book territory
 */
export function isOpeningPhase(game: Chess): boolean {
  return determinePhase(game) === 'opening';
}

/**
 * Get material difference from side to move's perspective
 */
export function getMaterialAdvantage(game: Chess): number {
  const material = countMaterial(game);
  return game.turn() === 'w' ? material.balance : -material.balance;
}
