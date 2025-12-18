import { Chess, Square, Move } from 'chess.js';

// ═══════════════════════════════════════════════════════════════════════════
//                       CHESS VARIANTS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export type VariantType = 'standard' | 'chess960' | 'threeCheck' | 'kingOfTheHill';

export interface VariantState {
  variant: VariantType;
  // Chess960
  positionId?: number;
  // Three-Check
  checkCount?: { white: number; black: number };
  // King of the Hill
  hillReached?: boolean;
}

export interface VariantGameResult {
  gameOver: boolean;
  winner?: 'white' | 'black' | 'draw';
  reason?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
//                              CHESS960
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a Chess960 starting position using Scharnagl's method
 * @param positionId - Position number 0-959 (518 = standard chess)
 * @returns FEN string for the position
 */
export function generateChess960Position(positionId?: number): { positionId: number; fen: string } {
  // Random position if not specified
  const id = positionId ?? Math.floor(Math.random() * 960);

  // Scharnagl's method to generate the back rank
  const backRank: string[] = new Array(8).fill('');

  // Step 1: Place light-squared bishop (positions 1,3,5,7 -> b,d,f,h)
  const lightBishop = (id % 4) * 2 + 1;
  backRank[lightBishop] = 'b';

  // Step 2: Place dark-squared bishop (positions 0,2,4,6 -> a,c,e,g)
  const darkBishop = (Math.floor(id / 4) % 4) * 2;
  backRank[darkBishop] = 'b';

  // Step 3: Place queen on one of 6 remaining squares
  const queenIndex = Math.floor(id / 16) % 6;
  let emptyCount = 0;
  for (let i = 0; i < 8; i++) {
    if (backRank[i] === '') {
      if (emptyCount === queenIndex) {
        backRank[i] = 'q';
        break;
      }
      emptyCount++;
    }
  }

  // Step 4: Place knights on 2 of 5 remaining squares
  // Use combination table for knight placement
  const knightTable = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 2], [1, 3], [1, 4],
    [2, 3], [2, 4],
    [3, 4]
  ];
  const knightIndex = Math.floor(id / 96);
  const knightPositions = knightTable[knightIndex];

  let emptySquares: number[] = [];
  for (let i = 0; i < 8; i++) {
    if (backRank[i] === '') emptySquares.push(i);
  }

  backRank[emptySquares[knightPositions[0]]] = 'n';
  backRank[emptySquares[knightPositions[1]]] = 'n';

  // Step 5: Place rook, king, rook on remaining 3 squares (in that order)
  emptySquares = [];
  for (let i = 0; i < 8; i++) {
    if (backRank[i] === '') emptySquares.push(i);
  }
  backRank[emptySquares[0]] = 'r';
  backRank[emptySquares[1]] = 'k';
  backRank[emptySquares[2]] = 'r';

  // Build FEN
  const blackRank = backRank.join('');
  const whiteRank = blackRank.toUpperCase();

  // Find rook files for castling rights (using file letters)
  const rookFiles: string[] = [];
  for (let i = 0; i < 8; i++) {
    if (backRank[i] === 'r') {
      rookFiles.push(String.fromCharCode(65 + i)); // A-H for white
    }
  }

  // Chess960 uses Shredder-FEN castling notation (file letters instead of KQkq)
  const castling = `${rookFiles[1]}${rookFiles[0]}${rookFiles[1].toLowerCase()}${rookFiles[0].toLowerCase()}`;

  const fen = `${blackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteRank} w ${castling} - 0 1`;

  return { positionId: id, fen };
}

/**
 * Get position ID for standard chess (position 518)
 */
export const STANDARD_CHESS_960_ID = 518;

// ═══════════════════════════════════════════════════════════════════════════
//                            THREE-CHECK
// ═══════════════════════════════════════════════════════════════════════════

export interface ThreeCheckState {
  checkCount: { white: number; black: number };
}

/**
 * Initialize Three-Check state
 */
export function initThreeCheck(): ThreeCheckState {
  return {
    checkCount: { white: 0, black: 0 }
  };
}

/**
 * Check if a move delivers check and update count
 */
export function updateThreeCheckState(
  game: Chess,
  state: ThreeCheckState,
  moverColor: 'white' | 'black'
): ThreeCheckState {
  if (game.isCheck()) {
    const newState = { ...state };
    newState.checkCount = { ...state.checkCount };
    newState.checkCount[moverColor]++;
    return newState;
  }
  return state;
}

/**
 * Check for Three-Check win condition
 */
export function checkThreeCheckWin(state: ThreeCheckState): 'white' | 'black' | null {
  if (state.checkCount.white >= 3) return 'white';
  if (state.checkCount.black >= 3) return 'black';
  return null;
}

/**
 * Get Three-Check game result
 */
