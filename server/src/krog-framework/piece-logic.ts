/**
 * KROG Chess Framework - Piece Logic Operators
 *
 * The 8 piece logic operators:
 * PM (Piece Movement), PC (Path Clearance), PA (Piece Attack),
 * NV (Notation Validity), PD (Piece Development),
 * CR (Castling Rights), EP (En Passant), PO (Promotion Obligation)
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

import {
  Piece,
  PieceType,
  Square,
  Move,
  GameState,
  Color,
  opponent,
  PMResult,
  PCResult,
  PAResult,
  CRResult,
  EPResult,
  POResult,
  FIDERule,
  squareToString
} from './types';

// ============================================================================
// FIDE RULES FOR PIECES
// ============================================================================

const FIDE_RULES: Record<PieceType, FIDERule> = {
  king: {
    norwegian: { section: '§3.9', text: 'Kongen kan flyttes til en hvilken som helst tilstøtende rute som ikke er angrepet av en eller flere av motstanderens brikker' },
    english: { section: '3.9', text: 'The king may move to any adjoining square not attacked by one or more of the opponent\'s pieces' }
  },
  queen: {
    norwegian: { section: '§3.4', text: 'Dronningen kan flyttes til en hvilken som helst rute langs linjen, raden eller diagonalen den står på' },
    english: { section: '3.4', text: 'The queen may move to any square along the file, the rank or a diagonal on which it stands' }
  },
  rook: {
    norwegian: { section: '§3.5', text: 'Tårnet kan flyttes til en hvilken som helst rute langs linjen eller raden den står på' },
    english: { section: '3.5', text: 'The rook may move to any square along the file or the rank on which it stands' }
  },
  bishop: {
    norwegian: { section: '§3.4', text: 'Løperen kan flyttes til en hvilken som helst rute langs en av diagonalene den står på' },
    english: { section: '3.4', text: 'The bishop may move to any square along a diagonal on which it stands' }
  },
  knight: {
    norwegian: { section: '§3.6', text: 'Springeren flyttes til en av de nærmeste rutene i forhold til den ruten den står på, men ikke på samme linje, rad eller diagonal' },
    english: { section: '3.6', text: 'The knight may move to one of the squares nearest to that on which it stands but not on the same rank, file or diagonal' }
  },
  pawn: {
    norwegian: { section: '§3.7', text: 'Bonden kan flyttes fremover til den ubbesatte ruten rett foran på samme linje' },
    english: { section: '3.7', text: 'The pawn may move forward to the unoccupied square immediately in front of it on the same file' }
  }
};

// ============================================================================
// PM - PIECE MOVEMENT PERMISSION
// ============================================================================

/**
 * PM(p,s₁,s₂) ≡ P(move) ∧ piece_pattern(p,s₁,s₂) ∧ PC(s₁,s₂)
 *
 * Evaluates if a piece can move from one square to another based on its movement pattern.
 */
export class PM_Operator {
  private pcOperator: PC_Operator;

  constructor() {
    this.pcOperator = new PC_Operator();
  }

  /**
   * Evaluate piece movement permission
   */
  evaluate(piece: Piece, from: Square, to: Square, state: GameState): PMResult {
    // Check if squares are the same
    if (from.file === to.file && from.rank === to.rank) {
      return {
        permitted: false,
        formula: 'PM(p,s,s) ≡ false (same square)',
        patternValid: false,
        pathClear: false,
        fideRule: FIDE_RULES[piece.type],
        explanation: {
          en: 'Cannot move to the same square',
          no: 'Kan ikke flytte til samme rute'
        }
      };
    }

    // Check piece-specific movement pattern
    const patternValid = this.checkPiecePattern(piece, from, to, state);

    // Check path clearance for sliding pieces
    const isSliding = ['queen', 'rook', 'bishop'].includes(piece.type);
    const pcResult = isSliding ? this.pcOperator.evaluate(from, to, state) : { clear: true, blockedBy: null, path: [] };
    const pathClear = pcResult.clear;

    // Check destination square
    const destPiece = state.board.getPiece(to);
    const canLand = destPiece === null || destPiece.color !== piece.color;

    const permitted = patternValid && pathClear && canLand;

    return {
      permitted,
      formula: `PM(${piece.type},${squareToString(from)},${squareToString(to)}) ≡ pattern ∧ PC ∧ ¬self_occupied`,
      patternValid,
      pathClear,
      fideRule: FIDE_RULES[piece.type],
      explanation: permitted
        ? { en: `${piece.type} can move to ${squareToString(to)}`, no: `${this.pieceNameNo(piece.type)} kan flytte til ${squareToString(to)}` }
        : this.getFailureExplanation(piece, patternValid, pathClear, canLand, pcResult.blockedBy)
    };
  }

