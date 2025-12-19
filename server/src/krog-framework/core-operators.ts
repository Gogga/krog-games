/**
 * KROG Chess Framework - Core Operators
 *
 * The 9 fundamental deontic logic operators:
 * P (Permission), O (Obligation), F (Prohibition),
 * C (Claim), L (Liberty), W (Power),
 * B (Immunity), I (Disability), D (Liability)
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

import {
  Action,
  GameState,
  Move,
  Color,
  opponent,
  FIDERule
} from './types';

// ============================================================================
// OPERATOR RESULT TYPES
// ============================================================================

export interface CoreOperatorResult {
  result: boolean;
  operator: string;
  formula: string;
  explanation: { en: string; no: string };
}

// ============================================================================
// P() - PERMISSION OPERATOR
// ============================================================================

/**
 * P(φ) ≡ ¬O¬(φ)
 * "Action φ is permitted" ≡ "It's not obligatory that φ doesn't happen"
 *
 * In chess, permission is the default state for legal moves.
 * A move is permitted if:
 * 1. It follows piece movement rules
 * 2. It doesn't leave the player's king in check
 * 3. It's the player's turn
 */
export class PermissionOperator {
  private obligationOp: ObligationOperator;

  constructor() {
    this.obligationOp = new ObligationOperator();
  }

  /**
   * Evaluate if action is permitted
   * P(φ) ≡ ¬O¬(φ)
   */
  evaluate(action: Action, state: GameState): CoreOperatorResult {
    // Permission is the dual of obligation
    // P(φ) means it's not obligatory to NOT do φ
    const notAction = this.negateAction(action);
    const obligationResult = this.obligationOp.evaluate(notAction, state);

    return {
      result: !obligationResult.result,
      operator: 'P',
      formula: 'P(φ) ≡ ¬O¬(φ)',
      explanation: {
        en: `Action is ${!obligationResult.result ? 'permitted' : 'not permitted'}`,
        no: `Handling er ${!obligationResult.result ? 'tillatt' : 'ikke tillatt'}`
      }
    };
  }

  /**
   * Check if a specific move is permitted
   */
  evaluateMove(move: Move, state: GameState): CoreOperatorResult {
    // A move is permitted if it doesn't violate any prohibitions
    const isLegal = this.checkMoveLegality(move, state);

    return {
      result: isLegal,
      operator: 'P',
      formula: `P(${move.san || 'move'}) ≡ legal_pattern ∧ ¬CS(self) after move`,
      explanation: {
        en: isLegal
          ? 'This move is permitted - it follows chess rules'
          : 'This move is not permitted - it violates chess rules',
        no: isLegal
          ? 'Dette trekket er tillatt - det følger sjakkreglene'
          : 'Dette trekket er ikke tillatt - det bryter sjakkreglene'
      }
    };
  }

  private negateAction(action: Action): Action {
    return { ...action, type: `not_${action.type}` as Action['type'] };
  }

  private checkMoveLegality(move: Move, state: GameState): boolean {
    // This will be implemented by the full engine
    // For now, return true as placeholder
    return true;
  }
}

// ============================================================================
// O() - OBLIGATION OPERATOR
// ============================================================================

/**
 * O(φ) ≡ ¬P¬(φ)
 * "Action φ is obligatory" ≡ "It's not permitted that φ doesn't happen"
 *
 * Chess obligations:
 * 1. Must respond to check (escape, block, or capture attacker)
 * 2. Must promote pawn when reaching 8th rank
 * 3. Must make a move on your turn
 */
export class ObligationOperator {
  /**
   * Evaluate if action is obligatory
   * O(φ) ≡ ¬P¬(φ)
   */
  evaluate(action: Action, state: GameState): CoreOperatorResult {
    let isObligatory = false;
    let formula = 'O(φ)';
    let explanation = { en: '', no: '' };

    switch (action.type) {
      case 'move':
        // Obligatory to make a move on your turn
        isObligatory = true;
        formula = 'O(move) on your_turn';
        explanation = {
          en: 'You must make a move on your turn',
          no: 'Du må gjøre et trekk på din tur'
        };
        break;

      default:
        isObligatory = false;
    }

    return {
      result: isObligatory,
      operator: 'O',
      formula,
      explanation
    };
  }

