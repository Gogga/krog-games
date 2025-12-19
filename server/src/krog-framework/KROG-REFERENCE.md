# KROG Chess - Complete Mathematical Framework Reference

**Version:** 1.0.0
**Purpose:** Authoritative reference for KROG implementation in chess

## Quick Reference

### Core Operators (9)
- **P()** - Permission: `P(move) ≡ ¬O¬(move)`
- **O()** - Obligation: `O(respond_check) when CS(self)`
- **F()** - Prohibition: `F(move_into_check)`
- **C()** - Claim: `C(player, draw) when PR(pos, 3)`
- **L()** - Liberty: `L(player, resign)`
- **W()** - Power: `W(castle) ≡ ¬moved(king)`
- **B()** - Immunity: `B(king, capture_without_checkmate)`
- **I()** - Disability: `I(castle) after moved(king)`
- **D()** - Liability: `D(player, lose) when TC = 0`

### Chess Operators (22)

**Piece Logic (8)**
- **PM** - Piece Movement Permission
- **PC** - Path Clearance
- **PA** - Piece Attack
- **NV** - Notation Validity
- **PD** - Piece Development
- **CR** - Castling Rights
- **EP** - En Passant Validity
- **PO** - Promotion Obligation

**Board Logic (8)**
- **PV** - Position Validity
- **MH** - Move History
- **CS** - Check State
- **LMG** - Legal Move Generation
- **GT** - Game Termination
- **TC** - Time Control
- **PR** - Position Repetition
- **FMC** - Fifty Move Counter

**Notation (6)**
- **PSA** - Parse Standard Algebraic
- **PLA** - Parse Long Algebraic
- **PUCI** - Parse UCI Format
- **PVN** - Parse Voice Natural
- **GN** - Generate Notation
- **NC** - Notation Conversion

### Temporal Logic (5)
- **G** - Globally (Always)
- **F** - Finally (Eventually)
- **X** - Next
- **U** - Until
- **R** - Release

---

## Complete Operator Definitions

### 1. Core KROG Operators

#### P() - Permission
```
P(φ) ≡ ¬O¬(φ)
"Action φ is permitted" ≡ "It's not obligatory that φ doesn't happen"

Chess examples:
- legal_move: P(Nf3) when knight_pattern(b1,f3) ∧ empty(f3)
- castling: P(O-O) when CR(kingside)
- optional_action: P(offer_draw) - always permitted
```

#### O() - Obligation
```
O(φ) ≡ ¬P¬(φ)
"Action φ is obligatory" ≡ "It's not permitted that φ doesn't happen"

Chess examples:
- resolve_check: O(¬CS(self)) when CS(self)
- pawn_promotion: O(choose_piece ∈ {Q,R,B,N}) when pawn_reaches_8th
- make_move: O(move) on your_turn
```

#### F() - Prohibition
```
F(φ) ≡ O¬(φ) ≡ ¬P(φ)
"Action φ is forbidden"

Chess examples:
- move_into_check: F(move) when CS(self) after move
- illegal_pattern: F(bishop_straight) - violates piece pattern
- opponent_pieces: F(move_opponent_piece)
```

#### C() - Claim
```
C(player, right)
"Player can claim a right (e.g., draw)"

Chess examples:
- threefold: C(player, draw) when PR(position, 3)
- fifty_move: C(player, draw) when FMC() ≥ 50
```

#### L() - Liberty
```
L(player, action)
"Player has liberty to perform action"

Chess examples:
- resign: L(player, resign) - always available
- offer_draw: L(player, offer_draw) on own turn
```

#### W() - Power
```
W(action) ≡ conditions_met
"Power to perform action exists"

Chess examples:
- castling_power: W(castle) ≡ ¬moved(king) ∧ ¬moved(rook)
- en_passant_power: W(en_passant) ≡ opponent_just_double_pushed
```

#### B() - Immunity
```
B(entity, action)
"Entity is immune from action"

Chess examples:
- king_immunity: B(king, capture_without_checkmate)
- stalemate_immunity: B(player, lose) when stalemate
```

