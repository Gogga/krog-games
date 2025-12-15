# KROG Chess Phase 3: Variants

## Overview

This document formalizes chess variants using KROG universal rules. Each variant extends or modifies the standard FIDE rules from Phase 1.

**Variants Covered:**
1. **Chess960 (Fischer Random)** - Randomized back rank
2. **Crazyhouse** - Captured pieces can be dropped
3. **Bughouse** - Team variant with piece sharing
4. **Three-Check** - Win by delivering 3 checks
5. **King of the Hill** - Win by reaching center
6. **Atomic** - Captures cause explosions
7. **Horde** - Asymmetric: pawns vs pieces
8. **Racing Kings** - Race to 8th rank

**Namespace**: `https://krog-rules.org/chess/variants/`

---

## 1. Chess960 (Fischer Random)

### 1.1 Overview

```yaml
chess960:
  iri: "https://krog-rules.org/chess/variants/chess960"
  aliases: ["Fischer Random", "FR", "960"]
  inventor: "Bobby Fischer (1996)"
  fide_recognized: true
  
  concept: "Randomize starting position to reduce opening theory"
  positions: 960  # Hence the name
  
  standard_rules_modified:
    - initial_position: "randomized back rank"
    - castling: "modified castling rules"
  
  standard_rules_unchanged:
    - piece_movement
    - check_checkmate
    - en_passant
    - promotion
    - draw_conditions
```

### 1.2 Position Generation

```yaml
position_generation:
  iri: "https://krog-rules.org/chess/variants/chess960/position"
  
  constraints:
    bishops_opposite_colors: "∀pos: color(bishop_1) ≠ color(bishop_2)"
    king_between_rooks: "∀pos: file(rook_a) < file(king) < file(rook_h)"
    black_mirrors_white: "∀pos: black_setup = mirror(white_setup)"
  
  formal: |
    valid_960_position(pos) ↔ 
      bishops_opposite_colors(pos) ∧
      king_between_rooks(pos) ∧
      all_back_rank_pieces_present(pos)
  
  algorithm:
    step1: "Place bishops on opposite colors (4 × 4 = 16 ways)"
    step2: "Place queen on remaining 6 squares (6 ways)"
    step3: "Place knights on remaining 5 squares (C(5,2) = 10 ways)"
    step4: "Place king between rooks on remaining 3 squares (1 way)"
    total: "16 × 6 × 10 × 1 = 960 positions"
  
  position_id:
    range: [0, 959]
    standard_chess: 518  # Position ID for standard starting position
    
  implementation: |
    function generate960Position(id: number): Position {
      // Scharnagl's method
      const n = id;
      const bishop1 = (n % 4) * 2 + 1;  // Light square: b, d, f, h
      const bishop2 = Math.floor(n / 4) % 4 * 2;  // Dark square: a, c, e, g
      // ... continue with queen, knights, king+rooks
    }
```

### 1.3 Chess960 Castling

```yaml
chess960_castling:
  iri: "https://krog-rules.org/chess/variants/chess960/castling"
  
  key_difference: "King and rook may start on any files, but end on standard squares"
  
  destination_squares:
    kingside:
      king_ends: "g1 (white) | g8 (black)"
      rook_ends: "f1 (white) | f8 (black)"
    queenside:
      king_ends: "c1 (white) | c8 (black)"
      rook_ends: "d1 (white) | d8 (black)"
  
  prerequisites:
    same_as_standard:
      - king_never_moved: "G[past](¬moved(king))"
      - rook_never_moved: "G[past](¬moved(rook))"
      - not_in_check: "¬check(king)"
      - path_not_attacked: "∀sq ∈ king_traverse: ¬attacked(sq)"
    
    modified:
      - path_clear: "All squares king/rook traverse or end on must be empty (except K/R themselves)"
  
  formal: |
    P(castle_960) ↔ 
      ¬moved(king) ∧ 
      ¬moved(rook) ∧ 
      ¬check(king) ∧
      ∀sq ∈ king_path: ¬attacked(sq) ∧
      ∀sq ∈ (king_traverse ∪ rook_traverse): (empty(sq) ∨ sq = king_pos ∨ sq = rook_pos)
  
  edge_cases:
    king_on_destination: "King on g1: only rook moves for kingside castle"
    rook_on_destination: "Rook on f1: only king moves for kingside castle"
    adjacent_king_rook: "King on f1, Rook on g1: they swap places"
  
  notation:
    standard: "O-O (kingside), O-O-O (queenside)"
    alternative: "Kg1 or Kc1 (destination square)"
```

