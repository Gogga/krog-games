# KROG Chess

## 🚀 QUICK START FOR CLAUDE CODE

**Current State:** Working multiplayer chess MVP. Server validates moves, clients sync via Socket.IO.

**What's Missing:** Room codes, player assignment, clocks, KROG explanations.

**Spec Files:** `krog/PHASE1-7.md` - Complete specifications. READ BEFORE IMPLEMENTING.

**Data Files:** `server/data/*.json` - Puzzles, lessons, openings ready to use.

---

## ⚡ NEXT TASKS (Priority Order)

### Task 1: Room System & Player Assignment
**Status:** 🔴 Not Started  
**Spec:** `krog/PHASE1-CORE.md` §1-2

Current problem: Hardcoded `ROOM_ID = 'game_room_1'` in App.tsx

Fix:
- [ ] Generate unique room codes (6 chars: `[A-Z0-9]{6}`)
- [ ] Track players per room: `Map<roomId, { white?: socketId, black?: socketId }>`
- [ ] First joiner = white, second = black, others = spectators
- [ ] Only allow player to move their own color
- [ ] Add "Create Room" / "Join Room" UI

**Files to modify:**
- `server/src/index.ts` - Add room management, player tracking
- `client/src/App.tsx` - Add room UI, track assigned color

### Task 2: Chess Clocks
**Status:** 🔴 Not Started  
**Spec:** `krog/PHASE1-CORE.md` §3

- [ ] Add clock state: `{ white: ms, black: ms, lastUpdate: timestamp }`
- [ ] Time controls: bullet (1+0), blitz (3+2), rapid (10+0)
- [ ] Clock switches on valid move
- [ ] Time forfeit detection
- [ ] Display clocks in UI (countdown timers)

**Files to modify:**
- `server/src/index.ts` - Clock logic, forfeit detection
- `client/src/App.tsx` - Clock display component

### Task 3: Promotion UI
**Status:** 🔴 Not Started (currently auto-queens)

Current: `promotion: 'q'` hardcoded in ChessBoard.tsx

- [ ] Detect when move is a promotion
- [ ] Show piece selection modal (Q/R/B/N)
- [ ] Send selected piece with move

### Task 4: KROG Rule Engine (CORE DIFFERENTIATOR)
**Status:** 🔴 Not Started  
**Spec:** `krog/PHASE1-CORE.md` §9-10

Create `server/src/krog/` module:
- [ ] `types.ts` - T-types, R-types, Modal operators
- [ ] `pieces.ts` - Movement rules for all 6 pieces
- [ ] `special.ts` - Castling, en passant, promotion formulas
- [ ] `validator.ts` - Validate moves with KROG formulas
- [ ] `explainer.ts` - Generate human-readable explanations

### Task 5: Move Explanation UI
**Status:** 🔴 Not Started  
**Spec:** `krog/PHASE1-CORE.md` §9

- [ ] "Why legal?" button shows KROG formula
- [ ] "Why illegal?" on rejected moves
- [ ] FIDE article reference
- [ ] English/Norwegian support

### Task 6: Move Evaluation System
**Status:** 🔴 Not Started  
**Spec:** `krog/PHASE7-EVALUATION.md`

The mathematical model for move suggestions:
- [ ] PostgreSQL schema (PHASE7 §7.2)
- [ ] Position/move statistics
- [ ] KROG principle detection
- [ ] Combined scoring: `Score = α·Stats + β·Engine + γ·KROG`

---

## 📁 Project Structure

```
chess-project/
├── CLAUDE.md                    # THIS FILE
├── client/                      # React 19 + Vite + TypeScript
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx             # Entry point
│       ├── App.tsx              # Main component, Socket.IO
│       ├── index.css            # Styles
│       └── components/
│           └── ChessBoard.tsx   # Board with drag-drop
├── server/                      # Express + Socket.IO + chess.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   └── index.ts             # Server, game logic
│   └── data/                    # JSON data files
│       ├── puzzles.json         # 500+ puzzles
│       ├── lessons.json         # Level 0-2 lessons
│       └── openings.json        # 62 openings
└── krog/                        # Specifications
    ├── PHASE1-CORE.md           # Rules, movement, notation
    ├── PHASE2-FEATURES.md       # Matchmaking, rating
    ├── PHASE3-VARIANTS.md       # Chess960, etc.
    ├── PHASE4-AI-TRAINING.md    # HRM, neural governance
    ├── PHASE5-EDUCATION.md      # Learning, puzzles
    ├── PHASE6-SOCIAL.md         # Clubs, leagues
    ├── PHASE7-EVALUATION.md     # Stats, KROG scoring
    └── data/                    # YAML source files
```

