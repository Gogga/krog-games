# KROG Chess Phase 5: Educational System

## Overview

This document formalizes a comprehensive chess education system using KROG universal rules. The system provides structured learning paths from absolute beginner to master level, with KROG-enhanced explanations at every step.

**Educational Pillars:**
1. **Skill Level System** - 8 progressive levels with clear benchmarks
2. **Learning Paths** - Structured curricula for each phase of the game
3. **Opening Theory** - Principles and specific openings
4. **Middlegame Strategy** - Positional and tactical concepts
5. **Endgame Mastery** - Theoretical endings and techniques
6. **Tactical Training** - Pattern recognition and calculation
7. **Interactive Tutorials** - Hands-on learning with KROG explanations
8. **Puzzle System** - Adaptive difficulty puzzles
9. **Progress Tracking** - Comprehensive skill assessment
10. **AI Tutor Integration** - Personalized instruction

**Namespace**: `https://krog-rules.org/chess/education/`

---

## 1. Skill Level System

### 1.1 Level Definitions

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          SKILL LEVEL SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

skill_levels:
  iri: "https://krog-rules.org/chess/education/levels"
  
  levels:
    level_0_absolute_beginner:
      name: { en: "Absolute Beginner", no: "Helt Nybegynner" }
      icon: "🌱"
      elo_range: [0, 400]
      description: "Learning how the pieces move"
      
      prerequisites: "None"
      
      learning_goals:
        - "Know how each piece moves"
        - "Understand the board layout (files, ranks, diagonals)"
        - "Know how to set up the board"
        - "Understand check and checkmate concept"
        - "Complete a game without illegal moves"
      
      krog_focus:
        - "Basic P(piece, move) permissions"
        - "F(move_into_check) prohibition"
        - "Understanding T1 (full discretion) moves"
      
      completion_criteria:
        - "Pass piece movement quiz (90%+)"
        - "Complete 5 games without illegal moves"
        - "Solve 10 'checkmate in 1' puzzles"
    
    level_1_beginner:
      name: { en: "Beginner", no: "Nybegynner" }
      icon: "♟️"
      elo_range: [400, 800]
      description: "Learning basic tactics and game flow"
      
      prerequisites: "Level 0 complete"
      
      learning_goals:
        - "Recognize basic tactical patterns (forks, pins)"
        - "Understand piece values"
        - "Know basic opening principles"
        - "Avoid hanging pieces"
        - "Understand special moves (castling, en passant, promotion)"
      
      krog_focus:
        - "Special move conditions (castling prerequisites)"
        - "T2 (conditional) moves"
        - "Temporal logic for en passant window"
      
      completion_criteria:
        - "Reach 800 rating"
        - "Solve 50 tactical puzzles"
        - "Demonstrate all special moves correctly"
    
    level_2_novice:
      name: { en: "Novice", no: "Nybegynner+" }
      icon: "♞"
      elo_range: [800, 1000]
      description: "Developing consistent play"
      
      prerequisites: "Level 1 complete"
      
      learning_goals:
        - "Develop all pieces in the opening"
        - "Castle early for king safety"
        - "Control the center"
        - "Avoid one-move blunders"
        - "Basic endgame knowledge (K+Q vs K)"
      
      krog_focus:
        - "O(develop_pieces) as best practice"
        - "P(castle) preservation strategies"
        - "Basic R-type attack/defense relationships"
      
      completion_criteria:
        - "Reach 1000 rating"
        - "Win 10 games with proper development"
        - "Convert K+Q vs K endgame"
    
    level_3_intermediate:
      name: { en: "Intermediate", no: "Viderekommen" }
      icon: "♝"
      elo_range: [1000, 1200]
      description: "Understanding positional concepts"
      
      prerequisites: "Level 2 complete"
      
      learning_goals:
        - "Evaluate pawn structures"
        - "Understand piece activity"
        - "Calculate 2-3 moves ahead"
        - "Know 2-3 opening systems"
        - "Basic rook endgames"
      
      krog_focus:
        - "Positional R-types (piece coordination)"
        - "Strategic obligations vs tactical permissions"
        - "Multi-move temporal planning"
      
      completion_criteria:
        - "Reach 1200 rating"
        - "Win games using learned openings"
        - "Convert basic rook endgames"
    
    level_4_club_player:
      name: { en: "Club Player", no: "Klubbspiller" }
      icon: "♜"
      elo_range: [1200, 1400]
      description: "Competitive amateur level"
      
      prerequisites: "Level 3 complete"
      
      learning_goals:
        - "Opening repertoire (white + black)"
        - "Recognize all tactical motifs"
        - "Understand typical middlegame plans"
        - "Convert winning endgames reliably"
        - "Time management in competitive play"
      
      krog_focus:
        - "Opening-specific KROG patterns"
        - "Complex R-type combinations"
        - "Time control obligations"
      
      completion_criteria:
        - "Reach 1400 rating"
        - "Complete opening repertoire"
        - "Win tournament game"
    
    level_5_advanced:
      name: { en: "Advanced", no: "Avansert" }
      icon: "♛"
      elo_range: [1400, 1800]
      description: "Strong amateur player"
      
      prerequisites: "Level 4 complete"
      
      learning_goals:
        - "Deep opening preparation"
        - "Complex tactical calculation"
        - "Positional sacrifices"
        - "Prophylaxis concepts"
        - "Endgame technique"
      
      krog_focus:
        - "Advanced temporal logic"
        - "Prophylactic obligations"
        - "Complex multi-piece R-types"
      
      completion_criteria:
        - "Reach 1800 rating"
        - "Score 50%+ against 1600+ players"
        - "Demonstrate prophylactic thinking"
    
    level_6_expert:
      name: { en: "Expert", no: "Ekspert" }
      icon: "🏅"
      elo_range: [1800, 2200]
      description: "Near-master level"
      
      prerequisites: "Level 5 complete"
      
      learning_goals:
        - "Opening novelties and improvements"
        - "Deep strategic understanding"
        - "Complex endgame theory"
        - "Psychological aspects of play"
        - "Tournament preparation"
      
      krog_focus:
        - "Edge case rule applications"
        - "Variant rule systems"
        - "Arbiter-level rule knowledge"
      
      completion_criteria:
        - "Reach 2200 rating"
        - "Earn CM/NM title equivalent"
    
    level_7_master:
      name: { en: "Master", no: "Mester" }
      icon: "👑"
      elo_range: [2200, 3500]
      description: "Master-level play"
      
      prerequisites: "Level 6 complete"
      
      learning_goals:
        - "Original opening contributions"
        - "Deep analytical skills"
        - "Teaching ability"
        - "Professional-level preparation"
      
      krog_focus:
        - "Complete KROG chess specification mastery"
        - "Rule edge cases and disputes"
        - "Cross-domain rule transfer"
      
      completion_criteria:
        - "Reach 2200+ rating"
        - "Contribute to chess knowledge"
```

### 1.2 Skill Assessment

```yaml
skill_assessment:
  iri: "https://krog-rules.org/chess/education/assessment"
  
  assessment_types:
    initial_placement:
      description: "Determine starting level for new users"
      method: "Adaptive quiz + sample games"
      
      quiz_sections:
        - piece_movement: 10 questions
        - tactics_basic: 10 questions
        - tactics_advanced: 10 questions
        - endgames: 10 questions
        - openings: 10 questions
      
      game_analysis:
        - play_vs_ai: "3 games at estimated level"
        - move_quality: "Average centipawn loss"
        - blunder_rate: "Moves losing >100cp"
    
    continuous_tracking:
      description: "Ongoing skill measurement"
      metrics:
        - rating_trend: "7-day, 30-day, 90-day"
        - puzzle_rating: "Separate tactical rating"
        - accuracy_by_phase: "Opening, middlegame, endgame"
        - time_management: "Average move time vs quality"
    
    level_promotion:
      description: "Requirements to advance"
      requirements:
        - rating_threshold: "Must reach level's upper bound"
        - skill_demonstration: "Pass level-specific quiz"
        - practical_application: "Win games using learned concepts"
