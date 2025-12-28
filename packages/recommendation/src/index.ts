/**
 * @krog/recommendation
 * Cross-game recommendations based on R-type patterns
 */

// Types
export type {
  Recommendation,
  RecommendationType,
  RecommendationReasoning,
  ReasoningType,
  GameSimilarity,
  GameProfile,
  RecommendationContext,
  LearningGoal,
  RecommendationFeed,
  RecommendationFilter,
  CrossGamePath,
  CrossGameStage,
  RecommendationExperiment,
  RecommendationVariant,
  RecommendationConfig,
} from './types';

// Engine
export { RecommendationEngine } from './engine';
