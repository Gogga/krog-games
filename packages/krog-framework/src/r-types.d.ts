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
import type { RType, RTypeDefinition, TType } from './types';
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
export declare const RTypeMatrix: Record<TType, Record<TType, RType>>;
export declare const RTypeDefinitions: Partial<Record<RType, RTypeDefinition>>;
/**
 * Get R-type for a given pair of T-types
 */
export declare function getRType(agent1: TType, agent2: TType): RType;
/**
 * Get R-type definition by ID
 */
export declare function getRTypeDefinition(rtype: RType): RTypeDefinition | undefined;
/**
 * Check if an R-type is symmetric (same T-type for both agents)
 */
export declare function isSymmetric(rtype: RType): boolean;
/**
 * Get the asymmetry score for an R-type (0-10, 0 = symmetric)
 */
export declare function getAsymmetry(rtype: RType): number;
/**
 * Get the risk level for an R-type
 */
export declare function getRisk(rtype: RType): 'low' | 'medium' | 'high' | 'very_high';
/**
 * Check if an R-type should be avoided (conflict relationship)
 */
export declare function shouldAvoid(rtype: RType): boolean;
//# sourceMappingURL=r-types.d.ts.map