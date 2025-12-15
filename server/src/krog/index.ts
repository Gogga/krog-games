/**
 * KROG Chess Rule Engine
 *
 * Provides formal logic explanations for chess moves using KROG notation
 * with FIDE rule references in English and Norwegian.
 */

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
