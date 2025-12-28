/**
 * KROG Chess Framework - R-Type Classifier
 *
 * Classifies chess moves and rules into their appropriate R-types.
 * R-types categorize the relational properties of chess moves.
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

import { Move, GameState, RType, PieceType } from './types';

// ============================================================================
// R-TYPE DEFINITIONS
// ============================================================================

export interface RTypeDefinition {
  id: RType;
  name: string;
  description: { en: string; no: string };
  examples: string[];
  formula: string;
}

export const RTypeDefinitions: Record<RType, RTypeDefinition> = {
  R1_asymmetric: {
    id: 'R1_asymmetric',
    name: 'Asymmetric',
    description: {
      en: 'Direction matters - cannot be reversed',
      no: 'Retning betyr noe - kan ikke reverseres'
    },
    examples: ['Pawn movement', 'Castling'],
    formula: 'R(a,b) ⇏ R(b,a)'
  },

  R2_intransitive: {
    id: 'R2_intransitive',
    name: 'Intransitive',
    description: {
      en: 'Single step, no chaining',
      no: 'Enkelt steg, ingen kjeding'
    },
    examples: ['King movement'],
    formula: 'R(a,b) ∧ R(b,c) ⇏ R(a,c)'
  },

  R3_path_dependent: {
    id: 'R3_path_dependent',
    name: 'Path Dependent',
    description: {
      en: 'Requires clear path between squares',
      no: 'Krever klar bane mellom ruter'
    },
    examples: ['Queen', 'Rook', 'Bishop movement'],
    formula: 'PM(p,s₁,s₂) ∧ PC(s₁,s₂)'
  },

  R4_capture_only: {
    id: 'R4_capture_only',
    name: 'Capture Only',
    description: {
      en: 'Move only valid when capturing',
      no: 'Trekk kun gyldig ved slag'
    },
    examples: ['Pawn diagonal capture', 'En passant'],
    formula: 'PM(p,s₁,s₂) ⇔ capture(s₂)'
  },

  R5_non_capture: {
    id: 'R5_non_capture',
    name: 'Non-Capture',
    description: {
      en: 'Move only valid when not capturing',
      no: 'Trekk kun gyldig uten slag'
    },
    examples: ['Pawn forward move'],
    formula: 'PM(p,s₁,s₂) ⇔ ¬capture(s₂)'
  },

  R6_first_move_special: {
    id: 'R6_first_move_special',
    name: 'First Move Special',
    description: {
      en: 'Different rules on first move',
      no: 'Andre regler ved første trekk'
    },
    examples: ['Pawn double move'],
    formula: 'PM(p,s₁,s₂) when ¬moved(p)'
  },

  R7_temporal_window: {
    id: 'R7_temporal_window',
    name: 'Temporal Window',
    description: {
      en: 'Time-limited action',
      no: 'Tidsbegrenset handling'
    },
    examples: ['En passant capture'],
    formula: 'F[≤1](action)'
  },

  R8_mandatory_transformation: {
    id: 'R8_mandatory_transformation',
    name: 'Mandatory Transformation',
    description: {
      en: 'Required piece change',
      no: 'Påkrevd brikkeskifte'
    },
    examples: ['Pawn promotion'],
    formula: 'O(transform) when condition'
  },

  R9_compound_move: {
    id: 'R9_compound_move',
    name: 'Compound Move',
    description: {
      en: 'Multiple pieces move together',
      no: 'Flere brikker flytter sammen'
    },
    examples: ['Castling'],
    formula: 'move(king) ∧ move(rook)'
  },

  R10_conditional: {
    id: 'R10_conditional',
    name: 'Conditional',
    description: {
      en: 'Context-dependent rules',
      no: 'Kontekstavhengige regler'
    },
    examples: ['Check response', 'Pin restrictions'],
    formula: 'condition → rule'
  },

  R11_discrete_jump: {
    id: 'R11_discrete_jump',
    name: 'Discrete Jump',
    description: {
      en: 'Non-path-following movement',
      no: 'Bevegelse uten banetilknytning'
    },
    examples: ['Knight movement'],
    formula: 'PM(knight,s₁,s₂) - path irrelevant'
  },

  R12_state_dependent: {
    id: 'R12_state_dependent',
    name: 'State Dependent',
    description: {
      en: 'Based on game state',
      no: 'Basert på spilltilstand'
    },
    examples: ['Castling rights', 'Draw claims'],
    formula: 'state(condition) → permission'
  },

  R13_terminal_state: {
    id: 'R13_terminal_state',
    name: 'Terminal State',
    description: {
      en: 'Game-ending conditions',
      no: 'Spillavsluttende betingelser'
    },
    examples: ['Checkmate', 'Stalemate'],
    formula: 'GT(condition)'
  },

  R14_repetition: {
    id: 'R14_repetition',
    name: 'Repetition',
    description: {
      en: 'Position repetition rules',
      no: 'Stillingsgjentakelsesregler'
    },
    examples: ['Threefold repetition', 'Fivefold repetition'],
    formula: 'PR(position, n)'
  },

  R15_counter_based: {
    id: 'R15_counter_based',
    name: 'Counter Based',
    description: {
      en: 'Move counter rules',
      no: 'Trekkteller-regler'
    },
    examples: ['Fifty-move rule', 'Seventy-five-move rule'],
    formula: 'FMC() ≥ n'
  }
};

// ============================================================================
// R-TYPE CLASSIFIER
// ============================================================================

/**
 * Classifies chess moves and rules into R-types
 */
