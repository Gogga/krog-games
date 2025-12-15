/**
 * KROG Principle Detection
 *
 * Chess principles formalized as KROG obligations/permissions with detection functions.
 * These principles help explain WHY a move is good or bad, beyond just legality.
 */

import { Chess, Square as ChessSquare } from 'chess.js';
import { ModalOperator, Square, PieceType } from './types';
import { squareToCoords, coordsToSquare } from './pieces';

// Center squares for control_center principle
const CENTER_SQUARES: Square[] = ['d4', 'd5', 'e4', 'e5'];
const EXTENDED_CENTER: Square[] = ['c3', 'c4', 'c5', 'c6', 'd3', 'd6', 'e3', 'e6', 'f3', 'f4', 'f5', 'f6'];

// Starting squares for each piece type (white perspective, flip for black)
const WHITE_STARTING_SQUARES: Record<PieceType, Square[]> = {
  k: ['e1'],
  q: ['d1'],
  r: ['a1', 'h1'],
  b: ['c1', 'f1'],
  n: ['b1', 'g1'],
  p: ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2']
};

const BLACK_STARTING_SQUARES: Record<PieceType, Square[]> = {
  k: ['e8'],
  q: ['d8'],
  r: ['a8', 'h8'],
  b: ['c8', 'f8'],
  n: ['b8', 'g8'],
  p: ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7']
};

// Principle result interface
export interface PrincipleResult {
  applies: boolean;
  satisfied: boolean;
  score: number;          // -100 to +100
  explanation: {
    en: string;
    no: string;
  };
  details?: Record<string, any>;
}

// KROG Principle interface
export interface KROGPrinciple {
  code: string;
  name: {
    en: string;
    no: string;
  };
  type: ModalOperator;
  category: 'opening' | 'middlegame' | 'endgame' | 'tactical';
  weight: number;         // 0-200
  krogFormula: string;
  fideReference?: string;
  detect: (game: Chess, move?: { from: Square; to: Square }) => PrincipleResult;
}

/**
 * Count how many center squares are controlled by a color
 */
function countCenterControl(game: Chess, color: 'w' | 'b'): number {
  let control = 0;
  for (const sq of CENTER_SQUARES) {
    if (game.isAttacked(sq as ChessSquare, color)) {
      control++;
    }
    // Extra point for occupying the center
    const piece = game.get(sq as ChessSquare);
    if (piece && piece.color === color) {
      control++;
    }
  }
  return control;
}

/**
 * Count undeveloped minor pieces (knights and bishops still on starting squares)
 */
function countUndevelopedPieces(game: Chess, color: 'w' | 'b'): number {
  const startingSquares = color === 'w' ? WHITE_STARTING_SQUARES : BLACK_STARTING_SQUARES;
  let undeveloped = 0;

  // Check knights
  for (const sq of startingSquares.n) {
    const piece = game.get(sq as ChessSquare);
    if (piece && piece.type === 'n' && piece.color === color) {
      undeveloped++;
    }
  }

  // Check bishops
  for (const sq of startingSquares.b) {
    const piece = game.get(sq as ChessSquare);
    if (piece && piece.type === 'b' && piece.color === color) {
      undeveloped++;
    }
  }

  return undeveloped;
}

/**
 * Check if king has castled or castling rights
 */
function getKingSafetyScore(game: Chess, color: 'w' | 'b'): number {
  const fen = game.fen();
  const kingSquare = color === 'w' ? 'e1' : 'e8';
  const kingPiece = game.get(kingSquare as ChessSquare);

  // King has castled (not on starting square)
  if (!kingPiece || kingPiece.type !== 'k') {
    // Check if king is in a castled position
    const castledKingside = game.get((color === 'w' ? 'g1' : 'g8') as ChessSquare);
    const castledQueenside = game.get((color === 'w' ? 'c1' : 'c8') as ChessSquare);

    if (castledKingside?.type === 'k' && castledKingside.color === color) {
      return 50; // Castled kingside
    }
    if (castledQueenside?.type === 'k' && castledQueenside.color === color) {
      return 40; // Castled queenside
    }
    return 20; // King moved but didn't castle
  }

  // King still on starting square - check castling rights
  const castlingRights = fen.split(' ')[2];
  const hasKingsideRights = color === 'w' ? castlingRights.includes('K') : castlingRights.includes('k');
  const hasQueensideRights = color === 'w' ? castlingRights.includes('Q') : castlingRights.includes('q');

  if (hasKingsideRights || hasQueensideRights) {
    return 10; // Can still castle
  }

  return -20; // Lost castling rights without castling
}

