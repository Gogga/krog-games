/**
 * KROG Chess Rule Engine
 *
 * Provides formal logic explanations for chess moves using KROG notation
 * with FIDE rule references in English and Norwegian.
 *
 * This module integrates the complete KROG mathematical framework with
 * 36 operators across 5 categories: Core (9), Piece Logic (8), Board Logic (8),
 * Notation (6), and Temporal (5).
 */

// =============================================================================
// KROG FRAMEWORK INTEGRATION
// Re-export the complete mathematical framework
// =============================================================================

export {
  // Main engine
  KROGChessEngine,
  createKROGEngine,

  // Core operators (P, O, F, C, L, W, B, I, D)
  CoreOperators,
  PermissionOperator,
  ObligationOperator,
  ProhibitionOperator,
  ClaimOperator,
  LibertyOperator,
  PowerOperator,
  ImmunityOperator,
  DisabilityOperator,
  LiabilityOperator,

  // Piece logic operators (PM, PC, PA, NV, PD, CR, EP, PO)
  PieceLogicOperators,
  PM_Operator,
  PC_Operator,
  PA_Operator,
  CR_Operator,
  EP_Operator,
  PO_Operator,
  NV_Operator,
  PD_Operator,

  // Board logic operators (PV, MH, CS, LMG, GT, TC, PR, FMC)
  BoardLogicOperators,
  PV_Operator,
  MH_Operator,
  CS_Operator,
  LMG_Operator,
  GT_Operator,
  TC_Operator,
  PR_Operator,
  FMC_Operator,

  // Notation operators (PSA, PLA, PUCI, PVN, GN, NC)
  NotationOperators,
  PSA_Operator,
  PLA_Operator,
  PUCI_Operator,
  PVN_Operator,
  GN_Operator,
  NC_Operator,

  // Temporal operators (G, F, X, U, R)
  TemporalOperators,
  G_Operator,
  F_Operator,
  X_Operator,
  U_Operator,
  R_Operator,
  TemporalPatterns,

  // R-Type classification
  RTypeClassifier,
  RTypeDefinitions,

  // Rules database
  KROGRules,
  getRuleById,
  getRulesByOperator,
  getRulesByRType,
  getAllRules,
  getRTypeDefinition,

  // Version info
  VERSION as KROG_VERSION,
  KROG_INFO
} from '../krog-framework';

// Re-export framework types
export type {
  RType,
  KROGValidation,
  KROGRuleJSON,
  KROGRule,
  PMResult,
  PCResult,
  PAResult,
  CRResult,
  EPResult,
  POResult,
  CSResult,
  LMGResult,
  GTResult,
  PRResult,
  FMCResult
} from '../krog-framework';

// =============================================================================
// ORIGINAL KROG MODULE EXPORTS
// Maintained for backwards compatibility
// =============================================================================

// Type exports
export {
  ModalOperator,
  TType,
  PieceType,
  Color,
  Square,
  MoveType,
  FIDEReference,
  KROGFormula,
  MovementRule,
  SpecialMoveRule,
  MoveExplanation,
  IllegalMoveExplanation,
  IllegalMoveReason,
  FIDE_ARTICLES,
  FIDE_SPECIAL
} from './types';

// Piece movement exports
export {
  squareToCoords,
  coordsToSquare,
  isPathClear,
  isDiagonal,
  isRankOrFile,
  isLShape,
  isAdjacent,
  isSquareAttacked,
  generateKROGFormula,
  MOVEMENT_CHECKERS,
  getPieceName
} from './pieces';

// Special move exports
export {
  checkCastlingConditions,
  getCastlingFormula,
  checkEnPassantConditions,
  getEnPassantFormula,
  checkPromotionConditions,
  getPromotionFormula,
  detectSpecialMove
} from './special';

// Explainer exports
export {
  explainLegalMove,
  explainIllegalMove,
  explainMove
} from './explainer';

// Principle detection exports
export {
  KROGPrinciple,
  PrincipleResult,
  OPENING_PRINCIPLES,
  controlCenter,
  developPieces,
  kingSafety,
  dontMovePieceTwice,
  getApplicablePrinciples,
  evaluatePrinciples,
  evaluatePositionPrinciples
} from './principles';

// Tactical pattern exports
export {
  TacticalResult,
  detectFork,
  detectPin,
  detectTacticsAfterMove,
  getCurrentTactics
} from './tactics';

// Position evaluator exports
export {
  GamePhase,
  PositionEvaluation,
  evaluatePosition,
  determinePhase,
  getGamePhase,
  isOpeningPhase,
  getMaterialAdvantage
} from './evaluator';

// Move analyzer exports
export {
  KROGMoveAnalysis,
  analyzeMove,
  quickAnalyzeMove,
  analyzeAllMoves,
  compareMoves
} from './analyzer';

// Opening book exports
export {
  BookMove,
  OpeningInfo,
  loadOpeningBook,
  lookupPosition,
  getBookMoves,
  isBookMove,
  getBookMoveWinRate,
  isInBook,
  getBookSize
} from './openingBook';

// Scorer exports
export {
  ScoringContext,
  ScoringWeights,
  ScoreComponents,
  MoveScore,
  getWeights,
  calculateMoveScore,
  scoreAllMoves,
  getBestMove,
  getMoveQuality,
  explainScore
} from './scorer';

// Ranker exports
export {
  MoveClassification,
  MoveSuggestion,
  SuggestionsResponse,
  classifyMove,
  suggestMoves,
  quickSuggestMoves,
  evaluatePlayedMove,
  getTeachingFeedback
} from './ranker';

// Convenience type for API responses
export interface KROGExplanationResponse {
  formula: string;
  operator: string;
  tType: string;
  fide: {
    article: string;
    en: string;
    no: string;
  };
  explanation: {
    en: string;
    no: string;
  };
  conditions: {
    name: string;
    met: boolean;
    description: string;
  }[];
}
