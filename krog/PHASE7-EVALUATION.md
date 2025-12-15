# KROG Chess Phase 7: Move Evaluation & Statistics System
# Mathematical Model for Win/Loss Prediction and Move Suggestion

---

## 7.1 Overview

### Purpose
Build a mathematical model that combines statistical analysis, engine evaluation, and KROG logical formalism to:
1. Calculate win/draw/loss probabilities for any position
2. Suggest optimal moves with explanations
3. Track and learn from game statistics
4. Provide teachable, explainable evaluations

### Core Innovation
While traditional engines give scores ("+1.5"), KROG explains WHY:
```
Traditional: e4 = +0.25
KROG:        e4 = +0.25 because:
             ✓ O(control_center) - controls d5, f5
             ✓ P(develop_pieces) - opens Bf1, Qd1 diagonals
             ✓ O(king_safety) - enables castling
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KROG Move Evaluation System                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  Statistics  │   │    Engine    │   │    KROG Evaluator    │ │
│  │   Database   │   │  Integration │   │                      │ │
│  │              │   │              │   │  • Principle Check   │ │
│  │  • Games     │   │  • Stockfish │   │  • Pattern Match     │ │
│  │  • Moves     │   │  • Centipawn │   │  • Rule Compliance   │ │
│  │  • Win rates │   │  • Best line │   │  • Explanation Gen   │ │
│  │  • ELO bands │   │              │   │                      │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────┘ │
│         │                  │                      │              │
│         └──────────────────┼──────────────────────┘              │
│                            ▼                                     │
│                  ┌───────────────────┐                          │
│                  │  Score Combiner   │                          │
│                  │                   │                          │
│                  │  S = αP + βE + γK │                          │
│                  └─────────┬─────────┘                          │
│                            │                                     │
│                            ▼                                     │
│         ┌─────────────────────────────────────┐                 │
│         │         Move Suggestion             │                 │
│         │  "Play Nf3 (58% win rate)"         │                 │
│         │  "Controls center, develops piece"  │                 │
│         └─────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7.2 Database Schema

### 7.2.1 Core Tables

```sql
-- ═══════════════════════════════════════════════════════════════
--                     POSITION STATISTICS
-- ═══════════════════════════════════════════════════════════════

-- Store unique positions (by FEN, excluding move counters)
CREATE TABLE positions (
    id              BIGSERIAL PRIMARY KEY,
    fen_position    VARCHAR(100) NOT NULL,  -- Position part of FEN only
    fen_hash        BIGINT NOT NULL,        -- Zobrist hash for fast lookup
    
    -- Aggregate statistics
    total_games     INTEGER DEFAULT 0,
    white_wins      INTEGER DEFAULT 0,
    draws           INTEGER DEFAULT 0,
    black_wins      INTEGER DEFAULT 0,
    
    -- Performance by ELO band
    stats_by_elo    JSONB,  -- {"1000-1200": {games: 100, w: 40, d: 30, b: 30}, ...}
    
    -- Evaluation cache
    engine_eval     SMALLINT,               -- Centipawns (±32767)
    engine_depth    SMALLINT,
    eval_updated_at TIMESTAMPTZ,
    
    -- KROG analysis cache
    krog_analysis   JSONB,
    
    -- Metadata
    first_seen      TIMESTAMPTZ DEFAULT NOW(),
    last_seen       TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_position UNIQUE (fen_hash, fen_position)
);

CREATE INDEX idx_positions_hash ON positions(fen_hash);
CREATE INDEX idx_positions_games ON positions(total_games DESC);

-- ═══════════════════════════════════════════════════════════════
--                     MOVE STATISTICS
-- ═══════════════════════════════════════════════════════════════

-- Statistics for each move from each position
CREATE TABLE move_statistics (
    id              BIGSERIAL PRIMARY KEY,
    position_id     BIGINT REFERENCES positions(id),
    
    -- The move
    move_uci        VARCHAR(5) NOT NULL,    -- e2e4, e7e8q
    move_san        VARCHAR(10) NOT NULL,   -- e4, e8=Q+
    
    -- Aggregate statistics
    times_played    INTEGER DEFAULT 0,
    white_wins      INTEGER DEFAULT 0,
    draws           INTEGER DEFAULT 0,
    black_wins      INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_elo_player  SMALLINT,               -- Average ELO of players who chose this
    performance     SMALLINT,               -- Performance rating of this move
    
    -- Stats by ELO band
    stats_by_elo    JSONB,
    
    -- Engine evaluation
    engine_eval     SMALLINT,               -- Eval after this move
    engine_rank     SMALLINT,               -- 1 = engine's top choice
    is_best_move    BOOLEAN DEFAULT FALSE,
    is_book_move    BOOLEAN DEFAULT FALSE,
    
    -- KROG analysis
    krog_score      SMALLINT,               -- KROG principle score
    krog_analysis   JSONB,
    
    -- Timestamps
    first_played    TIMESTAMPTZ DEFAULT NOW(),
    last_played     TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_position_move UNIQUE (position_id, move_uci)
);

CREATE INDEX idx_move_stats_position ON move_statistics(position_id);
CREATE INDEX idx_move_stats_played ON move_statistics(times_played DESC);

-- ═══════════════════════════════════════════════════════════════
--                     GAME RECORDS
-- ═══════════════════════════════════════════════════════════════

