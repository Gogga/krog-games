import type { RType, TType } from '@krog/krog-framework';
import type {
  DecisionEvent,
  DecisionPattern,
  CognitiveProfile,
  MasteryLevel
} from './types';

/**
 * KROG Decision Analyzer
 * Neurosymbolic analysis of decision patterns
 */

export class DecisionAnalyzer {
  /**
   * Identify recurring decision patterns from events
   */
  identifyPatterns(events: DecisionEvent[]): DecisionPattern[] {
    const patterns: Map<string, DecisionPattern> = new Map();

    // Group events by R-type sequences (sliding window of 3)
    for (let i = 0; i < events.length - 2; i++) {
      const sequence: RType[] = [
        events[i].rType,
        events[i + 1].rType,
        events[i + 2].rType,
      ];

      const patternKey = sequence.join('-');

      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, {
          id: `pat_${patternKey}`,
          name: this.generatePatternName(sequence),
          description: this.describePattern(sequence),
          rTypeSequence: sequence,
          tTypeContext: [events[i].tType, events[i + 1].tType, events[i + 2].tType],
          gamePrevalence: {},
          averageThinkingTime: 0,
          errorRate: 0,
          transferPotential: 0,
        });
      }

      const pattern = patterns.get(patternKey)!;

      // Update game prevalence
      const gameId = events[i].gameId;
      pattern.gamePrevalence[gameId] = (pattern.gamePrevalence[gameId] || 0) + 1;