### 1.4 Chess960 TypeScript

```typescript
interface Chess960Position {
  id: number;  // 0-959
  pieces: PiecePosition[];  // Back rank arrangement
  fen: string;
}

interface Chess960CastlingRights {
  whiteKingside: { kingFile: string; rookFile: string } | null;
  whiteQueenside: { kingFile: string; rookFile: string } | null;
  blackKingside: { kingFile: string; rookFile: string } | null;
  blackQueenside: { kingFile: string; rookFile: string } | null;
}

function generate960Position(id: number): Chess960Position;
function get960PositionId(backRank: string): number;
function isValidCastling960(
  position: Position,
  side: 'kingside' | 'queenside',
  color: Color
): boolean;

// FEN for Chess960 uses Shredder-FEN or X-FEN
// Standard FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
// Chess960 FEN: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w HAha - 0 1"
// (Files of rooks instead of KQkq)
```

---

## 2. Crazyhouse

### 2.1 Overview

```yaml
crazyhouse:
  iri: "https://krog-rules.org/chess/variants/crazyhouse"
  
  concept: "Captured pieces switch sides and can be dropped onto the board"
  origin: "Combination of chess and shogi"
  
  standard_rules_modified:
    - captures: "Captured pieces go to hand, not removed"
    - new_move_type: "Drop piece from hand onto empty square"
    - promotion: "Promoted pieces revert to pawn when captured"
  
  standard_rules_unchanged:
    - piece_movement
    - check_checkmate
    - castling
    - en_passant
```

### 2.2 Capture Rules

```yaml
crazyhouse_capture:
  iri: "https://krog-rules.org/chess/variants/crazyhouse/capture"
  
  capture_effect:
    standard: "Piece removed from board"
    crazyhouse: "Piece changes color and goes to captor's hand"
  
  formal: |
    capture(piece_A, piece_B) → 
      remove(piece_B, board) ∧
      change_color(piece_B) ∧
      add(piece_B, hand(owner(piece_A)))
  
  promoted_pieces:
    rule: "Promoted pieces revert to pawn when captured"
    formal: "capture(X, promoted_pawn) → add(pawn, hand) (not queen/rook/etc)"
    example: "Capture promoted queen → opponent gets pawn in hand"
```

### 2.3 Drop Rules

```yaml
crazyhouse_drop:
  iri: "https://krog-rules.org/chess/variants/crazyhouse/drop"
  t_type: T2  # Limited by conditions
  
  basic_rules:
    - empty_square: "Can only drop on empty squares"
    - from_hand: "Can only drop pieces in your hand"
    - instead_of_move: "Drop counts as your move"
  
  pawn_restrictions:
    no_first_rank: "F(drop_pawn, rank_1)"
    no_eighth_rank: "F(drop_pawn, rank_8)"
    formal: "P(drop_pawn, sq) → rank(sq) ∈ [2,7]"
  
  check_rules:
    can_drop_with_check: "P(drop_piece, gives_check)"
    can_drop_to_block: "P(drop_piece, blocks_check)"
    cannot_drop_checkmate: "Some variants: F(drop_piece, immediate_checkmate)"
  
  formal: |
    P(drop, piece, square) ↔ 
      in_hand(piece) ∧
      empty(square) ∧
      (piece ≠ pawn ∨ rank(square) ∈ [2,7]) ∧
      ¬results_in_self_check
  
  notation:
    format: "P@e4"  # Piece @ square
    examples:
      - "N@f3"   # Drop knight on f3
      - "P@d5"   # Drop pawn on d5
      - "Q@h7+"  # Drop queen on h7 with check
```

### 2.4 Crazyhouse TypeScript