```

---

## 2. Learning Paths

### 2.1 Curriculum Structure

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          LEARNING PATHS
# ═══════════════════════════════════════════════════════════════════════════

learning_paths:
  iri: "https://krog-rules.org/chess/education/paths"
  
  path_beginner_to_intermediate:
    name: "Foundation Path"
    duration: "3-6 months"
    target_levels: [0, 1, 2, 3]
    
    modules:
      module_1_pieces:
        name: "The Chess Pieces"
        lessons:
          - lesson_1_1:
              title: "The Board"
              content:
                - "64 squares, alternating colors"
                - "Files (a-h), Ranks (1-8)"
                - "Diagonals and their names"
              krog: "Board as 8×8 matrix with (file, rank) coordinates"
              exercises:
                - "Name squares by coordinates"
                - "Identify diagonals"
              
          - lesson_1_2:
              title: "The King"
              content:
                - "Moves one square any direction"
                - "Most important piece (game ends if checkmated)"
                - "Cannot move into check"
              krog: |
                P(K) ↔ O(adjacent ∧ ¬attacked)
                F(K, move_to_attacked_square)
              exercises:
                - "Move king around empty board"
                - "Find safe squares"
              
          - lesson_1_3:
              title: "The Queen"
              content:
                - "Most powerful piece"
                - "Combines rook and bishop movement"
                - "Cannot jump over pieces"
              krog: |
                P(Q) ↔ O(orthogonal ∨ diagonal) ∧ clear_path
              exercises:
                - "Count queen's reachable squares"
                - "Practice queen movements"
              
          - lesson_1_4:
              title: "The Rook"
              content:
                - "Moves horizontally or vertically"
                - "Any number of squares"
                - "Important for endgames"
              krog: |
                P(R) ↔ O(orthogonal ∧ clear_path)
              exercises:
                - "Rook vs lone king practice"
              
          - lesson_1_5:
              title: "The Bishop"
              content:
                - "Moves diagonally"
                - "Stays on same color squares"
                - "Bishop pair is strong"
              krog: |
                P(B) ↔ O(diagonal ∧ clear_path ∧ same_color)
              exercises:
                - "Move bishop across entire board"
                - "Understand color restriction"
              
          - lesson_1_6:
              title: "The Knight"
              content:
                - "L-shaped movement (2+1 or 1+2)"
                - "Only piece that can jump"
                - "Alternates square colors"
              krog: |
                P(N) ↔ O(L_shape)  # Can jump: no clear_path constraint
              exercises:
                - "Knight tour challenge"
                - "Knight vs pawns"
              
          - lesson_1_7:
              title: "The Pawn"
              content:
                - "Moves forward, captures diagonally"
                - "First move: 1 or 2 squares"
                - "Promotes on 8th rank"
              krog: |
                P(P) ↔ O(forward ∧ (empty_target ∨ diagonal_capture))
                first_move → P(double_advance)
              exercises:
                - "Pawn races"
                - "Capture exercises"
      
      module_2_special:
        name: "Special Moves"
        lessons:
          - lesson_2_1:
              title: "Castling"
              content:
                - "King moves 2 squares toward rook"
                - "Rook jumps to other side of king"
                - "Requirements: unmoved, no check, path clear"
              krog: |
                P(castle) ↔ 
                  ¬moved(K) ∧ ¬moved(R) ∧ 
                  ¬check(K) ∧ 
                  clear_path ∧ 
                  ¬attacked(K_path)
              interactive:
                - "Show when castling allowed"
                - "Show when prohibited (with KROG reason)"
              
          - lesson_2_2:
              title: "En Passant"
              content:
                - "Special pawn capture"
                - "Only immediately after opponent's double move"
                - "Capture 'in passing'"
              krog: |
                P(en_passant) ↔ 
                  fifth_rank ∧ 
                  adjacent_pawn ∧ 
                  X⁻¹(opponent_double_move)  # Previous move temporal
                  
                F[>1_move](en_passant)  # Window closes after 1 move
              interactive:
                - "Trigger en passant scenarios"
                - "Show temporal window closing"
              
          - lesson_2_3:
              title: "Pawn Promotion"
              content:
                - "Pawn reaches 8th rank"
                - "Must become Q, R, B, or N"
                - "Usually promote to queen"
              krog: |
                O(promote) when pawn_reaches_8th
                P(promote_to) ∈ {Q, R, B, N}
                F(remain_pawn) ∧ F(promote_to_K)
              interactive:
                - "Underpromotion scenarios"
                - "Why choose knight?"
      
      module_3_checkmate:
        name: "Check and Checkmate"
        lessons:
          - lesson_3_1:
              title: "What is Check?"
              content:
                - "King is under attack"
                - "Must respond immediately"
                - "Three options: move, block, capture"
              krog: |
                check(K) → O(escape)
                escape ∈ {move_king, block_attack, capture_attacker}
                T3: Must engage when in check
              
          - lesson_3_2:
              title: "Checkmate"
              content:
                - "Check with no escape"
                - "Game ends immediately"
                - "Winning the game!"
              krog: |
                checkmate(K) ↔ check(K) ∧ ¬∃legal_move
                checkmate → game_over ∧ winner(opponent)
              
          - lesson_3_3:
              title: "Stalemate"
              content:
                - "No legal moves but not in check"
                - "Game is a draw"
                - "Common endgame trap"
              krog: |
                stalemate(K) ↔ ¬check(K) ∧ ¬∃legal_move
                stalemate → draw
      
      module_4_tactics_basic:
        name: "Basic Tactics"
        lessons:
          - lesson_4_1:
              title: "The Fork"
              content:
                - "One piece attacks two or more"
                - "Knight forks are most common"
                - "Wins material"
              krog: |
                fork(piece, target1, target2) ↔ 
                  attacks(piece, target1) ∧ attacks(piece, target2)
                R7: Exchange relationship (capture one, lose other)
              puzzles: 20
              
          - lesson_4_2:
              title: "The Pin"
              content:
                - "Piece can't move because it shields a more valuable piece"
                - "Absolute pin: shields king (illegal to move)"
                - "Relative pin: shields valuable piece"
              krog: |
                absolute_pin(piece) ↔ 
                  on_line(piece, king) ∧ 
                  attacks(attacker, piece) ∧
                  F(move_piece)  # Forbidden - would expose king
                  
                relative_pin(piece) ↔
                  on_line(piece, valuable) ∧
                  P(move_piece) but O¬(move_piece)  # Can but shouldn't
              puzzles: 20
              
          - lesson_4_3:
              title: "The Skewer"
              content:
                - "Reverse of a pin"
                - "Attack valuable piece, capture what's behind"
                - "Often wins material"
              krog: |
                skewer(attacker, front, back) ↔
                  attacks(attacker, front) ∧
                  on_line(front, back) ∧
                  value(front) ≥ value(back)
                  
                  front_moves → attacks(attacker, back)
              puzzles: 15
              
          - lesson_4_4:
              title: "Discovered Attack"
              content:
                - "Moving piece reveals attack from piece behind"
                - "Discovered check is powerful"
                - "Can be combined with direct attack"
              krog: |
                discovered_attack ↔
                  move(front_piece) →
                  reveals(attack, back_piece, target)
                  
                discovered_check: target = opponent_king
              puzzles: 15
```

### 2.2 Intermediate Path