  /**
   * Check if movement follows piece's pattern
   */
  private checkPiecePattern(piece: Piece, from: Square, to: Square, state: GameState): boolean {
    const df = to.file - from.file;
    const dr = to.rank - from.rank;
    const adf = Math.abs(df);
    const adr = Math.abs(dr);

    switch (piece.type) {
      case 'king':
        return adf <= 1 && adr <= 1;

      case 'queen':
        return this.isDiagonal(from, to) || this.isStraight(from, to);

      case 'rook':
        return this.isStraight(from, to);

      case 'bishop':
        return this.isDiagonal(from, to);

      case 'knight':
        return (adf === 2 && adr === 1) || (adf === 1 && adr === 2);

      case 'pawn':
        return this.checkPawnPattern(piece, from, to, state);

      default:
        return false;
    }
  }

  /**
   * Check pawn movement pattern
   */
  private checkPawnPattern(piece: Piece, from: Square, to: Square, state: GameState): boolean {
    const direction = piece.color === 'white' ? 1 : -1;
    const startRank = piece.color === 'white' ? 2 : 7;
    const df = to.file - from.file;
    const dr = to.rank - from.rank;
    const destPiece = state.board.getPiece(to);

    // Forward move (non-capturing)
    if (df === 0 && dr === direction && destPiece === null) {
      return true;
    }

    // Double move from starting position
    if (df === 0 && dr === 2 * direction && from.rank === startRank && destPiece === null) {
      // Check intermediate square is clear
      const midSquare = { file: from.file, rank: from.rank + direction };
      return state.board.isEmpty(midSquare);
    }

    // Diagonal capture
    if (Math.abs(df) === 1 && dr === direction) {
      // Regular capture
      if (destPiece !== null && destPiece.color !== piece.color) {
        return true;
      }
      // En passant check done separately
      if (state.enPassantSquare &&
          to.file === state.enPassantSquare.file &&
          to.rank === state.enPassantSquare.rank) {
        return true;
      }
    }

    return false;
  }

  private isDiagonal(from: Square, to: Square): boolean {
    return Math.abs(to.file - from.file) === Math.abs(to.rank - from.rank) &&
           from.file !== to.file;
  }

  private isStraight(from: Square, to: Square): boolean {
    return (from.file === to.file || from.rank === to.rank) &&
           !(from.file === to.file && from.rank === to.rank);
  }

  private pieceNameNo(type: PieceType): string {
    const names: Record<PieceType, string> = {
      king: 'Kongen', queen: 'Dronningen', rook: 'Tårnet',
      bishop: 'Løperen', knight: 'Springeren', pawn: 'Bonden'
    };
    return names[type];
  }

  private getFailureExplanation(
    piece: Piece,
    patternValid: boolean,
    pathClear: boolean,
    canLand: boolean,
    blocker: Piece | null
  ): { en: string; no: string } {
    if (!patternValid) {
      return {
        en: `${piece.type} cannot move in that pattern`,
        no: `${this.pieceNameNo(piece.type)} kan ikke flytte i det mønsteret`
      };
    }
    if (!pathClear && blocker) {
      return {
        en: `Path blocked by ${blocker.type}`,
        no: `Bane blokkert av ${this.pieceNameNo(blocker.type).toLowerCase()}`
      };
    }
    if (!canLand) {
      return {
        en: 'Cannot capture own piece',
        no: 'Kan ikke slå egen brikke'
      };
    }
    return { en: 'Move not permitted', no: 'Trekk ikke tillatt' };
  }
}

// ============================================================================
// PC - PATH CLEARANCE
// ============================================================================

/**
 * PC(s₁,s₂) ≡ ∀s ∈ path(s₁,s₂): empty(s)
 *
 * Checks if path between two squares is clear (for sliding pieces)
 */
export class PC_Operator {
  /**
   * Evaluate path clearance
   */
  evaluate(from: Square, to: Square, state: GameState): PCResult {
    const path = this.getPath(from, to);
    let blockedBy: Piece | null = null;

    for (const square of path) {
      const piece = state.board.getPiece(square);
      if (piece !== null) {
        blockedBy = piece;
        break;
      }
    }

    return {
      clear: blockedBy === null,
      blockedBy,
      path,
      formula: 'PC(s₁,s₂) ≡ ∀s ∈ path: empty(s)'
    };
  }

