import type { RType } from '@krog/krog-framework';
import type {
  SkillModel,
  SkillEstimate,
  GameSkillModel,
  SkillUpdateEvent,
  MasteryTier,
} from './types';

/**
 * KROG Skill Model
 * Bayesian skill tracking with uncertainty quantification
 */

// Initial skill parameters (similar to TrueSkill)
const INITIAL_MU = 25;
const INITIAL_SIGMA = 8.333;
const BETA = 4.167;  // Performance variance
const TAU = 0.0833;  // Dynamic factor (skill drift)

export class SkillModelEngine {
  /**
   * Create a new skill model for a user
   */
  createSkillModel(userId: string): SkillModel {
    const initialEstimate = this.createInitialEstimate();

    const rTypeSkills: Record<RType, SkillEstimate> = {} as Record<RType, SkillEstimate>;
    for (let i = 1; i <= 35; i++) {
      rTypeSkills[`R${i}` as RType] = this.createInitialEstimate();
    }

    return {
      userId,
      lastUpdated: Date.now(),
      globalSkill: initialEstimate,
      rTypeSkills,
      gameSkills: {},
      learningRate: 1.0,
      adaptability: 0.5,
    };
  }

  /**
   * Update skill model based on an event
   */
  updateSkill(model: SkillModel, event: SkillUpdateEvent): SkillModel {
    const updated = { ...model };
    updated.lastUpdated = Date.now();

    // Apply time decay to uncertainty
    this.applyTimeDynamics(updated);

    // Update for each R-type involved
    for (const rType of event.rTypesInvolved) {
      const performance = this.calculatePerformance(event);
      updated.rTypeSkills[rType] = this.updateEstimate(
        updated.rTypeSkills[rType],
        performance
      );
    }

    // Update game-specific skills
    if (event.gameId) {
      if (!updated.gameSkills[event.gameId]) {
        updated.gameSkills[event.gameId] = this.createGameSkillModel(event.gameId);
      }
      updated.gameSkills[event.gameId] = this.updateGameSkill(
        updated.gameSkills[event.gameId],
        event
      );
    }

    // Update global skill (weighted average of R-type skills)
    updated.globalSkill = this.calculateGlobalSkill(updated);

    // Update learning rate based on improvement velocity
    updated.learningRate = this.calculateLearningRate(updated);

    return updated;
  }

  /**
   * Get mastery tier for a skill estimate
   */
  getMasteryTier(estimate: SkillEstimate): MasteryTier {
    // Use conservative estimate (mu - 2*sigma) for tier placement
    const conservativeSkill = estimate.mu - 2 * estimate.sigma;

    if (estimate.confidence < 0.3) return 'unassessed';
    if (conservativeSkill < 15) return 'novice';
    if (conservativeSkill < 20) return 'apprentice';
    if (conservativeSkill < 25) return 'journeyman';
    if (conservativeSkill < 30) return 'expert';
    if (conservativeSkill < 35) return 'master';
    return 'grandmaster';
  }

  /**
   * Calculate win probability between two skill estimates
   */
  calculateWinProbability(player: SkillEstimate, opponent: SkillEstimate): number {
    const delta = player.mu - opponent.mu;
    const denom = Math.sqrt(
      2 * BETA * BETA + player.sigma * player.sigma + opponent.sigma * opponent.sigma
    );
    // Cumulative normal distribution approximation
    return this.normalCDF(delta / denom);
  }

  /**
   * Predict expected performance on an R-type
   */
  predictPerformance(model: SkillModel, rType: RType, difficulty: number): number {
    const skill = model.rTypeSkills[rType];
    // Scale difficulty to expected opponent skill
    const expectedOpponent = 15 + difficulty * 25;  // difficulty 0-1 maps to skill 15-40

    return this.calculateWinProbability(skill, {
      mu: expectedOpponent,
      sigma: 3,  // Assume we know the difficulty well
      confidence: 1,
      history: [],
    });
  }

  // ============================================
  // Private Methods
  // ============================================

  private createInitialEstimate(): SkillEstimate {
    return {
      mu: INITIAL_MU,
      sigma: INITIAL_SIGMA,
      confidence: 0,
      history: [],
    };
  }

  private createGameSkillModel(gameId: string): GameSkillModel {
    const rTypeSkills: Record<RType, SkillEstimate> = {} as Record<RType, SkillEstimate>;
    for (let i = 1; i <= 35; i++) {
      rTypeSkills[`R${i}` as RType] = this.createInitialEstimate();
    }

    return {
      gameId,
      totalDecisions: 0,
      lastPlayed: Date.now(),
      skill: this.createInitialEstimate(),
      rTypeSkills,
      winRate: 0.5,
      averageAccuracy: 0.5,
      improvementRate: 0,
    };
  }

  private applyTimeDynamics(model: SkillModel): void {
    // Increase uncertainty over time (skill drift)
    const daysSinceUpdate = (Date.now() - model.lastUpdated) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.sqrt(1 + TAU * TAU * daysSinceUpdate);

    model.globalSkill.sigma *= decayFactor;

    for (const rType of Object.keys(model.rTypeSkills) as RType[]) {
      model.rTypeSkills[rType].sigma *= decayFactor;
    }
  }

