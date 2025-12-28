# KROG Game Rules Formalization Framework

**Version 2.0 - Enhanced with Universal Rules Integration**

## Dependencies

**REQUIRED:**
- `krog-universal-rules` - 7 T-types, 35 R-types, 9 modal operators
- `krog-logic` - Inference rules, proof strategies

**RECOMMENDED:**
- `krog-game-theory` - Nash equilibria, mechanism design
- `krog-information-theory` - Entropy, channel capacity (for card games)
- `krog-quantum-mechanics` - Superposition patterns (for partial information)
- `krog-thermodynamics` - Irreversibility, entropy (for move analysis)

## Core KROG Integration

### 7 T-Types (from krog-universal-rules)

Apply these fundamental types to any game:

1. **T1: Scalar** - Game score, piece values, coin counts
2. **T2: Vector** - Board positions (x,y), movement directions
3. **T3: Tensor** - Multi-dimensional state (chess: 8×8×12 piece tensor)
4. **T4: Function** - Evaluation functions, probability distributions
5. **T5: Relation** - Piece interactions, attack/defense relations
6. **T6: Structure** - Game tree, state graph, opening books
7. **T7: Process** - Move sequences, game phases, time evolution

### 35 R-Types (Rule Classifications)

Map each game rule to one of 35 R-types:

**Conservation R-Types:**
- **R1: Conservation** - Material, piece count, card deck size
- **R2: Boundary** - Board edges, legal move limits
- **R3: Constraint** - Turn order, move legality

**Transformation R-Types:**
- **R4: Symmetry** - Board symmetry, player equivalence
- **R5: Breaking** - Castling breaks symmetry, first move advantage
- **R6: Emergence** - Tactics emerge from piece interactions

**Information R-Types:**
- **R7: Observable** - Perfect information (Chess, Go)
- **R8: Hidden** - Partial information (Poker hole cards)
- **R9: Revelation** - Information gain (flop, turn, river in Poker)

**Temporal R-Types:**
- **R10: Sequential** - Alternating turns
- **R11: Simultaneous** - Both players move at once
- **R12: Irreversible** - Cannot undo moves, entropy increases

**Optimization R-Types:**
- **R13: Minimax** - Chess evaluation
- **R14: Expected** - Poker expected value
- **R15: Bayesian** - Belief updating in card games

... (and 20 more - see krog-universal-rules for complete list)

### 9 Modal Operators

**Necessity & Possibility:**
- **□P** (Necessary) - P is true in all reachable game states
- **◇P** (Possible) - P is true in at least one reachable state

**Prohibition & Obligation:**
- **⊗P** (Forbidden) - P cannot occur in legal play
- **⊕P** (Obligatory) - P must occur (forced moves)

**Temporal:**
- **P →ₜ Q** - P leads to Q over time

**Equivalence:**
- **P ↔ Q** - P and Q are interchangeable
- **P ≡ Q** - P and Q have same game-theoretic value

**Tautology & Contradiction:**
- **⊤** - Always true (game axioms)
- **⊥** - Always false (impossible states)

## Universal Game Formalization Pattern

```
GAME ::= (STATE, ACTIONS, TRANSITION, WIN, EVAL)

STATE:
  T2_Position: Board = (Pieces, Locations, Properties)
  T1_Score: Evaluation = Real_Number
  T7_Phase: Game_State = {Opening, Midgame, Endgame}

ACTIONS:
  T3_Move_Space: All_Legal_Moves(State)
  R3_Legality: ∀m ∈ Moves: Legal(m) → Apply(m)

TRANSITION:
  T7_Evolution: State →ₜ State'
  R12_Irreversible: □(State ≠ State') for most games

WIN:
  R1_Termination: Game_Over ⊢ No_Legal_Moves ∨ Objective_Met
  T1_Outcome: Result ∈ {Win, Loss, Draw} × Payoff

EVAL:
  T4_Value_Function: V(s) = Expected_Outcome(s)
  R14_Optimization: Best_Move = Argmax(V(Successor_States))
```

