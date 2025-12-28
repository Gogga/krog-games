/**
 * Chess Domain Functor
 *
 * Implements KROGDomainFunctor to map chess rules to universal KROG R-types.
 * This is the bridge between chess-specific concepts and the universal framework.
 *
 * Universal R-Types (bilateral relationships between agents):
 *   R1-R7: Symmetric relationships (same T-type for both agents)
 *   R8-R35: Asymmetric relationships
 *
 * Chess maps to universal R-types based on the relationship between:
 *   - The moving player (agent i)
 *   - The affected entity (agent j) - opponent, board state, clock, etc.
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

import type {
  RType as UniversalRType,
  TType,
  KROGDomainFunctor
} from '@krog/krog-framework';

import type { RType as ChessRType } from './types';

// ============================================================================
// CHESS CONCEPT TYPE
// ============================================================================

export interface ChessConcept {
  type: 'piece_movement' | 'capture' | 'special_move' | 'game_state' | 'termination' | 'draw_rule';
  subtype: ChessRType;
  description: { en: string; no: string };
  fideSection: string;
}

// ============================================================================
// CHESS FUNCTOR IMPLEMENTATION
// ============================================================================

/**
 * Chess Domain Functor
 *
 * Maps chess-specific rules to universal KROG R-types.
 *
 * Mapping rationale:
 * - Chess is a two-player zero-sum game
 * - Each player alternates T-type states:
 *   - Active player: T1 (full discretion within legal moves)
 *   - Waiting player: T6 (mandatory passivity)
 * - Special rules create different T-type combinations
 */
export class ChessFunctor implements KROGDomainFunctor<ChessConcept> {
  readonly domainId = 'chess';
  readonly domainName = {
    en: 'Chess',
    no: 'Sjakk'
  };

  /**
   * Map chess concept to universal R-type
   *
   * Chess R-type → Universal R-type mapping:
   *
   * R1_asymmetric → R8 (T1, T2) - Active discretion vs limited power
   * R2_intransitive → R32 (T4, T1) - King's restricted vs opponent's full
   * R3_path_dependent → R11 (T1, T5) - Discretion vs must-respond
   * R4_capture_only → R8 (T1, T2) - Conditional capture
   * R5_non_capture → R8 (T1, T2) - Conditional non-capture
   * R6_first_move_special → R8 (T1, T2) - First move special
   * R7_temporal_window → R11 (T1, T5) - Time-limited obligation
   * R8_mandatory_transformation → R5 (T5, T5) - Both must act (promote/respond)
   * R9_compound_move → R12 (T1, T6) - Discretion vs passive
   * R10_conditional → R5 (T5, T5) - Both obligated (check response)
   * R11_discrete_jump → R1 (T1, T1) - Symmetric discretion
   * R12_state_dependent → R11 (T1, T5) - Discretion vs obligation
   * R13_terminal_state → R7 (T7, T7) - Both must prevent (game over)
   * R14_repetition → R6 (T6, T6) - Both passive (draw agreed)
   * R15_counter_based → R6 (T6, T6) - Counter-based draw
   */
  toRType(concept: ChessConcept): UniversalRType {
    const mapping: Record<ChessRType, UniversalRType> = {
      // Pawn direction asymmetry - active player has discretion
      R1_asymmetric: 'R8',

      // King single step - restricted movement
      R2_intransitive: 'R32',

      // Sliding pieces - path clearance required
      R3_path_dependent: 'R11',

      // Pawn diagonal capture only
      R4_capture_only: 'R8',

      // Pawn forward non-capture
      R5_non_capture: 'R8',

      // Pawn double push on first move
      R6_first_move_special: 'R8',

      // En passant - temporal window
      R7_temporal_window: 'R11',

      // Pawn promotion - mandatory transformation
      R8_mandatory_transformation: 'R5',

      // Castling - compound move
      R9_compound_move: 'R12',

      // Check response - conditional obligation
      R10_conditional: 'R5',

      // Knight jump - discrete movement
      R11_discrete_jump: 'R1',

      // Castling rights - state-dependent
      R12_state_dependent: 'R11',

      // Game termination - terminal state
      R13_terminal_state: 'R7',

      // Threefold repetition - draw
      R14_repetition: 'R6',

      // Fifty-move rule - counter-based draw
      R15_counter_based: 'R6'
    };

    return mapping[concept.subtype];
  }

  /**
   * Map universal R-type back to chess concepts
   */
  fromRType(rtype: UniversalRType): ChessConcept[] {
    const concepts: ChessConcept[] = [];

    const reverseMapping: Partial<Record<UniversalRType, ChessRType[]>> = {
      'R1': ['R11_discrete_jump'],
      'R5': ['R8_mandatory_transformation', 'R10_conditional'],
      'R6': ['R14_repetition', 'R15_counter_based'],
      'R7': ['R13_terminal_state'],
      'R8': ['R1_asymmetric', 'R4_capture_only', 'R5_non_capture', 'R6_first_move_special'],
      'R11': ['R3_path_dependent', 'R7_temporal_window', 'R12_state_dependent'],
      'R12': ['R9_compound_move'],
      'R32': ['R2_intransitive']
    };

    const chessTypes = reverseMapping[rtype] || [];
    for (const subtype of chessTypes) {
      concepts.push(this.createConcept(subtype));
    }

    return concepts;
  }