```yaml
path_intermediate_to_advanced:
  name: "Development Path"
  duration: "6-12 months"
  target_levels: [3, 4, 5]
  
  modules:
    module_5_openings:
      name: "Opening Principles & Systems"
      # Detailed in Section 3
      
    module_6_middlegame:
      name: "Middlegame Strategy"
      # Detailed in Section 4
      
    module_7_endgames:
      name: "Essential Endgames"
      # Detailed in Section 5
      
    module_8_tactics_advanced:
      name: "Advanced Tactics"
      # Detailed in Section 6
```

---

## 3. Opening Theory

### 3.1 Opening Principles

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          OPENING THEORY
# ═══════════════════════════════════════════════════════════════════════════

opening_principles:
  iri: "https://krog-rules.org/chess/education/openings/principles"
  
  core_principles:
    principle_1_center:
      name: { en: "Control the Center", no: "Kontroller Sentrum" }
      description: "Place pawns and pieces to control d4, d5, e4, e5"
      why: "Central pieces have maximum mobility"
      
      krog: |
        O(control_center) ↔ 
          maximize(piece_influence, {d4, d5, e4, e5})
          
        evaluation_bonus(piece_on_center) > evaluation_bonus(piece_on_edge)
      
      examples:
        good: "1.e4, 1.d4, Nf3 developing toward center"
        bad: "1.a4, 1.h4 (ignores center)"
    
    principle_2_development:
      name: { en: "Develop Pieces", no: "Utvikle Brikkene" }
      description: "Move each piece once before moving any piece twice"
      why: "Get pieces into the game quickly"
      
      krog: |
        O(develop_piece) > O(move_developed_piece_again)
        
        development_count(position) = 
          count(pieces_moved_from_starting_square)
      
      examples:
        good: "1.e4 e5 2.Nf3 Nc6 3.Bc4 (3 pieces developed)"
        bad: "1.e4 e5 2.Qh5 (queen out too early)"
    
    principle_3_king_safety:
      name: { en: "Castle Early", no: "Rokker Tidlig" }
      description: "Castle within first 10 moves to protect king"
      why: "King in center is vulnerable"
      
      krog: |
        O(castle) by move_10 unless tactical_exception
        
        king_safety(castled) > king_safety(center)
      
      examples:
        good: "Castle kingside by move 6-8"
        bad: "Leave king in center with open files"
    
    principle_4_dont_move_pawns:
      name: { en: "Limit Pawn Moves", no: "Begrens Bondetrekk" }
      description: "In opening, move only center pawns"
      why: "Pawns can't move backward; weaknesses are permanent"
      
      krog: |
        opening_phase → 
          P(move_pawn) primarily for {e2-e4, d2-d4, c2-c3/c4}
          
        F(create_permanent_weakness) in opening
    
    principle_5_connect_rooks:
      name: { en: "Connect Rooks", no: "Koble Tårnene" }
      description: "Complete development so rooks can see each other"
      why: "Rooks on open files control the game"
      
      krog: |
        connected_rooks ↔ 
          no_pieces_between(rook_a, rook_b) on back_rank
          
        O(connect_rooks) as development_goal

opening_mistakes:
  iri: "https://krog-rules.org/chess/education/openings/mistakes"
  
  common_mistakes:
    bringing_queen_early:
      description: "Moving queen in first few moves"
      why_bad: "Queen can be attacked, loses time"
      krog: "O¬(Qout_early) unless forced_win"
      example_bad: "1.e4 e5 2.Qh5 - queen gets chased"
      
    moving_same_piece_twice:
      description: "Moving developed piece again"
      why_bad: "Wastes tempo, opponent develops"
      krog: "development_count++ > move_same_piece"
      
    neglecting_center:
      description: "Playing on wings before controlling center"
      why_bad: "Opponent gets central dominance"
      krog: "center_control > flank_play in opening"
      
    not_castling:
      description: "Leaving king in center too long"
      why_bad: "King vulnerable to central attacks"
      krog: "O(castle) by reasonable_time"
```

### 3.2 Opening Systems (By Level)

```yaml
opening_systems:
  iri: "https://krog-rules.org/chess/education/openings/systems"
  
  beginner_openings:
    italian_game:
      name: "Italian Game"
      eco: "C50-C59"
      moves: "1.e4 e5 2.Nf3 Nc6 3.Bc4"
      level: 1
      
      why_learn:
        - "Natural developing moves"
        - "Teaches opening principles"
        - "Rich tactical play"
      
      key_ideas:
        - "Control center with e4, d3"
        - "Develop to natural squares"
        - "Castle kingside"
        - "Plan f4 or d4 break"
      
      krog_analysis: |
        # White's plan formalized
        P(Bc4) targets f7 (weakest square)
        O(castle_kingside) for king safety
        P(d3_then_d4) central break
        
        # R-type: Bishop-f7 pressure relationship
        R_attack(Bc4, f7) creates weak_square_pressure
      
      main_lines:
        giuoco_piano: "3...Bc5 4.c3 (prepare d4)"
        two_knights: "3...Nf6 4.Ng5 (sharp attack)"
        evans_gambit: "3...Bc5 4.b4 (pawn sacrifice)"
      
      traps_to_know:
        - legal_trap: "1.e4 e5 2.Nf3 Nc6 3.Bc4 d6 4.Nc3 Bg4 5.h3 Bh5 6.Nxe5!"
        - fried_liver: "1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5 6.Nxf7!"
    
    london_system:
      name: "London System"
      eco: "D00"
      moves: "1.d4 d5 2.Bf4 (or 2.Nf3 Nf6 3.Bf4)"
      level: 1
      
      why_learn:
        - "Easy to learn setup"
        - "Same structure against anything"
        - "Solid and safe"
      
      key_ideas:
        - "Bf4, e3, Nf3, Bd3, c3"
        - "Pyramid pawn structure"
        - "Solid but slightly passive"
      
      krog_analysis: |
        P(Bf4) before e3 (otherwise locked in)
        O(e3, c3) creates solid structure
        F(lose_Bf4) maintains piece
    
    caro_kann:
      name: "Caro-Kann Defense"
      eco: "B10-B19"
      moves: "1.e4 c6"
      level: 2
      
      why_learn:
        - "Solid defense"
        - "Good pawn structure"
        - "Less theory than Sicilian"
      
      key_ideas:
        - "d5 follows, challenging center"
        - "Develop light-squared bishop before e6"
        - "Solid pawn structure"
      
      krog_analysis: |
        P(c6) prepares O(d5) central challenge
        F(lock_bishop) by playing e6 too early
  
  intermediate_openings:
    sicilian_defense:
      name: "Sicilian Defense"
      eco: "B20-B99"
      moves: "1.e4 c5"
      level: 3
      
      why_learn:
        - "Most popular response to 1.e4"
        - "Imbalanced positions"
        - "Rich strategic and tactical play"
      
      variants:
        najdorf: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6"
        dragon: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 g6"
        scheveningen: "1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e6"
        
      krog_analysis: |
        c5 creates asymmetric pawn structure
        Black trades c-pawn for d-pawn
        P(queenside_attack) for Black
        P(kingside_attack) for White
    
    queens_gambit:
      name: "Queen's Gambit"
      eco: "D06-D69"
      moves: "1.d4 d5 2.c4"
      level: 3
      
      responses:
        accepted: "2...dxc4 - take pawn, give center"
        declined: "2...e6 - maintain center, lock bishop"
        slav: "2...c6 - maintain center, develop bishop"
      
      krog_analysis: |
        P(c4) offers pawn for central influence
        IF accept: White gains tempo with e4
        IF decline: White maintains pressure
    
    ruy_lopez:
      name: "Ruy Lopez (Spanish)"
      eco: "C60-C99"
      moves: "1.e4 e5 2.Nf3 Nc6 3.Bb5"
      level: 4
      
      why_learn:
        - "Deepest opening theory"
        - "Classical strategic play"
        - "Tests positional understanding"
      
      main_lines:
        morphy_defense: "3...a6 4.Ba4 Nf6 5.O-O"
        berlin_defense: "3...Nf6 4.O-O Nxe4 (solid)"
        marshall_attack: "3...a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.c3 d5"
      
      krog_analysis: |
        Bb5 doesn't win e5 pawn immediately
        It creates long-term pressure on Nc6
        P(maintain_tension) > P(resolve_tension)
  
  advanced_openings:
    kings_indian:
      name: "King's Indian Defense"
      eco: "E60-E99"
      moves: "1.d4 Nf6 2.c4 g6 3.Nc3 Bg7"
      level: 5
      
      key_concepts:
        - "Hypermodern: control center from distance"
        - "Allow white center, attack it later"
        - "Kingside attack vs queenside attack race"
    
    grunfeld:
      name: "Grünfeld Defense"
      eco: "D70-D99"
      moves: "1.d4 Nf6 2.c4 g6 3.Nc3 d5"
      level: 5
      
      key_concepts:
        - "Immediate central challenge"
        - "Sacrifice center for piece activity"
        - "Complex strategic battles"
    
    english_opening:
      name: "English Opening"
      eco: "A10-A39"
      moves: "1.c4"
      level: 4
      
      key_concepts:
        - "Flank opening controlling d5"
        - "Flexible transpositions"
        - "Often leads to QGD structures reversed"