-- Individual games for detailed analysis
CREATE TABLE games (
    id              BIGSERIAL PRIMARY KEY,
    
    -- Players
    white_player_id BIGINT REFERENCES users(id),
    black_player_id BIGINT REFERENCES users(id),
    white_elo       SMALLINT,
    black_elo       SMALLINT,
    
    -- Game info
    time_control    VARCHAR(20),            -- "5+3", "10+0"
    variant         VARCHAR(20) DEFAULT 'standard',
    eco             VARCHAR(3),             -- ECO code
    opening_name    VARCHAR(100),
    
    -- Result
    result          VARCHAR(7) NOT NULL,    -- "1-0", "0-1", "1/2-1/2"
    termination     VARCHAR(20),            -- "checkmate", "resignation", "timeout"
    
    -- Moves
    pgn             TEXT,
    moves_uci       TEXT[],                 -- Array of UCI moves
    move_times      INTEGER[],              -- Centiseconds per move
    
    -- Analysis
    analyzed        BOOLEAN DEFAULT FALSE,
    avg_centipawn_loss_white SMALLINT,
    avg_centipawn_loss_black SMALLINT,
    blunders_white  SMALLINT,
    blunders_black  SMALLINT,
    
    -- Timestamps
    played_at       TIMESTAMPTZ DEFAULT NOW(),
    analyzed_at     TIMESTAMPTZ
);

CREATE INDEX idx_games_white ON games(white_player_id);
CREATE INDEX idx_games_black ON games(black_player_id);
CREATE INDEX idx_games_eco ON games(eco);
CREATE INDEX idx_games_date ON games(played_at DESC);

-- ═══════════════════════════════════════════════════════════════
--                     OPENING BOOK
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE opening_book (
    id              SERIAL PRIMARY KEY,
    position_id     BIGINT REFERENCES positions(id),
    
    -- Opening info
    eco             VARCHAR(3),
    opening_name    VARCHAR(100),
    variation_name  VARCHAR(100),
    
    -- Move line
    moves           TEXT NOT NULL,          -- "1.e4 e5 2.Nf3 Nc6"
    ply             SMALLINT,               -- Half-moves deep
    
    -- Evaluation
    evaluation      VARCHAR(10),            -- "=", "+=", "+/-"
    
    -- KROG teaching
    key_ideas       JSONB,
    krog_principles JSONB,
    typical_plans   JSONB,
    
    CONSTRAINT unique_opening_line UNIQUE (moves)
);

CREATE INDEX idx_opening_position ON opening_book(position_id);
CREATE INDEX idx_opening_eco ON opening_book(eco);

-- ═══════════════════════════════════════════════════════════════
--                     KROG PRINCIPLES
-- ═══════════════════════════════════════════════════════════════

-- Define KROG principles for evaluation
CREATE TABLE krog_principles (
    id              SERIAL PRIMARY KEY,
    
    -- Identity
    code            VARCHAR(30) UNIQUE NOT NULL,  -- "control_center"
    category        VARCHAR(20) NOT NULL,         -- "opening", "middlegame", "endgame", "tactical"
    
    -- Names
    name_en         VARCHAR(100) NOT NULL,
    name_no         VARCHAR(100),
    
    -- KROG formalization
    krog_type       VARCHAR(10) NOT NULL,         -- "O" (obligation), "P" (permission), "F" (forbidden)
    krog_formula    TEXT NOT NULL,
    
    -- Scoring
    base_weight     SMALLINT DEFAULT 100,         -- Importance (0-1000)
    phase_weights   JSONB,                        -- {"opening": 150, "middlegame": 100, "endgame": 50}
    
    -- Detection
    detection_sql   TEXT,                         -- SQL/function to detect
    detection_func  VARCHAR(50),                  -- TypeScript function name
    
    -- Teaching
    explanation_en  TEXT,
    explanation_no  TEXT,
    examples        JSONB
);

-- Seed essential principles
INSERT INTO krog_principles (code, category, krog_type, krog_formula, name_en, base_weight) VALUES
('control_center', 'opening', 'O', 'O(maximize(influence, {d4,d5,e4,e5}))', 'Control the Center', 150),
('develop_pieces', 'opening', 'O', 'O(move_piece_from_start) early_game', 'Develop Pieces', 140),
('king_safety', 'opening', 'O', 'O(castle) ∨ O(protect_king)', 'Ensure King Safety', 160),
('dont_move_piece_twice', 'opening', 'P', '¬P(move_same_piece) unless necessary', 'Avoid Moving Same Piece Twice', 80),
('connect_rooks', 'opening', 'O', 'O(clear_back_rank) → connected_rooks', 'Connect the Rooks', 70),
('piece_activity', 'middlegame', 'O', 'O(maximize(piece_mobility))', 'Keep Pieces Active', 120),
('weak_squares', 'middlegame', 'O', 'O(exploit_weak_squares) ∧ O(avoid_creating_weakness)', 'Control Weak Squares', 100),
('pawn_structure', 'middlegame', 'P', '¬P(create_doubled_pawns) unless compensation', 'Maintain Pawn Structure', 90),
('king_activity', 'endgame', 'O', 'endgame → O(activate_king)', 'Activate King in Endgame', 130),
('passed_pawns', 'endgame', 'O', 'O(advance_passed_pawns) ∨ O(create_passed_pawn)', 'Push Passed Pawns', 140),
('opposition', 'endgame', 'O', 'king_pawn_endgame → O(gain_opposition)', 'Gain the Opposition', 150),
('fork_check', 'tactical', 'P', 'P(fork) when available → material_gain', 'Look for Forks', 200),
('pin_exploit', 'tactical', 'P', 'P(exploit_pin) when absolute_pin', 'Exploit Pins', 180),
('back_rank', 'tactical', 'O', 'O(check_back_rank_safety)', 'Watch Back Rank', 170);

