# KROG Chess Phase 2: Features & Systems

## Overview

This document formalizes the extended chess game features using KROG universal rules:
1. **Matchmaking** - Player pairing and room management
2. **Rating System** - ELO calculation and skill tracking
3. **Tournament System** - Competition formats and management
4. **Theme Customization** - Visual personalization
5. **PGN Import/Export** - Game portability
6. **Arbiter System** - Dispute resolution and rule enforcement

**Namespace**: `https://krog-rules.org/chess/`

---

## 1. Matchmaking System

### 1.1 Room Management

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          ROOM MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

room_system:
  iri: "https://krog-rules.org/chess/room"
  
  room_types:
    public:
      iri: "https://krog-rules.org/chess/room-public"
      t_type: T1  # Anyone can join
      discoverable: true
      max_spectators: 100
      formal: "P(any_player, join_public_room)"
    
    private:
      iri: "https://krog-rules.org/chess/room-private"
      t_type: T2  # Requires code
      discoverable: false
      max_spectators: 10
      formal: "P(player, join_private_room) ↔ has_code(player)"
    
    rated:
      iri: "https://krog-rules.org/chess/room-rated"
      t_type: T3  # Must complete game
      discoverable: true
      requirements:
        - registered_account: true
        - rating_range: "±300 ELO"
      formal: "P(join_rated) ↔ (registered ∧ within_rating_range)"
    
    casual:
      iri: "https://krog-rules.org/chess/room-casual"
      t_type: T1  # Full discretion
      discoverable: true
      formal: "P(any_player, join_casual)"

  room_codes:
    format: "[A-Z0-9]{6}"  # e.g., "ABC123"
    expiry: "24 hours after creation or game end"
    uniqueness: "globally unique while active"
    
  room_settings:
    time_control:
      type: ["bullet", "blitz", "rapid", "classical", "correspondence", "unlimited"]
      preset_times:
        bullet: { initial: 60000, increment: 0 }      # 1+0
        bullet_increment: { initial: 60000, increment: 1000 }  # 1+1
        blitz: { initial: 180000, increment: 0 }      # 3+0
        blitz_increment: { initial: 180000, increment: 2000 }  # 3+2
        rapid: { initial: 600000, increment: 0 }      # 10+0
        rapid_increment: { initial: 600000, increment: 5000 }  # 10+5
        classical: { initial: 1800000, increment: 0 } # 30+0
        correspondence: { initial: 86400000, increment: 0 }  # 24h per move
        unlimited: { initial: null, increment: null }
    
    color_assignment: ["random", "first_join", "choice", "alternating"]
    rated: boolean
    allow_spectators: boolean
    allow_chat: boolean
    allow_takeback: boolean
```

### 1.2 Matchmaking Queue

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          MATCHMAKING QUEUE
# ═══════════════════════════════════════════════════════════════════════════

matchmaking:
  iri: "https://krog-rules.org/chess/matchmaking"
  
  queue_entry:
    player_id: string
    rating: number
    time_control: TimeControlType
    joined_at: timestamp
    rating_range: { min: number, max: number }
    expand_rate: "±50 ELO per 30 seconds"
  
  matching_algorithm:
    iri: "https://krog-rules.org/chess/matching-algorithm"
    t_type: T5  # Must find match
    
    criteria:
      - rating_difference: "minimize |ELO_A - ELO_B|"
      - time_control: "exact match required"
      - wait_time: "balance fairness vs speed"
    
    formula: |
      match_score(A, B) = 
        w₁ × (1 - |rating_A - rating_B| / 500) +
        w₂ × (1 - max(wait_A, wait_B) / 300) +
        w₃ × same_time_control(A, B)
    
    constraints:
      - max_rating_diff: 500
      - max_wait_time: 300  # seconds
      - min_games_for_rated: 10  # provisional period
    
    expanding_search:
      initial_range: "±100 ELO"
      expansion_rate: "±25 ELO per 15 seconds"
      max_range: "±500 ELO"
  
  queue_states:
    searching:
      formal: "in_queue ∧ ¬matched"
      ui: "Searching for opponent..."
    
    matched:
      formal: "found_opponent ∧ ¬game_started"
      ui: "Opponent found! Starting game..."
      timeout: 10000  # ms to accept
    
    cancelled:
      formal: "¬in_queue ∧ ¬matched"
      triggers: ["user_cancel", "disconnect", "timeout"]
```

### 1.3 Matchmaking Events

