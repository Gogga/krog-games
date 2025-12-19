/**
 * KROG Chess Framework - Notation Operators
 *
 * The 6 notation operators:
 * PSA (Parse Standard Algebraic), PLA (Parse Long Algebraic),
 * PUCI (Parse UCI Format), PVN (Parse Voice Natural),
 * GN (Generate Notation), NC (Notation Conversion)
 *
 * @version 1.0.0
 * @author Georg Philip Krog
 */

import {
  Move,
  GameState,
  Piece,
  PieceType,
  Square,
  Color,
  NotationParseResult,
  NotationGenerateResult,
  squareToString,
  stringToSquare,
  pieceSymbol
} from './types';

// ============================================================================
// PSA - PARSE STANDARD ALGEBRAIC NOTATION
// ============================================================================

/**
 * PSA(notation) - Parse Standard Algebraic Notation
 *
 * Examples: e4, Nf3, Bxe5, O-O, O-O-O, e8=Q, Qh4+, Qxf7#
 */
export class PSA_Operator {
  private readonly pieceSymbols = ['K', 'Q', 'R', 'B', 'N'];
  private readonly files = 'abcdefgh';
  private readonly ranks = '12345678';

  /**
   * Parse SAN notation
   */
  parse(notation: string, state: GameState): NotationParseResult {
    try {
      // Handle castling
      if (notation === 'O-O' || notation === '0-0') {
        return this.parseCastling('kingside', state);
      }
      if (notation === 'O-O-O' || notation === '0-0-0') {
        return this.parseCastling('queenside', state);
      }

      // Remove check/checkmate symbols
      const clean = notation.replace(/[+#!?]+$/, '');

      // Parse the notation
      const result = this.parseMove(clean, state);
      return result;
    } catch (error) {
      return {
        valid: false,
        error: `Invalid notation: ${notation}`,
        format: 'san'
      };
    }
  }

  private parseCastling(side: 'kingside' | 'queenside', state: GameState): NotationParseResult {
    const color = state.currentPlayer;
    const rank = color === 'white' ? 1 : 8;
    const king = state.getKing(color);

    const toFile = side === 'kingside' ? 7 : 3;

    return {
      valid: true,
      move: {
        piece: king,
        from: king.square,
        to: { file: toFile, rank },
        castling: side,
        san: side === 'kingside' ? 'O-O' : 'O-O-O'
      },
      format: 'san'
    };
  }

  private parseMove(notation: string, state: GameState): NotationParseResult {
    let idx = 0;
    let pieceType: PieceType = 'pawn';
    let fromFile: number | undefined;
    let fromRank: number | undefined;
    let isCapture = false;
    let toSquare: Square;
    let promotion: PieceType | undefined;

    // Check for piece symbol
    if (this.pieceSymbols.includes(notation[idx])) {
      pieceType = this.symbolToPiece(notation[idx]);
      idx++;
    }

    // Look for disambiguation and target square
    const remaining = notation.slice(idx);

    // Find the target square (last two characters before promotion)
    const promotionMatch = remaining.match(/=([QRBN])$/);
    const cleanRemaining = promotionMatch
      ? remaining.slice(0, -2)
      : remaining;

    // Extract capture
    const parts = cleanRemaining.split('x');
    const hasCapture = parts.length === 2;

    let beforeTarget = hasCapture ? parts[0] : '';
    let targetStr = hasCapture ? parts[1] : cleanRemaining;

    // Handle disambiguation in beforeTarget
    if (beforeTarget.length >= 1) {
      if (this.files.includes(beforeTarget[0])) {
        fromFile = this.files.indexOf(beforeTarget[0]) + 1;
      }
      if (beforeTarget.length >= 2 && this.ranks.includes(beforeTarget[1])) {
        fromRank = parseInt(beforeTarget[1]);
      } else if (beforeTarget.length === 1 && this.ranks.includes(beforeTarget[0])) {
        fromRank = parseInt(beforeTarget[0]);
      }
    }

    // Handle case where target is at end of non-capture notation
    if (!hasCapture && cleanRemaining.length >= 2) {
      const possibleTarget = cleanRemaining.slice(-2);
      if (this.isValidSquare(possibleTarget)) {
        targetStr = possibleTarget;
        const beforePart = cleanRemaining.slice(0, -2);
        if (beforePart.length >= 1 && this.files.includes(beforePart[0])) {
          fromFile = this.files.indexOf(beforePart[0]) + 1;
        }
        if (beforePart.length >= 2 && this.ranks.includes(beforePart[1])) {
          fromRank = parseInt(beforePart[1]);
        }
      }
    }

    // Parse target square
    if (!this.isValidSquare(targetStr)) {
      return { valid: false, error: `Invalid target square: ${targetStr}`, format: 'san' };
    }
    toSquare = stringToSquare(targetStr);

    // Parse promotion
    if (promotionMatch) {
      promotion = this.symbolToPiece(promotionMatch[1]);
    }

    // Find the piece that can make this move
    const piece = this.findMovingPiece(pieceType, toSquare, state, fromFile, fromRank);
    if (!piece) {
      return { valid: false, error: `No ${pieceType} can move to ${targetStr}`, format: 'san' };
    }

    return {
      valid: true,
      move: {
        piece,
        from: piece.square,
        to: toSquare,
        capture: state.board.getPiece(toSquare) || undefined,
        promotion,
        san: notation
      },
      format: 'san'
    };
  }

  private isValidSquare(s: string): boolean {
    return s.length === 2 &&
           this.files.includes(s[0]) &&
           this.ranks.includes(s[1]);
  }

  private symbolToPiece(symbol: string): PieceType {
    const map: Record<string, PieceType> = {
      'K': 'king', 'Q': 'queen', 'R': 'rook', 'B': 'bishop', 'N': 'knight'
    };
    return map[symbol] || 'pawn';
  }

  private findMovingPiece(
    type: PieceType,
    to: Square,
    state: GameState,
    fromFile?: number,
    fromRank?: number
  ): Piece | null {
    const candidates = state.getPieces(state.currentPlayer)
      .filter(p => p.type === type)
      .filter(p => fromFile === undefined || p.square.file === fromFile)
      .filter(p => fromRank === undefined || p.square.rank === fromRank);

    // In a full implementation, we'd check which pieces can legally move to 'to'
    // For now, return the first candidate
    return candidates[0] || null;
  }
}

// ============================================================================
// PLA - PARSE LONG ALGEBRAIC NOTATION
// ============================================================================

/**
 * PLA(notation) - Parse Long Algebraic Notation
 *
 * Examples: e2-e4, Ng1-f3, Bf1xe5
 */
export class PLA_Operator {
  private readonly pieceSymbols = ['K', 'Q', 'R', 'B', 'N'];

  /**
   * Parse LAN notation
   */
  parse(notation: string, state: GameState): NotationParseResult {
    try {
      // Pattern: [Piece]from[-x]to[=Promotion]
      const pattern = /^([KQRBN])?([a-h][1-8])([-x])([a-h][1-8])(=[QRBN])?[+#]?$/;
      const match = pattern.exec(notation);

      if (!match) {
        return { valid: false, error: 'Invalid LAN format', format: 'lan' };
      }

      const [, pieceSymbol, fromStr, separator, toStr, promotionStr] = match;

      const from = stringToSquare(fromStr);
      const to = stringToSquare(toStr);
      const piece = state.board.getPiece(from);

      if (!piece) {
        return { valid: false, error: `No piece on ${fromStr}`, format: 'lan' };
      }

      const promotion = promotionStr
        ? this.symbolToPiece(promotionStr[1])
        : undefined;

      return {
        valid: true,
        move: {
          piece,
          from,
          to,
          capture: separator === 'x' ? state.board.getPiece(to) || undefined : undefined,
          promotion
        },
        format: 'lan'
      };
    } catch {
      return { valid: false, error: 'Parse error', format: 'lan' };
    }
  }

  private symbolToPiece(symbol: string): PieceType {
    const map: Record<string, PieceType> = {
      'K': 'king', 'Q': 'queen', 'R': 'rook', 'B': 'bishop', 'N': 'knight'
    };
    return map[symbol] || 'pawn';
  }
}

// ============================================================================
// PUCI - PARSE UCI FORMAT
// ============================================================================

/**
 * PUCI(notation) - Parse UCI Format
 *
 * Examples: e2e4, g1f3, e7e8q
 */
export class PUCI_Operator {
  /**
   * Parse UCI notation
   */
  parse(notation: string, state: GameState): NotationParseResult {
    // UCI format: from + to + optional promotion
    const pattern = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/;
    const match = pattern.exec(notation.toLowerCase());

    if (!match) {
      return { valid: false, error: 'Invalid UCI format', format: 'uci' };
    }

    const [, fromStr, toStr, promotionChar] = match;
    const from = stringToSquare(fromStr);
    const to = stringToSquare(toStr);
    const piece = state.board.getPiece(from);

    if (!piece) {
      return { valid: false, error: `No piece on ${fromStr}`, format: 'uci' };
    }

    // Check for castling (king moves 2 squares)
    let castling: 'kingside' | 'queenside' | undefined;
    if (piece.type === 'king' && Math.abs(to.file - from.file) === 2) {
      castling = to.file > from.file ? 'kingside' : 'queenside';
    }

    const promotion = promotionChar
      ? this.charToPiece(promotionChar)
      : undefined;

    return {
      valid: true,
      move: {
        piece,
        from,
        to,
        capture: state.board.getPiece(to) || undefined,
        castling,
        promotion,
        uci: notation
      },
      format: 'uci'
    };
  }

  private charToPiece(char: string): PieceType {
    const map: Record<string, PieceType> = {
      'q': 'queen', 'r': 'rook', 'b': 'bishop', 'n': 'knight'
    };
    return map[char] || 'queen';
  }
}

// ============================================================================
// PVN - PARSE VOICE NATURAL
// ============================================================================

/**
 * PVN(notation) - Parse Voice Natural Language
 *
 * Examples:
 * EN: "knight to f3", "pawn takes on e5", "castle kingside"
 * NO: "springer til f3", "bonde slår på e5", "roker kort"
 */
export class PVN_Operator {
  private readonly pieceNamesEN: Record<string, PieceType> = {
    'king': 'king', 'queen': 'queen', 'rook': 'rook',
    'bishop': 'bishop', 'knight': 'knight', 'pawn': 'pawn'
  };

  private readonly pieceNamesNO: Record<string, PieceType> = {
    'konge': 'king', 'dronning': 'queen', 'tårn': 'rook',
    'løper': 'bishop', 'springer': 'knight', 'bonde': 'pawn'
  };

  /**
   * Parse voice command
   */
  parse(voice: string, state: GameState, language: 'en' | 'no' = 'en'): NotationParseResult {
    const text = voice.toLowerCase().trim();

    // Check for castling
    if (this.isCastlingCommand(text, language)) {
      const side = this.getCastlingSide(text, language);
      return this.createCastlingMove(side, state);
    }

    // Parse piece + destination
    const pieceNames = language === 'en' ? this.pieceNamesEN : this.pieceNamesNO;
    const toKeyword = language === 'en' ? 'to' : 'til';
    const takesKeyword = language === 'en' ? ['takes', 'captures'] : ['slår', 'tar'];

    // Find piece type
    let pieceType: PieceType = 'pawn';
    for (const [name, type] of Object.entries(pieceNames)) {
      if (text.includes(name)) {
        pieceType = type;
        break;
      }
    }

    // Find target square
    const squareMatch = text.match(/[a-h][1-8]/);
    if (!squareMatch) {
      return { valid: false, error: 'No target square found', format: 'voice' };
    }

    const to = stringToSquare(squareMatch[0]);
    const isCapture = takesKeyword.some(k => text.includes(k));

    // Find the piece that can make this move
    const candidates = state.getPieces(state.currentPlayer)
      .filter(p => p.type === pieceType);

    if (candidates.length === 0) {
      return { valid: false, error: `No ${pieceType} available`, format: 'voice' };
    }

    // For simplicity, take the first candidate
    const piece = candidates[0];

    return {
      valid: true,
      move: {
        piece,
        from: piece.square,
        to,
        capture: isCapture ? state.board.getPiece(to) || undefined : undefined
      },
      format: 'voice'
    };
  }

  private isCastlingCommand(text: string, language: 'en' | 'no'): boolean {
    if (language === 'en') {
      return text.includes('castle') || text.includes('castling');
    }
    return text.includes('roker') || text.includes('rokade');
  }

  private getCastlingSide(text: string, language: 'en' | 'no'): 'kingside' | 'queenside' {
    if (language === 'en') {
      if (text.includes('queenside') || text.includes('long')) return 'queenside';
      return 'kingside';
    }
    if (text.includes('lang') || text.includes('dronning')) return 'queenside';
    return 'kingside';
  }

  private createCastlingMove(side: 'kingside' | 'queenside', state: GameState): NotationParseResult {
    const king = state.getKing(state.currentPlayer);
    const rank = state.currentPlayer === 'white' ? 1 : 8;
    const toFile = side === 'kingside' ? 7 : 3;

    return {
      valid: true,
      move: {
        piece: king,
        from: king.square,
        to: { file: toFile, rank },
        castling: side
      },
      format: 'voice'
    };
  }
}

// ============================================================================
// GN - GENERATE NOTATION
// ============================================================================

/**
 * GN(move) - Generate Notation from Move
 */
export class GN_Operator {
  /**
   * Generate all notation formats for a move
   */
  generate(move: Move, state: GameState): NotationGenerateResult {
    return {
      san: this.generateSAN(move, state),
      lan: this.generateLAN(move),
      uci: this.generateUCI(move),
      voice: {
        en: this.generateVoiceEN(move),
        no: this.generateVoiceNO(move)
      }
    };
  }

  /**
   * Generate Standard Algebraic Notation
   */
  generateSAN(move: Move, state: GameState): string {
    // Castling
    if (move.castling) {
      return move.castling === 'kingside' ? 'O-O' : 'O-O-O';
    }

    let san = '';

    // Piece symbol (not for pawns)
    if (move.piece.type !== 'pawn') {
      san += pieceSymbol(move.piece);
    }

    // Disambiguation (simplified - full implementation would check ambiguity)
    // For now, skip disambiguation

    // Capture
    if (move.capture || move.enPassant) {
      if (move.piece.type === 'pawn') {
        san += 'abcdefgh'[move.from.file - 1];
      }
      san += 'x';
    }

    // Destination square
    san += squareToString(move.to);

    // Promotion
    if (move.promotion) {
      san += '=' + pieceSymbol({ type: move.promotion } as Piece);
    }

    return san;
  }

  /**
   * Generate Long Algebraic Notation
   */
  generateLAN(move: Move): string {
    if (move.castling) {
      return move.castling === 'kingside' ? 'O-O' : 'O-O-O';
    }

    let lan = '';

    if (move.piece.type !== 'pawn') {
      lan += pieceSymbol(move.piece);
    }

    lan += squareToString(move.from);
    lan += move.capture || move.enPassant ? 'x' : '-';
    lan += squareToString(move.to);

    if (move.promotion) {
      lan += '=' + pieceSymbol({ type: move.promotion } as Piece);
    }

    return lan;
  }

  /**
   * Generate UCI notation
   */
  generateUCI(move: Move): string {
    let uci = squareToString(move.from) + squareToString(move.to);

    if (move.promotion) {
      const promoChar: Record<PieceType, string> = {
        queen: 'q', rook: 'r', bishop: 'b', knight: 'n',
        king: '', pawn: ''
      };
      uci += promoChar[move.promotion];
    }

    return uci;
  }

  /**
   * Generate English voice notation
   */
  generateVoiceEN(move: Move): string {
    if (move.castling) {
      return `castle ${move.castling}`;
    }

    const pieceName = move.piece.type;
    const action = move.capture ? 'takes on' : 'to';
    const dest = squareToString(move.to);

    let voice = `${pieceName} ${action} ${dest}`;

    if (move.promotion) {
      voice += ` promotes to ${move.promotion}`;
    }

    return voice;
  }

  /**
   * Generate Norwegian voice notation
   */
  generateVoiceNO(move: Move): string {
    if (move.castling) {
      return move.castling === 'kingside' ? 'roker kort' : 'roker langt';
    }

    const pieceNames: Record<PieceType, string> = {
      king: 'kongen', queen: 'dronningen', rook: 'tårnet',
      bishop: 'løperen', knight: 'springeren', pawn: 'bonden'
    };

    const pieceName = pieceNames[move.piece.type];
    const action = move.capture ? 'slår på' : 'til';
    const dest = squareToString(move.to);

    let voice = `${pieceName} ${action} ${dest}`;

    if (move.promotion) {
      const promoNames: Record<PieceType, string> = {
        queen: 'dronning', rook: 'tårn', bishop: 'løper', knight: 'springer',
        king: '', pawn: ''
      };
      voice += ` forfremmes til ${promoNames[move.promotion]}`;
    }

    return voice;
  }
}

// ============================================================================
// NC - NOTATION CONVERSION
// ============================================================================

/**
 * NC(notation, from, to) - Convert between notation formats
 */
export class NC_Operator {
  private psaOperator: PSA_Operator;
  private plaOperator: PLA_Operator;
  private puciOperator: PUCI_Operator;
  private gnOperator: GN_Operator;

  constructor() {
    this.psaOperator = new PSA_Operator();
    this.plaOperator = new PLA_Operator();
    this.puciOperator = new PUCI_Operator();
    this.gnOperator = new GN_Operator();
  }

  /**
   * Convert notation from one format to another
   */
  convert(
    notation: string,
    fromFormat: 'san' | 'lan' | 'uci',
    toFormat: 'san' | 'lan' | 'uci' | 'voice_en' | 'voice_no',
    state: GameState
  ): string | null {
    // Parse the source notation
    let parseResult: NotationParseResult;

    switch (fromFormat) {
      case 'san':
        parseResult = this.psaOperator.parse(notation, state);
        break;
      case 'lan':
        parseResult = this.plaOperator.parse(notation, state);
        break;
      case 'uci':
        parseResult = this.puciOperator.parse(notation, state);
        break;
    }

    if (!parseResult.valid || !parseResult.move) {
      return null;
    }

    // Generate target notation
    const generated = this.gnOperator.generate(parseResult.move, state);

    switch (toFormat) {
      case 'san': return generated.san;
      case 'lan': return generated.lan;
      case 'uci': return generated.uci;
      case 'voice_en': return generated.voice.en;
      case 'voice_no': return generated.voice.no;
    }
  }
}

// ============================================================================
// EXPORT ALL NOTATION OPERATORS
// ============================================================================

export const NotationOperators = {
  PSA: PSA_Operator,
  PLA: PLA_Operator,
  PUCI: PUCI_Operator,
  PVN: PVN_Operator,
  GN: GN_Operator,
  NC: NC_Operator
};

export type NotationOperatorsType = typeof NotationOperators;