-- ═══════════════════════════════════════════════════════════════
--                     ELO BANDS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE elo_bands (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(20) NOT NULL,
    min_elo         SMALLINT NOT NULL,
    max_elo         SMALLINT NOT NULL,
    
    -- Weighting for different bands
    statistical_weight  DECIMAL(3,2) DEFAULT 1.0,  -- How much to trust this band's stats
    
    CONSTRAINT unique_band UNIQUE (min_elo, max_elo)
);

INSERT INTO elo_bands (name, min_elo, max_elo) VALUES
('Beginner', 0, 800),
('Casual', 800, 1200),
('Intermediate', 1200, 1600),
('Advanced', 1600, 2000),
('Expert', 2000, 2200),
('Master', 2200, 2400),
('Grandmaster', 2400, 3000);
```

### 7.2.2 Materialized Views for Performance

```sql
-- Fast lookup of popular positions
CREATE MATERIALIZED VIEW popular_positions AS
SELECT 
    p.id,
    p.fen_position,
    p.total_games,
    p.white_wins::float / NULLIF(p.total_games, 0) as white_win_rate,
    p.draws::float / NULLIF(p.total_games, 0) as draw_rate,
    p.black_wins::float / NULLIF(p.total_games, 0) as black_win_rate,
    p.engine_eval,
    ob.eco,
    ob.opening_name
FROM positions p
LEFT JOIN opening_book ob ON p.id = ob.position_id
WHERE p.total_games >= 100
ORDER BY p.total_games DESC;

CREATE UNIQUE INDEX idx_popular_positions ON popular_positions(id);

-- Refresh periodically
-- REFRESH MATERIALIZED VIEW CONCURRENTLY popular_positions;

-- Best moves by position (top 5)
CREATE MATERIALIZED VIEW best_moves AS
SELECT 
    ms.position_id,
    ms.move_san,
    ms.times_played,
    ms.white_wins::float / NULLIF(ms.times_played, 0) as white_win_rate,
    ms.engine_eval,
    ms.engine_rank,
    ms.krog_score,
    ROW_NUMBER() OVER (PARTITION BY ms.position_id ORDER BY ms.times_played DESC) as popularity_rank
FROM move_statistics ms
WHERE ms.times_played >= 10;

CREATE INDEX idx_best_moves_position ON best_moves(position_id);
```

---

## 7.3 Statistical Model

### 7.3.1 Win Probability Calculation

```typescript
interface PositionStatistics {
  positionId: bigint;
  fen: string;
  
  totalGames: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
  
  // Derived probabilities
  pWhiteWin: number;   // P(white wins)
  pDraw: number;       // P(draw)
  pBlackWin: number;   // P(black wins)
  
  // ELO-adjusted probabilities
  byElo: Map<string, {
    games: number;
    pWhite: number;
    pDraw: number;
    pBlack: number;
  }>;
}

// Calculate win probability from database stats
function calculateWinProbability(
  position: PositionStatistics,
  playerElo: number,
  playingAs: 'white' | 'black'
): number {
  // Find appropriate ELO band
  const eloBand = getEloBand(playerElo);
  const bandStats = position.byElo.get(eloBand);
  
  // Use band-specific stats if available, else global
  const stats = bandStats && bandStats.games >= 50 
    ? bandStats 
    : { pWhite: position.pWhiteWin, pDraw: position.pDraw, pBlack: position.pBlackWin };
  
  // Return probability from player's perspective
  if (playingAs === 'white') {
    return stats.pWhite + (stats.pDraw * 0.5);  // Draws count as 0.5
  } else {
    return stats.pBlack + (stats.pDraw * 0.5);
  }
}
```

### 7.3.2 Move Statistics Model

```typescript
interface MoveStatistics {
  moveUci: string;
  moveSan: string;
  
  // Raw counts
  timesPlayed: number;
  whiteWins: number;
  draws: number;
  blackWins: number;
  
  // Derived metrics
  winRate: number;          // From side-to-move perspective
  drawRate: number;
  popularity: number;       // times_played / total_position_games
  performanceRating: number;
  
  // Engine data
  engineEval: number;       // Centipawns
  engineRank: number;       // 1 = best
  isBestMove: boolean;
  isBookMove: boolean;
  
  // KROG data
  krogScore: number;
  krogAnalysis: KROGMoveAnalysis;
}

// Calculate expected score for a move
function calculateMoveScore(
  move: MoveStatistics,
  sideToMove: 'white' | 'black'
): number {
  const wins = sideToMove === 'white' ? move.whiteWins : move.blackWins;
  const losses = sideToMove === 'white' ? move.blackWins : move.whiteWins;
  
  // Expected score: wins + 0.5 * draws
  const expectedScore = (wins + 0.5 * move.draws) / move.timesPlayed;
  
  return expectedScore;
}

// Bayesian adjustment for moves with few games
function bayesianAdjustedWinRate(
  move: MoveStatistics,
  priorWinRate: number = 0.5,
  priorStrength: number = 10
): number {
  // Bayesian average: (prior * strength + observed * n) / (strength + n)
  const observedWinRate = move.winRate;
  const n = move.timesPlayed;
  
  return (priorWinRate * priorStrength + observedWinRate * n) / (priorStrength + n);
}
```

### 7.3.3 ELO-Based Filtering

```typescript
interface EloFilter {
  minElo?: number;
  maxElo?: number;
  band?: string;
}