## Game Type Templates

### Grid-Based Games (Chess, Go, Shogi, Checkers)

**Enhanced Chess Formalization:**

```
=== STATE REPRESENTATION ===

T3_Board_Tensor: Board[8][8][12]
  - Dimensions: (Rank, File, Piece_Type)
  - Piece_Type: {♙,♘,♗,♖,♕,♔, ♟,♞,♝,♜,♛,♚}
  - Value: {0,1} (absent/present)

T5_Attack_Relation: Attacks ⊆ Pieces × Pieces
  - (P1, P2) ∈ Attacks ⟺ P1 threatens P2

T6_State_Graph: Reachable_States
  - Nodes: All legal positions
  - Edges: Legal moves
  - Size: ~10^43 nodes

T7_Game_Phase: Phase ∈ {Opening, Middlegame, Endgame}
  - Opening: ≥14 pieces per side
  - Middlegame: 6-13 pieces per side
  - Endgame: ≤5 pieces per side

=== CONSERVATION LAWS ===

R1_Material_Conservation:
  Material(Position) = Σ(Piece_Values)

  □(dMaterial/dt ≤ 0)  // Material never increases

  Piece_Values: {♙:1, ♘:3, ♗:3, ♖:5, ♕:9, ♔:∞}

R1_Piece_Count_Bound:
  □(Pieces_Per_Side ≤ 16)

R2_Board_Boundary:
  ∀(x,y): □(1 ≤ x ≤ 8 ∧ 1 ≤ y ≤ 8)

=== MOVEMENT PATTERNS ===

R4_Pawn_Symmetry_Breaking:
  ⊗(Pawn_Moves_Backward)  // Irreversible

  Pawn_Move ⊢ Forward_Only ∧ (
    (Same_File ∧ Δy=1) ∨
    (Start_Rank ∧ Same_File ∧ Δy=2) ∨
    (Diagonal_1 ∧ Enemy_Piece)
  )

R5_Knight_Discrete_Jump:
  Knight_Move ⊢ (|Δx|=2 ∧ |Δy|=1) ∨ (|Δx|=1 ∧ |Δy|=2)

  ◇(Jump_Over_Pieces)  // Unique property

R5_Bishop_Diagonal_Constraint:
  Bishop_Move ⊢ |Δx| = |Δy| ∧ No_Obstruction

R5_Rook_Orthogonal_Constraint:
  Rook_Move ⊢ (Δx=0 ∨ Δy=0) ∧ No_Obstruction

R5_Queen_Composite:
  Queen_Move ⊢ Rook_Move ∨ Bishop_Move

R3_King_Limited_Range:
  King_Move ⊢ |Δx| ≤ 1 ∧ |Δy| ≤ 1

=== SPECIAL RULES (Emergence Patterns) ===

R6_Castling_Emergence:
  Castle ⊢
    □(¬King_Moved) ∧ □(¬Rook_Moved) ∧
    No_Obstruction ∧ ⊗(Attacked_Squares_In_Path)

  // Emergent property: King safety from untouched pieces

R6_EnPassant_Temporal:
  EnPassant ⊢
    Adjacent_Pawn_Just_Moved_2_Squares →ₜ
    Can_Capture_On_Passed_Square

  // Time-sensitive: only valid immediately after opponent move

R6_Promotion_Phase_Transition:
  Pawn_Reaches_8th →ₜ Choose({♕,♖,♗,♘})

  // State transition: discontinuous piece value change

=== CHECK & CHECKMATE (Impossible States) ===

R9_Check_Observable:
  Check ⊢ ∃ Enemy_Piece: ◇(Captures_King_Next_Move)

R11_Must_Resolve_Check:
  In_Check ⊢ ⊕(Move_Blocks ∨ Move_King ∨ Capture_Attacker)

R9_Checkmate_Impossibility:
  Checkmate ⊢ Check ∧ (◇⊥ Exit_Check)

  // No possible move escapes check

⊗(King_In_Check_After_Own_Move)  // Illegal to leave king in check

=== WIN CONDITIONS ===

R1_Checkmate_Terminal:
  Win ⊢ Opponent_Checkmated

R1_Stalemate_Draw:
  Draw ⊢ No_Legal_Moves ∧ ¬Check

R10_Repetition_Draw:
  Draw ⊢ Position_Repeated_3_Times

  // Prevents infinite loops

R12_Fifty_Move_Rule:
  Draw ⊢ 50_Moves_Without_Capture_Or_Pawn_Move

  // Entropy threshold: game becoming too reversible

R1_Insufficient_Material:
  Draw ⊢ ◇⊥(Checkmate_Possible)

  // Examples: K vs K, K+B vs K, K+N vs K

=== EVALUATION FUNCTION ===

T4_Static_Evaluation: V(s) =
  Material(s) +
  Mobility(s) +
  King_Safety(s) +
  Pawn_Structure(s) +
  Center_Control(s)

where:
  Material(s) = Σ(Piece_Values × Piece_Count)

  Mobility(s) = 0.1 × |Legal_Moves|

  King_Safety(s) = Pawn_Shield_Value - Attacking_Pieces_Penalty

  Pawn_Structure(s) =
    -0.5 × Doubled_Pawns +
    -0.3 × Isolated_Pawns +
    +0.3 × Connected_Pawns

  Center_Control(s) =
    0.2 × Pieces_In_Center +
    0.1 × Pieces_Attacking_Center

R14_Minimax_Optimization:
  Best_Move = Argmax_m (Min_opponent (V(Apply(m, s))))

R13_Alpha_Beta_Pruning:
  ⊗(Explore_Branch) ⊢ Alpha ≥ Beta

  // Impossible to improve on this branch
```