```typescript
// Socket Events for Matchmaking
interface MatchmakingEvents {
  // Client → Server
  'queue_join': { timeControl: TimeControlType; rated: boolean };
  'queue_leave': {};
  'match_accept': { matchId: string };
  'match_decline': { matchId: string };
  
  // Server → Client
  'queue_status': { position: number; estimatedWait: number };
  'match_found': { matchId: string; opponent: OpponentInfo; timeControl: TimeControl };
  'match_ready': { roomId: string; color: Color };
  'match_cancelled': { reason: string };
}

interface OpponentInfo {
  username: string;
  rating: number;
  games_played: number;
  country?: string;
  title?: string;  // GM, IM, FM, etc.
}
```

---

## 2. Rating System

### 2.1 ELO Calculation

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          ELO RATING SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

rating_system:
  iri: "https://krog-rules.org/chess/rating"
  algorithm: "Modified ELO with K-factor adjustment"
  
  constants:
    default_rating: 1500
    min_rating: 100
    max_rating: 3500
    provisional_games: 10
  
  k_factor:
    iri: "https://krog-rules.org/chess/k-factor"
    description: "Rating volatility factor"
    
    calculation:
      provisional: 40      # First 10 games
      beginner: 32         # Rating < 1200
      intermediate: 24     # 1200 ≤ Rating < 2000
      advanced: 16         # 2000 ≤ Rating < 2400
      expert: 10           # Rating ≥ 2400
    
    formula: |
      K = 
        40  if games_played < 10
        32  if rating < 1200
        24  if rating < 2000
        16  if rating < 2400
        10  otherwise
  
  expected_score:
    iri: "https://krog-rules.org/chess/expected-score"
    formula: "E_A = 1 / (1 + 10^((R_B - R_A) / 400))"
    description: "Probability of player A winning against player B"
    
    examples:
      - { rating_a: 1500, rating_b: 1500, expected: 0.5 }
      - { rating_a: 1600, rating_b: 1400, expected: 0.76 }
      - { rating_a: 1400, rating_b: 1600, expected: 0.24 }
      - { rating_a: 2000, rating_b: 1500, expected: 0.95 }
  
  rating_change:
    iri: "https://krog-rules.org/chess/rating-change"
    formula: "ΔR = K × (S - E)"
    where:
      K: "K-factor based on player level"
      S: "Actual score (1=win, 0.5=draw, 0=loss)"
      E: "Expected score"
    
    examples:
      - scenario: "1500 beats 1500"
        winner_delta: "+16"  # K=32, S=1, E=0.5 → 32×(1-0.5)=16
        loser_delta: "-16"
      
      - scenario: "1400 beats 1600 (upset)"
        winner_delta: "+24"  # K=32, S=1, E=0.24 → 32×(1-0.24)=24
        loser_delta: "-19"   # K=24, S=0, E=0.76 → 24×(0-0.76)=-18
      
      - scenario: "1500 draws 1500"
        both_delta: "0"      # K=32, S=0.5, E=0.5 → 32×(0.5-0.5)=0

  rating_floors:
    description: "Minimum ratings that can't be lost below"
    levels:
      - { threshold: 2200, floor: 2000 }  # Once you reach 2200, can't drop below 2000
      - { threshold: 1900, floor: 1800 }
      - { threshold: 1600, floor: 1500 }
```

### 2.2 Rating Categories

```yaml
rating_categories:
  iri: "https://krog-rules.org/chess/rating-categories"
  
  categories:
    beginner:
      range: [100, 1000]
      icon: "🌱"
      name: { en: "Beginner", no: "Nybegynner" }
    
    casual:
      range: [1000, 1200]
      icon: "♟️"
      name: { en: "Casual", no: "Hobby" }
    
    club:
      range: [1200, 1400]
      icon: "♞"
      name: { en: "Club Player", no: "Klubbspiller" }
    
    intermediate:
      range: [1400, 1600]
      icon: "♝"
      name: { en: "Intermediate", no: "Viderekommen" }
    
    advanced:
      range: [1600, 1800]
      icon: "♜"
      name: { en: "Advanced", no: "Avansert" }
    
    expert:
      range: [1800, 2000]
      icon: "♛"
      name: { en: "Expert", no: "Ekspert" }
    
    candidate_master:
      range: [2000, 2200]
      icon: "🏅"
      name: { en: "Candidate Master", no: "Kandidatmester" }
      title_abbr: "CM"
    
    master:
      range: [2200, 2400]
      icon: "🥇"
      name: { en: "National Master", no: "Nasjonal Mester" }
      title_abbr: "NM"
    
    international_master:
      range: [2400, 2500]
      icon: "🏆"
      name: { en: "International Master", no: "Internasjonal Mester" }
      title_abbr: "IM"
    
    grandmaster:
      range: [2500, 3500]
      icon: "👑"
      name: { en: "Grandmaster", no: "Stormester" }
      title_abbr: "GM"

  separate_ratings:
    description: "Track ratings per time control"
    pools:
      - bullet    # < 3 minutes
      - blitz     # 3-10 minutes
      - rapid     # 10-30 minutes
      - classical # > 30 minutes
