/**
 * KROG Move Explainer
 *
 * Generates human-readable explanations for chess moves with KROG formulas
 * and FIDE rule references in English and Norwegian.
 */

import { Chess, Square as ChessSquare, Move } from 'chess.js';
import {
  Square,
  PieceType,
  MoveType,
  MoveExplanation,
  IllegalMoveExplanation,
  IllegalMoveReason,
  FIDE_ARTICLES,
  FIDE_SPECIAL
} from './types';
import {
  MOVEMENT_CHECKERS,
  generateKROGFormula,
  getPieceName,
  squareToCoords,
  isPathClear,
  isDiagonal,
  isRankOrFile,
  isLShape,
  isAdjacent
} from './pieces';
import {
  checkCastlingConditions,
  getCastlingFormula,
  checkEnPassantConditions,
  getEnPassantFormula,
  checkPromotionConditions,
  getPromotionFormula,
  detectSpecialMove
} from './special';

/**
 * Explain why a move is legal
 */
export function explainLegalMove(
  game: Chess,
  move: Move
): MoveExplanation {
  const from = move.from as Square;
  const to = move.to as Square;
  const pieceType = move.piece as PieceType;

  // Detect move type
  let moveType: MoveType = 'normal';
  if (move.flags.includes('k')) moveType = 'castle_kingside';
  else if (move.flags.includes('q')) moveType = 'castle_queenside';
  else if (move.flags.includes('e')) moveType = 'en_passant';
  else if (move.flags.includes('p')) moveType = 'promotion';
  else if (move.flags.includes('b')) moveType = 'double_pawn_push';
  else if (move.flags.includes('c') || move.flags.includes('x')) moveType = 'capture';

  // Get conditions based on move type
  let conditions: { name: string; met: boolean; description: string }[] = [];
  let fide = FIDE_ARTICLES[pieceType];

  if (moveType === 'castle_kingside' || moveType === 'castle_queenside') {
    const side = moveType === 'castle_kingside' ? 'kingside' : 'queenside';
    const result = checkCastlingConditions(game, move.color, side);
    conditions = result.conditions;
    fide = FIDE_SPECIAL.castling;
  } else if (moveType === 'en_passant') {
    const result = checkEnPassantConditions(game, from, to);
    conditions = result.conditions;
    fide = FIDE_SPECIAL.en_passant;
  } else if (moveType === 'promotion') {
    const result = checkPromotionConditions(game, from, to, move.promotion);
    conditions = result.conditions;
    fide = FIDE_SPECIAL.promotion;
  } else {
    // Regular piece movement
    const checker = MOVEMENT_CHECKERS[pieceType];
    if (checker) {
      const result = checker(game, from, to);
      conditions = result.conditions;
    }
  }

  // Generate KROG formula
  const krog = generateKROGFormula(
    pieceType,
    from,
    to,
    conditions.map(c => ({ name: c.name, met: c.met }))
  );

  // Generate explanations
  const pieceName = {
    en: getPieceName(pieceType, 'en'),
    no: getPieceName(pieceType, 'no')
  };

  const explanation = generateExplanationText(
    pieceName,
    from,
    to,
    moveType,
    conditions
  );

  return {
    move: move.san,
    from,
    to,
    pieceType,
    moveType,
    isLegal: true,
    krog: {
      formula: krog.formula,
      operator: krog.operator,
      tType: 'T1' // Player has discretion
    },
    fide,
    explanation,
    conditions
  };
}

/**
 * Explain why a move is illegal
 */