**Go Formalization (Territory-Based):**

```
=== STATE ===

T2_Go_Board: Intersections[19][19]  // or 9×9, 13×13

T2_Stone: Stone = (Color, Position)
  Color ∈ {Black, White}
  Position = (x, y) ∈ [1,19]²

T6_Group_Structure: Group = Connected_Component(Same_Color_Stones)
  Liberties = Adjacent_Empty_Intersections(Group)

T1_Territory_Count: Territory(Player) =
  Empty_Intersections_Surrounded_By(Player_Stones)

=== RULES ===

R3_Placement_Constraint:
  Place_Stone ⊢ Empty_Intersection ∧ ¬Suicide

R1_Capture_Removal:
  Liberties(Group) = 0 →ₜ Remove(Group)

R10_Ko_Rule:
  ⊗(Immediate_Position_Repetition)

  // Prevents infinite capture loops

R2_Suicide_Forbidden:
  ⊗(Place_Stone_With_Zero_Liberties)
    UNLESS Captures_Enemy_Group

=== WIN CONDITIONS ===

R1_Territory_Win:
  Score(Player) = Territory(Player) + Captures(Player)

  Win ⊢ Score(Black) > Score(White) + Komi

R4_Komi_Symmetry_Compensation:
  Komi = 6.5  // Compensates White for moving second

  // Breaks tie, ensures decisive result

=== HANDICAP SYSTEM ===

R5_Handicap_Stones:
  Skill_Difference(Black, White) = N →
  Black_Places_N_Stones_Before_Start

  N ∈ {2,3,4,5,6,7,8,9}

=== EVALUATION (Influence-Based) ===

T4_Influence_Function: Influence(Point, Stone) =
  1 / (1 + Distance(Point, Stone))

T1_Position_Value: V(s) =
  Σ_Points (Influence(Point, Black) - Influence(Point, White)) +
  Territory_Estimate(s) +
  Captured_Stones(s)
```

### Card Games (Poker, Bridge)

**Texas Hold'em Poker (Partial Information):**

