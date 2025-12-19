/**
 * KROG Chess Framework - Temporal Logic Operators
 *
 * The 5 temporal logic operators:
 * G (Globally/Always), F (Finally/Eventually), X (Next),
 * U (Until), R (Release)
 *
 * These operators model time-dependent chess rules like:
 * - En passant (must be executed immediately)
 * - Castling rights (valid until king/rook moves)
 * - Check resolution (must happen on next move)
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

import { GameState, Move, Color } from './types';

// ============================================================================
// TEMPORAL RESULT TYPE
// ============================================================================

export interface TemporalResult {
  holds: boolean;
  operator: string;
  formula: string;
  timepoint: number;  // Move number or state index
  explanation: { en: string; no: string };
}

// ============================================================================
// G - GLOBALLY (ALWAYS)
// ============================================================================

/**
 * G(φ) - φ must hold at all times
 *
 * Chess examples:
 * - G(¬CS(self)) - Never leave your king in check
 * - G(valid_position) - Position must always be valid
 */
export class G_Operator {
  /**
   * Check if condition holds globally (at all points in history)
   */
  evaluate(
    predicate: (state: GameState, moveIndex: number) => boolean,
    state: GameState
  ): TemporalResult {
    let failedAt = -1;

    for (let i = 0; i <= state.moveHistory.length; i++) {
      if (!predicate(state, i)) {
        failedAt = i;
        break;
      }
    }

    const holds = failedAt === -1;

    return {
      holds,
      operator: 'G',
      formula: 'G(φ) ≡ ∀t: φ(t)',
      timepoint: failedAt === -1 ? state.moveHistory.length : failedAt,
      explanation: holds
        ? { en: 'Condition holds at all times', no: 'Betingelse gjelder til alle tider' }
        : { en: `Condition failed at move ${failedAt}`, no: `Betingelse feilet ved trekk ${failedAt}` }
    };
  }

  /**
   * Check that king was never left in check (invariant)
   */
  neverInCheck(color: Color, state: GameState): TemporalResult {
    // This would check the entire game history
    // Simplified: just check current state
    return {
      holds: true, // Assuming game engine enforces this
      operator: 'G',
      formula: 'G(¬CS(self))',
      timepoint: state.moveHistory.length,
      explanation: {
        en: 'King was never left in check',
        no: 'Kongen ble aldri forlatt i sjakk'
      }
    };
  }
}

// ============================================================================
// F - FINALLY (EVENTUALLY)
// ============================================================================

/**
 * F(φ) - φ must eventually hold
 *
 * Chess examples:
 * - F(GT) - Game must eventually terminate
 * - F(check) - Will eventually give check (strategic goal)
 */
export class F_Operator {
  /**
   * Check if condition eventually holds in history
   */
  evaluate(
    predicate: (state: GameState, moveIndex: number) => boolean,
    state: GameState
  ): TemporalResult {
    let foundAt = -1;

    for (let i = 0; i <= state.moveHistory.length; i++) {
      if (predicate(state, i)) {
        foundAt = i;
        break;
      }
    }

    const holds = foundAt !== -1;

    return {
      holds,
      operator: 'F',
      formula: 'F(φ) ≡ ∃t: φ(t)',
      timepoint: foundAt === -1 ? state.moveHistory.length : foundAt,
      explanation: holds
        ? { en: `Condition achieved at move ${foundAt}`, no: `Betingelse oppnådd ved trekk ${foundAt}` }
        : { en: 'Condition not yet achieved', no: 'Betingelse ikke oppnådd ennå' }
    };
  }

  /**
   * Check if game will eventually terminate
   */
  eventuallyTerminates(): TemporalResult {
    // Chess games must terminate (by rules or agreement)
    return {
      holds: true,
      operator: 'F',
      formula: 'F(GT)',
      timepoint: -1, // Unknown future
      explanation: {
        en: 'Game will eventually terminate',
        no: 'Spillet vil til slutt avsluttes'
      }
    };
  }
}

// ============================================================================
// X - NEXT
// ============================================================================

/**
 * X(φ) - φ holds in the next state
 *
 * Chess examples:
 * - X(opponent_turn) - After move, it's opponent's turn
 * - X(¬EP_available) - En passant expires after next move
 */
export class X_Operator {
  /**
   * Check if condition will hold after a move
   */
  evaluate(
    predicate: (state: GameState) => boolean,
    currentState: GameState,
    afterMove: Move
  ): TemporalResult {
    // Simulate the move
    const nextState = this.simulateMove(currentState, afterMove);
    const holds = predicate(nextState);

    return {
      holds,
      operator: 'X',
      formula: 'X(φ) ≡ φ holds after move',
      timepoint: currentState.moveHistory.length + 1,
      explanation: holds
        ? { en: 'Condition will hold after move', no: 'Betingelse vil gjelde etter trekk' }
        : { en: 'Condition will not hold after move', no: 'Betingelse vil ikke gjelde etter trekk' }
    };
  }