export function explainIllegalMove(
  game: Chess,
  from: Square,
  to: Square,
  promotion?: string
): IllegalMoveExplanation {
  const piece = game.get(from as ChessSquare);

  // Determine reason for illegality
  let reason: IllegalMoveReason = 'invalid_pattern';
  let fide = FIDE_ARTICLES.p; // Default

  if (!piece) {
    reason = 'no_piece';
    return createIllegalExplanation(from, to, reason, fide);
  }

  if (piece.color !== game.turn()) {
    reason = 'wrong_color';
    fide = FIDE_ARTICLES[piece.type as PieceType];
    return createIllegalExplanation(from, to, reason, fide);
  }

  const pieceType = piece.type as PieceType;
  fide = FIDE_ARTICLES[pieceType];

  // Check if move would leave king in check
  const testGame = new Chess(game.fen());
  try {
    testGame.move({ from, to, promotion: promotion as any });
  } catch {
    // Move failed - determine why
    const targetPiece = game.get(to as ChessSquare);

    // Own piece on target
    if (targetPiece && targetPiece.color === piece.color) {
      reason = 'own_piece_on_target';
      return createIllegalExplanation(from, to, reason, fide);
    }

    // Check pattern validity
    if (!isValidPattern(pieceType, from, to)) {
      reason = 'invalid_pattern';
      return createIllegalExplanation(from, to, reason, fide);
    }

    // Path blocked (for sliding pieces)
    if (['q', 'r', 'b'].includes(pieceType) && !isPathClear(game, from, to)) {
      reason = 'path_blocked';
      return createIllegalExplanation(from, to, reason, fide);
    }

    // Pawn specific
    if (pieceType === 'p') {
      const fromCoords = squareToCoords(from);
      const toCoords = squareToCoords(to);
      const direction = piece.color === 'w' ? 1 : -1;

      // Pawn blocked
      if (fromCoords.file === toCoords.file && targetPiece) {
        reason = 'pawn_blocked';
        return createIllegalExplanation(from, to, reason, fide);
      }
    }

    // Would leave king in check
    if (game.inCheck()) {
      reason = 'king_in_check';
    } else {
      reason = 'would_be_in_check';
    }
  }

  return createIllegalExplanation(from, to, reason, fide);
}

/**
 * Check if move pattern is valid for piece type
 */
function isValidPattern(pieceType: PieceType, from: Square, to: Square): boolean {
  switch (pieceType) {
    case 'k':
      return isAdjacent(from, to) || isCastlingPattern(from, to);
    case 'q':
      return isDiagonal(from, to) || isRankOrFile(from, to);
    case 'r':
      return isRankOrFile(from, to);
    case 'b':
      return isDiagonal(from, to);
    case 'n':
      return isLShape(from, to);
    case 'p':
      return isPawnPattern(from, to);
    default:
      return false;
  }
}

function isCastlingPattern(from: Square, to: Square): boolean {
  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);
  return Math.abs(toCoords.file - fromCoords.file) === 2 && fromCoords.rank === toCoords.rank;
}

function isPawnPattern(from: Square, to: Square): boolean {
  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);
  const deltaFile = Math.abs(toCoords.file - fromCoords.file);
  const deltaRank = Math.abs(toCoords.rank - fromCoords.rank);

  // Forward 1 or 2, or diagonal capture
  return (deltaFile === 0 && (deltaRank === 1 || deltaRank === 2)) ||
    (deltaFile === 1 && deltaRank === 1);
}

/**
 * Create illegal move explanation
 */