// Get statistics filtered by ELO range
async function getFilteredStatistics(
  positionId: bigint,
  filter: EloFilter
): Promise<PositionStatistics> {
  const query = `
    SELECT 
      SUM((stats_by_elo->$1->>'games')::int) as games,
      SUM((stats_by_elo->$1->>'white_wins')::int) as white_wins,
      SUM((stats_by_elo->$1->>'draws')::int) as draws,
      SUM((stats_by_elo->$1->>'black_wins')::int) as black_wins
    FROM positions
    WHERE id = $2
  `;
  
  // ... implementation
}

// Weight statistics by ELO relevance
function weightByEloProximity(
  playerElo: number,
  stats: Map<string, BandStatistics>
): WeightedStatistics {
  let totalWeight = 0;
  let weightedWhiteWins = 0;
  let weightedDraws = 0;
  let weightedBlackWins = 0;
  
  for (const [band, bandStats] of stats) {
    const bandCenter = getBandCenter(band);
    
    // Gaussian weighting - closer ELO = higher weight
    const distance = Math.abs(playerElo - bandCenter);
    const sigma = 200;  // Standard deviation
    const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
    
    totalWeight += weight * bandStats.games;
    weightedWhiteWins += weight * bandStats.whiteWins;
    weightedDraws += weight * bandStats.draws;
    weightedBlackWins += weight * bandStats.blackWins;
  }
  
  return {
    pWhite: weightedWhiteWins / totalWeight,
    pDraw: weightedDraws / totalWeight,
    pBlack: weightedBlackWins / totalWeight
  };
}
```

---

## 7.4 KROG Evaluation Functions

### 7.4.1 Principle Detection

```typescript
interface KROGPrinciple {
  code: string;
  type: 'O' | 'P' | 'F';  // Obligation, Permission, Forbidden
  category: 'opening' | 'middlegame' | 'endgame' | 'tactical';
  weight: number;
  
  // Detection function
  detect: (position: Position, move?: Move) => PrincipleResult;
}

interface PrincipleResult {
  applies: boolean;       // Does this principle apply to current position?
  satisfied: boolean;     // Is the principle satisfied?
  score: number;          // -100 to +100
  explanation: string;
  details?: any;
}

// Example: Control Center principle
const controlCenter: KROGPrinciple = {
  code: 'control_center',
  type: 'O',
  category: 'opening',
  weight: 150,
  
  detect: (position: Position, move?: Move): PrincipleResult => {
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    const sideToMove = position.turn;
    
    // Count control of center squares
    let controlBefore = 0;
    let controlAfter = 0;
    
    for (const sq of centerSquares) {
      if (position.isControlledBy(sq, sideToMove)) controlBefore++;
    }
    
    if (move) {
      const positionAfter = position.move(move);
      for (const sq of centerSquares) {
        if (positionAfter.isControlledBy(sq, sideToMove)) controlAfter++;
      }
    }
    
    const improvement = controlAfter - controlBefore;
    
    return {
      applies: position.phase === 'opening' || position.phase === 'middlegame',
      satisfied: controlAfter >= 2,
      score: improvement * 25,  // +25 per square gained
      explanation: improvement > 0 
        ? `Gains control of ${improvement} central square(s)`
        : improvement < 0
        ? `Loses control of ${-improvement} central square(s)`
        : 'Maintains central control'
    };
  }
};

// Example: Develop Pieces principle
const developPieces: KROGPrinciple = {
  code: 'develop_pieces',
  type: 'O',
  category: 'opening',
  weight: 140,
  
  detect: (position: Position, move?: Move): PrincipleResult => {
    if (!move) return { applies: false, satisfied: false, score: 0, explanation: '' };
    
    const piece = position.pieceAt(move.from);
    const isStartingSquare = isOriginalSquare(piece, move.from);
    const isDevelopingMove = isStartingSquare && !isPawn(piece);
    
    // Count undeveloped pieces
    const undevelopedBefore = countUndevelopedPieces(position);
    const undevelopedAfter = countUndevelopedPieces(position.move(move));
    
    return {
      applies: position.phase === 'opening',
      satisfied: undevelopedAfter <= 2,
      score: isDevelopingMove ? 30 : (undevelopedAfter < undevelopedBefore ? 15 : -10),
      explanation: isDevelopingMove
        ? `Develops ${pieceNames[piece.type]} to active square`
        : undevelopedAfter > undevelopedBefore
        ? 'Does not develop a piece'
        : 'Maintains development'
    };
  }
};

// Example: King Safety principle  
const kingSafety: KROGPrinciple = {
  code: 'king_safety',
  type: 'O',
  category: 'opening',
  weight: 160,
  
  detect: (position: Position, move?: Move): PrincipleResult => {
    const side = position.turn;
    
    // Castling moves are excellent for king safety
    if (move && (move.san === 'O-O' || move.san === 'O-O-O')) {
      return {
        applies: true,
        satisfied: true,
        score: 50,
        explanation: 'Castles to safety'
      };
    }
    
    // Evaluate king safety factors
    const kingSafetyScore = evaluateKingSafety(position, side);
    const afterScore = move ? evaluateKingSafety(position.move(move), side) : kingSafetyScore;
    
    return {
      applies: true,
      satisfied: afterScore >= 0,
      score: afterScore - kingSafetyScore,
      explanation: afterScore > kingSafetyScore
        ? 'Improves king safety'
        : afterScore < kingSafetyScore
        ? 'Weakens king safety'
        : 'King safety unchanged'
    };
  }
};
```

### 7.4.2 Tactical Pattern Detection

```typescript
interface TacticalPattern {
  type: string;
  detect: (position: Position, move: Move) => TacticalResult | null;
}