/**
 * Check if a piece is being moved for the second time in the opening
 */
function isPieceMovedTwice(game: Chess, from: Square): boolean {
  const history = game.history({ verbose: true });
  if (history.length < 10) { // Only check in opening (first 10 moves)
    const piece = game.get(from as ChessSquare);
    if (!piece) return false;

    // Count how many times this piece has moved
    let moveCount = 0;
    let currentSquare = from;

    // Trace back through history
    for (let i = history.length - 1; i >= 0; i--) {
      const move = history[i];
      if (move.to === currentSquare && move.color === piece.color) {
        moveCount++;
        currentSquare = move.from as Square;
      }
    }

    return moveCount >= 1; // Already moved at least once
  }
  return false;
}

// ============================================================
// OPENING PRINCIPLES
// ============================================================

/**
 * Control the Center (O)
 * KROG: O(maximize(influence, {d4,d5,e4,e5}))
 */
export const controlCenter: KROGPrinciple = {
  code: 'control_center',
  name: {
    en: 'Control the Center',
    no: 'Kontroller sentrum'
  },
  type: 'O',
  category: 'opening',
  weight: 150,
  krogFormula: 'O(maximize(influence, {d4,d5,e4,e5}))',
  fideReference: 'General principle',

  detect: (game: Chess, move?: { from: Square; to: Square }): PrincipleResult => {
    const turn = game.turn();
    const controlBefore = countCenterControl(game, turn);

    if (!move) {
      // Position evaluation only
      const control = countCenterControl(game, turn);
      return {
        applies: true,
        satisfied: control >= 2,
        score: (control - 2) * 15,
        explanation: {
          en: control >= 2
            ? `Good center control (${control} points)`
            : `Weak center control (${control} points)`,
          no: control >= 2
            ? `God sentrumscontroll (${control} poeng)`
            : `Svak sentrumscontroll (${control} poeng)`
        },
        details: { centerControl: control }
      };
    }

    // Simulate the move
    const gameCopy = new Chess(game.fen());
    try {
      gameCopy.move({ from: move.from, to: move.to });
    } catch {
      return { applies: false, satisfied: false, score: 0, explanation: { en: '', no: '' } };
    }

    const controlAfter = countCenterControl(gameCopy, turn);
    const improvement = controlAfter - controlBefore;

    // Check if move directly involves center
    const movesToCenter = CENTER_SQUARES.includes(move.to);
    const movesFromCenter = CENTER_SQUARES.includes(move.from);

    return {
      applies: true,
      satisfied: controlAfter >= 2 || improvement > 0,
      score: improvement * 20 + (movesToCenter ? 10 : 0) - (movesFromCenter ? 5 : 0),
      explanation: {
        en: improvement > 0
          ? `Gains center control (+${improvement})`
          : improvement < 0
            ? `Loses center control (${improvement})`
            : 'Maintains center control',
        no: improvement > 0
          ? `Forbedrer sentrumscontroll (+${improvement})`
          : improvement < 0
            ? `Taper sentrumscontroll (${improvement})`
            : 'Beholder sentrumscontroll'
      },
      details: { before: controlBefore, after: controlAfter, improvement }
    };
  }
};

/**
 * Develop Pieces (O)
 * KROG: O(move_minor_piece_from_start) in opening
 */