```typescript
interface CrazyhouseGame extends ChessGame {
  whiteHand: PieceType[];  // Pieces white can drop
  blackHand: PieceType[];  // Pieces black can drop
}

interface CrazyhouseMove {
  type: 'move' | 'drop';
  // For moves
  from?: Square;
  to?: Square;
  // For drops
  piece?: PieceType;
  square?: Square;
  // Common
  promotion?: PieceType;
  gives_check?: boolean;
}

function isValidDrop(
  game: CrazyhouseGame,
  piece: PieceType,
  square: Square
): boolean {
  // Check piece in hand
  const hand = game.turn === 'w' ? game.whiteHand : game.blackHand;
  if (!hand.includes(piece)) return false;
  
  // Check square empty
  if (game.board[square]) return false;
  
  // Check pawn restrictions
  if (piece === 'p') {
    const rank = parseInt(square[1]);
    if (rank === 1 || rank === 8) return false;
  }
  
  // Check doesn't result in self-check
  return !resultsInSelfCheck(game, { type: 'drop', piece, square });
}

// Crazyhouse FEN includes holdings
// Standard: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
// Crazyhouse: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[QRBNPqrbnp] w KQkq - 0 1"
// [QRBNPqrbnp] = pieces in hand (uppercase=white, lowercase=black)
```

---

## 3. Bughouse

### 3.1 Overview

```yaml
bughouse:
  iri: "https://krog-rules.org/chess/variants/bughouse"
  
  concept: "Team variant: 2v2 on two boards with piece sharing"
  players: 4  # Two teams of 2
  boards: 2
  
  team_structure:
    board_A: "Player 1 (white) vs Player 3 (black)"
    board_B: "Player 2 (black) vs Player 4 (white)"
    teams:
      team_1: ["Player 1", "Player 2"]  # P1 white on A, P2 black on B
      team_2: ["Player 3", "Player 4"]  # P3 black on A, P4 white on B
  
  piece_sharing:
    rule: "Captured pieces go to teammate who can drop them"
    flow_A: "P1 captures → P2 receives (to drop as black)"
    flow_B: "P2 captures → P1 receives (to drop as white)"
  
  standard_rules_modified:
    - captures: "Pieces go to teammate's hand"
    - drop: "Same as Crazyhouse"
    - clocks: "Both boards have independent clocks"
    - communication: "Teammates can communicate"
```

### 3.2 Bughouse Rules

```yaml
bughouse_rules:
  iri: "https://krog-rules.org/chess/variants/bughouse/rules"
  
  piece_transfer:
    formal: |
      capture(player_A, piece, board_1) → 
        transfer(piece, teammate(player_A), board_2)
    
    timing: "Immediately available after capture"
    color_change: "Piece adopts teammate's color"
  
  communication:
    permitted:
      - "Ask for specific piece: 'I need a knight!'"
      - "Inform about position: 'I have mate if you give me a queen'"
      - "Strategy discussion"
    prohibited:
      - "Tell opponent's moves to teammate"
      - "Use electronic communication aids"
  
  clock_rules:
    independent: "Each board has separate clock"
    common_setting: "3+0 or 5+0 blitz"
    sitting: "Player can sit (not move) to wait for pieces"
    formal: "P(wait_for_piece) but O(move_eventually)"
  
  win_conditions:
    standard: "Checkmate on either board"
    flag_fall: "Time runs out on either board"
    formal: |
      team_wins ↔ 
        checkmate(opponent_board_A) ∨ 
        checkmate(opponent_board_B) ∨
        flag_fall(opponent_board_A) ∨
        flag_fall(opponent_board_B)
```

### 3.3 Bughouse TypeScript

```typescript
interface BughouseGame {
  id: string;
  boards: {
    A: CrazyhouseGame;  // Board A
    B: CrazyhouseGame;  // Board B
  };
  teams: {
    team1: { boardA: string; boardB: string };  // Player IDs
    team2: { boardA: string; boardB: string };
  };
  pieceQueues: {
    team1: { toA: PieceType[]; toB: PieceType[] };
    team2: { toA: PieceType[]; toB: PieceType[] };
  };
  state: 'waiting' | 'active' | 'completed';
  result?: BughouseResult;
}

interface BughouseResult {
  winningTeam: 1 | 2;
  reason: 'checkmate_A' | 'checkmate_B' | 'flag_A' | 'flag_B' | 'resignation';
  board: 'A' | 'B';
}

// Socket events for Bughouse
interface BughouseEvents {
  'bughouse_create': { teamSize: 2 };
  'bughouse_join': { gameId: string; team: 1 | 2; board: 'A' | 'B' };
  'bughouse_move': { board: 'A' | 'B'; move: CrazyhouseMove };
  'bughouse_state': BughouseGame;
  'piece_transfer': { piece: PieceType; fromBoard: 'A' | 'B'; toBoard: 'A' | 'B' };
  'team_chat': { team: 1 | 2; message: string };
}
```

---

## 4. Three-Check

### 4.1 Overview

