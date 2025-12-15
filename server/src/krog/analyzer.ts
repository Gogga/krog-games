/**
 * KROG Move Analyzer
 *
 * Orchestrates principle and tactical analysis for a move.
 * This is the main entry point for comprehensive move evaluation.
 */

import { Chess, Square as ChessSquare, Move } from 'chess.js';
import { Square, ModalOperator } from './types';
import {
  evaluatePrinciples,
  getApplicablePrinciples,
  KROGPrinciple,
  PrincipleResult
} from './principles';
import { detectTacticsAfterMove, TacticalResult } from './tactics';
import { determinePhase, GamePhase } from './evaluator';

// Full move analysis result
export interface KROGMoveAnalysis {
  // Move info
  move: string;           // SAN notation
  from: Square;
  to: Square;
  pieceType: string;

  // Game context
  phase: GamePhase;

  // Principle evaluation
  principleResults: Array<{
    code: string;
    name: { en: string; no: string };
    type: ModalOperator;
    result: PrincipleResult;
  }>;
  satisfiedPrinciples: string[];
  violatedPrinciples: string[];
  principleScore: number;

  // Tactical patterns created by this move
  tacticalPatterns: TacticalResult[];
  tacticalScore: number;

  // Combined KROG score
  totalKrogScore: number;

  // KROG formula summary
  krogFormula: string;

  // Human-readable explanation
  explanation: {
    en: string;
    no: string;
  };
}

/**
 * Analyze a specific move comprehensively
 */
export function analyzeMove(
  game: Chess,
  from: Square,
  to: Square,
  promotion?: string
): KROGMoveAnalysis {
  const phase = determinePhase(game);
  const piece = game.get(from as ChessSquare);

  if (!piece) {
    throw new Error(`No piece at ${from}`);
  }

  // Get SAN notation for the move
  let moveSan = '';
  const gameCopy = new Chess(game.fen());
  try {
    const result = gameCopy.move({ from, to, promotion });
    moveSan = result.san;
  } catch {
    // Invalid move - still analyze what would happen
    moveSan = `${from}-${to}`;
  }

  // Evaluate principles
  const principleEval = evaluatePrinciples(game, { from, to });
  const principles = getApplicablePrinciples(game);

  const principleResults: KROGMoveAnalysis['principleResults'] = [];
  const satisfiedPrinciples: string[] = [];
  const violatedPrinciples: string[] = [];

  for (const principle of principles) {
    const result = principleEval.results.get(principle.code);
    if (result && result.applies) {
      principleResults.push({
        code: principle.code,
        name: principle.name,
        type: principle.type,
        result
      });

      if (result.satisfied) {
        satisfiedPrinciples.push(principle.code);
      } else if (principle.type === 'O') {
        violatedPrinciples.push(principle.code);
      }
    }
  }

  // Detect tactical patterns
  const tacticalPatterns = detectTacticsAfterMove(game, { from, to });
  const tacticalScore = tacticalPatterns.reduce((sum, t) => sum + t.score, 0);

  // Calculate total score
  const totalKrogScore = principleEval.totalScore + tacticalScore;

  // Generate KROG formula
  const krogFormula = generateKrogFormula(
    piece.type,
    moveSan,
    satisfiedPrinciples,
    violatedPrinciples,
    tacticalPatterns
  );

  // Generate explanation
  const explanation = generateExplanation(
    moveSan,
    principleResults,
    tacticalPatterns,
    totalKrogScore
  );

  return {
    move: moveSan,
    from,
    to,
    pieceType: piece.type,
    phase,
    principleResults,
    satisfiedPrinciples,
    violatedPrinciples,
    principleScore: principleEval.totalScore,
    tacticalPatterns,
    tacticalScore,
    totalKrogScore,
    krogFormula,
    explanation
  };
}

/**
 * Generate KROG formula for the move
 */
