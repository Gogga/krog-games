import type { RType } from '@krog/krog-framework';
import type {
  SkillModel,
  MasteryAssessment,
  RTypeMasteryDetail,
  MasteryTier,
  SkillGap,
  LearningPathItem,
} from './types';
import { SkillModelEngine } from './skill-model';

/**
 * KROG Mastery Assessor
 * Analyzes skill models to provide mastery assessments and learning recommendations
 */

export class MasteryAssessor {
  private skillEngine: SkillModelEngine;

  constructor() {
    this.skillEngine = new SkillModelEngine();
  }

  /**
   * Generate a comprehensive mastery assessment
   */
  assess(model: SkillModel): MasteryAssessment {
    const rTypeMastery = this.assessAllRTypes(model);
    const skillGaps = this.identifySkillGaps(model, rTypeMastery);
    const strengths = this.identifyStrengths(rTypeMastery);
    const suggestedPath = this.generateLearningPath(model, skillGaps);

    return {
      userId: model.userId,
      assessedAt: Date.now(),
      overallMastery: this.skillEngine.getMasteryTier(model.globalSkill),
      rTypeMastery,
      skillGaps,
      strengths,
      suggestedPath,
    };
  }

  /**
   * Get R-types that show positive transfer across games
   */
  getTransferableSkills(model: SkillModel): RType[] {
    const gameIds = Object.keys(model.gameSkills);
    if (gameIds.length < 2) return [];

    const transferable: RType[] = [];

    for (const rType of Object.keys(model.rTypeSkills) as RType[]) {
      // Check if this R-type is mastered in multiple games
      const gamesWithMastery = gameIds.filter(gameId => {
        const gameSkill = model.gameSkills[gameId];
        const rTypeSkill = gameSkill.rTypeSkills[rType];
        return this.skillEngine.getMasteryTier(rTypeSkill) !== 'novice' &&
               this.skillEngine.getMasteryTier(rTypeSkill) !== 'unassessed';
      });

      if (gamesWithMastery.length >= 2) {
        transferable.push(rType);
      }
    }

    return transferable;
  }

  /**
   * Recommend a game to play based on learning goals
   */
  recommendGame(
    model: SkillModel,
    availableGames: string[],
    targetRTypes: RType[]
  ): { gameId: string; reason: string } | null {
    let bestGame: string | null = null;
    let bestScore = -Infinity;
    let reason = '';

    for (const gameId of availableGames) {
      // Calculate how well this game teaches the target R-types
      let score = 0;

      for (const rType of targetRTypes) {
        const gameSkill = model.gameSkills[gameId]?.rTypeSkills[rType];
        const globalSkill = model.rTypeSkills[rType];

        if (!gameSkill || gameSkill.confidence < 0.3) {
          // New game for this R-type = good for learning
          score += 2;
        } else if (gameSkill.mu < globalSkill.mu) {
          // Room for improvement in this game
          score += 1;
        }
      }

      // Bonus for games not played recently
      const lastPlayed = model.gameSkills[gameId]?.lastPlayed ?? 0;
      const daysSince = (Date.now() - lastPlayed) / (1000 * 60 * 60 * 24);
      if (daysSince > 7) score += 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestGame = gameId;
        reason = this.generateGameReason(model, gameId, targetRTypes);
      }
    }