      // Update thinking time (running average)
      const avgTime = (events[i].thinkingTimeMs + events[i + 1].thinkingTimeMs + events[i + 2].thinkingTimeMs) / 3;
      const count = Object.values(pattern.gamePrevalence).reduce((a, b) => a + b, 0);
      pattern.averageThinkingTime = (pattern.averageThinkingTime * (count - 1) + avgTime) / count;
    }

    // Calculate transfer potential for each pattern
    for (const pattern of patterns.values()) {
      pattern.transferPotential = this.calculateTransferPotential(pattern);
    }

    return Array.from(patterns.values())
      .sort((a, b) => {
        const aTotal = Object.values(a.gamePrevalence).reduce((x, y) => x + y, 0);
        const bTotal = Object.values(b.gamePrevalence).reduce((x, y) => x + y, 0);
        return bTotal - aTotal;
      });
  }

  /**
   * Build cognitive profile from user's decision history
   */
  buildCognitiveProfile(userId: string, events: DecisionEvent[]): CognitiveProfile {
    const userEvents = events.filter(e => e.userId === userId);

    // Analyze R-type performance
    const rTypePerformance = this.analyzeRTypePerformance(userEvents);
    const rTypeStrengths = rTypePerformance
      .filter(p => p.score > 0.7)
      .map(p => p.rType);
    const rTypeWeaknesses = rTypePerformance
      .filter(p => p.score < 0.3)
      .map(p => p.rType);

    // Analyze T-type tendencies
    const tTypeCounts = this.countTTypes(userEvents);
    const preferredTType = this.getMostCommon(tTypeCounts);
    const tTypeFlexibility = this.calculateTTypeFlexibility(tTypeCounts);

    // Build per-game profiles
    const gameProfiles = this.buildGameProfiles(userEvents);

    // Calculate cross-game metrics
    const crossGameTransferScore = this.calculateCrossGameTransfer(gameProfiles);
    const rTypeGeneralizationScore = this.calculateRTypeGeneralization(userEvents);

    return {
      userId,
      rTypeStrengths,
      rTypeWeaknesses,
      preferredTType,
      tTypeFlexibility,
      gameProfiles,
      crossGameTransferScore,
      rTypeGeneralizationScore,
    };
  }

  /**
   * Measure transfer learning between games
   */
  measureTransferLearning(
    events: DecisionEvent[],
    sourceGame: string,
    targetGame: string
  ): TransferLearningResult {
    // Get users who played both games
    const sourceUsers = new Set(events.filter(e => e.gameId === sourceGame).map(e => e.userId));
    const targetUsers = new Set(events.filter(e => e.gameId === targetGame).map(e => e.userId));
    const commonUsers = [...sourceUsers].filter(u => targetUsers.has(u));

    // Find R-types common to both games
    const sourceRTypes = new Set(events.filter(e => e.gameId === sourceGame).map(e => e.rType));
    const targetRTypes = new Set(events.filter(e => e.gameId === targetGame).map(e => e.rType));
    const commonRTypes = [...sourceRTypes].filter(r => targetRTypes.has(r));

    // Calculate transfer scores for each common R-type
    const rTypeTransferScores: Record<RType, number> = {} as Record<RType, number>;

    for (const rType of commonRTypes) {
      const sourcePerformance = this.calculateRTypePerformance(
        events.filter(e => e.gameId === sourceGame && e.rType === rType)
      );
      const targetPerformance = this.calculateRTypePerformance(
        events.filter(e => e.gameId === targetGame && e.rType === rType)
      );

      // Positive transfer: good performance in target correlates with source
      rTypeTransferScores[rType as RType] = Math.min(1, targetPerformance / Math.max(0.1, sourcePerformance));
    }

    const overallTransferScore = Object.values(rTypeTransferScores).length > 0
      ? Object.values(rTypeTransferScores).reduce((a, b) => a + b, 0) / Object.values(rTypeTransferScores).length
      : 0;

    return {
      sourceGame,
      targetGame,
      commonUsers: commonUsers.length,
      commonRTypes: commonRTypes as RType[],
      rTypeTransferScores,
      overallTransferScore,
      interpretation: this.interpretTransferScore(overallTransferScore),
    };
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private generatePatternName(sequence: RType[]): string {
    return `Pattern: ${sequence.join(' → ')}`;
  }

  private describePattern(sequence: RType[]): string {
    return `Decision sequence involving ${sequence.length} rule types`;
  }

  private calculateTransferPotential(pattern: DecisionPattern): number {
    const gameCount = Object.keys(pattern.gamePrevalence).length;
    if (gameCount <= 1) return 0;

    // More games = higher transfer potential
    // More even distribution = higher transfer potential
    const counts = Object.values(pattern.gamePrevalence);
    const total = counts.reduce((a, b) => a + b, 0);
    const entropy = counts.reduce((acc, c) => {
      const p = c / total;
      return acc - (p > 0 ? p * Math.log2(p) : 0);
    }, 0);

    const maxEntropy = Math.log2(gameCount);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  private analyzeRTypePerformance(events: DecisionEvent[]): Array<{ rType: RType; score: number }> {
    const rTypeGroups = new Map<RType, DecisionEvent[]>();

    for (const event of events) {
      if (!rTypeGroups.has(event.rType)) {
        rTypeGroups.set(event.rType, []);
      }
      rTypeGroups.get(event.rType)!.push(event);
    }

    return Array.from(rTypeGroups.entries()).map(([rType, rEvents]) => ({
      rType,
      score: this.calculateRTypePerformance(rEvents),
    }));
  }

  private calculateRTypePerformance(events: DecisionEvent[]): number {
    if (events.length === 0) return 0.5;

    // Use thinking time as proxy for difficulty/mastery
    // Lower thinking time = better mastery (normalized)
    const avgTime = events.reduce((sum, e) => sum + e.thinkingTimeMs, 0) / events.length;
    const normalizedTime = Math.min(1, avgTime / 30000); // 30s = max

    return 1 - normalizedTime;
  }

  private countTTypes(events: DecisionEvent[]): Map<TType, number> {
    const counts = new Map<TType, number>();
    for (const event of events) {
      counts.set(event.tType, (counts.get(event.tType) || 0) + 1);
    }
    return counts;
  }

  private getMostCommon(counts: Map<TType, number>): TType {
    let maxCount = 0;
    let mostCommon: TType = 'T1';

    for (const [tType, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = tType;
      }
    }

    return mostCommon;
  }

  private calculateTTypeFlexibility(counts: Map<TType, number>): number {
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    const entropy = Array.from(counts.values()).reduce((acc, c) => {
      const p = c / total;
      return acc - (p > 0 ? p * Math.log2(p) : 0);
    }, 0);

    const maxEntropy = Math.log2(7); // 7 T-types
    return entropy / maxEntropy;
  }

  private buildGameProfiles(events: DecisionEvent[]): Record<string, import('./types').GameProfile> {
    const profiles: Record<string, import('./types').GameProfile> = {};
    const gameGroups = new Map<string, DecisionEvent[]>();

    for (const event of events) {
      if (!gameGroups.has(event.gameId)) {
        gameGroups.set(event.gameId, []);
      }
      gameGroups.get(event.gameId)!.push(event);
    }

    for (const [gameId, gameEvents] of gameGroups) {
      const rTypeMastery: Record<RType, MasteryLevel> = {} as Record<RType, MasteryLevel>;
      const rTypePerformance = this.analyzeRTypePerformance(gameEvents);

      for (const { rType, score } of rTypePerformance) {
        rTypeMastery[rType] = {
          level: this.scoreToLevel(score),
          confidence: Math.min(1, gameEvents.filter(e => e.rType === rType).length / 20),
          sampleSize: gameEvents.filter(e => e.rType === rType).length,
          lastAssessed: Date.now(),
        };
      }

      profiles[gameId] = {
        gameId,
        totalGames: new Set(gameEvents.map(e => e.sessionId)).size,
        winRate: 0.5, // Would need outcome data
        rTypeMastery,
        skillTrend: 'stable',
        lastUpdated: Date.now(),
      };
    }

    return profiles;
  }

  private scoreToLevel(score: number): MasteryLevel['level'] {
    if (score >= 0.9) return 'expert';
    if (score >= 0.7) return 'advanced';
    if (score >= 0.5) return 'intermediate';
    if (score >= 0.3) return 'beginner';
    return 'novice';
  }

  private calculateCrossGameTransfer(profiles: Record<string, import('./types').GameProfile>): number {
    const gameIds = Object.keys(profiles);
    if (gameIds.length < 2) return 0;

    // Compare R-type mastery across games
    let totalCorrelation = 0;
    let pairs = 0;

    for (let i = 0; i < gameIds.length; i++) {
      for (let j = i + 1; j < gameIds.length; j++) {
        const profile1 = profiles[gameIds[i]];
        const profile2 = profiles[gameIds[j]];

        // Find common R-types
        const common = Object.keys(profile1.rTypeMastery).filter(
          r => r in profile2.rTypeMastery
        ) as RType[];

        if (common.length > 0) {
          // Calculate correlation of mastery levels
          const scores1 = common.map(r => this.levelToScore(profile1.rTypeMastery[r].level));
          const scores2 = common.map(r => this.levelToScore(profile2.rTypeMastery[r].level));

          totalCorrelation += this.correlation(scores1, scores2);
          pairs++;
        }
      }
    }

    return pairs > 0 ? totalCorrelation / pairs : 0;
  }

  private levelToScore(level: MasteryLevel['level']): number {
    const mapping = { novice: 0.1, beginner: 0.3, intermediate: 0.5, advanced: 0.7, expert: 0.9 };
    return mapping[level];
  }

  private correlation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let denX = 0;
    let denY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const den = Math.sqrt(denX * denY);
    return den > 0 ? num / den : 0;
  }

  private calculateRTypeGeneralization(events: DecisionEvent[]): number {
    // Measure how consistent R-type performance is across games
    const gameGroups = new Map<string, DecisionEvent[]>();

    for (const event of events) {
      if (!gameGroups.has(event.gameId)) {
        gameGroups.set(event.gameId, []);
      }
      gameGroups.get(event.gameId)!.push(event);
    }

    if (gameGroups.size < 2) return 0;

    // For each R-type, calculate variance in performance across games
    const rTypes = [...new Set(events.map(e => e.rType))];
    let totalVariance = 0;
    let count = 0;

    for (const rType of rTypes) {
      const performances: number[] = [];

      for (const [, gameEvents] of gameGroups) {
        const rTypeEvents = gameEvents.filter(e => e.rType === rType);
        if (rTypeEvents.length >= 3) {
          performances.push(this.calculateRTypePerformance(rTypeEvents));
        }
      }

      if (performances.length >= 2) {
        const mean = performances.reduce((a, b) => a + b, 0) / performances.length;
        const variance = performances.reduce((acc, p) => acc + (p - mean) ** 2, 0) / performances.length;
        totalVariance += variance;
        count++;
      }
    }

    // Lower variance = higher generalization
    const avgVariance = count > 0 ? totalVariance / count : 0.5;
    return Math.max(0, 1 - avgVariance * 4); // Scale to 0-1
  }

  private interpretTransferScore(score: number): string {
    if (score >= 0.8) return 'Strong positive transfer - skills transfer well between games';
    if (score >= 0.6) return 'Moderate positive transfer - some skill transfer observed';
    if (score >= 0.4) return 'Neutral - little transfer effect detected';
    if (score >= 0.2) return 'Weak negative transfer - games may interfere';
    return 'Strong negative transfer - playing one game may hinder the other';
  }
}

export interface TransferLearningResult {
  sourceGame: string;
  targetGame: string;
  commonUsers: number;
  commonRTypes: RType[];
  rTypeTransferScores: Record<RType, number>;
  overallTransferScore: number;
  interpretation: string;
}
