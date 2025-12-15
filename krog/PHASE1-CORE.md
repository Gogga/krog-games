# KROG Chess Phase 1: Core Framework

## Overview

This document formalizes the foundational chess game components using KROG universal rules:
1. **Player Identity** - White/black assignment and role enforcement
2. **Game Session** - Lifecycle from creation to completion
3. **Clock Management** - Time controls and forfeit rules

**Namespace**: `https://krog-rules.org/chess/`

---

## 1. Player Identity

### 1.1 Entity Definitions

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                           PLAYER ENTITIES
# ═══════════════════════════════════════════════════════════════════════════

player:
  iri: "https://krog-rules.org/chess/player"
  description: "Any entity capable of making chess moves"
  subtypes:
    - human_player
    - ai_engine
    - ai_agent
    - robot_player

human_player:
  iri: "https://krog-rules.org/chess/human-player"
  t_type: T1
  formal: "P(human EA) ∧ P(human E¬A) ∧ P(human ILA)"
  natural: "Human has full discretion - can move, pass turn (if rules allow), or resign"
  interface: "browser | mobile | physical_board"

ai_engine:
  iri: "https://krog-rules.org/chess/ai-engine"
  t_type: T5
  formal: "O(engine EA)"
  natural: "Engine must respond with move when requested"
  interface: "UCI | custom_protocol"
  examples: ["Stockfish", "Leela Chess Zero", "Komodo"]

ai_agent:
  iri: "https://krog-rules.org/chess/ai-agent"
  t_type: T3
  formal: "P(agent EA) ∧ P(agent E¬A) ∧ O¬(agent ILA)"
  natural: "Agent must engage (cannot ignore), but has discretion in response"
  interface: "LLM_API | MCP"
  examples: ["Claude", "GPT-4", "Gemini"]
  note: "Can discuss, ask questions, make moves - but cannot be passive"

robot_player:
  iri: "https://krog-rules.org/chess/robot-player"
  t_type: T2
  formal: "P(robot EA) ∧ O¬(robot E¬A) ∧ P(robot ILA)"
  natural: "Robot can act or wait, but cannot refuse if commanded"
  interface: "ROS2 | custom_hardware"
  components:
    - vision_system    # T5: Must detect board state
    - motor_control    # T1: Discretion in execution path
    - safety_system    # T7: Must prevent dangerous movements
```

### 1.2 Color Assignment

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          COLOR ASSIGNMENT
# ═══════════════════════════════════════════════════════════════════════════

color_assignment:
  iri: "https://krog-rules.org/chess/color-assignment"
  description: "Maps players to white or black"
  
  white_player:
    iri: "https://krog-rules.org/chess/white-player"
    t_type: T1  # Full discretion within rules
    privileges:
      - first_move: true
      - initial_turn: true
    constraints:
      - can_only_move_white_pieces: "F(white_player, move_black_piece)"
      - must_move_on_white_turn: "white_turn → O(white_player, move ∨ offer_draw ∨ resign)"
  
  black_player:
    iri: "https://krog-rules.org/chess/black-player"
    t_type: T1  # Full discretion within rules
    privileges:
      - responds_to_white: true
    constraints:
      - can_only_move_black_pieces: "F(black_player, move_white_piece)"
      - must_move_on_black_turn: "black_turn → O(black_player, move ∨ offer_draw ∨ resign)"

assignment_methods:
  random:
    iri: "https://krog-rules.org/chess/assignment-random"
    formal: "P≥0.5[white_assigned(player_1)] ∧ P≥0.5[white_assigned(player_2)]"
    natural: "50/50 random assignment"
  
  first_join:
    iri: "https://krog-rules.org/chess/assignment-first-join"
    formal: "join_time(p1) < join_time(p2) → white_assigned(p1)"
    natural: "First player to join gets white"
  
  alternating:
    iri: "https://krog-rules.org/chess/assignment-alternating"
    formal: "game_n_white(p1) → game_n+1_white(p2)"
    natural: "Players alternate colors between games"
  
  choice:
    iri: "https://krog-rules.org/chess/assignment-choice"
    formal: "P(host, choose_color)"
    natural: "Host chooses their color"
```

### 1.3 Player Relationships

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                        PLAYER R-TYPES
# ═══════════════════════════════════════════════════════════════════════════

# White ↔ Black relationship during game
player_opponent:
  iri: "https://krog-rules.org/chess/player-opponent"
  r_type: R3
  structure: "(T₃, T₃)"
  formal: "P(white EA) ∧ P(white E¬A) ∧ O¬(white ILA) ∧ P(black EA) ∧ P(black E¬A) ∧ O¬(black ILA)"
  natural: "Both players must engage (no passivity), but have move discretion"
  note: "Neither player can abandon game without consequence"

# Player ↔ Rule Engine relationship
player_rules:
  iri: "https://krog-rules.org/chess/player-rules"
  r_type: R11
  structure: "(T₁, T₅)"
  formal: "P(player EA) ∧ P(player E¬A) ∧ P(player ILA) ∧ O(engine, validate)"
  natural: "Player has discretion, rule engine must validate every move"

# Player ↔ Spectator relationship
player_spectator:
  iri: "https://krog-rules.org/chess/player-spectator"
  r_type: R12
  structure: "(T₁, T₆)"
  formal: "P(player EA) ∧ P(player E¬A) ∧ P(player ILA) ∧ O(spectator ILA)"
  natural: "Player has full discretion, spectator must be passive"

# Spectator definition
spectator:
  iri: "https://krog-rules.org/chess/spectator"
  t_type: T6
  formal: "O(spectator ILA)"
  natural: "Spectator must remain passive - can observe, cannot interfere"
  permissions:
    - observe_board_state: true
    - view_move_history: true
    - view_clock: true
  prohibitions:
    - suggest_moves: false
    - communicate_with_players: false  # during game
    - modify_game_state: false
```

### 1.4 JSON Schema

```json
{
  "$schema": "https://krog-rules.org/chess/player-identity.schema.json",
  "definitions": {
    "PlayerType": {
      "enum": ["human", "ai_engine", "ai_agent", "robot"]
    },
    "Color": {
      "enum": ["white", "black"]
    },
    "PlayerRole": {
      "enum": ["player", "spectator"]
    },
    "Player": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "type": { "$ref": "#/definitions/PlayerType" },
        "t_type": { "enum": ["T1", "T2", "T3", "T5"] },
        "color": { "$ref": "#/definitions/Color" },
        "role": { "$ref": "#/definitions/PlayerRole" },
        "joined_at": { "type": "string", "format": "date-time" },
        "interface": { "type": "string" }
      },
      "required": ["id", "type", "role"]
    }
  }
}
```

---

## 2. Game Session

### 2.1 Session States

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          SESSION STATES
# ═══════════════════════════════════════════════════════════════════════════

session_states:
  iri: "https://krog-rules.org/chess/session-states"
  
  waiting:
    iri: "https://krog-rules.org/chess/session-waiting"
    description: "Room created, waiting for players"
    entry_condition: "room_created"
    exit_conditions:
      - two_players_joined → active
      - timeout → cancelled
      - host_cancelled → cancelled
    t_type_system: T6  # System passive, waiting
    
  active:
    iri: "https://krog-rules.org/chess/session-active"
    description: "Game in progress"
    entry_condition: "two_players_assigned ∧ colors_assigned"
    exit_conditions:
      - checkmate → completed
      - stalemate → completed
      - draw_agreed → completed
      - resignation → completed
      - time_forfeit → completed
      - disconnect_timeout → paused
      - mutual_pause → paused
    t_type_system: T5  # System must validate moves
    invariants:
      - "G(active → exactly_one_turn)"
      - "G(active → clock_running)"
      - "G(active → board_state_valid)"
  
  paused:
    iri: "https://krog-rules.org/chess/session-paused"
    description: "Game temporarily suspended"
    entry_condition: "active ∧ (disconnect ∨ mutual_pause)"
    exit_conditions:
      - both_players_ready → active
      - pause_timeout → completed  # forfeit
      - mutual_abort → cancelled
    t_type_system: T6  # System passive, waiting
    constraints:
      - "paused → clocks_stopped"
      - "paused → no_moves_allowed"
  
  completed:
    iri: "https://krog-rules.org/chess/session-completed"
    description: "Game finished with result"
    entry_condition: "terminal_condition_reached"
    results:
      white_wins:
        conditions: ["black_checkmated", "black_resigned", "black_time_forfeit"]
        score: { white: 1, black: 0 }
      black_wins:
        conditions: ["white_checkmated", "white_resigned", "white_time_forfeit"]
        score: { white: 0, black: 1 }
      draw:
        conditions: ["stalemate", "draw_agreed", "threefold_repetition", 
                     "fifty_move_rule", "insufficient_material", "dead_position"]
        score: { white: 0.5, black: 0.5 }
    t_type_system: T6  # System passive, final
    invariants:
      - "completed → ¬F(state_change)"  # terminal state
  
  cancelled:
    iri: "https://krog-rules.org/chess/session-cancelled"
    description: "Game aborted without result"
    entry_condition: "waiting ∧ (timeout ∨ host_cancelled) ∨ paused ∧ mutual_abort"
    results: null
    t_type_system: T6  # System passive, final
```