  /**
   * Check if responding to check is obligatory
   */
  evaluateCheckResponse(state: GameState, inCheck: boolean): CoreOperatorResult {
    return {
      result: inCheck,
      operator: 'O',
      formula: 'O(¬CS(self)) when CS(self)',
      explanation: inCheck
        ? { en: 'You must escape check', no: 'Du må komme ut av sjakk' }
        : { en: 'No obligation - not in check', no: 'Ingen forpliktelse - ikke i sjakk' }
    };
  }

  /**
   * Check if promotion is obligatory
   */
  evaluatePromotion(move: Move): CoreOperatorResult {
    const mustPromote =
      move.piece.type === 'pawn' &&
      ((move.piece.color === 'white' && move.to.rank === 8) ||
       (move.piece.color === 'black' && move.to.rank === 1));

    return {
      result: mustPromote,
      operator: 'O',
      formula: 'O(promote_to ∈ {Q,R,B,N}) when pawn_reaches_8th',
      explanation: mustPromote
        ? { en: 'Pawn must be promoted', no: 'Bonden må forfremmes' }
        : { en: 'No promotion required', no: 'Ingen forfremmelse nødvendig' }
    };
  }
}

// ============================================================================
// F() - PROHIBITION OPERATOR
// ============================================================================

/**
 * F(φ) ≡ O¬(φ) ≡ ¬P(φ)
 * "Action φ is forbidden"
 *
 * Chess prohibitions:
 * 1. Cannot move into check
 * 2. Cannot move opponent's pieces
 * 3. Cannot make illegal piece movements
 * 4. Cannot move when not your turn
 */
export class ProhibitionOperator {
  /**
   * Evaluate if action is forbidden
   * F(φ) ≡ ¬P(φ)
   */
  evaluate(action: Action, state: GameState): CoreOperatorResult {
    let isForbidden = false;
    let formula = 'F(φ)';
    let explanation = { en: '', no: '' };

    // Check various prohibition conditions
    if (action.move) {
      const move = action.move;

      // Forbidden to move opponent's pieces
      if (move.piece.color !== state.currentPlayer) {
        isForbidden = true;
        formula = 'F(move_opponent_piece)';
        explanation = {
          en: 'Cannot move opponent\'s pieces',
          no: 'Kan ikke flytte motstanderens brikker'
        };
      }
    }

    return {
      result: isForbidden,
      operator: 'F',
      formula,
      explanation
    };
  }

  /**
   * Check if moving into check is forbidden
   */
  evaluateMoveIntoCheck(move: Move, wouldBeInCheck: boolean): CoreOperatorResult {
    return {
      result: wouldBeInCheck,
      operator: 'F',
      formula: 'F(move) when CS(self) after move',
      explanation: wouldBeInCheck
        ? { en: 'This move is forbidden - leaves king in check', no: 'Dette trekket er forbudt - setter kongen i sjakk' }
        : { en: 'Move does not leave king in check', no: 'Trekket setter ikke kongen i sjakk' }
    };
  }

  /**
   * Check if illegal piece pattern is forbidden
   */
  evaluateIllegalPattern(move: Move, patternValid: boolean): CoreOperatorResult {
    return {
      result: !patternValid,
      operator: 'F',
      formula: `F(${move.piece.type}_illegal_pattern)`,
      explanation: !patternValid
        ? { en: `This piece cannot move that way`, no: `Denne brikken kan ikke flytte slik` }
        : { en: 'Movement pattern is valid', no: 'Bevegelsesmønster er gyldig' }
    };
  }
}

// ============================================================================
// C() - CLAIM OPERATOR
// ============================================================================

/**
 * C(player, right)
 * "Player can claim a right"
 *
 * Chess claims:
 * 1. Claim draw by threefold repetition
 * 2. Claim draw by fifty-move rule
 * 3. Claim time forfeit
 */