```yaml
three_check:
  iri: "https://krog-rules.org/chess/variants/three-check"
  
  concept: "Deliver 3 checks to win (in addition to checkmate)"
  
  win_conditions:
    checkmate: "Standard checkmate still wins"
    three_checks: "Deliver 3 checks to opponent's king"
  
  formal: |
    wins(player) ↔ 
      checkmate(opponent) ∨ 
      check_count(player) ≥ 3
  
  standard_rules_unchanged:
    - all_piece_movement
    - castling
    - en_passant
    - promotion
    - draw_conditions
```

### 4.2 Check Counting

```yaml
three_check_counting:
  iri: "https://krog-rules.org/chess/variants/three-check/counting"
  
  what_counts:
    single_check: "+1 to counter"
    double_check: "+1 to counter (not +2)"
    discovered_check: "+1 to counter"
  
  formal: |
    check_delivered(move) → increment(check_counter, mover)
    check_counter(player) ≥ 3 → wins(player)
  
  display:
    format: "+N" where N = checks remaining to win
    example: "White +2, Black +1" means White needs 1 more, Black needs 2 more
  
  fen_extension:
    format: "standard_fen +W+B"
    example: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1 +0+0"
    # +0+0 means 0 checks delivered by each side
```

### 4.3 Three-Check TypeScript

```typescript
interface ThreeCheckGame extends ChessGame {
  checkCount: {
    white: number;  // Checks delivered BY white
    black: number;  // Checks delivered BY black
  };
  checksToWin: number;  // Default: 3
}

function isThreeCheckWin(game: ThreeCheckGame): Color | null {
  if (game.checkCount.white >= game.checksToWin) return 'white';
  if (game.checkCount.black >= game.checksToWin) return 'black';
  return null;
}

function makeThreeCheckMove(game: ThreeCheckGame, move: Move): ThreeCheckGame {
  const newGame = makeMove(game, move);
  
  // Check if this move delivers check
  if (isInCheck(newGame, oppositeColor(game.turn))) {
    newGame.checkCount[game.turn]++;
  }
  
  return newGame;
}

// Three-Check FEN: append check counts
// "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 +0+0"
function parseThreeCheckFEN(fen: string): ThreeCheckGame;
function toThreeCheckFEN(game: ThreeCheckGame): string;
```

---

## 5. King of the Hill

### 5.1 Overview

```yaml
king_of_the_hill:
  iri: "https://krog-rules.org/chess/variants/koth"
  aliases: ["KOTH"]
  
  concept: "Win by moving your king to the center 4 squares"
  
  hill_squares:
    center: ["d4", "d5", "e4", "e5"]
    formal: "hill = {d4, d5, e4, e5}"
  
  win_conditions:
    checkmate: "Standard checkmate still wins"
    king_on_hill: "King reaches and stays on center square"
    formal: |
      wins(player) ↔ 
        checkmate(opponent) ∨ 
        (king(player) ∈ hill ∧ ¬check(king(player)))
  
  timing:
    rule: "King must be safe on hill at end of move"
    formal: "king_on_hill ∧ check → ¬win (must escape first)"
```

### 5.2 KOTH Rules

```yaml
koth_rules:
  iri: "https://krog-rules.org/chess/variants/koth/rules"
  
  hill_victory:
    condition: "King on d4/d5/e4/e5 and not in check"
    timing: "Checked at end of each move"
    immediate: "Game ends immediately when condition met"
  
  strategy_implications:
    center_control: "Hill squares become critical"
    king_activity: "King marches early (unlike standard chess)"
    piece_sacrifice: "Worth sacrificing material to reach hill"
  
  draw_conditions:
    standard: "Stalemate, threefold, fifty-move still apply"
    addition: "Neither side can reach hill or checkmate"
  
  formal: |
    move_ends(move) →
      IF king(mover) ∈ hill ∧ ¬check(king(mover))
      THEN wins(mover)
```

### 5.3 KOTH TypeScript

```typescript
const HILL_SQUARES = ['d4', 'd5', 'e4', 'e5'] as const;

interface KOTHGame extends ChessGame {
  variant: 'koth';
}

function isKOTHWin(game: KOTHGame): Color | null {
  // Check if white king on hill and not in check
  const whiteKing = findKing(game, 'white');
  if (HILL_SQUARES.includes(whiteKing) && !isInCheck(game, 'white')) {
    return 'white';
  }
  
  // Check if black king on hill and not in check
  const blackKing = findKing(game, 'black');
  if (HILL_SQUARES.includes(blackKing) && !isInCheck(game, 'black')) {
    return 'black';
  }
  
  return null;
}

function makeKOTHMove(game: KOTHGame, move: Move): { game: KOTHGame; winner?: Color } {
  const newGame = makeMove(game, move);
  const winner = isKOTHWin(newGame) || (isCheckmate(newGame) ? game.turn : null);
  return { game: newGame, winner };
}
```