  private calculatePerformance(event: SkillUpdateEvent): number {
    // Convert outcome to performance score
    let basePerformance: number;
    switch (event.outcome) {
      case 'correct':
        basePerformance = 1;
        break;
      case 'partial':
        basePerformance = 0.5;
        break;
      case 'incorrect':
        basePerformance = 0;
        break;
    }

    // Adjust for time (faster = better)
    const timeRatio = event.expectedTimeMs / Math.max(1000, event.thinkingTimeMs);
    const timeBonus = Math.min(0.2, Math.max(-0.2, (timeRatio - 1) * 0.1));

    return Math.min(1, Math.max(0, basePerformance + timeBonus));
  }

  private updateEstimate(estimate: SkillEstimate, performance: number): SkillEstimate {
    // Bayesian update
    const c = Math.sqrt(2 * BETA * BETA + estimate.sigma * estimate.sigma);

    // Expected score
    const expectedScore = this.normalCDF(estimate.mu / c);

    // Actual vs expected
    const surprise = performance - expectedScore;

    // Update factors
    const vFactor = this.normalPDF(estimate.mu / c) / expectedScore;
    const wFactor = vFactor * (vFactor + estimate.mu / c);

    // New estimates
    const newMu = estimate.mu + (estimate.sigma * estimate.sigma / c) * surprise * vFactor;
    const newSigma = estimate.sigma * Math.sqrt(
      1 - (estimate.sigma * estimate.sigma / (c * c)) * wFactor
    );

    // Calculate confidence (based on sigma and sample size)
    const sampleSize = estimate.history.length + 1;
    const confidence = Math.min(1, sampleSize / 20) * (1 - newSigma / INITIAL_SIGMA);

    const newHistory = [
      ...estimate.history.slice(-99),  // Keep last 100
      { timestamp: Date.now(), mu: newMu, sigma: newSigma },
    ];

    return {
      mu: newMu,
      sigma: Math.max(1, newSigma),  // Floor on sigma
      confidence: Math.max(0, confidence),
      history: newHistory,
    };
  }

  private updateGameSkill(
    gameModel: GameSkillModel,
    event: SkillUpdateEvent
  ): GameSkillModel {
    const updated = { ...gameModel };
    updated.totalDecisions++;
    updated.lastPlayed = Date.now();

    const performance = this.calculatePerformance(event);
    updated.skill = this.updateEstimate(updated.skill, performance);

    for (const rType of event.rTypesInvolved) {
      updated.rTypeSkills[rType] = this.updateEstimate(
        updated.rTypeSkills[rType],
        performance
      );
    }

    // Update rolling average accuracy
    const alpha = 0.1;  // Smoothing factor
    updated.averageAccuracy = alpha * performance + (1 - alpha) * updated.averageAccuracy;

    // Calculate improvement rate from history
    if (updated.skill.history.length >= 10) {
      const recent = updated.skill.history.slice(-10);
      const older = updated.skill.history.slice(-20, -10);
      if (older.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b.mu, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b.mu, 0) / older.length;
        updated.improvementRate = (recentAvg - olderAvg) / olderAvg;
      }
    }

    return updated;
  }

  private calculateGlobalSkill(model: SkillModel): SkillEstimate {
    // Weight R-types by confidence
    const rTypes = Object.keys(model.rTypeSkills) as RType[];
    let totalWeight = 0;
    let weightedMu = 0;
    let weightedSigmaSq = 0;

    for (const rType of rTypes) {
      const skill = model.rTypeSkills[rType];
      const weight = skill.confidence;
      totalWeight += weight;
      weightedMu += skill.mu * weight;
      weightedSigmaSq += skill.sigma * skill.sigma * weight;
    }

    if (totalWeight === 0) {
      return this.createInitialEstimate();
    }

    const mu = weightedMu / totalWeight;
    const sigma = Math.sqrt(weightedSigmaSq / totalWeight);

    // Global confidence is average of R-type confidences
    const confidence = totalWeight / rTypes.length;

    return {
      mu,
      sigma,
      confidence,
      history: [
        ...model.globalSkill.history.slice(-99),
        { timestamp: Date.now(), mu, sigma },
      ],
    };
  }

  private calculateLearningRate(model: SkillModel): number {
    // Based on recent improvement velocity
    if (model.globalSkill.history.length < 10) {
      return 1.0;  // Default for new users
    }

    const recent = model.globalSkill.history.slice(-10);
    const slope = this.linearRegression(
      recent.map((_, i) => i),
      recent.map(h => h.mu)
    );

    // Normalize slope to learning rate (0.5 - 2.0)
    return Math.min(2.0, Math.max(0.5, 1.0 + slope * 10));
  }

  private linearRegression(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private normalCDF(x: number): number {
    // Approximation of cumulative normal distribution
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private normalPDF(x: number): number {
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  }
}