```

### 2.3 Rating TypeScript Interface

```typescript
interface PlayerRating {
  playerId: string;
  ratings: {
    bullet: RatingData;
    blitz: RatingData;
    rapid: RatingData;
    classical: RatingData;
    overall: RatingData;  // Weighted average
  };
  provisional: boolean;  // < 10 games
  gamesPlayed: number;
  highestRating: number;
  highestRatingDate: Date;
}

interface RatingData {
  current: number;
  peak: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  lastUpdated: Date;
  history: RatingHistoryEntry[];
}

interface RatingHistoryEntry {
  rating: number;
  change: number;
  opponent: string;
  opponentRating: number;
  result: 'win' | 'loss' | 'draw';
  gameId: string;
  timestamp: Date;
}

// ELO Calculation Functions
function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calculateKFactor(rating: number, gamesPlayed: number): number {
  if (gamesPlayed < 10) return 40;
  if (rating < 1200) return 32;
  if (rating < 2000) return 24;
  if (rating < 2400) return 16;
  return 10;
}

function calculateRatingChange(
  playerRating: number,
  opponentRating: number,
  score: 0 | 0.5 | 1,
  gamesPlayed: number
): number {
  const K = calculateKFactor(playerRating, gamesPlayed);
  const E = calculateExpectedScore(playerRating, opponentRating);
  return Math.round(K * (score - E));
}
```

---

## 3. Tournament System

### 3.1 Tournament Formats

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          TOURNAMENT FORMATS
# ═══════════════════════════════════════════════════════════════════════════

tournament_formats:
  iri: "https://krog-rules.org/chess/tournament-formats"
  
  swiss:
    iri: "https://krog-rules.org/chess/swiss"
    description: "Pair players with similar scores each round"
    t_type: T5  # System must pair correctly
    
    rules:
      - no_repeat_opponents: "¬(paired(A,B) ∧ previously_played(A,B))"
      - similar_scores: "minimize |score_A - score_B|"
      - color_balance: "alternate colors where possible"
      - top_half_vs_bottom_half: "top scorers play each other"
    
    pairing_algorithm: "Dutch system (FIDE recommended)"
    rounds: "ceil(log2(players)) + 1"
    
    tiebreaks:
      - buchholz: "Sum of opponents' scores"
      - sonneborn_berger: "Sum of beaten opponents' scores + half of drawn"
      - progressive: "Cumulative score after each round"
      - direct_encounter: "Head-to-head result"
  
  round_robin:
    iri: "https://krog-rules.org/chess/round-robin"
    description: "Everyone plays everyone"
    t_type: T5
    
    formula: "rounds = n - 1 (where n = number of players)"
    games_per_player: "n - 1"
    total_games: "n × (n-1) / 2"
    
    variations:
      single: "Each pair plays once"
      double: "Each pair plays twice (white and black)"
    
    constraints:
      max_players: 20  # Beyond this, use Swiss
      min_players: 4
  
  elimination:
    iri: "https://krog-rules.org/chess/elimination"
    description: "Single or double elimination bracket"
    t_type: T5
    
    types:
      single:
        description: "One loss and you're out"
        rounds: "ceil(log2(players))"
        total_games: "n - 1"
      
      double:
        description: "Two losses to eliminate"
        structure: "Winners bracket + Losers bracket"
        total_games: "2n - 2 to 2n - 1"
    
    seeding:
      methods: ["rating", "random", "manual"]
      bye_rules: "Higher seeds get byes in incomplete brackets"
  
  arena:
    iri: "https://krog-rules.org/chess/arena"
    description: "Continuous play within time window"
    t_type: T1  # Players join/leave freely
    
    scoring:
      win: 2
      draw: 1
      loss: 0
      berserk_win: 3  # If player halves their time
    
    pairing: "Immediate re-pairing after game ends"
    duration: "Fixed time (e.g., 60 minutes, 2 hours)"
    
    streak_bonus:
      description: "Bonus points for consecutive wins"
      formula: "streak >= 2 → +1 point per win"
```

### 3.2 Tournament Management

