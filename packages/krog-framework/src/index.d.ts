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
export * from './types';
export * from './t-types';
export * from './r-types';
export * from './operators';
export declare const VERSION = "1.0.0";
export declare const AUTHOR = "Georg Philip Krog";
export declare const KROG_INFO: {
    version: string;
    author: string;
    framework: {
        ttypes: number;
        rtypes: number;
        operators: number;
    };
    operators: string[];
    ttypes: string[];
    iri_base: string;
};
//# sourceMappingURL=index.d.ts.map