```

### 3.3 Opening Database Structure

```typescript
interface Opening {
  id: string;
  name: { en: string; no: string };
  eco: string;  // ECO code
  moves: string;  // Key moves in SAN
  level: number;  // 0-7 skill level
  
  description: string;
  keyIdeas: string[];
  typicalPlans: {
    white: string[];
    black: string[];
  };
  
  krogAnalysis: {
    formulas: string[];
    rTypes: RType[];
    strategicObligations: string[];
  };
  
  mainLines: VariationTree;
  traps: Trap[];
  modelGames: GameReference[];
  
  stats: {
    whiteWinRate: number;
    drawRate: number;
    blackWinRate: number;
    avgMoves: number;
    popularity: number;
  };
}

interface VariationTree {
  move: string;
  name?: string;
  comment?: string;
  evaluation?: number;
  krogNote?: string;
  children: VariationTree[];
}

interface Trap {
  name: string;
  moves: string;
  victimColor: 'white' | 'black';
  theme: string;  // "tactical", "positional"
  krogExplanation: string;
}
```

---

## 4. Middlegame Strategy

### 4.1 Strategic Concepts

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          MIDDLEGAME STRATEGY
# ═══════════════════════════════════════════════════════════════════════════

middlegame_concepts:
  iri: "https://krog-rules.org/chess/education/middlegame"
  
  concept_1_pawn_structure:
    name: { en: "Pawn Structure", no: "Bondestruktur" }
    level: 3
    
    types:
      isolated_pawn:
        description: "Pawn with no pawns on adjacent files"
        characteristics:
          - weakness: "Cannot be defended by pawns"
          - strength: "Open files for pieces, central control"
        krog: |
          isolated(pawn) ↔ ¬∃pawn on adjacent_files
          O(attack_isolated) for opponent
          P(use_open_files) for owner
        
      doubled_pawns:
        description: "Two pawns on same file"
        characteristics:
          - weakness: "One can't defend the other"
          - strength: "Open adjacent file"
        krog: |
          doubled(pawn_a, pawn_b) ↔ same_file(a, b)
          evaluation_penalty(doubled) unless compensation
        
      passed_pawn:
        description: "No enemy pawns can stop it"
        characteristics:
          - strength: "Potential queen"
          - weakness: "May need piece support"
        krog: |
          passed(pawn) ↔ 
            ¬∃enemy_pawn on (same_file ∨ adjacent_files) ahead
          O(push_passed_pawn) when safe
          O(blockade_passed_pawn) for opponent
        
      backward_pawn:
        description: "Pawn that cannot advance safely"
        characteristics:
          - weakness: "Fixed target"
        krog: |
          backward(pawn) ↔ 
            ¬can_advance_safely ∧ 
            behind_adjacent_pawns
        
      pawn_chain:
        description: "Pawns defending each other diagonally"
        krog: |
          chain(p1, p2, p3) ↔ defends(p1, p2) ∧ defends(p2, p3)
          O(attack_base) for opponent
          P(advance_head) for owner
  
  concept_2_piece_activity:
    name: { en: "Piece Activity", no: "Brikkeaktivitet" }
    level: 3
    
    principles:
      centralization:
        description: "Place pieces on central squares"
        krog: |
          activity(piece) ∝ squares_controlled(piece)
          central_piece > edge_piece (usually)
        
      outposts:
        description: "Square that can't be attacked by pawns"
        krog: |
          outpost(square) ↔ 
            ¬∃enemy_pawn can attack(square) ∧
            defended_by_own_pawn(square)
          O(occupy_outpost) with knight/bishop
        
      good_vs_bad_bishop:
        description: "Bishop blocked by own pawns vs not"
        krog: |
          bad_bishop ↔ 
            majority(own_pawns) on bishop_color_squares
          O(trade_bad_bishop) or P(free_bad_bishop)
        
      rook_activity:
        description: "Rooks on open/semi-open files"
        krog: |
          active_rook ↔ on_open_file ∨ on_seventh_rank
          O(activate_rooks) before endgame
  
  concept_3_weaknesses:
    name: { en: "Weaknesses", no: "Svakheter" }
    level: 4
    
    types:
      weak_square:
        description: "Square that can't be defended by pawns"
        krog: |
          weak_square(sq) ↔ ¬∃own_pawn can control(sq)
          O(exploit_weak_square) by placing piece
        
      weak_pawn:
        description: "Pawn that can be attacked and is hard to defend"
        krog: |
          weak_pawn(p) ↔ 
            attackable(p) ∧ 
            (isolated(p) ∨ backward(p) ∨ doubled(p))
        
      king_safety:
        description: "Weak squares around king"
        krog: |
          king_unsafe ↔ 
            weak_squares_near_king ∧ enemy_pieces_active
          O(attack_weak_king) when detected
  
  concept_4_planning:
    name: { en: "Planning", no: "Planlegging" }
    level: 4
    
    process:
      step_1: "Evaluate position (material, pawn structure, piece activity, king safety)"
      step_2: "Identify imbalances"
      step_3: "Formulate plan based on imbalances"
      step_4: "Execute plan move by move"
      step_5: "Reassess after opponent's response"
    
    krog: |
      plan(position) = 
        analyze(imbalances) → 
        choose(strategy) → 
        sequence(moves)
        
      O(follow_plan) unless opponent_creates_new_situation
      P(change_plan) when circumstances_change
    
    common_plans:
      - minority_attack: "b4-b5 against c6-d5 structure"
      - kingside_attack: "Push h and g pawns"
      - piece_improvement: "Reroute badly placed piece"
      - pawn_break: "d4, e4, f4, c4 to open position"
      - exchange_strategy: "Trade pieces to reach favorable endgame"
```

### 4.2 Tactical Motifs

