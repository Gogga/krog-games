/**
 * KROG Opening Book
 *
 * Loads and queries the opening book for position statistics and theory.
 */

import { Chess, Square as ChessSquare } from 'chess.js';
import * as fs from 'fs';
import * as path from 'path';
import { Square } from './types';

// Opening data types
interface OpeningVariation {
  id: string;
  name: { en: string; no: string };
  moves: string;
  eco?: string;
  level?: number;
  idea?: string;
  krog?: string;
  lines?: Array<{
    name: string;
    moves: string;
    evaluation?: string;
    warning?: string;
    krog?: string;
  }>;
}

interface Opening {
  id: string;
  name: { en: string; no: string };
  eco: string;
  moves: string;
  level: number;
  popularity: number;
  description?: { en: string; no: string };
  keyIdeas?: {
    white: string[];
    black: string[];
  };
  krog?: {
    mainTheme?: string;
    strategicFormula?: string;
    tacticalPatterns?: string[];
  };
  statistics: {
    whiteWins: number;
    draws: number;
    blackWins: number;
    avgMoves?: number;
  };
  variations?: OpeningVariation[];
}

interface OpeningsData {
  metadata: {
    version: string;
    totalOpenings: number;
    totalVariations: number;
    ecoCoverage: string;
    format: string;
  };
  openings: Opening[];
}

// Book move information
export interface BookMove {
  move: string;           // SAN notation
  from: Square;
  to: Square;
  openingName: { en: string; no: string };
  eco: string;
  statistics: {
    whiteWins: number;
    draws: number;
    blackWins: number;
    total: number;
    whiteWinRate: number;
    drawRate: number;
    blackWinRate: number;
  };
  level: number;
  popularity: number;
  krog?: {
    mainTheme?: string;
    strategicFormula?: string;
  };
  isMainLine: boolean;
}

// Opening info for a position
export interface OpeningInfo {
  name: { en: string; no: string };
  eco: string;
  description?: { en: string; no: string };
  keyIdeas?: {
    white: string[];
    black: string[];
  };
  krog?: {
    mainTheme?: string;
    strategicFormula?: string;
    tacticalPatterns?: string[];
  };
  statistics: {
    whiteWins: number;
    draws: number;
    blackWins: number;
    total: number;
  };
}

// Position to opening mapping
interface PositionMap {
  fen: string;           // Position-only FEN (no clocks/counters)
  opening: Opening;
  variation?: OpeningVariation;
  line?: string;
  nextMoves: Map<string, { opening: Opening; variation?: OpeningVariation }>;
}

// Singleton book instance
let openingsData: OpeningsData | null = null;
let positionMap: Map<string, PositionMap> = new Map();
let isLoaded = false;

/**
 * Extract position-only FEN (ignoring move counters)
 */
function getPositionFen(fen: string): string {
  const parts = fen.split(' ');
  // Return: position + turn + castling + en passant
  return parts.slice(0, 4).join(' ');
}

/**
 * Parse a move sequence and build position map
 */
function buildPositionMap(moves: string, opening: Opening, variation?: OpeningVariation): void {
  const game = new Chess();
  const moveList = moves.replace(/\d+\./g, '').trim().split(/\s+/).filter(m => m);

  let prevFen = getPositionFen(game.fen());

  for (const moveStr of moveList) {
    try {
      const move = game.move(moveStr);
      if (move) {
        const currentFen = getPositionFen(game.fen());

        // Add this position to the map
        if (!positionMap.has(currentFen)) {
          positionMap.set(currentFen, {
            fen: currentFen,
            opening,
            variation,
            nextMoves: new Map()
          });
        }

        // Link previous position to this move
        const prevPosition = positionMap.get(prevFen);
        if (prevPosition) {
          prevPosition.nextMoves.set(move.san, { opening, variation });
        }

        prevFen = currentFen;
      }
    } catch {
      // Invalid move sequence, stop processing
      break;
    }
  }
}

/**
 * Load the opening book from JSON file
 */
