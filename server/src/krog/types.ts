/**
 * KROG Type System for Chess Rules
 *
 * Modal Operators:
 * - P (Permitted): May do
 * - O (Obligated): Must do
 * - F (Forbidden): Must not do
 *
 * T-Types define entity behavior:
 * - T1: Full discretion (can act, not act, or ignore)
 * - T2: Can act or wait, but cannot refuse if commanded
 * - T3: Must engage (cannot ignore), but has discretion in response
 * - T5: Must respond/validate (no discretion)
 * - T6: Must be passive (spectator)
 * - T7: Must prevent (safety systems)
 */

// Modal operators
export type ModalOperator = 'P' | 'O' | 'F';

// T-Types for entities
export type TType = 'T1' | 'T2' | 'T3' | 'T5' | 'T6' | 'T7';

// Piece types
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

// Square notation
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Square = `${File}${Rank}`;

// Move types for KROG classification
export type MoveType =
  | 'normal'
  | 'capture'
  | 'castle_kingside'
  | 'castle_queenside'
  | 'en_passant'
  | 'promotion'
  | 'double_pawn_push';

// FIDE article references
export interface FIDEReference {
  article: string;
  en: string;
  no: string;
}

// KROG formula representation
export interface KROGFormula {
  operator: ModalOperator;
  action: string;
  conditions: string[];
  formula: string;  // Human-readable formula like "P(Nf3) ↔ L_shape ∧ ¬blocked"
}

// Movement rule definition
export interface MovementRule {
  pieceType: PieceType;
  tType: TType;
  fide: FIDEReference;
  krog: KROGFormula;
  patterns: string[];  // Movement pattern descriptions
}

// Special move rule definition
export interface SpecialMoveRule {
  moveType: MoveType;
  tType: TType;
  fide: FIDEReference;
  krog: KROGFormula;
  preconditions: string[];
}

// Move explanation result
export interface MoveExplanation {
  move: string;           // SAN notation (e.g., "Nf3")
  from: Square;
  to: Square;
  pieceType: PieceType;
  moveType: MoveType;
  isLegal: boolean;
  krog: {
    formula: string;      // "P(Nf3) ↔ L_shape(g1, f3) ∧ ¬blocked(f3)"
    operator: ModalOperator;
    tType: TType;
  };
  fide: FIDEReference;
  explanation: {
    en: string;           // English explanation
    no: string;           // Norwegian explanation
  };
  conditions: {
    name: string;
    met: boolean;
    description: string;
  }[];
}

// Illegal move explanation
export interface IllegalMoveExplanation {
  attemptedMove: string;
  from: Square;
  to: Square;
  reason: IllegalMoveReason;
  krog: {
    formula: string;
    violation: string;
  };
  fide: FIDEReference;
  explanation: {
    en: string;
    no: string;
  };
}

export type IllegalMoveReason =
  | 'no_piece'
  | 'wrong_color'
  | 'invalid_pattern'
  | 'path_blocked'
  | 'own_piece_on_target'
  | 'would_be_in_check'
  | 'king_in_check'
  | 'castling_through_check'
  | 'castling_king_moved'
  | 'castling_rook_moved'
  | 'castling_pieces_between'
  | 'en_passant_expired'
  | 'pawn_blocked';

// FIDE Articles for piece movements
export const FIDE_ARTICLES: Record<PieceType, FIDEReference> = {
  k: {
    article: '3.8',
    en: 'The king may move to any adjoining square not attacked by opponent pieces',
    no: 'Kongen kan flyttes til et hvilket som helst tilstøtende felt som ikke er angrepet'
  },
  q: {
    article: '3.4',
    en: 'The queen may move to any square along the file, rank or diagonal on which it stands',
    no: 'Dronningen kan flyttes til et hvilket som helst felt langs linjen, raden eller diagonalene'
  },
  r: {
    article: '3.3',
    en: 'The rook may move to any square along the file or rank on which it stands',
    no: 'Tårnet kan flyttes til et hvilket som helst felt langs linjen eller raden den står på'
  },
  b: {
    article: '3.2',
    en: 'The bishop may move to any square along a diagonal on which it stands',
    no: 'Løperen kan flyttes til et hvilket som helst felt langs diagonalene den står på'
  },
  n: {
    article: '3.5',
    en: 'The knight moves to one of the squares nearest but not on the same rank, file or diagonal',
    no: 'Springeren kan flyttes til ett av feltene nærmest men ikke på samme linje, rad eller diagonal'
  },
  p: {
    article: '3.7',
    en: 'The pawn may move forward to the unoccupied square immediately in front on the same file',
    no: 'Bonden kan flyttes fremover til det ubesatte feltet rett foran på samme linje'
  }
};

// FIDE Articles for special moves
export const FIDE_SPECIAL: Record<string, FIDEReference> = {
  castling: {
    article: '3.8.2',
    en: 'Castling is a move of the king and either rook, counted as a single move',
    no: 'Rokade er et trekk med kongen og et av tårnene, regnet som ett trekk'
  },
  en_passant: {
    article: '3.7.d',
    en: 'A pawn attacking a square crossed by an opponent\'s pawn which has advanced two squares in one move',
    no: 'En bonde som angriper et felt krysset av en motspillers bonde som er flyttet to felt fremover'
  },
  promotion: {
    article: '3.7.e',
    en: 'When a pawn reaches the rank furthest from its starting position it must be exchanged',
    no: 'Når en bonde når raden lengst fra utgangsstillingen må den byttes ut'
  }
};