---

## 6. Atomic Chess

### 6.1 Overview

```yaml
atomic:
  iri: "https://krog-rules.org/chess/variants/atomic"
  
  concept: "Captures cause explosions that destroy surrounding pieces"
  
  explosion_rules:
    trigger: "Any capture"
    radius: "3×3 area centered on capture square"
    destroyed: "All pieces in radius (except pawns)"
    includes_capturer: "Capturing piece also explodes"
  
  standard_rules_modified:
    - captures: "Cause explosions"
    - check: "Can't put own king adjacent to opponent king"
    - checkmate: "Modified due to explosion mechanics"
  
  unique_rules:
    kings_cant_touch: "Kings can never be adjacent"
    king_explosion_win: "Exploding opponent's king wins"
    self_king_explosion_loss: "Exploding own king loses"
```

### 6.2 Explosion Mechanics

```yaml
atomic_explosion:
  iri: "https://krog-rules.org/chess/variants/atomic/explosion"
  
  affected_squares:
    pattern: "8 squares around capture square + capture square itself"
    formal: |
      explosion_zone(sq) = {
        (file-1, rank-1), (file, rank-1), (file+1, rank-1),
        (file-1, rank),   (sq),           (file+1, rank),
        (file-1, rank+1), (file, rank+1), (file+1, rank+1)
      }
  
  destruction_rules:
    captured_piece: "Destroyed"
    capturing_piece: "Destroyed"
    pieces_in_radius: "Destroyed (except pawns)"
    pawns: "Survive explosions"
    
    formal: |
      capture(attacker, victim, sq) →
        ∀piece ∈ explosion_zone(sq):
          IF piece ≠ pawn THEN destroy(piece)
  
  king_rules:
    opponent_king_exploded: "Immediate win"
    own_king_exploded: "Immediate loss"
    
    prohibition: "F(capture) if would explode own king"
    formal: |
      P(capture, sq) → ¬(own_king ∈ explosion_zone(sq))
  
  adjacent_kings:
    rule: "Kings can never be on adjacent squares"
    reason: "Any king capture would explode both"
    formal: "G(distance(white_king, black_king) ≥ 2)"
```

### 6.3 Atomic Check Rules

```yaml
atomic_check:
  iri: "https://krog-rules.org/chess/variants/atomic/check"
  
  modified_check:
    rule: "Check exists only if king can't capture the checking piece"
    reason: "King capturing = explosion = both kings die = not check"
    
    formal: |
      check(king) ↔ 
        attacked(king) ∧
        ¬(king_can_capture_attacker_without_exploding)
  
  examples:
    not_check: "Queen attacks king but king can capture queen (explosion kills attacker, not defender's king)"
    is_check: "Knight attacks king from distance (king can't safely capture)"
  
  checkmate:
    definition: "King attacked, can't capture attacker, can't move, can't block, can't explode attacker"
    formal: |
      checkmate(king) ↔
        check(king) ∧
        ¬∃escape_move ∧
        ¬∃block_move ∧
        ¬∃capture_attacker_safely
```

### 6.4 Atomic TypeScript

