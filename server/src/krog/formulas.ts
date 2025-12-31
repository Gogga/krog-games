/**
 * KROG Logical Formulas for Neurosymbolic Reasoning
 *
 * This module provides complete logical formulas as JSON-LD for chess moves,
 * enabling neurosymbolic AI research and future KUIE integration.
 *
 * Based on KROG Universal Rules framework.
 */

// T-Types: Agent capability profiles
export const T_TYPES: Record<string, {
  iri: string;
  formal: string;
  natural: string;
  can_act: boolean;
  can_refrain: boolean;
  can_be_passive: boolean;
}> = {
  T1: {
    iri: "https://krog.ai/ontology/T1",
    formal: "P(i EA) ∧ P(i E¬A) ∧ P(ILA)",
    natural: "Full discretion - can act, refrain, or be passive",
    can_act: true,
    can_refrain: true,
    can_be_passive: true
  },
  T2: {
    iri: "https://krog.ai/ontology/T2",
    formal: "P(i EA) ∧ O¬(i E¬A) ∧ P(ILA)",
    natural: "Limited power - can act or be passive, cannot refrain",
    can_act: true,
    can_refrain: false,
    can_be_passive: true
  },
  T3: {
    iri: "https://krog.ai/ontology/T3",
    formal: "P(i EA) ∧ P(i E¬A) ∧ O¬(ILA)",
    natural: "Active engagement required - must take a stance",
    can_act: true,
    can_refrain: true,
    can_be_passive: false
  },
  T4: {
    iri: "https://krog.ai/ontology/T4",
    formal: "O¬(i EA) ∧ P(i E¬A) ∧ P(ILA)",
    natural: "Prevention only - cannot initiate, can block",
    can_act: false,
    can_refrain: true,
    can_be_passive: true
  },
  T5: {
    iri: "https://krog.ai/ontology/T5",
    formal: "O(i EA)",
    natural: "Mandatory action - must act",
    can_act: true,
    can_refrain: false,
    can_be_passive: false
  },
  T6: {
    iri: "https://krog.ai/ontology/T6",
    formal: "O(ILA)",
    natural: "Mandatory passivity - must remain passive",
    can_act: false,
    can_refrain: false,
    can_be_passive: true
  },
  T7: {
    iri: "https://krog.ai/ontology/T7",
    formal: "O(i E¬A)",
    natural: "Mandatory prevention - must prevent/refuse",
    can_act: false,
    can_refrain: true,
    can_be_passive: false
  }
};

