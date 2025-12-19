/**
 * KROG Chess Framework - Board Logic Operators
 *
 * The 8 board logic operators:
 * PV (Position Validity), MH (Move History), CS (Check State),
 * LMG (Legal Move Generation), GT (Game Termination),
 * TC (Time Control), PR (Position Repetition), FMC (Fifty Move Counter)
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

import {
  GameState,
  Move,
  Piece,
  Square,
  Color,
  PieceType,
  opponent,
  CSResult,
  LMGResult,
  GTResult,
  PRResult,
  FMCResult,
  FIDERule,
  squareToString
} from './types';
import { PA_Operator, PM_Operator } from './piece-logic';

// ============================================================================
// PV - POSITION VALIDITY
// ============================================================================

/**
 * PV(position) - Validates chess position
 *
 * A valid position must have:
 * - Exactly one king per side
 * - No pawns on 1st or 8th rank
 * - At most 16 pieces per side
 * - Side not to move cannot be giving check
 */
export class PV_Operator {
  /**
   * Evaluate position validity
   */
  evaluate(state: GameState): { valid: boolean; errors: string[]; formula: string } {
    const errors: string[] = [];

    // Count kings
    const whiteKings = state.getPieces('white').filter(p => p.type === 'king').length;
    const blackKings = state.getPieces('black').filter(p => p.type === 'king').length;

    if (whiteKings !== 1) errors.push(`Invalid: ${whiteKings} white kings (must be 1)`);
    if (blackKings !== 1) errors.push(`Invalid: ${blackKings} black kings (must be 1)`);

    // Check pawns not on 1st or 8th rank
    const allPieces = [...state.getPieces('white'), ...state.getPieces('black')];
    const invalidPawns = allPieces.filter(p =>
      p.type === 'pawn' && (p.square.rank === 1 || p.square.rank === 8)
    );
    if (invalidPawns.length > 0) {
      errors.push('Invalid: Pawns on 1st or 8th rank');
    }

    // Check piece counts
    const whitePieces = state.getPieces('white').length;
    const blackPieces = state.getPieces('black').length;
    if (whitePieces > 16) errors.push(`Invalid: ${whitePieces} white pieces (max 16)`);
    if (blackPieces > 16) errors.push(`Invalid: ${blackPieces} black pieces (max 16)`);

    return {
      valid: errors.length === 0,
      errors,
      formula: 'PV(pos) ≡ 1_king_each ∧ valid_pawns ∧ piece_counts'
    };
  }
}

// ============================================================================
// MH - MOVE HISTORY
// ============================================================================

/**
 * MH(state) - Manages and queries move history
 */
export class MH_Operator {
  /**
   * Get move at specific index
   */
  getMoveAt(state: GameState, index: number): Move | null {
    if (index < 0 || index >= state.moveHistory.length) return null;
    return state.moveHistory[index];
  }

  /**
   * Get last move
   */
  getLastMove(state: GameState): Move | null {
    return state.moveHistory.length > 0
      ? state.moveHistory[state.moveHistory.length - 1]
      : null;
  }

  /**
   * Get moves by piece type
   */
  getMovesByPiece(state: GameState, pieceType: PieceType): Move[] {
    return state.moveHistory.filter(m => m.piece.type === pieceType);
  }

  /**
   * Get moves by color
   */
  getMovesByColor(state: GameState, color: Color): Move[] {
    return state.moveHistory.filter(m => m.piece.color === color);
  }

  /**
   * Check if piece has moved
   */
  hasPieceMoved(state: GameState, piece: Piece): boolean {
    return state.moveHistory.some(m =>
      m.piece.type === piece.type &&
      m.piece.color === piece.color &&
      m.from.file === piece.square.file &&
      m.from.rank === piece.square.rank
    );
  }

  /**
   * Get move count
   */
  getMoveCount(state: GameState): number {
    return state.moveHistory.length;
  }

  /**
   * Get PGN notation for history
   */
  toPGN(state: GameState): string {
    let pgn = '';
    state.moveHistory.forEach((move, i) => {
      if (i % 2 === 0) {
        pgn += `${Math.floor(i / 2) + 1}. `;
      }
      pgn += (move.san || squareToString(move.from) + squareToString(move.to)) + ' ';
    });
    return pgn.trim();
  }
}