```typescript
interface AtomicGame extends ChessGame {
  variant: 'atomic';
}

function getExplosionZone(square: Square): Square[] {
  const file = square.charCodeAt(0);
  const rank = parseInt(square[1]);
  const zone: Square[] = [];
  
  for (let f = file - 1; f <= file + 1; f++) {
    for (let r = rank - 1; r <= rank + 1; r++) {
      if (f >= 97 && f <= 104 && r >= 1 && r <= 8) {
        zone.push(`${String.fromCharCode(f)}${r}` as Square);
      }
    }
  }
  
  return zone;
}

function executeAtomicCapture(game: AtomicGame, move: Move): AtomicGame {
  const zone = getExplosionZone(move.to);
  const newGame = { ...game };
  
  // Remove all non-pawn pieces in explosion zone
  for (const sq of zone) {
    const piece = newGame.board[sq];
    if (piece && piece.type !== 'p') {
      delete newGame.board[sq];
    }
  }
  
  return newGame;
}

function isValidAtomicMove(game: AtomicGame, move: Move): boolean {
  // Check if capture would explode own king
  if (isCapture(game, move)) {
    const zone = getExplosionZone(move.to);
    const ownKing = findKing(game, game.turn);
    if (zone.includes(ownKing)) {
      return false;  // Would explode own king
    }
  }
  
  // Check kings not adjacent after move
  // ... additional validation
  
  return true;
}

function isAtomicCheck(game: AtomicGame, color: Color): boolean {
  const king = findKing(game, color);
  const attackers = getAttackers(game, king, oppositeColor(color));
  
  // For each attacker, check if king could safely capture it
  for (const attacker of attackers) {
    const zone = getExplosionZone(attacker);
    if (!zone.includes(king)) {
      // King can't safely capture this attacker, so it's check
      return true;
    }
  }
  
  return false;  // All attackers can be "safely" captured (explosion doesn't kill own king)
}
```

---

## 7. Horde

### 7.1 Overview

```yaml
horde:
  iri: "https://krog-rules.org/chess/variants/horde"
  
  concept: "Asymmetric: Black has standard pieces, White has 36 pawns"
  
  setup:
    black: "Standard back rank + pawns"
    white: "36 pawns filling ranks 1-4 (plus f5, g5, h5)"
  
  win_conditions:
    black_wins: "Capture all white pawns"
    white_wins: "Checkmate black king"
    
    formal: |
      black_wins ↔ white_piece_count = 0
      white_wins ↔ checkmate(black_king)
  
  draw_conditions:
    stalemate: "Black has no legal moves but not in check"
    insufficient: "Only kings remain (impossible in Horde)"
```

### 7.2 Horde Setup

```yaml
horde_setup:
  iri: "https://krog-rules.org/chess/variants/horde/setup"
  
  starting_position:
    black:
      rank_8: "rnbqkbnr"
      rank_7: "pppppppp"
    white:
      rank_5: "-----PPP"  # f5, g5, h5 only
      rank_4: "PPPPPPPP"
      rank_3: "PPPPPPPP"
      rank_2: "PPPPPPPP"
      rank_1: "PPPPPPPP"
  
  fen: "rnbqkbnr/pppppppp/8/1PP2PPP/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1"
  
  pawn_count:
    initial: 36
    positions: "All of ranks 1-4 (32) + f5,g5,h5,b5 (4) = 36"
  
  white_rules:
    no_king: "White has no king"
    no_castling: "No castling for white"
    promotion: "White pawns can promote normally"
    objective: "Checkmate black king"
```

### 7.3 Horde TypeScript

```typescript
interface HordeGame extends ChessGame {
  variant: 'horde';
  whitePawnCount: number;
}

const HORDE_STARTING_FEN = 
  "rnbqkbnr/pppppppp/8/1PP2PPP/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq - 0 1";

function isHordeWin(game: HordeGame): { winner: Color; reason: string } | null {
  // Black wins if all white pawns captured
  if (game.whitePawnCount === 0) {
    return { winner: 'black', reason: 'All pawns captured' };
  }
  
  // White wins by checkmate
  if (isCheckmate(game) && game.turn === 'black') {
    return { winner: 'white', reason: 'Checkmate' };
  }
  
  return null;
}

function countWhitePawns(game: HordeGame): number {
  let count = 0;
  for (const square of ALL_SQUARES) {
    const piece = game.board[square];
    if (piece && piece.color === 'white') {
      count++;  // All white pieces are pawns (or promoted)
    }
  }
  return count;
}
```

---

## 8. Racing Kings

### 8.1 Overview

```yaml
racing_kings:
  iri: "https://krog-rules.org/chess/variants/racing-kings"
  
  concept: "Race to get your king to the 8th rank first"
  
  setup:
    starting_position: "Both kings on 1st rank, pieces arranged for racing"
    no_pawns: true
  
  rules:
    no_check: "Giving check is illegal"
    win_condition: "King reaches 8th rank"
    tie_rule: "If white reaches 8th, black gets one more move to tie"
  
  formal: |
    F(check(opponent_king))  # Check is forbidden
    wins(player) ↔ king(player) reaches rank_8 (with tie-break rule)
```

### 8.2 Racing Kings Rules