interface TacticalResult {
  pattern: string;
  score: number;
  targets: string[];      // Squares/pieces involved
  explanation: string;
  krogFormula: string;
}

// Fork detection
const forkDetector: TacticalPattern = {
  type: 'fork',
  
  detect: (position: Position, move: Move): TacticalResult | null => {
    const posAfter = position.move(move);
    const piece = position.pieceAt(move.from);
    const attacks = posAfter.attacksFrom(move.to);
    
    // Find valuable pieces attacked
    const valuableTargets = attacks.filter(sq => {
      const target = posAfter.pieceAt(sq);
      return target && target.color !== piece.color && 
             (target.type === 'k' || target.type === 'q' || target.type === 'r');
    });
    
    if (valuableTargets.length >= 2) {
      const targetNames = valuableTargets.map(sq => 
        pieceNames[posAfter.pieceAt(sq).type]
      );
      
      return {
        pattern: 'fork',
        score: calculateForkValue(posAfter, valuableTargets),
        targets: valuableTargets,
        explanation: `${pieceNames[piece.type]} forks ${targetNames.join(' and ')}`,
        krogFormula: `fork(${piece.type}, ${valuableTargets.join(', ')}) → O(lose_material)`
      };
    }
    
    return null;
  }
};

// Pin detection
const pinDetector: TacticalPattern = {
  type: 'pin',
  
  detect: (position: Position, move: Move): TacticalResult | null => {
    const posAfter = position.move(move);
    const piece = position.pieceAt(move.from);
    
    // Only bishops, rooks, queens can pin
    if (!['b', 'r', 'q'].includes(piece.type)) return null;
    
    // Check for pins created
    const pins = findPins(posAfter, piece.color);
    const newPins = pins.filter(pin => 
      pin.pinner === move.to && !findPins(position, piece.color).some(p => p.pinned === pin.pinned)
    );
    
    if (newPins.length > 0) {
      const pin = newPins[0];
      const pinnedPiece = posAfter.pieceAt(pin.pinned);
      const behindPiece = posAfter.pieceAt(pin.behind);
      
      const isAbsolute = behindPiece.type === 'k';
      
      return {
        pattern: isAbsolute ? 'absolute_pin' : 'relative_pin',
        score: isAbsolute ? 40 : 25,
        targets: [pin.pinned, pin.behind],
        explanation: `Pins ${pieceNames[pinnedPiece.type]} to ${pieceNames[behindPiece.type]}`,
        krogFormula: isAbsolute 
          ? `absolute_pin(${pin.pinned}) → F(move_pinned_piece)`
          : `relative_pin(${pin.pinned}, ${pin.behind}) → O(lose_material) if moved`
      };
    }
    
    return null;
  }
};

// All tactical detectors
const tacticalDetectors: TacticalPattern[] = [
  forkDetector,
  pinDetector,
  skewerDetector,
  discoveredAttackDetector,
  doubleCheckDetector,
  backRankThreatDetector,
  removingDefenderDetector,
  deflectionDetector,
  decoyDetector
];
```

### 7.4.3 KROG Move Analysis

```typescript
interface KROGMoveAnalysis {
  move: string;
  
  // Principle evaluation
  principleResults: PrincipleResult[];
  satisfiedPrinciples: string[];
  violatedPrinciples: string[];
  
  // Tactical patterns
  tacticalPatterns: TacticalResult[];
  
  // Aggregate scores
  principleScore: number;     // Sum of principle scores
  tacticalScore: number;      // Sum of tactical scores
  totalKrogScore: number;     // Combined
  
  // KROG formula summary
  krogFormula: string;
  
  // Human-readable explanation
  explanation: {
    en: string;
    no: string;
  };
}

async function analyzeMove(
  position: Position,
  move: Move,
  principles: KROGPrinciple[]
): Promise<KROGMoveAnalysis> {
  const principleResults: PrincipleResult[] = [];
  const satisfiedPrinciples: string[] = [];
  const violatedPrinciples: string[] = [];
  
  // Evaluate each principle
  for (const principle of principles) {
    const result = principle.detect(position, move);
    
    if (result.applies) {
      principleResults.push({ ...result, code: principle.code });
      
      if (result.satisfied) {
        satisfiedPrinciples.push(principle.code);
      } else if (principle.type === 'O' && !result.satisfied) {
        violatedPrinciples.push(principle.code);
      }
    }
  }
  
  // Detect tactical patterns
  const tacticalPatterns: TacticalResult[] = [];
  for (const detector of tacticalDetectors) {
    const result = detector.detect(position, move);
    if (result) {
      tacticalPatterns.push(result);
    }
  }
  
  // Calculate scores
  const principleScore = principleResults.reduce((sum, r) => sum + r.score, 0);
  const tacticalScore = tacticalPatterns.reduce((sum, t) => sum + t.score, 0);
  const totalKrogScore = principleScore + tacticalScore;
  
  // Generate formula
  const formulas: string[] = [];
  if (satisfiedPrinciples.length > 0) {
    formulas.push(`satisfies(${satisfiedPrinciples.join(', ')})`);
  }
  if (tacticalPatterns.length > 0) {
    formulas.push(tacticalPatterns.map(t => t.krogFormula).join(' ∧ '));
  }
  const krogFormula = formulas.join(' ∧ ') || 'neutral_move';
  
  // Generate explanation
  const explanation = generateExplanation(principleResults, tacticalPatterns);
  
  return {
    move: move.san,
    principleResults,
    satisfiedPrinciples,
    violatedPrinciples,
    tacticalPatterns,
    principleScore,
    tacticalScore,
    totalKrogScore,
    krogFormula,
    explanation
  };
}
```

---

## 7.5 Combined Move Scoring Algorithm

### 7.5.1 The Master Formula

```typescript
interface MoveScore {
  move: string;
  
