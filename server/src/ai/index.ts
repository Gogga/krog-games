import { Chess, Move, PieceSymbol, Square } from 'chess.js';

// ═══════════════════════════════════════════════════════════════════════════
//                         CHESS AI ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// Piece values for material evaluation
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece-square tables for positional evaluation
// Values are for white pieces, flip for black
const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDDLE_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

const KING_END_TABLE = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50
];

// Get piece-square table value
function getPieceSquareValue(piece: PieceSymbol, square: Square, color: 'w' | 'b', isEndgame: boolean): number {
  const file = square.charCodeAt(0) - 97; // 0-7
  const rank = parseInt(square[1]) - 1;   // 0-7

  // For white, use table directly; for black, flip the rank
  const tableRank = color === 'w' ? 7 - rank : rank;
  const index = tableRank * 8 + file;

  switch (piece) {
    case 'p': return PAWN_TABLE[index];
    case 'n': return KNIGHT_TABLE[index];
    case 'b': return BISHOP_TABLE[index];
    case 'r': return ROOK_TABLE[index];
    case 'q': return QUEEN_TABLE[index];
    case 'k': return isEndgame ? KING_END_TABLE[index] : KING_MIDDLE_TABLE[index];
    default: return 0;
  }
}

// Check if position is endgame
function isEndgame(game: Chess): boolean {
  const board = game.board();
  let queens = 0;
  let minorPieces = 0;

  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        if (piece.type === 'q') queens++;
        if (piece.type === 'n' || piece.type === 'b') minorPieces++;
      }
    }
  }

  // Endgame if no queens or one queen with minimal minor pieces
  return queens === 0 || (queens === 1 && minorPieces <= 1);
}

// Evaluate the position
function evaluate(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -Infinity : Infinity;
  }
  if (game.isDraw()) {
    return 0;
  }

  const board = game.board();
  const endgame = isEndgame(game);
  let score = 0;

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (piece) {
        const squareName = String.fromCharCode(97 + file) + (8 - rank) as Square;
        const pieceValue = PIECE_VALUES[piece.type];
        const positionValue = getPieceSquareValue(piece.type, squareName, piece.color, endgame);

        const totalValue = pieceValue + positionValue;
        score += piece.color === 'w' ? totalValue : -totalValue;
      }
    }
  }

  // Bonus for check
  if (game.inCheck()) {
    score += game.turn() === 'w' ? -50 : 50;
  }

  return score;
}

// Minimax with alpha-beta pruning
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluate(game);
  }

  const moves = game.moves({ verbose: true });

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const evalScore = minimax(game, depth - 1, alpha, beta, true);
      game.undo();
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Order moves for better pruning
function orderMoves(game: Chess, moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Captures are good
    if (a.captured) scoreA += PIECE_VALUES[a.captured];
    if (b.captured) scoreB += PIECE_VALUES[b.captured];

    // Checks are good
    game.move(a);
    if (game.inCheck()) scoreA += 50;
    game.undo();

    game.move(b);
    if (game.inCheck()) scoreB += 50;
    game.undo();

    // Promotions are very good
    if (a.promotion) scoreA += PIECE_VALUES[a.promotion];
    if (b.promotion) scoreB += PIECE_VALUES[b.promotion];

    return scoreB - scoreA;
  });
}

// Get best move for the AI
export function getBestMove(game: Chess, difficulty: Difficulty = 'intermediate'): Move | null {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;

  // Depth based on difficulty
  const depthMap: Record<Difficulty, number> = {
    beginner: 1,
    intermediate: 3,
    advanced: 4
  };
  const depth = depthMap[difficulty];

  // For beginner, sometimes make random moves
  if (difficulty === 'beginner' && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Order moves for better pruning
  const orderedMoves = orderMoves(game, moves);

  const isMaximizing = game.turn() === 'w';
  let bestMove = orderedMoves[0];
  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const move of orderedMoves) {
    game.move(move);
    const score = minimax(game, depth - 1, -Infinity, Infinity, !isMaximizing);
    game.undo();

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  // Add some randomness for intermediate level
  if (difficulty === 'intermediate' && Math.random() < 0.1) {
    // 10% chance to pick a slightly worse move
    const goodMoves = orderedMoves.filter(m => {
      game.move(m);
      const score = evaluate(game);
      game.undo();
      return isMaximizing ? score >= bestScore - 100 : score <= bestScore + 100;
    });
    if (goodMoves.length > 1) {
      bestMove = goodMoves[Math.floor(Math.random() * goodMoves.length)];
    }
  }

  return bestMove;
}

// Get AI's thinking time (in ms) for more realistic feel
export function getThinkingTime(difficulty: Difficulty): number {
  const baseTime: Record<Difficulty, number> = {
    beginner: 200,
    intermediate: 400,
    advanced: 600
  };
  // Add some randomness
  return baseTime[difficulty] + Math.random() * 200;
}