  /**
   * Get primary R-types used in chess
   */
  getPrimaryRTypes(): UniversalRType[] {
    return ['R1', 'R5', 'R6', 'R7', 'R8', 'R11', 'R12', 'R32'];
  }

  /**
   * Get all chess concepts that map to a given R-type
   */
  getConceptsByRType(rtype: UniversalRType): ChessConcept[] {
    return this.fromRType(rtype);
  }

  /**
   * Get T-type pair for a chess rule type
   */
  getTTypePair(ruleType: ChessRType): { agent1: TType; agent2: TType } {
    const pairs: Record<ChessRType, { agent1: TType; agent2: TType }> = {
      R1_asymmetric: { agent1: 'T1', agent2: 'T2' },
      R2_intransitive: { agent1: 'T4', agent2: 'T1' },
      R3_path_dependent: { agent1: 'T1', agent2: 'T5' },
      R4_capture_only: { agent1: 'T1', agent2: 'T2' },
      R5_non_capture: { agent1: 'T1', agent2: 'T2' },
      R6_first_move_special: { agent1: 'T1', agent2: 'T2' },
      R7_temporal_window: { agent1: 'T1', agent2: 'T5' },
      R8_mandatory_transformation: { agent1: 'T5', agent2: 'T5' },
      R9_compound_move: { agent1: 'T1', agent2: 'T6' },
      R10_conditional: { agent1: 'T5', agent2: 'T5' },
      R11_discrete_jump: { agent1: 'T1', agent2: 'T1' },
      R12_state_dependent: { agent1: 'T1', agent2: 'T5' },
      R13_terminal_state: { agent1: 'T7', agent2: 'T7' },
      R14_repetition: { agent1: 'T6', agent2: 'T6' },
      R15_counter_based: { agent1: 'T6', agent2: 'T6' }
    };

    return pairs[ruleType];
  }

  /**
   * Create a chess concept from a rule type
   */
  private createConcept(subtype: ChessRType): ChessConcept {
    const definitions: Record<ChessRType, Omit<ChessConcept, 'subtype'>> = {
      R1_asymmetric: {
        type: 'piece_movement',
        description: { en: 'Pawn movement (direction matters)', no: 'Bondebevegelse (retning betyr noe)' },
        fideSection: '3.7'
      },
      R2_intransitive: {
        type: 'piece_movement',
        description: { en: 'King movement (single step)', no: 'Kongebevegelse (enkelt steg)' },
        fideSection: '3.8'
      },
      R3_path_dependent: {
        type: 'piece_movement',
        description: { en: 'Sliding piece movement (path clearance)', no: 'Glidende brikkebevegelse (klar bane)' },
        fideSection: '3.4'
      },
      R4_capture_only: {
        type: 'capture',
        description: { en: 'Pawn diagonal capture', no: 'Bonde diagonal slag' },
        fideSection: '3.7.d'
      },
      R5_non_capture: {
        type: 'piece_movement',
        description: { en: 'Pawn forward (non-capture)', no: 'Bonde fremover (ikke slag)' },
        fideSection: '3.7.a'
      },
      R6_first_move_special: {
        type: 'special_move',
        description: { en: 'Pawn double push', no: 'Bonde dobbelt trekk' },
        fideSection: '3.7.b'
      },
      R7_temporal_window: {
        type: 'special_move',
        description: { en: 'En passant capture', no: 'En passant slag' },
        fideSection: '3.7.e'
      },
      R8_mandatory_transformation: {
        type: 'special_move',
        description: { en: 'Pawn promotion', no: 'Bondeforfremmelse' },
        fideSection: '3.7.f'
      },
      R9_compound_move: {
        type: 'special_move',
        description: { en: 'Castling', no: 'Rokade' },
        fideSection: '3.8.2'
      },
      R10_conditional: {
        type: 'game_state',
        description: { en: 'Check response', no: 'Sjakk-respons' },
        fideSection: '3.9'
      },
      R11_discrete_jump: {
        type: 'piece_movement',
        description: { en: 'Knight jump', no: 'Springerhopp' },
        fideSection: '3.6'
      },
      R12_state_dependent: {
        type: 'game_state',
        description: { en: 'Castling rights', no: 'Rokaderettigheter' },
        fideSection: '3.8.2'
      },
      R13_terminal_state: {
        type: 'termination',
        description: { en: 'Checkmate/Stalemate', no: 'Sjakkmatt/Patt' },
        fideSection: '5.1'
      },
      R14_repetition: {
        type: 'draw_rule',
        description: { en: 'Threefold repetition', no: 'Tregangsgjentakelse' },
        fideSection: '9.2'
      },
      R15_counter_based: {
        type: 'draw_rule',
        description: { en: 'Fifty-move rule', no: 'Femtitrekksregelen' },
        fideSection: '9.3'
      }
    };

    return { subtype, ...definitions[subtype] };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default ChessFunctor;
