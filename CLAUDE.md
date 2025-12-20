# KROG Chess

## QUICK START FOR CLAUDE CODE

**Current State:** Feature-complete multiplayer chess with user accounts, ELO rating, matchmaking, chess variants, Play vs Computer, KROG move explanations, puzzles, opening explorer, lessons, friends system, direct challenges, and polished UI/UX.

**What's Implemented:** All of Phase 1-3 + Play vs Computer + Social features. Room system, clocks, user accounts, ELO rating, matchmaking, Chess960/3-Check/KotH variants, AI opponent, KROG engine, move explanations, puzzles, openings, lessons, PGN export/import, board themes, piece themes, sound effects, friends list, direct challenges, game chat.

**What's Missing:** Clubs, tournaments, leagues (remaining Phase 6 items).

**Spec Files:** `krog/PHASE1-7.md` - Complete specifications.

**Data Files:** `server/data/*.json` - Puzzles, lessons, openings. `server/data/krog.db` - SQLite database.

---

## COMPLETED FEATURES

### User Accounts & Rating (Phase 2)
- [x] User registration/login with JWT authentication
- [x] SQLite database (users, games, rating_history, matchmaking_queue)
- [x] ELO rating system (K=32, starting rating 1200)
- [x] Profile panel with stats (rating, games, wins, win rate)
- [x] Leaderboard (top players by rating)
- [x] Game history with rating changes
- [x] Matchmaking queue by time control
- [x] Rating-based matching (±200 rating range)
- [x] Auto-pairing with random color assignment

