import type { RType, TType } from '@krog/krog-framework';

/**
 * KROG Recommendation Types
 * Cross-game recommendations based on R-type patterns
 */

// ============================================
// Core Recommendation Types
// ============================================

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: number;        // 0-1, higher = more important
  confidence: number;      // 0-1, how confident we are in this rec

  // What's being recommended
  title: string;
  description: string;

  // Target content
  targetGameId?: string;
  targetContentId?: string;
  targetRTypes: RType[];

  // Why this recommendation
  reasoning: RecommendationReasoning;

  // Action
  actionLabel: string;
  actionUrl?: string;

  // Expiry
  expiresAt?: number;
  dismissed?: boolean;
}

export type RecommendationType =
  | 'game'              // Recommend playing a specific game
  | 'lesson'            // Recommend a lesson
  | 'puzzle'            // Recommend puzzles
  | 'practice'          // Recommend practice session
  | 'review'            // Recommend reviewing past games
  | 'challenge'         // Recommend challenging a friend
  | 'tournament'        // Recommend joining a tournament
  | 'break';            // Recommend taking a break (fatigue detection)

export interface RecommendationReasoning {
  type: ReasoningType;

  // Primary R-type connection
  primaryRType?: RType;

  // Supporting data
  sourceGames?: string[];      // Games that informed this rec
  skillGap?: string;           // If addressing a skill gap
  pattern?: string;            // If based on a detected pattern

  // Detailed explanation
  explanation: string;
}

export type ReasoningType =
  | 'skill_transfer'        // Leverage skills from one game to another
  | 'skill_gap'             // Address a weakness
  | 'reinforcement'         // Reinforce a strength
  | 'exploration'           // Try something new
  | 'engagement'            // Keep user engaged
  | 'fatigue'               // User showing signs of fatigue
  | 'milestone'             // Approaching a milestone
  | 'social';               // Social/competitive opportunity

// ============================================
// Game Similarity Types
// ============================================

export interface GameSimilarity {
  gameA: string;
  gameB: string;

  // Overall similarity score
  overallSimilarity: number;  // 0-1

  // R-type overlap
  sharedRTypes: RType[];
  rTypeSimilarity: number;

  // Gameplay similarity
  mechanicsSimilarity: number;
  complexitySimilarity: number;

  // Transfer potential
  transferPotential: number;
  transferDirection: 'bidirectional' | 'a_to_b' | 'b_to_a';
}

export interface GameProfile {
  gameId: string;
  name: string;
  description: string;

  // KROG characteristics
  primaryRTypes: RType[];
  secondaryRTypes: RType[];
  tTypeDistribution: Record<TType, number>;

  // Complexity metrics
  complexity: number;           // 0-1
  learningCurve: number;        // 0-1 (0 = steep, 1 = gentle)
  averageGameDuration: number;  // minutes

  // Player base
  activePlayerCount: number;
  averagePlayerSkill: number;

  // Tags
  tags: string[];
}

// ============================================
// Recommendation Context Types
// ============================================

export interface RecommendationContext {
  userId: string;
  timestamp: number;

  // Current session state
  sessionDuration: number;        // minutes
  gamesPlayedThisSession: number;
  currentFatigue: number;         // 0-1

  // Recent activity
  recentGames: string[];
  recentRTypes: RType[];

  // User preferences
  preferredGames?: string[];
  excludedGames?: string[];
  preferredSessionLength?: number;

  // Goals
  activeGoals?: LearningGoal[];
}

export interface LearningGoal {
  id: string;
  type: 'rtype_mastery' | 'game_mastery' | 'achievement' | 'custom';

  // Target
  targetRType?: RType;
  targetGame?: string;
  targetValue?: number;

  // Progress
  currentProgress: number;
  targetProgress: number;

  // Timeline
  deadline?: number;
}

// ============================================
// Recommendation Feed Types
// ============================================

export interface RecommendationFeed {
  userId: string;
  generatedAt: number;

  // Recommendations
  recommendations: Recommendation[];

  // Feed metadata
  totalGenerated: number;
  filteredCount: number;

  // Next refresh
  refreshIn: number;  // seconds
}

export interface RecommendationFilter {
  types?: RecommendationType[];
  games?: string[];
  rTypes?: RType[];
  minPriority?: number;
  minConfidence?: number;
  excludeDismissed?: boolean;
  limit?: number;
}

// ============================================
// Cross-Game Path Types
// ============================================

export interface CrossGamePath {
  id: string;
  name: string;
  description: string;

  // Path structure
  stages: CrossGameStage[];

  // Target outcomes
  targetRTypes: RType[];
  expectedDuration: number;  // days

  // Prerequisites
  prerequisites: {
    minGlobalSkill?: number;
    requiredGames?: string[];
    requiredRTypes?: RType[];
  };
}

export interface CrossGameStage {
  stageNumber: number;
  gameId: string;
  focus: RType[];

  // Stage goals
  masteryTarget: number;  // 0-1
  estimatedDuration: number;  // days

  // How this stage connects to next
  transferSkills: RType[];
  transitionTip: string;
}

// ============================================
// A/B Testing Types
// ============================================

export interface RecommendationExperiment {
  id: string;
  name: string;

  // Variants
  variants: RecommendationVariant[];

  // Assignment
  assignmentStrategy: 'random' | 'skill_based' | 'game_based';

  // Metrics to track
  targetMetrics: string[];

  // Status
  status: 'draft' | 'running' | 'completed';
  startDate?: number;
  endDate?: number;
}

export interface RecommendationVariant {
  id: string;
  name: string;
  weight: number;  // 0-1, relative probability

  // What's different about this variant
  algorithmOverrides: Partial<RecommendationConfig>;
}

export interface RecommendationConfig {
  // Weights for different factors
  skillGapWeight: number;
  transferWeight: number;
  engagementWeight: number;
  explorationWeight: number;

  // Thresholds
  fatigueThreshold: number;
  minimumConfidence: number;

  // Diversity
  maxSameType: number;
  gameRotationDays: number;
}
