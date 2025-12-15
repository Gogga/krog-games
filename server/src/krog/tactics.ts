/**
 * KROG Tactical Pattern Detection
 *
 * Detects tactical motifs (forks, pins, skewers) with KROG formulas.
 */

import { Chess, Square as ChessSquare, PieceSymbol } from 'chess.js';
import { Square, PieceType } from './types';
import { squareToCoords, coordsToSquare, isDiagonal, isRankOrFile } from './pieces';

// Piece values for calculating tactical worth
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100  // King is "infinite" value
};

// Tactical pattern result
export interface TacticalResult {
  pattern: string;
  score: number;
  targets: Square[];
  attacker: Square;
  explanation: {
    en: string;
    no: string;
  };
  krogFormula: string;
}

// Get all squares attacked by a piece at a given position
function getAttackedSquares(game: Chess, square: Square): Square[] {
  const piece = game.get(square as ChessSquare);
  if (!piece) return [];

  const attacked: Square[] = [];
  const coords = squareToCoords(square);
  const color = piece.color;

  // Get all squares and check if this piece attacks them
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const targetSq = coordsToSquare(file, rank);
      if (!targetSq || targetSq === square) continue;

      // Check if target square is attacked
      // We do this by checking if moving to that square would be valid attack pattern
      const targetPiece = game.get(targetSq as ChessSquare);

      switch (piece.type) {
        case 'n': {
          // Knight attacks L-shape
          const df = Math.abs(file - coords.file);
          const dr = Math.abs(rank - coords.rank);
          if ((df === 2 && dr === 1) || (df === 1 && dr === 2)) {
            attacked.push(targetSq);
          }
          break;
        }
        case 'b': {
          // Bishop attacks diagonals
          if (isDiagonal(square, targetSq) && isPathClearSimple(game, square, targetSq)) {
            attacked.push(targetSq);
          }
          break;
        }
        case 'r': {
          // Rook attacks ranks/files
          if (isRankOrFile(square, targetSq) && isPathClearSimple(game, square, targetSq)) {
            attacked.push(targetSq);
          }
          break;
        }
        case 'q': {
          // Queen attacks both
          if ((isDiagonal(square, targetSq) || isRankOrFile(square, targetSq)) &&
              isPathClearSimple(game, square, targetSq)) {
            attacked.push(targetSq);
          }
          break;
        }
        case 'k': {
          // King attacks adjacent
          const df = Math.abs(file - coords.file);
          const dr = Math.abs(rank - coords.rank);
          if (df <= 1 && dr <= 1 && (df > 0 || dr > 0)) {
            attacked.push(targetSq);
          }
          break;
        }
        case 'p': {
          // Pawn attacks diagonally forward
          const direction = color === 'w' ? 1 : -1;
          if (rank === coords.rank + direction && Math.abs(file - coords.file) === 1) {
            attacked.push(targetSq);
          }
          break;
        }
      }
    }
  }

  return attacked;
}

