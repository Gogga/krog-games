/**
 * KROG Special Move Rules
 *
 * Handles castling, en passant, and promotion with KROG formulas.
 */

import { Chess, Square as ChessSquare } from 'chess.js';
import { Square, MoveType, KROGFormula, FIDE_SPECIAL } from './types';
import { squareToCoords, coordsToSquare, isSquareAttacked } from './pieces';

// Castling conditions checker
export function checkCastlingConditions(
  game: Chess,
  color: 'w' | 'b',
  side: 'kingside' | 'queenside'
): {
  valid: boolean;
  conditions: { name: string; met: boolean; description: string }[];
} {
  const conditions: { name: string; met: boolean; description: string }[] = [];

  const rank = color === 'w' ? '1' : '8';
  const kingSquare = `e${rank}` as Square;
  const rookSquare = side === 'kingside' ? `h${rank}` as Square : `a${rank}` as Square;
  const kingTarget = side === 'kingside' ? `g${rank}` as Square : `c${rank}` as Square;

  // Check king hasn't moved (via castling rights)
  const castlingRights = game.getCastlingRights(color);
  const canCastle = side === 'kingside' ? castlingRights.k : castlingRights.q;
  conditions.push({
    name: '¬moved(king)',
    met: canCastle,
    description: 'King has not moved'
  });

  // Check rook hasn't moved (implicitly via castling rights)
  conditions.push({
    name: '¬moved(rook)',
    met: canCastle,
    description: 'Rook has not moved'
  });

  // Check king is not in check
  const notInCheck = !game.inCheck();
  conditions.push({
    name: '¬in_check',
    met: notInCheck,
    description: 'King is not currently in check'
  });

  // Check squares between are empty
  const betweenSquares = side === 'kingside'
    ? [`f${rank}`, `g${rank}`]
    : [`b${rank}`, `c${rank}`, `d${rank}`];

  const squaresEmpty = betweenSquares.every(sq => !game.get(sq as ChessSquare));
  conditions.push({
    name: 'empty(between)',
    met: squaresEmpty,
    description: 'No pieces between king and rook'
  });

  // Check king doesn't pass through or end on attacked square
  const kingPath = side === 'kingside'
    ? [`e${rank}`, `f${rank}`, `g${rank}`]
    : [`e${rank}`, `d${rank}`, `c${rank}`];

  const opponentColor = color === 'w' ? 'b' : 'w';
  const pathNotAttacked = kingPath.every(sq =>
    !isSquareAttacked(game, sq as Square, opponentColor)
  );
  conditions.push({
    name: '¬attacked(path)',
    met: pathNotAttacked,
    description: 'King does not pass through or end on attacked square'
  });

  const valid = canCastle && notInCheck && squaresEmpty && pathNotAttacked;

  return { valid, conditions };
}

// Generate KROG formula for castling
export function getCastlingFormula(
  color: 'w' | 'b',
  side: 'kingside' | 'queenside',
  conditions: { name: string; met: boolean }[]
): KROGFormula {
  const notation = side === 'kingside' ? 'O-O' : 'O-O-O';
  const conditionStrings = conditions.map(c => c.met ? c.name : `¬${c.name}`);

  return {
    operator: 'P',
    action: notation,
    conditions: conditionStrings,
    formula: `P(${notation}) ↔ ${conditionStrings.join(' ∧ ')}`
  };
}

// En passant conditions checker
export function checkEnPassantConditions(
  game: Chess,
  from: Square,
  to: Square
): {
  valid: boolean;
  conditions: { name: string; met: boolean; description: string }[];
} {
  const conditions: { name: string; met: boolean; description: string }[] = [];

  const piece = game.get(from as ChessSquare);
  if (!piece || piece.type !== 'p') {
    return { valid: false, conditions: [{ name: 'is_pawn', met: false, description: 'Moving piece is a pawn' }] };
  }

  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);
  const direction = piece.color === 'w' ? 1 : -1;
  const enPassantRank = piece.color === 'w' ? 4 : 3; // 5th rank for white, 4th for black (0-indexed)

  // Check pawn is on correct rank for en passant
  const onCorrectRank = fromCoords.rank === enPassantRank;
  conditions.push({
    name: 'on_fifth_rank',
    met: onCorrectRank,
    description: `Pawn is on the ${piece.color === 'w' ? '5th' : '4th'} rank`
  });

  // Check move is diagonal
  const isDiagonalMove = Math.abs(toCoords.file - fromCoords.file) === 1 &&
    toCoords.rank - fromCoords.rank === direction;
  conditions.push({
    name: 'diagonal_move',
    met: isDiagonalMove,
    description: 'Move is one square diagonally forward'
  });

  // Check en passant square matches
  // chess.js stores the en passant square if available
  const history = game.history({ verbose: true });
  const lastMove = history[history.length - 1];

  let opponentDoubleAdvance = false;
  if (lastMove && lastMove.piece === 'p') {
    const lastFromRank = parseInt(lastMove.from[1]);
    const lastToRank = parseInt(lastMove.to[1]);
    const wasDoubleAdvance = Math.abs(lastToRank - lastFromRank) === 2;
    const adjacentFile = lastMove.to[0] === String.fromCharCode('a'.charCodeAt(0) + toCoords.file);
    opponentDoubleAdvance = wasDoubleAdvance && adjacentFile;
  }

  conditions.push({
    name: 'opponent_double_advance',
    met: opponentDoubleAdvance,
    description: 'Opponent pawn just advanced two squares to adjacent file'
  });

  const valid = onCorrectRank && isDiagonalMove && opponentDoubleAdvance;

  return { valid, conditions };
}