### 2.2 Session Lifecycle (State Machine)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GAME SESSION STATE MACHINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌──────────────┐                                    │
│            create_room  │              │  timeout / host_cancel             │
│          ─────────────► │   WAITING    │ ─────────────────────────┐         │
│                         │    (T₆)      │                          │         │
│                         └──────┬───────┘                          │         │
│                                │                                  │         │
│                    two_players_joined                             │         │
│                    colors_assigned                                │         │
│                                │                                  ▼         │
│                                ▼                          ┌─────────────┐   │
│                         ┌──────────────┐                  │             │   │
│                         │              │                  │  CANCELLED  │   │
│              ┌─────────►│    ACTIVE    │◄────────┐        │    (T₆)     │   │
│              │          │    (T₅)      │         │        │             │   │
│              │          └──────┬───────┘         │        └─────────────┘   │
│              │                 │                 │               ▲          │
│   both_ready │    disconnect   │   checkmate     │               │          │
│              │    mutual_pause │   stalemate     │    mutual     │          │
│              │                 │   resignation   │    abort      │          │
│              │                 │   time_forfeit  │               │          │
│              │                 │   draw_agreed   │               │          │
│              │                 ▼                 │               │          │
│              │          ┌──────────────┐         │               │          │
│              │          │              │─────────┘               │          │
│              └──────────│    PAUSED    │─────────────────────────┘          │
│                         │    (T₆)      │  pause_timeout                     │
│                         └──────┬───────┘         │                          │
│                                │                 │                          │
│                                │                 ▼                          │
│                                │          ┌─────────────┐                   │
│                                └─────────►│             │                   │
│                                           │  COMPLETED  │                   │
│                                           │    (T₆)     │                   │
│                                           │             │                   │
│                                           └─────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Session Events

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          SESSION EVENTS
# ═══════════════════════════════════════════════════════════════════════════

events:
  # ─────────────────────────────────────────────────────────────────────────
  # Room Events
  # ─────────────────────────────────────────────────────────────────────────
  
  room_created:
    iri: "https://krog-rules.org/chess/event/room-created"
    payload:
      room_id: string
      host_id: string
      settings: GameSettings
      created_at: datetime
    triggers: "WAITING state"
  
  player_joined:
    iri: "https://krog-rules.org/chess/event/player-joined"
    payload:
      room_id: string
      player_id: string
      player_type: PlayerType
      joined_at: datetime
    precondition: "state = WAITING ∨ state = PAUSED"
  
  colors_assigned:
    iri: "https://krog-rules.org/chess/event/colors-assigned"
    payload:
      room_id: string
      white_player_id: string
      black_player_id: string
      method: AssignmentMethod
    precondition: "player_count = 2"
    postcondition: "state → ACTIVE"
  
  # ─────────────────────────────────────────────────────────────────────────
  # Game Events
  # ─────────────────────────────────────────────────────────────────────────
  
  move_made:
    iri: "https://krog-rules.org/chess/event/move-made"
    payload:
      room_id: string
      player_id: string
      move: Move  # { from, to, promotion? }
      fen_before: string
      fen_after: string
      san: string
      timestamp: datetime
      time_taken_ms: number
    precondition: "state = ACTIVE ∧ is_player_turn(player_id)"
    postcondition: "turn_switched ∧ clock_switched"
  
  draw_offered:
    iri: "https://krog-rules.org/chess/event/draw-offered"
    payload:
      room_id: string
      offerer_id: string
      timestamp: datetime
    precondition: "state = ACTIVE"
    r_type: R1  # Bilateral discretion - other can accept or decline
  
  draw_accepted:
    iri: "https://krog-rules.org/chess/event/draw-accepted"
    payload:
      room_id: string
      accepter_id: string
      timestamp: datetime
    precondition: "draw_offer_pending"
    postcondition: "state → COMPLETED (draw)"
  
  resignation:
    iri: "https://krog-rules.org/chess/event/resignation"
    payload:
      room_id: string
      resigner_id: string
      timestamp: datetime
    precondition: "state = ACTIVE"
    postcondition: "state → COMPLETED (opponent wins)"
    permission: "P(player, resign)"  # Always permitted
  
  # ─────────────────────────────────────────────────────────────────────────
  # Terminal Events
  # ─────────────────────────────────────────────────────────────────────────
  
  checkmate:
    iri: "https://krog-rules.org/chess/event/checkmate"
    payload:
      room_id: string
      winner_color: Color
      final_fen: string
      timestamp: datetime
    detection: "in_check(king) ∧ ¬∃legal_move"
    postcondition: "state → COMPLETED"
  
  stalemate:
    iri: "https://krog-rules.org/chess/event/stalemate"
    payload:
      room_id: string
      final_fen: string
      timestamp: datetime
    detection: "¬in_check(king) ∧ ¬∃legal_move"
    postcondition: "state → COMPLETED (draw)"
  
  time_forfeit:
    iri: "https://krog-rules.org/chess/event/time-forfeit"
    payload:
      room_id: string
      forfeiter_id: string
      winner_id: string
      timestamp: datetime
    detection: "clock(player) ≤ 0"
    postcondition: "state → COMPLETED (opponent wins)"
    exception: "insufficient_material(opponent) → draw"