    return bestGame ? { gameId: bestGame, reason } : null;
  }

  // ============================================
  // Private Methods
  // ============================================

  private assessAllRTypes(model: SkillModel): Record<RType, RTypeMasteryDetail> {
    const result: Record<RType, RTypeMasteryDetail> = {} as Record<RType, RTypeMasteryDetail>;

    for (const rType of Object.keys(model.rTypeSkills) as RType[]) {
      result[rType] = this.assessRType(model, rType);
    }

    return result;
  }

  private assessRType(model: SkillModel, rType: RType): RTypeMasteryDetail {
    const skill = model.rTypeSkills[rType];
    const tier = this.skillEngine.getMasteryTier(skill);

    // Calculate trend from history
    const trend = this.calculateTrend(skill.history);

    // Find games where this R-type is mastered vs needs work
    const gameIds = Object.keys(model.gameSkills);
    const gamesWithMastery: string[] = [];
    const gamesNeedingWork: string[] = [];

    for (const gameId of gameIds) {
      const gameSkill = model.gameSkills[gameId].rTypeSkills[rType];
      const gameTier = this.skillEngine.getMasteryTier(gameSkill);

      if (gameTier === 'expert' || gameTier === 'master' || gameTier === 'grandmaster') {
        gamesWithMastery.push(gameId);
      } else if (gameTier !== 'unassessed' && gameSkill.confidence > 0.3) {
        gamesNeedingWork.push(gameId);
      }
    }

    // Calculate consistency (variance in performance)
    const consistencyScore = this.calculateConsistency(skill.history);

    // Percentile (placeholder - would need population data)
    const percentile = this.estimatePercentile(skill.mu);

    return {
      rType,
      tier,
      percentile,
      trend,
      sampleSize: skill.history.length,
      recentAccuracy: this.getRecentAccuracy(skill),
      consistencyScore,
      gamesWithMastery,
      gamesNeedingWork,
    };
  }

  private calculateTrend(
    history: Array<{ timestamp: number; mu: number }>
  ): 'improving' | 'stable' | 'declining' {
    if (history.length < 5) return 'stable';

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b.mu, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b.mu, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  private calculateConsistency(
    history: Array<{ timestamp: number; mu: number; sigma: number }>
  ): number {
    if (history.length < 3) return 0.5;

    const sigmas = history.map(h => h.sigma);
    const avgSigma = sigmas.reduce((a, b) => a + b, 0) / sigmas.length;

    // Lower sigma = more consistent
    return Math.max(0, 1 - avgSigma / 10);
  }

  private estimatePercentile(mu: number): number {
    // Rough estimate based on skill distribution
    // Assumes population follows normal distribution around mean of 25
    const populationMean = 25;
    const populationStd = 5;

    const z = (mu - populationMean) / populationStd;

    // CDF approximation
    const cdf = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    return Math.round(cdf * 100);
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private getRecentAccuracy(skill: { history: Array<{ mu: number }> }): number {
    if (skill.history.length < 5) return 0.5;

    const recent = skill.history.slice(-5);
    const avgMu = recent.reduce((a, b) => a + b.mu, 0) / recent.length;

    // Convert mu to accuracy estimate (25 = 50%, 35 = 80%, etc.)
    return Math.min(1, Math.max(0, (avgMu - 15) / 25));
  }

  private identifySkillGaps(
    model: SkillModel,
    rTypeMastery: Record<RType, RTypeMasteryDetail>
  ): SkillGap[] {
    const gaps: SkillGap[] = [];
    const globalTier = this.skillEngine.getMasteryTier(model.globalSkill);

    for (const [rType, detail] of Object.entries(rTypeMastery) as Array<[RType, RTypeMasteryDetail]>) {
      // Skip unassessed R-types
      if (detail.tier === 'unassessed') continue;

      // Calculate expected tier based on global skill
      const expectedTier = globalTier;

      // If significantly below expected, it's a gap
      if (this.tierToNumber(detail.tier) < this.tierToNumber(expectedTier) - 1) {
        const priority = this.calculateGapPriority(detail, model);

        gaps.push({
          rType,
          currentLevel: detail.tier,
          targetLevel: expectedTier,
          priority,
          reason: this.generateGapReason(rType, detail),
          recommendations: this.generateRecommendations(rType, detail),
          suggestedGames: detail.gamesNeedingWork,
        });
      }
    }

    // Sort by priority
    return gaps.sort((a, b) =>
      this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority)
    );
  }

  private tierToNumber(tier: MasteryTier): number {
    const mapping: Record<MasteryTier, number> = {
      unassessed: 0,
      novice: 1,
      apprentice: 2,
      journeyman: 3,
      expert: 4,
      master: 5,
      grandmaster: 6,
    };
    return mapping[tier];
  }

  private priorityToNumber(priority: SkillGap['priority']): number {
    const mapping = { low: 1, medium: 2, high: 3, critical: 4 };
    return mapping[priority];
  }

  private calculateGapPriority(
    detail: RTypeMasteryDetail,
    model: SkillModel
  ): SkillGap['priority'] {
    // More games needing work = higher priority
    const gameCount = detail.gamesNeedingWork.length;

    // Declining trend = higher priority
    const trendPenalty = detail.trend === 'declining' ? 1 : 0;

    // Calculate priority score
    const score = gameCount + trendPenalty + (detail.tier === 'novice' ? 1 : 0);

    if (score >= 4) return 'critical';
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  private generateGapReason(rType: RType, detail: RTypeMasteryDetail): string {
    const reasons: string[] = [];

    if (detail.trend === 'declining') {
      reasons.push('Recent performance has declined');
    }

    if (detail.gamesNeedingWork.length > 0) {
      reasons.push(`Needs improvement in ${detail.gamesNeedingWork.length} game(s)`);
    }

    if (detail.consistencyScore < 0.5) {
      reasons.push('Performance is inconsistent');
    }

    return reasons.length > 0
      ? reasons.join('. ')
      : `${rType} skills are below your overall level`;
  }

  private generateRecommendations(rType: RType, detail: RTypeMasteryDetail): string[] {
    const recommendations: string[] = [];

    // Generic recommendations based on R-type
    recommendations.push(`Practice ${rType} patterns in puzzle mode`);

    if (detail.gamesWithMastery.length > 0) {
      recommendations.push(
        `Apply techniques from ${detail.gamesWithMastery[0]} to other games`
      );
    }

    if (detail.consistencyScore < 0.5) {
      recommendations.push('Focus on consistency before advancing difficulty');
    }

    return recommendations;
  }

  private identifyStrengths(
    rTypeMastery: Record<RType, RTypeMasteryDetail>
  ): RType[] {
    return (Object.entries(rTypeMastery) as Array<[RType, RTypeMasteryDetail]>)
      .filter(([, detail]) =>
        detail.tier === 'expert' ||
        detail.tier === 'master' ||
        detail.tier === 'grandmaster'
      )
      .sort((a, b) => b[1].percentile - a[1].percentile)
      .slice(0, 5)
      .map(([rType]) => rType);
  }

  private generateLearningPath(
    model: SkillModel,
    gaps: SkillGap[]
  ): LearningPathItem[] {
    const path: LearningPathItem[] = [];

    // Address critical gaps first
    for (const gap of gaps.filter(g => g.priority === 'critical' || g.priority === 'high')) {
      // Add a lesson
      path.push({
        id: `lesson_${gap.rType}`,
        type: 'lesson',
        targetRTypes: [gap.rType],
        targetTTypes: [],
        difficulty: 0.3,
        estimatedDuration: 10,
        prerequisites: [],
        completionCriteria: { type: 'accuracy', threshold: 0.7 },
      });

      // Add practice puzzles
      path.push({
        id: `puzzle_${gap.rType}`,
        type: 'puzzle',
        targetRTypes: [gap.rType],
        targetTTypes: [],
        difficulty: 0.4,
        estimatedDuration: 15,
        prerequisites: [`lesson_${gap.rType}`],
        completionCriteria: { type: 'count', threshold: 5 },
      });

      // Add game practice
      if (gap.suggestedGames.length > 0) {
        path.push({
          id: `game_${gap.rType}`,
          type: 'game',
          targetRTypes: [gap.rType],
          targetTTypes: [],
          difficulty: 0.5,
          estimatedDuration: 20,
          gameId: gap.suggestedGames[0],
          prerequisites: [`puzzle_${gap.rType}`],
          completionCriteria: { type: 'count', threshold: 3 },
        });
      }
    }

    return path;
  }

  private generateGameReason(
    model: SkillModel,
    gameId: string,
    targetRTypes: RType[]
  ): string {
    const gameSkill = model.gameSkills[gameId];

    if (!gameSkill) {
      return `${gameId} is a new game that will help practice ${targetRTypes.join(', ')}`;
    }

    const weakRTypes = targetRTypes.filter(rType => {
      const skill = gameSkill.rTypeSkills[rType];
      return !skill || skill.confidence < 0.5;
    });

    if (weakRTypes.length > 0) {
      return `${gameId} offers good practice for ${weakRTypes.join(', ')}`;
    }

    return `${gameId} will reinforce your ${targetRTypes.join(', ')} skills`;
  }
}
