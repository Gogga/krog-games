import type { RType, TType, ModalOperator } from '@krog/krog-framework';

/**
 * KROG Analytics Types
 * Cross-game event tracking and decision analysis
 */

// ============================================
// Core Event Types
// ============================================

export interface DecisionEvent {
  id: string;
  timestamp: number;
  userId: string;
  sessionId: string;
  gameId: string;           // 'chess', 'shogi', 'go', etc.

  // Decision context
  position: string;         // Game-specific position encoding (FEN, etc.)
  availableActions: string[];
  chosenAction: string;

  // KROG classification
  rType: RType;
  tType: TType;
  modalOperator: ModalOperator;

  // Timing
  thinkingTimeMs: number;

  // Metadata
  metadata?: Record<string, unknown>;
}

export interface GameSessionEvent {
  id: string;
  userId: string;
  gameId: string;
  startTime: number;
  endTime?: number;

  // Session summary
  totalDecisions: number;
  rTypeDistribution: Record<RType, number>;
  tTypeDistribution: Record<TType, number>;

  // Outcome
  outcome?: 'win' | 'loss' | 'draw' | 'abandoned';

  // Performance metrics
  averageThinkingTime: number;
  decisionAccuracy?: number;  // If we have ground truth
}

// ============================================
// Neurosymbolic Analysis Types
// ============================================

export interface DecisionPattern {
  id: string;
  name: string;
  description: string;

  // Pattern signature
  rTypeSequence: RType[];
  tTypeContext: TType[];

  // Cross-game prevalence
  gamePrevalence: Record<string, number>;  // gameId -> frequency

  // Cognitive indicators
  averageThinkingTime: number;
  errorRate: number;
  transferPotential: number;  // How well this pattern transfers between games
}

export interface CognitiveProfile {
  userId: string;

  // R-type preferences (which rule types they handle well)
  rTypeStrengths: RType[];
  rTypeWeaknesses: RType[];

  // T-type tendencies (their default agent state)
  preferredTType: TType;
  tTypeFlexibility: number;  // 0-1, how well they adapt

  // Cross-game metrics
  gameProfiles: Record<string, GameProfile>;

  // Transfer learning indicators
  crossGameTransferScore: number;
  rTypeGeneralizationScore: number;
}

export interface GameProfile {
  gameId: string;
  totalGames: number;
  winRate: number;

  // KROG-based skill assessment
  rTypeMastery: Record<RType, MasteryLevel>;

  // Progression
  skillTrend: 'improving' | 'stable' | 'declining';
  lastUpdated: number;
}

export interface MasteryLevel {
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;        // 0-1
  sampleSize: number;
  lastAssessed: number;
}

// ============================================
// Research Data Types
// ============================================

export interface ResearchDataExport {
  exportId: string;
  exportedAt: number;

  // Filters applied
  filters: {
    dateRange?: { start: number; end: number };
    gameIds?: string[];
    userCohort?: string;
    rTypes?: RType[];
  };

  // Aggregated data (anonymized)
  aggregations: {
    totalDecisions: number;
    uniqueUsers: number;
    rTypeDistribution: Record<RType, number>;
    crossGamePatterns: DecisionPattern[];
  };

  // Raw events (if permitted)
  events?: DecisionEvent[];
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;

  // Experiment parameters
  controlGroup: string[];    // User IDs
  treatmentGroup: string[];

  // What we're measuring
  targetRTypes: RType[];
  targetGames: string[];

  // Hypothesis
  hypothesis: string;
  expectedEffect: string;

  // Status
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate?: number;
  endDate?: number;
}

// ============================================
// Analytics Query Types
// ============================================

export interface AnalyticsQuery {
  type: 'decisions' | 'sessions' | 'patterns' | 'profiles';

  // Filters
  filters: {
    userId?: string;
    gameId?: string;
    dateRange?: { start: number; end: number };
    rTypes?: RType[];
    tTypes?: TType[];
  };

  // Aggregation
  groupBy?: ('userId' | 'gameId' | 'rType' | 'tType' | 'day' | 'week')[];

  // Pagination
  limit?: number;
  offset?: number;
}

export interface AnalyticsResult<T> {
  data: T[];
  total: number;
  query: AnalyticsQuery;
  executedAt: number;
}