export function loadOpeningBook(): boolean {
  if (isLoaded) return true;

  try {
    const dataPath = path.join(__dirname, '../../data/openings.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    openingsData = JSON.parse(rawData) as OpeningsData;

    // Build position map
    positionMap = new Map();

    // Set starting position
    const startFen = getPositionFen(new Chess().fen());
    positionMap.set(startFen, {
      fen: startFen,
      opening: {
        id: 'starting',
        name: { en: 'Starting Position', no: 'Startposisjon' },
        eco: '',
        moves: '',
        level: 0,
        popularity: 100,
        statistics: { whiteWins: 37, draws: 26, blackWins: 37 }
      },
      nextMoves: new Map()
    });

    // Process all openings and variations
    for (const opening of openingsData.openings) {
      buildPositionMap(opening.moves, opening);

      // Process variations
      if (opening.variations) {
        for (const variation of opening.variations) {
          const fullMoves = `${opening.moves} ${variation.moves}`;
          buildPositionMap(fullMoves, opening, variation);

          // Process lines within variations
          if (variation.lines) {
            for (const line of variation.lines) {
              const lineMoves = `${fullMoves} ${line.moves}`;
              buildPositionMap(lineMoves, opening, variation);
            }
          }
        }
      }
    }

    isLoaded = true;
    console.log(`Opening book loaded: ${positionMap.size} positions mapped`);
    return true;
  } catch (error) {
    console.error('Failed to load opening book:', error);
    return false;
  }
}

/**
 * Look up opening info for a position
 */
export function lookupPosition(game: Chess): OpeningInfo | null {
  if (!isLoaded) loadOpeningBook();

  const fen = getPositionFen(game.fen());
  const position = positionMap.get(fen);

  if (!position) return null;

  const opening = position.opening;
  const stats = opening.statistics;
  const total = stats.whiteWins + stats.draws + stats.blackWins;

  return {
    name: position.variation?.name || opening.name,
    eco: position.variation?.eco || opening.eco,
    description: opening.description,
    keyIdeas: opening.keyIdeas,
    krog: opening.krog,
    statistics: {
      whiteWins: stats.whiteWins,
      draws: stats.draws,
      blackWins: stats.blackWins,
      total
    }
  };
}

/**
 * Get book moves for current position
 */
export function getBookMoves(game: Chess): BookMove[] {
  if (!isLoaded) loadOpeningBook();

  const fen = getPositionFen(game.fen());
  const position = positionMap.get(fen);
  const bookMoves: BookMove[] = [];

  if (!position) return bookMoves;

  // Get all legal moves
  const legalMoves = game.moves({ verbose: true });

  // Check which legal moves are in the book
  for (const move of legalMoves) {
    const nextInfo = position.nextMoves.get(move.san);
    if (nextInfo) {
      const opening = nextInfo.opening;
      const stats = opening.statistics;
      const total = stats.whiteWins + stats.draws + stats.blackWins;

      bookMoves.push({
        move: move.san,
        from: move.from as Square,
        to: move.to as Square,
        openingName: nextInfo.variation?.name || opening.name,
        eco: nextInfo.variation?.eco || opening.eco,
        statistics: {
          whiteWins: stats.whiteWins,
          draws: stats.draws,
          blackWins: stats.blackWins,
          total,
          whiteWinRate: total > 0 ? stats.whiteWins / total : 0.33,
          drawRate: total > 0 ? stats.draws / total : 0.34,
          blackWinRate: total > 0 ? stats.blackWins / total : 0.33
        },
        level: opening.level,
        popularity: opening.popularity,
        krog: opening.krog ? {
          mainTheme: opening.krog.mainTheme,
          strategicFormula: opening.krog.strategicFormula
        } : undefined,
        isMainLine: !nextInfo.variation  // Main line if no variation
      });
    }
  }

  // Sort by popularity
  bookMoves.sort((a, b) => b.popularity - a.popularity);

  return bookMoves;
}

/**
 * Check if a move is in the opening book
 */
export function isBookMove(game: Chess, move: { from: Square; to: Square }): boolean {
  if (!isLoaded) loadOpeningBook();

  const fen = getPositionFen(game.fen());
  const position = positionMap.get(fen);

  if (!position) return false;

  // Try to get SAN for the move
  const gameCopy = new Chess(game.fen());
  try {
    const result = gameCopy.move({ from: move.from, to: move.to });
    return position.nextMoves.has(result.san);
  } catch {
    return false;
  }
}

/**
 * Get win rate for a book move from side to move's perspective
 */
export function getBookMoveWinRate(bookMove: BookMove, sideToMove: 'w' | 'b'): number {
  const stats = bookMove.statistics;
  if (sideToMove === 'w') {
    return stats.whiteWinRate + (stats.drawRate * 0.5);
  } else {
    return stats.blackWinRate + (stats.drawRate * 0.5);
  }
}

/**
 * Get opening repertoire suggestions based on player level
 */
export function getRepertoireSuggestions(
  color: 'white' | 'black',
  level: number
): Opening[] {
  if (!isLoaded) loadOpeningBook();
  if (!openingsData) return [];

  return openingsData.openings
    .filter(o => o.level <= level + 1)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5);
}

/**
 * Check if current position is still in book
 */
export function isInBook(game: Chess): boolean {
  if (!isLoaded) loadOpeningBook();
  const fen = getPositionFen(game.fen());
  return positionMap.has(fen);
}

/**
 * Get total book positions count
 */
export function getBookSize(): number {
  if (!isLoaded) loadOpeningBook();
  return positionMap.size;
}
