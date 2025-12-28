import type { RType, TType, ModalOperator } from '@krog/krog-framework';
import type { DecisionEvent, GameSessionEvent } from './types';

/**
 * KROG Analytics Tracker
 * Captures and buffers decision events for analysis
 */

export interface TrackerConfig {
  bufferSize: number;
  flushIntervalMs: number;
  endpoint?: string;
  onFlush?: (events: DecisionEvent[]) => Promise<void>;
}

const DEFAULT_CONFIG: TrackerConfig = {
  bufferSize: 100,
  flushIntervalMs: 5000,
};

export class AnalyticsTracker {
  private config: TrackerConfig;
  private buffer: DecisionEvent[] = [];
  private sessionId: string;
  private flushTimer?: ReturnType<typeof setInterval>;

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
  }

  /**
   * Start tracking - call when user begins a session
   */
  start(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushIntervalMs);
  }

  /**
   * Stop tracking - call when session ends
   */
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  /**
   * Track a decision event
   */
  trackDecision(params: {
    userId: string;
    gameId: string;
    position: string;
    availableActions: string[];
    chosenAction: string;
    rType: RType;
    tType: TType;
    modalOperator: ModalOperator;
    thinkingTimeMs: number;
    metadata?: Record<string, unknown>;
  }): DecisionEvent {
    const event: DecisionEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...params,
    };

    this.buffer.push(event);

    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }

    return event;
  }

  /**
   * Create a session summary from buffered events
   */
  createSessionSummary(userId: string, gameId: string): GameSessionEvent {
    const sessionEvents = this.buffer.filter(
      e => e.userId === userId && e.gameId === gameId
    );

    const rTypeDistribution = this.countBy(sessionEvents, 'rType');
    const tTypeDistribution = this.countBy(sessionEvents, 'tType');

    const avgThinkingTime = sessionEvents.length > 0
      ? sessionEvents.reduce((sum, e) => sum + e.thinkingTimeMs, 0) / sessionEvents.length
      : 0;

    return {
      id: this.generateEventId(),
      userId,
      gameId,
      startTime: sessionEvents[0]?.timestamp ?? Date.now(),
      endTime: sessionEvents[sessionEvents.length - 1]?.timestamp,
      totalDecisions: sessionEvents.length,
      rTypeDistribution: rTypeDistribution as Record<RType, number>,
      tTypeDistribution: tTypeDistribution as Record<TType, number>,
      averageThinkingTime: avgThinkingTime,
    };
  }

  /**
   * Flush buffered events
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    if (this.config.onFlush) {
      await this.config.onFlush(events);
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private countBy<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