```
=== STATE (With Hidden Information) ===

T6_Deck: Deck = Ranks × Suits
  Ranks = {2,3,4,5,6,7,8,9,10,J,Q,K,A}
  Suits = {♠,♥,♦,♣}
  |Deck| = 52

T2_Hand: Hole_Cards[Player] = 2 cards (hidden)

T2_Community: Board_Cards = {Flop[3], Turn, River}

T1_Pot: Pot_Size = Σ(All_Bets)

T7_Betting_Phase: Phase ∈ {PreFlop, Flop, Turn, River, Showdown}

=== INFORMATION STRUCTURE (Partial) ===

R8_Hidden_Information:
  Player_i_Knows = {
    Own_Hole_Cards,
    Community_Cards,
    Betting_History,
    ⊥ Opponent_Hole_Cards  // Unknown
  }

R9_Information_Revelation:
  PreFlop →ₜ Flop: Reveal_3_Cards
  Flop →ₜ Turn: Reveal_1_Card
  Turn →ₜ River: Reveal_1_Card
  River →ₜ Showdown: Reveal_All_Hole_Cards

R15_Bayesian_Update:
  P(Opponent_Hand | Bet_Action) =
    P(Bet_Action | Opponent_Hand) × P(Opponent_Hand) /
    P(Bet_Action)

  // Update beliefs based on opponent actions

=== HAND RANKINGS (Total Order) ===

T5_Hand_Rank_Relation: Ranking = {
  Royal_Flush > Straight_Flush > Four_Kind >
  Full_House > Flush > Straight >
  Three_Kind > Two_Pair > Pair > High_Card
}

R5_Hand_Comparison:
  ∀ Hands: Exactly_One_Wins

  Ties only if identical 5-card hands

=== BETTING RULES ===

R3_Action_Constraints:
  Actions ∈ {Fold, Check, Call, Bet, Raise, All_In}

  Check ⊢ No_Previous_Bet_This_Round
  Call ⊢ Match_Current_Bet
  Raise ⊢ Increase_Bet ∧ (Raise ≥ Minimum_Raise)
  All_In ⊢ Bet_All_Remaining_Chips

R11_Betting_Round_Complete:
  ⊕(Next_Phase) ⊢ All_Active_Players_Called

R1_Pot_Conservation:
  Total_Chips_In_Play = Constant

  // Zero-sum game

=== POT ODDS & EXPECTED VALUE ===

T1_Pot_Odds: Pot_Odds =
  Amount_To_Call / (Current_Pot + Amount_To_Call)

T4_Expected_Value: EV(Action) =
  P(Win) × Pot_Size - P(Lose) × Bet_Size

R14_Optimal_Call_Decision:
  Should_Call ⊢ Win_Probability > Pot_Odds

R14_Optimal_Bluff_Frequency:
  Bluff_Freq = 1 / (1 + Pot_Odds)

  // Game-theoretically optimal

R13_Game_Theory_Optimal:
  GTO_Strategy ⊢
    ⊗(Exploitable) ∧
    Exploits(Deviations_From_Equilibrium)

=== WIN CONDITION ===

R5_Showdown:
  Winner = Argmax_Player (Hand_Rank(5_Best_Cards))

R6_Side_Pots (Emergent):
  All_In_Player_Can_Win ≤
    Min(Own_Bet, Each_Opponent_Bet)
```

**Bridge (Partnership & Bidding):**