```yaml
tactical_motifs:
  iri: "https://krog-rules.org/chess/education/tactics"
  
  motifs_by_level:
    level_1_basic:
      - fork
      - pin
      - skewer
      - hanging_piece
      - back_rank_mate
    
    level_2_intermediate:
      - discovered_attack
      - discovered_check
      - double_check
      - removing_defender
      - deflection
      - decoy
      - overloaded_piece
    
    level_3_advanced:
      - zwischenzug: "In-between move before expected recapture"
      - x_ray: "Attack through a piece to one behind"
      - clearance: "Move piece to clear square/line"
      - interference: "Block a defensive line"
      - desperado: "Capture something before being captured"
    
    level_4_complex:
      - combination: "Multiple motifs in sequence"
      - quiet_move: "Non-forcing move that creates unstoppable threat"
      - positional_sacrifice: "Long-term compensation"

  motif_database:
    fork:
      description: "One piece attacks two or more pieces"
      pieces_that_fork: ["N", "Q", "K", "P", "B", "R"]
      most_common: "Knight (because it can't be blocked)"
      
      krog: |
        fork(attacker, t1, t2) ↔
          attacks(attacker, t1) ∧ 
          attacks(attacker, t2) ∧
          ¬can_defend_both(t1, t2)
          
        # R-type: Forced exchange
        R7: O(lose_one_piece)
      
      examples:
        - royal_fork: "Knight forks king and queen"
        - family_fork: "Knight forks king, queen, and rook"
        - pawn_fork: "Pawn attacks two pieces"
    
    pin:
      types:
        absolute:
          description: "Pinned piece shields king"
          krog: |
            absolute_pin(piece) ↔
              in_line(attacker, piece, king) ∧
              F(move_piece)  # Moving is illegal
        relative:
          description: "Pinned piece shields valuable piece"
          krog: |
            relative_pin(piece) ↔
              in_line(attacker, piece, valuable) ∧
              P(move_piece) but O¬(move_piece)  # Can but shouldn't
      
      exploitation:
        - pile_up: "Add more attackers to pinned piece"
        - win_material: "Pinned piece can't escape"
    
    removing_defender:
      description: "Capture or deflect piece defending key square/piece"
      krog: |
        remove_defender(defender, target) ↔
          defends(defender, target) ∧
          (capture(defender) ∨ deflect(defender)) →
          wins(target)
      
      types:
        - capture_defender: "Take the defending piece"
        - deflection: "Force defender to move"
        - overloading: "Give defender too many jobs"
```

---

## 5. Endgame Mastery

### 5.1 Essential Endgames

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          ENDGAME THEORY
# ═══════════════════════════════════════════════════════════════════════════

endgames:
  iri: "https://krog-rules.org/chess/education/endgames"
  
  level_1_basic:
    king_queen_vs_king:
      name: "K+Q vs K"
      result: "Win for Q side"
      technique:
        - "Use queen to restrict king"
        - "Bring own king closer"
        - "Push king to edge"
        - "Deliver checkmate on edge"
      
      krog: |
        O(restrict_king) with queen
        O(approach_with_king) for checkmate
        checkmate_pattern: king_on_edge ∧ queen_delivers_mate
      
      max_moves: 10
      practice: "Set up and win from any position"
    
    king_rook_vs_king:
      name: "K+R vs K"
      result: "Win for R side"
      technique:
        - "Cut off king with rook"
        - "Use box method"
        - "Push king to edge"
        - "Deliver back-rank mate"
      
      krog: |
        O(cut_off_king) with rook on file/rank
        shrink_box → force_king_to_edge
        back_rank_mate: rook_delivers ∧ king_supports
      
      max_moves: 16
      practice: "Master the 'box' technique"
    
    king_two_bishops_vs_king:
      name: "K+B+B vs K"
      result: "Win"
      technique:
        - "Force king to corner of either color"
        - "Bishops control diagonals"
        - "Coordinate with king"
      
      max_moves: 19
    
    king_bishop_knight_vs_king:
      name: "K+B+N vs K"
      result: "Win but difficult"
      technique:
        - "Force king to corner of bishop's color"
        - "W maneuver with knight"
        - "Complex coordination"
      
      max_moves: 33
      note: "Many players can't do this - worth learning!"
  
  level_2_pawn_endings:
    king_pawn_vs_king:
      name: "K+P vs K"
      result: "Win or draw depending on position"
      
      key_concepts:
        opposition:
          description: "Kings face each other with odd squares between"
          krog: |
            opposition ↔ 
              same_file_or_rank(K1, K2) ∧ 
              odd_distance(K1, K2)
            
            has_opposition(player) → advantage(player)
        
        key_squares:
          description: "Squares king must reach to win"
          krog: |
            key_squares(pawn_on_file, rank) = 
              three_squares_two_ranks_ahead_of_pawn
            
            king_reaches_key_square → O(win)
        
        rule_of_square:
          description: "Can defending king catch the pawn?"
          krog: |
            pawn_promotes ↔ ¬king_in_square(pawn)
            
            square = diagonal_from_pawn_to_promotion_rank
      
      positions:
        win: "King ahead of pawn, opposition"
        draw: "Rook pawn (usually), king can't gain opposition"
    
    pawn_race:
      name: "Pawn races"
      description: "Both sides promoting - who queens first?"
      
      krog: |
        race_winner = 
          min(white_promotion_distance, black_promotion_distance)
          
        IF tie: who_promotes_with_check matters
        
      counting_method:
        - "Count moves to promotion"
        - "Check for checks after promotion"
        - "Consider queen vs queen positions"
  
  level_3_rook_endings:
    lucena_position:
      name: "Lucena Position"
      description: "Winning technique when pawn is on 7th"
      
      setup: "King in front of pawn, rook behind"
      technique:
        - "Build a bridge with the rook"
        - "Shelter king from checks"
        - "Promote pawn"
      
      krog: |
        lucena ↔ 
          pawn_on_7th ∧ 
          king_in_front ∧ 
          rook_active
          
        O(build_bridge) to win
      
      key_moves: "Rook to 4th rank, then cut off enemy king"
    
    philidor_position:
      name: "Philidor Position"
      description: "Drawing technique for defender"
      
      setup: "Rook on 6th rank, passive defense"
      technique:
        - "Keep rook on 6th until pawn advances"
        - "Then go to back rank for checks"
        - "Cut off enemy king"
      
      krog: |
        philidor_draw ↔
          rook_on_6th ∧ 
          king_in_front_of_pawn_blocked
          
        pawn_advances → O(rook_to_back_rank) for checks
    
    rook_pawn_endings:
      concepts:
        - "Rook belongs behind passed pawn (own or enemy)"
        - "Active rook > passive rook"
        - "Cut off enemy king"
        - "7th rank is powerful"
  
  level_4_complex:
    opposite_color_bishops:
      description: "Each side has one bishop, different colors"
      characteristic: "Strongly drawing tendency"
      
      krog: |
        opposite_bishops ↔
          ∃white_bishop ∧ ∃black_bishop ∧
          color(white_bishop) ≠ color(black_bishop)
          
        drawing_tendency(opposite_bishops) = HIGH
        
        exception: passed_pawns_on_both_wings
    
    queen_endings:
      characteristics:
        - "Very tactical, hard to calculate"
        - "Perpetual check common"
        - "King safety crucial"
      
      krog: |
        queen_ending → 
          high_draw_rate ∧
          perpetual_check_risk ∧
          O(protect_king_first)
```

### 5.2 Endgame Tablebases

```yaml
tablebases:
  iri: "https://krog-rules.org/chess/education/tablebases"
  
  description: |
    Endgame tablebases contain perfect play for all positions 
    with limited pieces. They prove whether positions are 
    win/draw/loss with best play.
  
  supported_tablebases:
    syzygy:
      pieces: "Up to 7 pieces"
      format: "DTZ (Distance To Zeroing)"
      usage: "Find best move, determine outcome"
    
    nalimov:
      pieces: "Up to 6 pieces"
      format: "DTM (Distance To Mate)"
      usage: "Exact mate distance"
  
  integration:
    teaching_mode:
      description: "Show tablebase evaluation during endgame lessons"
      features:
        - "Highlight winning/drawing moves"
        - "Show DTZ/DTM for each move"
        - "Explain why certain moves win/draw"
    
    game_analysis:
      description: "Use tablebases to evaluate endgame play"
      features:
        - "Identify endgame mistakes"
        - "Show missed wins"
        - "Compare to perfect play"
    
    krog_integration:
      description: "Tablebases prove KROG endgame formulas"
      example: |
        # K+R vs K is winning
        tablebase_proves: |
          ∀positions(K+R vs K): 
            ∃winning_sequence → checkmate
            max_moves = 16