```

### 2.4 JSON Schema

```json
{
  "$schema": "https://krog-rules.org/chess/game-session.schema.json",
  "definitions": {
    "SessionState": {
      "enum": ["waiting", "active", "paused", "completed", "cancelled"]
    },
    "GameResult": {
      "type": "object",
      "properties": {
        "winner": { "enum": ["white", "black", null] },
        "reason": { 
          "enum": ["checkmate", "resignation", "time_forfeit", "stalemate",
                   "draw_agreed", "threefold_repetition", "fifty_move_rule",
                   "insufficient_material", "timeout", "abort"]
        },
        "scores": {
          "type": "object",
          "properties": {
            "white": { "type": "number" },
            "black": { "type": "number" }
          }
        }
      }
    },
    "GameSession": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "format": "uuid" },
        "state": { "$ref": "#/definitions/SessionState" },
        "white_player": { "$ref": "player-identity.schema.json#/definitions/Player" },
        "black_player": { "$ref": "player-identity.schema.json#/definitions/Player" },
        "spectators": {
          "type": "array",
          "items": { "$ref": "player-identity.schema.json#/definitions/Player" }
        },
        "fen": { "type": "string" },
        "move_history": {
          "type": "array",
          "items": { "type": "string" }
        },
        "result": { "$ref": "#/definitions/GameResult" },
        "created_at": { "type": "string", "format": "date-time" },
        "started_at": { "type": "string", "format": "date-time" },
        "ended_at": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "state"]
    }
  }
}
```

---

## 3. Clock Management

### 3.1 Time Control Types

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                         TIME CONTROL TYPES
# ═══════════════════════════════════════════════════════════════════════════

time_controls:
  iri: "https://krog-rules.org/chess/time-control"
  
  # ─────────────────────────────────────────────────────────────────────────
  # Standard Time Controls
  # ─────────────────────────────────────────────────────────────────────────
  
  bullet:
    iri: "https://krog-rules.org/chess/time-control/bullet"
    initial_time_ms: 60000  # 1 minute
    increment_ms: 0
    formal: "clock_initial = 60s ∧ increment = 0"
    
  blitz:
    iri: "https://krog-rules.org/chess/time-control/blitz"
    initial_time_ms: 300000  # 5 minutes
    increment_ms: 0
    formal: "clock_initial = 300s ∧ increment = 0"
    variants:
      - { initial: 180000, increment: 0 }      # 3+0
      - { initial: 180000, increment: 2000 }   # 3+2
      - { initial: 300000, increment: 3000 }   # 5+3
  
  rapid:
    iri: "https://krog-rules.org/chess/time-control/rapid"
    initial_time_ms: 600000  # 10 minutes
    increment_ms: 0
    formal: "clock_initial = 600s ∧ increment = 0"
    variants:
      - { initial: 600000, increment: 0 }      # 10+0
      - { initial: 900000, increment: 10000 }  # 15+10
  
  classical:
    iri: "https://krog-rules.org/chess/time-control/classical"
    initial_time_ms: 5400000  # 90 minutes
    increment_ms: 30000
    formal: "clock_initial = 5400s ∧ increment = 30s"
  
  correspondence:
    iri: "https://krog-rules.org/chess/time-control/correspondence"
    time_per_move_ms: 259200000  # 3 days
    formal: "F[≤3_days](move_made)"
  
  unlimited:
    iri: "https://krog-rules.org/chess/time-control/unlimited"
    initial_time_ms: null
    formal: "¬∃time_constraint"

  # ─────────────────────────────────────────────────────────────────────────
  # Increment Types
  # ─────────────────────────────────────────────────────────────────────────
  
  increment_types:
    fischer:
      iri: "https://krog-rules.org/chess/increment/fischer"
      description: "Time added after each move"
      formal: "move_completed → clock := clock + increment"
      timing: "post_move"
    
    bronstein:
      iri: "https://krog-rules.org/chess/increment/bronstein"
      description: "Time added equals time used (up to increment max)"
      formal: "move_completed → clock := clock + min(time_used, increment)"
      timing: "post_move"
    
    delay:
      iri: "https://krog-rules.org/chess/increment/delay"
      description: "Clock doesn't start until delay expires"
      formal: "move_started → wait(delay) → clock_starts"
      timing: "pre_move"
```

### 3.2 Clock Rules (Temporal Logic)

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                         CLOCK RULES (LTL)
# ═══════════════════════════════════════════════════════════════════════════

clock_rules:
  iri: "https://krog-rules.org/chess/clock-rules"
  
  # ─────────────────────────────────────────────────────────────────────────
  # Core Clock Invariants
  # ─────────────────────────────────────────────────────────────────────────
  
  clock_invariant:
    iri: "https://krog-rules.org/chess/clock-invariant"
    formal: "G(active → exactly_one_clock_running)"
    natural: "During active game, exactly one clock runs at any time"
    
  turn_clock_binding:
    iri: "https://krog-rules.org/chess/turn-clock-binding"
    formal: "G(white_turn → white_clock_running) ∧ G(black_turn → black_clock_running)"
    natural: "The clock of the player to move is always running"
    
  clock_switch:
    iri: "https://krog-rules.org/chess/clock-switch"
    formal: "move_made → X(¬current_clock_running ∧ opponent_clock_running)"
    natural: "After move, clocks switch"
  
  # ─────────────────────────────────────────────────────────────────────────
  # Time Forfeit Rules
  # ─────────────────────────────────────────────────────────────────────────
  
  time_forfeit:
    iri: "https://krog-rules.org/chess/time-forfeit"
    formal: "clock(player) ≤ 0 → F(player, make_move) ∧ game_lost(player)"
    natural: "When clock reaches zero, player cannot move and loses"
    
  time_forfeit_exception:
    iri: "https://krog-rules.org/chess/time-forfeit-exception"
    formal: |
      clock(player) ≤ 0 ∧ insufficient_material(opponent) → draw
    natural: "Time forfeit with opponent having insufficient material = draw"
    insufficient_material_patterns:
      - "only_king"
      - "king_and_bishop"
      - "king_and_knight"
      - "king_and_two_knights"  # Cannot force checkmate
  
  # ─────────────────────────────────────────────────────────────────────────
  # Increment Rules
  # ─────────────────────────────────────────────────────────────────────────
  
  fischer_increment:
    iri: "https://krog-rules.org/chess/fischer-increment"
    formal: "move_completed(player) → clock(player) := clock(player) + increment"
    natural: "After completing move, increment is added to player's clock"
    
  delay_rule:
    iri: "https://krog-rules.org/chess/delay-rule"
    formal: |
      turn_started(player) → 
        (time < delay → clock_frozen(player)) ∧
        (time ≥ delay → clock_running(player))
    natural: "Clock doesn't start until delay period expires"
  
  # ─────────────────────────────────────────────────────────────────────────
  # Clock Actions
  # ─────────────────────────────────────────────────────────────────────────
  
  pause_clock:
    iri: "https://krog-rules.org/chess/pause-clock"
    formal: "P(arbiter, pause_clock) ∧ mutual_agreement → P(players, pause_clock)"
    natural: "Arbiter can pause; players can pause by mutual agreement"
    precondition: "state = ACTIVE"
    postcondition: "state → PAUSED ∧ clocks_frozen"
    
  resume_clock:
    iri: "https://krog-rules.org/chess/resume-clock"
    formal: "state = PAUSED ∧ both_ready → resume_clock"
    natural: "Clock resumes when both players ready"
    postcondition: "state → ACTIVE ∧ turn_clock_running"
```

### 3.3 Clock State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHESS CLOCK STATE MACHINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WHITE CLOCK                              BLACK CLOCK                       │
│  ══════════                               ══════════                        │
│                                                                             │
│  ┌─────────────┐                          ┌─────────────┐                   │
│  │   FROZEN    │◄─────── game_start ─────►│   RUNNING   │                   │
│  │  (initial)  │                          │             │                   │
│  └──────┬──────┘                          └──────┬──────┘                   │
│         │                                        │                          │
│         │ first_move = white                     │                          │
│         ▼                                        │                          │
│  ┌─────────────┐      white_moves         ┌─────────────┐                   │
│  │   RUNNING   │─────────────────────────►│   FROZEN    │                   │
│  │             │                          │             │                   │
│  └──────┬──────┘◄─────────────────────────└──────┬──────┘                   │
│         │              black_moves               │                          │
│         │                                        │                          │
│    clock ≤ 0                                clock ≤ 0                       │
│         │                                        │                          │
│         ▼                                        ▼                          │
│  ┌─────────────┐                          ┌─────────────┐                   │
│  │  FORFEITED  │                          │  FORFEITED  │                   │
│  │ (black wins)│                          │ (white wins)│                   │
│  └─────────────┘                          └─────────────┘                   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  PAUSE STATE (both clocks)                                                  │
│  ─────────────────────────                                                  │
│                                                                             │
│  RUNNING ──── pause_event ────► PAUSED ──── resume_event ────► RUNNING     │
│              (mutual/arbiter)            (both_ready)                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Clock JSON Schema

```json
{
  "$schema": "https://krog-rules.org/chess/clock.schema.json",
  "definitions": {
    "ClockState": {
      "enum": ["frozen", "running", "paused", "forfeited"]
    },
    "IncrementType": {
      "enum": ["fischer", "bronstein", "delay", "none"]
    },
    "TimeControl": {
      "type": "object",
      "properties": {
        "initial_time_ms": { "type": "integer", "minimum": 0 },
        "increment_ms": { "type": "integer", "minimum": 0 },
        "increment_type": { "$ref": "#/definitions/IncrementType" },
        "delay_ms": { "type": "integer", "minimum": 0 }
      },
      "required": ["initial_time_ms"]
    },
    "PlayerClock": {
      "type": "object",
      "properties": {
        "player_id": { "type": "string" },
        "color": { "enum": ["white", "black"] },
        "remaining_ms": { "type": "integer" },
        "state": { "$ref": "#/definitions/ClockState" },
        "last_updated": { "type": "string", "format": "date-time" }
      },
      "required": ["player_id", "color", "remaining_ms", "state"]
    },
    "GameClock": {
      "type": "object",
      "properties": {
        "time_control": { "$ref": "#/definitions/TimeControl" },
        "white_clock": { "$ref": "#/definitions/PlayerClock" },
        "black_clock": { "$ref": "#/definitions/PlayerClock" },
        "active_color": { "enum": ["white", "black", null] }
      },
      "required": ["time_control", "white_clock", "black_clock"]
    }
  }
}
```

---

## 4. Combined System Architecture

### 4.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KROG CHESS ENTITY RELATIONSHIPS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│   │   PLAYER    │         │    GAME     │         │    CLOCK    │          │
│   │    (T₁)     │────────►│   SESSION   │◄────────│             │          │
│   │             │  plays  │             │  times  │             │          │
│   └──────┬──────┘         └──────┬──────┘         └─────────────┘          │
│          │                       │                                          │
│          │                       │ validates                                │
│          │                       ▼                                          │
│          │                ┌─────────────┐                                   │
│          │                │    KROG     │                                   │
│          │                │ RULE ENGINE │                                   │
│          │                │    (T₅)     │                                   │
│          │                └──────┬──────┘                                   │
│          │                       │                                          │
│          │                       │ judges                                   │
│          │                       ▼                                          │
│          │                ┌─────────────┐                                   │
│          │                │   ARBITER   │                                   │
│          └───────────────►│    (T₅)     │                                   │
│               disputed_by └─────────────┘                                   │
│                                  │                                          │
│                                  │ observed_by                              │
│                                  ▼                                          │
│                           ┌─────────────┐                                   │
│                           │  SPECTATOR  │                                   │
│                           │    (T₆)     │                                   │
│                           └─────────────┘                                   │
│                                                                             │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  KEY R-TYPES:                                                               │
│  ────────────                                                               │
│  Player ↔ Player:     R₃ (T₃,T₃) - Both must engage                        │
│  Player → RuleEngine: R₁₁ (T₁,T₅) - Discretion → Obligation                │
│  Player → Spectator:  R₁₂ (T₁,T₆) - Discretion → Passivity                 │
│  Arbiter → Player:    R₂₅ (T₅,T₆) - Arbiter acts, player complies          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Complete TypeScript Interface

```typescript
// ═══════════════════════════════════════════════════════════════════════════
//                          KROG CHESS TYPES
// ═══════════════════════════════════════════════════════════════════════════