export class ClaimOperator {
  /**
   * Evaluate if player can make a claim
   */
  evaluate(
    player: Color,
    claimType: 'draw_repetition' | 'draw_fifty_move' | 'time_forfeit',
    state: GameState,
    repetitionCount?: number,
    fiftyMoveCount?: number,
    opponentTime?: number
  ): CoreOperatorResult {
    let canClaim = false;
    let formula = 'C(player, right)';
    let explanation = { en: '', no: '' };

    switch (claimType) {
      case 'draw_repetition':
        canClaim = (repetitionCount ?? 0) >= 3;
        formula = 'C(player, draw) when PR(position, 3)';
        explanation = canClaim
          ? { en: 'You can claim draw by threefold repetition', no: 'Du kan kreve remis ved trefoldig gjentakelse' }
          : { en: 'Cannot claim - position has not repeated 3 times', no: 'Kan ikke kreve - stillingen har ikke gjentatt seg 3 ganger' };
        break;

      case 'draw_fifty_move':
        canClaim = (fiftyMoveCount ?? 0) >= 100; // 100 half-moves = 50 full moves
        formula = 'C(player, draw) when FMC() ≥ 50';
        explanation = canClaim
          ? { en: 'You can claim draw by fifty-move rule', no: 'Du kan kreve remis ved femtitrekksregelen' }
          : { en: 'Cannot claim - fifty-move rule not met', no: 'Kan ikke kreve - femtitrekksregelen er ikke oppfylt' };
        break;

      case 'time_forfeit':
        canClaim = (opponentTime ?? 1) <= 0;
        formula = 'C(player, win) when TC(opponent) = 0';
        explanation = canClaim
          ? { en: 'You can claim win by time forfeit', no: 'Du kan kreve seier ved tidsforfall' }
          : { en: 'Cannot claim - opponent has time remaining', no: 'Kan ikke kreve - motstanderen har tid igjen' };
        break;
    }

    return {
      result: canClaim,
      operator: 'C',
      formula,
      explanation
    };
  }
}

// ============================================================================
// L() - LIBERTY OPERATOR
// ============================================================================

/**
 * L(player, action)
 * "Player has liberty to perform action"
 *
 * Chess liberties (always available):
 * 1. Liberty to resign
 * 2. Liberty to offer draw (on own turn)
 * 3. Liberty to accept/decline draw offer
 */
export class LibertyOperator {
  /**
   * Evaluate if player has liberty to perform action
   */
  evaluate(
    player: Color,
    action: 'resign' | 'offer_draw' | 'accept_draw' | 'decline_draw',
    state: GameState,
    hasDrawOffer?: boolean
  ): CoreOperatorResult {
    let hasLiberty = false;
    let formula = 'L(player, action)';
    let explanation = { en: '', no: '' };

    switch (action) {
      case 'resign':
        hasLiberty = true; // Always allowed
        formula = 'L(player, resign) - always';
        explanation = { en: 'You can always resign', no: 'Du kan alltid gi opp' };
        break;

      case 'offer_draw':
        hasLiberty = state.currentPlayer === player;
        formula = 'L(player, offer_draw) on own_turn';
        explanation = hasLiberty
          ? { en: 'You can offer a draw', no: 'Du kan tilby remis' }
          : { en: 'Can only offer draw on your turn', no: 'Kan bare tilby remis på din tur' };
        break;

      case 'accept_draw':
      case 'decline_draw':
        hasLiberty = hasDrawOffer ?? false;
        formula = `L(player, ${action}) when draw_offered`;
        explanation = hasLiberty
          ? { en: `You can ${action.replace('_', ' ')}`, no: `Du kan ${action === 'accept_draw' ? 'godta remis' : 'avslå remis'}` }
          : { en: 'No draw offer to respond to', no: 'Ingen remistilbud å svare på' };
        break;
    }

    return {
      result: hasLiberty,
      operator: 'L',
      formula,
      explanation
    };
  }
}

// ============================================================================
// W() - POWER OPERATOR
// ============================================================================

/**
 * W(action) ≡ conditions_met
 * "Power to perform action exists"
 *
 * Chess powers (conditional abilities):
 * 1. Power to castle (if conditions met)
 * 2. Power to capture en passant (temporal condition)
 * 3. Power to promote (positional condition)
 */