  // Component scores (all normalized 0-1)
  statisticalScore: number;   // From win rate data
  engineScore: number;        // From engine evaluation
  krogScore: number;          // From KROG analysis
  
  // Combined score
  totalScore: number;
  
  // Confidence
  confidence: number;         // How reliable is this score?
  
  // Full analysis
  analysis: {
    statistics: MoveStatistics;
    engine: EngineAnalysis;
    krog: KROGMoveAnalysis;
  };
}

interface ScoringWeights {
  statistical: number;  // α
  engine: number;       // β  
  krog: number;         // γ
}

// Default weights by context
const weights: Record<string, ScoringWeights> = {
  // For learning/teaching - KROG explanations matter most
  learning: { statistical: 0.2, engine: 0.3, krog: 0.5 },
  
  // For competitive play - engine accuracy matters most
  competitive: { statistical: 0.2, engine: 0.6, krog: 0.2 },
  
  // For analysis - balanced
  analysis: { statistical: 0.33, engine: 0.34, krog: 0.33 },
  
  // Opening phase - statistics matter most (theory)
  opening: { statistical: 0.5, engine: 0.25, krog: 0.25 },
  
  // Endgame - engine precision matters most
  endgame: { statistical: 0.15, engine: 0.65, krog: 0.2 }
};

function calculateMoveScore(
  position: Position,
  move: Move,
  statistics: MoveStatistics | null,
  engineEval: EngineAnalysis,
  krogAnalysis: KROGMoveAnalysis,
  context: string = 'analysis'
): MoveScore {
  const w = weights[context];
  
  // Normalize statistical score (0-1)
  // Win rate already 0-1, adjust by game count confidence
  const statScore = statistics 
    ? normalizeStatisticalScore(statistics)
    : 0.5;  // Neutral if no data
  
  // Normalize engine score (centipawns to 0-1)
  // Using sigmoid: 1 / (1 + e^(-cp/100))
  const engScore = 1 / (1 + Math.exp(-engineEval.centipawns / 100));
  
  // Normalize KROG score (-200 to +200 → 0-1)
  const krogNorm = (krogAnalysis.totalKrogScore + 200) / 400;
  const krogScoreNorm = Math.max(0, Math.min(1, krogNorm));
  
  // Weighted combination
  const totalScore = 
    w.statistical * statScore +
    w.engine * engScore +
    w.krog * krogScoreNorm;
  
  // Confidence based on data availability
  const confidence = calculateConfidence(statistics, engineEval);
  
  return {
    move: move.san,
    statisticalScore: statScore,
    engineScore: engScore,
    krogScore: krogScoreNorm,
    totalScore,
    confidence,
    analysis: {
      statistics,
      engine: engineEval,
      krog: krogAnalysis
    }
  };
}

function normalizeStatisticalScore(stats: MoveStatistics): number {
  // Bayesian adjusted win rate
  const winRate = bayesianAdjustedWinRate(stats);
  
  // Weight by sample size (more games = more reliable)
  const sampleWeight = Math.min(1, stats.timesPlayed / 1000);
  
  // Blend with neutral 0.5 based on sample size
  return winRate * sampleWeight + 0.5 * (1 - sampleWeight);
}

function calculateConfidence(
  stats: MoveStatistics | null,
  engine: EngineAnalysis
): number {
  let confidence = 0;
  
  // Statistical confidence from game count
  if (stats) {
    confidence += Math.min(0.4, stats.timesPlayed / 2500);  // Max 0.4 from stats
  }
  
  // Engine confidence from depth
  confidence += Math.min(0.4, engine.depth / 30);  // Max 0.4 from engine
  
  // Book moves get bonus confidence
  if (stats?.isBookMove) {
    confidence += 0.2;
  }
  
  return Math.min(1, confidence);
}
```

### 7.5.2 Move Ranking and Suggestion

```typescript
interface MoveSuggestion {
  move: string;
  score: MoveScore;
  rank: number;
  
  // Classification
  classification: 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  
  // Recommendation
  recommended: boolean;
  reasonForRecommendation: string;
  
  // Teaching info
  teachingPoints: string[];
}

