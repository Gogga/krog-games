import type { RType } from '@krog/krog-framework';
import type { SkillModel, MasteryAssessment } from '@krog/learning-engine';
import type { DecisionEvent, CognitiveProfile } from '@krog/analytics';
import type {
  Recommendation,
  RecommendationType,
  RecommendationContext,
  RecommendationFeed,
  RecommendationFilter,
  GameProfile,
  GameSimilarity,
  RecommendationConfig,
} from './types';

/**
 * KROG Recommendation Engine
 * Generates cross-game recommendations based on R-type patterns
 */

const DEFAULT_CONFIG: RecommendationConfig = {
  skillGapWeight: 0.3,
  transferWeight: 0.25,
  engagementWeight: 0.25,
  explorationWeight: 0.2,
  fatigueThreshold: 0.7,
  minimumConfidence: 0.5,
  maxSameType: 3,
  gameRotationDays: 3,
};

export class RecommendationEngine {
  private config: RecommendationConfig;
  private gameProfiles: Map<string, GameProfile> = new Map();

  constructor(config: Partial<RecommendationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a game profile
   */
  registerGame(profile: GameProfile): void {
    this.gameProfiles.set(profile.gameId, profile);
  }

  /**
   * Generate recommendations for a user
   */
  generateRecommendations(
    skillModel: SkillModel,
    assessment: MasteryAssessment,
    context: RecommendationContext,
    cognitiveProfile?: CognitiveProfile
  ): RecommendationFeed {
    const recommendations: Recommendation[] = [];

    // Check for fatigue first
    if (context.currentFatigue > this.config.fatigueThreshold) {
      recommendations.push(this.createBreakRecommendation(context));
    }

    // Generate skill gap recommendations
    const gapRecs = this.generateSkillGapRecommendations(
      skillModel,
      assessment,
      context
    );
    recommendations.push(...gapRecs);

    // Generate transfer learning recommendations
    const transferRecs = this.generateTransferRecommendations(
      skillModel,
      cognitiveProfile,
      context
    );
    recommendations.push(...transferRecs);

    // Generate exploration recommendations
    const exploreRecs = this.generateExplorationRecommendations(
      skillModel,
      context
    );
    recommendations.push(...exploreRecs);

    // Generate engagement recommendations
    const engageRecs = this.generateEngagementRecommendations(
      skillModel,
      context
    );
    recommendations.push(...engageRecs);

    // Score and rank recommendations
    const scored = this.scoreRecommendations(recommendations, context);
    const filtered = this.filterRecommendations(scored);
    const diverse = this.ensureDiversity(filtered);

    return {
      userId: context.userId,
      generatedAt: Date.now(),
      recommendations: diverse.slice(0, 10),
      totalGenerated: recommendations.length,
      filteredCount: recommendations.length - diverse.length,
      refreshIn: 300,  // 5 minutes
    };
  }

  /**
   * Get recommendations with filters
   */
  getFilteredRecommendations(
    feed: RecommendationFeed,
    filter: RecommendationFilter
  ): Recommendation[] {
    let results = [...feed.recommendations];

    if (filter.types) {
      results = results.filter(r => filter.types!.includes(r.type));
    }

    if (filter.games) {
      results = results.filter(r =>
        !r.targetGameId || filter.games!.includes(r.targetGameId)
      );
    }

    if (filter.rTypes) {
      results = results.filter(r =>
        r.targetRTypes.some(rt => filter.rTypes!.includes(rt))
      );
    }

    if (filter.minPriority !== undefined) {
      results = results.filter(r => r.priority >= filter.minPriority!);
    }

    if (filter.minConfidence !== undefined) {
      results = results.filter(r => r.confidence >= filter.minConfidence!);
    }

    if (filter.excludeDismissed) {
      results = results.filter(r => !r.dismissed);
    }

    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  /**
   * Calculate similarity between two games
   */
  calculateGameSimilarity(gameA: string, gameB: string): GameSimilarity | null {
    const profileA = this.gameProfiles.get(gameA);
    const profileB = this.gameProfiles.get(gameB);

    if (!profileA || !profileB) return null;

    // R-type overlap
    const sharedRTypes = profileA.primaryRTypes.filter(rt =>
      profileB.primaryRTypes.includes(rt) || profileB.secondaryRTypes.includes(rt)
    );

    const allRTypesA = new Set([...profileA.primaryRTypes, ...profileA.secondaryRTypes]);
    const allRTypesB = new Set([...profileB.primaryRTypes, ...profileB.secondaryRTypes]);
    const union = new Set([...allRTypesA, ...allRTypesB]);

    const rTypeSimilarity = sharedRTypes.length / union.size;

    // Complexity similarity
    const complexitySimilarity = 1 - Math.abs(profileA.complexity - profileB.complexity);

    // Mechanics similarity (based on T-type distribution)
    const mechanicsSimilarity = this.calculateTTypeDistributionSimilarity(
      profileA.tTypeDistribution,
      profileB.tTypeDistribution
    );

    // Overall similarity
    const overallSimilarity =
      rTypeSimilarity * 0.5 +
      mechanicsSimilarity * 0.3 +
      complexitySimilarity * 0.2;

    // Transfer direction
    let transferDirection: GameSimilarity['transferDirection'] = 'bidirectional';
    if (profileA.complexity > profileB.complexity + 0.2) {
      transferDirection = 'a_to_b';
    } else if (profileB.complexity > profileA.complexity + 0.2) {
      transferDirection = 'b_to_a';
    }

    return {
      gameA,
      gameB,
      overallSimilarity,
      sharedRTypes: sharedRTypes as RType[],
      rTypeSimilarity,
      mechanicsSimilarity,
      complexitySimilarity,
      transferPotential: rTypeSimilarity * 0.7 + mechanicsSimilarity * 0.3,
      transferDirection,
    };
  }

  /**
   * Find best game for practicing a specific R-type
   */
  findBestGameForRType(
    rType: RType,
    skillModel: SkillModel,
    excludeGames: string[] = []
  ): { gameId: string; reason: string } | null {
    const candidates: Array<{ gameId: string; score: number; reason: string }> = [];

    for (const [gameId, profile] of this.gameProfiles) {
      if (excludeGames.includes(gameId)) continue;

      // Check if this game features the R-type
      const isPrimary = profile.primaryRTypes.includes(rType);
      const isSecondary = profile.secondaryRTypes.includes(rType);

      if (!isPrimary && !isSecondary) continue;

      // Calculate suitability score
      let score = isPrimary ? 1.0 : 0.6;

      // Prefer games with gentler learning curves for weak R-types
      const skillEstimate = skillModel.rTypeSkills[rType];
      if (skillEstimate.mu < 20) {
        score += profile.learningCurve * 0.3;
      }

      // Prefer games the user hasn't mastered yet
      const gameSkill = skillModel.gameSkills[gameId];
      if (!gameSkill || gameSkill.skill.confidence < 0.5) {
        score += 0.2;
      }

      const reason = isPrimary
        ? `${profile.name} is ideal for ${rType} practice`
        : `${profile.name} includes ${rType} scenarios`;

      candidates.push({ gameId, score, reason });
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);
    return { gameId: candidates[0].gameId, reason: candidates[0].reason };
  }

  // ============================================
  // Private Methods
  // ============================================

  private generateSkillGapRecommendations(
    skillModel: SkillModel,
    assessment: MasteryAssessment,
    context: RecommendationContext
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const gap of assessment.skillGaps.slice(0, 3)) {
      // Recommend lessons for skill gaps
      recommendations.push({
        id: `gap_lesson_${gap.rType}`,
        type: 'lesson',
        priority: gap.priority === 'critical' ? 0.9 : gap.priority === 'high' ? 0.7 : 0.5,
        confidence: 0.8,
        title: `Master ${gap.rType}`,
        description: `Focused lesson on ${gap.rType} to close your skill gap`,
        targetRTypes: [gap.rType],
        reasoning: {
          type: 'skill_gap',
          primaryRType: gap.rType,
          skillGap: `${gap.currentLevel} → ${gap.targetLevel}`,
          explanation: gap.reason,
        },
        actionLabel: 'Start Lesson',
      });

      // Recommend game practice for this R-type
      const bestGame = this.findBestGameForRType(
        gap.rType,
        skillModel,
        context.recentGames
      );

      if (bestGame) {
        recommendations.push({
          id: `gap_game_${gap.rType}_${bestGame.gameId}`,
          type: 'game',
          priority: gap.priority === 'critical' ? 0.85 : 0.6,
          confidence: 0.75,
          title: `Practice ${gap.rType} in ${bestGame.gameId}`,
          description: bestGame.reason,
          targetGameId: bestGame.gameId,
          targetRTypes: [gap.rType],
          reasoning: {
            type: 'skill_gap',
            primaryRType: gap.rType,
            sourceGames: [bestGame.gameId],
            explanation: `Game-based practice for ${gap.rType}`,
          },
          actionLabel: 'Play Now',
        });
      }
    }

    return recommendations;
  }

  private generateTransferRecommendations(
    skillModel: SkillModel,
    cognitiveProfile: CognitiveProfile | undefined,
    context: RecommendationContext
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (!cognitiveProfile) return recommendations;

    // Find R-types where user is strong
    const strengths = cognitiveProfile.rTypeStrengths;

    for (const rType of strengths.slice(0, 2)) {
      // Find games where this R-type could transfer
      for (const [gameId, profile] of this.gameProfiles) {
        // Skip games user already plays well
        const gameSkill = skillModel.gameSkills[gameId];
        if (gameSkill && gameSkill.skill.confidence > 0.7) continue;

        // Check if this game features the R-type
        if (profile.primaryRTypes.includes(rType) || profile.secondaryRTypes.includes(rType)) {
          recommendations.push({
            id: `transfer_${rType}_${gameId}`,
            type: 'game',
            priority: 0.7,
            confidence: cognitiveProfile.crossGameTransferScore,
            title: `Apply your ${rType} skills to ${profile.name}`,
            description: `Your ${rType} mastery could give you an advantage in ${profile.name}`,
            targetGameId: gameId,
            targetRTypes: [rType],
            reasoning: {
              type: 'skill_transfer',
              primaryRType: rType,
              sourceGames: Object.keys(skillModel.gameSkills).filter(g =>
                skillModel.gameSkills[g].rTypeSkills[rType]?.confidence > 0.7
              ),
              explanation: 'Transfer your existing skills to a new game',
            },
            actionLabel: 'Try Game',
          });
        }
      }
    }

    return recommendations;
  }

  private generateExplorationRecommendations(
    skillModel: SkillModel,
    context: RecommendationContext
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const playedGames = new Set(Object.keys(skillModel.gameSkills));

    // Recommend unexplored games
    for (const [gameId, profile] of this.gameProfiles) {
      if (playedGames.has(gameId)) continue;

      recommendations.push({
        id: `explore_${gameId}`,
        type: 'game',
        priority: 0.5,
        confidence: 0.6,
        title: `Discover ${profile.name}`,
        description: profile.description,
        targetGameId: gameId,
        targetRTypes: profile.primaryRTypes,
        reasoning: {
          type: 'exploration',
          explanation: `Expand your horizons with a new game`,
        },
        actionLabel: 'Learn More',
      });
    }

    return recommendations;
  }

  private generateEngagementRecommendations(
    skillModel: SkillModel,
    context: RecommendationContext
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recommend tournaments for experienced players
    const totalGames = Object.values(skillModel.gameSkills)
      .reduce((sum, gs) => sum + gs.totalDecisions, 0);

    if (totalGames > 100) {
      recommendations.push({
        id: 'tournament',
        type: 'tournament',
        priority: 0.6,
        confidence: 0.7,
        title: 'Join a Tournament',
        description: 'Test your skills against other players',
        targetRTypes: [],
        reasoning: {
          type: 'engagement',
          explanation: 'Competitive play can accelerate improvement',
        },
        actionLabel: 'Browse Tournaments',
      });
    }

    // Recommend challenges based on friends
    recommendations.push({
      id: 'challenge',
      type: 'challenge',
      priority: 0.55,
      confidence: 0.65,
      title: 'Challenge a Friend',
      description: 'Friendly competition keeps skills sharp',
      targetRTypes: [],
      reasoning: {
        type: 'social',
        explanation: 'Social play increases engagement and learning',
      },
      actionLabel: 'Find Opponent',
    });

    return recommendations;
  }

  private createBreakRecommendation(context: RecommendationContext): Recommendation {
    return {
      id: 'break',
      type: 'break',
      priority: 1.0,
      confidence: 0.9,
      title: 'Time for a Break',
      description: `You've been playing for ${Math.round(context.sessionDuration)} minutes. A short break can improve focus.`,
      targetRTypes: [],
      reasoning: {
        type: 'fatigue',
        explanation: 'Rest periods improve learning retention and decision quality',
      },
      actionLabel: 'Take 5 Minutes',
      expiresAt: Date.now() + 30 * 60 * 1000,  // Expires in 30 min
    };
  }

  private scoreRecommendations(
    recommendations: Recommendation[],
    context: RecommendationContext
  ): Recommendation[] {
    return recommendations.map(rec => {
      let score = rec.priority * rec.confidence;

      // Apply weights based on reasoning type
      switch (rec.reasoning.type) {
        case 'skill_gap':
          score *= 1 + this.config.skillGapWeight;
          break;
        case 'skill_transfer':
          score *= 1 + this.config.transferWeight;
          break;
        case 'exploration':
          score *= 1 + this.config.explorationWeight;
          break;
        case 'engagement':
        case 'social':
          score *= 1 + this.config.engagementWeight;
          break;
      }

      // Penalize recently recommended games
      if (rec.targetGameId && context.recentGames.includes(rec.targetGameId)) {
        score *= 0.5;
      }

      return { ...rec, priority: Math.min(1, score) };
    });
  }

  private filterRecommendations(recommendations: Recommendation[]): Recommendation[] {
    return recommendations.filter(rec =>
      rec.confidence >= this.config.minimumConfidence
    );
  }

  private ensureDiversity(recommendations: Recommendation[]): Recommendation[] {
    const result: Recommendation[] = [];
    const typeCounts: Record<RecommendationType, number> = {
      game: 0, lesson: 0, puzzle: 0, practice: 0,
      review: 0, challenge: 0, tournament: 0, break: 0,
    };

    // Sort by priority
    const sorted = [...recommendations].sort((a, b) => b.priority - a.priority);

    for (const rec of sorted) {
      if (typeCounts[rec.type] < this.config.maxSameType) {
        result.push(rec);
        typeCounts[rec.type]++;
      }
    }

    return result;
  }

  private calculateTTypeDistributionSimilarity(
    distA: Record<string, number>,
    distB: Record<string, number>
  ): number {
    const allKeys = new Set([...Object.keys(distA), ...Object.keys(distB)]);
    let similarity = 0;

    for (const key of allKeys) {
      const a = distA[key] || 0;
      const b = distB[key] || 0;
      similarity += Math.min(a, b);
    }

    return similarity;
  }
}