```
=== STATE ===

T6_Partnership_Structure:
  Teams = {(North, South), (East, West)}

  Shared_Information(Partners)

T7_Phases:
  Game = Bidding_Phase →ₜ Play_Phase →ₜ Scoring_Phase

T2_Contract: Contract = (Level, Suit, Declarer)
  Level ∈ {1,2,3,4,5,6,7}  // Tricks above 6
  Suit ∈ {♣,♦,♥,♠, NT}

=== BIDDING (Communication Protocol) ===

R9_Legal_Bidding:
  Bid ⊢ Higher_Than_Previous ∨ Pass ∨ Double ∨ Redouble

R8_Partnership_Signaling:
  Bids_Reveal_Information_About_Hand

  // Limited legal communication channel

⊗(Verbal_Communication)  // Only bids allowed

=== PLAY ===

R11_Must_Follow_Suit:
  ⊕(Play_Same_Suit) ⊢ Have_Card_In_Suit_Led

R5_Trump_Dominance:
  Trump_Card > Any_Non_Trump_Card

R5_Highest_Wins:
  Win_Trick ⊢
    (Trump_Played → Highest_Trump) ∨
    (No_Trump → Highest_In_Suit_Led)

=== WIN CONDITION ===

R1_Contract_Made:
  Success ⊢ Tricks_Won ≥ (6 + Contract_Level)

T1_Scoring: Points =
  Contract_Value +
  Overtricks +
  Bonuses -
  Undertrick_Penalties

Examples:
  3NT Made: 400 points
  6♠ Made (Slam): 980 + Slam_Bonus
  4♥ Down 2: -200 points
```

### Abstract Strategy (Backgammon - Randomness)

```
=== STATE (With Randomness) ===

T2_Board: Points[24] + Bar + Bear_Off_Area

T2_Dice: (Die1, Die2) ~ Uniform({1,2,3,4,5,6}²)

T2_Checkers: Checker[15] per player

=== DICE & MOVEMENT ===

R3_Move_Distance:
  Move_Checker(Distance) ⊢ Distance = Die_Value

R10_Doubles_Rule:
  (Die1 = Die2) →ₜ Can_Move_4_Times

R3_Point_Ownership:
  Occupied(Point) ⊢ ≥2_Same_Color_Checkers

R3_Blot_Vulnerability:
  Single_Checker ⊢ ◇(Hit_By_Opponent)

=== HITTING & RE-ENTRY ===

R6_Hit_Mechanism:
  Land_On_Blot →ₜ Send_To_Bar

R11_Must_Re_Enter:
  Checker_On_Bar ⊢ ⊕(Enter_From_Bar_Before_Other_Moves)

=== BEARING OFF ===

R1_Bear_Off_Condition:
  Can_Bear_Off ⊢ All_Checkers_In_Home_Board

R3_Exact_Roll:
  Bear_Off_Checker ⊢
    Die_Value ≥ Distance_To_End

=== WIN ===

R1_Race_Win:
  Win ⊢ All_15_Checkers_Borne_Off

=== EXPECTED VALUE (With Randomness) ===

T4_Expected_Outcome: EV(Position) =
  Σ_Dice_Rolls P(Roll) × Value(Position_After_Roll)

R14_Optimal_Move:
  Best_Move = Argmax_m EV(Position_After_Move)
```

## Temporal Logic Patterns

### Phase Transitions

```
=== CHESS PHASES ===

T7_Opening_To_Middlegame:
  Opening →ₜ Middlegame ⊢
    Pieces_Developed ∧
    King_Castled ∧
    Rooks_Connected

T7_Middlegame_To_Endgame:
  Middlegame →ₜ Endgame ⊢
    Queens_Traded ∨
    Total_Pieces ≤ 12

=== POKER PHASES ===

T7_Betting_Sequence:
  PreFlop →ₜ Flop →ₜ Turn →ₜ River →ₜ Showdown

  Each_Phase: (Betting_Round →ₜ Card_Revelation)

=== GO PHASES ===

T7_Go_Phases:
  Fuseki (Opening) →ₜ
  Chuban (Middle) →ₜ
  Yose (Endgame)

  Fuseki: Territory_Sketching
  Chuban: Fighting_For_Influence
  Yose: Precise_Endgame_Counting
```

### Irreversibility

```
R12_Time_Arrow:
  ∀ Moves: ⊗(Undo_Move)

  Entropy_Increase: dS/dt > 0

Examples:
  Chess: Pawn moves, captures (cannot reverse)
  Go: Stone placement (permanent)
  Poker: Folding (cannot un-fold)
  Backgammon: Checker movement (generally irreversible)
```

## Impossibility Theorems

### Perfect Information Games

