# KROG Chess - GitHub Issues

Use these as GitHub Issues to maintain context across Claude Code sessions.

---

## Epic: Phase 1 - Core Multiplayer

### Issue #1: Room System & Player Assignment

**Epic:** Phase 1 - Core Multiplayer  
**Priority:** HIGH  
**Spec Reference:** `krog/PHASE1-CORE.md` §1-2

#### Objective
Replace hardcoded `game_room_1` with proper room management and player color assignment.

#### Current State
- `App.tsx` line 9: `const ROOM_ID = 'game_room_1'` (hardcoded)
- Anyone can move any color
- No way to share game links

#### Acceptance Criteria
- [ ] Generate unique 6-character room codes (`[A-Z0-9]{6}`)
- [ ] Server tracks players per room: `Map<roomId, { white?: socketId, black?: socketId }>`
- [ ] First joiner assigned white, second assigned black
- [ ] Third+ joiners become spectators (view only)
- [ ] Players can only move their assigned color
- [ ] UI shows room code for sharing
- [ ] "Create Room" and "Join Room" buttons in UI
- [ ] URL updates with room code (e.g., `?room=ABC123`)

#### Files to Modify
- `server/src/index.ts` - Room management, player tracking
- `client/src/App.tsx` - Room UI, color assignment state

#### Socket Events to Add
```typescript
// Client → Server
'create_room' → { }
'join_room'   → { code: string }

// Server → Client  
'room_created'     → { code: string }
'player_assigned'  → { color: 'white' | 'black' | 'spectator' }
'room_full'        → { message: string }
```

#### Testing
1. Open two browser tabs
2. Tab 1: Create room → should show code, be assigned white
3. Tab 2: Join with code → should be assigned black
4. Tab 1 should only move white pieces
5. Tab 2 should only move black pieces

---

### Issue #2: Chess Clocks

**Epic:** Phase 1 - Core Multiplayer  
**Priority:** HIGH  
**Spec Reference:** `krog/PHASE1-CORE.md` §3

#### Objective
Add time controls with countdown clocks and forfeit detection.

#### Acceptance Criteria
- [ ] Time control selection: bullet (1+0), blitz (3+2), rapid (10+0)
- [ ] Clock state: `{ white: ms, black: ms, increment: ms }`
- [ ] Clock starts when game begins (both players present)
- [ ] Active player's clock counts down
- [ ] Clock switches on valid move (add increment)
- [ ] Time forfeit detection (clock hits 0 = loss)
- [ ] Clock display in UI (MM:SS format)
- [ ] Low time warning (< 30 seconds = red)

#### Files to Modify
- `server/src/index.ts` - Clock logic, interval timer, forfeit
- `client/src/App.tsx` - Clock display component

#### Socket Events
```typescript
'clock_update'  → { white: number, black: number }
'time_forfeit'  → { loser: 'white' | 'black' }
'game_start'    → { timeControl: { initial: ms, increment: ms } }
```

---

### Issue #3: Promotion UI

**Epic:** Phase 1 - Core Multiplayer  
**Priority:** MEDIUM

#### Objective
Replace auto-queen with piece selection modal.

#### Current State
- `ChessBoard.tsx`: `promotion: 'q'` hardcoded

#### Acceptance Criteria
- [ ] Detect when move is a pawn promotion
- [ ] Show modal with Q/R/B/N options
- [ ] Only complete move after selection
- [ ] Modal positioned near promotion square
- [ ] Keyboard shortcuts (q/r/b/n)

#### Files to Modify
- `client/src/components/ChessBoard.tsx`
- `client/src/components/PromotionModal.tsx` (new)

---

### Issue #4: Move History Panel

**Epic:** Phase 1 - Core Multiplayer  
**Priority:** MEDIUM

#### Acceptance Criteria
- [ ] Show moves in algebraic notation (1. e4 e5 2. Nf3 ...)
- [ ] Scrollable list
- [ ] Click move to jump to that position (optional)
- [ ] Current move highlighted
- [ ] Export as PGN button

---

## Epic: Phase 2 - KROG Engine

### Issue #5: KROG Types Module

**Epic:** Phase 2 - KROG Engine  
**Priority:** HIGH  
**Spec Reference:** `krog/PHASE1-CORE.md` §9-10

#### Objective
Create TypeScript types for KROG rule system.

#### Acceptance Criteria
- [ ] Create `server/src/krog/types.ts`
- [ ] T-types enum (T₁ through T₇)
- [ ] R-types enum (R₁ through R₃₅)
- [ ] Modal operators (P, O, F)
- [ ] KROGResult interface with formula, explanation, fide article

#### File Structure
```
server/src/krog/
├── types.ts      ← This issue
├── pieces.ts     ← Issue #6
├── special.ts    ← Issue #7
├── explainer.ts  ← Issue #8
└── index.ts      ← Re-exports
```

---

### Issue #6: Piece Movement Formulas

**Epic:** Phase 2 - KROG Engine  
**Spec Reference:** `krog/PHASE1-CORE.md` §9

#### Acceptance Criteria
- [ ] King: `P(K) ↔ adjacent ∧ ¬attacked`
- [ ] Queen: `P(Q) ↔ (rank ∨ file ∨ diagonal) ∧ clear_path`
- [ ] Rook: `P(R) ↔ (rank ∨ file) ∧ clear_path`
- [ ] Bishop: `P(B) ↔ diagonal ∧ clear_path`
- [ ] Knight: `P(N) ↔ L_shape`
- [ ] Pawn: `P(P) ↔ forward ∨ (start ∧ double) ∨ capture_diagonal`

---

### Issue #7: Special Moves (Castling, En Passant, Promotion)

**Epic:** Phase 2 - KROG Engine  
**Spec Reference:** `krog/PHASE1-CORE.md` §10

#### Acceptance Criteria
- [ ] Castling formula with all 5 conditions
- [ ] En passant with temporal operator X⁻¹
- [ ] Promotion with piece options
- [ ] FIDE article references for each

---

### Issue #8: Move Explainer

**Epic:** Phase 2 - KROG Engine

#### Acceptance Criteria
- [ ] `explainLegalMove(game, move)` → KROGResult
- [ ] `explainIllegalMove(game, move)` → KROGResult
- [ ] English and Norwegian explanations
- [ ] FIDE article citations

---

### Issue #9: Explanation UI

**Epic:** Phase 2 - KROG Engine  
**Priority:** MEDIUM

#### Acceptance Criteria
- [ ] "Why legal?" button on each move
- [ ] Show KROG formula in tooltip/modal
- [ ] FIDE article link
- [ ] Language toggle (EN/NO)

---

## How to Use These Issues

1. **Create a GitHub repo** for `krog-chess`
2. **Create Issues** from these templates
3. **Create Epics** as GitHub Projects or Milestones
4. **In Claude Code**, reference issues:
   ```
   Working on Issue #1: Room System.
   See acceptance criteria above.
   Start with server/src/index.ts.
   ```
5. **Submit PRs** per issue for clean history