function generateKrogFormula(
  pieceType: string,
  moveSan: string,
  satisfied: string[],
  violated: string[],
  tactics: TacticalResult[]
): string {
  const parts: string[] = [];

  // Base move permission
  parts.push(`P(${moveSan})`);

  // Add satisfied principles
  if (satisfied.length > 0) {
    parts.push(`satisfies(${satisfied.slice(0, 3).join(', ')})`);
  }

  // Add violated principles
  if (violated.length > 0) {
    parts.push(`violates(${violated.slice(0, 2).join(', ')})`);
  }

  // Add tactical patterns
  for (const tactic of tactics.slice(0, 2)) {
    parts.push(tactic.krogFormula.split('→')[0].trim());
  }

  return parts.join(' ∧ ');
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(
  moveSan: string,
  principleResults: KROGMoveAnalysis['principleResults'],
  tactics: TacticalResult[],
  score: number
): { en: string; no: string } {
  const partsEn: string[] = [];
  const partsNo: string[] = [];

  // Start with move
  partsEn.push(`${moveSan}:`);
  partsNo.push(`${moveSan}:`);

  // Add principle explanations (top 2 positive)
  const positiveResults = principleResults
    .filter(p => p.result.satisfied && p.result.score > 0)
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, 2);

  for (const p of positiveResults) {
    partsEn.push(p.result.explanation.en);
    partsNo.push(p.result.explanation.no);
  }

  // Add tactical explanations
  for (const tactic of tactics.slice(0, 1)) {
    partsEn.push(tactic.explanation.en);
    partsNo.push(tactic.explanation.no);
  }

  // Add negative principle warnings (top 1)
  const negativeResults = principleResults
    .filter(p => !p.result.satisfied && p.type === 'O' && p.result.score < 0)
    .sort((a, b) => a.result.score - b.result.score)
    .slice(0, 1);

  for (const p of negativeResults) {
    partsEn.push(`Warning: ${p.result.explanation.en}`);
    partsNo.push(`Advarsel: ${p.result.explanation.no}`);
  }

  // If no specific explanations, give general assessment
  if (partsEn.length === 1) {
    if (score > 20) {
      partsEn.push('Good move.');
      partsNo.push('Godt trekk.');
    } else if (score < -20) {
      partsEn.push('Questionable move.');
      partsNo.push('Tvilsomt trekk.');
    } else {
      partsEn.push('Neutral move.');
      partsNo.push('Nøytralt trekk.');
    }
  }

  return {
    en: partsEn.join(' '),
    no: partsNo.join(' ')
  };
}

/**
 * Quick analysis - just get the score without full details
 */
export function quickAnalyzeMove(
  game: Chess,
  from: Square,
  to: Square
): { score: number; satisfied: string[]; tactics: string[] } {
  const principleEval = evaluatePrinciples(game, { from, to });
  const tactics = detectTacticsAfterMove(game, { from, to });

  const satisfied = Array.from(principleEval.results.entries())
    .filter(([_, r]) => r.satisfied)
    .map(([code, _]) => code);

  return {
    score: principleEval.totalScore + tactics.reduce((s, t) => s + t.score, 0),
    satisfied,
    tactics: tactics.map(t => t.pattern)
  };
}

/**
 * Analyze all legal moves and return analyses
 */
export function analyzeAllMoves(game: Chess): KROGMoveAnalysis[] {
  const analyses: KROGMoveAnalysis[] = [];
  const moves = game.moves({ verbose: true });

  for (const move of moves) {
    try {
      const analysis = analyzeMove(game, move.from as Square, move.to as Square, move.promotion);
      analyses.push(analysis);
    } catch {
      // Skip invalid moves
    }
  }

  return analyses;
}

/**
 * Compare two moves by their KROG scores
 */
export function compareMoves(
  game: Chess,
  move1: { from: Square; to: Square },
  move2: { from: Square; to: Square }
): {
  preferred: { from: Square; to: Square };
  scoreDifference: number;
  reason: { en: string; no: string };
} {
  const analysis1 = analyzeMove(game, move1.from, move1.to);
  const analysis2 = analyzeMove(game, move2.from, move2.to);

  const scoreDiff = analysis1.totalKrogScore - analysis2.totalKrogScore;
  const preferred = scoreDiff >= 0 ? move1 : move2;
  const betterAnalysis = scoreDiff >= 0 ? analysis1 : analysis2;

  return {
    preferred,
    scoreDifference: Math.abs(scoreDiff),
    reason: {
      en: `${betterAnalysis.move} is better: ${betterAnalysis.explanation.en}`,
      no: `${betterAnalysis.move} er bedre: ${betterAnalysis.explanation.no}`
    }
  };
}