#### I() - Disability
```
I(action) after condition
"Action becomes disabled after condition"

Chess examples:
- castling_disabled: I(castle) after moved(king)
- en_passant_disabled: I(en_passant) after next_move
```

#### D() - Liability
```
D(player, consequence) when condition
"Player liable for consequence when condition met"

Chess examples:
- time_forfeit: D(player, lose) when TC = 0
- illegal_move: D(player, warning) when illegal_move_attempted
```

---

## Chess-Specific Operators

### PM - Piece Movement Permission
```
PM(p,s₁,s₂) ≡ P(move) ∧ piece_pattern(p,s₁,s₂) ∧ PC(s₁,s₂)

Piece patterns:
- King: |Δfile| ≤ 1 ∧ |Δrank| ≤ 1
- Queen: diagonal(s₁,s₂) ∨ straight(s₁,s₂)
- Rook: file₁ = file₂ ∨ rank₁ = rank₂
- Bishop: |Δfile| = |Δrank|
- Knight: (|Δfile| = 2 ∧ |Δrank| = 1) ∨ (|Δfile| = 1 ∧ |Δrank| = 2)
- Pawn: forward(color) ∧ (single ∨ double_first ∨ capture_diagonal)
```

### PC - Path Clearance
```
PC(s₁,s₂) ≡ ∀s ∈ path(s₁,s₂): empty(s)

Applies to: Queen, Rook, Bishop, Pawn (double move)
Does not apply to: Knight (jumps), King (single step)
```

### PA - Piece Attack
```
PA(piece,square) ≡ PM(piece,piece.square,square) ∧ (empty(square) ∨ opponent(square))
```

### CS - Check State
```
CS(color) ≡ ∃opponent_piece: PA(opponent_piece, king_position)
```

### CR - Castling Rights
```
CR(side) ≡ ¬moved(king) ∧ ¬moved(rook) ∧ ¬CS(self) ∧ PC(king,rook) ∧ ∀s∈path: ¬PA(opp,s)

Conditions:
1. King has not moved
2. Rook has not moved
3. King is not in check
4. Path between king and rook is clear
5. King does not pass through attacked squares
```

### EP - En Passant Validity
```
EP(s) ≡ F[≤1](opponent_double_pawn) ∧ adjacent_pawn ∧ 5th_rank

Temporal: Must capture immediately after opponent's double pawn move
```

### PO - Promotion Obligation
```
PO(pawn,8th) ≡ O(promote_to ∈ {Q,R,B,N})

When pawn reaches 8th rank, promotion is obligatory
```

### GT - Game Termination
```
GT(result) ≡ checkmate ∨ stalemate ∨ draw_conditions ∨ resignation

Checkmate: GT(checkmate) ≡ CS ∧ LMG = ∅
Stalemate: GT(stalemate) ≡ ¬CS ∧ LMG = ∅
```

### LMG - Legal Move Generation
```
LMG(color) ≡ {m : PM(m) ∧ ¬CS(color) after m}

All moves that:
1. Follow piece movement rules
2. Don't leave own king in check
```

### PR - Position Repetition
```
PR(position, n) ≡ count(position in history) ≥ n

Threefold: PR(position, 3) → C(player, draw)
Fivefold: PR(position, 5) → automatic draw
```

### FMC - Fifty Move Counter
```
FMC() ≡ halfmoves since pawn_move ∨ capture

Fifty move rule: FMC() ≥ 100 → C(player, draw)
Seventy-five move rule: FMC() ≥ 150 → automatic draw
```

---

## Complete FIDE Rule Mappings