// T-Types
type TType = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7';

// Player Types
type PlayerType = 'human' | 'ai_engine' | 'ai_agent' | 'robot';
type Color = 'white' | 'black';
type PlayerRole = 'player' | 'spectator';

interface Player {
  id: string;
  type: PlayerType;
  tType: TType;
  color?: Color;
  role: PlayerRole;
  joinedAt: Date;
  interface?: string;
}

// Session Types
type SessionState = 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';

interface GameResult {
  winner: Color | null;
  reason: 
    | 'checkmate' | 'resignation' | 'time_forfeit'
    | 'stalemate' | 'draw_agreed' | 'threefold_repetition'
    | 'fifty_move_rule' | 'insufficient_material'
    | 'timeout' | 'abort';
  scores: { white: number; black: number };
}

interface GameSession {
  id: string;
  state: SessionState;
  whitePlayer?: Player;
  blackPlayer?: Player;
  spectators: Player[];
  fen: string;
  moveHistory: string[];
  result?: GameResult;
  clock?: GameClock;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

// Clock Types
type ClockState = 'frozen' | 'running' | 'paused' | 'forfeited';
type IncrementType = 'fischer' | 'bronstein' | 'delay' | 'none';

interface TimeControl {
  initialTimeMs: number;
  incrementMs: number;
  incrementType: IncrementType;
  delayMs?: number;
}

interface PlayerClock {
  playerId: string;
  color: Color;
  remainingMs: number;
  state: ClockState;
  lastUpdated: Date;
}

interface GameClock {
  timeControl: TimeControl;
  whiteClock: PlayerClock;
  blackClock: PlayerClock;
  activeColor: Color | null;
}

// Events
interface MoveEvent {
  roomId: string;
  playerId: string;
  move: { from: string; to: string; promotion?: string };
  fenBefore: string;
  fenAfter: string;
  san: string;
  timestamp: Date;
  timeTakenMs: number;
}

// KROG Validation Result
interface KROGValidation {
  valid: boolean;
  ruleId: string;
  formal: string;
  natural: string;
  proof?: string;
}
```

---

## 5. Implementation Checklist

### Server Updates Required

- [ ] Add `Player` interface with type and T-type
- [ ] Add `GameSession` state machine
- [ ] Add `GameClock` with time controls
- [ ] Implement color assignment methods
- [ ] Add spectator support
- [ ] Add session lifecycle events
- [ ] Add time forfeit detection

### Client Updates Required

- [ ] Player type selection UI
- [ ] Room creation with settings
- [ ] Color assignment display
- [ ] Clock display component
- [ ] Spectator mode view
- [ ] Session state indicators
- [ ] Draw offer/accept UI
- [ ] Resignation button

### New Socket Events

```typescript
// Room events
'create_room' → { settings: GameSettings }
'join_room' → { roomId: string, playerType: PlayerType }
'room_state' → GameSession
'colors_assigned' → { white: string, black: string }

// Clock events  
'clock_tick' → { white: number, black: number }
'time_forfeit' → { forfeiter: string, winner: string }

// Game events
'offer_draw' → { offerer: string }
'draw_response' → { accepted: boolean }
'resign' → { resigner: string }
'game_result' → GameResult
```

---

---

## 5. Notation Formats & Parsing

### 5.1 Supported Notation Systems

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                       NOTATION FORMAT DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

notation_formats:
  iri: "https://krog-rules.org/chess/notation"
  
  standard_algebraic:
    iri: "https://krog-rules.org/chess/notation-san"
    abbreviation: SAN
    description: "Official FIDE standard for game recording"
    t_type: T5  # Must be precisely formatted
    patterns:
      piece_move: "[KQRBN][a-h]?[1-8]?x?[a-h][1-8][+#]?"
      pawn_move: "[a-h]x?[a-h]?[1-8](=[QRBN])?[+#]?"
      castling: "O-O(-O)?[+#]?"
    examples:
      - "e4"       # Pawn to e4
      - "Nf3"      # Knight to f3
      - "Bxe5"     # Bishop captures on e5
      - "O-O"      # Kingside castling
      - "e8=Q+"    # Pawn promotes to queen with check
      - "Qh5#"     # Queen to h5 checkmate
    regex: "^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?[+#]?$|^O-O(-O)?[+#]?$"
  
  long_algebraic:
    iri: "https://krog-rules.org/chess/notation-lan"
    abbreviation: LAN
    description: "Includes origin and destination squares"
    t_type: T5
    patterns:
      move: "[KQRBN]?[a-h][1-8][-x][a-h][1-8]"
    examples:
      - "Ng1-f3"   # Knight from g1 to f3
      - "e2-e4"    # Pawn from e2 to e4
      - "Bxe5xf6"  # Bishop captures on f6
    regex: "^[KQRBN]?[a-h][1-8][-x][a-h][1-8](=[QRBN])?[+#]?$"
  
  uci:
    iri: "https://krog-rules.org/chess/notation-uci"
    abbreviation: UCI
    description: "Universal Chess Interface - engine communication standard"
    t_type: T5
    patterns:
      move: "[a-h][1-8][a-h][1-8][qrbn]?"
      castling: "e1g1|e1c1|e8g8|e8c8"
      null_move: "0000"
    examples:
      - "e2e4"     # Pawn e2 to e4
      - "g1f3"     # Knight g1 to f3
      - "e7e8q"    # Pawn promotes to queen
      - "e1g1"     # White kingside castling
    regex: "^[a-h][1-8][a-h][1-8][qrbn]?$"
  
  iccf_numeric:
    iri: "https://krog-rules.org/chess/notation-iccf"
    abbreviation: ICCF
    description: "International Correspondence Chess Federation format"
    t_type: T5
    patterns:
      move: "[1-8]{4}[1-4]?"  # Files and ranks as numbers
    examples:
      - "5254"     # e2-e4 (file 5, rank 2 → file 5, rank 4)
      - "7163"     # g1-f3 (file 7, rank 1 → file 6, rank 3)
      - "52541"    # Promotion to queen (fifth digit 1=Q, 2=R, 3=B, 4=N)
    regex: "^[1-8]{4}[1-4]?$"
  
  figurine:
    iri: "https://krog-rules.org/chess/notation-figurine"
    description: "Unicode piece symbols instead of letters"
    symbols:
      white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" }
      black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" }
    examples:
      - "♞c6"      # Knight to c6
      - "♖xg4"     # Rook captures on g4
  
  descriptive:
    iri: "https://krog-rules.org/chess/notation-descriptive"
    description: "Legacy English descriptive notation (pre-1970s)"
    status: deprecated
    examples:
      - "P-K4"     # Pawn to King 4 (e4)
      - "N-KB3"    # Knight to King's Bishop 3 (Nf3)
```

### 5.2 Notation Parsing Operators

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                       NOTATION PARSING (KROG TABLE 10)
# ═══════════════════════════════════════════════════════════════════════════

notation_operators:
  