```yaml
tournament_management:
  iri: "https://krog-rules.org/chess/tournament-management"
  
  lifecycle:
    created:
      description: "Tournament announced, registration open"
      duration: "Until start time or max players"
    
    registration_closed:
      description: "No more sign-ups"
      triggers: ["start_time", "max_players", "manual_close"]
    
    in_progress:
      description: "Rounds being played"
      substates: ["round_pairing", "round_playing", "round_complete"]
    
    completed:
      description: "All rounds finished"
      final_actions: ["calculate_standings", "award_prizes", "update_ratings"]
    
    cancelled:
      description: "Tournament cancelled"
      reasons: ["insufficient_players", "organizer_decision", "technical_issues"]
  
  organizer:
    t_type: T5  # Must manage tournament
    permissions:
      - create_tournament
      - set_rules
      - manage_players
      - start_rounds
      - resolve_disputes
      - assign_prizes
    
    obligations:
      - "O(start_on_time)"
      - "O(fair_pairing)"
      - "O(update_standings)"
  
  player_obligations:
    - "O(be_present_when_paired)"
    - "O(complete_game_in_time)"
    - "F(withdraw_mid_tournament)"  # Forfeit remaining games
  
  prizes:
    types:
      - position_based: "1st, 2nd, 3rd place"
      - category_based: "Best under-1400, Best under-1800"
      - special: "Best game, Longest game, Most upsets"
```

### 3.3 Tournament TypeScript Interface

```typescript
interface Tournament {
  id: string;
  name: string;
  format: 'swiss' | 'round_robin' | 'elimination' | 'arena';
  timeControl: TimeControl;
  rated: boolean;
  
  settings: TournamentSettings;
  state: TournamentState;
  
  organizer: string;
  players: TournamentPlayer[];
  rounds: TournamentRound[];
  
  startTime: Date;
  endTime?: Date;
  
  prizes?: Prize[];
}

interface TournamentSettings {
  maxPlayers: number;
  minPlayers: number;
  roundCount?: number;  // For Swiss
  ratingRestriction?: { min: number; max: number };
  registrationDeadline: Date;
}

type TournamentState = 
  | 'created' 
  | 'registration_open' 
  | 'registration_closed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

interface TournamentPlayer {
  playerId: string;
  username: string;
  rating: number;
  score: number;
  tiebreak1: number;  // Buchholz
  tiebreak2: number;  // Sonneborn-Berger
  gamesPlayed: number;
  withdrawn: boolean;
}

interface TournamentRound {
  roundNumber: number;
  pairings: Pairing[];
  state: 'pending' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}

interface Pairing {
  white: string;  // playerId
  black: string;  // playerId
  gameId?: string;
  result?: '1-0' | '0-1' | '1/2-1/2' | '*';  // * = in progress
  board: number;  // Board number for display
}
```

---

## 4. Theme Customization

### 4.1 Theme System

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          THEME SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

theme_system:
  iri: "https://krog-rules.org/chess/themes"
  t_type: T1  # Full user discretion
  
  components:
    board_colors:
      light_square: string  # Hex color
      dark_square: string
      selected: string
      legal_move: string
      last_move: string
      check: string
    
    piece_style:
      set: ["classic", "modern", "pixel", "minimal", "cute"]
      custom_url: string  # User-uploaded SVGs
    
    ui_colors:
      background: string
      surface: string
      text_primary: string
      text_secondary: string
      accent: string
      error: string
      success: string
    
    font:
      family: string
      size_scale: number  # 1.0 = default
    
    animations:
      enabled: boolean
      speed: ["slow", "normal", "fast", "instant"]
    
    sounds:
      enabled: boolean
      volume: number  # 0-1
      pack: ["classic", "modern", "silent"]
