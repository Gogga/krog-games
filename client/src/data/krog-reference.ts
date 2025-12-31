/**
 * KROG Framework Reference Data
 * Static data for the KUIE Research Dashboard
 *
 * This file contains the complete KROG mathematical framework:
 * - 7 T-Types (agent capability states)
 * - 35 R-Types (bilateral relationships)
 * - 9 Modal Operators
 * - Risk level color mappings
 */

// T-Types: Agent capability profiles
export interface TType {
  id: string;
  iri: string;
  formal: string;
  natural: string;
  canAct: boolean;
  canRefrain: boolean;
  canBePassive: boolean;
}

export const T_TYPES: Record<string, TType> = {
  T1: {
    id: 'T1',
    iri: 'https://krog.ai/ontology/T1',
    formal: 'P(i EA) ∧ P(i E¬A) ∧ P(ILA)',
    natural: 'Full discretion - can act, refrain, or be passive',
    canAct: true,
    canRefrain: true,
    canBePassive: true
  },
  T2: {
    id: 'T2',
    iri: 'https://krog.ai/ontology/T2',
    formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(ILA)',
    natural: 'Limited power - can act or be passive, cannot refrain',
    canAct: true,
    canRefrain: false,
    canBePassive: true
  },
  T3: {
    id: 'T3',
    iri: 'https://krog.ai/ontology/T3',
    formal: 'P(i EA) ∧ P(i E¬A) ∧ O¬(ILA)',
    natural: 'Active engagement required - must take a stance',
    canAct: true,
    canRefrain: true,
    canBePassive: false
  },
  T4: {
    id: 'T4',
    iri: 'https://krog.ai/ontology/T4',
    formal: 'O¬(i EA) ∧ P(i E¬A) ∧ P(ILA)',
    natural: 'Prevention only - cannot initiate, can block',
    canAct: false,
    canRefrain: true,
    canBePassive: true
  },
  T5: {
    id: 'T5',
    iri: 'https://krog.ai/ontology/T5',
    formal: 'O(i EA)',
    natural: 'Mandatory action - must act',
    canAct: true,
    canRefrain: false,
    canBePassive: false
  },
  T6: {
    id: 'T6',
    iri: 'https://krog.ai/ontology/T6',
    formal: 'O(ILA)',
    natural: 'Mandatory passivity - must remain passive',
    canAct: false,
    canRefrain: false,
    canBePassive: true
  },
  T7: {
    id: 'T7',
    iri: 'https://krog.ai/ontology/T7',
    formal: 'O(i E¬A)',
    natural: 'Mandatory prevention - must prevent/refuse',
    canAct: false,
    canRefrain: true,
    canBePassive: false
  }
};

// R-Types: Relational structures between two agents
export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface RType {
  id: string;
  structure: string;
  formal: string;
  natural: string;
  risk: RiskLevel;
  chessExample?: string;
}