```

---

## 6. Puzzle System

### 6.1 Puzzle Categories

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                          PUZZLE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

puzzle_system:
  iri: "https://krog-rules.org/chess/education/puzzles"
  
  categories:
    tactical_puzzles:
      themes:
        - mate_in_1: { level: 0, description: "Find checkmate in one move" }
        - mate_in_2: { level: 1, description: "Find checkmate in two moves" }
        - mate_in_3: { level: 2, description: "Find checkmate in three moves" }
        - fork: { level: 1, description: "Win material with a fork" }
        - pin: { level: 1, description: "Exploit or create a pin" }
        - skewer: { level: 2, description: "Win material with a skewer" }
        - discovered_attack: { level: 2, description: "Use discovered attack" }
        - double_check: { level: 2, description: "Deliver double check" }
        - removing_defender: { level: 3, description: "Remove key defender" }
        - deflection: { level: 3, description: "Deflect piece from key duty" }
        - decoy: { level: 3, description: "Lure piece to bad square" }
        - interference: { level: 4, description: "Block defensive line" }
        - zwischenzug: { level: 4, description: "Find in-between move" }
        - quiet_move: { level: 5, description: "Non-forcing winning move" }
    
    strategic_puzzles:
      themes:
        - find_the_plan: { level: 3, description: "Choose best strategic plan" }
        - improve_piece: { level: 3, description: "Find best square for piece" }
        - pawn_break: { level: 4, description: "Find correct pawn break" }
        - prophylaxis: { level: 5, description: "Prevent opponent's plan" }
        - exchange_decision: { level: 4, description: "Trade or keep pieces?" }
    
    endgame_puzzles:
      themes:
        - basic_checkmates: { level: 1, description: "K+Q vs K, K+R vs K" }
        - pawn_promotion: { level: 2, description: "Promote the pawn" }
        - opposition: { level: 3, description: "Use opposition to win/draw" }
        - lucena_philidor: { level: 4, description: "Apply theoretical technique" }
        - fortress: { level: 5, description: "Find drawing setup" }
    
    defensive_puzzles:
      themes:
        - save_the_game: { level: 3, description: "Find only drawing move" }
        - escape_checkmate: { level: 2, description: "Avoid being mated" }
        - perpetual_check: { level: 3, description: "Force draw by repetition" }
        - stalemate_trick: { level: 4, description: "Find stalemate resource" }

  puzzle_structure:
    ```typescript
    interface Puzzle {
      id: string;
      fen: string;
      solution: string[];  // Moves in UCI
      themes: string[];
      level: number;
      rating: number;  // Puzzle difficulty rating
      
      metadata: {
        source?: string;  // Game or composition
        author?: string;
        date?: string;
      };
      
      krogAnalysis: {
        keyMotif: string;
        formula: string;
        explanation: {
          en: string;
          no: string;
        };
      };
      
      hints: string[];  // Progressive hints
      
      stats: {
        attempts: number;
        solveRate: number;
        avgTime: number;
      };
    }
    ```

  adaptive_difficulty:
    description: "Puzzles adjust to user's skill"
    algorithm: |
      puzzle_rating_range = user_puzzle_rating ± 100
      
      IF solve_streak ≥ 3: increase_difficulty
      IF fail_streak ≥ 2: decrease_difficulty
      
      target_solve_rate: 60-70%
    
    krog_hints:
      hint_1: "Theme identification (e.g., 'Look for a fork')"
      hint_2: "Target piece identification"
      hint_3: "First move hint"
      hint_4: "KROG formula for the solution"
```

### 6.2 Puzzle Modes

```yaml
puzzle_modes:
  standard:
    description: "Random puzzles at your level"
    features:
      - "Adaptive difficulty"
      - "Rating changes based on performance"
      - "Track streaks"
  
  themed:
    description: "Focus on specific tactical theme"
    features:
      - "Select theme (fork, pin, etc.)"
      - "Learn pattern recognition"
      - "Master one theme at a time"
  
  puzzle_rush:
    description: "Solve as many as possible in time limit"
    modes:
      survival: "3 wrong = game over"
      timed_3min: "Most puzzles in 3 minutes"
      timed_5min: "Most puzzles in 5 minutes"
  
  puzzle_streak:
    description: "How many can you solve without mistakes?"
    features:
      - "Starts easy, gets harder"
      - "One mistake ends streak"
      - "Leaderboard for longest streaks"
  
  daily_puzzle:
    description: "One puzzle per day, same for everyone"
    features:
      - "Compare with friends"
      - "Global leaderboard"
      - "Streak tracking"
  
  lesson_puzzles:
    description: "Puzzles tied to current lesson"
    features:
      - "Reinforces lesson concepts"
      - "Progressive difficulty"
      - "Must complete to advance"
```

---

## 7. Interactive Tutorials

### 7.1 Tutorial System

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                       INTERACTIVE TUTORIALS
# ═══════════════════════════════════════════════════════════════════════════

tutorial_system:
  iri: "https://krog-rules.org/chess/education/tutorials"
  
  tutorial_types:
    guided_lesson:
      description: "Step-by-step instruction with practice"
      structure:
        - introduction: "What you'll learn"
        - explanation: "Concept with examples"
        - demonstration: "Watch moves on board"
        - practice: "Try it yourself (guided)"
        - challenge: "Apply without help"
        - review: "Summary and KROG formula"
    
    interactive_position:
      description: "Explore a position hands-on"
      features:
        - "Try any move"
        - "See KROG validation"
        - "AI shows consequences"
        - "Reset and try again"
    
    video_lesson:
      description: "Video explanation with interactive board"
      features:
        - "Pause and explore"
        - "Interactive checkpoints"
        - "Quiz questions"
    
    game_analysis:
      description: "Learn from master games"
      features:
        - "Move-by-move commentary"
        - "KROG analysis at key moments"
        - "Guess the move challenges"

  tutorial_features:
    krog_explanations:
      description: "Every rule explained with KROG"
      example: |
        User tries illegal castling through check
        
        System shows:
        "❌ Castling not permitted"
        
        KROG: F(castle_through_check)
        
        Explanation: "The king cannot castle through 
        an attacked square. Your king would pass 
        through f1, which is attacked by the bishop 
        on b5."
        
        FIDE: Article 3.8.2.1
    
    adaptive_pacing:
      description: "Adjust speed to learner"
      features:
        - "Skip ahead if mastered"
        - "Extra practice if struggling"
        - "Personalized review"
    
    voice_support:
      description: "Audio explanations and voice commands"
      features:
        - "Listen to explanations"
        - "Voice commands: 'Show me', 'Explain', 'Next'"
        - "Multilingual support"
