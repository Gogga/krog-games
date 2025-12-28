/**
 * KROG Universal Framework - T-Types (Agent States)
 *
 * The 7 T-types define fundamental states an agent can occupy with respect to an action.
 * Every agent in any rule system maps to exactly one T-type.
 *
 * T₁: Full Discretion - can act, refrain, or be passive
 * T₂: Limited Power - can act or be passive, cannot refrain
 * T₃: Active Engagement Required - must take a stance
 * T₄: Prevention Only - cannot initiate, can block
 * T₅: Mandatory Action - must act, no other options
 * T₆: Mandatory Passivity - must remain passive
 * T₇: Mandatory Prevention - must prevent/refuse
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */
import type { TType, TTypeDefinition, TTypeCapabilities } from './types';
export declare const TTypeDefinitions: Record<TType, TTypeDefinition>;
/**
 * Get T-type definition by ID
 */
export declare function getTTypeDefinition(ttype: TType): TTypeDefinition;
/**
 * Get all T-type definitions
 */
export declare function getAllTTypes(): TTypeDefinition[];
/**
 * Get T-type capabilities
 */
export declare function getTTypeCapabilities(ttype: TType): TTypeCapabilities;
/**
 * T-Type Selection Guide - determines T-type based on constraints
 *
 * Question 1: Must the agent take action? → Yes: T₅
 * Question 2: Must the agent remain passive? → Yes: T₆
 * Question 3: Must the agent prevent/block? → Yes: T₇
 * Question 4: Can the agent initiate action? → No: T₄
 * Question 5: Must the agent engage (no passivity)? → Yes: T₃
 * Question 6: Can the agent refuse if engaged? → No: T₂, Yes: T₁
 */
export declare function determineTType(constraints: {
    mustAct?: boolean;
    mustBePassive?: boolean;
    mustPrevent?: boolean;
    canInitiate?: boolean;
    mustEngage?: boolean;
    canRefuse?: boolean;
}): TType;
//# sourceMappingURL=t-types.d.ts.map