  PSA:  # Parse Standard Algebraic
    iri: "https://krog-rules.org/chess/PSA"
    formal: "PSA(san) ≡ extract_piece_destination(san) → Move"
    natural: "Parse SAN notation to move object"
    input_formats: ["Nf3", "Bxe5", "O-O", "e4", "Qh5+"]
    implementation: "parseStandardAlgebraic(san: string): Move"
  
  PLA:  # Parse Long Algebraic
    iri: "https://krog-rules.org/chess/PLA"
    formal: "PLA(lan) ≡ extract_from_to(lan) → Move"
    natural: "Parse LAN notation with full squares"
    input_formats: ["Ng1-f3", "Be5-f6", "e2-e4"]
    implementation: "parseLongAlgebraic(lan: string): Move"
  
  PUCI:  # Parse UCI Format
    iri: "https://krog-rules.org/chess/PUCI"
    formal: "PUCI(uci) ≡ coordinates_to_move(uci) → Move"
    natural: "Parse UCI coordinate format"
    input_formats: ["e2e4", "g1f3", "e1g1"]
    implementation: "parseUCI(uci: string): Move"
  
  PVN:  # Parse Voice Natural
    iri: "https://krog-rules.org/chess/PVN"
    formal: "PVN(voice) ≡ nlp_to_move(voice) → Move"
    natural: "Parse natural language voice commands"
    input_formats: ["King to e4", "Knight takes bishop", "Castle kingside"]
    implementation: "parseVoiceCommand(voice: string, lang: string): Move"
  
  GN:  # Generate Notation
    iri: "https://krog-rules.org/chess/GN"
    formal: "GN(move, format) ≡ move_to_notation(move, format) → String"
    natural: "Generate notation from move object"
    output_formats: ["SAN", "LAN", "UCI", "ICCF", "FIGURINE"]
    implementation: "generateNotation(move: Move, format: NotationFormat): string"
  
  NC:  # Notation Conversion
    iri: "https://krog-rules.org/chess/NC"
    formal: "NC(n₁, f₁, f₂) ≡ parse(n₁, f₁) → generate(move, f₂)"
    natural: "Convert between notation formats"
    conversions: "SAN ↔ UCI ↔ LAN ↔ ICCF ↔ Voice"
    implementation: "convertNotation(input: string, from: Format, to: Format): string"
```

---

## 6. Voice Interface

### 6.1 Voice Command Types

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          VOICE COMMAND DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════

voice_commands:
  iri: "https://krog-rules.org/chess/voice-commands"
  
  move_commands:
    iri: "https://krog-rules.org/chess/voice-move"
    t_type: T1  # Player discretion
    
    patterns:
      natural_language:
        - "{piece} to {square}"           # "King to e4"
        - "{piece} {square}"              # "Knight f3"
        - "{piece} takes {piece/square}"  # "Bishop takes knight on f6"
        - "{piece} from {square} to {square}"  # "Knight from b1 to c3"
        - "Castle {kingside/queenside}"   # "Castle kingside"
        - "Pawn promotion to {piece}"     # "Promotion to queen"
      
      algebraic_spoken:
        - "{SAN}"                          # "Knight f3" (spoken as notation)
        - "{file} {rank}"                  # "e 4"
        - "{square} to {square}"          # "e2 to e4"
    
    disambiguation:
      description: "Handle ambiguous moves (two knights can reach same square)"
      patterns:
        - "Knight on b1 to c3"
        - "Rook from a1"
        - "The other knight"
      formal: "ambiguous_move ∧ context_insufficient → O(request_clarification)"
  
  game_control_commands:
    iri: "https://krog-rules.org/chess/voice-control"
    t_type: T1  # Player discretion
    
    commands:
      new_game: ["New game", "Start over", "Reset"]
      undo: ["Undo", "Take back", "Go back"]
      resign: ["I resign", "Resign", "Give up"]
      draw_offer: ["Offer draw", "Draw?", "Propose draw"]
      draw_accept: ["Accept draw", "Yes, draw", "Agreed"]
      flip_board: ["Flip board", "Switch sides view"]
  
  navigation_commands:
    iri: "https://krog-rules.org/chess/voice-nav"
    
    commands:
      history: ["Show move history", "What moves were played"]
      analysis: ["Analysis mode", "Analyze position"]
      settings: ["Settings", "Preferences", "Options"]
      help: ["Help", "How do I..."]
  
  accessibility_commands:
    iri: "https://krog-rules.org/chess/voice-accessibility"
    t_type: T5  # System must respond
    
    commands:
      describe_position: ["Describe position", "What's on the board"]
      describe_square: ["What's on {square}", "Piece on e4"]
      legal_moves: ["What are my legal moves", "Where can I move"]
      last_move: ["What was the last move", "What did they play"]
      whose_turn: ["Whose turn", "Who moves"]
      game_status: ["Game status", "Am I in check"]
```

### 6.2 Voice Feedback (Text-to-Speech)

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          VOICE OUTPUT TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════

voice_output:
  iri: "https://krog-rules.org/chess/voice-output"
  
  move_announcements:
    template: "{piece} {action} {destination}"
    examples:
      en:
        - "White pawn moves to e4"
        - "Black knight captures on f3"
        - "White castles kingside"
        - "Pawn promotes to queen"
      no:
        - "Hvit bonde flytter til e4"
        - "Svart springer slår på f3"
        - "Hvit rokerer kort"
        - "Bonde forfremmes til dronning"
  
  game_state_announcements:
    templates:
      check:
        en: "{color} king is in check"
        no: "{color} konge står i sjakk"
      checkmate:
        en: "Checkmate! {winner} wins"
        no: "Sjakkmatt! {winner} vinner"
      stalemate:
        en: "Stalemate. Game is a draw"
        no: "Patt. Partiet er remis"
      draw:
        en: "Game drawn by {reason}"
        no: "Partiet er remis ved {reason}"
  
  position_descriptions:
    template: "{piece} on {square}, {threats}"
    scan_order: "rank by rank, starting from a8"
    blind_player_format: "Complete position description with coordinates"
  