// R-Types: Relational structures between two agents
export const R_TYPES: Record<string, {
  structure: string;
  formal: string;
  natural: string;
  risk: string;
}> = {
  // Symmetric types (same T-type for both agents)
  R1: {
    structure: "(T1,T1)",
    formal: "P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)",
    natural: "Both agents have full discretion",
    risk: "low"
  },
  R2: {
    structure: "(T2,T2)",
    formal: "P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ O¬(j E¬A) ∧ P(j ILA)",
    natural: "Both have limited power - King movement",
    risk: "medium"
  },
  R3: {
    structure: "(T3,T3)",
    formal: "P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ O¬(j ILA)",
    natural: "Both must engage actively - sliding pieces",
    risk: "medium"
  },
  R4: {
    structure: "(T4,T4)",
    formal: "O¬(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)",
    natural: "Both can only prevent - pawn capture",
    risk: "low"
  },
  R5: {
    structure: "(T5,T5)",
    formal: "O(i EA) ∧ O(j EA)",
    natural: "Both must act - pawn forward movement",
    risk: "medium"
  },
  R6: {
    structure: "(T6,T6)",
    formal: "O(i ILA) ∧ O(j ILA)",
    natural: "Both must be passive - first move special",
    risk: "low"
  },
  R7: {
    structure: "(T7,T7)",
    formal: "O(i E¬A) ∧ O(j E¬A)",
    natural: "Both must prevent - temporal window (en passant)",
    risk: "low"
  },

  // Asymmetric types
  R8: {
    structure: "(T1,T5)",
    formal: "P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j EA)",
    natural: "Agent i discretion, agent j must act - mandatory transformation",
    risk: "medium"
  },
  R9: {
    structure: "(T2,T5)",
    formal: "P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O(j EA)",
    natural: "Limited power with mandatory action - compound move (castling)",
    risk: "high"
  },
  R10: {
    structure: "(T3,T5)",
    formal: "P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ O(j EA)",
    natural: "Active engagement with mandatory - check response",
    risk: "high"
  },
  R11: {
    structure: "(T1,T5)",
    formal: "P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j EA)",
    natural: "Full discretion with discrete jump - knight movement",
    risk: "low"
  },
  R12: {
    structure: "(T2,T4)",
    formal: "P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)",
    natural: "State-dependent - castling rights",
    risk: "medium"
  },
  R13: {
    structure: "(T1,T7)",
    formal: "P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j E¬A)",
    natural: "Agent i can request, agent j must refuse - terminal state",
    risk: "very_high"
  },
  R14: {
    structure: "(T6,T7)",
    formal: "O(i ILA) ∧ O(j E¬A)",
    natural: "Passivity with prevention - repetition draw",
    risk: "low"
  },
  R15: {
    structure: "(T5,T6)",
    formal: "O(i EA) ∧ O(j ILA)",
    natural: "Mandatory action with passivity - counter-based (50-move)",
    risk: "low"
  },

  // Additional asymmetric combinations
  R16: { structure: "(T1,T2)", formal: "P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ O¬(j E¬A) ∧ P(j ILA)", natural: "Full discretion vs limited power", risk: "low" },
  R17: { structure: "(T1,T3)", formal: "P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ O¬(j ILA)", natural: "Full discretion vs active engagement", risk: "low" },
  R18: { structure: "(T1,T4)", formal: "P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)", natural: "Full discretion vs prevention only", risk: "low" },
  R19: { structure: "(T1,T6)", formal: "P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j ILA)", natural: "Full discretion vs mandatory passivity", risk: "low" },
  R20: { structure: "(T2,T3)", formal: "P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ O¬(j ILA)", natural: "Limited power vs active engagement", risk: "medium" },
  R21: { structure: "(T2,T4)", formal: "P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)", natural: "Limited power vs prevention", risk: "low" },
  R22: { structure: "(T2,T6)", formal: "P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O(j ILA)", natural: "Limited power vs mandatory passivity", risk: "low" },
  R23: { structure: "(T2,T7)", formal: "P(i EA) ∧ O¬(i E¬A) ∧ P(i ILA) ∧ O(j E¬A)", natural: "Limited power vs mandatory prevention", risk: "medium" },
  R24: { structure: "(T3,T4)", formal: "P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ O¬(j EA) ∧ P(j E¬A) ∧ P(j ILA)", natural: "Active engagement vs prevention", risk: "medium" },
  R25: { structure: "(T3,T6)", formal: "P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ O(j ILA)", natural: "Active engagement vs mandatory passivity", risk: "medium" },
  R26: { structure: "(T5,T7)", formal: "O(i EA) ∧ O(j E¬A)", natural: "Direct conflict - i must act, j must prevent", risk: "very_high" },
  R27: { structure: "(T3,T7)", formal: "P(i EA) ∧ P(i E¬A) ∧ O¬(i ILA) ∧ O(j E¬A)", natural: "Active engagement vs mandatory prevention", risk: "high" },
  R28: { structure: "(T4,T5)", formal: "O¬(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j EA)", natural: "Prevention vs mandatory action", risk: "high" },
  R29: { structure: "(T4,T6)", formal: "O¬(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j ILA)", natural: "Prevention vs mandatory passivity", risk: "low" },
  R30: { structure: "(T4,T7)", formal: "O¬(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j E¬A)", natural: "Prevention vs mandatory prevention", risk: "low" },
  R31: { structure: "(T5,T6)", formal: "O(i EA) ∧ O(j ILA)", natural: "Mandatory action vs mandatory passivity", risk: "medium" },
  R32: { structure: "(T6,T7)", formal: "O(i ILA) ∧ O(j E¬A)", natural: "Mandatory passivity vs mandatory prevention", risk: "low" },

  // Reverse asymmetric (j has more capability than i)
  R33: { structure: "(T5,T1)", formal: "O(i EA) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)", natural: "Mandatory action vs full discretion", risk: "medium" },
  R34: { structure: "(T7,T1)", formal: "O(i E¬A) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)", natural: "Mandatory prevention vs full discretion", risk: "medium" },
  R35: { structure: "(T6,T1)", formal: "O(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)", natural: "Mandatory passivity vs full discretion", risk: "low" }
};

// Chess R-type label to KROG R-type mapping
export const CHESS_R_TYPE_MAPPING: Record<string, string> = {
  'R1_asymmetric': 'R1',              // Asymmetric movement (pawn direction)
  'R2_intransitive': 'R2',            // King - intransitive (cannot be captured)
  'R3_path_dependent': 'R3',          // Queen, Rook, Bishop - path dependent
  'R4_capture_only': 'R4',            // Pawn diagonal capture
  'R5_non_capture': 'R5',             // Pawn forward move
  'R6_first_move_special': 'R6',      // Pawn double push
  'R7_temporal_window': 'R7',         // En passant
  'R8_mandatory_transformation': 'R8', // Pawn promotion
  'R9_compound_move': 'R9',           // Castling
  'R10_conditional': 'R10',           // Check response
  'R11_discrete_jump': 'R11',         // Knight movement
  'R12_state_dependent': 'R12',       // Castling rights dependent
  'R13_terminal_state': 'R13',        // Checkmate/stalemate
  'R14_repetition': 'R14',            // Threefold repetition
  'R15_counter_based': 'R15'          // Fifty-move rule
};