export const developPieces: KROGPrinciple = {
  code: 'develop_pieces',
  name: {
    en: 'Develop Your Pieces',
    no: 'Utvikle brikkene'
  },
  type: 'O',
  category: 'opening',
  weight: 140,
  krogFormula: 'O(move_minor_piece_from_start) early_game',
  fideReference: 'General principle',

  detect: (game: Chess, move?: { from: Square; to: Square }): PrincipleResult => {
    const turn = game.turn();
    const undevelopedBefore = countUndevelopedPieces(game, turn);

    if (!move) {
      return {
        applies: undevelopedBefore > 0,
        satisfied: undevelopedBefore <= 1,
        score: (4 - undevelopedBefore) * 15,
        explanation: {
          en: undevelopedBefore === 0
            ? 'All minor pieces developed'
            : `${undevelopedBefore} minor piece(s) still on starting squares`,
          no: undevelopedBefore === 0
            ? 'Alle lettfigurer er utviklet'
            : `${undevelopedBefore} lettfigur(er) står fortsatt på startfeltet`
        },
        details: { undeveloped: undevelopedBefore }
      };
    }

    const piece = game.get(move.from as ChessSquare);
    if (!piece) {
      return { applies: false, satisfied: false, score: 0, explanation: { en: '', no: '' } };
    }

    const startingSquares = turn === 'w' ? WHITE_STARTING_SQUARES : BLACK_STARTING_SQUARES;
    const isDevelopingMove =
      (piece.type === 'n' || piece.type === 'b') &&
      startingSquares[piece.type].includes(move.from);

    // Simulate move
    const gameCopy = new Chess(game.fen());
    try {
      gameCopy.move({ from: move.from, to: move.to });
    } catch {
      return { applies: false, satisfied: false, score: 0, explanation: { en: '', no: '' } };
    }

    const undevelopedAfter = countUndevelopedPieces(gameCopy, turn);

    return {
      applies: true,
      satisfied: isDevelopingMove || undevelopedAfter < undevelopedBefore,
      score: isDevelopingMove ? 35 : (undevelopedBefore - undevelopedAfter) * 20,
      explanation: {
        en: isDevelopingMove
          ? `Develops ${piece.type === 'n' ? 'knight' : 'bishop'} to active square`
          : undevelopedAfter < undevelopedBefore
            ? 'Helps piece development'
            : 'Does not develop a piece',
        no: isDevelopingMove
          ? `Utvikler ${piece.type === 'n' ? 'springer' : 'løper'} til aktivt felt`
          : undevelopedAfter < undevelopedBefore
            ? 'Hjelper brikkeutviklingen'
            : 'Utvikler ikke en brikke'
      },
      details: { isDeveloping: isDevelopingMove, pieceType: piece.type }
    };
  }
};

/**
 * King Safety (O)
 * KROG: O(castle) ∨ O(protect_king)
 */
export const kingSafety: KROGPrinciple = {
  code: 'king_safety',
  name: {
    en: 'Ensure King Safety',
    no: 'Sikre kongens trygghet'
  },
  type: 'O',
  category: 'opening',
  weight: 160,
  krogFormula: 'O(castle) ∨ O(protect_king)',
  fideReference: '3.8.2',

  detect: (game: Chess, move?: { from: Square; to: Square }): PrincipleResult => {
    const turn = game.turn();
    const safetyBefore = getKingSafetyScore(game, turn);

    if (!move) {
      return {
        applies: true,
        satisfied: safetyBefore >= 30,
        score: safetyBefore,
        explanation: {
          en: safetyBefore >= 40
            ? 'King is safely castled'
            : safetyBefore >= 10
              ? 'King can still castle'
              : 'King safety is compromised',
          no: safetyBefore >= 40
            ? 'Kongen er trygt rokert'
            : safetyBefore >= 10
              ? 'Kongen kan fortsatt rokere'
              : 'Kongens sikkerhet er truet'
        },
        details: { safetyScore: safetyBefore }
      };
    }

    // Check if this is a castling move
    const piece = game.get(move.from as ChessSquare);
    const isCastling = piece?.type === 'k' &&
      Math.abs(squareToCoords(move.from).file - squareToCoords(move.to).file) === 2;

    if (isCastling) {
      const isKingside = move.to === 'g1' || move.to === 'g8';
      return {
        applies: true,
        satisfied: true,
        score: 50,
        explanation: {
          en: `Castles ${isKingside ? 'kingside' : 'queenside'} for safety`,
          no: `Rokerer ${isKingside ? 'kort' : 'langt'} for sikkerhet`
        },
        details: { castling: true, side: isKingside ? 'kingside' : 'queenside' }
      };
    }

    // Simulate move
    const gameCopy = new Chess(game.fen());
    try {
      gameCopy.move({ from: move.from, to: move.to });
    } catch {
      return { applies: false, satisfied: false, score: 0, explanation: { en: '', no: '' } };
    }

    const safetyAfter = getKingSafetyScore(gameCopy, turn);
    const improvement = safetyAfter - safetyBefore;

    return {
      applies: true,
      satisfied: safetyAfter >= 30 || improvement > 0,
      score: improvement,
      explanation: {
        en: improvement > 0
          ? 'Improves king safety'
          : improvement < 0
            ? 'Weakens king safety'
            : 'King safety unchanged',
        no: improvement > 0
          ? 'Forbedrer kongens sikkerhet'
          : improvement < 0
            ? 'Svekker kongens sikkerhet'
            : 'Kongens sikkerhet uendret'
      },
      details: { before: safetyBefore, after: safetyAfter }
    };
  }
};