  error_feedback:
    illegal_move:
      en: "Illegal move. {reason}"
      no: "Ulovlig trekk. {reason}"
    not_your_turn:
      en: "It's not your turn"
      no: "Det er ikke din tur"
    no_piece:
      en: "No piece on that square"
      no: "Ingen brikke på det feltet"
```

### 6.3 Voice Technology Integration

```typescript
// Voice Interface Implementation
interface VoiceConfig {
  recognition: {
    api: 'WebSpeechAPI' | 'external';
    language: string;  // BCP-47 code: 'en-US', 'nb-NO'
    continuous: boolean;
    interimResults: boolean;
    confidenceThreshold: number;  // 0.0-1.0
  };
  synthesis: {
    api: 'WebSpeechAPI' | 'external';
    voice?: string;
    rate: number;   // 0.1-10
    pitch: number;  // 0-2
    volume: number; // 0-1
  };
}

interface VoiceCommand {
  raw: string;           // Raw transcript
  parsed: ParsedMove | null;
  confidence: number;
  timestamp: Date;
  language: string;
}

interface ParsedMove {
  type: 'move' | 'castle' | 'resign' | 'draw' | 'undo' | 'reset' | 'query';
  piece?: PieceType;
  from?: Square;
  to?: Square;
  promotion?: PieceType;
  castlingSide?: 'kingside' | 'queenside';
  isCapture?: boolean;
}
```

---

## 7. Multilingual Support

### 7.1 Language Definitions

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          MULTILINGUAL CHESS TERMS
# ═══════════════════════════════════════════════════════════════════════════

languages:
  iri: "https://krog-rules.org/chess/languages"
  
  supported:
    - code: en
      name: English
      status: complete
      fide_numbering: "decimal (1.1, 3.2)"
    - code: "no"
      name: Norsk
      status: complete
      fide_numbering: "§ prefix (§1.1, §3.2)"
    - code: es
      name: Español
      status: framework
    - code: de
      name: Deutsch
      status: framework
    - code: fr
      name: Français
      status: framework
    - code: ru
      name: Русский
      status: framework
    - code: zh
      name: 中文
      status: framework
  
  piece_names:
    en: { king: "King", queen: "Queen", rook: "Rook", bishop: "Bishop", knight: "Knight", pawn: "Pawn" }
    no: { king: "Konge", queen: "Dronning", rook: "Tårn", bishop: "Løper", knight: "Springer", pawn: "Bonde" }
    es: { king: "Rey", queen: "Dama", rook: "Torre", bishop: "Alfil", knight: "Caballo", pawn: "Peón" }
    de: { king: "König", queen: "Dame", rook: "Turm", bishop: "Läufer", knight: "Springer", pawn: "Bauer" }
    fr: { king: "Roi", queen: "Dame", rook: "Tour", bishop: "Fou", knight: "Cavalier", pawn: "Pion" }
    ru: { king: "Король", queen: "Ферзь", rook: "Ладья", bishop: "Слон", knight: "Конь", pawn: "Пешка" }
  
  piece_symbols:
    san:
      en: { king: "K", queen: "Q", rook: "R", bishop: "B", knight: "N", pawn: "" }
      no: { king: "K", queen: "D", rook: "T", bishop: "L", knight: "S", pawn: "" }
      de: { king: "K", queen: "D", rook: "T", bishop: "L", knight: "S", pawn: "" }
  
  voice_commands:
    move_to:
      en: ["to", "moves to"]
      no: ["til", "flytter til"]
    captures:
      en: ["takes", "captures", "x"]
      no: ["slår", "tar"]
    castle:
      en: ["castle", "castles"]
      no: ["rokere", "rokade"]
    check:
      en: "check"
      no: "sjakk"
    checkmate:
      en: "checkmate"
      no: "sjakkmatt"
  
  ui_strings:
    new_game:
      en: "New Game"
      no: "Nytt Parti"
    resign:
      en: "Resign"
      no: "Gi opp"
    offer_draw:
      en: "Offer Draw"
      no: "Tilby Remis"
    your_turn:
      en: "Your turn"
      no: "Din tur"
```

### 7.2 FIDE Rule References (Bilingual)

```yaml
# Norwegian vs English FIDE Rule Numbering
fide_rule_mapping:
  piece_movement:
    bishop:
      no: "§3.2: Løperen kan flyttes til et hvilket som helst felt langs diagonalene den står på"
      en: "3.2: The bishop may move to any square along a diagonal on which it stands"
      krog: "P(bishop_move) ↔ (diagonal_line ∧ clear_path)"
    
    rook:
      no: "§3.3: Tårnet kan flyttes til et hvilket som helst felt langs linjen eller raden den står på"
      en: "3.3: The rook may move to any square along the file or the rank on which it stands"
      krog: "P(rook_move) ↔ (rank_or_file ∧ clear_path)"
    
    queen:
      no: "§3.4: Dronningen kan flyttes til et hvilket som helst felt langs linjen, raden eller diagonalene"
      en: "3.4: The queen may move to any square along the file, the rank or a diagonal on which it stands"
      krog: "P(queen_move) ↔ (bishop_move ∨ rook_move)"
    
    knight:
      no: "§3.5: Springeren kan flyttes til ett av feltene nærmest det feltet den står på men ikke på samme linje, rad eller diagonal"
      en: "3.5: The knight may move to one of the squares nearest to that on which it stands but not on the same rank, file or diagonal"
      krog: "P(knight_move) ↔ L_shape_pattern ∧ can_jump"
    
    pawn:
      no: "§3.6: Bonden kan flyttes fremover til det ubesatte feltet rett foran på samme linje"
      en: "3.6: The pawn may move forward to the square immediately in front of it on the same file, provided that this square is unoccupied"
      krog: "P(pawn_move) ↔ (forward_one ∨ forward_two_from_start ∨ diagonal_capture)"
    
    king:
      no: "§3.8: Kongen kan flyttes til et hvilket som helst tilstøtende felt"
      en: "3.8.a: There are two different ways of moving the king: by moving to any adjoining square not attacked"
      krog: "P(king_move) ↔ (adjacent_square ∧ ¬attacked_square)"
  
  special_moves:
    castling:
      no: "§3.8.2: Rokade - trekk med kongen og et av tårnene av samme farge"
      en: "3.8.a: ...or by 'castling'. This is a move of the king and either rook of the same colour"
      krog: "P(castle) ↔ (¬moved(king) ∧ ¬moved(rook) ∧ ¬check ∧ ¬attacked(path) ∧ empty(between))"
    
    en_passant:
      no: "§3.7.3.1: En bonde som angriper et felt krysset av en motspillers bonde som er flyttet to felt fremover..."
      en: "3.7.d: A pawn attacking a square crossed by an opponent's pawn which has advanced two squares..."
      krog: "P(en_passant) ↔ F[≤1_move](opponent_pawn_double_advance) ∧ adjacent_on_fifth"
    
    promotion:
      no: "§3.7.3.3: Forvandling - når en bonde når raden som er lengst fra utgangsstillingen, må spilleren bytte ut bonden"
      en: "3.7.e: When a pawn reaches the rank furthest from its starting position it must be exchanged"
      krog: "pawn_reaches_eighth → O(choose_piece ∈ {Q, R, B, N})"
  
  illegal_move_penalty:
    no: "§7.5.5: Ved det andre ulovlige trekket til samme spiller, skal partiet dømmes til tap"
    en: "7.4.b: ...for a third illegal move by the same player, the arbiter shall declare the game lost"
    difference: "Norwegian: 2nd illegal = loss; English: 3rd illegal = loss"
```

---

## 8. Accessibility Features

### 8.1 Accessibility Requirements (WCAG 2.1 AA)

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          ACCESSIBILITY SPECIFICATION
# ═══════════════════════════════════════════════════════════════════════════

accessibility:
  iri: "https://krog-rules.org/chess/accessibility"
  standard: "WCAG 2.1 AA"
  
  screen_reader:
    iri: "https://krog-rules.org/chess/screen-reader"
    t_type: T5  # System must provide
    
    requirements:
      semantic_html: true
      aria_labels: true
      live_regions: true
      focus_management: true
    
    announcements:
      board_description: "8x8 grid, current position: {piece} on {square}"
      move_announcement: "{color} {piece} moves from {from} to {to}"
      game_state: "{color} to move, {status}"
      clock_time: "{color} has {time} remaining"
    
    aria_labels:
      board: "Chess board, 8 by 8 grid"
      square: "{piece or empty} on {square}"
      move_history: "Move history, {count} moves played"
      clock: "{color} clock, {time} remaining"
  
  keyboard_navigation:
    iri: "https://krog-rules.org/chess/keyboard"
    t_type: T1  # User discretion
    
    controls:
      arrow_keys: "Navigate board squares"
      enter_space: "Select piece or confirm move"
      escape: "Cancel selection"
      tab: "Navigate UI elements"
      alt_m: "Direct move input"
      alt_h: "Help menu"
    
    focus:
      visible_indicator: true
      skip_links: true
      logical_order: true
  
  visual_accessibility:
    iri: "https://krog-rules.org/chess/visual"
    
    high_contrast:
      modes: ["default", "high_contrast", "dark", "light"]
      min_ratio: 4.5  # WCAG AA
    
