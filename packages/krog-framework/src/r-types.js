/**
 * KROG Universal Framework - R-Types (Bilateral Relationships)
 *
 * The 35 R-types define bilateral relationships between two agents.
 * Each R-type is a combination of two T-types: (Tᵢ, Tⱼ).
 *
 * R₁-R₇: Symmetric relationships (same T-type for both agents)
 * R₈-R₂₇: Asymmetric relationships
 * R₂₈-R₃₅: Reverse asymmetric relationships
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */
// ============================================================================
// R-TYPE MATRIX
// ============================================================================
/**
 * R-Type Matrix showing which R-type corresponds to each (Tᵢ, Tⱼ) combination.
 *
 *       | T₁  | T₂  | T₃  | T₄  | T₅  | T₆  | T₇  |
 * ------|-----|-----|-----|-----|-----|-----|-----|
 * T₁    | R₁  | R₈  | R₉  | R₁₀ | R₁₁ | R₁₂ | R₁₃ |
 * T₂    | R₂₈ | R₂  | R₂₉ | R₁₄ | R₁₅ | R₁₆ | R₁₇ |
 * T₃    | R₃₀ | R₃₁ | R₃  | R₁₈ | R₁₉ | R₂₀ | R₂₁ |
 * T₄    | R₃₂ | R₃₃ | R₃₄ | R₄  | R₂₂ | R₂₃ | R₂₄ |
 * T₅    | R₃₅ | ... | ... | ... | R₅  | R₂₅ | R₂₆ |
 * T₆    | ... | ... | ... | ... | ... | R₆  | R₂₇ |
 * T₇    | ... | ... | ... | ... | ... | ... | R₇  |
 */
export const RTypeMatrix = {
    T1: { T1: 'R1', T2: 'R8', T3: 'R9', T4: 'R10', T5: 'R11', T6: 'R12', T7: 'R13' },
    T2: { T1: 'R28', T2: 'R2', T3: 'R29', T4: 'R14', T5: 'R15', T6: 'R16', T7: 'R17' },
    T3: { T1: 'R30', T2: 'R31', T3: 'R3', T4: 'R18', T5: 'R19', T6: 'R20', T7: 'R21' },
    T4: { T1: 'R32', T2: 'R33', T3: 'R34', T4: 'R4', T5: 'R22', T6: 'R23', T7: 'R24' },
    T5: { T1: 'R35', T2: 'R15', T3: 'R19', T4: 'R22', T5: 'R5', T6: 'R25', T7: 'R26' },
    T6: { T1: 'R12', T2: 'R16', T3: 'R20', T4: 'R23', T5: 'R25', T6: 'R6', T7: 'R27' },
    T7: { T1: 'R13', T2: 'R17', T3: 'R21', T4: 'R24', T5: 'R26', T6: 'R27', T7: 'R7' }
};
// ============================================================================
// KEY R-TYPE DEFINITIONS
// ============================================================================
export const RTypeDefinitions = {
    // Symmetric relationships
    R1: {
        id: 'R1',
        iri: 'https://legal-ontology.org/krog/R1',
        structure: { agent1: 'T1', agent2: 'T1' },
        formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ P(j EA) ∧ P(j E¬A) ∧ P(j ILA)',
        natural: {
            en: 'Both agents have full discretion - perfect symmetry',
            no: 'Begge agenter har full diskresjon - perfekt symmetri'
        },
        asymmetry: 0,
        risk: 'low',
        stability: 'stable',
        useCases: ['Equal AI agents', 'Peer-to-peer systems', 'Equal partnerships']
    },
    R5: {
        id: 'R5',
        iri: 'https://legal-ontology.org/krog/R5',
        structure: { agent1: 'T5', agent2: 'T5' },
        formal: 'O(i EA) ∧ O(j EA)',
        natural: {
            en: 'Both agents must act - mutual obligation',
            no: 'Begge agenter må handle - gjensidig forpliktelse'
        },
        asymmetry: 0,
        risk: 'medium',
        stability: 'stable',
        useCases: ['Bilateral SLAs', 'Mutual contracts', 'Exchange agreements']
    },
    R6: {
        id: 'R6',
        iri: 'https://legal-ontology.org/krog/R6',
        structure: { agent1: 'T6', agent2: 'T6' },
        formal: 'O(i ILA) ∧ O(j ILA)',
        natural: {
            en: 'Both must be passive - mutual non-interference',
            no: 'Begge må være passive - gjensidig ikke-innblanding'
        },
        asymmetry: 0,
        risk: 'low',
        stability: 'stable',
        useCases: ['Read-only agreements', 'Observation protocols']
    },
    // Authority relationships
    R11: {
        id: 'R11',
        iri: 'https://legal-ontology.org/krog/R11',
        structure: { agent1: 'T1', agent2: 'T5' },
        formal: 'P(i EA) ∧ P(i E¬A) ∧ P(i ILA) ∧ O(j EA)',
        natural: {
            en: 'Agent i has full discretion, agent j must act',
            no: 'Agent i har full diskresjon, agent j må handle'
        },
        asymmetry: 6,
        risk: 'high',
        stability: 'conditional',
        useCases: ['User commands AI', 'Manager-employee', 'Client-contractor']
    },
    // Conflict relationships (AVOID)
    R26: {
        id: 'R26',
        iri: 'https://legal-ontology.org/krog/R26',
        structure: { agent1: 'T5', agent2: 'T7' },
        formal: 'O(i EA) ∧ O(j E¬A)',
        natural: {
            en: 'Agent i must act, agent j must prevent - DIRECT CONFLICT',
            no: 'Agent i må handle, agent j må forhindre - DIREKTE KONFLIKT'
        },
        asymmetry: 10,
        risk: 'very_high',
        stability: 'unstable',
        useCases: ['Creates unresolvable deadlock - AVOID']
    }
};
// ============================================================================
// R-TYPE UTILITIES
// ============================================================================
/**
 * Get R-type for a given pair of T-types
 */
export function getRType(agent1, agent2) {
    return RTypeMatrix[agent1][agent2];
}
/**
 * Get R-type definition by ID
 */
export function getRTypeDefinition(rtype) {
    return RTypeDefinitions[rtype];
}
/**
 * Check if an R-type is symmetric (same T-type for both agents)
 */
export function isSymmetric(rtype) {
    const symmetric = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
    return symmetric.includes(rtype);
}
/**
 * Get the asymmetry score for an R-type (0-10, 0 = symmetric)
 */
export function getAsymmetry(rtype) {
    const def = RTypeDefinitions[rtype];
    return def?.asymmetry ?? 0;
}
/**
 * Get the risk level for an R-type
 */
export function getRisk(rtype) {
    const def = RTypeDefinitions[rtype];
    return def?.risk ?? 'medium';
}
/**
 * Check if an R-type should be avoided (conflict relationship)
 */
export function shouldAvoid(rtype) {
    const conflictTypes = ['R26', 'R13'];
    return conflictTypes.includes(rtype);
}
//# sourceMappingURL=r-types.js.map