/**
 * Don't Move Same Piece Twice (P)
 * KROG: ¬P(move_same_piece) unless necessary in opening
 */
export const dontMovePieceTwice: KROGPrinciple = {
  code: 'dont_move_piece_twice',
  name: {
    en: 'Avoid Moving Same Piece Twice',
    no: 'Unngå å flytte samme brikke to ganger'
  },
  type: 'P',
  category: 'opening',
  weight: 80,
  krogFormula: '¬P(move_same_piece) unless necessary',
  fideReference: 'General principle',

  detect: (game: Chess, move?: { from: Square; to: Square }): PrincipleResult => {
    const history = game.history({ verbose: true });
    const isOpening = history.length < 16; // First 8 moves per side

    if (!isOpening) {
      return {
        applies: false,
        satisfied: true,
        score: 0,
        explanation: {
          en: 'Opening phase complete',
          no: 'Åpningsfasen er fullført'
        }
      };
    }

    if (!move) {
      return {
        applies: true,
        satisfied: true,
        score: 0,
        explanation: {
          en: 'Position evaluation only',
          no: 'Kun posisjonsevaluering'
        }
      };
    }

    const isMovedTwice = isPieceMovedTwice(game, move.from);
    const piece = game.get(move.from as ChessSquare);

    if (!piece || piece.type === 'p') {
      // Pawns are exempt from this rule
      return {
        applies: false,
        satisfied: true,
        score: 0,
        explanation: {
          en: 'Pawn moves are exempt',
          no: 'Bondetrekk er unntatt'
        }
      };
    }

    return {
      applies: true,
      satisfied: !isMovedTwice,
      score: isMovedTwice ? -25 : 10,
      explanation: {
        en: isMovedTwice
          ? 'Moving same piece twice in opening (time loss)'
          : 'First move with this piece',
        no: isMovedTwice
          ? 'Flytter samme brikke to ganger i åpningen (tidstap)'
          : 'Første trekk med denne brikken'
      },
      details: { isMovedTwice, pieceType: piece.type }
    };
  }
};

// ============================================================
// EXPORTS
// ============================================================

// All opening principles
export const OPENING_PRINCIPLES: KROGPrinciple[] = [
  controlCenter,
  developPieces,
  kingSafety,
  dontMovePieceTwice
];

// Get all applicable principles for a position
export function getApplicablePrinciples(game: Chess): KROGPrinciple[] {
  const history = game.history();
  const moveCount = history.length;

  // Determine game phase
  if (moveCount < 16) {
    return OPENING_PRINCIPLES;
  }

  // TODO: Add middlegame and endgame principles later
  return OPENING_PRINCIPLES;
}

// Evaluate all applicable principles for a move
export function evaluatePrinciples(
  game: Chess,
  move: { from: Square; to: Square }
): { results: Map<string, PrincipleResult>; totalScore: number } {
  const principles = getApplicablePrinciples(game);
  const results = new Map<string, PrincipleResult>();
  let totalScore = 0;

  for (const principle of principles) {
    const result = principle.detect(game, move);
    results.set(principle.code, result);
    if (result.applies) {
      totalScore += result.score * (principle.weight / 100);
    }
  }

  return { results, totalScore };
}

// Evaluate position without a specific move
export function evaluatePositionPrinciples(game: Chess): {
  results: Map<string, PrincipleResult>;
  totalScore: number;
  satisfiedPrinciples: string[];
  violatedPrinciples: string[];
} {
  const principles = getApplicablePrinciples(game);
  const results = new Map<string, PrincipleResult>();
  const satisfiedPrinciples: string[] = [];
  const violatedPrinciples: string[] = [];
  let totalScore = 0;

  for (const principle of principles) {
    const result = principle.detect(game);
    results.set(principle.code, result);
    if (result.applies) {
      totalScore += result.score * (principle.weight / 100);
      if (result.satisfied) {
        satisfiedPrinciples.push(principle.code);
      } else if (principle.type === 'O') {
        violatedPrinciples.push(principle.code);
      }
    }
  }

  return { results, totalScore, satisfiedPrinciples, violatedPrinciples };
}
