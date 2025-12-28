/**
 * KROG Universal Framework - Type Definitions
 *
 * The KROG framework defines:
 * - 7 T-types (agent states)
 * - 35 R-types (bilateral relationships)
 * - 9 modal operators (P, O, F, C, L, W, B, I, D)
 *
 * Each game domain (chess, shogi, go, etc.) implements a functor
 * that maps domain-specific concepts to universal KROG R-types.
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */
/**
 * The 7 fundamental T-types define agent states with respect to an action.
 * Every agent maps to exactly one T-type.
 */
export type TType = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7';
/**
 * T-type capabilities
 */
export interface TTypeCapabilities {
    canAct: boolean;
    canRefrain: boolean;
    canBePassive: boolean;
}
/**
 * T-type definition with full metadata
 */
export interface TTypeDefinition {
    id: TType;
    iri: string;
    formal: string;
    natural: {
        en: string;
        no: string;
    };
    capabilities: TTypeCapabilities;
    restrictions: string;
    useCases: string[];
}
/**
 * The 35 R-types define bilateral relationships between two agents.
 * Each R-type is a combination of two T-types: (Tᵢ, Tⱼ).
 *
 * R₁-R₇: Symmetric relationships (Tᵢ, Tᵢ)
 * R₈-R₂₇: Asymmetric relationships (Tᵢ, Tⱼ where i < j)
 * R₂₈-R₃₅: Reverse asymmetric relationships
 */
export type RType = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9' | 'R10' | 'R11' | 'R12' | 'R13' | 'R14' | 'R15' | 'R16' | 'R17' | 'R18' | 'R19' | 'R20' | 'R21' | 'R22' | 'R23' | 'R24' | 'R25' | 'R26' | 'R27' | 'R28' | 'R29' | 'R30' | 'R31' | 'R32' | 'R33' | 'R34' | 'R35';
/**
 * R-type structure showing the T-type combination
 */
export interface RTypeStructure {
    agent1: TType;
    agent2: TType;
}
/**
 * R-type definition with full metadata
 */
export interface RTypeDefinition {
    id: RType;
    iri: string;
    structure: RTypeStructure;
    formal: string;
    natural: {
        en: string;
        no: string;
    };
    asymmetry: number;
    risk: 'low' | 'medium' | 'high' | 'very_high';
    stability: 'stable' | 'conditional' | 'unstable';
    useCases: string[];
}
/**
 * The 9 core KROG modal operators based on Hohfeldian legal relations.
 */
export type ModalOperator = 'P' | 'O' | 'F' | 'C' | 'L' | 'W' | 'B' | 'I' | 'D';
/**
 * Operator definition
 */
export interface OperatorDefinition {
    symbol: ModalOperator;
    name: {
        en: string;
        no: string;
    };
    formal: string;
    natural: {
        en: string;
        no: string;
    };
    dual?: ModalOperator;
}
/**
 * Every game domain must implement this functor interface to map
 * domain-specific concepts to universal KROG R-types.
 *
 * Traversal between domains:
 * Domain₁ → Domain₂ = F⁻¹_Domain₂ ∘ F_Domain₁
 */
export interface KROGDomainFunctor<TDomainConcept> {
    /**
     * Domain identifier
     */
    readonly domainId: string;
    /**
     * Domain name
     */
    readonly domainName: {
        en: string;
        no: string;
    };
    /**
     * Map a domain concept to its universal R-type
     */
    toRType(concept: TDomainConcept): RType;
    /**
     * Map a universal R-type back to domain concept(s)
     */
    fromRType(rtype: RType): TDomainConcept[];
    /**
     * Get the primary R-types used in this domain
     */
    getPrimaryRTypes(): RType[];
    /**
     * Get all domain concepts that map to a given R-type
     */
    getConceptsByRType(rtype: RType): TDomainConcept[];
}
/**
 * A game rule with KROG mapping
 */
export interface KROGGameRule {
    id: string;
    name: {
        en: string;
        no: string;
    };
    description: {
        en: string;
        no: string;
    };
    rtype: RType;
    ttype: TType;
    operators: ModalOperator[];
    formula: string;
    reference?: {
        section: string;
        source: string;
    };
}
/**
 * Result of validating a game action against KROG rules
 */
export interface KROGValidationResult {
    valid: boolean;
    rtype: RType;
    ttype: TType;
    operators: ModalOperator[];
    formula: string;
    explanation: {
        en: string;
        no: string;
    };
    rule?: KROGGameRule;
}
/**
 * An agent in the KROG framework
 */
export interface KROGAgent {
    id: string;
    ttype: TType;
    capabilities: TTypeCapabilities;
}
/**
 * A bilateral relationship between two agents
 */
export interface KROGRelationship {
    agent1: KROGAgent;
    agent2: KROGAgent;
    rtype: RType;
}
//# sourceMappingURL=types.d.ts.map