  /**
   * Get all squares between from and to (exclusive)
   */
  private getPath(from: Square, to: Square): Square[] {
    const path: Square[] = [];
    const df = Math.sign(to.file - from.file);
    const dr = Math.sign(to.rank - from.rank);

    // If same square or not a straight/diagonal path, return empty
    if ((df === 0 && dr === 0) ||
        (df !== 0 && dr !== 0 && Math.abs(to.file - from.file) !== Math.abs(to.rank - from.rank))) {
      return path;
    }

    let f = from.file + df;
    let r = from.rank + dr;

    // Safety limit to prevent infinite loops
    let iterations = 0;
    const maxIterations = 8;

    while ((f !== to.file || r !== to.rank) && iterations < maxIterations) {
      path.push({ file: f, rank: r });
      f += df;
      r += dr;
      iterations++;
    }

    return path;
  }
}

// ============================================================================
// PA - PIECE ATTACK
// ============================================================================

/**
 * PA(piece,square) ≡ PM(piece,piece.square,square) ∧ (empty(square) ∨ opponent(square))
 *
 * Determines if a piece attacks a given square
 */
export class PA_Operator {
  private pmOperator: PM_Operator;

  constructor() {
    this.pmOperator = new PM_Operator();
  }

  /**
   * Check if piece attacks a square
   */
  evaluate(piece: Piece, target: Square, state: GameState): PAResult {
    // Special case for pawns - they attack diagonally, not forward
    if (piece.type === 'pawn') {
      return this.evaluatePawnAttack(piece, target);
    }

    const pmResult = this.pmOperator.evaluate(piece, piece.square, target, state);

    return {
      attacks: pmResult.permitted || pmResult.patternValid,
      attackedSquares: pmResult.patternValid ? [target] : [],
      formula: 'PA(piece,square) ≡ can_reach(piece,square)'
    };
  }

  /**
   * Get all squares attacked by a piece
   */
  getAttackedSquares(piece: Piece, state: GameState): Square[] {
    const attacked: Square[] = [];

    for (let f = 1; f <= 8; f++) {
      for (let r = 1; r <= 8; r++) {
        const target = { file: f, rank: r };
        if (this.evaluate(piece, target, state).attacks) {
          attacked.push(target);
        }
      }
    }

    return attacked;
  }

  /**
   * Pawn attacks diagonally only
   */
  private evaluatePawnAttack(piece: Piece, target: Square): PAResult {
    const direction = piece.color === 'white' ? 1 : -1;
    const df = Math.abs(target.file - piece.square.file);
    const dr = target.rank - piece.square.rank;

    const attacks = df === 1 && dr === direction;

    return {
      attacks,
      attackedSquares: attacks ? [target] : [],
      formula: 'PA(pawn,square) ≡ diagonal_forward(pawn,square)'
    };
  }
}

// ============================================================================
// CR - CASTLING RIGHTS
// ============================================================================

/**
 * CR(side) ≡ ¬moved(king) ∧ ¬moved(rook) ∧ ¬CS(self) ∧ PC(king,rook) ∧ ∀s∈path: ¬PA(opp,s)
 *
 * Evaluates if castling is allowed
 */
export class CR_Operator {
  private pcOperator: PC_Operator;
  private paOperator: PA_Operator;

  constructor() {
    this.pcOperator = new PC_Operator();
    this.paOperator = new PA_Operator();
  }

  /**
   * Evaluate castling rights
   */
  evaluate(side: 'kingside' | 'queenside', color: Color, state: GameState): CRResult {
    const backRank = color === 'white' ? 1 : 8;
    const kingFile = 5; // e-file
    const rookFile = side === 'kingside' ? 8 : 1; // h or a file

    const kingSquare = { file: kingFile, rank: backRank };
    const rookSquare = { file: rookFile, rank: backRank };

    // Check conditions
    const castlingKey = `${color}${side === 'kingside' ? 'Kingside' : 'Queenside'}` as keyof typeof state.castlingRights;
    const rightsIntact = state.castlingRights[castlingKey];

    // Simplified check - in real implementation, track if pieces have moved
    const kingNotMoved = rightsIntact;
    const rookNotMoved = rightsIntact;

    // Check if in check (simplified - real implementation uses CS operator)
    const notInCheck = true; // Placeholder

    // Check path clearance
    const pathResult = this.pcOperator.evaluate(kingSquare, rookSquare, state);
    const pathClear = pathResult.clear;

    // Check if king passes through attacked squares
    const pathSafe = this.checkPathSafe(color, side, backRank, state);

    const conditions = {
      kingNotMoved,
      rookNotMoved,
      notInCheck,
      pathClear,
      pathSafe
    };

    const allowed = Object.values(conditions).every(c => c);

    return {
      allowed,
      formula: 'CR(side) ≡ ¬moved(king) ∧ ¬moved(rook) ∧ ¬CS ∧ PC ∧ path_safe',
      conditions,
      fideRule: {
        norwegian: { section: '§3.8.2', text: 'Rokade er et trekk av kongen og et av spillerens egne tårn' },
        english: { section: '3.8.b', text: 'Castling is a move of the king and either rook' }
      },
      explanation: allowed
        ? { en: `${side} castling is available`, no: `${side === 'kingside' ? 'Kort' : 'Lang'} rokade er tilgjengelig` }
        : this.getCastlingFailureExplanation(conditions, side)
    };
  }

