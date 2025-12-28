/**
 * KROG Chess Engine - Main Entry Point
 *
 * The complete KROG framework implementation for chess.
 * Every chess rule is validated using formal mathematical operators.
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

import {
  Move,
  GameState,
  Color,
  Square,
  Piece,
  PieceType,
  RType,
  KROGValidation,
  KROGRuleJSON,
  FIDERule,
  opponent,
  squareToString
} from './types';

import {
  CoreOperators,
  PermissionOperator,
  ObligationOperator,
  ProhibitionOperator,
  ClaimOperator,
  LibertyOperator,
  PowerOperator,
  ImmunityOperator,
  DisabilityOperator,
  LiabilityOperator
} from './core-operators';

import {
  PieceLogicOperators,
  PM_Operator,
  PC_Operator,
  PA_Operator,
  CR_Operator,
  EP_Operator,
  PO_Operator,
  NV_Operator,
  PD_Operator
} from './piece-logic';

import {
  BoardLogicOperators,
  CS_Operator,
  LMG_Operator,
  GT_Operator,
  PR_Operator,
  FMC_Operator
} from './board-logic';

import { NotationOperators, GN_Operator } from './notation';
import { TemporalOperators } from './temporal';
import RTypeClassifier from './rtype-classifier';

// ============================================================================
// KROG CHESS ENGINE
// ============================================================================

export class KROGChessEngine {
  // Core operators
  private P: PermissionOperator;
  private O: ObligationOperator;
  private F: ProhibitionOperator;
  private C: ClaimOperator;
  private L: LibertyOperator;
  private W: PowerOperator;
  private B: ImmunityOperator;
  private I: DisabilityOperator;
  private D: LiabilityOperator;

  // Piece logic operators
  private PM: PM_Operator;
  private PC: PC_Operator;
  private PA: PA_Operator;
  private CR: CR_Operator;
  private EP: EP_Operator;
  private PO: PO_Operator;
  private NV: NV_Operator;
  private PD: PD_Operator;

  // Board logic operators
  private CS: CS_Operator;
  private LMG: LMG_Operator;
  private GT: GT_Operator;
  private PR: PR_Operator;
  private FMC: FMC_Operator;

  // Notation
  private GN: GN_Operator;

  // R-Type classifier
  private rtype: RTypeClassifier;

  constructor() {
    // Initialize core operators
    this.P = new PermissionOperator();
    this.O = new ObligationOperator();
    this.F = new ProhibitionOperator();
    this.C = new ClaimOperator();
    this.L = new LibertyOperator();
    this.W = new PowerOperator();
    this.B = new ImmunityOperator();
    this.I = new DisabilityOperator();
    this.D = new LiabilityOperator();

    // Initialize piece logic operators
    this.PM = new PM_Operator();
    this.PC = new PC_Operator();
    this.PA = new PA_Operator();
    this.CR = new CR_Operator();
    this.EP = new EP_Operator();
    this.PO = new PO_Operator();
    this.NV = new NV_Operator();
    this.PD = new PD_Operator();

    // Initialize board logic operators
    this.CS = new CS_Operator();
    this.LMG = new LMG_Operator();
    this.GT = new GT_Operator();
    this.PR = new PR_Operator();
    this.FMC = new FMC_Operator();

    // Initialize notation
    this.GN = new GN_Operator();

    // Initialize R-type classifier
    this.rtype = new RTypeClassifier();
  }

  // ==========================================================================
  // MAIN VALIDATION METHOD
  // ==========================================================================

  /**
   * Validate a chess move using the complete KROG framework
   * Returns comprehensive validation with operators, formula, R-type, and explanations
   */
  validateMove(move: Move, state: GameState): KROGValidation {
    const operators: string[] = [];
    let formula = '';
    let rtype: RType | null = null;

    // 1. Check if it's the player's turn - P(move) requires turn
    if (move.piece.color !== state.currentPlayer) {
      return this.createInvalidResult(
        ['F'],
        'F(move_opponent_piece)',
        null,
        {
          en: 'Cannot move opponent\'s pieces',
          no: 'Kan ikke flytte motstanderens brikker'
        },
        {
          norwegian: { section: '§1.2', text: 'Hvit flytter først, deretter trekker spillerne annenhver gang' },
          english: { section: '1.2', text: 'White moves first, then players alternate' }
        }
      );
    }

    // 2. Handle castling specially
    if (move.castling) {
      return this.validateCastling(move, state);
    }

    // 3. Handle en passant specially
    if (move.enPassant) {
      return this.validateEnPassant(move, state);
    }

    // 4. Check piece movement permission
    const pmResult = this.PM.evaluate(move.piece, move.from, move.to, state);
    operators.push('PM');

    if (!pmResult.permitted) {
      operators.push('PC');
      return this.createInvalidResult(
        operators,
        pmResult.formula,
        this.rtype.classifyMove(move, state),
        pmResult.explanation,
        pmResult.fideRule
      );
    }

    // 5. Check if move leaves king in check - F(move_into_check)
    const wouldBeInCheck = this.CS.wouldBeInCheck(move, state);
    operators.push('CS');

    if (wouldBeInCheck) {
      operators.push('F');
      return this.createInvalidResult(
        operators,
        'F(move) when CS(self) after move',
        'R10_conditional',
        {
          en: 'This move leaves your king in check',
          no: 'Dette trekket setter din konge i sjakk'
        },
        {
          norwegian: { section: '§3.9', text: 'En spiller kan ikke gjøre et trekk som setter eller etterlater kongen i sjakk' },
          english: { section: '3.9', text: 'A player may not make a move which places or leaves his king in check' }
        }
      );
    }

    // 6. Check promotion obligation
    if (move.piece.type === 'pawn') {
      const poResult = this.PO.evaluate(move.piece, move.to);
      if (poResult.required) {
        operators.push('PO', 'O');
        if (!move.promotion) {
          return this.createInvalidResult(
            operators,
            poResult.formula,
            'R8_mandatory_transformation',
            {
              en: 'Pawn must be promoted - select a piece',
              no: 'Bonden må forfremmes - velg en brikke'
            },
            poResult.fideRule
          );
        }
        rtype = 'R8_mandatory_transformation';
      }
    }

    // 7. Classify R-type if not set
    if (!rtype) {
      rtype = this.rtype.classifyMove(move, state);
    }

    // 8. Generate formula
    operators.push('P');
    formula = this.generateFormula(move, operators);

    // 9. Generate notation
    const notation = this.GN.generate(move, state);

    // 10. Create successful validation
    return {
      valid: true,
      operators: operators as any[],
      formula,
      rtype,
      explanation: this.generateMoveExplanation(move, state),
      fideRule: this.getFIDERuleForMove(move),
      json: this.toJSON({
        valid: true,
        operators: operators as any[],
        formula,
        rtype,
        explanation: this.generateMoveExplanation(move, state),
        fideRule: this.getFIDERuleForMove(move)
      }, move)
    };
  }

  // ==========================================================================
  // SPECIAL MOVE VALIDATION
  // ==========================================================================

  /**
   * Validate castling move
   */
  private validateCastling(move: Move, state: GameState): KROGValidation {
    const operators: string[] = ['CR', 'PC', 'CS', 'PA', 'W'];
    const side = move.castling!;
    const crResult = this.CR.evaluate(side, move.piece.color, state);

    if (!crResult.allowed) {
      operators.push('I');
      return this.createInvalidResult(
        operators,
        crResult.formula,
        'R9_compound_move',
        crResult.explanation,
        crResult.fideRule
      );
    }

    return {
      valid: true,
      operators: operators as any[],
      formula: crResult.formula,
      rtype: 'R9_compound_move',
      temporal: '◊(CR) U moved(king)',
      explanation: crResult.explanation,
      fideRule: crResult.fideRule,
      json: this.toJSON({
        valid: true,
        operators: operators as any[],
        formula: crResult.formula,
        rtype: 'R9_compound_move',
        explanation: crResult.explanation,
        fideRule: crResult.fideRule
      }, move)
    };
  }

  /**
   * Validate en passant move
   */
  private validateEnPassant(move: Move, state: GameState): KROGValidation {
    const operators: string[] = ['EP', 'PM'];
    const epResult = this.EP.evaluate(move.to, move.piece, state);

    if (!epResult.valid) {
      operators.push('I');
      return this.createInvalidResult(
        operators,
        epResult.formula,
        'R7_temporal_window',
        epResult.explanation,
        epResult.fideRule
      );
    }

    // Check if move leaves king in check
    const wouldBeInCheck = this.CS.wouldBeInCheck(move, state);
    operators.push('CS');

    if (wouldBeInCheck) {
      operators.push('F');
      return this.createInvalidResult(
        operators,
        'F(EP) when CS(self) after EP',
        'R7_temporal_window',
        {
          en: 'En passant leaves your king in check',
          no: 'En passant setter din konge i sjakk'
        },
        epResult.fideRule
      );
    }

    return {
      valid: true,
      operators: operators as any[],
      formula: epResult.formula,
      rtype: 'R7_temporal_window',
      temporal: 'X(opponent_double_pawn_move)',
      explanation: epResult.explanation,
      fideRule: epResult.fideRule,
      json: this.toJSON({
        valid: true,
        operators: operators as any[],
        formula: epResult.formula,
        rtype: 'R7_temporal_window',
        explanation: epResult.explanation,
        fideRule: epResult.fideRule
      }, move)
    };
  }

  // ==========================================================================
  // GAME STATE EVALUATION
  // ==========================================================================

  /**
   * Evaluate current game state for termination
   */
  evaluateGameState(state: GameState): {
    terminated: boolean;
    result?: string;
    winner?: Color | 'draw';
    krog: KROGValidation;
  } {
    const gtResult = this.GT.evaluate(state);

    return {
      terminated: gtResult.terminated,
      result: gtResult.result,
      winner: gtResult.winner,
      krog: {
        valid: !gtResult.terminated,
        operators: ['GT', 'CS', 'LMG'],
        formula: gtResult.formula,
        rtype: gtResult.terminated ? 'R13_terminal_state' : null,
        explanation: gtResult.explanation,
        fideRule: gtResult.fideRule,
        json: {
          id: 'game_termination',
          valid: !gtResult.terminated,
          operators: ['GT', 'CS', 'LMG'],
          formula: gtResult.formula,
          rtype: gtResult.terminated ? 'R13_terminal_state' : null,
          explanation: gtResult.explanation,
          fide: {
            norwegian: gtResult.fideRule.norwegian.section,
            english: gtResult.fideRule.english.section
          },
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Get legal moves for current player
   */
  getLegalMoves(state: GameState): Move[] {
    const lmgResult = this.LMG.evaluate(state.currentPlayer, state);
    return lmgResult.moves;
  }

  /**
   * Check if player is in check
   */
  isInCheck(color: Color, state: GameState): {
    inCheck: boolean;
    attackers: Piece[];
    krog: KROGValidation;
  } {
    const csResult = this.CS.evaluate(color, state);

    return {
      inCheck: csResult.inCheck,
      attackers: csResult.attackers,
      krog: {
        valid: !csResult.inCheck,
        operators: ['CS', 'PA'],
        formula: csResult.formula,
        rtype: csResult.inCheck ? 'R10_conditional' : null,
        explanation: csResult.explanation,
        fideRule: csResult.fideRule,
        json: {
          id: 'check_state',
          valid: !csResult.inCheck,
          operators: ['CS', 'PA'],
          formula: csResult.formula,
          rtype: csResult.inCheck ? 'R10_conditional' : null,
          explanation: csResult.explanation,
          fide: {
            norwegian: csResult.fideRule.norwegian.section,
            english: csResult.fideRule.english.section
          },
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  // ==========================================================================
  // DRAW CLAIMS
  // ==========================================================================

  /**
   * Check if threefold repetition claim is valid
   */
  canClaimThreefoldRepetition(state: GameState): {
    canClaim: boolean;
    count: number;
    krog: KROGValidation;
  } {
    const prResult = this.PR.evaluate(state);
    const canClaim = prResult.count >= 3;

    return {
      canClaim,
      count: prResult.count,
      krog: {
        valid: canClaim,
        operators: ['C', 'PR'],
        formula: 'C(player, draw) when PR(position, 3)',
        rtype: 'R14_repetition',
        temporal: 'F(position_occurs_3x) → draw_available',
        explanation: canClaim
          ? { en: `Position repeated ${prResult.count} times - draw claimable`, no: `Stilling gjentatt ${prResult.count} ganger - remis kan kreves` }
          : { en: `Position repeated ${prResult.count} times - need 3`, no: `Stilling gjentatt ${prResult.count} ganger - trenger 3` },
        fideRule: {
          norwegian: { section: '§9.2', text: 'Spillet er remis hvis samme stilling oppstår tre ganger' },
          english: { section: '9.2', text: 'The game is drawn if the same position has occurred three times' }
        },
        json: {
          id: 'threefold_repetition',
          valid: canClaim,
          operators: ['C', 'PR'],
          formula: 'C(player, draw) when PR(position, 3)',
          rtype: 'R14_repetition',
          temporal: 'F(position_occurs_3x)',
          explanation: canClaim
            ? { en: `Position repeated ${prResult.count} times`, no: `Stilling gjentatt ${prResult.count} ganger` }
            : { en: 'Repetition count insufficient', no: 'Gjentakelsesantall utilstrekkelig' },
          fide: { norwegian: '§9.2', english: '9.2' },
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  /**
   * Check if fifty-move rule claim is valid
   */
  canClaimFiftyMoveRule(state: GameState): {
    canClaim: boolean;
    count: number;
    krog: KROGValidation;
  } {
    const fmcResult = this.FMC.evaluate(state);
    const canClaim = fmcResult.count >= 100; // 100 half-moves = 50 full moves

    return {
      canClaim,
      count: Math.floor(fmcResult.count / 2),
      krog: {
        valid: canClaim,
        operators: ['C', 'FMC'],
        formula: 'C(player, draw) when FMC() ≥ 50',
        rtype: 'R15_counter_based',
        explanation: canClaim
          ? { en: `${Math.floor(fmcResult.count / 2)} moves without pawn/capture - draw claimable`, no: `${Math.floor(fmcResult.count / 2)} trekk uten bonde/slag - remis kan kreves` }
          : { en: `${Math.floor(fmcResult.count / 2)} moves - need 50`, no: `${Math.floor(fmcResult.count / 2)} trekk - trenger 50` },
        fideRule: {
          norwegian: { section: '§9.3', text: 'Spillet er remis hvis ingen bonde er flyttet og ingen brikke er tatt i 50 trekk' },
          english: { section: '9.3', text: 'The game is drawn if no pawn has moved and no capture has been made in 50 moves' }
        },
        json: {
          id: 'fifty_move',
          valid: canClaim,
          operators: ['C', 'FMC'],
          formula: 'C(player, draw) when FMC() ≥ 50',
          rtype: 'R15_counter_based',
          explanation: { en: `Move count: ${Math.floor(fmcResult.count / 2)}`, no: `Trekkantall: ${Math.floor(fmcResult.count / 2)}` },
          fide: { norwegian: '§9.3', english: '9.3' },
          timestamp: new Date().toISOString()
        }
      }
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Create invalid result
   */
  private createInvalidResult(
    operators: string[],
    formula: string,
    rtype: RType | null,
    explanation: { en: string; no: string },
    fideRule: FIDERule
  ): KROGValidation {
    return {
      valid: false,
      operators: operators as any[],
      formula,
      rtype,
      explanation,
      fideRule,
      json: {
        id: 'invalid_move',
        valid: false,
        operators,
        formula,
        rtype,
        explanation,
        fide: {
          norwegian: fideRule.norwegian.section,
          english: fideRule.english.section
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Generate KROG formula for move
   */
  private generateFormula(move: Move, operators: string[]): string {
    const pieceSymbol = move.piece.type.charAt(0).toUpperCase();
    const from = squareToString(move.from);
    const to = squareToString(move.to);

    if (move.castling) {
      return `P(${move.castling === 'kingside' ? 'O-O' : 'O-O-O'}) ≡ CR(${move.castling}) ∧ ¬CS`;
    }

    if (move.promotion) {
      return `P(${from}${to}=${move.promotion[0].toUpperCase()}) ≡ PM(pawn) ∧ PO(${move.promotion})`;
    }

    if (move.capture) {
      return `P(${pieceSymbol}x${to}) ≡ PM(${move.piece.type}) ∧ PA(${to})`;
    }

    return `P(${pieceSymbol}${to}) ≡ PM(${move.piece.type},${from},${to}) ∧ ¬CS(self)`;
  }

  /**
   * Generate move explanation
   */
  private generateMoveExplanation(move: Move, state: GameState): { en: string; no: string } {
    const pieceNames: Record<PieceType, { en: string; no: string }> = {
      king: { en: 'King', no: 'Kongen' },
      queen: { en: 'Queen', no: 'Dronningen' },
      rook: { en: 'Rook', no: 'Tårnet' },
      bishop: { en: 'Bishop', no: 'Løperen' },
      knight: { en: 'Knight', no: 'Springeren' },
      pawn: { en: 'Pawn', no: 'Bonden' }
    };

    const piece = pieceNames[move.piece.type];
    const to = squareToString(move.to);

    if (move.castling) {
      return {
        en: `${move.castling === 'kingside' ? 'Kingside' : 'Queenside'} castling - king and rook move together`,
        no: `${move.castling === 'kingside' ? 'Kort' : 'Lang'} rokade - kongen og tårnet flytter sammen`
      };
    }

    if (move.promotion) {
      const promoNames: Record<PieceType, { en: string; no: string }> = {
        queen: { en: 'queen', no: 'dronning' },
        rook: { en: 'rook', no: 'tårn' },
        bishop: { en: 'bishop', no: 'løper' },
        knight: { en: 'knight', no: 'springer' },
        king: { en: '', no: '' },
        pawn: { en: '', no: '' }
      };
      const promo = promoNames[move.promotion];
      return {
        en: `Pawn promotes to ${promo.en} on ${to}`,
        no: `Bonden forfremmes til ${promo.no} på ${to}`
      };
    }

    if (move.enPassant) {
      return {
        en: `Pawn captures en passant on ${to}`,
        no: `Bonden slår en passant på ${to}`
      };
    }

    if (move.capture) {
      const captured = pieceNames[move.capture.type];
      return {
        en: `${piece.en} captures ${captured.en.toLowerCase()} on ${to}`,
        no: `${piece.no} slår ${captured.no.toLowerCase()} på ${to}`
      };
    }

    return {
      en: `${piece.en} moves to ${to}`,
      no: `${piece.no} flytter til ${to}`
    };
  }

  /**
   * Get FIDE rule for move
   */
  private getFIDERuleForMove(move: Move): FIDERule {
    const rules: Record<PieceType, FIDERule> = {
      king: {
        norwegian: { section: '§3.9', text: 'Kongen kan flyttes til en tilstøtende rute' },
        english: { section: '3.9', text: 'The king may move to any adjoining square' }
      },
      queen: {
        norwegian: { section: '§3.4', text: 'Dronningen kan flyttes langs linje, rad eller diagonal' },
        english: { section: '3.4', text: 'The queen may move along file, rank, or diagonal' }
      },
      rook: {
        norwegian: { section: '§3.5', text: 'Tårnet kan flyttes langs linje eller rad' },
        english: { section: '3.5', text: 'The rook may move along file or rank' }
      },
      bishop: {
        norwegian: { section: '§3.4', text: 'Løperen kan flyttes langs en diagonal' },
        english: { section: '3.4', text: 'The bishop may move along a diagonal' }
      },
      knight: {
        norwegian: { section: '§3.6', text: 'Springeren flytter i L-form' },
        english: { section: '3.6', text: 'The knight moves in an L-shape' }
      },
      pawn: {
        norwegian: { section: '§3.7', text: 'Bonden kan flyttes fremover' },
        english: { section: '3.7', text: 'The pawn may move forward' }
      }
    };

    if (move.castling) {
      return {
        norwegian: { section: '§3.8.2', text: 'Rokade er et trekk av kongen og tårnet' },
        english: { section: '3.8.b', text: 'Castling is a move of the king and rook' }
      };
    }

    return rules[move.piece.type];
  }

  /**
   * Convert validation to JSON
   */
  private toJSON(validation: Partial<KROGValidation>, move: Move): KROGRuleJSON {
    return {
      id: `move_${squareToString(move.from)}_${squareToString(move.to)}`,
      valid: validation.valid ?? false,
      operators: validation.operators?.map(o => String(o)) ?? [],
      formula: validation.formula ?? '',
      rtype: validation.rtype ?? null,
      temporal: (validation as any).temporal,
      explanation: validation.explanation ?? { en: '', no: '' },
      fide: {
        norwegian: validation.fideRule?.norwegian.section ?? '',
        english: validation.fideRule?.english.section ?? ''
      },
      timestamp: new Date().toISOString()
    };
  }

  // ==========================================================================
  // OPERATOR ACCESS
  // ==========================================================================

  /**
   * Get direct access to operators for advanced usage
   */
  getOperators() {
    return {
      core: {
        P: this.P,
        O: this.O,
        F: this.F,
        C: this.C,
        L: this.L,
        W: this.W,
        B: this.B,
        I: this.I,
        D: this.D
      },
      pieceLogic: {
        PM: this.PM,
        PC: this.PC,
        PA: this.PA,
        CR: this.CR,
        EP: this.EP,
        PO: this.PO,
        NV: this.NV,
        PD: this.PD
      },
      boardLogic: {
        CS: this.CS,
        LMG: this.LMG,
        GT: this.GT,
        PR: this.PR,
        FMC: this.FMC
      },
      notation: {
        GN: this.GN
      },
      rtype: this.rtype
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default KROGChessEngine;