export class PowerOperator {
  /**
   * Evaluate if power exists to perform action
   */
  evaluate(
    action: 'castle_kingside' | 'castle_queenside' | 'en_passant' | 'promote',
    color: Color,
    state: GameState,
    conditions?: {
      kingMoved?: boolean;
      rookMoved?: boolean;
      inCheck?: boolean;
      pathClear?: boolean;
      pathSafe?: boolean;
      enPassantAvailable?: boolean;
      onPromotionRank?: boolean;
    }
  ): CoreOperatorResult {
    let hasPower = false;
    let formula = 'W(action)';
    let explanation = { en: '', no: '' };

    switch (action) {
      case 'castle_kingside':
      case 'castle_queenside':
        hasPower =
          !conditions?.kingMoved &&
          !conditions?.rookMoved &&
          !conditions?.inCheck &&
          (conditions?.pathClear ?? false) &&
          (conditions?.pathSafe ?? false);
        formula = 'W(castle) ≡ ¬moved(king) ∧ ¬moved(rook) ∧ ¬CS ∧ PC ∧ safe';
        explanation = hasPower
          ? { en: `You have the power to castle ${action.replace('castle_', '')}`, no: `Du har mulighet til å rokere ${action === 'castle_kingside' ? 'kort' : 'langt'}` }
          : { en: 'Castling conditions not met', no: 'Rokadebetingelser ikke oppfylt' };
        break;

      case 'en_passant':
        hasPower = conditions?.enPassantAvailable ?? false;
        formula = 'W(en_passant) ≡ opponent_just_double_pushed ∧ adjacent';
        explanation = hasPower
          ? { en: 'En passant capture is available', no: 'En passant-slag er tilgjengelig' }
          : { en: 'En passant not available', no: 'En passant ikke tilgjengelig' };
        break;

      case 'promote':
        hasPower = conditions?.onPromotionRank ?? false;
        formula = 'W(promote) ≡ pawn_on_8th_rank';
        explanation = hasPower
          ? { en: 'Pawn can be promoted', no: 'Bonden kan forfremmes' }
          : { en: 'Pawn not on promotion rank', no: 'Bonden er ikke på forfremmelsesraden' };
        break;
    }

    return {
      result: hasPower,
      operator: 'W',
      formula,
      explanation
    };
  }
}

// ============================================================================
// B() - IMMUNITY OPERATOR
// ============================================================================

/**
 * B(entity, action)
 * "Entity is immune from action"
 *
 * Chess immunities:
 * 1. King is immune from capture (checkmate required)
 * 2. Player is immune from losing in stalemate
 */
export class ImmunityOperator {
  /**
   * Evaluate if entity has immunity
   */
  evaluate(
    entity: 'king' | 'player',
    immuneFrom: 'direct_capture' | 'losing_stalemate',
    state: GameState
  ): CoreOperatorResult {
    let hasImmunity = false;
    let formula = 'B(entity, action)';
    let explanation = { en: '', no: '' };

    switch (immuneFrom) {
      case 'direct_capture':
        // King is always immune from direct capture
        hasImmunity = entity === 'king';
        formula = 'B(king, capture) - requires checkmate';
        explanation = {
          en: 'King cannot be captured - must be checkmated',
          no: 'Kongen kan ikke slås - må bli sjakkmatt'
        };
        break;

      case 'losing_stalemate':
        hasImmunity = true;
        formula = 'B(player, lose) when stalemate';
        explanation = {
          en: 'Stalemate results in draw, not loss',
          no: 'Patt resulterer i remis, ikke tap'
        };
        break;
    }

    return {
      result: hasImmunity,
      operator: 'B',
      formula,
      explanation
    };
  }
}

// ============================================================================
// I() - DISABILITY OPERATOR
// ============================================================================

/**
 * I(action) after condition
 * "Action becomes disabled after condition"
 *
 * Chess disabilities:
 * 1. Castling disabled after king moves
 * 2. Castling disabled after rook moves (that side)
 * 3. En passant disabled after next move
 */