```

### 4.2 Preset Themes

```yaml
preset_themes:
  iri: "https://krog-rules.org/chess/preset-themes"
  
  classic:
    name: { en: "Classic Wood", no: "Klassisk Tre" }
    description: "Traditional tournament board"
    board:
      light: "#F0D9B5"
      dark: "#B58863"
    ui:
      background: "#1a1a1a"
      surface: "#2d2d2d"
      text_primary: "#ffffff"
      accent: "#7FA650"
  
  midnight:
    name: { en: "Midnight Blue", no: "Midnattsblå" }
    description: "Dark mode for night play"
    board:
      light: "#9DB2BF"
      dark: "#27374D"
    ui:
      background: "#0F0F0F"
      surface: "#1A1A2E"
      text_primary: "#E0E0E0"
      accent: "#3498DB"
  
  pink_dreams:
    name: { en: "Pink Dreams", no: "Rosa Drømmer" }
    description: "Soft pink aesthetic"
    target_demographic: "Teen girls, kawaii fans"
    board:
      light: "#FFE4EC"
      dark: "#FFB6C1"
    ui:
      background: "#FFF0F5"
      surface: "#FFFFFF"
      text_primary: "#4A4A4A"
      accent: "#FF69B4"
  
  neon_gamer:
    name: { en: "Neon Gamer", no: "Neon Gamer" }
    description: "Cyberpunk gaming aesthetic"
    board:
      light: "#1A1A2E"
      dark: "#0F0F1A"
    ui:
      background: "#000000"
      surface: "#16213E"
      text_primary: "#00FF41"
      accent: "#FF00FF"
  
  forest:
    name: { en: "Forest Green", no: "Skoggrønn" }
    description: "Natural calming green"
    board:
      light: "#EEEED2"
      dark: "#769656"
    ui:
      background: "#1E3A1E"
      surface: "#2D4A2D"
      text_primary: "#E8F5E9"
      accent: "#4CAF50"
  
  ocean:
    name: { en: "Ocean Blue", no: "Havblå" }
    description: "Serene ocean-inspired"
    board:
      light: "#E3F2FD"
      dark: "#5DADE2"
    ui:
      background: "#0D47A1"
      surface: "#1565C0"
      text_primary: "#FFFFFF"
      accent: "#00BCD4"
  
  # Accessibility Themes
  high_contrast:
    name: { en: "High Contrast", no: "Høy Kontrast" }
    description: "WCAG AAA compliant"
    accessibility: true
    board:
      light: "#FFFFFF"
      dark: "#000000"
    ui:
      background: "#000000"
      surface: "#1A1A1A"
      text_primary: "#FFFF00"
      accent: "#00FFFF"
  
  colorblind_safe:
    name: { en: "Colorblind Safe", no: "Fargeblindvennlig" }
    description: "Optimized for deuteranopia"
    accessibility: true
    board:
      light: "#FFE4B5"
      dark: "#4169E1"  # Blue instead of green
    ui:
      background: "#1A1A1A"
      surface: "#2D2D2D"
      text_primary: "#FFFFFF"
      accent: "#FFA500"  # Orange
  
  dyslexia_friendly:
    name: { en: "Dyslexia Friendly", no: "Dysleksivennlig" }
    description: "OpenDyslexic font, cream background"
    accessibility: true
    font:
      family: "OpenDyslexic"
      size_scale: 1.2
    board:
      light: "#FCF8E8"
      dark: "#CEE5D0"
    ui:
      background: "#FDF6E3"
      surface: "#FFFFFF"
      text_primary: "#2E2E2E"
      accent: "#268BD2"
```

### 4.3 Theme TypeScript Interface

```typescript
interface Theme {
  id: string;
  name: { en: string; no: string };
  description: string;
  accessibility?: boolean;
  
  board: BoardColors;
  pieces: PieceStyle;
  ui: UIColors;
  font: FontSettings;
  animations: AnimationSettings;
  sounds: SoundSettings;
}

interface BoardColors {
  lightSquare: string;
  darkSquare: string;
  selectedSquare: string;
  legalMoveHighlight: string;
  lastMoveFrom: string;
  lastMoveTo: string;
  checkHighlight: string;
  coordinates: string;
}

interface UIColors {
  background: string;
  surface: string;
  surfaceHover: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  error: string;
  success: string;
  warning: string;
}

interface PieceStyle {
  set: 'classic' | 'modern' | 'pixel' | 'minimal' | 'cute' | 'custom';
  customUrl?: string;
}

interface FontSettings {
  family: string;
  sizeScale: number;
  monoFamily: string;  // For coordinates, notation
}

interface AnimationSettings {
  enabled: boolean;
  moveDuration: number;  // ms
  captureDuration: number;
  highlightDuration: number;
}