    color_blind:
      modes:
        - none
        - protanopia      # Red-blind
        - deuteranopia    # Green-blind  
        - tritanopia      # Blue-blind
      piece_differentiation: "shapes + patterns, not just colors"
    
    text_scaling:
      min_size: "16px"
      max_size: "24px"
      user_adjustable: true
    
    dyslexia_support:
      font: "OpenDyslexic"
      line_spacing: 1.5
      letter_spacing: "0.12em"
  
  motor_accessibility:
    iri: "https://krog-rules.org/chess/motor"
    
    touch_targets:
      min_size: "44px"
    
    input_methods:
      - click_to_select_click_to_move  # Primary
      - drag_and_drop                   # Secondary
      - voice_commands                  # Hands-free
      - keyboard_only                   # No mouse
    
    timing:
      move_confirmation: optional
      adjustable_delay: true
      no_time_limits_option: true
  
  cognitive_accessibility:
    iri: "https://krog-rules.org/chess/cognitive"
    
    features:
      legal_move_highlights: true
      threat_highlighting: true
      move_arrows: true
      coordinates_visible: true
      undo_available: true
    
    krog_explanations:
      show_why_illegal: true
      show_rule_reference: true
      voice_explanations: true
```

### 8.2 Accessibility Presets

```typescript
// One-click accessibility configurations
interface AccessibilityPreset {
  id: string;
  name: { en: string; no: string };
  settings: AccessibilitySettings;
}

const ACCESSIBILITY_PRESETS: AccessibilityPreset[] = [
  {
    id: 'screen_reader',
    name: { en: 'Screen Reader', no: 'Skjermleser' },
    settings: {
      announcements: 'full',
      keyboardOnly: true,
      clickToMove: true,
      highContrast: false,
    }
  },
  {
    id: 'low_vision',
    name: { en: 'Low Vision', no: 'Svaksynt' },
    settings: {
      highContrast: true,
      largeText: true,
      highlights: 'maximum',
      coordinatesAlwaysVisible: true,
    }
  },
  {
    id: 'motor_support',
    name: { en: 'Motor Support', no: 'Motorisk støtte' },
    settings: {
      clickToMove: true,
      moveConfirmation: true,
      adjustableDelay: true,
      largeTouchTargets: true,
    }
  },
  {
    id: 'cognitive_support',
    name: { en: 'Cognitive Support', no: 'Kognitiv støtte' },
    settings: {
      highlights: 'all',
      moveArrows: true,
      krogExplanations: true,
      confirmations: true,
    }
  }
];
```

---

## 9. Piece Movement Rules (KROG Formalization)

### 9.1 Movement Operators

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                    PIECE MOVEMENT (KROG TABLE 8)
# ═══════════════════════════════════════════════════════════════════════════

piece_movement:
  iri: "https://krog-rules.org/chess/piece-movement"
  
  king:
    iri: "https://krog-rules.org/chess/king-movement"
    fide: "3.8.a"
    t_type: T1
    r_types: [R14]  # Capability
    formula: "P(K) ↔ O(adjacent ∧ ¬attacked)"
    vectors: [{dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1},
              {dx: -1, dy: 0},                   {dx: 1, dy: 0},
              {dx: -1, dy: 1},  {dx: 0, dy: 1},  {dx: 1, dy: 1}]
    max_distance: 1
    can_jump: false
  
  queen:
    iri: "https://krog-rules.org/chess/queen-movement"
    fide: "3.4"
    t_type: T1
    r_types: [R14]
    formula: "P(Q) ↔ O(orthogonal ∨ diagonal) ∧ clear_path"
    vectors: "rook_vectors ∪ bishop_vectors"
    max_distance: 7
    can_jump: false
  
  rook:
    iri: "https://krog-rules.org/chess/rook-movement"
    fide: "3.3"
    t_type: T1
    r_types: [R14]
    formula: "P(R) ↔ O(orthogonal ∧ clear_path)"
    vectors: [{dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}]
    max_distance: 7
    can_jump: false
  
  bishop:
    iri: "https://krog-rules.org/chess/bishop-movement"
    fide: "3.2"
    t_type: T1
    r_types: [R14]
    formula: "P(B) ↔ O(diagonal ∧ clear_path)"
    vectors: [{dx: -1, dy: -1}, {dx: 1, dy: -1}, {dx: -1, dy: 1}, {dx: 1, dy: 1}]
    max_distance: 7
    can_jump: false
  
  knight:
    iri: "https://krog-rules.org/chess/knight-movement"
    fide: "3.5"
    t_type: T1
    r_types: [R14]
    formula: "P(N) ↔ O(L_shape) — can jump over pieces"
    vectors: [{dx: -2, dy: -1}, {dx: -2, dy: 1}, {dx: 2, dy: -1}, {dx: 2, dy: 1},
              {dx: -1, dy: -2}, {dx: -1, dy: 2}, {dx: 1, dy: -2}, {dx: 1, dy: 2}]
    max_distance: 1  # Fixed L-shape
    can_jump: true   # ONLY piece that can jump
  
  pawn:
    iri: "https://krog-rules.org/chess/pawn-movement"
    fide: "3.6"
    t_type: T2  # Limited - many conditions
    r_types: [R14, R11]
    formula: "P(P) ↔ O(forward ∧ (empty_target ∨ diagonal_capture))"
    movement:
      forward_one: "target_empty"
      forward_two: "from_starting_rank ∧ both_squares_empty"
      diagonal_capture: "opponent_piece_on_diagonal"
    max_distance: 2  # Only from starting position
    can_jump: false
```

### 9.2 Special Moves

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                    SPECIAL MOVES (TEMPORAL LOGIC)
# ═══════════════════════════════════════════════════════════════════════════

special_moves:
  
  castling:
    iri: "https://krog-rules.org/chess/castling"
    fide: "3.8.2"
    t_type: T2  # Limited by conditions
    
    prerequisites:
      - king_never_moved: "G[past](¬moved(king))"
      - rook_never_moved: "G[past](¬moved(rook))"
      - not_in_check: "¬check(king)"
      - path_not_attacked: "∀sq ∈ king_path: ¬attacked(sq)"
      - path_empty: "∀sq ∈ between(king, rook): empty(sq)"
    
    types:
      kingside:
        notation: "O-O"
        uci_white: "e1g1"
        uci_black: "e8g8"
        king_movement: "e1→g1 | e8→g8"
        rook_movement: "h1→f1 | h8→f8"
      queenside:
        notation: "O-O-O"
        uci_white: "e1c1"
        uci_black: "e8c8"
        king_movement: "e1→c1 | e8→c8"
        rook_movement: "a1→d1 | a8→d8"
    
    prohibition: "F(castle_through_check ∨ castle_out_of_check ∨ castle_into_check)"
  
  en_passant:
    iri: "https://krog-rules.org/chess/en-passant"
    fide: "3.7.d"
    t_type: T2
    
    temporal_window: "F[≤1_move](opponent_pawn_double_advance)"
    conditions:
      - capturing_pawn_on_fifth_rank: true
      - opponent_pawn_just_double_moved: true
      - adjacent_files: true
    
    execution:
      capture_square: "square_passed_over_by_opponent"
      removed_piece: "opponent_pawn_that_double_moved"
      one_move_window: "opportunity_expires_after_one_move"
    
    formula: "P(en_passant) ↔ (fifth_rank ∧ adjacent_pawn ∧ X⁻¹(double_move))"
  
  promotion:
    iri: "https://krog-rules.org/chess/promotion"
    fide: "3.7.e"
    t_type: T3  # Must engage (choose piece)
    
    trigger: "pawn_reaches_eighth_rank"
    obligation: "O(choose_piece)"
    choices: ["queen", "rook", "bishop", "knight"]
    prohibition: "F(remain_pawn) ∧ F(promote_to_king)"
    