---

## 🔧 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Client | React | 19.2.0 |
| Client | TypeScript | 5.9.3 |
| Client | Vite | 7.2.4 |
| Client | socket.io-client | 4.8.1 |
| Server | Express | 5.2.1 |
| Server | Socket.IO | 4.8.1 |
| Server | chess.js | 1.4.0 |

---

## ✅ What Already Works

Based on actual code analysis:

| Feature | Status | Location |
|---------|--------|----------|
| Socket.IO connection | ✅ | App.tsx, server/index.ts |
| Server-side move validation | ✅ | chess.js in server |
| Room-based game state | ✅ | `Map<roomId, Chess>` |
| FEN synchronization | ✅ | `game_state` event |
| Click-to-move | ✅ | ChessBoard.tsx |
| Drag-and-drop | ✅ | ChessBoard.tsx |
| Valid move dots | ✅ | ChessBoard.tsx |
| Capture rings | ✅ | ChessBoard.tsx |
| Last move highlight | ✅ | Yellow squares |
| Selected piece highlight | ✅ | Yellow background |
| Board coordinates | ✅ | Rank/file labels |
| Game status display | ✅ | Turn, check, game over |
| Reset button | ✅ | `reset_game` event |
| Board orientation support | ✅ | `orientation` prop |

---

## ❌ Current Limitations

| Issue | Impact | Fix Priority |
|-------|--------|--------------|
| Hardcoded room `game_room_1` | Can't have multiple games | HIGH |
| No player assignment | Anyone moves any color | HIGH |
| Auto-queen promotion | No choice for underpromotion | MEDIUM |
| No chess clocks | No time pressure | HIGH |
| No move history panel | Can't review game | MEDIUM |
| No KROG validation | Missing key feature | HIGH |
| Wikipedia piece images | External dependency | LOW |

---

## 📡 Socket.IO Events (Current)

### Client → Server
```typescript
'join_game'   → roomId: string
'make_move'   → { roomId: string, move: { from, to, promotion? } }
'reset_game'  → roomId: string
```

### Server → Client
```typescript
'game_state'  → fen: string
'error'       → message: string
```

### Events to Add
```typescript
// Room management
'create_room'      → { timeControl: string }
'room_created'     → { roomId: string, code: string }
'join_room'        → { code: string }
'player_assigned'  → { color: 'white' | 'black' | 'spectator' }

// Clocks
'clock_update'     → { white: number, black: number }
'time_forfeit'     → { loser: 'white' | 'black' }

// KROG
'move_explanation' → { move: Move, krog: KROGResult }
```

---

## 🧠 KROG Integration Pattern

When validating moves, add KROG explanation layer:

```typescript
// In server/src/index.ts, modify make_move handler:

socket.on('make_move', ({ roomId, move }) => {
  const game = games.get(roomId);
  if (!game) return;
  
  try {
    // 1. chess.js validates legality
    const result = game.move(move);
    
    if (result) {
      // 2. KROG explains WHY it's legal
      const krog = krogEngine.explain(game, result);
      
      // 3. Broadcast state + explanation
      io.to(roomId).emit('game_state', { 
        fen: game.fen(),
        lastMove: result,
        krog: {
          formula: krog.formula,     // "P(Nf3) ↔ L_shape ∧ ¬blocked"
          tType: krog.tType,         // "T₁"
          fide: krog.fideArticle,    // "3.5"
          explanation: krog.text     // "Knight moves in L-shape..."
        }
      });
    }
  } catch (e) {
    // KROG can explain WHY it's illegal
    const krog = krogEngine.explainIllegal(game, move);
    socket.emit('error', { 
      message: 'Invalid move',
      krog: krog
    });
  }
});
```

---

## 📖 Spec Quick Reference

| Need | Spec File | Section |
|------|-----------|---------|
| Rooms, players, clocks | PHASE1-CORE.md | §1-3 |
| Piece movement rules | PHASE1-CORE.md | §9 |
| Special moves | PHASE1-CORE.md | §10 |
| Game termination | PHASE1-CORE.md | §11 |
| Matchmaking, ELO | PHASE2-FEATURES.md | §1-2 |
| Variants | PHASE3-VARIANTS.md | All |
| AI, HRM | PHASE4-AI-TRAINING.md | All |
| Puzzles, lessons | PHASE5-EDUCATION.md | §6-7 |
| Clubs, leagues | PHASE6-SOCIAL.md | All |
| Move statistics | PHASE7-EVALUATION.md | All |