export class RTypeClassifier {
  /**
   * Classify a move's R-type
   */
  classifyMove(move: Move, state: GameState): RType {
    // Castling
    if (move.castling) {
      return 'R9_compound_move';
    }

    // Pawn moves
    if (move.piece.type === 'pawn') {
      return this.classifyPawnMove(move, state);
    }

    // Knight
    if (move.piece.type === 'knight') {
      return 'R11_discrete_jump';
    }

    // King
    if (move.piece.type === 'king') {
      return 'R2_intransitive';
    }

    // Sliding pieces (Queen, Rook, Bishop)
    if (['queen', 'rook', 'bishop'].includes(move.piece.type)) {
      return 'R3_path_dependent';
    }

    return 'R10_conditional';
  }

  /**
   * Classify pawn move R-type
   */
  private classifyPawnMove(move: Move, state: GameState): RType {
    const df = Math.abs(move.to.file - move.from.file);
    const dr = Math.abs(move.to.rank - move.from.rank);

    // En passant
    if (move.enPassant) {
      return 'R7_temporal_window';
    }

    // Promotion
    if (move.promotion) {
      return 'R8_mandatory_transformation';
    }

    // Double move from starting position
    if (dr === 2) {
      return 'R6_first_move_special';
    }

    // Capture
    if (df === 1 && move.capture) {
      return 'R4_capture_only';
    }

    // Forward move (non-capture)
    if (df === 0) {
      return 'R5_non_capture';
    }

    // Default pawn (asymmetric)
    return 'R1_asymmetric';
  }

  /**
   * Classify a rule by its type
   */
  classifyRule(ruleId: string): RType {
    const ruleTypeMap: Record<string, RType> = {
      // Piece movements
      'pawn_forward': 'R5_non_capture',
      'pawn_double': 'R6_first_move_special',
      'pawn_capture': 'R4_capture_only',
      'pawn_promotion': 'R8_mandatory_transformation',
      'knight_movement': 'R11_discrete_jump',
      'king_movement': 'R2_intransitive',
      'bishop_movement': 'R3_path_dependent',
      'rook_movement': 'R3_path_dependent',
      'queen_movement': 'R3_path_dependent',

      // Special moves
      'castling_kingside': 'R9_compound_move',
      'castling_queenside': 'R9_compound_move',
      'en_passant': 'R7_temporal_window',

      // Game state
      'check_response': 'R10_conditional',
      'castling_rights': 'R12_state_dependent',
      'pin_restriction': 'R10_conditional',

      // Termination
      'checkmate': 'R13_terminal_state',
      'stalemate': 'R13_terminal_state',
      'time_forfeit': 'R13_terminal_state',

      // Draw rules
      'threefold_repetition': 'R14_repetition',
      'fivefold_repetition': 'R14_repetition',
      'fifty_move': 'R15_counter_based',
      'seventy_five_move': 'R15_counter_based',
      'insufficient_material': 'R13_terminal_state'
    };

    return ruleTypeMap[ruleId] || 'R10_conditional';
  }

  /**
   * Get R-type definition
   */
  getDefinition(rtype: RType): RTypeDefinition {
    return RTypeDefinitions[rtype];
  }

  /**
   * Get all rules of a specific R-type
   */
  getRulesByType(rtype: RType): string[] {
    const rulesByType: Record<RType, string[]> = {
      R1_asymmetric: ['pawn_movement'],
      R2_intransitive: ['king_movement'],
      R3_path_dependent: ['queen_movement', 'rook_movement', 'bishop_movement'],
      R4_capture_only: ['pawn_diagonal_capture'],
      R5_non_capture: ['pawn_forward'],
      R6_first_move_special: ['pawn_double'],
      R7_temporal_window: ['en_passant'],
      R8_mandatory_transformation: ['pawn_promotion'],
      R9_compound_move: ['castling_kingside', 'castling_queenside'],
      R10_conditional: ['check_response', 'pin_restriction'],
      R11_discrete_jump: ['knight_movement'],
      R12_state_dependent: ['castling_rights', 'draw_claim'],
      R13_terminal_state: ['checkmate', 'stalemate', 'time_forfeit', 'insufficient_material'],
      R14_repetition: ['threefold_repetition', 'fivefold_repetition'],
      R15_counter_based: ['fifty_move', 'seventy_five_move']
    };

    return rulesByType[rtype] || [];
  }

  /**
   * Get human-readable explanation for R-type
   */
  explain(rtype: RType, language: 'en' | 'no' = 'en'): string {
    const def = RTypeDefinitions[rtype];
    return `${def.name}: ${def.description[language]}`;
  }

  /**
   * Classify by piece type
   */
  classifyByPiece(pieceType: PieceType): RType[] {
    const pieceRTypes: Record<PieceType, RType[]> = {
      king: ['R2_intransitive', 'R9_compound_move', 'R12_state_dependent'],
      queen: ['R3_path_dependent'],
      rook: ['R3_path_dependent', 'R9_compound_move', 'R12_state_dependent'],
      bishop: ['R3_path_dependent'],
      knight: ['R11_discrete_jump'],
      pawn: ['R1_asymmetric', 'R4_capture_only', 'R5_non_capture', 'R6_first_move_special', 'R7_temporal_window', 'R8_mandatory_transformation']
    };

    return pieceRTypes[pieceType] || [];
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export { RTypeClassifier as default };