// Generate KROG formula for en passant
export function getEnPassantFormula(
  from: Square,
  to: Square,
  conditions: { name: string; met: boolean }[]
): KROGFormula {
  const conditionStrings = conditions.map(c => c.met ? c.name : `¬${c.name}`);

  return {
    operator: 'P',
    action: `${from[0]}x${to}`,
    conditions: conditionStrings,
    formula: `P(en_passant) ↔ F[≤1_move](opponent_double_advance) ∧ ${conditionStrings.join(' ∧ ')}`
  };
}

// Promotion conditions checker
export function checkPromotionConditions(
  game: Chess,
  from: Square,
  to: Square,
  promotionPiece?: string
): {
  valid: boolean;
  isPromotion: boolean;
  conditions: { name: string; met: boolean; description: string }[];
} {
  const conditions: { name: string; met: boolean; description: string }[] = [];

  const piece = game.get(from as ChessSquare);
  if (!piece || piece.type !== 'p') {
    return {
      valid: false,
      isPromotion: false,
      conditions: [{ name: 'is_pawn', met: false, description: 'Moving piece is a pawn' }]
    };
  }

  const toCoords = squareToCoords(to);
  const promotionRank = piece.color === 'w' ? 7 : 0;
  const isPromotion = toCoords.rank === promotionRank;

  conditions.push({
    name: 'reaches_eighth',
    met: isPromotion,
    description: 'Pawn reaches the last rank'
  });

  if (isPromotion) {
    // Promotion piece must be specified and valid
    const validPieces = ['q', 'r', 'b', 'n'];
    const pieceSpecified = promotionPiece && validPieces.includes(promotionPiece.toLowerCase());
    conditions.push({
      name: 'piece_chosen',
      met: !!pieceSpecified,
      description: 'Promotion piece (Q/R/B/N) is specified'
    });

    return {
      valid: pieceSpecified || false,
      isPromotion: true,
      conditions
    };
  }

  return { valid: true, isPromotion: false, conditions };
}

// Generate KROG formula for promotion
export function getPromotionFormula(
  from: Square,
  to: Square,
  promotionPiece: string,
  conditions: { name: string; met: boolean }[]
): KROGFormula {
  const pieceNames: Record<string, string> = {
    q: 'Q', r: 'R', b: 'B', n: 'N'
  };
  const notation = `${to}=${pieceNames[promotionPiece.toLowerCase()] || 'Q'}`;
  const conditionStrings = conditions.map(c => c.met ? c.name : `¬${c.name}`);

  return {
    operator: 'O', // Obligated to choose a piece
    action: notation,
    conditions: conditionStrings,
    formula: `reaches_eighth → O(choose_piece ∈ {Q, R, B, N})`
  };
}

// Detect special move type
export function detectSpecialMove(
  game: Chess,
  from: Square,
  to: Square
): MoveType | null {
  const piece = game.get(from as ChessSquare);
  if (!piece) return null;

  // Check castling
  if (piece.type === 'k') {
    const fromCoords = squareToCoords(from);
    const toCoords = squareToCoords(to);
    const deltaFile = toCoords.file - fromCoords.file;

    if (Math.abs(deltaFile) === 2) {
      return deltaFile > 0 ? 'castle_kingside' : 'castle_queenside';
    }
  }

  // Check en passant
  if (piece.type === 'p') {
    const fromCoords = squareToCoords(from);
    const toCoords = squareToCoords(to);
    const targetPiece = game.get(to as ChessSquare);

    // Diagonal move without piece on target = en passant
    if (Math.abs(toCoords.file - fromCoords.file) === 1 && !targetPiece) {
      const { valid } = checkEnPassantConditions(game, from, to);
      if (valid) return 'en_passant';
    }

    // Check promotion
    const promotionRank = piece.color === 'w' ? 7 : 0;
    if (toCoords.rank === promotionRank) {
      return 'promotion';
    }

    // Check double pawn push
    if (Math.abs(toCoords.rank - fromCoords.rank) === 2) {
      return 'double_pawn_push';
    }
  }

  return null;
}
