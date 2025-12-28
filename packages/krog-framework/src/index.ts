/**
 * KROG Universal Framework
 *
 * The KROG framework provides a formal mathematical foundation for
 * representing rules and relationships in any game or domain.
 *
 * Core Components:
 * - 7 T-types (agent states)
 * - 35 R-types (bilateral relationships)
 * - 9 modal operators (P, O, F, C, L, W, B, I, D)
 * - Domain functor interface for game-specific mappings
 *
 * Each game (chess, shogi, go, etc.) implements a functor that maps
 * game-specific rules to universal KROG R-types.
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// ============================================================================
// T-TYPES (Agent States)
// ============================================================================

export * from './t-types';

// ============================================================================
// R-TYPES (Bilateral Relationships)
// ============================================================================

export * from './r-types';

// ============================================================================
// MODAL OPERATORS
// ============================================================================

export * from './operators';

// ============================================================================
// VERSION INFO
// ============================================================================

export const VERSION = '1.0.0';
export const AUTHOR = 'Georg Philip Krog';

export const KROG_INFO = {
  version: VERSION,
  author: AUTHOR,
  framework: {
    ttypes: 7,
    rtypes: 35,
    operators: 9
  },
  operators: ['P', 'O', 'F', 'C', 'L', 'W', 'B', 'I', 'D'],
  ttypes: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  iri_base: 'https://legal-ontology.org/krog/'
};