```
⊤(Zermelo's_Theorem):
  Perfect_Information_Game ⊢
    ∃ Optimal_Strategy_For_One_Player ∨
    Draw_With_Perfect_Play

Examples:
  ⊤(Chess_Determined) - Either White wins, Black wins, or draw
  ⊤(Checkers_Solved) - Draw with perfect play (proven 2007)
  ⊤(Tic_Tac_Toe_Solved) - Draw with perfect play
```

### Zero-Sum Games

```
⊤(Minimax_Theorem):
  Zero_Sum_Game ⊢
    Optimal_Strategy_Exists ∧
    Max_Min_Value = Min_Max_Value

Applied to: Chess, Go, Checkers, Poker (heads-up)
```

### Partial Information

```
◇⊥(Perfect_Play_Undefined):
  Partial_Information_Game ⊢
    Randomness_Required_For_GTO

  Cannot_Deterministically_Play_Optimally

Example: Poker requires mixed strategies (randomized bluffing)
```

## Cross-Domain Mappings

### Game Theory ↔ Economics

```
Poker_Betting ≡ Auction_Bidding
  Both: Sequential revelation of private valuations

Chess_Zugzwang ≡ Last_Mover_Disadvantage
  Both: Being forced to move hurts you

Go_Territory ≡ Resource_Allocation
  Both: Optimizing spatial control
```

### Information Theory ↔ Card Games

```
T1_Hand_Entropy: H(Hand) = -Σ P(Hand) log P(Hand)

R9_Information_Gain: I(X;Y) = H(X) - H(X|Y)

Example (Poker):
  Before_Flop: H(Opponent_Hand) = log(C(50,2)) ≈ 10.96 bits
  After_Flop: H(Opponent_Hand | Flop) < 10.96 bits

  Information_Gain = 10.96 - H(Hand|Flop)
```

### Quantum ↔ Partial Information

```
Schrödinger's_Hand:
  Opponent_Hand = Superposition(All_Possible_Hands)

  Observation (Showdown) → Wavefunction_Collapse

Entanglement:
  My_Hand ⊗ Community_Cards ⊗ Opponent_Hand

  Measuring one affects probabilities of others
```

### Thermodynamics ↔ Game Irreversibility

```
R12_Entropy_Increase:
  Chess_Move →ₜ Information_Loss

  Cannot_Reconstruct_Full_History_From_Position

  Example: FEN shows current position, not how it was reached

T1_Free_Energy:
  Game_Complexity = Branching_Factor × Depth

  Go: Highest complexity (~10^360 game tree)
  Chess: Medium (~10^123 game tree)
  Tic-Tac-Toe: Low (~10^5 game tree)
```

## Implementation Checklist

When adding a new game to KROG Games platform, verify:

### Core Components
- [ ] **T2: State representation** - How is board/position encoded?
- [ ] **T3: Move space** - Algorithm to generate all legal moves
- [ ] **T7: State transition** - How does a move change the state?
- [ ] **R1: Win condition** - When is the game over?
- [ ] **T4: Evaluation** - How good is a position for each player?

### Rule Formalization
- [ ] **Map all rules to R-types** - Classify each rule (1-35)
- [ ] **Identify modal patterns** - What's □, ◇, ⊗, ⊕?
- [ ] **Conservation laws** - What's preserved?
- [ ] **Impossibility theorems** - What cannot happen?
- [ ] **Phase transitions** - Opening → Middle → End?

### Information Structure
- [ ] **Information type** - Perfect / Partial / Imperfect?
- [ ] **Hidden state** - What's unknown to each player?
- [ ] **Revelation pattern** - When is information revealed?
- [ ] **Bayesian updates** - How do beliefs change?

### Randomness
- [ ] **Random elements** - Dice? Cards? None?
- [ ] **Probability distribution** - Uniform? Weighted?
- [ ] **Expected value** - How to handle randomness in eval?

### Game Mechanics
- [ ] **Turn structure** - Sequential? Simultaneous? Phase-based?
- [ ] **Time control** - Clocks? Time formats?
- [ ] **Special rules** - Castling, Ko, En Passant, etc.
- [ ] **Variants** - Alternative rulesets?