interface SoundSettings {
  enabled: boolean;
  volume: number;
  pack: 'classic' | 'modern' | 'silent';
  sounds: {
    move: string;      // URL
    capture: string;
    check: string;
    castle: string;
    promotion: string;
    gameStart: string;
    gameEnd: string;
    lowTime: string;
  };
}
```

---

## 5. PGN Import/Export

### 5.1 PGN Format Support

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          PGN SUPPORT
# ═══════════════════════════════════════════════════════════════════════════

pgn_support:
  iri: "https://krog-rules.org/chess/pgn"
  standard: "Portable Game Notation (PGN)"
  
  import:
    iri: "https://krog-rules.org/chess/pgn-import"
    t_type: T5  # Must parse correctly
    
    supported_headers:
      required:
        - Event
        - Site
        - Date
        - Round
        - White
        - Black
        - Result
      optional:
        - WhiteElo
        - BlackElo
        - ECO  # Opening code
        - Opening
        - TimeControl
        - Termination
        - Annotator
        - PlyCount
        - FEN  # Starting position if not standard
    
    move_parsing:
      notation: SAN
      comments: "{ comment text }"
      variations: "( alternative line )"
      nags: "$1, $2, etc."  # Numeric Annotation Glyphs
    
    validation:
      - move_legality: "All moves must be legal"
      - result_accuracy: "Result matches final position"
      - header_format: "Dates in YYYY.MM.DD format"
  
  export:
    iri: "https://krog-rules.org/chess/pgn-export"
    t_type: T5  # Must generate valid PGN
    
    options:
      include_comments: boolean
      include_variations: boolean
      include_clock_times: boolean
      include_krog_annotations: boolean  # Unique to our system
    
    formatting:
      line_length: 80
      move_numbers: true
      space_after_number: true
```

### 5.2 PGN Examples

```pgn
[Event "KROG Master Chess Rated Game"]
[Site "krog-chess.app"]
[Date "2025.12.10"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]
[WhiteElo "1523"]
[BlackElo "1487"]
[TimeControl "600+5"]
[ECO "C50"]
[Opening "Italian Game"]
[Termination "Normal"]
[KROGValidation "All moves validated via KROG formal logic"]

1. e4 {T1: P(e4) - full discretion} e5 2. Nf3 {P(Nf3) ↔ O(L_shape)} Nc6 
3. Bc4 {P(Bc4) ↔ O(diagonal ∧ clear_path)} Bc5 4. c3 Nf6 5. d4 exd4 
6. cxd4 Bb4+ 7. Nc3 {Block check: O(escape ∨ block ∨ capture)} Nxe4 
8. O-O {P(O-O) ↔ (¬moved(K) ∧ ¬moved(R) ∧ ¬check ∧ path_clear)} Bxc3 
9. bxc3 d5 10. Ba3 dxc4 11. Re1 Be6 12. Rxe4 Qd5 13. Qe2 O-O-O 
14. Ne5 {Forking attack} Qxe4 15. Qxe4 Nxe5 16. dxe5 Rd1+ 17. Qe1 
Rxe1# {Checkmate: check ∧ ¬∃legal_move → game_over} 0-1
```

### 5.3 PGN TypeScript Interface

```typescript
interface PGNGame {
  headers: PGNHeaders;
  moves: PGNMove[];
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
}

interface PGNHeaders {
  // Required Seven Tag Roster
  Event: string;
  Site: string;
  Date: string;  // YYYY.MM.DD
  Round: string;
  White: string;
  Black: string;
  Result: string;
  
  // Optional
  WhiteElo?: string;
  BlackElo?: string;
  ECO?: string;
  Opening?: string;
  TimeControl?: string;
  Termination?: string;
  FEN?: string;  // If not standard starting position
  
  // KROG-specific
  KROGValidation?: string;
}

interface PGNMove {
  moveNumber: number;
  white?: {
    san: string;
    comment?: string;
    nag?: string[];
    variations?: PGNMove[][];
    clock?: string;  // e.g., "0:05:23"
    krog?: KROGAnnotation;
  };
  black?: {
    san: string;
    comment?: string;
    nag?: string[];
    variations?: PGNMove[][];
    clock?: string;
    krog?: KROGAnnotation;
  };
}

interface KROGAnnotation {
  formula: string;      // "P(Nf3) ↔ O(L_shape)"
  tType: string;        // "T1"
  rTypes: string[];     // ["R14"]
  fideArticle: string;  // "3.5"
  explanation?: {
    en: string;
    no: string;
  };
}

// PGN Parser/Generator Functions
function parsePGN(pgn: string): PGNGame[];
function generatePGN(game: GameSession, options?: PGNExportOptions): string;
function validatePGN(pgn: string): { valid: boolean; errors: string[] };
```

---

## 6. Arbiter System

### 6.1 Arbiter Authority

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          ARBITER SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