### Data Files
| Data | File | Records |
|------|------|---------|
| Puzzles | `server/data/puzzles.json` | 30+ (sample) |
| Lessons | `server/data/lessons.json` | 20+ (L0-L2) |
| Openings | `server/data/openings.json` | 10 major |

---

## 🏃 Running the Project

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

## 🎯 Implementation Checklist

### Phase 1: Core Multiplayer
- [ ] Room codes (6-char unique)
- [ ] Player assignment (white/black/spectator)
- [ ] Enforce color restrictions
- [ ] Chess clocks
- [ ] Promotion UI
- [ ] Move history panel

### Phase 2: KROG Engine
- [ ] Create `server/src/krog/` module
- [ ] Piece movement formulas
- [ ] Special move formulas
- [ ] Move explainer
- [ ] Explanation UI

### Phase 3: Features
- [ ] Matchmaking queue
- [ ] ELO rating
- [ ] Themes
- [ ] PGN export

### Phase 4: Content
- [ ] Puzzle mode (load from JSON)
- [ ] Learning tutorials
- [ ] Opening explorer

### Phase 5: Evaluation
- [ ] Database schema
- [ ] Position statistics
- [ ] KROG scoring
- [ ] Move suggestions

---

## 💡 Code Quality Notes

**Good patterns in current code:**
- Server as source of truth (client Chess.js only for UI)
- Functional React components
- Clean separation (ChessBoard is purely presentational)
- TypeScript throughout

**Areas to improve:**
- Add TypeScript interfaces for Socket events
- Extract magic strings to constants
- Add error boundaries
- Consider React Query or Zustand for state

---

## 📈 Scalability (Read SCALABILITY.md)

> "Scalability cannot be an afterthought." — Werner Vogels, CTO AWS

**Current limitation:** In-memory `Map<roomId, Chess>` doesn't scale.

**Growth axes identified:**
| Axis | Now | Target |
|------|-----|--------|
| Concurrent games | 10 | 1,000,000 |
| Connected players | 20 | 10,000,000 |
| Position database | 0 | 10 billion |

**Quick wins (do early):**
1. **Add Redis** for game state (1 hour)
2. **Add Socket.IO Redis adapter** for horizontal scaling (30 min)
3. **Add health check endpoint** (10 min)

**Architecture principle:** Stateless servers + Redis state + PostgreSQL persistence

See `SCALABILITY.md` for full architecture diagrams and implementation phases.

---

## 🤝 Working With Claude Code

**Treat Claude Code as a teammate, not an automaton.**

### Recommended Workflow

1. **Start in Planning Mode**
   ```bash
   claude --plan
   ```
   Draft the approach together before coding.

2. **Use GitHub Issues as Context Anchors**
   - Each Task in this file → GitHub Issue
   - Group related issues → Epic
   - Clear acceptance criteria per issue

3. **Structured Task Format**
   ```markdown
   ## Issue: Room System
   **Epic:** Phase 1 - Core Multiplayer
   **Objective:** Generate unique room codes, assign players
   **Files:** server/src/index.ts, client/src/App.tsx
   **Acceptance Criteria:**
   - [ ] 6-char alphanumeric room codes
   - [ ] First joiner = white, second = black
   - [ ] Third+ = spectators
   - [ ] UI shows room code for sharing
   **Architectural Notes:** See PHASE1-CORE.md §1-2
   ```

4. **Let Claude Code Self-Validate**
   After implementation, ask:
   > "Review against the acceptance criteria. Did we miss anything?"

5. **Context Persistence**
   - CLAUDE.md = stable project context
   - GitHub Issues = task-specific context
   - Spec files (PHASE1-7.md) = detailed requirements

### Why This Works

From an experienced engineering leader:

> *"Great tech leaders don't micromanage. They set clear objectives, establish workflows, remove blockers, and trust their teams to deliver. That's precisely what works with agent teammates—applying decades of engineering management wisdom to a new kind of hybrid team."*

---

## 🔗 KROG Quick Reference

**Modal Operators:**
- `P` = Permitted (may do)
- `O` = Obligated (must do)
- `F` = Forbidden (must not do)

**Example - Knight Move:**
```
KROG:  P(Nf3) ↔ L_shape(g1, f3) ∧ ¬blocked(f3)
T-Type: T₁ (player discretion)
FIDE:  Article 3.5
EN:    "Knight may move to f3 - L-shape, unblocked"
NO:    "Springer kan flytte til f3 - L-form, ikke blokkert"
```