### AI & Analysis
- [ ] **Search algorithm** - Minimax? MCTS? Other?
- [ ] **Evaluation function** - Material? Positional? Composite?
- [ ] **Opening book** - Pre-computed best openings?
- [ ] **Endgame tables** - Pre-solved endgames?

### Notation & Replay
- [ ] **Move notation** - PGN? SGF? Custom?
- [ ] **Position notation** - FEN? Custom?
- [ ] **Replay system** - Can view past games?

### Teaching & Practice
- [ ] **Tutorial system** - Teaches rules?
- [ ] **Lessons** - Progressive skill building?
- [ ] **Puzzles** - Practice problems?
- [ ] **Difficulty levels** - Beginner to expert?

### Multiplayer
- [ ] **Rating system** - ELO? Glicko? Custom?
- [ ] **Matchmaking** - Skill-based pairing?
- [ ] **Tournaments** - Swiss? Round-robin? Knockout?
- [ ] **Spectator mode** - Can others watch?

### KROG-Specific
- [ ] **Move explanations** - KROG formula for each move type?
- [ ] **R-type classification** - Each move classified?
- [ ] **Learn mode** - Shows formulas during play?
- [ ] **Cross-domain analogies** - Link to physics, economics, etc.?

## Appendices

### Appendix A: Complete 35 R-Types

(See `krog-universal-rules` for full reference)

**Structural R-Types (1-7):**
1. Conservation
2. Boundary
3. Constraint
4. Symmetry
5. Breaking
6. Emergence
7. Hierarchy

**Information R-Types (8-14):**
8. Hidden
9. Observable
10. Revelation
11. Cryptographic
12. Irreversible
13. Signaling
14. Channel

**Temporal R-Types (15-21):**
15. Sequential
16. Simultaneous
17. Causal
18. Temporal
19. Deadline
20. Phase
21. Cycle

**Optimization R-Types (22-28):**
22. Minimax
23. Expected
24. Bayesian
25. Optimal_Control
26. Nash_Equilibrium
27. Pareto_Efficient
28. Mechanism_Design

**Meta R-Types (29-35):**
29. Compositional
30. Recursive
31. Self_Referential
32. Undecidable
33. Computational_Bound
34. Approximation
35. Learning

### Appendix B: 7 T-Types

(From `krog-universal-rules`)

1. **Scalar** - Single values
2. **Vector** - Ordered lists
3. **Tensor** - Multi-dimensional arrays
4. **Function** - Mappings between types
5. **Relation** - Connections between elements
6. **Structure** - Organized collections
7. **Process** - Time-dependent evolutions

### Appendix C: 9 Modal Operators

(From `krog-universal-rules`)

1. **□** (Box) - Necessity
2. **◇** (Diamond) - Possibility
3. **⊗** (Otimes) - Prohibition
4. **⊕** (Oplus) - Obligation
5. **→ₜ** - Temporal implication
6. **↔** - Bidirectional equivalence
7. **≡** - Strong equivalence
8. **⊤** - Tautology (always true)
9. **⊥** - Contradiction (always false)

## Version History

- **v1.0** (2025-12-26): Initial framework by Claude Code
- **v2.0** (2025-12-27): Enhanced with krog-universal-rules integration
  - Added 7 T-types
  - Added 35 R-types classification
  - Added 9 modal operators
  - Added temporal logic patterns
  - Added impossibility theorems
  - Added cross-domain mappings
  - Added conservation laws
  - Expanded examples with KROG formalization

## Usage

This framework should be consulted whenever:
1. Adding a new game to KROG Games platform
2. Creating KROG explanations for existing games
3. Building AI opponents with formal evaluation
4. Teaching game theory through formal logic
5. Analyzing game balance and fairness
6. Designing new game variants

Always begin by reading `krog-universal-rules` to understand the foundational T-types, R-types, and operators, then apply the templates from this framework to your specific game.