async function suggestMoves(
  position: Position,
  playerElo: number,
  context: string = 'learning',
  limit: number = 5
): Promise<MoveSuggestion[]> {
  const legalMoves = position.legalMoves();
  const scores: MoveScore[] = [];
  
  // Score all legal moves
  for (const move of legalMoves) {
    const stats = await getMoveStatistics(position, move, playerElo);
    const engine = await getEngineEvaluation(position, move);
    const krog = await analyzeMove(position, move, getAllPrinciples());
    
    const score = calculateMoveScore(position, move, stats, engine, krog, context);
    scores.push(score);
  }
  
  // Sort by total score
  scores.sort((a, b) => b.totalScore - a.totalScore);
  
  // Classify and create suggestions
  const bestScore = scores[0].totalScore;
  const suggestions: MoveSuggestion[] = [];
  
  for (let i = 0; i < Math.min(limit, scores.length); i++) {
    const score = scores[i];
    const diff = bestScore - score.totalScore;
    
    const classification = classifyMove(diff);
    const teachingPoints = generateTeachingPoints(score, i === 0);
    
    suggestions.push({
      move: score.move,
      score,
      rank: i + 1,
      classification,
      recommended: i === 0 || diff < 0.05,
      reasonForRecommendation: i === 0 
        ? generateBestMoveReason(score)
        : `Also strong: ${score.analysis.krog.explanation.en}`,
      teachingPoints
    });
  }
  
  return suggestions;
}

function classifyMove(scoreDifference: number): string {
  if (scoreDifference < 0.02) return 'best';
  if (scoreDifference < 0.05) return 'excellent';
  if (scoreDifference < 0.10) return 'good';
  if (scoreDifference < 0.20) return 'inaccuracy';
  if (scoreDifference < 0.35) return 'mistake';
  return 'blunder';
}

function generateBestMoveReason(score: MoveScore): string {
  const reasons: string[] = [];
  const krog = score.analysis.krog;
  
  // Add principle-based reasons
  if (krog.satisfiedPrinciples.includes('control_center')) {
    reasons.push('Controls the center');
  }
  if (krog.satisfiedPrinciples.includes('develop_pieces')) {
    reasons.push('Develops a piece');
  }
  if (krog.satisfiedPrinciples.includes('king_safety')) {
    reasons.push('Improves king safety');
  }
  
  // Add tactical reasons
  for (const tactic of krog.tacticalPatterns) {
    reasons.push(tactic.explanation);
  }
  
  // Add statistical reason if strong
  if (score.statisticalScore > 0.6) {
    const winPct = Math.round(score.statisticalScore * 100);
    reasons.push(`${winPct}% win rate in master games`);
  }
  
  return reasons.slice(0, 3).join('. ') || 'Objectively strongest continuation';
}
```

---

## 7.6 API Endpoints

### 7.6.1 REST API

```typescript
// GET /api/v1/position/analyze
interface PositionAnalyzeRequest {
  fen: string;
  playerElo?: number;
  context?: 'learning' | 'competitive' | 'analysis';
  includeEngine?: boolean;
  engineDepth?: number;
}

interface PositionAnalyzeResponse {
  position: {
    fen: string;
    phase: 'opening' | 'middlegame' | 'endgame';
    sideToMove: 'white' | 'black';
  };
  
  statistics: {
    totalGames: number;
    whiteWinRate: number;
    drawRate: number;
    blackWinRate: number;
    byElo?: Record<string, WinRates>;
  };
  
  evaluation: {
    centipawns: number;
    mate?: number;
    depth: number;
    bestLine: string[];
  };
  
  krog: {
    activePrinciples: string[];
    positionalFactors: string[];
    threats: string[];
  };
  
  opening?: {
    eco: string;
    name: string;
    variation?: string;
  };
}

// GET /api/v1/position/moves
interface MovesRequest {
  fen: string;
  playerElo?: number;
  context?: string;
  limit?: number;
}

interface MovesResponse {
  moves: MoveSuggestion[];
  bestMove: string;
  totalLegalMoves: number;
}

// GET /api/v1/move/analyze
interface MoveAnalyzeRequest {
  fen: string;
  move: string;         // UCI or SAN
  playerElo?: number;
}

interface MoveAnalyzeResponse {
  move: string;
  moveSan: string;
  
  score: MoveScore;
  classification: string;
  
  statistics: MoveStatistics | null;
  engine: EngineAnalysis;
  krog: KROGMoveAnalysis;
  
  explanation: {
    en: string;
    no: string;
  };
  
  alternatives: Array<{
    move: string;
    score: number;
    reason: string;
  }>;
}

// POST /api/v1/game/record
interface RecordGameRequest {
  pgn?: string;
  moves: string[];
  result: '1-0' | '0-1' | '1/2-1/2';
  whiteElo?: number;
  blackElo?: number;
  timeControl?: string;
}

interface RecordGameResponse {
  gameId: string;
  positionsRecorded: number;
  movesRecorded: number;
}
```

### 7.6.2 WebSocket API for Real-time Analysis

```typescript
// Client -> Server
interface AnalysisRequest {
  type: 'analyze';
  fen: string;
  options: {
    depth?: number;
    multiPv?: number;
    includeKrog?: boolean;
  };
}

// Server -> Client
interface AnalysisUpdate {
  type: 'analysis';
  fen: string;
  depth: number;
  evaluation: number;
  bestMove: string;
  pv: string[];
  krog?: KROGMoveAnalysis;
}

// Server -> Client (final)
interface AnalysisComplete {
  type: 'analysis_complete';
  fen: string;
  fullAnalysis: MoveAnalyzeResponse;
}
```

---

## 7.7 Data Ingestion Pipeline

### 7.7.1 Game Import

```typescript
interface GameImporter {
  // Import from PGN file
  importPgn(pgnContent: string): Promise<ImportResult>;
  
  // Import from Lichess API
  importFromLichess(username: string, options: LichessOptions): Promise<ImportResult>;
  
  // Import from Chess.com API
  importFromChessCom(username: string, options: ChessComOptions): Promise<ImportResult>;
}

interface ImportResult {
  gamesProcessed: number;
  gamesImported: number;
  positionsUpdated: number;
  movesUpdated: number;
  errors: string[];
}