```yaml
racing_kings_rules:
  iri: "https://krog-rules.org/chess/variants/racing-kings/rules"
  
  no_check_rule:
    formal: "∀move: ¬results_in_check(move)"
    includes:
      - direct_check: "F(attack_king_directly)"
      - discovered_check: "F(reveal_attack_on_king)"
    reason: "Game is about racing, not attacking"
  
  winning:
    white_reaches: "If white king reaches rank 8, black gets one more move"
    tie: "If black also reaches rank 8, game is draw"
    
    formal: |
      white_king_reaches_8 →
        IF black_king_can_reach_8_in_one_move 
        THEN draw
        ELSE white_wins
  
  starting_position:
    fen: "8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - - 0 1"
    layout: |
      8 . . . . . . . .
      7 . . . . . . . .
      6 . . . . . . . .
      5 . . . . . . . .
      4 . . . . . . . .
      3 . . . . . . . .
      2 k r b n N B R K
      1 q r b n N B R Q
```

### 8.3 Racing Kings TypeScript

```typescript
interface RacingKingsGame extends ChessGame {
  variant: 'racing-kings';
  whiteReached8: boolean;
}

const RACING_KINGS_FEN = "8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - - 0 1";

function isValidRacingKingsMove(game: RacingKingsGame, move: Move): boolean {
  // Make the move
  const newGame = makeMove(game, move);
  
  // Check if it results in check - ILLEGAL in Racing Kings
  if (isInCheck(newGame, 'white') || isInCheck(newGame, 'black')) {
    return false;
  }
  
  return true;
}

function checkRacingKingsWin(game: RacingKingsGame): { winner: Color | 'draw' } | null {
  const whiteKing = findKing(game, 'white');
  const blackKing = findKing(game, 'black');
  
  const whiteOn8 = whiteKing[1] === '8';
  const blackOn8 = blackKing[1] === '8';
  
  if (blackOn8) {
    return { winner: 'black' };  // Black reaching 8 is immediate win
  }
  
  if (whiteOn8) {
    game.whiteReached8 = true;
    // Black gets one more move
    if (game.turn === 'black') {
      // Check if black can reach 8
      const blackMoves = getLegalMoves(game, 'black');
      const canReach8 = blackMoves.some(m => 
        m.piece === 'k' && m.to[1] === '8' && isValidRacingKingsMove(game, m)
      );
      if (canReach8) {
        return null;  // Game continues, black might tie
      }
      return { winner: 'white' };
    }
  }
  
  return null;
}
```

---

## 9. Variant Engine Architecture

### 9.1 Unified Variant Interface

```typescript
// ═══════════════════════════════════════════════════════════════════════════
//                       VARIANT ENGINE ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════

type VariantType = 
  | 'standard'
  | 'chess960'
  | 'crazyhouse'
  | 'bughouse'
  | 'three-check'
  | 'koth'
  | 'atomic'
  | 'horde'
  | 'racing-kings';

interface VariantRules {
  name: string;
  iri: string;
  
  // Position
  getStartingFen(): string;
  isValidPosition(fen: string): boolean;
  
  // Moves
  isValidMove(game: VariantGame, move: Move): boolean;
  getLegalMoves(game: VariantGame): Move[];
  makeMove(game: VariantGame, move: Move): VariantGame;
  
  // Win conditions
  isGameOver(game: VariantGame): boolean;
  getResult(game: VariantGame): GameResult | null;
  
  // Variant-specific
  getExtraState?(game: VariantGame): any;
  parseVariantFen?(fen: string): any;
  toVariantFen?(game: VariantGame): string;
}

interface VariantGame {
  variant: VariantType;
  fen: string;
  board: Board;
  turn: Color;
  castling: CastlingRights;
  enPassant: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  
  // Variant-specific state
  variantState?: {
    // Crazyhouse/Bughouse
    hands?: { white: PieceType[]; black: PieceType[] };
    
    // Three-Check
    checkCount?: { white: number; black: number };
    
    // Chess960
    castlingFiles?: Chess960CastlingRights;
    
    // Racing Kings
    whiteReached8?: boolean;
    
    // Horde
    whitePawnCount?: number;
  };
}

// Variant Registry
const VARIANT_REGISTRY: Record<VariantType, VariantRules> = {
  standard: new StandardRules(),
  chess960: new Chess960Rules(),
  crazyhouse: new CrazyhouseRules(),
  bughouse: new BughouseRules(),
  'three-check': new ThreeCheckRules(),
  koth: new KOTHRules(),
  atomic: new AtomicRules(),
  horde: new HordeRules(),
  'racing-kings': new RacingKingsRules(),
};

function createVariantGame(variant: VariantType, fen?: string): VariantGame {
  const rules = VARIANT_REGISTRY[variant];
  return {
    variant,
    fen: fen || rules.getStartingFen(),
    // ... initialize from FEN
  };
}
```

