/**
 * KROG Chess Framework - Main Export
 *
 * Complete KROG implementation for chess move validation
 * using formal mathematical operators.
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

// ============================================================================
// MAIN ENGINE
// ============================================================================

export { default as KROGChessEngine } from './engine';
export { KROGChessEngine as default } from './engine';

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// ============================================================================
// CORE OPERATORS (P, O, F, C, L, W, B, I, D)
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
// PIECE LOGIC OPERATORS (PM, PC, PA, NV, PD, CR, EP, PO)
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
// BOARD LOGIC OPERATORS (PV, MH, CS, LMG, GT, TC, PR, FMC)
// ============================================================================

export {
  BoardLogicOperators,
  PV_Operator,
  MH_Operator,
  CS_Operator,
  LMG_Operator,
  GT_Operator,
  TC_Operator,
  PR_Operator,
  FMC_Operator
} from './board-logic';

// ============================================================================
// NOTATION OPERATORS (PSA, PLA, PUCI, PVN, GN, NC)
// ============================================================================

export {
  NotationOperators,
  PSA_Operator,
  PLA_Operator,
  PUCI_Operator,
  PVN_Operator,
  GN_Operator,
  NC_Operator
} from './notation';

// ============================================================================
// TEMPORAL LOGIC OPERATORS (G, F, X, U, R)
// ============================================================================

export {
  TemporalOperators,
  G_Operator,
  F_Operator,
  X_Operator,
  U_Operator,
  R_Operator,
  TemporalPatterns
} from './temporal';

// ============================================================================
// R-TYPE CLASSIFIER
// ============================================================================

export {
  default as RTypeClassifier,
  RTypeDefinitions
} from './rtype-classifier';

// ============================================================================
// RULES DATABASE
// ============================================================================

import rulesData from './KROG-RULES.json';

export const KROGRules = rulesData;

export function getRuleById(id: string) {
  return rulesData.rules.find(r => r.id === id);
}

export function getRulesByOperator(operator: string) {
  return rulesData.rules.filter(r => r.operators.includes(operator));
}

export function getRulesByRType(rtype: string) {
  return rulesData.rules.filter(r => r.rtype === rtype);
}

export function getAllRules() {
  return rulesData.rules;
}

export function getRTypeDefinition(rtype: string) {
  return (rulesData.rtypes as any)[rtype];
}

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

/**
 * Create a new KROG Chess Engine instance
 */
export function createKROGEngine() {
  const { default: Engine } = require('./engine');
  return new Engine();
}

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '1.0.0';
export const AUTHOR = 'Georg Philip Krog';

export const KROG_INFO = {
  version: VERSION,
  author: AUTHOR,
  operators: {
    core: ['P', 'O', 'F', 'C', 'L', 'W', 'B', 'I', 'D'],
    pieceLogic: ['PM', 'PC', 'PA', 'NV', 'PD', 'CR', 'EP', 'PO'],
    boardLogic: ['PV', 'MH', 'CS', 'LMG', 'GT', 'TC', 'PR', 'FMC'],
    notation: ['PSA', 'PLA', 'PUCI', 'PVN', 'GN', 'NC'],
    temporal: ['G', 'F', 'X', 'U', 'R']
  },
  rtypes: [
    'R1_asymmetric', 'R2_intransitive', 'R3_path_dependent',
    'R4_capture_only', 'R5_non_capture', 'R6_first_move_special',
    'R7_temporal_window', 'R8_mandatory_transformation', 'R9_compound_move',
    'R10_conditional', 'R11_discrete_jump', 'R12_state_dependent',
    'R13_terminal_state', 'R14_repetition', 'R15_counter_based'
  ],
  totalRules: rulesData.rules.length
};