| Rule | FIDE (NO) | FIDE (EN) | KROG Formula | Operators | R-Type |
|------|-----------|-----------|--------------|-----------|--------|
| Bishop Movement | §3.4 | 3.4 | PM(bishop,s₁,s₂) ≡ diagonal ∧ PC | PM, PC | R3_path_dependent |
| Rook Movement | §3.5 | 3.5 | PM(rook,s₁,s₂) ≡ straight ∧ PC | PM, PC | R3_path_dependent |
| Knight Movement | §3.6 | 3.6 | PM(knight,s₁,s₂) ≡ l_shape | PM | R11_discrete_jump |
| Pawn Movement | §3.7 | 3.7 | PM(pawn,s₁,s₂) ≡ forward ∧ rules | PM, PC, EP, PO | R1_asymmetric |
| King Movement | §3.9 | 3.9 | PM(king,s₁,s₂) ≡ adjacent | PM | R2_intransitive |
| Castling | §3.8.2 | 3.8.b | CR(side) ≡ ¬moved ∧ ¬CS ∧ PC ∧ safe | CR, PC, PA, CS, W | R9_compound_move |
| En Passant | §3.7d | 3.7d | EP(s) ≡ F[≤1](double) ∧ adjacent | EP | R7_temporal_window |
| Promotion | §3.7e | 3.7e | PO(pawn,8th) ≡ O(promote) | O, PO | R8_mandatory_transformation |
| Checkmate | §5.2 | 5.2 | GT(checkmate) ≡ CS ∧ LMG = ∅ | GT, CS, LMG | R13_terminal_state |
| Stalemate | §5.2 | 5.2 | GT(stalemate) ≡ ¬CS ∧ LMG = ∅ | GT, CS, LMG | R13_terminal_state |
| Threefold | §9.2 | 9.2 | C(draw) when PR(pos, 3) | C, PR | R14_repetition |
| Fifty Move | §9.3 | 9.3 | C(draw) when FMC ≥ 50 | C, FMC | R15_counter_based |

---

## R-Type Classifications

| R-Type | Description | Examples |
|--------|-------------|----------|
| R1_asymmetric | Pawn moves (direction matters) | Pawn movement |
| R2_intransitive | Single step moves | King movement |
| R3_path_dependent | Sliding pieces requiring clear path | Queen, Rook, Bishop |
| R4_capture_only | Moves that must capture | Pawn diagonal capture |
| R5_non_capture | Moves that cannot capture | Pawn forward |
| R6_first_move_special | Special first move rules | Pawn double move |
| R7_temporal_window | Time-limited actions | En passant |
| R8_mandatory_transformation | Required piece change | Pawn promotion |
| R9_compound_move | Multiple piece movement | Castling |
| R10_conditional | Context-dependent rules | Check response |
| R11_discrete_jump | Non-path-following movement | Knight |
| R12_state_dependent | Based on game state | Castling rights |
| R13_terminal_state | Game-ending conditions | Checkmate, Stalemate |
| R14_repetition | Position repetition rules | Threefold |
| R15_counter_based | Move counter rules | Fifty move |

---

## Temporal Logic Patterns

### G - Globally (Always)
```
G(φ) - φ must hold at all times
Example: G(¬CS(self)) - never leave king in check
```

### F - Finally (Eventually)
```
F(φ) - φ must eventually hold
Example: F(GT) - game must eventually terminate
```

### X - Next
```
X(φ) - φ holds in next state
Example: X(opponent_turn) after valid move
```

### U - Until
```
φ U ψ - φ holds until ψ becomes true
Example: W(castle) U moved(king) - castling power until king moves
```

### R - Release
```
φ R ψ - ψ holds until φ releases it
Example: ¬EP R next_move - en passant right released by any move
```

---

## Implementation Requirements

Every rule MUST have:
1. **ID**: Unique identifier
2. **Name**: English and Norwegian
3. **Operators**: List of KROG operators used
4. **Formula**: Mathematical expression
5. **R-Type**: Classification
6. **FIDE Reference**: Norwegian and English sections
7. **Explanation**: Bilingual natural language
8. **Voice Patterns**: Voice command recognition patterns

## Validation Output

Every validation MUST return:
```typescript
{
  valid: boolean;
  operators: string[];
  formula: string;
  rtype: RType;
  explanation: { en: string; no: string };
  fideRule: { norwegian: string; english: string };
  json: KROGRuleJSON;
}
```

---

**This reference is complete. Use it to implement the full KROG framework in KROG Chess.**
