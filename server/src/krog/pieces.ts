/**
 * KROG Piece Movement Rules
 *
 * Each piece has movement rules expressed as KROG formulas with FIDE references.
 */

import { Chess, Square as ChessSquare } from 'chess.js';
import {
  PieceType,
  Square,
  MoveType,
  KROGFormula,
  FIDE_ARTICLES
} from './types';

// Helper to convert square string to coordinates
export function squareToCoords(square: Square): { file: number; rank: number } {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1]) - 1;
  return { file, rank };
}

// Helper to convert coordinates to square string
export function coordsToSquare(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${String.fromCharCode('a'.charCodeAt(0) + file)}${rank + 1}` as Square;
}

// Check if path is clear between two squares (for sliding pieces)
export function isPathClear(game: Chess, from: Square, to: Square): boolean {
  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);

  const deltaFile = Math.sign(toCoords.file - fromCoords.file);
  const deltaRank = Math.sign(toCoords.rank - fromCoords.rank);

  let currentFile = fromCoords.file + deltaFile;
  let currentRank = fromCoords.rank + deltaRank;

  while (currentFile !== toCoords.file || currentRank !== toCoords.rank) {
    const sq = coordsToSquare(currentFile, currentRank);
    if (sq && game.get(sq as ChessSquare)) {
      return false;
    }
    currentFile += deltaFile;
    currentRank += deltaRank;
  }

  return true;
}

// Check if square is on a diagonal from origin
export function isDiagonal(from: Square, to: Square): boolean {
  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);
  const deltaFile = Math.abs(toCoords.file - fromCoords.file);
  const deltaRank = Math.abs(toCoords.rank - fromCoords.rank);
  return deltaFile === deltaRank && deltaFile > 0;
}

// Check if square is on same rank or file
export function isRankOrFile(from: Square, to: Square): boolean {
  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);
  return (fromCoords.file === toCoords.file || fromCoords.rank === toCoords.rank) &&
    (from !== to);
}

// Check if move is L-shaped (knight move)
export function isLShape(from: Square, to: Square): boolean {
  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);
  const deltaFile = Math.abs(toCoords.file - fromCoords.file);
  const deltaRank = Math.abs(toCoords.rank - fromCoords.rank);
  return (deltaFile === 2 && deltaRank === 1) || (deltaFile === 1 && deltaRank === 2);
}

// Check if move is to adjacent square (king move)
export function isAdjacent(from: Square, to: Square): boolean {
  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);
  const deltaFile = Math.abs(toCoords.file - fromCoords.file);
  const deltaRank = Math.abs(toCoords.rank - fromCoords.rank);
  return deltaFile <= 1 && deltaRank <= 1 && (deltaFile > 0 || deltaRank > 0);
}

// Check if square is attacked by opponent
export function isSquareAttacked(game: Chess, square: Square, byColor: 'w' | 'b'): boolean {
  return game.isAttacked(square as ChessSquare, byColor);
}

// Generate KROG formula for a piece move
export function generateKROGFormula(
  pieceType: PieceType,
  from: Square,
  to: Square,
  conditions: { name: string; met: boolean }[]
): KROGFormula {
  const pieceNames: Record<PieceType, string> = {
    k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: ''
  };

  const pieceLetter = pieceNames[pieceType];
  const moveNotation = `${pieceLetter}${to}`;

  const conditionStrings = conditions.map(c =>
    c.met ? c.name : `¬${c.name}`
  );

  const formula = `P(${moveNotation}) ↔ ${conditionStrings.join(' ∧ ')}`;

  return {
    operator: 'P',
    action: moveNotation,
    conditions: conditionStrings,
    formula
  };
}

// Movement rule checkers for each piece type
export const MOVEMENT_CHECKERS: Record<PieceType, (game: Chess, from: Square, to: Square) => {
  valid: boolean;
  moveType: MoveType;
  conditions: { name: string; met: boolean; description: string }[];
}> = {
  // King movement
  k: (game, from, to) => {
    const conditions: { name: string; met: boolean; description: string }[] = [];
    const piece = game.get(from as ChessSquare);
    const targetPiece = game.get(to as ChessSquare);

    // Check adjacent square
    const adjacent = isAdjacent(from, to);
    conditions.push({
      name: 'adjacent',
      met: adjacent,
      description: 'King moves to adjacent square'
    });

    // Check not moving to own piece
    const notOwnPiece = !targetPiece || targetPiece.color !== piece?.color;
    conditions.push({
      name: 'square available',
      met: notOwnPiece,
      description: 'Target square not occupied by own piece'
    });

    // Check not moving into check (simplified - full check requires game state)
    const opponentColor = piece?.color === 'w' ? 'b' : 'w';
    const notIntoCheck = !isSquareAttacked(game, to, opponentColor);
    conditions.push({
      name: 'safe square',
      met: notIntoCheck,
      description: 'Target square not attacked by opponent'
    });

    const valid = adjacent && notOwnPiece && notIntoCheck;
    const moveType: MoveType = targetPiece ? 'capture' : 'normal';

    return { valid, moveType, conditions };
  },

  // Queen movement (combination of rook and bishop)
  q: (game, from, to) => {
    const conditions: { name: string; met: boolean; description: string }[] = [];
    const piece = game.get(from as ChessSquare);
    const targetPiece = game.get(to as ChessSquare);

    // Check diagonal or rank/file
    const diagonal = isDiagonal(from, to);
    const rankFile = isRankOrFile(from, to);
    conditions.push({
      name: 'diagonal or straight',
      met: diagonal || rankFile,
      description: 'Queen moves along diagonal, rank, or file'
    });

    // Check path is clear
    const pathClear = isPathClear(game, from, to);
    conditions.push({
      name: 'clear_path',
      met: pathClear,
      description: 'No pieces blocking the path'
    });

    // Check not capturing own piece
    const notOwnPiece = !targetPiece || targetPiece.color !== piece?.color;
    conditions.push({
      name: 'square available',
      met: notOwnPiece,
      description: 'Target square not occupied by own piece'
    });

    const valid = (diagonal || rankFile) && pathClear && notOwnPiece;
    const moveType: MoveType = targetPiece ? 'capture' : 'normal';

    return { valid, moveType, conditions };
  },

  // Rook movement
  r: (game, from, to) => {
    const conditions: { name: string; met: boolean; description: string }[] = [];
    const piece = game.get(from as ChessSquare);
    const targetPiece = game.get(to as ChessSquare);

    // Check rank or file
    const rankFile = isRankOrFile(from, to);
    conditions.push({
      name: 'rank_or_file',
      met: rankFile,
      description: 'Rook moves along rank or file'
    });

    // Check path is clear
    const pathClear = isPathClear(game, from, to);
    conditions.push({
      name: 'clear_path',
      met: pathClear,
      description: 'No pieces blocking the path'
    });

    // Check not capturing own piece
    const notOwnPiece = !targetPiece || targetPiece.color !== piece?.color;
    conditions.push({
      name: 'square available',
      met: notOwnPiece,
      description: 'Target square not occupied by own piece'
    });

    const valid = rankFile && pathClear && notOwnPiece;
    const moveType: MoveType = targetPiece ? 'capture' : 'normal';

    return { valid, moveType, conditions };
  },

  // Bishop movement
  b: (game, from, to) => {
    const conditions: { name: string; met: boolean; description: string }[] = [];
    const piece = game.get(from as ChessSquare);
    const targetPiece = game.get(to as ChessSquare);

    // Check diagonal
    const diagonal = isDiagonal(from, to);
    conditions.push({
      name: 'diagonal',
      met: diagonal,
      description: 'Bishop moves along diagonal'
    });

    // Check path is clear
    const pathClear = isPathClear(game, from, to);
    conditions.push({
      name: 'clear_path',
      met: pathClear,
      description: 'No pieces blocking the path'
    });

    // Check not capturing own piece
    const notOwnPiece = !targetPiece || targetPiece.color !== piece?.color;
    conditions.push({
      name: 'square available',
      met: notOwnPiece,
      description: 'Target square not occupied by own piece'
    });

    const valid = diagonal && pathClear && notOwnPiece;
    const moveType: MoveType = targetPiece ? 'capture' : 'normal';

    return { valid, moveType, conditions };
  },

  // Knight movement
  n: (game, from, to) => {
    const conditions: { name: string; met: boolean; description: string }[] = [];
    const piece = game.get(from as ChessSquare);
    const targetPiece = game.get(to as ChessSquare);

    // Check L-shape
    const lShape = isLShape(from, to);
    conditions.push({
      name: 'L_shape',
      met: lShape,
      description: 'Knight moves in L-shape (2+1 squares)'
    });

    // Knight can jump - no path check needed
    conditions.push({
      name: 'can_jump',
      met: true,
      description: 'Knight can jump over other pieces'
    });

    // Check not capturing own piece
    const notOwnPiece = !targetPiece || targetPiece.color !== piece?.color;
    conditions.push({
      name: 'square available',
      met: notOwnPiece,
      description: 'Target square not occupied by own piece'
    });

    const valid = lShape && notOwnPiece;
    const moveType: MoveType = targetPiece ? 'capture' : 'normal';

    return { valid, moveType, conditions };
  },

  // Pawn movement
  p: (game, from, to) => {
    const conditions: { name: string; met: boolean; description: string }[] = [];
    const piece = game.get(from as ChessSquare);
    const targetPiece = game.get(to as ChessSquare);
    const fromCoords = squareToCoords(from);
    const toCoords = squareToCoords(to);

    if (!piece) {
      return { valid: false, moveType: 'normal' as MoveType, conditions };
    }

    const direction = piece.color === 'w' ? 1 : -1;
    const startRank = piece.color === 'w' ? 1 : 6;
    const deltaFile = toCoords.file - fromCoords.file;
    const deltaRank = toCoords.rank - fromCoords.rank;

    let moveType: MoveType = 'normal';
    let valid = false;

    // Forward one square
    if (deltaFile === 0 && deltaRank === direction && !targetPiece) {
      conditions.push({
        name: 'forward_one',
        met: true,
        description: 'Pawn moves one square forward'
      });
      conditions.push({
        name: 'path clear',
        met: true,
        description: 'Square ahead is empty'
      });
      valid = true;
    }
    // Forward two squares from start
    else if (deltaFile === 0 && deltaRank === 2 * direction && fromCoords.rank === startRank) {
      const middleSquare = coordsToSquare(fromCoords.file, fromCoords.rank + direction);
      const middleClear = middleSquare ? !game.get(middleSquare as ChessSquare) : false;
      const targetClear = !targetPiece;

      conditions.push({
        name: 'forward_two',
        met: true,
        description: 'Pawn moves two squares forward from starting position'
      });
      conditions.push({
        name: 'from_start',
        met: fromCoords.rank === startRank,
        description: 'Pawn is on starting rank'
      });
      conditions.push({
        name: 'path clear',
        met: middleClear && targetClear,
        description: 'Path is clear'
      });

      valid = middleClear && targetClear;
      if (valid) moveType = 'double_pawn_push';
    }
    // Diagonal capture
    else if (Math.abs(deltaFile) === 1 && deltaRank === direction) {
      if (targetPiece && targetPiece.color !== piece.color) {
        conditions.push({
          name: 'diagonal_capture',
          met: true,
          description: 'Pawn captures diagonally'
        });
        conditions.push({
          name: 'enemy_piece',
          met: true,
          description: 'Enemy piece on target square'
        });
        valid = true;
        moveType = 'capture';
      }
      // En passant check would go here (handled in special.ts)
    }

    // Check for promotion
    const promotionRank = piece.color === 'w' ? 7 : 0;
    if (valid && toCoords.rank === promotionRank) {
      moveType = 'promotion';
      conditions.push({
        name: 'reaches_eighth',
        met: true,
        description: 'Pawn reaches the last rank'
      });
    }

    return { valid, moveType, conditions };
  }
};

// Get piece name for explanations
export function getPieceName(pieceType: PieceType, lang: 'en' | 'no'): string {
  const names: Record<PieceType, { en: string; no: string }> = {
    k: { en: 'King', no: 'Konge' },
    q: { en: 'Queen', no: 'Dronning' },
    r: { en: 'Rook', no: 'Tårn' },
    b: { en: 'Bishop', no: 'Løper' },
    n: { en: 'Knight', no: 'Springer' },
    p: { en: 'Pawn', no: 'Bonde' }
  };
  return names[pieceType][lang];
}