arbiter_system:
  iri: "https://krog-rules.org/chess/arbiter"
  
  arbiter:
    iri: "https://krog-rules.org/chess/arbiter-entity"
    t_type: T5  # Must act when required
    formal: "O(arbiter, enforce_rules) ∧ O(arbiter, resolve_disputes)"
    
    types:
      automated:
        description: "AI-powered rule enforcement"
        t_type: T5
        capabilities:
          - move_validation
          - clock_management
          - draw_detection
          - illegal_move_detection
      
      human:
        description: "Human arbiter for tournaments"
        t_type: T3  # Must engage, has discretion
        capabilities:
          - override_automated
          - handle_edge_cases
          - resolve_disputes
          - assign_penalties
  
  authority:
    iri: "https://krog-rules.org/chess/arbiter-authority"
    fide: "Article 12"
    
    powers:
      rule_enforcement: "W(arbiter, enforce_all_rules)"
      dispute_resolution: "W(arbiter, resolve_disputes)"
      penalty_assignment: "W(arbiter, assign_penalties)"
      game_decisions: "W(arbiter, make_final_decisions)"
      time_adjustment: "W(arbiter, adjust_clocks)"
      result_modification: "W(arbiter, modify_result)"
    
    constraints:
      non_interference: "F(interfere_without_rule_basis)"
      neutrality: "O(maintain_absolute_objectivity)"
      documentation: "O(document_all_decisions)"
```

### 6.2 Dispute Types

```yaml
dispute_types:
  iri: "https://krog-rules.org/chess/disputes"
  
  illegal_move:
    iri: "https://krog-rules.org/chess/illegal-move-dispute"
    fide: "7.4"
    
    detection:
      automated: "KROG validation detects violation"
      claimed: "Opponent claims illegal move"
    
    penalties:
      first_offense:
        no: "§7.5.1: Motstanderen får 2 minutter ekstra"
        en: "7.4.1: Opponent gains 2 minutes"
        action: "restore_position_before_illegal"
      second_offense:
        no: "§7.5.5: Partiet dømmes til tap"
        en: "7.4.2: Game declared lost"
        note: "Norwegian=2nd, English=3rd illegal"
    
    krog: "F(illegal_move) ∧ detected → penalty"
  
  time_dispute:
    iri: "https://krog-rules.org/chess/time-dispute"
    fide: "6.9"
    
    types:
      flag_fall: "Clock reaches zero"
      insufficient_material: "Cannot checkmate even with time"
      
    resolutions:
      normal_flag: "Player with time wins"
      insufficient: "Draw regardless of time"
    
    krog: "time_expired ∧ sufficient_material(opponent) → loss"
  
  draw_claim:
    iri: "https://krog-rules.org/chess/draw-claim-dispute"
    
    types:
      threefold_repetition:
        requirement: "position_count ≥ 3"
        verification: "Compare position hashes"
      
      fifty_move:
        requirement: "50 moves without pawn move or capture"
        verification: "Check halfmove counter"
      
      insufficient_material:
        combinations: ["K vs K", "K+B vs K", "K+N vs K"]
        verification: "Enumerate pieces"
    
    krog: "claim_draw(type) ∧ valid(type) → arbiter_confirms"
  
  conduct:
    iri: "https://krog-rules.org/chess/conduct-dispute"
    fide: "11.1-11.5"
    
    violations:
      - electronic_devices: "F(electronic_devices_in_playing_area)"
      - external_assistance: "F(consult_notes ∨ seek_advice)"
      - disturbance: "F(disturb_opponents)"
      - late_arrival: "F(arrive_after_time_threshold)"
    
    penalties:
      - warning
      - time_penalty
      - game_forfeit
      - tournament_expulsion
```

### 6.3 Arbiter TypeScript Interface

```typescript
interface Arbiter {
  id: string;
  type: 'automated' | 'human';
  name?: string;
  permissions: ArbiterPermission[];
}

type ArbiterPermission = 
  | 'validate_moves'
  | 'manage_clock'
  | 'resolve_disputes'
  | 'assign_penalties'
  | 'modify_result'
  | 'override_automated';

interface Dispute {
  id: string;
  gameId: string;
  type: DisputeType;
  claimant: string;  // playerId
  defendant?: string;
  timestamp: Date;
  state: DisputeState;
  evidence: DisputeEvidence;
  resolution?: DisputeResolution;
}

type DisputeType = 
  | 'illegal_move'
  | 'time_dispute'
  | 'draw_claim'
  | 'conduct_violation'
  | 'disconnection'
  | 'other';

type DisputeState = 'pending' | 'reviewing' | 'resolved' | 'appealed';

interface DisputeEvidence {
  positionFen: string;
  moveHistory: string[];
  clockState: { white: number; black: number };
  krogValidation?: KROGValidation;
  screenshots?: string[];
  notes?: string;
}