// ============================================================================
// CS - CHECK STATE
// ============================================================================

/**
 * CS(color) ≡ ∃opponent_piece: PA(opponent_piece, king_position)
 *
 * Evaluates check state for a color
 */
export class CS_Operator {
  private paOperator: PA_Operator;

  constructor() {
    this.paOperator = new PA_Operator();
  }

  /**
   * Evaluate check state
   */
  evaluate(color: Color, state: GameState): CSResult {
    const king = state.getKing(color);
    const opponentPieces = state.getPieces(opponent(color));
    const attackers: Piece[] = [];

    for (const piece of opponentPieces) {
      const paResult = this.paOperator.evaluate(piece, king.square, state);
      if (paResult.attacks) {
        attackers.push(piece);
      }
    }

    const inCheck = attackers.length > 0;

    return {
      inCheck,
      formula: 'CS(color) ≡ ∃opp: PA(opp, king)',
      attackers,
      fideRule: {
        norwegian: { section: '§3.9', text: 'Kongen står i sjakk hvis den er angrepet av en eller flere av motstanderens brikker' },
        english: { section: '3.9', text: 'The king is said to be in check if it is attacked by one or more of the opponent\'s pieces' }
      },
      explanation: inCheck
        ? {
            en: `King is in check from ${attackers.map(a => a.type).join(', ')}`,
            no: `Kongen står i sjakk fra ${attackers.map(a => this.pieceNameNo(a.type)).join(', ')}`
          }
        : { en: 'King is not in check', no: 'Kongen står ikke i sjakk' }
    };
  }

  /**
   * Check if a move would result in check
   */
  wouldBeInCheck(move: Move, state: GameState): boolean {
    // Simulate the move and check
    const simulatedState = state.clone();
    this.applyMove(move, simulatedState);
    return this.evaluate(move.piece.color, simulatedState).inCheck;
  }

  private applyMove(move: Move, state: GameState): void {
    state.board.setPiece(move.from, null);
    state.board.setPiece(move.to, move.piece);
  }

  private pieceNameNo(type: PieceType): string {
    const names: Record<PieceType, string> = {
      king: 'kongen', queen: 'dronningen', rook: 'tårnet',
      bishop: 'løperen', knight: 'springeren', pawn: 'bonden'
    };
    return names[type];
  }
}

// ============================================================================
// LMG - LEGAL MOVE GENERATION
// ============================================================================

/**
 * LMG(color) ≡ {m : PM(m) ∧ ¬CS(color) after m}
 *
 * Generates all legal moves for a color
 */
export class LMG_Operator {
  private pmOperator: PM_Operator;
  private csOperator: CS_Operator;

  constructor() {
    this.pmOperator = new PM_Operator();
    this.csOperator = new CS_Operator();
  }

  /**
   * Generate all legal moves
   */
  evaluate(color: Color, state: GameState): LMGResult {
    const pieces = state.getPieces(color);
    const legalMoves: Move[] = [];

    for (const piece of pieces) {
      const pieceMoves = this.generatePieceMoves(piece, state);
      legalMoves.push(...pieceMoves);
    }

    // Add castling moves
    const castlingMoves = this.generateCastlingMoves(color, state);
    legalMoves.push(...castlingMoves);

    return {
      moves: legalMoves,
      count: legalMoves.length,
      formula: 'LMG(color) ≡ {m : PM(m) ∧ ¬CS(color) after m}'
    };
  }

  /**
   * Generate all legal moves for a piece
   */
  private generatePieceMoves(piece: Piece, state: GameState): Move[] {
    const moves: Move[] = [];

    for (let f = 1; f <= 8; f++) {
      for (let r = 1; r <= 8; r++) {
        const to = { file: f, rank: r };
        const pmResult = this.pmOperator.evaluate(piece, piece.square, to, state);

        if (pmResult.permitted) {
          const move: Move = {
            piece,
            from: piece.square,
            to,
            capture: state.board.getPiece(to) || undefined
          };

          // Check if move leaves king in check
          if (!this.csOperator.wouldBeInCheck(move, state)) {
            // Check for promotion
            if (piece.type === 'pawn') {
              const promotionRank = piece.color === 'white' ? 8 : 1;
              if (to.rank === promotionRank) {
                // Add all promotion options
                for (const promoPiece of ['queen', 'rook', 'bishop', 'knight'] as PieceType[]) {
                  moves.push({ ...move, promotion: promoPiece });
                }
              } else {
                moves.push(move);
              }
            } else {
              moves.push(move);
            }
          }
        }

        // Check en passant
        if (piece.type === 'pawn' && state.enPassantSquare) {
          if (to.file === state.enPassantSquare.file && to.rank === state.enPassantSquare.rank) {
            const epMove: Move = {
              piece,
              from: piece.square,
              to,
              enPassant: true
            };
            if (!this.csOperator.wouldBeInCheck(epMove, state)) {
              moves.push(epMove);
            }
          }
        }
      }
    }

    return moves;
  }