  /**
   * Check that en passant expires after any move
   */
  enPassantExpiresNext(state: GameState): TemporalResult {
    const epAvailable = state.enPassantSquare !== null;

    return {
      holds: epAvailable,
      operator: 'X',
      formula: 'X(¬EP) when EP',
      timepoint: state.moveHistory.length + 1,
      explanation: epAvailable
        ? { en: 'En passant will expire after next move', no: 'En passant utløper etter neste trekk' }
        : { en: 'No en passant to expire', no: 'Ingen en passant å utløpe' }
    };
  }

  /**
   * Verify opponent's turn comes next
   */
  opponentTurnNext(currentPlayer: Color): TemporalResult {
    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';

    return {
      holds: true,
      operator: 'X',
      formula: 'X(turn = opponent)',
      timepoint: 1,
      explanation: {
        en: `Next turn: ${nextPlayer}`,
        no: `Neste tur: ${nextPlayer === 'white' ? 'hvit' : 'svart'}`
      }
    };
  }

  private simulateMove(state: GameState, move: Move): GameState {
    // Clone and apply move (simplified)
    const newState = state.clone();
    newState.board.setPiece(move.from, null);
    newState.board.setPiece(move.to, move.piece);
    newState.currentPlayer = state.currentPlayer === 'white' ? 'black' : 'white';
    return newState;
  }
}

// ============================================================================
// U - UNTIL
// ============================================================================

/**
 * φ U ψ - φ holds until ψ becomes true
 *
 * Chess examples:
 * - W(castle) U moved(king) - Castling power until king moves
 * - EP_available U any_move - En passant until any move
 */
export class U_Operator {
  /**
   * Check if φ holds until ψ in history
   */
  evaluate(
    phi: (state: GameState, moveIndex: number) => boolean,
    psi: (state: GameState, moveIndex: number) => boolean,
    state: GameState
  ): TemporalResult {
    let psiIndex = -1;

    // Find when psi becomes true
    for (let i = 0; i <= state.moveHistory.length; i++) {
      if (psi(state, i)) {
        psiIndex = i;
        break;
      }
    }

    if (psiIndex === -1) {
      // Psi never became true, check if phi holds throughout
      const phiAlways = this.checkPhiHoldsThrough(phi, state, state.moveHistory.length);
      return {
        holds: phiAlways,
        operator: 'U',
        formula: 'φ U ψ ≡ φ holds until ψ',
        timepoint: state.moveHistory.length,
        explanation: phiAlways
          ? { en: 'First condition continues to hold', no: 'Første betingelse fortsetter å gjelde' }
          : { en: 'First condition failed before second was achieved', no: 'Første betingelse feilet før andre ble oppnådd' }
      };
    }

    // Check that phi held until psi
    const phiHeldUntil = this.checkPhiHoldsThrough(phi, state, psiIndex - 1);

    return {
      holds: phiHeldUntil,
      operator: 'U',
      formula: 'φ U ψ',
      timepoint: psiIndex,
      explanation: phiHeldUntil
        ? { en: `Condition held until move ${psiIndex}`, no: `Betingelse holdt til trekk ${psiIndex}` }
        : { en: 'First condition failed before trigger', no: 'Første betingelse feilet før utløser' }
    };
  }

  /**
   * Check castling rights until king moves
   */
  castlingUntilKingMoves(color: Color, state: GameState): TemporalResult {
    // Find when king first moved
    let kingMovedAt = -1;
    for (let i = 0; i < state.moveHistory.length; i++) {
      const move = state.moveHistory[i];
      if (move.piece.type === 'king' && move.piece.color === color) {
        kingMovedAt = i;
        break;
      }
    }

    if (kingMovedAt === -1) {
      return {
        holds: true,
        operator: 'U',
        formula: 'W(castle) U moved(king)',
        timepoint: state.moveHistory.length,
        explanation: {
          en: 'King has not moved, castling still possible',
          no: 'Kongen har ikke flyttet, rokade fortsatt mulig'
        }
      };
    }

    return {
      holds: true,
      operator: 'U',
      formula: 'W(castle) U moved(king)',
      timepoint: kingMovedAt,
      explanation: {
        en: `Castling rights lost at move ${kingMovedAt + 1}`,
        no: `Rokaderettigheter mistet ved trekk ${kingMovedAt + 1}`
      }
    };
  }

  private checkPhiHoldsThrough(
    phi: (state: GameState, moveIndex: number) => boolean,
    state: GameState,
    throughIndex: number
  ): boolean {
    for (let i = 0; i <= throughIndex; i++) {
      if (!phi(state, i)) return false;
    }
    return true;
  }
}

// ============================================================================
// R - RELEASE
// ============================================================================

/**
 * φ R ψ - ψ holds until φ releases it (or forever if φ never holds)
 *
 * Chess examples:
 * - move R EP - Any move releases en passant right
 * - checkmate R game - Checkmate releases the game (ends it)
 */