export function getThreeCheckResult(game: Chess, state: ThreeCheckState): VariantGameResult {
  // Check for three-check win
  const threeCheckWinner = checkThreeCheckWin(state);
  if (threeCheckWinner) {
    return {
      gameOver: true,
      winner: threeCheckWinner,
      reason: 'Three checks delivered'
    };
  }

  // Standard game over conditions
  if (game.isCheckmate()) {
    return {
      gameOver: true,
      winner: game.turn() === 'w' ? 'black' : 'white',
      reason: 'Checkmate'
    };
  }

  if (game.isStalemate()) {
    return { gameOver: true, winner: 'draw', reason: 'Stalemate' };
  }

  if (game.isThreefoldRepetition()) {
    return { gameOver: true, winner: 'draw', reason: 'Threefold repetition' };
  }

  if (game.isInsufficientMaterial()) {
    return { gameOver: true, winner: 'draw', reason: 'Insufficient material' };
  }

  if (game.isDraw()) {
    return { gameOver: true, winner: 'draw', reason: 'Fifty-move rule' };
  }

  return { gameOver: false };
}

// ═══════════════════════════════════════════════════════════════════════════
//                          KING OF THE HILL
// ═══════════════════════════════════════════════════════════════════════════

export const HILL_SQUARES: Square[] = ['d4', 'd5', 'e4', 'e5'];

/**
 * Check if a king is on the hill and not in check
 */
export function isKingOnHill(game: Chess, color: 'w' | 'b'): boolean {
  const board = game.board();

  for (const square of HILL_SQUARES) {
    const file = square.charCodeAt(0) - 97; // 0-7
    const rank = parseInt(square[1]) - 1;   // 0-7
    const piece = board[7 - rank][file];

    if (piece && piece.type === 'k' && piece.color === color) {
      // King is on hill, check if in check
      if (!game.isCheck()) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get King of the Hill game result
 */
export function getKOTHResult(game: Chess): VariantGameResult {
  // Check for hill victory (check after move, so previous player's turn)
  const lastMoverColor = game.turn() === 'w' ? 'b' : 'w';

  if (isKingOnHill(game, lastMoverColor)) {
    return {
      gameOver: true,
      winner: lastMoverColor === 'w' ? 'white' : 'black',
      reason: 'King reached the hill'
    };
  }

  // Standard game over conditions
  if (game.isCheckmate()) {
    return {
      gameOver: true,
      winner: game.turn() === 'w' ? 'black' : 'white',
      reason: 'Checkmate'
    };
  }

  if (game.isStalemate()) {
    return { gameOver: true, winner: 'draw', reason: 'Stalemate' };
  }

  if (game.isThreefoldRepetition()) {
    return { gameOver: true, winner: 'draw', reason: 'Threefold repetition' };
  }

  if (game.isInsufficientMaterial()) {
    return { gameOver: true, winner: 'draw', reason: 'Insufficient material' };
  }

  if (game.isDraw()) {
    return { gameOver: true, winner: 'draw', reason: 'Fifty-move rule' };
  }

  return { gameOver: false };
}

// ═══════════════════════════════════════════════════════════════════════════
//                        VARIANT FACTORY
// ═══════════════════════════════════════════════════════════════════════════

export function createVariantGame(variant: VariantType, positionId?: number): { game: Chess; state: VariantState } {
  let fen: string | undefined;
  const state: VariantState = { variant };

  switch (variant) {
    case 'chess960': {
      const pos = generateChess960Position(positionId);
      state.positionId = pos.positionId;
      // Chess960 FEN needs special handling - for now use standard for move validation
      // The actual position would need a Chess960-aware library
      fen = pos.fen;
      break;
    }
    case 'threeCheck':
      state.checkCount = { white: 0, black: 0 };
      break;
    case 'kingOfTheHill':
      // Standard starting position
      break;
    case 'standard':
    default:
      // Standard chess
      break;
  }

  const game = fen ? new Chess(fen) : new Chess();
  return { game, state };
}

export function getVariantResult(game: Chess, state: VariantState): VariantGameResult {
  switch (state.variant) {
    case 'threeCheck':
      return getThreeCheckResult(game, state as ThreeCheckState);
    case 'kingOfTheHill':
      return getKOTHResult(game);
    case 'chess960':
    case 'standard':
    default:
      // Standard game over check
      if (game.isCheckmate()) {
        return {
          gameOver: true,
          winner: game.turn() === 'w' ? 'black' : 'white',
          reason: 'Checkmate'
        };
      }
      if (game.isStalemate()) {
        return { gameOver: true, winner: 'draw', reason: 'Stalemate' };
      }
      if (game.isThreefoldRepetition()) {
        return { gameOver: true, winner: 'draw', reason: 'Threefold repetition' };
      }
      if (game.isInsufficientMaterial()) {
        return { gameOver: true, winner: 'draw', reason: 'Insufficient material' };
      }
      if (game.isDraw()) {
        return { gameOver: true, winner: 'draw', reason: 'Fifty-move rule' };
      }
      return { gameOver: false };
  }
}

export function updateVariantState(
  game: Chess,
  state: VariantState,
  moverColor: 'white' | 'black'
): VariantState {
  if (state.variant === 'threeCheck' && state.checkCount) {
    const threeCheckResult = updateThreeCheckState(game, state as ThreeCheckState, moverColor);
    return {
      ...threeCheckResult,
      variant: 'threeCheck'
    };
  }
  return state;
}
