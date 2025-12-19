/**
 * KROG Chess Framework - Type Definitions
 *
 * Complete type system for the KROG mathematical framework
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

// ============================================================================
// BASIC CHESS TYPES
// ============================================================================

export type Color = 'white' | 'black';

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Square {
  file: number;  // 1-8 (a=1, h=8)
  rank: number;  // 1-8
}

export interface Piece {
  type: PieceType;
  color: Color;
  square: Square;
  hasMoved: boolean;
}

export interface Move {
  piece: Piece;
  from: Square;
  to: Square;
  capture?: Piece;
  promotion?: PieceType;
  castling?: 'kingside' | 'queenside';
  enPassant?: boolean;
  san?: string;
  uci?: string;
}

export interface CastlingRights {
  whiteKingside: boolean;
  whiteQueenside: boolean;
  blackKingside: boolean;
  blackQueenside: boolean;
}

// ============================================================================
// GAME STATE
// ============================================================================

export interface Board {
  squares: (Piece | null)[][];
  getPiece(square: Square): Piece | null;
  setPiece(square: Square, piece: Piece | null): void;
  isEmpty(square: Square): boolean;
  isOccupiedBy(square: Square, color: Color): boolean;
}

export interface GameState {
  board: Board;
  currentPlayer: Color;
  moveHistory: Move[];
  halfMoveClock: number;
  fullMoveNumber: number;
  castlingRights: CastlingRights;
  enPassantSquare: Square | null;
  positionHistory: string[];

  // Helper methods
  getKing(color: Color): Piece;
  getRook(color: Color, side: 'kingside' | 'queenside'): Piece | null;
  getPieces(color: Color): Piece[];
  getLastMove(): Move | null;
  clone(): GameState;
}

// ============================================================================
// R-TYPE CLASSIFICATIONS
// ============================================================================

export type RType =
  | 'R1_asymmetric'           // Pawn moves (direction matters)
  | 'R2_intransitive'         // Single step moves
  | 'R3_path_dependent'       // Sliding pieces requiring clear path
  | 'R4_capture_only'         // Moves that must capture
  | 'R5_non_capture'          // Moves that cannot capture
  | 'R6_first_move_special'   // Special first move rules
  | 'R7_temporal_window'      // Time-limited actions
  | 'R8_mandatory_transformation' // Required piece change
  | 'R9_compound_move'        // Multiple piece movement
  | 'R10_conditional'         // Context-dependent rules
  | 'R11_discrete_jump'       // Non-path-following movement
  | 'R12_state_dependent'     // Based on game state
  | 'R13_terminal_state'      // Game-ending conditions
  | 'R14_repetition'          // Position repetition rules
  | 'R15_counter_based';      // Move counter rules

// ============================================================================
// KROG OPERATOR TYPES
// ============================================================================

export type CoreOperator = 'P' | 'O' | 'F' | 'C' | 'L' | 'W' | 'B' | 'I' | 'D';

export type PieceLogicOperator = 'PM' | 'PC' | 'PA' | 'NV' | 'PD' | 'CR' | 'EP' | 'PO';

export type BoardLogicOperator = 'PV' | 'MH' | 'CS' | 'LMG' | 'GT' | 'TC' | 'PR' | 'FMC';

export type NotationOperator = 'PSA' | 'PLA' | 'PUCI' | 'PVN' | 'GN' | 'NC';

export type TemporalOperator = 'G' | 'F_temporal' | 'X' | 'U' | 'R_temporal';

export type KROGOperator =
  | CoreOperator
  | PieceLogicOperator
  | BoardLogicOperator
  | NotationOperator
  | TemporalOperator;

// ============================================================================
// FIDE RULES
// ============================================================================

export interface FIDERule {
  norwegian: {
    section: string;
    text: string;
  };
  english: {
    section: string;
    text: string;
  };
}

// ============================================================================
// KROG VALIDATION RESULTS
// ============================================================================

export interface PMResult {
  permitted: boolean;
  formula: string;
  patternValid: boolean;
  pathClear: boolean;
  fideRule: FIDERule;
  explanation: { en: string; no: string };
}

export interface PCResult {
  clear: boolean;
  blockedBy: Piece | null;
  path: Square[];
  formula: string;
}

export interface PAResult {
  attacks: boolean;
  attackedSquares: Square[];
  formula: string;
}

export interface CRResult {
  allowed: boolean;
  formula: string;
  conditions: {
    kingNotMoved: boolean;
    rookNotMoved: boolean;
    notInCheck: boolean;
    pathClear: boolean;
    pathSafe: boolean;
  };
  fideRule: FIDERule;
  explanation: { en: string; no: string };
}

export interface EPResult {
  valid: boolean;
  formula: string;
  temporal: string;
  captureSquare: Square | null;
  fideRule: FIDERule;
  explanation: { en: string; no: string };
}

export interface POResult {
  required: boolean;
  formula: string;
  validPromotions: PieceType[];
  fideRule: FIDERule;
  explanation: { en: string; no: string };
}

export interface CSResult {
  inCheck: boolean;
  formula: string;
  attackers: Piece[];
  fideRule: FIDERule;
  explanation: { en: string; no: string };
}

export interface LMGResult {
  moves: Move[];
  count: number;
  formula: string;
}

export interface GTResult {
  terminated: boolean;
  result?: 'checkmate' | 'stalemate' | 'draw_agreement' | 'resignation' |
           'time_forfeit' | 'threefold_repetition' | 'fifty_move' |
           'insufficient_material' | 'fivefold_repetition' | 'seventy_five_move';
  winner?: Color | 'draw';
  formula: string;
  fideRule: FIDERule;
  explanation: { en: string; no: string };
}

export interface PRResult {
  count: number;
  positions: string[];
  formula: string;
}

export interface FMCResult {
  count: number;
  formula: string;
}

// ============================================================================
// NOTATION RESULTS
// ============================================================================

export interface NotationParseResult {
  valid: boolean;
  move?: Move;
  error?: string;
  format: 'san' | 'lan' | 'uci' | 'voice';
}

export interface NotationGenerateResult {
  san: string;
  lan: string;
  uci: string;
  voice: { en: string; no: string };
}

// ============================================================================
// KROG VALIDATION
// ============================================================================

export interface KROGValidation {
  valid: boolean;
  operators: KROGOperator[];
  formula: string;
  rtype: RType | null;
  temporal?: string;
  explanation: { en: string; no: string };
  fideRule: FIDERule;
  json: KROGRuleJSON;
}

export interface KROGRuleJSON {
  id: string;
  valid: boolean;
  operators: string[];
  formula: string;
  rtype: RType | null;
  temporal?: string;
  explanation: { en: string; no: string };
  fide: {
    norwegian: string;
    english: string;
  };
  timestamp: string;
}

// ============================================================================
// RULE DATABASE TYPES
// ============================================================================

export interface KROGRule {
  id: string;
  name: { en: string; no: string };
  operators: KROGOperator[];
  formula: string;
  rtype: RType;
  temporal?: string;
  fide: FIDERule;
  voice: {
    en: string[];
    no: string[];
  };
  validate: (move: Move, state: GameState) => KROGValidation;
}

export interface RulesDatabase {
  version: string;
  rules: KROGRule[];
  getRuleById(id: string): KROGRule | undefined;
  getRulesByOperator(operator: KROGOperator): KROGRule[];
  getRulesByRType(rtype: RType): KROGRule[];
}

// ============================================================================
// ACTION TYPES (for Core Operators)
// ============================================================================

export interface Action {
  type: 'move' | 'claim' | 'resign' | 'offer_draw' | 'accept_draw' | 'decline_draw';
  move?: Move;
  claimType?: 'draw' | 'time_forfeit';
}

export function opponent(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

export function squareToString(square: Square): string {
  const files = 'abcdefgh';
  return `${files[square.file - 1]}${square.rank}`;
}

export function stringToSquare(s: string): Square {
  const files = 'abcdefgh';
  return {
    file: files.indexOf(s[0]) + 1,
    rank: parseInt(s[1])
  };
}

export function pieceSymbol(piece: Piece): string {
  const symbols: Record<PieceType, string> = {
    king: 'K',
    queen: 'Q',
    rook: 'R',
    bishop: 'B',
    knight: 'N',
    pawn: ''
  };
  return symbols[piece.type];
}