### 9.2 KROG Variant Formalization

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                       KROG VARIANT FORMALIZATION
# ═══════════════════════════════════════════════════════════════════════════

variant_formalization:
  iri: "https://krog-rules.org/chess/variants/formalization"
  
  base_rules:
    all_variants_inherit:
      - "T-types for player/spectator/arbiter"
      - "R-types for relationships"
      - "Modal operators (P, O, F)"
    
  variant_overrides:
    description: "Each variant specifies rule modifications"
    pattern: |
      variant(X) extends standard_chess {
        override: [list of modified rules]
        add: [list of new rules]
        remove: [list of removed rules]
      }
  
  examples:
    three_check:
      add: "wins(player) ← check_count(player) ≥ 3"
      override: null
      remove: null
    
    atomic:
      add: "capture(sq) → explosion(sq)"
      override: "check(king) only if can't safely capture attacker"
      remove: "kings_can_be_adjacent"
    
    koth:
      add: "wins(player) ← king(player) ∈ hill ∧ ¬check"
      override: null
      remove: null
    
    racing_kings:
      add: "wins(player) ← king(player).rank = 8"
      override: null
      remove: "P(check)" → "F(check)"  # Check becomes forbidden
```

---

## 10. Implementation Checklist (Phase 3)

### Server Updates Required

- [ ] Variant game engine interface
- [ ] Chess960 position generator
- [ ] Chess960 castling validator
- [ ] Crazyhouse piece hands
- [ ] Crazyhouse drop validation
- [ ] Bughouse team management
- [ ] Bughouse piece transfer
- [ ] Three-check counter
- [ ] KOTH hill detection
- [ ] Atomic explosion logic
- [ ] Atomic check modification
- [ ] Horde win conditions
- [ ] Racing Kings check prohibition

### Client Updates Required

- [ ] Variant selector in room creation
- [ ] Chess960 position display/randomizer
- [ ] Crazyhouse hand display
- [ ] Crazyhouse drop UI (drag from hand)
- [ ] Bughouse dual-board view
- [ ] Three-check counter display
- [ ] KOTH hill highlighting
- [ ] Atomic explosion animation
- [ ] Horde pawn counter
- [ ] Racing Kings race progress

### Database Schema (Variant Support)

```sql
-- Games table modification
ALTER TABLE games ADD COLUMN variant VARCHAR(50) DEFAULT 'standard';
ALTER TABLE games ADD COLUMN variant_state JSONB;

-- Variant-specific indexes
CREATE INDEX idx_games_variant ON games(variant);

-- Bughouse team games
CREATE TABLE bughouse_games (
  id UUID PRIMARY KEY,
  board_a_game_id UUID REFERENCES games(id),
  board_b_game_id UUID REFERENCES games(id),
  team1_players UUID[],
  team2_players UUID[],
  state VARCHAR(50)
);
```

### New Socket Events (Phase 3)

```typescript
// Variant selection
'create_variant_game' → { variant: VariantType; settings: GameSettings }
'variant_state' → VariantGame

// Crazyhouse
'drop_piece' → { piece: PieceType; square: Square }
'hand_update' → { white: PieceType[]; black: PieceType[] }

// Bughouse
'bughouse_create' → {}
'bughouse_join' → { team: 1 | 2; board: 'A' | 'B' }
'piece_transfer' → { piece: PieceType; toBoard: 'A' | 'B' }
'team_message' → { message: string }

// Chess960
'generate_960_position' → { seed?: number }
'position_960' → { positionId: number; fen: string }

// Three-Check
'check_delivered' → { by: Color; count: number }

// Atomic
'explosion' → { square: Square; destroyed: Square[] }

// Racing Kings
'race_progress' → { white: number; black: number }  // Rank reached
```

---

**Phase 3 Complete.** This document provides the formal KROG specification for:
- Chess960 (Fischer Random)
- Crazyhouse
- Bughouse
- Three-Check
- King of the Hill
- Atomic Chess
- Horde
- Racing Kings

Ready for Phase 4 (AI Training / HRM Integration) or Implementation?
