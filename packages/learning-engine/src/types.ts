import type { RType, TType } from '@krog/krog-framework';

/**
 * KROG Learning Engine Types
 * Player skill tracking and R-type mastery analysis
 */

// ============================================
// Skill Model Types
// ============================================

export interface SkillModel {
  userId: string;
  lastUpdated: number;

  // Global skill estimate
  globalSkill: SkillEstimate;

  // Per-R-type skill estimates
  rTypeSkills: Record<RType, SkillEstimate>;

  // Per-game skill estimates
  gameSkills: Record<string, GameSkillModel>;

  // Learning velocity
  learningRate: number;
  adaptability: number;
}

export interface SkillEstimate {
  mu: number;        // Mean skill estimate
  sigma: number;     // Uncertainty (standard deviation)
  confidence: number; // 0-1, derived from sigma and sample size

  // History for trend analysis
  history: Array<{
    timestamp: number;
    mu: number;
    sigma: number;
  }>;
}

export interface GameSkillModel {
  gameId: string;
  totalDecisions: number;
  lastPlayed: number;

  // Overall game skill
  skill: SkillEstimate;

  // R-type breakdown for this game
  rTypeSkills: Record<RType, SkillEstimate>;

  // Performance metrics
  winRate: number;
  averageAccuracy: number;
  improvementRate: number;
}

// ============================================
// Mastery Assessment Types
// ============================================

export interface MasteryAssessment {
  userId: string;
  assessedAt: number;

  // Overall mastery level
  overallMastery: MasteryTier;

  // Per-R-type mastery
  rTypeMastery: Record<RType, RTypeMasteryDetail>;

  // Skill gaps and recommendations
  skillGaps: SkillGap[];
  strengths: RType[];

  // Learning path
  suggestedPath: LearningPathItem[];
}

export interface RTypeMasteryDetail {
  rType: RType;
  tier: MasteryTier;
  percentile: number;      // 0-100, compared to population
  trend: 'improving' | 'stable' | 'declining';

  // Evidence
  sampleSize: number;
  recentAccuracy: number;
  consistencyScore: number;

  // Cross-game analysis
  gamesWithMastery: string[];      // Games where this R-type is mastered
  gamesNeedingWork: string[];      // Games where improvement needed
}

export type MasteryTier =
  | 'unassessed'
  | 'novice'
  | 'apprentice'
  | 'journeyman'
  | 'expert'
  | 'master'
  | 'grandmaster';

export interface SkillGap {
  rType: RType;
  currentLevel: MasteryTier;
  targetLevel: MasteryTier;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Why this gap matters
  reason: string;

  // How to address it
  recommendations: string[];
  suggestedGames: string[];
}

// ============================================
// Learning Path Types
// ============================================

export interface LearningPathItem {
  id: string;
  type: 'lesson' | 'puzzle' | 'practice' | 'game';

  // What this item teaches
  targetRTypes: RType[];
  targetTTypes: TType[];

  // Difficulty
  difficulty: number;  // 0-1
  estimatedDuration: number;  // minutes

  // Content reference
  gameId?: string;
  contentId?: string;  // Lesson/puzzle ID

  // Prerequisites
  prerequisites: string[];  // Other LearningPathItem IDs

  // Completion criteria
  completionCriteria: {
    type: 'accuracy' | 'time' | 'count';
    threshold: number;
  };
}

export interface LearningPath {
  userId: string;
  createdAt: number;
  goal: string;

  items: LearningPathItem[];

  // Progress tracking
  completedItems: string[];
  currentItem?: string;

  // Estimated completion
  estimatedTotalDuration: number;
  actualTimeSpent: number;
}

// ============================================
// Spaced Repetition Types
// ============================================

export interface SpacedRepetitionItem {
  id: string;
  rType: RType;
  gameId: string;

  // Content
  contentType: 'concept' | 'pattern' | 'tactic';
  contentId: string;

  // SM-2 algorithm parameters
  easeFactor: number;      // 1.3 - 2.5
  interval: number;        // days
  repetitions: number;
  nextReview: number;      // timestamp

  // Performance history
  reviews: Array<{
    timestamp: number;
    quality: 0 | 1 | 2 | 3 | 4 | 5;  // SM-2 quality rating
  }>;
}

export interface SpacedRepetitionQueue {
  userId: string;
  items: SpacedRepetitionItem[];

  // Items due for review
  dueItems: string[];  // Item IDs

  // Statistics
  totalItems: number;
  itemsReviewedToday: number;
  averageRetention: number;
}

// ============================================
// Progress Tracking Types
// ============================================

export interface ProgressSnapshot {
  userId: string;
  timestamp: number;

  // Skill deltas
  skillChanges: Array<{
    rType: RType;
    previousMu: number;
    newMu: number;
    delta: number;
  }>;

  // Activities
  gamesPlayed: number;
  decisionsAnalyzed: number;
  lessonsCompleted: number;
  puzzlesSolved: number;

  // Achievements
  newAchievements: string[];
  milestonesReached: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;

  // Unlock criteria
  criteria: {
    type: 'rtype_mastery' | 'games_played' | 'streak' | 'transfer' | 'custom';
    rType?: RType;
    gameId?: string;
    threshold: number;
  };

  // Rarity
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// ============================================
// Update Event Types
// ============================================

export interface SkillUpdateEvent {
  userId: string;
  timestamp: number;

  // What triggered the update
  trigger: 'game_completed' | 'lesson_completed' | 'puzzle_solved' | 'manual';

  // Context
  gameId?: string;
  contentId?: string;

  // Result
  outcome: 'correct' | 'incorrect' | 'partial';
  rTypesInvolved: RType[];

  // Timing
  thinkingTimeMs: number;
  expectedTimeMs: number;  // Based on difficulty
}