// Piece name mapping for JSON-LD
const PIECE_NAMES: Record<string, string> = {
  'p': 'Pawn',
  'n': 'Knight',
  'b': 'Bishop',
  'r': 'Rook',
  'q': 'Queen',
  'k': 'King'
};

/**
 * Generate KROG JSON-LD for a chess move
 * This provides complete logical formulas for neurosymbolic reasoning
 */
export function generateKROGLD(move: {
  id?: number;
  san: string;
  from: string;
  to: string;
  piece: string;
  captured?: string | null;
  fide_ref?: string;
  color?: string;
  game_id?: string;
}, rTypeLabel: string): object {
  // Map chess R-type label to KROG R-type
  const rTypeKey = CHESS_R_TYPE_MAPPING[rTypeLabel] || 'R11';
  const rType = R_TYPES[rTypeKey] || R_TYPES['R11'];

  // Extract T-types from structure
  const structureMatch = rType.structure.match(/\((\w+),(\w+)\)/);
  const tTypeI = structureMatch ? structureMatch[1] : 'T1';
  const tTypeJ = structureMatch ? structureMatch[2] : 'T5';

  const tTypeIData = T_TYPES[tTypeI] || T_TYPES['T1'];
  const tTypeJData = T_TYPES[tTypeJ] || T_TYPES['T5'];

  return {
    "@context": {
      "krog": "https://krog.ai/ontology/",
      "fide": "https://fide.com/rules/",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "schema": "https://schema.org/"
    },
    "@type": "krog:MoveDecision",
    "@id": `krog:move/${move.game_id || 'game'}/${move.id || Date.now()}`,

    "krog:rType": {
      "@id": `krog:${rTypeKey}`,
      "@type": "krog:RelationType",
      "krog:structure": rType.structure,
      "krog:formal": rType.formal,
      "krog:natural": rType.natural,
      "krog:riskLevel": rType.risk
    },

    "krog:agentI": {
      "@type": "krog:Agent",
      "@id": `krog:agent/${move.color || 'player'}`,
      "krog:role": "player",
      "krog:tType": {
        "@id": tTypeIData.iri,
        "@type": "krog:CapabilityProfile",
        "krog:formal": tTypeIData.formal,
        "krog:natural": tTypeIData.natural
      },
      "krog:capabilities": {
        "@type": "krog:CapabilitySet",
        "krog:canAct": tTypeIData.can_act,
        "krog:canRefrain": tTypeIData.can_refrain,
        "krog:canBePassive": tTypeIData.can_be_passive
      }
    },

    "krog:agentJ": {
      "@type": "krog:Agent",
      "@id": `krog:piece/${move.piece}_${move.from}`,
      "krog:role": "piece",
      "krog:pieceType": PIECE_NAMES[move.piece] || move.piece,
      "krog:tType": {
        "@id": tTypeJData.iri,
        "@type": "krog:CapabilityProfile",
        "krog:formal": tTypeJData.formal,
        "krog:natural": tTypeJData.natural
      },
      "krog:capabilities": {
        "@type": "krog:CapabilitySet",
        "krog:canAct": tTypeJData.can_act,
        "krog:canRefrain": tTypeJData.can_refrain,
        "krog:canBePassive": tTypeJData.can_be_passive
      }
    },

    "krog:action": {
      "@type": "krog:ChessMove",
      "krog:san": move.san,
      "krog:fromSquare": move.from,
      "krog:toSquare": move.to,
      "krog:piece": PIECE_NAMES[move.piece] || move.piece,
      "krog:captured": move.captured ? (PIECE_NAMES[move.captured] || move.captured) : null,
      "krog:isCapture": !!move.captured,
      "fide:article": move.fide_ref ? `fide:article/${move.fide_ref}` : null
    },

    "krog:metadata": {
      "@type": "krog:MoveMetadata",
      "schema:dateCreated": new Date().toISOString(),
      "krog:chessRTypeLabel": rTypeLabel,
      "krog:version": "1.0.0"
    }
  };
}

/**
 * Get the KROG R-type key from a chess R-type label
 */
export function getKROGRType(chessRTypeLabel: string): string {
  return CHESS_R_TYPE_MAPPING[chessRTypeLabel] || 'R11';
}

/**
 * Get the T-type data for a given T-type key
 */
export function getTType(key: string) {
  return T_TYPES[key] || T_TYPES['T1'];
}

/**
 * Get the R-type data for a given R-type key
 */
export function getRType(key: string) {
  return R_TYPES[key] || R_TYPES['R11'];
}