```

### 7.2 Sample Tutorial: Castling

```yaml
tutorial_castling:
  title: { en: "Castling - The King's Shield", no: "Rokade - Kongens Skjold" }
  level: 1
  duration: "15 minutes"
  prerequisites: ["piece_movement"]
  
  sections:
    section_1_intro:
      title: "What is Castling?"
      content: |
        Castling is a special move that:
        - Moves the king 2 squares toward a rook
        - The rook jumps to the other side of the king
        - Both pieces move in ONE turn
        
        It's the only move where two pieces move at once!
      
      visual: "Animation showing kingside and queenside castling"
      
      krog_intro: |
        P(castle) - "Permission to castle"
        
        Castling has many conditions that must ALL be true.
    
    section_2_types:
      title: "Two Types of Castling"
      
      kingside:
        notation: "O-O"
        description: "King goes toward the h-rook"
        white: "King e1→g1, Rook h1→f1"
        black: "King e8→g8, Rook h8→f8"
        visual: "Interactive demo - try it!"
      
      queenside:
        notation: "O-O-O"
        description: "King goes toward the a-rook"
        white: "King e1→c1, Rook a1→d1"
        black: "King e8→c8, Rook a8→d8"
        visual: "Interactive demo - try it!"
    
    section_3_requirements:
      title: "When Can You Castle?"
      
      requirement_1:
        rule: "King has never moved"
        krog: "¬moved(king)"
        interactive: "Try to castle after moving king"
        
      requirement_2:
        rule: "Rook has never moved"
        krog: "¬moved(rook)"
        interactive: "Try to castle after moving rook"
        
      requirement_3:
        rule: "No pieces between king and rook"
        krog: "empty(squares_between)"
        interactive: "Try to castle with pieces in the way"
        
      requirement_4:
        rule: "King is not in check"
        krog: "¬check(king)"
        interactive: "Try to castle while in check"
        
      requirement_5:
        rule: "King doesn't pass through check"
        krog: "¬attacked(king_path)"
        interactive: "Try to castle through attacked square"
        
      requirement_6:
        rule: "King doesn't land in check"
        krog: "¬attacked(king_destination)"
        interactive: "Try to castle into check"
    
    section_4_complete_formula:
      title: "The Complete KROG Formula"
      
      krog: |
        P(castle) ↔ 
          ¬moved(king) ∧ 
          ¬moved(rook) ∧ 
          empty(between) ∧
          ¬check(king) ∧ 
          ¬attacked(king_path) ∧
          ¬attacked(king_destination)
        
        Note: Rook CAN pass through attacked square!
      
      common_confusion: |
        "Can I castle if my rook is attacked?"
        YES! Only the KING's path matters.
        
        "Can I castle if my rook passes through attacked square?"
        YES! Only the KING's path matters.
    
    section_5_practice:
      title: "Practice Exercises"
      
      exercises:
        - type: "identify_legal"
          instruction: "Can White castle kingside?"
          positions: 5
          
        - type: "find_problem"
          instruction: "Why can't Black castle?"
          positions: 5
          
        - type: "execute"
          instruction: "Castle when legal, find why not if illegal"
          positions: 5
    
    section_6_quiz:
      title: "Castling Quiz"
      questions:
        - question: "Can the king castle if it was previously in check but escaped?"
          answer: "Yes, as long as the king didn't MOVE to escape"
          krog: "previous_check doesn't affect castling; only king_movement does"
          
        - question: "Can you castle if your rook is attacked?"
          answer: "Yes, only the king's path matters"
          
        - question: "What happens to castling rights if you move your rook and then move it back?"
          answer: "Rights are lost forever - the rook has moved"
          krog: "G[past](moved(rook)) → F[future](castle_with_rook)"
```

---

## 8. Progress Tracking

### 8.1 Skill Tracking

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                       PROGRESS TRACKING
# ═══════════════════════════════════════════════════════════════════════════

progress_tracking:
  iri: "https://krog-rules.org/chess/education/progress"
  
  skill_areas:
    openings:
      metrics:
        - "Repertoire completion %"
        - "Opening accuracy (centipawn loss)"
        - "Theory knowledge depth"
      tracking:
        per_opening:
          - moves_known
          - accuracy_in_games
          - common_mistakes
    
    tactics:
      metrics:
        - "Puzzle rating"
        - "Solve rate by theme"
        - "Average solve time"
        - "Streak records"
      tracking:
        per_theme:
          - puzzles_attempted
          - solve_rate
          - average_time
          - rating_for_theme
    
    strategy:
      metrics:
        - "Positional evaluation accuracy"
        - "Plan selection quality"
        - "Middlegame centipawn loss"
      tracking:
        per_concept:
          - lessons_completed
          - quiz_scores
          - practical_application
    
    endgames:
      metrics:
        - "Endgame win/draw conversion rate"
        - "Theoretical position knowledge"
        - "Endgame centipawn loss"
      tracking:
        per_ending:
          - lessons_completed
          - practice_score
          - game_performance
    
    time_management:
      metrics:
        - "Average move time"
        - "Time trouble frequency"
        - "Quality vs time correlation"

  achievements:
    description: "Badges for milestones"
    
    categories:
      learning:
        - first_lesson: "Complete your first lesson"
        - level_up: "Reach each skill level"
        - streak_7: "7-day learning streak"
        - streak_30: "30-day learning streak"
        - completionist: "Complete all lessons in a module"
      
      puzzles:
        - puzzle_solver: "Solve 100 puzzles"
        - puzzle_master: "Solve 1000 puzzles"
        - streak_10: "10 puzzles in a row"
        - streak_50: "50 puzzles in a row"
        - theme_master: "Master a tactical theme"
      
      gameplay:
        - first_win: "Win your first game"
        - rating_milestones: "Reach 800, 1000, 1200..."
        - checkmate_patterns: "Deliver back-rank mate, etc."
        - opening_mastery: "Win 10 games with same opening"
      
      krog_specific:
        - rule_master: "Know all piece movement rules"
        - special_moves: "Correctly execute all special moves"
        - variant_explorer: "Play all chess variants"

  reports:
    weekly_summary:
      contents:
        - "Games played and rating change"
        - "Puzzles solved and rating change"
        - "Lessons completed"
        - "Time spent learning"
        - "Improvement areas identified"
      
    monthly_progress:
      contents:
        - "Rating graph"
        - "Skills radar chart"
        - "Comparison to previous month"
        - "Recommendations for next month"
      
    game_analysis:
      contents:
        - "Phase-by-phase performance"
        - "Accuracy by move number"
        - "Mistakes categorized"
        - "Improvement suggestions"
```

### 8.2 TypeScript Interface

```typescript
interface LearnerProfile {
  userId: string;
  currentLevel: number;  // 0-7
  
  ratings: {
    overall: number;
    puzzles: number;
    bullet: number;
    blitz: number;
    rapid: number;
  };
  
  progress: {
    openings: OpeningProgress;
    tactics: TacticsProgress;
    strategy: StrategyProgress;
    endgames: EndgameProgress;
  };
  
  achievements: Achievement[];
  
  learningPath: {
    currentModule: string;
    currentLesson: string;
    completedLessons: string[];
    scheduledReviews: ScheduledReview[];
  };
  
  statistics: {
    gamesPlayed: number;
    puzzlesSolved: number;
    lessonsCompleted: number;
    totalLearningTime: number;  // minutes
    currentStreak: number;  // days
    longestStreak: number;
  };
  
  preferences: {
    learningPace: 'relaxed' | 'normal' | 'intensive';
    dailyGoal: number;  // minutes
    focusAreas: string[];
    preferredLanguage: string;
  };
}

interface OpeningProgress {
  repertoire: {
    asWhite: OpeningRepertoire;
    asBlack: OpeningRepertoire;
  };
  knownOpenings: string[];  // ECO codes
  accuracyByOpening: Record<string, number>;
}

interface TacticsProgress {
  totalSolved: number;
  byTheme: Record<string, ThemeProgress>;
  recentAccuracy: number;
  strengths: string[];
  weaknesses: string[];
}

interface ThemeProgress {
  solved: number;
  accuracy: number;
  avgTime: number;
  rating: number;
}

interface ScheduledReview {
  topic: string;
  dueDate: Date;
  lastReviewDate: Date;
  interval: number;  // days until next review
}
```

---

## 9. AI Tutor Integration

### 9.1 AI Tutor Capabilities