  /**
   * Check if king's path is safe from attacks
   */
  private checkPathSafe(color: Color, side: 'kingside' | 'queenside', rank: number, state: GameState): boolean {
    const startFile = 5; // e-file
    const endFile = side === 'kingside' ? 7 : 3; // g or c file
    const direction = side === 'kingside' ? 1 : -1;

    const opponentPieces = state.getPieces(opponent(color));

    for (let file = startFile; file !== endFile + direction; file += direction) {
      const square = { file, rank };

      for (const piece of opponentPieces) {
        if (this.paOperator.evaluate(piece, square, state).attacks) {
          return false;
        }
      }
    }

    return true;
  }

  private getCastlingFailureExplanation(
    conditions: CRResult['conditions'],
    side: 'kingside' | 'queenside'
  ): { en: string; no: string } {
    if (!conditions.kingNotMoved) {
      return { en: 'King has moved', no: 'Kongen har flyttet' };
    }
    if (!conditions.rookNotMoved) {
      return { en: 'Rook has moved', no: 'Tårnet har flyttet' };
    }
    if (!conditions.notInCheck) {
      return { en: 'Cannot castle while in check', no: 'Kan ikke rokere mens du står i sjakk' };
    }
    if (!conditions.pathClear) {
      return { en: 'Path between king and rook is blocked', no: 'Banen mellom kongen og tårnet er blokkert' };
    }
    if (!conditions.pathSafe) {
      return { en: 'King would pass through attacked square', no: 'Kongen ville passere gjennom angrepet rute' };
    }
    return { en: 'Castling not available', no: 'Rokade ikke tilgjengelig' };
  }
}

// ============================================================================
// EP - EN PASSANT VALIDITY
// ============================================================================

/**
 * EP(s) ≡ F[≤1](opponent_double_pawn) ∧ adjacent_pawn ∧ 5th_rank
 *
 * Validates en passant capture
 */
export class EP_Operator {
  /**
   * Evaluate en passant validity
   */
  evaluate(captureSquare: Square, pawn: Piece, state: GameState): EPResult {
    const lastMove = state.getLastMove();
    const enPassantRank = pawn.color === 'white' ? 5 : 4;
    const captureRank = pawn.color === 'white' ? 6 : 3;

    // Check if en passant square exists and matches
    if (!state.enPassantSquare) {
      return this.invalidResult('No en passant available');
    }

    // Check pawn is on correct rank
    if (pawn.square.rank !== enPassantRank) {
      return this.invalidResult('Pawn not on en passant rank');
    }

    // Check capture square matches en passant square
    if (captureSquare.file !== state.enPassantSquare.file ||
        captureSquare.rank !== state.enPassantSquare.rank) {
      return this.invalidResult('Not the en passant square');
    }

    // Check pawn is adjacent
    if (Math.abs(pawn.square.file - captureSquare.file) !== 1) {
      return this.invalidResult('Pawn not adjacent to target');
    }

    // Verify last move was double pawn push
    const valid = lastMove !== null &&
                  lastMove.piece.type === 'pawn' &&
                  Math.abs(lastMove.to.rank - lastMove.from.rank) === 2 &&
                  lastMove.to.file === captureSquare.file;

    return {
      valid,
      formula: 'EP(s) ≡ F[≤1](opp_double) ∧ adjacent ∧ 5th_rank',
      temporal: 'X(opponent_double_pawn_move)',
      captureSquare: valid ? captureSquare : null,
      fideRule: {
        norwegian: { section: '§3.7d', text: 'En bonde som står på 5. rad kan ta en motstanders bonde som nettopp har flyttet to ruter fremover' },
        english: { section: '3.7d', text: 'A pawn occupying a square on the same rank as an enemy pawn which has just advanced two squares may capture it en passant' }
      },
      explanation: valid
        ? { en: 'En passant capture is valid', no: 'En passant-slag er gyldig' }
        : { en: 'En passant not available', no: 'En passant ikke tilgjengelig' }
    };
  }