export class DisabilityOperator {
  /**
   * Evaluate if action is disabled
   */
  evaluate(
    action: 'castle_kingside' | 'castle_queenside' | 'en_passant',
    color: Color,
    state: GameState,
    conditions?: {
      kingHasMoved?: boolean;
      kingsideRookHasMoved?: boolean;
      queensideRookHasMoved?: boolean;
      enPassantExpired?: boolean;
    }
  ): CoreOperatorResult {
    let isDisabled = false;
    let formula = 'I(action) after condition';
    let explanation = { en: '', no: '' };

    switch (action) {
      case 'castle_kingside':
        isDisabled = (conditions?.kingHasMoved ?? false) || (conditions?.kingsideRookHasMoved ?? false);
        formula = 'I(O-O) after moved(king) ∨ moved(h-rook)';
        explanation = isDisabled
          ? { en: 'Kingside castling is no longer available', no: 'Kort rokade er ikke lenger tilgjengelig' }
          : { en: 'Kingside castling rights intact', no: 'Rettighet til kort rokade intakt' };
        break;

      case 'castle_queenside':
        isDisabled = (conditions?.kingHasMoved ?? false) || (conditions?.queensideRookHasMoved ?? false);
        formula = 'I(O-O-O) after moved(king) ∨ moved(a-rook)';
        explanation = isDisabled
          ? { en: 'Queenside castling is no longer available', no: 'Lang rokade er ikke lenger tilgjengelig' }
          : { en: 'Queenside castling rights intact', no: 'Rettighet til lang rokade intakt' };
        break;

      case 'en_passant':
        isDisabled = conditions?.enPassantExpired ?? false;
        formula = 'I(en_passant) after next_move';
        explanation = isDisabled
          ? { en: 'En passant opportunity has expired', no: 'En passant-muligheten er utløpt' }
          : { en: 'En passant is still available', no: 'En passant er fortsatt tilgjengelig' };
        break;
    }

    return {
      result: isDisabled,
      operator: 'I',
      formula,
      explanation
    };
  }
}

// ============================================================================
// D() - LIABILITY OPERATOR
// ============================================================================

/**
 * D(player, consequence) when condition
 * "Player liable for consequence when condition met"
 *
 * Chess liabilities:
 * 1. Loss on time forfeit
 * 2. Loss on checkmate
 * 3. Warning/forfeit on illegal move (tournament play)
 */
export class LiabilityOperator {
  /**
   * Evaluate if player is liable for consequence
   */
  evaluate(
    player: Color,
    consequence: 'lose_time' | 'lose_checkmate' | 'warning_illegal' | 'forfeit_illegal',
    state: GameState,
    conditions?: {
      timeRemaining?: number;
      isCheckmated?: boolean;
      illegalMoveCount?: number;
    }
  ): CoreOperatorResult {
    let isLiable = false;
    let formula = 'D(player, consequence) when condition';
    let explanation = { en: '', no: '' };

    switch (consequence) {
      case 'lose_time':
        isLiable = (conditions?.timeRemaining ?? 1) <= 0;
        formula = 'D(player, lose) when TC = 0';
        explanation = isLiable
          ? { en: 'Player loses on time', no: 'Spiller taper på tid' }
          : { en: 'Player still has time', no: 'Spiller har fortsatt tid' };
        break;

      case 'lose_checkmate':
        isLiable = conditions?.isCheckmated ?? false;
        formula = 'D(player, lose) when GT(checkmate)';
        explanation = isLiable
          ? { en: 'Player loses by checkmate', no: 'Spiller taper ved sjakkmatt' }
          : { en: 'Player is not checkmated', no: 'Spiller er ikke sjakkmatt' };
        break;

      case 'warning_illegal':
        isLiable = (conditions?.illegalMoveCount ?? 0) >= 1;
        formula = 'D(player, warning) when illegal_move';
        explanation = isLiable
          ? { en: 'Player receives warning for illegal move', no: 'Spiller mottar advarsel for ulovlig trekk' }
          : { en: 'No illegal moves made', no: 'Ingen ulovlige trekk gjort' };
        break;

      case 'forfeit_illegal':
        isLiable = (conditions?.illegalMoveCount ?? 0) >= 2;
        formula = 'D(player, forfeit) when illegal_moves ≥ 2';
        explanation = isLiable
          ? { en: 'Player forfeits due to repeated illegal moves', no: 'Spiller taper på grunn av gjentatte ulovlige trekk' }
          : { en: 'Player has not exceeded illegal move limit', no: 'Spiller har ikke overskredet grensen for ulovlige trekk' };
        break;
    }

    return {
      result: isLiable,
      operator: 'D',
      formula,
      explanation
    };
  }
}

// ============================================================================
// EXPORT ALL CORE OPERATORS
// ============================================================================

export const CoreOperators = {
  P: PermissionOperator,
  O: ObligationOperator,
  F: ProhibitionOperator,
  C: ClaimOperator,
  L: LibertyOperator,
  W: PowerOperator,
  B: ImmunityOperator,
  I: DisabilityOperator,
  D: LiabilityOperator
};

export type CoreOperatorsType = typeof CoreOperators;
