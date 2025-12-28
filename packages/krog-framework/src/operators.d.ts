/**
 * KROG Universal Framework - Modal Operators
 *
 * The 9 core KROG operators based on Hohfeldian legal relations.
 *
 * Permission (P) - action is permitted
 * Obligation (O) - action is required
 * Prohibition (F) - action is forbidden
 * Claim (C) - player can claim a right
 * Liberty (L) - player has freedom to act
 * Power (W) - ability to perform action
 * Immunity (B) - protection from action
 * Disability (I) - cannot perform action
 * Liability (D) - subject to consequence
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */
import type { ModalOperator, OperatorDefinition } from './types';
export declare const OperatorDefinitions: Record<ModalOperator, OperatorDefinition>;
/**
 * Get operator definition by symbol
 */
export declare function getOperatorDefinition(op: ModalOperator): OperatorDefinition;
/**
 * Get all operator definitions
 */
export declare function getAllOperators(): OperatorDefinition[];
/**
 * Get dual operator (if exists)
 */
export declare function getDual(op: ModalOperator): ModalOperator | undefined;
/**
 * Check if permission implies non-obligation-to-not
 * P(φ) ≡ ¬O¬(φ)
 */
export declare function permissionFromObligation(obligatedNot: boolean): boolean;
/**
 * Check if obligation implies non-permission-to-not
 * O(φ) ≡ ¬P¬(φ)
 */
export declare function obligationFromPermission(permittedNot: boolean): boolean;
/**
 * Prohibition is equivalent to obligation-not and non-permission
 * F(φ) ≡ O¬(φ) ≡ ¬P(φ)
 */
export declare function prohibitionFromPermission(permitted: boolean): boolean;
/**
 * Liberty is equivalent to non-duty
 * L(i,φ) ≡ ¬D(i,¬φ)
 */
export declare function libertyFromDuty(dutyNot: boolean): boolean;
/**
 * Disability is equivalent to non-power
 * I(i,φ) ≡ ¬W(i,φ)
 */
export declare function disabilityFromPower(hasPower: boolean): boolean;
//# sourceMappingURL=operators.d.ts.map