export const R_TYPES: Record<string, RType> = {
  // Symmetric types (same T-type for both agents)
  R1: {
    id: 'R1',
    structure: '(T1,T1)',
    formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)',
    natural: 'Both agents have full discretion',
    risk: 'low',
    chessExample: 'Asymmetric pawn movement'
  },
  R2: {
    id: 'R2',
    structure: '(T2,T2)',
    formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ O¬(j E¬A) ∧ P(j ILA)',
    natural: 'Both have limited power',
    risk: 'medium',
    chessExample: 'King movement (intransitive)'
  },
  R3: {
    id: 'R3',
    structure: '(T3,T3)',
    formal: 'P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ O¬(j ILA)',
    natural: 'Both must engage actively',
    risk: 'medium',
    chessExample: 'Sliding pieces (Q/R/B) path-dependent'
  },
  R4: {
    id: 'R4',
    structure: '(T4,T4)',
    formal: 'O¬(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)',
    natural: 'Both can only prevent',
    risk: 'low',
    chessExample: 'Pawn diagonal capture'
  },
  R5: {
    id: 'R5',
    structure: '(T5,T5)',
    formal: 'O(i EA) ∧ O(j EA)',
    natural: 'Both must act',
    risk: 'medium',
    chessExample: 'Pawn forward movement'
  },
  R6: {
    id: 'R6',
    structure: '(T6,T6)',
    formal: 'O(i ILA) ∧ O(j ILA)',
    natural: 'Both must be passive',
    risk: 'low',
    chessExample: 'First move special (pawn double push)'
  },
  R7: {
    id: 'R7',
    structure: '(T7,T7)',
    formal: 'O(i E¬A) ∧ O(j E¬A)',
    natural: 'Both must prevent',
    risk: 'low',
    chessExample: 'En passant temporal window'
  },
  // Asymmetric types
  R8: {
    id: 'R8',
    structure: '(T1,T5)',
    formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j EA)',
    natural: 'Agent i discretion, agent j must act',
    risk: 'medium',
    chessExample: 'Pawn promotion (mandatory transformation)'
  },
  R9: {
    id: 'R9',
    structure: '(T2,T5)',
    formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O(j EA)',
    natural: 'Limited power with mandatory action',
    risk: 'high',
    chessExample: 'Castling (compound move)'
  },
  R10: {
    id: 'R10',
    structure: '(T3,T5)',
    formal: 'P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ O(j EA)',
    natural: 'Active engagement with mandatory',
    risk: 'high',
    chessExample: 'Check response (conditional)'
  },
  R11: {
    id: 'R11',
    structure: '(T1,T5)',
    formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j EA)',
    natural: 'Full discretion with discrete jump',
    risk: 'low',
    chessExample: 'Knight movement'
  },
  R12: {
    id: 'R12',
    structure: '(T2,T4)',
    formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)',
    natural: 'State-dependent',
    risk: 'medium',
    chessExample: 'Castling rights dependent'
  },
  R13: {
    id: 'R13',
    structure: '(T1,T7)',
    formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j E¬A)',
    natural: 'Agent i can request, agent j must refuse',
    risk: 'very_high',
    chessExample: 'Checkmate/stalemate (terminal state)'
  },
  R14: {
    id: 'R14',
    structure: '(T6,T7)',
    formal: 'O(i ILA) ∧ O(j E¬A)',
    natural: 'Passivity with prevention',
    risk: 'low',
    chessExample: 'Threefold repetition'
  },
  R15: {
    id: 'R15',
    structure: '(T5,T6)',
    formal: 'O(i EA) ∧ O(j ILA)',
    natural: 'Mandatory action with passivity',
    risk: 'low',
    chessExample: 'Fifty-move rule (counter-based)'
  },
  // Additional asymmetric combinations (R16-R35)
  R16: { id: 'R16', structure: '(T1,T2)', formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ O¬(j E¬A) ∧ P(j ILA)', natural: 'Full discretion vs limited power', risk: 'low' },
  R17: { id: 'R17', structure: '(T1,T3)', formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ O¬(j ILA)', natural: 'Full discretion vs active engagement', risk: 'low' },
  R18: { id: 'R18', structure: '(T1,T4)', formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)', natural: 'Full discretion vs prevention only', risk: 'low' },
  R19: { id: 'R19', structure: '(T1,T6)', formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j ILA)', natural: 'Full discretion vs mandatory passivity', risk: 'low' },
  R20: { id: 'R20', structure: '(T2,T3)', formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ O¬(j ILA)', natural: 'Limited power vs active engagement', risk: 'medium' },
  R21: { id: 'R21', structure: '(T2,T4)', formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)', natural: 'Limited power vs prevention', risk: 'low' },
  R22: { id: 'R22', structure: '(T2,T6)', formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O(j ILA)', natural: 'Limited power vs mandatory passivity', risk: 'low' },
  R23: { id: 'R23', structure: '(T2,T7)', formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O(j E¬A)', natural: 'Limited power vs mandatory prevention', risk: 'medium' },
  R24: { id: 'R24', structure: '(T3,T4)', formal: 'P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)', natural: 'Active engagement vs prevention', risk: 'medium' },
  R25: { id: 'R25', structure: '(T3,T6)', formal: 'P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ O(j ILA)', natural: 'Active engagement vs mandatory passivity', risk: 'medium' },
  R26: { id: 'R26', structure: '(T5,T7)', formal: 'O(i EA) ∧ O(j E¬A)', natural: 'CONFLICT: must act vs must prevent', risk: 'very_high' },
  R27: { id: 'R27', structure: '(T3,T7)', formal: 'P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ O(j E¬A)', natural: 'Active engagement vs mandatory prevention', risk: 'high' },
  R28: { id: 'R28', structure: '(T4,T5)', formal: 'O¬(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j EA)', natural: 'Prevention vs mandatory action', risk: 'high' },
  R29: { id: 'R29', structure: '(T4,T6)', formal: 'O¬(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j ILA)', natural: 'Prevention vs mandatory passivity', risk: 'low' },
  R30: { id: 'R30', structure: '(T4,T7)', formal: 'O¬(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j E¬A)', natural: 'Prevention vs mandatory prevention', risk: 'low' },
  R31: { id: 'R31', structure: '(T5,T6)', formal: 'O(i EA) ∧ O(j ILA)', natural: 'Mandatory action vs mandatory passivity', risk: 'medium' },
  R32: { id: 'R32', structure: '(T6,T7)', formal: 'O(i ILA) ∧ O(j E¬A)', natural: 'Mandatory passivity vs mandatory prevention', risk: 'low' },
  // Reverse asymmetric (j has more capability than i)
  R33: { id: 'R33', structure: '(T5,T1)', formal: 'O(i EA) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)', natural: 'Mandatory action vs full discretion', risk: 'medium' },
  R34: { id: 'R34', structure: '(T7,T1)', formal: 'O(i E¬A) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)', natural: 'Mandatory prevention vs full discretion', risk: 'medium' },
  R35: { id: 'R35', structure: '(T6,T1)', formal: 'O(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)', natural: 'Mandatory passivity vs full discretion', risk: 'low' }
};

// Chess R-type label to KROG R-type mapping
export const CHESS_R_TYPE_MAPPING: Record<string, string> = {
  'R1_asymmetric': 'R1',
  'R2_intransitive': 'R2',
  'R3_path_dependent': 'R3',
  'R4_capture_only': 'R4',
  'R5_non_capture': 'R5',
  'R6_first_move_special': 'R6',
  'R7_temporal_window': 'R7',
  'R8_mandatory_transformation': 'R8',
  'R9_compound_move': 'R9',
  'R10_conditional': 'R10',
  'R11_discrete_jump': 'R11',
  'R12_state_dependent': 'R12',
  'R13_terminal_state': 'R13',
  'R14_repetition': 'R14',
  'R15_counter_based': 'R15'
};

// Modal Operators with definitions
export interface ModalOperator {
  symbol: string;
  name: string;
  formal: string;
  natural: string;
  category: 'deontic' | 'hohfeldian';
}

export const MODAL_OPERATORS: Record<string, ModalOperator> = {
  P: {
    symbol: 'P',
    name: 'Permission',
    formal: 'P(φ) ≡ ¬O¬(φ)',
    natural: 'φ is permitted (may do)',
    category: 'deontic'
  },
  O: {
    symbol: 'O',
    name: 'Obligation',
    formal: 'O(φ) ≡ ¬P¬(φ)',
    natural: 'φ is obligatory (must do)',
    category: 'deontic'
  },
  F: {
    symbol: 'F',
    name: 'Prohibition',
    formal: 'F(φ) ≡ O¬(φ)',
    natural: 'φ is forbidden (must not do)',
    category: 'deontic'
  },
  C: {
    symbol: 'C',
    name: 'Claim',
    formal: 'C_i(φ) ≡ O_j(φ)',
    natural: 'Agent i has claim that φ',
    category: 'hohfeldian'
  },
  L: {
    symbol: 'L',
    name: 'Liberty',
    formal: 'L_i(φ) ≡ P_i(φ) ∧ P_i¬(φ)',
    natural: 'Agent i has liberty regarding φ',
    category: 'hohfeldian'
  },
  W: {
    symbol: 'W',
    name: 'Power',
    formal: 'W_i(change_state)',
    natural: 'Agent i can change legal state',
    category: 'hohfeldian'
  },
  B: {
    symbol: 'B',
    name: 'Liability',
    formal: 'B_i(φ) ≡ ¬W_i¬(φ)',
    natural: 'Agent i is liable to φ',
    category: 'hohfeldian'
  },
  I: {
    symbol: 'I',
    name: 'Immunity',
    formal: 'I_i(φ) ≡ ¬B_i(φ)',
    natural: 'Agent i immune from φ',
    category: 'hohfeldian'
  },
  D: {
    symbol: 'D',
    name: 'Disability',
    formal: 'D_i(φ) ≡ ¬W_i(φ)',
    natural: 'Agent i cannot do φ',
    category: 'hohfeldian'
  }
};

// Risk level color mapping
export const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#81b64c',      // KROG green
  medium: '#f39c12',   // Yellow/orange
  high: '#e67e22',     // Orange
  very_high: '#e74c3c' // Red
};

// Risk level labels
export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  very_high: 'Very High Risk'
};

// T-Type matrix for heatmap (7x7 grid mapping to R-types)
export const T_TYPE_MATRIX: string[][] = [
  // T1    T2     T3     T4     T5     T6     T7
  ['R1',  'R16', 'R17', 'R18', 'R11', 'R19', 'R13'], // T1
  ['-',   'R2',  'R20', 'R21', 'R9',  'R22', 'R23'], // T2
  ['-',   '-',   'R3',  'R24', 'R10', 'R25', 'R27'], // T3
  ['-',   '-',   '-',   'R4',  'R28', 'R29', 'R30'], // T4
  ['-',   '-',   '-',   '-',   'R5',  'R31', 'R26'], // T5
  ['-',   '-',   '-',   '-',   '-',   'R6',  'R32'], // T6
  ['-',   '-',   '-',   '-',   '-',   '-',   'R7']   // T7
];

// Temporal Logic Patterns (for future use)
export const TEMPORAL_PATTERNS = {
  LTL: {
    name: 'Linear Temporal Logic',
    patterns: [
      { formula: 'G(φ → F[≤n](ψ))', natural: 'Always: if φ then ψ within n time units (SLA pattern)' },
      { formula: 'G(φ)', natural: 'φ remains true forever (invariant)' },
      { formula: 'F[≤n](φ)', natural: 'φ occurs within n time units (deadline)' },
      { formula: 'φ U[≤n] ψ', natural: 'φ until ψ within n (conditional maintenance)' }
    ]
  },
  CTL: {
    name: 'Computation Tree Logic',
    patterns: [
      { formula: 'AF[≤n](φ)', natural: 'On ALL paths, φ occurs within n' },
      { formula: 'EF[≤n](φ)', natural: 'There EXISTS a path where φ occurs' }
    ]
  },
  PCTL: {
    name: 'Probabilistic CTL',
    patterns: [
      { formula: 'P≥p[F≤t(φ)]', natural: 'Probability ≥p that φ occurs within t' }
    ]
  },
  QCTL: {
    name: 'Quantitative CTL',
    patterns: [
      { formula: 'C≤c[F(φ)]', natural: 'Cost to φ is at most c' }
    ]
  }
};

// Domains configuration
export interface Domain {
  id: string;
  name: string;
  status: 'active' | 'coming_soon' | 'planned';
  description: string;
  icon: string;
  count?: number;
}

export const DOMAINS: Domain[] = [
  { id: 'chess', name: 'Chess', status: 'active', description: 'Chess move decisions with KROG annotations', icon: '♟️' },
  { id: 'contracts', name: 'Contracts', status: 'coming_soon', description: 'Contract clause governance', icon: '📜' },
  { id: 'ai-auth', name: 'AI Auth', status: 'coming_soon', description: 'AI authorization decisions', icon: '🤖' },
  { id: 'physics', name: 'Physics', status: 'coming_soon', description: 'Physical system constraints', icon: '⚛️' },
  { id: 'economics', name: 'Economics', status: 'planned', description: 'Economic agent interactions', icon: '📊' },
  { id: 'ecology', name: 'Ecology', status: 'planned', description: 'Ecological system rules', icon: '🌿' }
];

// Helper function to get R-type by chess label
export function getRTypeFromChessLabel(chessLabel: string): RType | undefined {
  const rTypeId = CHESS_R_TYPE_MAPPING[chessLabel];
  return rTypeId ? R_TYPES[rTypeId] : undefined;
}

// Helper function to get risk color
export function getRiskColor(risk: RiskLevel): string {
  return RISK_COLORS[risk] || RISK_COLORS.low;
}

// Helper function to format T-type display
export function formatTType(tTypeId: string): string {
  const tType = T_TYPES[tTypeId];
  return tType ? `${tTypeId}: ${tType.natural}` : tTypeId;
}
