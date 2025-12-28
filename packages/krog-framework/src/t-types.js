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
// ============================================================================
// T-TYPE DEFINITIONS
// ============================================================================
export const TTypeDefinitions = {
    T1: {
        id: 'T1',
        iri: 'https://legal-ontology.org/krog/T1',
        formal: 'P(i EA) ∧ P(i E¬A) ∧ P(ILA)',
        natural: {
            en: 'Full discretion - can act, refrain, or be passive',
            no: 'Full diskresjon - kan handle, avstå, eller være passiv'
        },
        capabilities: { canAct: true, canRefrain: true, canBePassive: true },
        restrictions: 'none',
        useCases: ['AI assistants with full autonomy', 'Human users with complete rights', 'Equal partnerships']
    },
    T2: {
        id: 'T2',
        iri: 'https://legal-ontology.org/krog/T2',
        formal: 'P(i EA) ∧ O¬(i E¬A) ∧ P(ILA)',
        natural: {
            en: 'Limited power - can act or be passive, cannot refrain',
            no: 'Begrenset makt - kan handle eller være passiv, kan ikke nekte'
        },
        capabilities: { canAct: true, canRefrain: false, canBePassive: true },
        restrictions: 'Cannot refuse to act if engaged',
        useCases: ['Customer service bots', 'Compliance systems', 'Service providers with SLAs']
    },
    T3: {
        id: 'T3',
        iri: 'https://legal-ontology.org/krog/T3',
        formal: 'P(i EA) ∧ P(i E¬A) ∧ O¬(ILA)',
        natural: {
            en: 'Active engagement required - must take a stance',
            no: 'Aktiv engasjement påkrevd - må ta standpunkt'
        },
        capabilities: { canAct: true, canRefrain: true, canBePassive: false },
        restrictions: 'Must engage, cannot ignore',
        useCases: ['Decision-making AI', 'Approval systems', 'Judicial roles']
    },
    T4: {
        id: 'T4',
        iri: 'https://legal-ontology.org/krog/T4',
        formal: 'O¬(i EA) ∧ P(i E¬A) ∧ P(ILA)',
        natural: {
            en: 'Prevention power only - cannot initiate, can block',
            no: 'Kun forebyggende makt - kan ikke initiere, kan blokkere'
        },
        capabilities: { canAct: false, canRefrain: true, canBePassive: true },
        restrictions: 'Cannot initiate action',
        useCases: ['Firewall systems', 'Content filters', 'Veto authorities']
    },
    T5: {
        id: 'T5',
        iri: 'https://legal-ontology.org/krog/T5',
        formal: 'O(i EA)',
        natural: {
            en: 'Mandatory action - must act, no other options',
            no: 'Obligatorisk handling - må handle, ingen andre valg'
        },
        capabilities: { canAct: true, canRefrain: false, canBePassive: false },
        restrictions: 'Must perform action',
        useCases: ['Automated response systems', 'Legal duties', 'SLA-bound services']
    },
    T6: {
        id: 'T6',
        iri: 'https://legal-ontology.org/krog/T6',
        formal: 'O(ILA)',
        natural: {
            en: 'Mandatory passivity - must remain passive',
            no: 'Obligatorisk passivitet - må forbli passiv'
        },
        capabilities: { canAct: false, canRefrain: false, canBePassive: true },
        restrictions: 'Cannot interfere',
        useCases: ['Read-only systems', 'Observers', 'Non-interference agreements']
    },
    T7: {
        id: 'T7',
        iri: 'https://legal-ontology.org/krog/T7',
        formal: 'O(i E¬A)',
        natural: {
            en: 'Mandatory prevention - must prevent/refuse',
            no: 'Obligatorisk forebygging - må forhindre/nekte'
        },
        capabilities: { canAct: false, canRefrain: true, canBePassive: false },
        restrictions: 'Must block action',
        useCases: ['Security systems', 'Safety shutoffs', 'Content moderation']
    }
};
// ============================================================================
// T-TYPE UTILITIES
// ============================================================================
/**
 * Get T-type definition by ID
 */
export function getTTypeDefinition(ttype) {
    return TTypeDefinitions[ttype];
}
/**
 * Get all T-type definitions
 */
export function getAllTTypes() {
    return Object.values(TTypeDefinitions);
}
/**
 * Get T-type capabilities
 */
export function getTTypeCapabilities(ttype) {
    return TTypeDefinitions[ttype].capabilities;
}
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
export function determineTType(constraints) {
    if (constraints.mustAct)
        return 'T5';
    if (constraints.mustBePassive)
        return 'T6';
    if (constraints.mustPrevent)
        return 'T7';
    if (constraints.canInitiate === false)
        return 'T4';
    if (constraints.mustEngage)
        return 'T3';
    if (constraints.canRefuse === false)
        return 'T2';
    return 'T1';
}
//# sourceMappingURL=t-types.js.map