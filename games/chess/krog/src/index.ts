/**
 * KROG Chess - Domain-Specific KROG Implementation
 *
 * This package provides the chess-specific implementation of the KROG framework.
 * It maps chess rules to universal KROG R-types via the ChessFunctor.
 *
 * Architecture:
 * - @krog/krog-framework: Universal KROG framework (7 T-types, 35 R-types, 9 operators)
 * - @krog/chess-krog: Chess-specific KROG implementation (this package)
 *   - ChessFunctor: Maps chess rules to universal R-types
 *   - Chess operators: PM, PC, PA, CR, EP, PO, NV, PD, CS, LMG, GT, PR, FMC
 *   - KROGChessEngine: Complete chess validation engine
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// ============================================================================
// FUNCTOR (Chess → Universal KROG)
// ============================================================================

export { ChessFunctor, type ChessConcept } from './functor';

// ============================================================================
// CORE OPERATORS
// ============================================================================

export {
  CoreOperators,
  PermissionOperator,
  ObligationOperator,
  ProhibitionOperator,
  ClaimOperator,
  LibertyOperator,
  PowerOperator,
  ImmunityOperator,
  DisabilityOperator,
  LiabilityOperator
} from './core-operators';

// ============================================================================
// PIECE LOGIC OPERATORS
// ============================================================================

export {
  PieceLogicOperators,
  PM_Operator,
  PC_Operator,
  PA_Operator,
  CR_Operator,
  EP_Operator,
  PO_Operator,
  NV_Operator,
  PD_Operator
} from './piece-logic';

// ============================================================================
// BOARD LOGIC OPERATORS
// ============================================================================

export {
  BoardLogicOperators,
  CS_Operator,
  LMG_Operator,
  GT_Operator,
  PR_Operator,
  FMC_Operator
} from './board-logic';

// ============================================================================
// NOTATION OPERATORS
// ============================================================================

export {
  NotationOperators,
  GN_Operator
} from './notation';

// ============================================================================
// TEMPORAL OPERATORS
// ============================================================================

export {
  TemporalOperators
} from './temporal';

// ============================================================================
// R-TYPE CLASSIFIER
// ============================================================================

export {
  RTypeClassifier,
  RTypeDefinitions,
  type RTypeDefinition
} from './rtype-classifier';

// ============================================================================
// CHESS ENGINE
// ============================================================================

export { KROGChessEngine } from './engine';

// ============================================================================
// VERSION INFO
// ============================================================================

export const CHESS_KROG_VERSION = '1.0.0';
export const CHESS_KROG_AUTHOR = 'Georg Philip Krog';

export const CHESS_KROG_INFO = {
  version: CHESS_KROG_VERSION,
  author: CHESS_KROG_AUTHOR,
  domain: 'chess',
  domainName: { en: 'Chess', no: 'Sjakk' },
  operators: {
    core: ['P', 'O', 'F', 'C', 'L', 'W', 'B', 'I', 'D'],
    pieceLogic: ['PM', 'PC', 'PA', 'CR', 'EP', 'PO', 'NV', 'PD'],
    boardLogic: ['CS', 'LMG', 'GT', 'PR', 'FMC'],
    notation: ['GN'],
    temporal: ['G', 'F', 'X', 'U', 'R']
  },
  ruleTypes: [
    'R1_asymmetric',
    'R2_intransitive',
    'R3_path_dependent',
    'R4_capture_only',
    'R5_non_capture',
    'R6_first_move_special',
    'R7_temporal_window',
    'R8_mandatory_transformation',
    'R9_compound_move',
    'R10_conditional',
    'R11_discrete_jump',
    'R12_state_dependent',
    'R13_terminal_state',
    'R14_repetition',
    'R15_counter_based'
  ]
};