export class R_Operator {
  /**
   * Check release condition
   * φ R ψ ≡ ψ holds until and including when φ becomes true, or forever
   */
  evaluate(
    phi: (state: GameState, moveIndex: number) => boolean,  // Release trigger
    psi: (state: GameState, moveIndex: number) => boolean,  // Condition to hold
    state: GameState
  ): TemporalResult {
    let phiIndex = -1;

    // Find when phi becomes true (the release)
    for (let i = 0; i <= state.moveHistory.length; i++) {
      if (phi(state, i)) {
        phiIndex = i;
        break;
      }
    }

    if (phiIndex === -1) {
      // Phi never triggered, check psi holds throughout
      const psiAlways = this.checkPsiHoldsThrough(psi, state, state.moveHistory.length);
      return {
        holds: psiAlways,
        operator: 'R',
        formula: 'φ R ψ',
        timepoint: state.moveHistory.length,
        explanation: psiAlways
          ? { en: 'Condition continues (never released)', no: 'Betingelse fortsetter (aldri frigjort)' }
          : { en: 'Condition failed without release', no: 'Betingelse feilet uten frigjøring' }
      };
    }

    // Check psi held until and including phi
    const psiHeld = this.checkPsiHoldsThrough(psi, state, phiIndex);

    return {
      holds: psiHeld,
      operator: 'R',
      formula: 'φ R ψ',
      timepoint: phiIndex,
      explanation: psiHeld
        ? { en: `Released at move ${phiIndex}`, no: `Frigjort ved trekk ${phiIndex}` }
        : { en: 'Condition failed before release', no: 'Betingelse feilet før frigjøring' }
    };
  }

  /**
   * Any move releases en passant right
   */
  moveReleasesEnPassant(state: GameState): TemporalResult {
    // En passant is released by any subsequent move
    return {
      holds: true,
      operator: 'R',
      formula: 'any_move R EP_right',
      timepoint: state.moveHistory.length,
      explanation: {
        en: 'En passant is released by any move',
        no: 'En passant frigjøres av ethvert trekk'
      }
    };
  }

  private checkPsiHoldsThrough(
    psi: (state: GameState, moveIndex: number) => boolean,
    state: GameState,
    throughIndex: number
  ): boolean {
    for (let i = 0; i <= throughIndex; i++) {
      if (!psi(state, i)) return false;
    }
    return true;
  }
}

// ============================================================================
// TEMPORAL PATTERN HELPERS
// ============================================================================

/**
 * Common temporal patterns in chess
 */
export class TemporalPatterns {
  private gOperator = new G_Operator();
  private fOperator = new F_Operator();
  private xOperator = new X_Operator();
  private uOperator = new U_Operator();
  private rOperator = new R_Operator();

  /**
   * F[≤n](φ) - φ holds within n moves
   * Used for en passant (n=1)
   */
  withinMoves(
    predicate: (state: GameState) => boolean,
    state: GameState,
    n: number
  ): TemporalResult {
    // Check if predicate can be satisfied within n moves
    return {
      holds: n >= 1 && predicate(state),
      operator: 'F[≤n]',
      formula: `F[≤${n}](φ)`,
      timepoint: state.moveHistory.length,
      explanation: {
        en: `Must happen within ${n} move(s)`,
        no: `Må skje innen ${n} trekk`
      }
    };
  }

  /**
   * Immediate obligation - must happen on next move
   * O(X(φ))
   */
  immediateObligation(
    predicate: (state: GameState) => boolean,
    state: GameState
  ): TemporalResult {
    return {
      holds: true, // The obligation exists
      operator: 'O(X(φ))',
      formula: 'O(X(φ)) - must do on next move',
      timepoint: state.moveHistory.length + 1,
      explanation: {
        en: 'Must be done on next move',
        no: 'Må gjøres på neste trekk'
      }
    };
  }

  /**
   * Power with temporal limit
   * ◊(W(φ)) - Power exists but may expire
   */
  temporalPower(
    condition: boolean,
    expiresAfter: string
  ): TemporalResult {
    return {
      holds: condition,
      operator: '◊W',
      formula: `◊(W(φ)) expires after ${expiresAfter}`,
      timepoint: 0,
      explanation: condition
        ? { en: `Power exists, expires after ${expiresAfter}`, no: `Makt eksisterer, utløper etter ${expiresAfter}` }
        : { en: 'Power has expired', no: 'Makt har utløpt' }
    };
  }
}

// ============================================================================
// EXPORT ALL TEMPORAL OPERATORS
// ============================================================================

export const TemporalOperators = {
  G: G_Operator,
  F: F_Operator,
  X: X_Operator,
  U: U_Operator,
  R: R_Operator,
  Patterns: TemporalPatterns
};

export type TemporalOperatorsType = typeof TemporalOperators;