async function processGame(game: ParsedGame): Promise<void> {
  const chess = new Chess();
  
  for (const move of game.moves) {
    // Get current position hash
    const fen = chess.fen();
    const fenPosition = extractPositionFen(fen);
    const fenHash = zobristHash(fenPosition);
    
    // Upsert position
    const positionId = await upsertPosition(fenPosition, fenHash, game.result, game.whiteElo, game.blackElo);
    
    // Upsert move statistics
    await upsertMoveStatistics(positionId, move, game.result, game.whiteElo, game.blackElo);
    
    // Make move
    chess.move(move);
  }
}

async function upsertPosition(
  fenPosition: string,
  fenHash: bigint,
  result: string,
  whiteElo: number,
  blackElo: number
): Promise<bigint> {
  const avgElo = Math.round((whiteElo + blackElo) / 2);
  const eloBand = getEloBand(avgElo);
  
  const query = `
    INSERT INTO positions (fen_position, fen_hash, total_games, white_wins, draws, black_wins, stats_by_elo)
    VALUES ($1, $2, 1, $3, $4, $5, $6)
    ON CONFLICT (fen_hash, fen_position) DO UPDATE SET
      total_games = positions.total_games + 1,
      white_wins = positions.white_wins + $3,
      draws = positions.draws + $4,
      black_wins = positions.black_wins + $5,
      stats_by_elo = update_elo_stats(positions.stats_by_elo, $7, $3, $4, $5),
      last_seen = NOW()
    RETURNING id
  `;
  
  const whiteWin = result === '1-0' ? 1 : 0;
  const draw = result === '1/2-1/2' ? 1 : 0;
  const blackWin = result === '0-1' ? 1 : 0;
  
  // ... execute query
}
```

### 7.7.2 Engine Analysis Background Job

```typescript
interface EngineAnalysisJob {
  // Analyze positions without engine evaluation
  analyzeUnanalyzed(batchSize: number, depth: number): Promise<number>;
  
  // Re-analyze popular positions at higher depth
  deepAnalyzePopular(minGames: number, depth: number): Promise<number>;
}

async function analyzePositionBatch(
  positions: Position[],
  depth: number
): Promise<void> {
  const engine = await initStockfish();
  
  for (const position of positions) {
    const analysis = await engine.analyze(position.fen, depth);
    
    await db.query(`
      UPDATE positions
      SET 
        engine_eval = $1,
        engine_depth = $2,
        eval_updated_at = NOW()
      WHERE id = $3
    `, [analysis.score, depth, position.id]);
    
    // Also update KROG analysis
    const krogAnalysis = await generateKrogAnalysis(position.fen);
    await db.query(`
      UPDATE positions
      SET krog_analysis = $1
      WHERE id = $2
    `, [JSON.stringify(krogAnalysis), position.id]);
  }
  
  await engine.quit();
}
```

---

## 7.8 Implementation Checklist

```
Phase 7 Implementation:

[ ] 7.1 Database Setup
    [ ] Create PostgreSQL schema
    [ ] Set up indexes
    [ ] Create materialized views
    [ ] Seed KROG principles

[ ] 7.2 Data Ingestion
    [ ] PGN parser
    [ ] Position hasher (Zobrist)
    [ ] Game recorder
    [ ] Lichess importer
    [ ] Chess.com importer
    [ ] Background analysis job

[ ] 7.3 Statistical Model
    [ ] Win probability calculator
    [ ] ELO-weighted statistics
    [ ] Bayesian adjustment
    [ ] Move statistics queries

[ ] 7.4 KROG Evaluator
    [ ] Principle detection functions
    [ ] Tactical pattern detectors
    [ ] Position analyzer
    [ ] Explanation generator

[ ] 7.5 Scoring Algorithm
    [ ] Score normalizers
    [ ] Weight configuration
    [ ] Combined scorer
    [ ] Move ranker

[ ] 7.6 API Layer
    [ ] REST endpoints
    [ ] WebSocket analysis
    [ ] Rate limiting
    [ ] Caching layer

[ ] 7.7 Engine Integration
    [ ] Stockfish WASM
    [ ] Analysis queue
    [ ] Depth management

[ ] 7.8 Testing
    [ ] Unit tests for KROG principles
    [ ] Integration tests for API
    [ ] Benchmark scoring accuracy
```

---

## 7.9 Summary

Phase 7 provides the mathematical foundation for KROG Chess's intelligent move evaluation:

1. **Database Schema**: Efficiently stores millions of positions and moves with statistics segmented by ELO band

2. **Statistical Model**: Calculates win probabilities using Bayesian-adjusted historical data

3. **KROG Evaluation**: Formalizes chess principles and tactics into computable scores with explanations

4. **Combined Scoring**: Merges statistics, engine evaluation, and KROG analysis with configurable weights

5. **API Layer**: Exposes analysis through REST and WebSocket for real-time feedback

**The Key Differentiator**: While other platforms tell you "this is the best move," KROG Chess tells you WHY using formal logic that's both mathematically rigorous and human-understandable.

```
Traditional: Nf3 (+0.25)
KROG:        Nf3 (+0.25)
             ├── O(develop_pieces) ✓ Develops knight
             ├── O(control_center) ✓ Controls d4, e5  
             ├── P(castle) ✓ Enables kingside castling
             └── 58% win rate in 142,000 master games
```

Total specification: ~1500 lines covering the complete move evaluation system.
