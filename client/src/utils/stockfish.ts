/**
 * Stockfish.js Engine Wrapper
 *
 * Provides a clean interface to the Stockfish chess engine running in a Web Worker.
 * Uses the CDN version to avoid bundling the ~2MB WASM file.
 */

export interface BestMove {
  move: string;      // UCI format (e.g., "e2e4")
  san?: string;      // SAN format if converted
  score: number;     // Centipawns (+100 = 1 pawn advantage for white)
  mate?: number;     // Mate in N moves (positive = white wins, negative = black wins)
  pv: string[];      // Principal variation (sequence of best moves)
  depth: number;     // Search depth reached
}

export interface AnalysisResult {
  bestMoves: BestMove[];
  evaluation: number;    // Centipawns from white's perspective
  mate?: number;         // Mate in N if applicable
  depth: number;         // Final depth reached
}

type MessageHandler = (data: string) => void;

// Internal type for parsed UCI info with multipv index
interface ParsedMove extends BestMove {
  multipv: number;
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready: boolean = false;
  private analyzing: boolean = false;
  private messageHandlers: MessageHandler[] = [];
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the Stockfish engine
   * Loads from CDN on first call using blob URL workaround for CORS
   */
  async init(): Promise<void> {
    if (this.ready) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        // Fetch Stockfish script from CDN
        const response = await fetch(
          'https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js'
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch Stockfish: ${response.status}`);
        }

        const scriptText = await response.text();

        // Create a blob URL to work around CORS restrictions
        const blob = new Blob([scriptText], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);

        // Create worker from blob URL
        this.worker = new Worker(blobUrl);

        // Clean up blob URL after worker is created
        URL.revokeObjectURL(blobUrl);

        this.worker.onmessage = (e) => {
          const message = e.data;

          // Check for ready signal
          if (message === 'uciok') {
            this.ready = true;
            resolve();
          }

          // Forward to all message handlers
          this.messageHandlers.forEach(handler => handler(message));
        };

        this.worker.onerror = (e) => {
          console.error('Stockfish worker error:', e);
          reject(new Error('Failed to load Stockfish engine'));
        };

        // Initialize UCI protocol
        this.send('uci');
      } catch (err) {
        console.error('Stockfish init error:', err);
        reject(err);
      }
    });

    return this.initPromise;
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Check if currently analyzing
   */
  isAnalyzing(): boolean {
    return this.analyzing;
  }

  /**
   * Send a command to the engine
   */
  private send(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    }
  }

  /**
   * Get the best moves for a position
   *
   * @param fen - FEN string of the position
   * @param options - Analysis options
   * @returns Promise resolving to analysis result
   */
  async getBestMoves(
    fen: string,
    options: {
      depth?: number;
      multiPV?: number;
      timeLimit?: number;
    } = {}
  ): Promise<AnalysisResult> {
    if (!this.ready) {
      await this.init();
    }

    const { depth = 15, multiPV = 3, timeLimit = 3000 } = options;

    return new Promise((resolve) => {
      const bestMoves: Map<number, ParsedMove> = new Map();
      let finalDepth = 0;
      let finalEval = 0;
      let finalMate: number | undefined;
      let lastPV: string[] = [];

      const handler: MessageHandler = (message: string) => {
        // Parse ALL info lines with score and pv (more robust)
        if (message.startsWith('info') && message.includes(' pv ')) {
          const parsed = this.parseInfoLine(message);
          if (parsed) {
            // Store by multipv index, or use 1 as default
            const pvIndex = parsed.multipv || 1;
            bestMoves.set(pvIndex, parsed);

            // Track the best line's evaluation
            if (pvIndex === 1) {
              finalDepth = parsed.depth;
              finalEval = parsed.score;
              finalMate = parsed.mate;
              lastPV = parsed.pv;
            }
          }
        }

        // Parse bestmove line - analysis complete
        if (message.startsWith('bestmove')) {
          this.analyzing = false;
          this.removeMessageHandler(handler);

          // Extract best move from bestmove line as fallback
          const bestmoveMatch = message.match(/bestmove\s+(\S+)/);
          const bestMoveUCI = bestmoveMatch ? bestmoveMatch[1] : '';

          // Convert map to sorted array
          let moves: BestMove[] = [];
          for (let i = 1; i <= multiPV; i++) {
            const move = bestMoves.get(i);
            if (move) moves.push(move);
          }

          // Fallback: if no moves collected via multipv, create one from bestmove
          if (moves.length === 0 && bestMoveUCI && bestMoveUCI.length >= 4) {
            moves = [{
              move: bestMoveUCI,
              score: finalEval,
              mate: finalMate,
              pv: lastPV.length > 0 ? lastPV : [bestMoveUCI],
              depth: finalDepth
            }];
          }

          resolve({
            bestMoves: moves,
            evaluation: finalEval,
            mate: finalMate,
            depth: finalDepth
          });
        }
      };

      this.addMessageHandler(handler);
      this.analyzing = true;

      // Set position and start analysis
      this.send('ucinewgame');
      this.send(`setoption name MultiPV value ${multiPV}`);
      this.send(`position fen ${fen}`);
      this.send(`go depth ${depth} movetime ${timeLimit}`);
    });
  }

  /**
   * Get just the evaluation score for a position
   */
  async getEvaluation(fen: string, depth: number = 12): Promise<number> {
    const result = await this.getBestMoves(fen, { depth, multiPV: 1, timeLimit: 2000 });
    return result.mate !== undefined
      ? (result.mate > 0 ? 10000 : -10000)
      : result.evaluation;
  }

  /**
   * Parse a UCI info line into structured data
   * Handles both multipv and non-multipv formats
   */
  private parseInfoLine(line: string): ParsedMove | null {
    try {
      const depthMatch = line.match(/depth (\d+)/);
      const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
      const pvMatch = line.match(/ pv (.+)$/);

      // Need at least depth, score, and pv
      if (!depthMatch || !scoreMatch || !pvMatch) {
        return null;
      }

      const depth = parseInt(depthMatch[1]);
      const scoreType = scoreMatch[1];
      const scoreValue = parseInt(scoreMatch[2]);
      const pv = pvMatch[1].trim().split(' ').filter(m => m.length >= 4);

      if (pv.length === 0) {
        return null;
      }

      // multipv is optional (defaults to 1 if not present)
      const multipvMatch = line.match(/multipv (\d+)/);
      const multipv = multipvMatch ? parseInt(multipvMatch[1]) : 1;

      const result: ParsedMove = {
        move: pv[0],
        score: scoreType === 'cp' ? scoreValue : 0,
        pv,
        depth,
        multipv
      };

      if (scoreType === 'mate') {
        result.mate = scoreValue;
        result.score = scoreValue > 0 ? 10000 - scoreValue : -10000 - scoreValue;
      }

      return result;
    } catch {
      return null;
    }
  }

  /**
   * Stop the current analysis
   */
  stop(): void {
    if (this.analyzing) {
      this.send('stop');
      this.analyzing = false;
    }
  }

  /**
   * Add a message handler
   */
  private addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove a message handler
   */
  private removeMessageHandler(handler: MessageHandler): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index !== -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  /**
   * Clean up and destroy the engine
   */
  destroy(): void {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = false;
    this.analyzing = false;
    this.messageHandlers = [];
    this.initPromise = null;
  }
}

// Singleton instance for easy access
let engineInstance: StockfishEngine | null = null;

export function getStockfishEngine(): StockfishEngine {
  if (!engineInstance) {
    engineInstance = new StockfishEngine();
  }
  return engineInstance;
}

/**
 * Convert UCI move to from/to squares
 * e.g., "e2e4" -> { from: "e2", to: "e4" }
 */
export function uciToSquares(uci: string): { from: string; to: string; promotion?: string } {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined
  };
}

/**
 * Format evaluation score for display
 * @param centipawns - Score in centipawns
 * @param mate - Mate in N moves (optional)
 * @returns Formatted string like "+1.5" or "M3"
 */
export function formatEvaluation(centipawns: number, mate?: number): string {
  if (mate !== undefined) {
    return mate > 0 ? `M${mate}` : `M${Math.abs(mate)}`;
  }

  const pawns = centipawns / 100;
  const sign = pawns >= 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}