  private invalidResult(reason: string): EPResult {
    return {
      valid: false,
      formula: 'EP(s) ≡ false',
      temporal: 'expired',
      captureSquare: null,
      fideRule: {
        norwegian: { section: '§3.7d', text: 'En bonde som står på 5. rad kan ta en motstanders bonde' },
        english: { section: '3.7d', text: 'A pawn may capture en passant' }
      },
      explanation: { en: reason, no: reason }
    };
  }
}

// ============================================================================
// PO - PROMOTION OBLIGATION
// ============================================================================

/**
 * PO(pawn,8th) ≡ O(promote_to ∈ {Q,R,B,N})
 *
 * Determines promotion obligation
 */
export class PO_Operator {
  /**
   * Evaluate promotion obligation
   */
  evaluate(pawn: Piece, toSquare: Square): POResult {
    const promotionRank = pawn.color === 'white' ? 8 : 1;
    const required = pawn.type === 'pawn' && toSquare.rank === promotionRank;

    return {
      required,
      formula: 'PO(pawn,8th) ≡ O(promote_to ∈ {Q,R,B,N})',
      validPromotions: required ? ['queen', 'rook', 'bishop', 'knight'] : [],
      fideRule: {
        norwegian: { section: '§3.7e', text: 'Når en bonde når raden lengst borte må den byttes ut med en dronning, tårn, løper eller springer' },
        english: { section: '3.7e', text: 'When a pawn reaches the rank furthest from its starting position it must be exchanged for a queen, rook, bishop or knight' }
      },
      explanation: required
        ? { en: 'Pawn must be promoted', no: 'Bonden må forfremmes' }
        : { en: 'No promotion required', no: 'Ingen forfremmelse nødvendig' }
    };
  }
}

// ============================================================================
// NV - NOTATION VALIDITY
// ============================================================================

/**
 * NV(notation) - Validates chess notation
 */
export class NV_Operator {
  private sanPattern = /^([KQRBN])?([a-h])?([1-8])?(x)?([a-h][1-8])(=[QRBN])?(\+|#)?$/;
  private uciPattern = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

  /**
   * Validate notation string
   */
  evaluate(notation: string, format: 'san' | 'uci' = 'san'): { valid: boolean; parsed: any } {
    if (format === 'san') {
      // Handle special cases
      if (notation === 'O-O' || notation === 'O-O-O') {
        return { valid: true, parsed: { castling: notation === 'O-O' ? 'kingside' : 'queenside' } };
      }
      const match = this.sanPattern.exec(notation);
      return { valid: match !== null, parsed: match };
    }

    if (format === 'uci') {
      const match = this.uciPattern.test(notation);
      return { valid: match, parsed: notation };
    }

    return { valid: false, parsed: null };
  }
}

// ============================================================================
// PD - PIECE DEVELOPMENT
// ============================================================================

/**
 * PD(piece) - Evaluates piece development status
 */
export class PD_Operator {
  /**
   * Check if piece is developed from starting position
   */
  evaluate(piece: Piece): { developed: boolean; formula: string } {
    const startingPositions: Record<PieceType, { white: number[], black: number[] }> = {
      king: { white: [1], black: [8] },
      queen: { white: [1], black: [8] },
      rook: { white: [1], black: [8] },
      bishop: { white: [1], black: [8] },
      knight: { white: [1], black: [8] },
      pawn: { white: [2], black: [7] }
    };

    const startRanks = startingPositions[piece.type][piece.color];
    const developed = !startRanks.includes(piece.square.rank);

    return {
      developed,
      formula: `PD(${piece.type}) ≡ rank ≠ starting_rank`
    };
  }
}

// ============================================================================
// EXPORT ALL PIECE LOGIC OPERATORS
// ============================================================================

export const PieceLogicOperators = {
  PM: PM_Operator,
  PC: PC_Operator,
  PA: PA_Operator,
  CR: CR_Operator,
  EP: EP_Operator,
  PO: PO_Operator,
  NV: NV_Operator,
  PD: PD_Operator
};

export type PieceLogicOperatorsType = typeof PieceLogicOperators;
