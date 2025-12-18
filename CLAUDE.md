# KROG Chess

## QUICK START FOR CLAUDE CODE

**Current State:** Feature-complete multiplayer chess with user accounts, ELO rating, matchmaking, chess variants, Play vs Computer, KROG move explanations, puzzles, opening explorer, lessons, and polished UI/UX.

**What's Implemented:** All of Phase 1-3 + Play vs Computer. Room system, clocks, user accounts, ELO rating, matchmaking, Chess960/3-Check/KotH variants, AI opponent, KROG engine, move explanations, puzzles, openings, lessons, PGN export, board themes, sound effects.

**What's Missing:** Clubs, tournaments, leagues (Phase 6).

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
- [x] Piece movement formulas
- [x] Special move formulas (castling, en passant, promotion)
- [x] Move explainer with KROG formulas
- [x] Illegal move explanations
- [x] FIDE article references
- [x] English/Norwegian bilingual support

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

### Export
- [x] PGN export (copy to clipboard) with proper headers
- [x] PGN download with game metadata (event, date, room, time control)

### UI/UX Polish
- [x] Board themes (8 color schemes: Classic, Green, Blue, Purple, Gray, Wood, Ice, Tournament)
- [x] Theme selector with visual previews
- [x] Theme persistence to localStorage
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
│   │   │   └── MatchmakingPanel.tsx # Matchmaking queue UI
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
│   │   └── krog/                # KROG engine module
│   │       ├── index.ts         # Exports
│   │       ├── types.ts         # Type definitions
│   │       ├── pieces.ts        # Piece movement rules
│   │       ├── special.ts       # Castling, en passant, promotion
│   │       ├── explainer.ts     # Move explanation generator
│   │       ├── evaluator.ts     # Position evaluation
│   │       ├── analyzer.ts      # Position analysis
│   │       ├── principles.ts    # Chess principles
│   │       ├── tactics.ts       # Tactical patterns
│   │       ├── scorer.ts        # Move scoring
│   │       ├── ranker.ts        # Move ranking
│   │       └── openingBook.ts   # Opening book data
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

## Future Phases (Not Started)

### Phase 6: Community
- [ ] Clubs
- [ ] Tournaments
- [ ] Leagues

### Phase 4: AI Training
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
- Phase 1-3 feature-complete + Play vs Computer
- User accounts with ELO rating and matchmaking
- Chess variants (Chess960, 3-Check, King of the Hill)
- AI opponent with three difficulty levels
- Bilingual support (EN/NO)
- Learn mode with hover explanations
- Comprehensive move explanations
- Polished UI with themes and sound feedback

---

## KROG Quick Reference

**Modal Operators:**
- `P` = Permitted (may do)
- `O` = Obligated (must do)
- `F` = Forbidden (must not do)

**T-Types:**
- `T1` = Player discretion (normal moves)
- `T2` = Conditional (castling, en passant)
- `T3` = Mandatory (must escape check)

**Example - Knight Move:**
```
KROG:   P(Nf3) <-> L_shape(g1, f3) AND NOT blocked(f3)
T-Type: T1 (player discretion)
FIDE:   Article 3.6
EN:     "Knight may move to f3 - L-shape pattern, square not blocked"
NO:     "Springer kan flytte til f3 - L-form, ruten er ikke blokkert"
```