  /**
   * Generate castling moves if legal
   */
  private generateCastlingMoves(color: Color, state: GameState): Move[] {
    const moves: Move[] = [];
    const backRank = color === 'white' ? 1 : 8;
    const king = state.getKing(color);

    // Check kingside castling
    const kingsideKey = `${color}Kingside` as keyof typeof state.castlingRights;
    if (state.castlingRights[kingsideKey]) {
      const move: Move = {
        piece: king,
        from: king.square,
        to: { file: 7, rank: backRank },
        castling: 'kingside'
      };
      // Simplified check - full implementation would use CR operator
      moves.push(move);
    }

    // Check queenside castling
    const queensideKey = `${color}Queenside` as keyof typeof state.castlingRights;
    if (state.castlingRights[queensideKey]) {
      const move: Move = {
        piece: king,
        from: king.square,
        to: { file: 3, rank: backRank },
        castling: 'queenside'
      };
      moves.push(move);
    }

    return moves;
  }

  /**
   * Check if player has any legal moves
   */
  hasLegalMoves(color: Color, state: GameState): boolean {
    return this.evaluate(color, state).count > 0;
  }
}

// ============================================================================
// GT - GAME TERMINATION
// ============================================================================

/**
 * GT(result) ≡ checkmate ∨ stalemate ∨ draw_conditions ∨ resignation
 *
 * Evaluates game termination conditions
 */
export class GT_Operator {
  private csOperator: CS_Operator;
  private lmgOperator: LMG_Operator;
  private prOperator: PR_Operator;
  private fmcOperator: FMC_Operator;

  constructor() {
    this.csOperator = new CS_Operator();
    this.lmgOperator = new LMG_Operator();
    this.prOperator = new PR_Operator();
    this.fmcOperator = new FMC_Operator();
  }