```yaml
# ═══════════════════════════════════════════════════════════════════════════
#                       AI TUTOR INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════

ai_tutor:
  iri: "https://krog-rules.org/chess/education/ai-tutor"
  
  capabilities:
    personalized_teaching:
      description: "Adapts to learner's level and style"
      features:
        - "Identify knowledge gaps"
        - "Adjust explanation complexity"
        - "Choose appropriate examples"
        - "Pace content delivery"
      
      krog: |
        O(adapt_to_learner) - Tutor must engage appropriately
        T3 (tutor) + T1 (student) = R14 teaching relationship
    
    move_explanation:
      description: "Explain any move in any position"
      features:
        - "Why is this move good/bad?"
        - "What are the alternatives?"
        - "What's the plan?"
        - "KROG formula explanation"
      
      example: |
        User asks: "Why did you play Nc3?"
        
        Tutor: "I played Nc3 for several reasons:
        
        1. Development: Moving a piece off the back rank
        2. Center control: Knight attacks d5 and e4
        3. Flexibility: Doesn't block the c-pawn yet
        
        KROG: P(Nc3) satisfies O(develop_pieces)
        
        Alternatives considered:
        - Nf3 also good (develops toward center)
        - Bc4 slightly premature (d5 still possible)
        - d3 passive (but playable)"
    
    mistake_analysis:
      description: "Identify and explain mistakes"
      features:
        - "Point out blunders tactfully"
        - "Explain what was missed"
        - "Suggest improvement"
        - "Show correct continuation"
      
      example: |
        User blunders queen to a fork
        
        Tutor: "Oops! That move allowed a knight fork.
        
        What happened:
        After Qe5?, my knight can jump to c6, 
        attacking both your queen and rook (fork!).
        
        KROG: fork(Nc6, Qe5, Ra8) - attacks both targets
        
        Better was: Qd6 - protects the rook and stays safe
        
        Tip: Before moving your queen, always check 
        if your opponent has any knight forks!"
    
    hint_system:
      description: "Progressive hints without giving answer"
      levels:
        hint_1: "Theme identification"
        hint_2: "Key piece/square"
        hint_3: "Direction of solution"
        hint_4: "First move hint"
        hint_5: "KROG formula"
        hint_6: "Full explanation"
      
      example: |
        Puzzle: Black to play and win material
        
        Hint 1: "Look for a common tactical pattern"
        Hint 2: "The knight is the key piece"
        Hint 3: "Can the knight attack two things at once?"
        Hint 4: "The first move is Ne2+"
        Hint 5: "fork(Ne2, Kg1, Qc3) wins the queen"
        Hint 6: "Ne2+ is a royal fork! The king must move,
                 then Nxc3 captures the queen."
    
    game_coaching:
      description: "Real-time advice during games"
      modes:
        practice_mode:
          - "Suggest moves when asked"
          - "Warn about obvious blunders"
          - "Explain opponent's threats"
        
        analysis_mode:
          - "Review game move by move"
          - "Identify critical moments"
          - "Suggest improvements"
        
        teaching_game:
          - "Tutor plays at learner's level"
          - "Makes instructive moves"
          - "Explains its thinking"

  tutor_personalities:
    encouraging:
      name: "Coach Emma"
      style: "Warm, supportive, focuses on positives"
      phrases:
        - "Great attempt! Let's look at what happened..."
        - "You're on the right track!"
        - "Remember our lesson about forks?"
    
    analytical:
      name: "Professor Max"
      style: "Precise, thorough, KROG-focused"
      phrases:
        - "The KROG formula here is..."
        - "Objectively, this position evaluates to..."
        - "The optimal continuation is..."
    
    playful:
      name: "Buddy the Bot"
      style: "Fun, uses chess humor, celebrates victories"
      phrases:
        - "Ooh, nice fork! Stick 'em up! 🍴"
        - "That knight is on a rampage!"
        - "Your queen is saying 'catch me if you can!'"
```

### 9.2 AI Tutor TypeScript Interface

```typescript
interface AITutor {
  personality: 'encouraging' | 'analytical' | 'playful';
  language: string;
  
  // Core functions
  explainMove(position: Position, move: Move): Explanation;
  analyzePosition(position: Position): PositionAnalysis;
  suggestMove(position: Position, level: number): MoveSuggestion;
  findMistakes(game: Game): Mistake[];
  
  // Teaching functions
  createLesson(topic: string, level: number): Lesson;
  generatePuzzle(theme: string, level: number): Puzzle;
  adaptDifficulty(learner: LearnerProfile): void;
  
  // Interaction
  respondToQuestion(question: string, context: GameContext): string;
  giveHint(puzzle: Puzzle, hintLevel: number): string;
  encourageLearner(context: LearningContext): string;
}

interface Explanation {
  summary: string;
  detailed: string;
  krogFormula?: string;
  alternatives: AlternativeMove[];
  visualHighlights: Square[];
  relatedConcepts: string[];
}

interface MoveSuggestion {
  move: Move;
  reasoning: string;
  confidence: number;
  krogValidation: KROGValidation;
  teachingPoints: string[];
}

interface Mistake {
  moveNumber: number;
  played: Move;
  better: Move;
  type: 'blunder' | 'mistake' | 'inaccuracy';
  explanation: string;
  theme: string;  // What tactical/strategic theme was missed
  krogNote: string;
}
```

---

## 10. Implementation Checklist (Phase 5)

### Content Creation

- [ ] Level 0-2 lesson content (beginner)
- [ ] Level 3-4 lesson content (intermediate)
- [ ] Level 5-7 lesson content (advanced)
- [ ] Opening database (50+ openings with KROG analysis)
- [ ] Tactical theme library (15+ themes)
- [ ] Endgame lesson content (20+ endings)
- [ ] Puzzle database (10,000+ puzzles)
- [ ] Interactive tutorial scripts

### System Development

- [ ] Skill assessment algorithm
- [ ] Adaptive difficulty system
- [ ] Progress tracking database
- [ ] Achievement system
- [ ] Spaced repetition scheduler
- [ ] AI tutor integration
- [ ] Voice support for tutorials

### Client Updates

- [ ] Learning path UI
- [ ] Lesson viewer component
- [ ] Interactive tutorial board
- [ ] Puzzle interface
- [ ] Progress dashboard
- [ ] Achievement display
- [ ] AI tutor chat interface

### Database Schema

```sql
-- Learner profiles
CREATE TABLE learner_profiles (
  user_id UUID PRIMARY KEY,
  current_level INT DEFAULT 0,
  puzzle_rating INT DEFAULT 1500,
  learning_preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Progress tracking
CREATE TABLE lesson_progress (
  user_id UUID REFERENCES learner_profiles(user_id),
  lesson_id VARCHAR(100),
  completed BOOLEAN DEFAULT FALSE,
  score INT,
  completed_at TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id)
);

-- Puzzle attempts
CREATE TABLE puzzle_attempts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES learner_profiles(user_id),
  puzzle_id VARCHAR(100),
  solved BOOLEAN,
  time_taken INT,  -- seconds
  hints_used INT,
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE user_achievements (
  user_id UUID REFERENCES learner_profiles(user_id),
  achievement_id VARCHAR(100),
  earned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Spaced repetition
CREATE TABLE review_schedule (
  user_id UUID REFERENCES learner_profiles(user_id),
  topic_id VARCHAR(100),
  next_review DATE,
  interval_days INT DEFAULT 1,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  PRIMARY KEY (user_id, topic_id)
);
```

---

**Phase 5 Complete.** This document provides the comprehensive educational system:
- 8-level skill progression from absolute beginner to master
- Structured learning paths with KROG-enhanced lessons
- Opening theory with formal analysis
- Middlegame strategic concepts
- Essential endgame knowledge with tablebase integration
- Adaptive puzzle system
- Interactive tutorials with KROG explanations
- Comprehensive progress tracking
- AI tutor integration with multiple personalities

**All 5 KROG Chess Specification Phases Complete!**

Ready for implementation or additional content development?