// Simple path clear check (doesn't need chess.js move validation)
function isPathClearSimple(game: Chess, from: Square, to: Square): boolean {
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

// Get piece name for explanations
function getPieceName(type: PieceSymbol, lang: 'en' | 'no'): string {
  const names: Record<PieceSymbol, { en: string; no: string }> = {
    p: { en: 'pawn', no: 'bonde' },
    n: { en: 'knight', no: 'springer' },
    b: { en: 'bishop', no: 'løper' },
    r: { en: 'rook', no: 'tårn' },
    q: { en: 'queen', no: 'dronning' },
    k: { en: 'king', no: 'konge' }
  };
  return names[type][lang];
}

/**
 * Detect fork: piece attacks 2+ valuable enemy pieces
 */
export function detectFork(
  game: Chess,
  attackerSquare: Square
): TacticalResult | null {
  const attacker = game.get(attackerSquare as ChessSquare);
  if (!attacker) return null;

  const attackedSquares = getAttackedSquares(game, attackerSquare);
  const valuableTargets: { square: Square; piece: { type: PieceSymbol; color: 'w' | 'b' }; value: number }[] = [];

  for (const sq of attackedSquares) {
    const target = game.get(sq as ChessSquare);
    if (target && target.color !== attacker.color) {
      const value = PIECE_VALUES[target.type];
      // Consider valuable if worth at least 3 (knight/bishop or higher)
      if (value >= 3) {
        valuableTargets.push({ square: sq, piece: target, value });
      }
    }
  }

  if (valuableTargets.length >= 2) {
    // Sort by value descending
    valuableTargets.sort((a, b) => b.value - a.value);
    const top2 = valuableTargets.slice(0, 2);
    const totalValue = top2.reduce((sum, t) => sum + t.value, 0);

    const targetNames = {
      en: top2.map(t => getPieceName(t.piece.type, 'en')).join(' and '),
      no: top2.map(t => getPieceName(t.piece.type, 'no')).join(' og ')
    };

    const attackerName = {
      en: getPieceName(attacker.type, 'en'),
      no: getPieceName(attacker.type, 'no')
    };

    return {
      pattern: 'fork',
      score: Math.min(totalValue * 10, 100),
      targets: top2.map(t => t.square),
      attacker: attackerSquare,
      explanation: {
        en: `${attackerName.en.charAt(0).toUpperCase() + attackerName.en.slice(1)} forks ${targetNames.en}`,
        no: `${attackerName.no.charAt(0).toUpperCase() + attackerName.no.slice(1)} gafler ${targetNames.no}`
      },
      krogFormula: `fork(${attacker.type}, ${top2.map(t => t.square).join(', ')}) → O(lose_material)`
    };
  }

  return null;
}

/**
 * Detect pin: piece pins an enemy piece to a more valuable piece behind it
 */
export function detectPin(
  game: Chess,
  pinnerSquare: Square
): TacticalResult | null {
  const pinner = game.get(pinnerSquare as ChessSquare);
  if (!pinner) return null;

  // Only bishops, rooks, queens can pin
  if (!['b', 'r', 'q'].includes(pinner.type)) return null;

  const pinnerCoords = squareToCoords(pinnerSquare);
  const directions: { df: number; dr: number }[] = [];

  // Determine directions based on piece type
  if (pinner.type === 'b' || pinner.type === 'q') {
    directions.push({ df: 1, dr: 1 }, { df: 1, dr: -1 }, { df: -1, dr: 1 }, { df: -1, dr: -1 });
  }
  if (pinner.type === 'r' || pinner.type === 'q') {
    directions.push({ df: 1, dr: 0 }, { df: -1, dr: 0 }, { df: 0, dr: 1 }, { df: 0, dr: -1 });
  }

  for (const { df, dr } of directions) {
    let file = pinnerCoords.file + df;
    let rank = pinnerCoords.rank + dr;
    let pinnedPiece: { square: Square; piece: { type: PieceSymbol; color: 'w' | 'b' } } | null = null;

    while (file >= 0 && file <= 7 && rank >= 0 && rank <= 7) {
      const sq = coordsToSquare(file, rank)!;
      const piece = game.get(sq as ChessSquare);

      if (piece) {
        if (piece.color === pinner.color) {
          // Hit our own piece, no pin possible in this direction
          break;
        }

        if (!pinnedPiece) {
          // First enemy piece encountered - potential pinned piece
          pinnedPiece = { square: sq, piece };
        } else {
          // Second enemy piece - check if it's more valuable (absolute pin if king)
          if (PIECE_VALUES[piece.type] > PIECE_VALUES[pinnedPiece.piece.type]) {
            const isAbsolute = piece.type === 'k';
            const pinnerName = {
              en: getPieceName(pinner.type, 'en'),
              no: getPieceName(pinner.type, 'no')
            };
            const pinnedName = {
              en: getPieceName(pinnedPiece.piece.type, 'en'),
              no: getPieceName(pinnedPiece.piece.type, 'no')
            };
            const behindName = {
              en: getPieceName(piece.type, 'en'),
              no: getPieceName(piece.type, 'no')
            };

            return {
              pattern: isAbsolute ? 'absolute_pin' : 'relative_pin',
              score: isAbsolute ? 40 : 25,
              targets: [pinnedPiece.square, sq],
              attacker: pinnerSquare,
              explanation: {
                en: `${pinnerName.en.charAt(0).toUpperCase() + pinnerName.en.slice(1)} pins ${pinnedName.en} to ${behindName.en}`,
                no: `${pinnerName.no.charAt(0).toUpperCase() + pinnerName.no.slice(1)} binder ${pinnedName.no} mot ${behindName.no}`
              },
              krogFormula: isAbsolute
                ? `absolute_pin(${pinnedPiece.square}) → F(move_pinned_piece)`
                : `relative_pin(${pinnedPiece.square}, ${sq}) → O(lose_material) if moved`
            };
          }
          // Second piece is less valuable, no pin
          break;
        }
      }

      file += df;
      rank += dr;
    }
  }

  return null;
}

/**
 * Detect all tactical patterns for a move
 */
export function detectTacticsAfterMove(
  game: Chess,
  move: { from: Square; to: Square }
): TacticalResult[] {
  const tactics: TacticalResult[] = [];

  // Create a copy and make the move
  const gameCopy = new Chess(game.fen());
  try {
    gameCopy.move({ from: move.from, to: move.to });
  } catch {
    return tactics;
  }

  // Check for fork at the destination square
  const fork = detectFork(gameCopy, move.to);
  if (fork) {
    tactics.push(fork);
  }

  // Check for pin at the destination square
  const pin = detectPin(gameCopy, move.to);
  if (pin) {
    tactics.push(pin);
  }

  // Check if move creates discovered attack (piece behind moved piece now attacks)
  const movedPiece = gameCopy.get(move.to as ChessSquare);
  if (movedPiece) {
    // Check along the line from move.from
    const directions = [
      { df: 1, dr: 0 }, { df: -1, dr: 0 }, { df: 0, dr: 1 }, { df: 0, dr: -1 },
      { df: 1, dr: 1 }, { df: 1, dr: -1 }, { df: -1, dr: 1 }, { df: -1, dr: -1 }
    ];

    const fromCoords = squareToCoords(move.from);

    for (const { df, dr } of directions) {
      let file = fromCoords.file + df;
      let rank = fromCoords.rank + dr;

      // Look in opposite direction from move
      const toCoords = squareToCoords(move.to);
      const moveDir = {
        df: Math.sign(toCoords.file - fromCoords.file),
        dr: Math.sign(toCoords.rank - fromCoords.rank)
      };

      // Only check if this direction is opposite to move direction
      if (df === -moveDir.df && dr === -moveDir.dr) continue;

      while (file >= 0 && file <= 7 && rank >= 0 && rank <= 7) {
        const sq = coordsToSquare(file, rank)!;
        const piece = gameCopy.get(sq as ChessSquare);

        if (piece) {
          if (piece.color === movedPiece.color) {
            // Our piece - check if it can now attack along this line
            const discoveredFork = detectFork(gameCopy, sq);
            if (discoveredFork && !tactics.some(t => t.attacker === sq)) {
              tactics.push({
                ...discoveredFork,
                pattern: 'discovered_attack',
                explanation: {
                  en: `Discovered attack by ${getPieceName(piece.type, 'en')}`,
                  no: `Avdekket angrep fra ${getPieceName(piece.type, 'no')}`
                }
              });
            }
          }
          break;
        }

        file += df;
        rank += dr;
      }
    }
  }

  return tactics;
}

/**
 * Get all current tactical threats in a position
 */
export function getCurrentTactics(game: Chess): TacticalResult[] {
  const tactics: TacticalResult[] = [];
  const turn = game.turn();

  // Check all our pieces for tactical patterns
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const sq = coordsToSquare(file, rank)!;
      const piece = game.get(sq as ChessSquare);

      if (piece && piece.color === turn) {
        const fork = detectFork(game, sq);
        if (fork) tactics.push(fork);

        const pin = detectPin(game, sq);
        if (pin) tactics.push(pin);
      }
    }
  }

  return tactics;
}