  /**
   * Evaluate game termination
   */
  evaluate(state: GameState): GTResult {
    const currentPlayer = state.currentPlayer;
    const csResult = this.csOperator.evaluate(currentPlayer, state);
    const lmgResult = this.lmgOperator.evaluate(currentPlayer, state);
    const prResult = this.prOperator.evaluate(state);
    const fmcResult = this.fmcOperator.evaluate(state);

    // Checkmate
    if (csResult.inCheck && lmgResult.count === 0) {
      return {
        terminated: true,
        result: 'checkmate',
        winner: opponent(currentPlayer),
        formula: 'GT(checkmate) ≡ CS ∧ LMG = ∅',
        fideRule: {
          norwegian: { section: '§5.2.1', text: 'Spillet er vunnet av spilleren som har satt motstanderens konge sjakkmatt' },
          english: { section: '5.2.1', text: 'The game is won by the player who has checkmated the opponent\'s king' }
        },
        explanation: {
          en: `Checkmate! ${opponent(currentPlayer)} wins`,
          no: `Sjakkmatt! ${opponent(currentPlayer) === 'white' ? 'Hvit' : 'Svart'} vinner`
        }
      };
    }

    // Stalemate
    if (!csResult.inCheck && lmgResult.count === 0) {
      return {
        terminated: true,
        result: 'stalemate',
        winner: 'draw',
        formula: 'GT(stalemate) ≡ ¬CS ∧ LMG = ∅',
        fideRule: {
          norwegian: { section: '§5.2.1', text: 'Spillet er remis hvis spilleren som skal trekke ikke har lovlige trekk og kongen ikke står i sjakk' },
          english: { section: '5.2.1', text: 'The game is drawn when the player to move has no legal move and the king is not in check' }
        },
        explanation: { en: 'Stalemate - draw', no: 'Patt - remis' }
      };
    }

    // Fivefold repetition (automatic draw)
    if (prResult.count >= 5) {
      return {
        terminated: true,
        result: 'fivefold_repetition',
        winner: 'draw',
        formula: 'GT(draw) when PR(position, 5)',
        fideRule: {
          norwegian: { section: '§9.6.1', text: 'Spillet er remis hvis samme stilling har oppstått fem ganger' },
          english: { section: '9.6.1', text: 'The game is drawn if the same position has occurred five times' }
        },
        explanation: { en: 'Fivefold repetition - automatic draw', no: 'Femfoldig gjentakelse - automatisk remis' }
      };
    }

    // Seventy-five move rule (automatic draw)
    if (fmcResult.count >= 150) {
      return {
        terminated: true,
        result: 'seventy_five_move',
        winner: 'draw',
        formula: 'GT(draw) when FMC ≥ 75',
        fideRule: {
          norwegian: { section: '§9.6.2', text: 'Spillet er remis hvis 75 trekk er gjort uten at en bonde har flyttet eller en brikke er tatt' },
          english: { section: '9.6.2', text: 'The game is drawn if 75 moves have been made without a pawn move or capture' }
        },
        explanation: { en: 'Seventy-five move rule - automatic draw', no: 'Syttifem-trekksregelen - automatisk remis' }
      };
    }

    // Insufficient material
    if (this.hasInsufficientMaterial(state)) {
      return {
        terminated: true,
        result: 'insufficient_material',
        winner: 'draw',
        formula: 'GT(draw) when insufficient_material',
        fideRule: {
          norwegian: { section: '§5.2.2', text: 'Spillet er remis hvis det har oppstått en stilling der ingen av spillerne kan sette motstanderens konge matt' },
          english: { section: '5.2.2', text: 'The game is drawn when a position has arisen in which neither player can checkmate the opponent\'s king' }
        },
        explanation: { en: 'Insufficient material - draw', no: 'Utilstrekkelig materiell - remis' }
      };
    }

    // Game continues
    return {
      terminated: false,
      formula: 'GT = false (game continues)',
      fideRule: {
        norwegian: { section: '', text: 'Spillet fortsetter' },
        english: { section: '', text: 'Game continues' }
      },
      explanation: { en: 'Game in progress', no: 'Spillet pågår' }
    };
  }

  /**
   * Check for insufficient material
   */
  private hasInsufficientMaterial(state: GameState): boolean {
    const whitePieces = state.getPieces('white');
    const blackPieces = state.getPieces('black');

    const whiteNonKing = whitePieces.filter(p => p.type !== 'king');
    const blackNonKing = blackPieces.filter(p => p.type !== 'king');

    // King vs King
    if (whiteNonKing.length === 0 && blackNonKing.length === 0) return true;

    // King + Bishop vs King or King + Knight vs King
    if (whiteNonKing.length === 0 && blackNonKing.length === 1) {
      const piece = blackNonKing[0];
      if (piece.type === 'bishop' || piece.type === 'knight') return true;
    }
    if (blackNonKing.length === 0 && whiteNonKing.length === 1) {
      const piece = whiteNonKing[0];
      if (piece.type === 'bishop' || piece.type === 'knight') return true;
    }

    // King + Bishop vs King + Bishop (same color bishops)
    if (whiteNonKing.length === 1 && blackNonKing.length === 1) {
      if (whiteNonKing[0].type === 'bishop' && blackNonKing[0].type === 'bishop') {
        const whiteBishopColor = (whiteNonKing[0].square.file + whiteNonKing[0].square.rank) % 2;
        const blackBishopColor = (blackNonKing[0].square.file + blackNonKing[0].square.rank) % 2;
        if (whiteBishopColor === blackBishopColor) return true;
      }
    }

    return false;
  }
}

// ============================================================================
// TC - TIME CONTROL
// ============================================================================

/**
 * TC(color) - Time control management
 */