### Chess Variants (Phase 3)
- [x] Variant selector in lobby (Standard, Chess960, 3-Check, KotH)
- [x] Chess960 with random starting positions (Scharnagl's method)
- [x] Three-Check variant (win by giving 3 checks)
- [x] King of the Hill variant (win by reaching d4/d5/e4/e5)
- [x] Variant-specific game over detection
- [x] Check counter display for Three-Check
- [x] Position ID display for Chess960

### Play vs Computer
- [x] AI engine with minimax + alpha-beta pruning
- [x] Three difficulty levels (Beginner, Intermediate, Advanced)
- [x] Color selection (White, Random, Black)
- [x] Material and positional evaluation
- [x] Piece-square tables for all pieces
- [x] Endgame detection
- [x] "vs Computer" badge during game

### Core Multiplayer (Phase 1)
- [x] Room codes (6-char alphanumeric)
- [x] Player assignment (white/black/spectator)
- [x] Color enforcement (can only move own pieces)
- [x] Chess clocks (bullet 1+0, blitz 3+2, rapid 10+0, unlimited)
- [x] Time forfeit detection
- [x] Promotion UI (piece selection modal)
- [x] Move history panel (synced via PGN across clients)
- [x] Game over detection (checkmate, stalemate, repetition, insufficient, 50-move)
- [x] Draw offer with accept/decline
- [x] Resign with confirmation
- [x] Rematch with color swap

### KROG Engine (Phase 1)
- [x] Full `server/src/krog/` module (12 files)
- [x] KROG Framework with 36 operators (`server/src/krog-framework/`)
- [x] Piece movement formulas
- [x] Special move formulas (castling, en passant, promotion)
- [x] Move explainer with KROG formulas
- [x] Illegal move explanations
- [x] FIDE article references
- [x] English/Norwegian bilingual support
- [x] R-type classification system (15 rule types)
- [x] R-type display in move explanations (purple badge)
- [x] R-type tooltips in Learn Mode
- [x] REST API endpoints for KROG framework

### Move Evaluation (Phase 7)
- [x] Position evaluator
- [x] Move suggestions with KROG scoring
- [x] Click-to-move on suggestions (click to play suggested move)
- [x] Opening book integration
- [x] Tactical pattern detection
- [x] Principle-based scoring

### Education (Phase 5)
- [x] Puzzle mode with 30+ puzzles
- [x] Opening explorer with 10 major openings
- [x] Learn mode (hover explanations)
- [x] Lessons UI with 19 lessons across 3 levels
- [x] Interactive quizzes with progress tracking

### Import/Export
- [x] PGN export (copy to clipboard) with proper headers
- [x] PGN download with game metadata (event, date, room, time control)
- [x] PGN import from clipboard
- [x] Load imported positions for analysis

### Social Features (Phase 6 - Partial)
- [x] Friends list with online status indicators
- [x] User search to find and add friends
- [x] Friend requests with accept/decline
- [x] Remove friends functionality
- [x] Direct challenges to online friends
- [x] Challenge with time control and variant selection
- [x] Accept/decline/cancel challenges
- [x] Game chat with real-time messaging
- [x] Chat visible to players and spectators
- [x] Spectator list showing current viewers
- [x] Spectator join/leave notifications

### UI/UX Polish
- [x] Board themes (8 color schemes: Classic, Green, Blue, Purple, Gray, Wood, Ice, Tournament)
- [x] Theme selector with visual previews
- [x] Theme persistence to localStorage
- [x] Piece themes (4 styles: Standard, Modern, Classic, Fancy)
- [x] Piece theme selector with visual previews
- [x] Sound effects (11 sounds: move, capture, check, castle, promote, gameStart, gameEnd, illegal, drawOffer, notify, timeout)
- [x] Web Audio API sound generation (no external files)
- [x] Sound toggle with persistence

---

## Project Structure

```
chess-project/
├── CLAUDE.md                    # THIS FILE
├── client/                      # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx              # Main app, lobby, game view
│   │   ├── index.css
│   │   ├── api/
│   │   │   └── auth.ts          # API client for auth
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Auth state management
│   │   ├── components/
│   │   │   ├── ChessBoard.tsx   # Board with drag-drop, learn mode, themes
│   │   │   ├── PuzzleMode.tsx   # Tactical puzzles
│   │   │   ├── OpeningExplorer.tsx # Opening tree browser
│   │   │   ├── LessonsMode.tsx  # Interactive lessons with quizzes
│   │   │   ├── AuthModal.tsx    # Login/Register modal
│   │   │   ├── UserPanel.tsx    # Profile, leaderboard, history
│   │   │   ├── MatchmakingPanel.tsx # Matchmaking queue UI
│   │   │   └── FriendsPanel.tsx # Friends list, requests, challenges
│   │   └── utils/
│   │       └── sounds.ts        # Web Audio API sound effects
├── server/                      # Express + Socket.IO + chess.js
│   ├── src/
│   │   ├── index.ts             # Server, all socket events
│   │   ├── db/
│   │   │   └── index.ts         # SQLite database module
│   │   ├── auth/
│   │   │   └── index.ts         # JWT authentication
│   │   ├── variants/
│   │   │   └── index.ts         # Chess960, 3-Check, KotH
│   │   ├── ai/
│   │   │   └── index.ts         # Computer opponent (minimax)
│   │   ├── krog/                # KROG engine module
│   │   │   ├── index.ts         # Exports
│   │   │   ├── types.ts         # Type definitions
│   │   │   ├── pieces.ts        # Piece movement rules
│   │   │   ├── special.ts       # Castling, en passant, promotion
│   │   │   ├── explainer.ts     # Move explanation generator
│   │   │   ├── evaluator.ts     # Position evaluation
│   │   │   ├── analyzer.ts      # Position analysis
│   │   │   ├── principles.ts    # Chess principles
│   │   │   ├── tactics.ts       # Tactical patterns
│   │   │   ├── scorer.ts        # Move scoring
│   │   │   ├── ranker.ts        # Move ranking
│   │   │   └── openingBook.ts   # Opening book data
│   │   └── krog-framework/      # KROG mathematical framework
│   │       ├── index.ts         # Main exports
│   │       ├── types.ts         # Framework types
│   │       ├── engine.ts        # KROGChessEngine class
│   │       ├── core-operators.ts    # 9 core operators (P,O,F,C,L,W,B,I,D)
│   │       ├── piece-logic.ts       # 8 piece logic operators
│   │       ├── board-logic.ts       # 8 board logic operators
│   │       ├── notation.ts          # 6 notation operators
│   │       ├── temporal.ts          # 5 temporal operators
│   │       ├── rtype-classifier.ts  # R-type classification
│   │       └── KROG-RULES.json      # 24 formal rules
│   └── data/
│       ├── puzzles.json         # 30+ tactical puzzles
│       ├── lessons.json         # 45 lessons (L0-L2)
│       ├── openings.json        # 10 major openings
│       └── krog.db              # SQLite database (gitignored)
└── krog/                        # Specifications
    ├── PHASE1-CORE.md
    ├── PHASE2-FEATURES.md
    ├── PHASE3-VARIANTS.md
    ├── PHASE4-AI-TRAINING.md
    ├── PHASE5-EDUCATION.md
    ├── PHASE6-SOCIAL.md
    └── PHASE7-EVALUATION.md
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Client | React | 19.2.0 |
| Client | TypeScript | 5.9.3 |
| Client | Vite | 7.2.4 |
| Client | socket.io-client | 4.8.1 |
| Server | Express | 5.2.1 |
| Server | Socket.IO | 4.8.1 |
| Server | chess.js | 1.4.0 |
| Server | better-sqlite3 | 11.x |
| Server | jsonwebtoken | 9.x |
| Server | bcryptjs | 2.x |

---

## Socket.IO Events

### Room Management
```typescript
// Client → Server
'create_room'     → { timeControl: 'bullet'|'blitz'|'rapid'|'unlimited' }
'join_room'       → { code: string }

// Server → Client
'room_created'    → { code: string, timeControl: TimeControl }
'room_joined'     → { code: string, timeControl: TimeControl }
'player_assigned' → { color: 'white'|'black'|'spectator' }
'player_joined'   → { color: string }
'player_left'     → { color: string }
```

### Game Play
```typescript
// Client → Server
'make_move'       → { roomId: string, move: { from, to, promotion? } }
'reset_game'      → roomId: string

// Server → Client
'game_state'      → { pgn: string, fen: string, lastMove: MoveInfo | null }
'clock_update'    → { white: number, black: number, activeColor: string|null }
'time_forfeit'    → { loser: string, winner: string }
'game_over'       → { reason: string, winner: string }
'error'           → { message: string }
```

### Draw & Resign
```typescript
// Client → Server
'offer_draw'      → { roomId: string }
'accept_draw'     → { roomId: string }
'decline_draw'    → { roomId: string }
'resign'          → { roomId: string }

// Server → Client
'draw_offered'    → { by: 'white'|'black' }
'draw_accepted'   → {}
'draw_declined'   → { by: 'white'|'black' }
'player_resigned' → { player: string, winner: string }
```

### Rematch
```typescript
// Client → Server
'request_rematch' → { roomId: string }
'accept_rematch'  → { roomId: string }
'decline_rematch' → { roomId: string }

// Server → Client
'rematch_requested' → { by: 'white'|'black' }
'rematch_accepted'  → {}
'rematch_declined'  → { by: 'white'|'black' }
```

### KROG Explanations
```typescript
// Client → Server
'explain_potential_move' → { roomId: string, from: string, to: string }
'suggest_moves'          → { roomId: string, context?: string, limit?: number }
'evaluate_position'      → { roomId: string }

// Server → Client
'move_explanation'           → MoveExplanation
'illegal_move'               → IllegalMoveExplanation
'potential_move_explanation' → MoveExplanation | IllegalMoveExplanation
'move_suggestions'           → { suggestions: MoveSuggestion[], ... }
'position_evaluation'        → PositionEvaluation
```

### Puzzles
```typescript
// Client → Server
'get_puzzles_list'    → { theme?: string, level?: number, limit?: number }
'get_puzzle'          → { id?: string, random?: boolean, theme?: string, level?: number }
'check_puzzle_move'   → { puzzleId: string, moveIndex: number, move: string }
'get_adjacent_puzzle' → { currentId: string, direction: 'next'|'prev' }

// Server → Client
'puzzles_list'        → { puzzles: [], total: number, themes: [], levels: [] }
'puzzle_data'         → { id, fen, themes, level, rating, solutionLength, ... }
'puzzle_move_result'  → { correct: boolean, completed: boolean, message: string, ... }
```

### Openings
```typescript
// Client → Server
'get_openings'         → void
'get_opening'          → { id: string }
'get_opening_by_moves' → { moves: string }

// Server → Client
'openings_list'  → { openings: [], total: number }
'opening_data'   → Opening
'opening_match'  → { opening: Opening|null, isExactMatch: boolean }
```

### Lessons
```typescript
// Client → Server
'get_lessons_overview' → void
'get_lesson'           → { id: string }
'get_first_lesson'     → void

// Server → Client
'lessons_overview'     → { levels: LevelSummary[], totalLessons: number }
'lesson_data'          → LessonData (content, quiz, krog formula, etc.)
```

### Friends
```typescript
// Client → Server
'get_friends'           → void
'search_users'          → { query: string }
'send_friend_request'   → { friendId: string }
'accept_friend_request' → { friendshipId: string }
'decline_friend_request'→ { friendshipId: string }
'remove_friend'         → { friendId: string }

// Server → Client
'friends_list'          → { friends: Friend[], incoming: FriendRequest[], outgoing: FriendRequest[] }
'users_search_result'   → { users: User[] }
'friend_request_sent'   → { success: boolean }
'friend_request_received' → { from: User }
'friend_request_accepted' → { friend: Friend }
'friend_removed'        → { friendId: string }
```

### Challenges
```typescript
// Client → Server
'challenge_friend'   → { friendId: string, timeControl: string, variant: string }
'accept_challenge'   → { challengeId: string, challengerId: string, challengerSocketId?: string }
'decline_challenge'  → { challengeId: string, challengerId: string }
'cancel_challenge'   → { friendId: string }

// Server → Client
'challenge_received' → { challengeId: string, from: User, timeControl: string, variant: string }
'challenge_sent'     → { to: User, timeControl: string, variant: string }
'challenge_accepted' → { roomCode: string, color: 'white'|'black' }
'challenge_declined' → { by: User }
'challenge_cancelled'→ { by: User }
```

### Game Chat
```typescript
// Client → Server
'chat_message' → { roomId: string, message: string }

// Server → Client
'game_chat'    → { username: string, message: string, timestamp: number, isSpectator: boolean }
```

### Spectators
```typescript
// Server → Client
'spectator_joined' → { id: string, username: string }
'spectator_left'   → { id: string, username: string }
'spectator_list'   → { spectators: { id: string, username: string }[] }
```

---

## Running the Project

### Terminal 1: Server
```bash
cd server
npm install
npm run dev
# → http://localhost:3000
```

### Terminal 2: Client
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

### Test Multiplayer
Open 2+ browser tabs to http://localhost:5173

---

## Current Limitations

| Issue | Impact | Priority |
|-------|--------|----------|
| Wikipedia piece images | External dependency | LOW |
| Chess960 castling | Uses standard rules (chess.js limitation) | LOW |
| No persistent sessions | Must re-login after refresh | LOW |

---

## Future Phases

### Phase 6: Community (Remaining)
- [x] Friends list (DONE)
- [x] Direct challenges (DONE)
- [x] Game chat (DONE)
- [ ] Clubs
- [ ] Tournaments
- [ ] Leagues

### Phase 4: AI Training (Not Started)
- [ ] HRM (Human Reasoning Model)
- [ ] Neural governance
- [ ] Training data collection

---

## Code Quality Notes

**Good patterns:**
- Server as source of truth (client chess.js only for UI)
- Functional React components with hooks
- Clean separation (ChessBoard is presentational)
- TypeScript throughout
- KROG engine is well-modularized
- Web Audio API for sounds (no external dependencies)
- localStorage for user preferences (theme, sound, lesson progress)
- JWT authentication with bcrypt password hashing
- SQLite database with prepared statements
- Modular server architecture (db, auth, variants, ai, krog)

**Current state:**
- Phase 1-3 feature-complete + Play vs Computer + Social features
- User accounts with ELO rating and matchmaking
- Chess variants (Chess960, 3-Check, King of the Hill)
- AI opponent with three difficulty levels
- Bilingual support (EN/NO)
- Learn mode with hover explanations
- Comprehensive move explanations
- Polished UI with board/piece themes and sound feedback
- Friends list with direct challenges
- Game chat for players and spectators
- PGN import/export

---

## KROG Quick Reference

**Modal Operators (9 Core):**
- `P` = Permitted (may do)
- `O` = Obligated (must do)
- `F` = Forbidden (must not do)
- `C` = Claim, `L` = Liberty, `W` = Power, `B` = Immunity, `I` = Disability, `D` = Liability

**T-Types:**
- `T1` = Player discretion (normal moves)
- `T2` = Conditional (castling, en passant)
- `T3` = Mandatory (must escape check)

**R-Types (15 Rule Classifications):**
| R-Type | Description | Example |
|--------|-------------|---------|
| R1 | Asymmetric movement | Pawn direction |
| R2 | Intransitive | King cannot be captured |
| R3 | Path-dependent | Sliding pieces (Q/R/B) |
| R4 | Capture-only | Pawn diagonal capture |
| R5 | Non-capture | Pawn forward move |
| R6 | First move special | Pawn double push |
| R7 | Temporal window | En passant |
| R8 | Mandatory transformation | Pawn promotion |
| R9 | Compound move | Castling |
| R10 | Conditional | Check response |
| R11 | Discrete jump | Knight movement |
| R12 | State-dependent | Castling rights |
| R13 | Terminal state | Checkmate/stalemate |
| R14 | Repetition | Threefold repetition |
| R15 | Counter-based | 50-move rule |

**KROG API Endpoints:**
```
GET  /api/krog/info     → Framework info (36 operators, 15 R-types)
POST /api/krog/classify → { piece, flags, san } → R-type classification
```

**Example - Knight Move:**
```
KROG:   P(Nf3) <-> L_shape(g1, f3) AND NOT blocked(f3)
T-Type: T1 (player discretion)
R-Type: R11_discrete_jump
FIDE:   Article 3.6
EN:     "Knight may move to f3 - L-shape pattern, square not blocked"
NO:     "Springer kan flytte til f3 - L-form, ruten er ikke blokkert"
```

**Example - Pawn Promotion:**
```
KROG:   P(d8) <-> reaches_eighth AND piece_chosen
T-Type: T1 (player discretion)
R-Type: R8_mandatory_transformation
FIDE:   Article 3.7.e
EN:     "Pawn reaches last rank and must be promoted"
NO:     "Bonde når siste rad og må forfremmes"
```