    formula: "pawn_on_8th → O(replace_with ∈ {Q, R, B, N})"
```

---

## 10. Game Termination Rules

### 10.1 Win Conditions

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          GAME TERMINATION
# ═══════════════════════════════════════════════════════════════════════════

win_conditions:
  
  checkmate:
    iri: "https://krog-rules.org/chess/checkmate"
    fide: "5.1.1"
    formal: "check(king) ∧ ¬∃legal_move → winner(opponent)"
    natural: "King in check with no legal moves"
    result: { winner: "opponent", loser: "current_player", score: "1-0 | 0-1" }
  
  resignation:
    iri: "https://krog-rules.org/chess/resignation"
    formal: "P(resign) → winner(opponent)"
    natural: "Player voluntarily concedes"
    result: { winner: "opponent", loser: "resigner", score: "1-0 | 0-1" }
  
  time_forfeit:
    iri: "https://krog-rules.org/chess/time-forfeit"
    fide: "6.9"
    formal: "time_expired(player) ∧ sufficient_material(opponent) → winner(opponent)"
    exception: "time_expired ∧ insufficient_material(opponent) → draw"
```

### 10.2 Draw Conditions

```yaml
draw_conditions:
  
  stalemate:
    iri: "https://krog-rules.org/chess/stalemate"
    fide: "5.2.1"
    formal: "¬check(king) ∧ ¬∃legal_move → draw"
    natural: "Not in check, but no legal moves"
  
  threefold_repetition:
    iri: "https://krog-rules.org/chess/threefold"
    fide: "9.2"
    formal: "position_count(pos) ≥ 3 → P(claim_draw)"
    claim_required: true
    timing: "before_or_after_third_occurrence"
    position_identity:
      - same_piece_placement
      - same_player_to_move
      - same_castling_rights
      - same_en_passant_possibilities
  
  fifty_move_rule:
    iri: "https://krog-rules.org/chess/fifty-move"
    fide: "9.3"
    formal: "G[50_moves](¬capture ∧ ¬pawn_move) → P(claim_draw)"
    claim_required: true
    counter_reset: ["pawn_move", "capture"]
  
  insufficient_material:
    iri: "https://krog-rules.org/chess/insufficient"
    fide: "5.2.2"
    formal: "¬∃mating_sequence → automatic_draw"
    combinations:
      - "K vs K"
      - "K+B vs K"
      - "K+N vs K"
      - "K+B vs K+B (same color bishops)"
  
  draw_by_agreement:
    iri: "https://krog-rules.org/chess/draw-agreement"
    formal: "offer_draw ∧ accept_draw → draw"
    bilateral: true
```

---

## 11. Teaching Mode

### 11.1 Educational Features

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          TEACHING MODE
# ═══════════════════════════════════════════════════════════════════════════

teaching_mode:
  iri: "https://krog-rules.org/chess/teaching"
  
  player_types_for_teaching:
    tutor:
      t_type: T2  # Can act, cannot refuse teaching
      formal: "P(tutor EA) ∧ O¬(tutor E¬A) ∧ P(tutor ILA)"
      capabilities:
        - explain_moves
        - show_alternatives
        - give_hints
        - analyze_mistakes
    
    student:
      t_type: T1  # Full discretion to learn or play
      formal: "P(student EA) ∧ P(student E¬A) ∧ P(student ILA)"
  
  teaching_features:
    move_explanations:
      why_legal: "Show KROG formula proving legality"
      why_illegal: "Show KROG formula proving prohibition"
      better_alternatives: "Suggest stronger moves with reasoning"
    
    rule_tutorials:
      interactive: true
      voice_enabled: true
      multilingual: ["en", "no"]
      topics:
        - piece_movement
        - special_moves
        - checkmate_patterns
        - draw_rules
        - time_controls
    
    adaptive_difficulty:
      levels: ["beginner", "intermediate", "advanced", "expert"]
      auto_adjust: true
      based_on: ["mistake_frequency", "game_length", "rule_violations"]
    
    voice_integration:
      queries:
        - "How does the {piece} move?"
        - "What is {rule}?"
        - "Why was that move illegal?"
        - "What should I study next?"
      responses:
        format: "KROG explanation + natural language"
        languages: ["en", "no"]
```

---

## 12. AI Engine Integration

### 12.1 Engine Interface

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                       AI ENGINE INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════

ai_integration:
  iri: "https://krog-rules.org/chess/ai-integration"
  
  stockfish_integration:
    protocol: UCI
    implementation: "stockfish.js (WebAssembly)"
    t_type: T5  # Must respond when requested
    
    commands:
      position: "position fen {fen}"
      go: "go depth {depth} | movetime {ms}"
      stop: "stop"
      ucinewgame: "ucinewgame"
    
    difficulty_presets:
      beginner:    { elo: 800,  depth: 1,  moveTime: 100 }
      easy:        { elo: 1000, depth: 3,  moveTime: 300 }
      medium:      { elo: 1200, depth: 6,  moveTime: 500 }
      intermediate: { elo: 1500, depth: 10, moveTime: 1000 }
      hard:        { elo: 1800, depth: 15, moveTime: 2000 }
      expert:      { elo: 2200, depth: 18, moveTime: 3000 }
      master:      { elo: 2500, depth: 20, moveTime: 5000 }
      maximum:     { elo: null, depth: 25, moveTime: 10000 }
  
  krog_enhanced_analysis:
    description: "AI moves with KROG explanations (unique to this system)"
    output:
      best_move: "Nf3"
      evaluation: "+0.45"
      win_probability: "62%"
      depth: 18
      krog:
        t_type: "T1"
        r_types: ["R1", "R7"]
        formula: "P(Nf3) ∧ ◇capture"
        fide_article: "FIDE 3.5"
        explanation:
          en: "Knight develops to natural square, controlling center"
          no: "Springer utvikles til naturlig felt, kontrollerer sentrum"
```

---

## 13. Implementation Checklist (Extended)

### Server Updates Required

- [ ] Add `Player` interface with type and T-type
- [ ] Add `GameSession` state machine
- [ ] Add `GameClock` with time controls
- [ ] Implement color assignment methods
- [ ] Add spectator support
- [ ] Add session lifecycle events
- [ ] Add time forfeit detection
- [ ] **Add notation parsing (SAN, UCI, LAN)**
- [ ] **Add voice command processing**
- [ ] **Add multilingual message templates**
- [ ] **Add accessibility announcements**
- [ ] **Add KROG move explanations**
- [ ] **Add teaching mode logic**
- [ ] **Add AI engine integration (Stockfish.js)**

### Client Updates Required

- [ ] Player type selection UI
- [ ] Room creation with settings
- [ ] Color assignment display
- [ ] Clock display component
- [ ] Spectator mode view
- [ ] Session state indicators
- [ ] Draw offer/accept UI
- [ ] Resignation button
- [ ] **Voice command interface (Web Speech API)**
- [ ] **Voice feedback (TTS)**
- [ ] **Language selector**
- [ ] **Accessibility settings panel**
- [ ] **Screen reader announcements (ARIA)**
- [ ] **Keyboard navigation**
- [ ] **High contrast / color blind modes**
- [ ] **Teaching mode UI**
- [ ] **AI opponent integration**
- [ ] **Move explanation panel**

### New Socket Events (Extended)

```typescript
// Room events
'create_room' → { settings: GameSettings }
'join_room' → { roomId: string, playerType: PlayerType }
'room_state' → GameSession
'colors_assigned' → { white: string, black: string }

// Clock events  
'clock_tick' → { white: number, black: number }
'time_forfeit' → { forfeiter: string, winner: string }

// Game events
'offer_draw' → { offerer: string }
'draw_response' → { accepted: boolean }
'resign' → { resigner: string }
'game_result' → GameResult

// Voice events (NEW)
'voice_command' → { raw: string, parsed: ParsedMove, confidence: number }
'voice_feedback' → { text: string, language: string }

// Teaching events (NEW)
'explain_move' → { move: string, explanation: KROGExplanation }
'hint_request' → { position: string }
'hint_response' → { hint: string, krog: KROGValidation }

// AI events (NEW)
'ai_move_request' → { fen: string, difficulty: DifficultyLevel }
'ai_move_response' → { move: string, analysis: EngineAnalysis, krog: KROGValidation }
```

---

**Phase 1 Complete.** This document provides the formal KROG specification for:
- Player Identity
- Game Session  
- Clock Management
- Notation Formats & Parsing
- Voice Interface
- Multilingual Support
- Accessibility Features
- Piece Movement Rules
- Special Moves
- Game Termination Rules
- Teaching Mode
- AI Engine Integration

Ready for Phase 2: Implementing these specifications in code?