export class TC_Operator {
  /**
   * Evaluate time state
   */
  evaluate(
    color: Color,
    timeRemaining: number,
    increment: number = 0
  ): {
    timeRemaining: number;
    hasTime: boolean;
    formula: string;
    explanation: { en: string; no: string };
  } {
    const hasTime = timeRemaining > 0;

    return {
      timeRemaining,
      hasTime,
      formula: 'TC(color) > 0',
      explanation: hasTime
        ? { en: `${Math.floor(timeRemaining / 1000)}s remaining`, no: `${Math.floor(timeRemaining / 1000)}s igjen` }
        : { en: 'Time has expired', no: 'Tiden er utløpt' }
    };
  }

  /**
   * Check for time forfeit
   */
  checkForfeit(color: Color, timeRemaining: number): GTResult | null {
    if (timeRemaining <= 0) {
      return {
        terminated: true,
        result: 'time_forfeit',
        winner: opponent(color),
        formula: 'GT(time_forfeit) when TC(color) = 0',
        fideRule: {
          norwegian: { section: '§6.1', text: 'Hvis en spiller ikke klarer å fullføre det foreskrevne antall trekk i den tildelte tiden, taper spilleren partiet' },
          english: { section: '6.1', text: 'If a player does not complete the prescribed number of moves in the allotted time, the game is lost by that player' }
        },
        explanation: {
          en: `${color} loses on time`,
          no: `${color === 'white' ? 'Hvit' : 'Svart'} taper på tid`
        }
      };
    }
    return null;
  }
}

// ============================================================================
// PR - POSITION REPETITION
// ============================================================================

/**
 * PR(position, n) ≡ count(position in history) ≥ n
 */
export class PR_Operator {
  /**
   * Count position repetitions
   */
  evaluate(state: GameState): PRResult {
    const currentPosition = this.getPositionKey(state);
    const count = state.positionHistory.filter(p => p === currentPosition).length;

    return {
      count,
      positions: state.positionHistory,
      formula: 'PR(position) = count(position in history)'
    };
  }

  /**
   * Generate position key for comparison
   * Includes: piece positions, side to move, castling rights, en passant square
   */
  private getPositionKey(state: GameState): string {
    const pieces: string[] = [];

    for (let r = 1; r <= 8; r++) {
      for (let f = 1; f <= 8; f++) {
        const piece = state.board.getPiece({ file: f, rank: r });
        if (piece) {
          pieces.push(`${piece.color[0]}${piece.type[0]}${f}${r}`);
        }
      }
    }

    const castling = [
      state.castlingRights.whiteKingside ? 'K' : '',
      state.castlingRights.whiteQueenside ? 'Q' : '',
      state.castlingRights.blackKingside ? 'k' : '',
      state.castlingRights.blackQueenside ? 'q' : ''
    ].join('');

    const ep = state.enPassantSquare
      ? squareToString(state.enPassantSquare)
      : '-';

    return `${pieces.join(',')}|${state.currentPlayer}|${castling}|${ep}`;
  }

  /**
   * Check if threefold repetition claim is valid
   */
  canClaimThreefold(state: GameState): boolean {
    return this.evaluate(state).count >= 3;
  }
}

// ============================================================================
// FMC - FIFTY MOVE COUNTER
// ============================================================================

/**
 * FMC() ≡ halfmoves since pawn_move ∨ capture
 */
export class FMC_Operator {
  /**
   * Evaluate fifty move counter
   */
  evaluate(state: GameState): FMCResult {
    return {
      count: state.halfMoveClock,
      formula: 'FMC() = halfmoves since pawn_move ∨ capture'
    };
  }

  /**
   * Check if fifty move rule claim is valid
   */
  canClaimFiftyMove(state: GameState): boolean {
    return state.halfMoveClock >= 100; // 100 half-moves = 50 full moves
  }

  /**
   * Update counter after move
   */
  updateAfterMove(move: Move, currentCount: number): number {
    // Reset on pawn move or capture
    if (move.piece.type === 'pawn' || move.capture) {
      return 0;
    }
    return currentCount + 1;
  }
}

// ============================================================================
// EXPORT ALL BOARD LOGIC OPERATORS
// ============================================================================

export const BoardLogicOperators = {
  PV: PV_Operator,
  MH: MH_Operator,
  CS: CS_Operator,
  LMG: LMG_Operator,
  GT: GT_Operator,
  TC: TC_Operator,
  PR: PR_Operator,
  FMC: FMC_Operator
};

export type BoardLogicOperatorsType = typeof BoardLogicOperators;