interface DisputeResolution {
  arbiter: string;
  decision: 'upheld' | 'denied' | 'partial';
  penalty?: Penalty;
  reasoning: string;
  krogReference?: string;  // KROG formula proving decision
  timestamp: Date;
}

interface Penalty {
  type: 'warning' | 'time_penalty' | 'forfeit' | 'expulsion';
  target: string;  // playerId
  details: string;
  timeAdded?: number;  // ms, for time penalties
}

// Arbiter Actions
interface ArbiterAction {
  'validate_illegal_claim': (gameId: string, moveIndex: number) => DisputeResolution;
  'process_draw_claim': (gameId: string, claimType: DrawClaimType) => DisputeResolution;
  'handle_flag_fall': (gameId: string, player: Color) => DisputeResolution;
  'penalize_player': (gameId: string, playerId: string, penalty: Penalty) => void;
  'override_result': (gameId: string, newResult: GameResult, reason: string) => void;
}
```

---

## 7. Implementation Checklist (Phase 2)

### Server Updates Required

- [ ] Matchmaking queue system
- [ ] Room management with codes
- [ ] ELO rating calculation
- [ ] Rating history storage
- [ ] Tournament creation API
- [ ] Swiss pairing algorithm
- [ ] Round-robin scheduling
- [ ] Elimination bracket generation
- [ ] PGN parser/generator
- [ ] Arbiter dispute handling
- [ ] Penalty system

### Client Updates Required

- [ ] Matchmaking UI (queue, status)
- [ ] Rating display and history
- [ ] Tournament browser
- [ ] Tournament lobby
- [ ] Theme picker
- [ ] Custom theme editor
- [ ] PGN import dialog
- [ ] PGN export button
- [ ] Dispute filing UI
- [ ] Arbiter decision display

### Database Schema (New Tables)

```sql
-- Ratings
CREATE TABLE player_ratings (
  player_id UUID PRIMARY KEY,
  bullet_rating INT DEFAULT 1500,
  blitz_rating INT DEFAULT 1500,
  rapid_rating INT DEFAULT 1500,
  classical_rating INT DEFAULT 1500,
  games_played INT DEFAULT 0,
  provisional BOOLEAN DEFAULT TRUE
);

-- Rating History
CREATE TABLE rating_history (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  rating_type VARCHAR(20),
  old_rating INT,
  new_rating INT,
  change INT,
  game_id UUID,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  format VARCHAR(50),
  time_control JSONB,
  settings JSONB,
  state VARCHAR(50),
  organizer_id UUID,
  start_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tournament Players
CREATE TABLE tournament_players (
  tournament_id UUID REFERENCES tournaments(id),
  player_id UUID REFERENCES players(id),
  score DECIMAL(4,1) DEFAULT 0,
  tiebreak1 DECIMAL(6,2) DEFAULT 0,
  tiebreak2 DECIMAL(6,2) DEFAULT 0,
  PRIMARY KEY (tournament_id, player_id)
);

-- Themes
CREATE TABLE user_themes (
  user_id UUID REFERENCES players(id),
  active_theme_id VARCHAR(50),
  custom_themes JSONB,
  PRIMARY KEY (user_id)
);

-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  type VARCHAR(50),
  claimant_id UUID,
  state VARCHAR(50),
  evidence JSONB,
  resolution JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### New Socket Events (Phase 2)

```typescript
// Matchmaking
'queue_join' → { timeControl, rated }
'queue_leave' → {}
'queue_status' → { position, estimatedWait }
'match_found' → { matchId, opponent, timeControl }
'match_ready' → { roomId, color }

// Tournaments
'tournament_join' → { tournamentId }
'tournament_leave' → { tournamentId }
'tournament_update' → Tournament
'round_pairing' → { round, pairings }
'tournament_result' → { standings, prizes }

// Rating
'rating_update' → { ratings, change, history }

// Themes
'theme_change' → { themeId }
'theme_custom' → Theme

// PGN
'pgn_import' → { pgn: string }
'pgn_export' → { gameId }
'pgn_result' → { pgn: string }

// Disputes
'dispute_file' → { gameId, type, evidence }
'dispute_update' → Dispute
'dispute_resolved' → DisputeResolution
```

---

**Phase 2 Complete.** This document provides the formal KROG specification for:
- Matchmaking System
- Rating System (ELO)
- Tournament System
- Theme Customization
- PGN Import/Export
- Arbiter System

Ready for Phase 3: Chess Variants (Fischer 960, Bughouse, etc.) or Implementation?