function createIllegalExplanation(
  from: Square,
  to: Square,
  reason: IllegalMoveReason,
  fide: { article: string; en: string; no: string }
): IllegalMoveExplanation {
  const explanations: Record<IllegalMoveReason, { en: string; no: string; violation: string }> = {
    no_piece: {
      en: 'No piece on the starting square',
      no: 'Ingen brikke på startfeltet',
      violation: '¬∃piece(from)'
    },
    wrong_color: {
      en: 'Cannot move opponent\'s piece',
      no: 'Kan ikke flytte motstanderens brikke',
      violation: 'piece.color ≠ turn'
    },
    invalid_pattern: {
      en: 'Piece cannot move in this pattern',
      no: 'Brikken kan ikke bevege seg i dette mønsteret',
      violation: '¬valid_pattern(piece, from, to)'
    },
    path_blocked: {
      en: 'Path is blocked by another piece',
      no: 'Veien er blokkert av en annen brikke',
      violation: '¬clear_path(from, to)'
    },
    own_piece_on_target: {
      en: 'Cannot capture your own piece',
      no: 'Kan ikke slå egen brikke',
      violation: 'target.color = own_color'
    },
    would_be_in_check: {
      en: 'Move would leave your king in check',
      no: 'Trekket ville satt din konge i sjakk',
      violation: 'move → in_check(own_king)'
    },
    king_in_check: {
      en: 'Must move out of check',
      no: 'Må komme ut av sjakk',
      violation: 'in_check ∧ ¬resolves_check(move)'
    },
    castling_through_check: {
      en: 'Cannot castle through check',
      no: 'Kan ikke rokere gjennom sjakk',
      violation: 'attacked(castle_path)'
    },
    castling_king_moved: {
      en: 'Cannot castle - king has moved',
      no: 'Kan ikke rokere - kongen har flyttet',
      violation: 'moved(king)'
    },
    castling_rook_moved: {
      en: 'Cannot castle - rook has moved',
      no: 'Kan ikke rokere - tårnet har flyttet',
      violation: 'moved(rook)'
    },
    castling_pieces_between: {
      en: 'Cannot castle - pieces between king and rook',
      no: 'Kan ikke rokere - brikker mellom konge og tårn',
      violation: '¬empty(between)'
    },
    en_passant_expired: {
      en: 'En passant is no longer available',
      no: 'En passant er ikke lenger tilgjengelig',
      violation: '¬F[≤1_move](opponent_double_advance)'
    },
    pawn_blocked: {
      en: 'Pawn is blocked',
      no: 'Bonden er blokkert',
      violation: '¬empty(target) ∧ ¬capture'
    }
  };

  const exp = explanations[reason];

  return {
    attemptedMove: `${from}-${to}`,
    from,
    to,
    reason,
    krog: {
      formula: `F(${from}-${to}) ↔ ${exp.violation}`,
      violation: exp.violation
    },
    fide,
    explanation: {
      en: exp.en,
      no: exp.no
    }
  };
}

/**
 * Generate explanation text
 */
function generateExplanationText(
  pieceName: { en: string; no: string },
  from: Square,
  to: Square,
  moveType: MoveType,
  conditions: { name: string; met: boolean; description: string }[]
): { en: string; no: string } {
  const metConditions = conditions.filter(c => c.met);

  switch (moveType) {
    case 'castle_kingside':
      return {
        en: 'Kingside castling: King moves two squares towards the rook, rook moves to the other side of the king.',
        no: 'Kort rokade: Kongen flytter to felt mot tårnet, tårnet flytter til andre siden av kongen.'
      };
    case 'castle_queenside':
      return {
        en: 'Queenside castling: King moves two squares towards the rook, rook moves to the other side of the king.',
        no: 'Lang rokade: Kongen flytter to felt mot tårnet, tårnet flytter til andre siden av kongen.'
      };
    case 'en_passant':
      return {
        en: `En passant capture: ${pieceName.en} captures the opponent's pawn that just moved two squares.`,
        no: `En passant: ${pieceName.no} slår motstanderens bonde som nettopp flyttet to felt.`
      };
    case 'promotion':
      return {
        en: `Pawn promotion: ${pieceName.en} reaches the last rank and must be promoted to a new piece.`,
        no: `Bondeforvandling: ${pieceName.no} når siste rad og må forfremmes til en ny brikke.`
      };
    case 'capture':
      return {
        en: `${pieceName.en} on ${from} captures on ${to}.`,
        no: `${pieceName.no} på ${from} slår på ${to}.`
      };
    default:
      return {
        en: `${pieceName.en} moves from ${from} to ${to}.`,
        no: `${pieceName.no} flytter fra ${from} til ${to}.`
      };
  }
}

/**
 * Main entry point - explain a move (legal or illegal)
 */
export function explainMove(
  game: Chess,
  from: Square,
  to: Square,
  promotion?: string
): MoveExplanation | IllegalMoveExplanation {
  // Try to make the move to see if it's legal
  const testGame = new Chess(game.fen());

  try {
    const move = testGame.move({ from, to, promotion: promotion as any });
    if (move) {
      return explainLegalMove(game, move);
    }
  } catch {
    // Move is illegal
  }

  return explainIllegalMove(game, from, to, promotion);
}
