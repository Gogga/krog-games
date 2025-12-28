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
// ============================================================================
// OPERATOR DEFINITIONS
// ============================================================================
export const OperatorDefinitions = {
    P: {
        symbol: 'P',
        name: { en: 'Permission', no: 'Tillatelse' },
        formal: 'P(φ) ≡ ¬O¬(φ)',
        natural: {
            en: 'Action φ is permitted (it is not obligatory that φ does not happen)',
            no: 'Handling φ er tillatt (det er ikke påbudt at φ ikke skjer)'
        },
        dual: 'O'
    },
    O: {
        symbol: 'O',
        name: { en: 'Obligation', no: 'Forpliktelse' },
        formal: 'O(φ) ≡ ¬P¬(φ)',
        natural: {
            en: 'Action φ is obligatory (it is not permitted that φ does not happen)',
            no: 'Handling φ er påbudt (det er ikke tillatt at φ ikke skjer)'
        },
        dual: 'P'
    },
    F: {
        symbol: 'F',
        name: { en: 'Prohibition', no: 'Forbud' },
        formal: 'F(φ) ≡ O¬(φ) ≡ ¬P(φ)',
        natural: {
            en: 'Action φ is forbidden',
            no: 'Handling φ er forbudt'
        }
    },
    C: {
        symbol: 'C',
        name: { en: 'Claim', no: 'Krav' },
        formal: 'C(i,j,φ)',
        natural: {
            en: 'Agent i has a claim against j that φ happens',
            no: 'Agent i har krav overfor j om at φ skjer'
        },
        dual: 'D'
    },
    L: {
        symbol: 'L',
        name: { en: 'Liberty', no: 'Frihet' },
        formal: 'L(i,φ) ≡ ¬D(i,¬φ)',
        natural: {
            en: 'Agent i has liberty to do φ (no duty not to)',
            no: 'Agent i har frihet til å gjøre φ (ingen plikt til ikke å gjøre det)'
        }
    },
    W: {
        symbol: 'W',
        name: { en: 'Power', no: 'Makt' },
        formal: 'W(i,φ)',
        natural: {
            en: 'Agent i has power to bring about φ',
            no: 'Agent i har makt til å få til φ'
        },
        dual: 'I'
    },
    B: {
        symbol: 'B',
        name: { en: 'Immunity', no: 'Immunitet' },
        formal: 'B(i,j,φ)',
        natural: {
            en: 'Agent i is immune from j changing φ',
            no: 'Agent i er immun mot at j endrer φ'
        },
        dual: 'D'
    },
    I: {
        symbol: 'I',
        name: { en: 'Disability', no: 'Manglende evne' },
        formal: 'I(i,φ) ≡ ¬W(i,φ)',
        natural: {
            en: 'Agent i is disabled from bringing about φ',
            no: 'Agent i mangler evne til å få til φ'
        },
        dual: 'W'
    },
    D: {
        symbol: 'D',
        name: { en: 'Liability', no: 'Ansvar' },
        formal: 'D(i,j,φ)',
        natural: {
            en: 'Agent i is liable to j for φ',
            no: 'Agent i er ansvarlig overfor j for φ'
        },
        dual: 'C'
    }
};
// ============================================================================
// OPERATOR UTILITIES
// ============================================================================
/**
 * Get operator definition by symbol
 */
export function getOperatorDefinition(op) {
    return OperatorDefinitions[op];
}
/**
 * Get all operator definitions
 */
export function getAllOperators() {
    return Object.values(OperatorDefinitions);
}
/**
 * Get dual operator (if exists)
 */
export function getDual(op) {
    return OperatorDefinitions[op].dual;
}
// ============================================================================
// OPERATOR LOGIC
// ============================================================================
/**
 * Check if permission implies non-obligation-to-not
 * P(φ) ≡ ¬O¬(φ)
 */
export function permissionFromObligation(obligatedNot) {
    return !obligatedNot;
}
/**
 * Check if obligation implies non-permission-to-not
 * O(φ) ≡ ¬P¬(φ)
 */
export function obligationFromPermission(permittedNot) {
    return !permittedNot;
}
/**
 * Prohibition is equivalent to obligation-not and non-permission
 * F(φ) ≡ O¬(φ) ≡ ¬P(φ)
 */
export function prohibitionFromPermission(permitted) {
    return !permitted;
}
/**
 * Liberty is equivalent to non-duty
 * L(i,φ) ≡ ¬D(i,¬φ)
 */
export function libertyFromDuty(dutyNot) {
    return !dutyNot;
}
/**
 * Disability is equivalent to non-power
 * I(i,φ) ≡ ¬W(i,φ)
 */
export function disabilityFromPower(hasPower) {
    return !hasPower;
}
//# sourceMappingURL=operators.js.map