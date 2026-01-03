import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Socket } from 'socket.io-client';
import { StockfishEngine, formatEvaluation, uciToSquares } from '../utils/stockfish';
import EvaluationBar from './EvaluationBar';

// Hook to detect mobile viewport
function useIsMobile(breakpoint: number = 600): boolean {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}

interface AnalyzedMove {
  move: string;        // SAN notation
  uci: string;         // UCI notation
  from: string;
  to: string;
  score: number;       // Centipawns
  mate?: number;
  rank: number;
  rType?: string;
  explanation?: string;
  principles?: string[];
}

interface AnalysisPanelProps {
  game: Chess;
  socket: Socket | null;
  roomCode: string | null;
  language: 'en' | 'no';
  isMyTurn: boolean;
  onMoveClick: (move: { from: string; to: string }) => void;
  boardHeight: number;
  flipped: boolean;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  game,
  socket,
  roomCode,
  language,
  isMyTurn,
  onMoveClick,
  boardHeight,
  flipped
}) => {
  const [enabled, setEnabled] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<number>(0);
  const [mate, setMate] = useState<number | undefined>();
  const [bestMoves, setBestMoves] = useState<AnalyzedMove[]>([]);
  const [depth, setDepth] = useState(15);
  const [engineReady, setEngineReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useIsMobile();

  const engineRef = useRef<StockfishEngine | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastFenRef = useRef<string>('');

  // Initialize engine when analysis mode is enabled
  useEffect(() => {
    if (enabled && !engineRef.current) {
      const engine = new StockfishEngine();
      engineRef.current = engine;

      engine.init()
        .then(() => {
          setEngineReady(true);
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to initialize Stockfish:', err);
          setError(language === 'en'
            ? 'Failed to load analysis engine'
            : 'Kunne ikke laste analysermotor');
        });
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, language]);

  // Cleanup engine on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  // Analyze position when it changes
  const analyzePosition = useCallback(async () => {
    if (!enabled || !engineReady || !engineRef.current) return;

    const fen = game.fen();

    // Skip if same position
    if (fen === lastFenRef.current) return;
    lastFenRef.current = fen;

    setAnalyzing(true);

    try {
      const result = await engineRef.current.getBestMoves(fen, {
        depth,
        multiPV: 3,
        timeLimit: 3000
      });

      setEvaluation(result.evaluation);
      setMate(result.mate);

      // Convert UCI moves to SAN and add KROG data
      const analyzedMoves: AnalyzedMove[] = result.bestMoves.map((bm, index) => {
        // Validate UCI move format (e.g., "e2e4", "g1f3")
        const uciMove = bm.move || '';
        if (uciMove.length < 4) {
          return {
            move: `Move ${index + 1}`,
            uci: uciMove,
            from: '',
            to: '',
            score: bm.score,
            mate: bm.mate,
            rank: index + 1
          };
        }

        const { from, to, promotion } = uciToSquares(uciMove);

        // Try to get SAN notation
        let san = uciMove; // Default to UCI if conversion fails
        try {
          const tempGame = new Chess(fen);
          const moveResult = tempGame.move({ from, to, promotion });
          if (moveResult && moveResult.san) {
            san = moveResult.san;
          }
        } catch {
          // Keep UCI notation if SAN conversion fails
        }

        return {
          move: san,
          uci: uciMove,
          from,
          to,
          score: bm.score,
          mate: bm.mate,
          rank: index + 1
        };
      });

      // Request KROG explanations from server
      if (socket && roomCode && analyzedMoves.length > 0) {
        socket.emit('analyze_position', {
          fen,
          engineMoves: analyzedMoves.map(m => ({
            move: m.uci,
            san: m.move,
            from: m.from,
            to: m.to,
            score: m.score,
            mate: m.mate
          }))
        });
      }

      setBestMoves(analyzedMoves);
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [enabled, engineReady, game, depth, socket, roomCode]);

  // Listen for KROG analysis results
  useEffect(() => {
    if (!socket) return;

    const handleAnalysisResult = (data: {
      moves: Array<{
        uci: string;
        rType?: string;
        explanation?: { en: string; no: string };
        principles?: string[];
      }>;
    }) => {
      setBestMoves(prev => prev.map(move => {
        const krogData = data.moves.find(m => m.uci === move.uci);
        if (krogData) {
          return {
            ...move,
            rType: krogData.rType,
            explanation: krogData.explanation?.[language],
            principles: krogData.principles
          };
        }
        return move;
      }));
    };

    socket.on('analysis_result', handleAnalysisResult);
    return () => {
      socket.off('analysis_result', handleAnalysisResult);
    };
  }, [socket, language]);

  // Debounced position analysis
  useEffect(() => {
    if (!enabled || !engineReady) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      analyzePosition();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [game.fen(), enabled, engineReady, analyzePosition]);

  const handleToggle = () => {
    if (enabled) {
      // Stop analysis
      if (engineRef.current) {
        engineRef.current.stop();
      }
      setBestMoves([]);
      setEvaluation(0);
      setMate(undefined);
    }
    setEnabled(!enabled);
  };

  const handleStop = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
    setAnalyzing(false);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '8px' : '12px',
      alignItems: 'stretch'
    }}>
      {/* Evaluation Bar - vertical on desktop, horizontal on mobile */}
      {enabled && !isMobile && (
        <EvaluationBar
          evaluation={evaluation}
          mate={mate}
          height={Math.min(boardHeight, 400)}
          flipped={flipped}
        />
      )}

      {/* Analysis Panel */}
      <div style={{
        flex: 1,
        background: 'var(--bg-secondary)',
        borderRadius: isMobile ? '8px' : '12px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '8px' : '0',
          padding: isMobile ? '10px 12px' : '12px 16px',
          background: enabled ? 'rgba(129, 182, 76, 0.1)' : 'rgba(0,0,0,0.2)',
          borderBottom: enabled ? '1px solid #333' : 'none'
        }}>
          <button
            onClick={handleToggle}
            style={{
              background: enabled ? '#81b64c' : '#444',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: 600,
              padding: isMobile ? '10px 14px' : '8px 16px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: isMobile ? '44px' : 'auto' // Touch-friendly
            }}
          >
            {enabled ? '✓' : '🔍'}
            {language === 'en' ? 'Analysis Mode' : 'Analysemodus'}
          </button>

          {enabled && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'space-between' : 'flex-end',
              gap: isMobile ? '8px' : '12px'
            }}>
              {/* Depth selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '0.8rem' }}>
                  {language === 'en' ? 'Depth:' : 'Dybde:'}
                </span>
                <select
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  style={{
                    background: '#333',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: 'white',
                    padding: isMobile ? '8px 10px' : '4px 8px',
                    fontSize: isMobile ? '0.85rem' : '0.8rem',
                    minHeight: isMobile ? '36px' : 'auto'
                  }}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={18}>18</option>
                  <option value={20}>20</option>
                </select>
              </div>

              {/* Stop button */}
              {analyzing && (
                <button
                  onClick={handleStop}
                  style={{
                    padding: isMobile ? '8px 14px' : '4px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#e74c3c',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: isMobile ? '0.85rem' : '0.8rem',
                    fontWeight: 600,
                    minHeight: isMobile ? '36px' : 'auto'
                  }}
                >
                  {language === 'en' ? 'Stop' : 'Stopp'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Horizontal Evaluation Bar for mobile */}
        {enabled && isMobile && (
          <EvaluationBar
            evaluation={evaluation}
            mate={mate}
            height={40}
            flipped={flipped}
            horizontal
          />
        )}

        {/* Content */}
        {enabled && (
          <div style={{ padding: isMobile ? '12px' : '16px' }}>
            {error ? (
              <div style={{ color: '#e74c3c', textAlign: 'center', padding: isMobile ? '12px' : '20px' }}>
                {error}
              </div>
            ) : analyzing && bestMoves.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', padding: isMobile ? '12px' : '20px' }}>
                {language === 'en' ? 'Analyzing position...' : 'Analyserer posisjon...'}
              </div>
            ) : bestMoves.length > 0 ? (
              <>
                {/* Evaluation summary - hide on mobile since we have horizontal bar */}
                {!isMobile && (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '16px',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px'
                  }}>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: evaluation > 50 ? '#81b64c' : evaluation < -50 ? '#e74c3c' : '#888'
                    }}>
                      {formatEvaluation(evaluation, mate)}
                    </span>
                    <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '8px' }}>
                      {language === 'en' ? 'depth' : 'dybde'} {depth}
                    </span>
                    {analyzing && (
                      <span style={{ color: '#4a90d9', fontSize: '0.8rem', marginLeft: '8px' }}>
                        {language === 'en' ? '(analyzing...)' : '(analyserer...)'}
                      </span>
                    )}
                  </div>
                )}

                {/* Click hint */}
                {isMyTurn && (
                  <div style={{
                    color: '#81b64c',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    marginBottom: isMobile ? '8px' : '12px',
                    textAlign: 'center'
                  }}>
                    {language === 'en'
                      ? (isMobile ? 'Tap a move to play' : 'Click a move to play it')
                      : (isMobile ? 'Trykk for å spille' : 'Klikk et trekk for å spille det')}
                  </div>
                )}

                {/* Best moves list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px' }}>
                  {bestMoves.map((move, index) => (
                    <div
                      key={move.uci}
                      onClick={() => {
                        if (isMyTurn) {
                          onMoveClick({ from: move.from, to: move.to });
                        }
                      }}
                      style={{
                        background: index === 0 ? 'rgba(129, 182, 76, 0.15)' : 'rgba(255,255,255,0.05)',
                        border: index === 0 ? '2px solid #81b64c' : '1px solid #333',
                        borderRadius: isMobile ? '6px' : '8px',
                        padding: isMobile ? '10px' : '12px',
                        cursor: isMyTurn ? 'pointer' : 'default',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        // Touch feedback
                        WebkitTapHighlightColor: 'rgba(129, 182, 76, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        if (isMyTurn && !isMobile) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {/* Move header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: isMobile ? '6px' : '10px',
                        marginBottom: move.explanation ? '8px' : '0'
                      }}>
                        {/* Rank badge */}
                        <span style={{
                          background: index === 0 ? '#81b64c' : index === 1 ? '#4a90d9' : '#666',
                          color: 'white',
                          padding: isMobile ? '2px 6px' : '2px 8px',
                          borderRadius: '4px',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          fontWeight: 700,
                          minWidth: isMobile ? '20px' : '24px',
                          textAlign: 'center'
                        }}>
                          #{move.rank}
                        </span>

                        {/* Move notation */}
                        <span style={{
                          fontWeight: 700,
                          fontSize: isMobile ? '1rem' : '1.1rem',
                          color: index === 0 ? '#81b64c' : 'white'
                        }}>
                          {move.move}
                        </span>

                        {/* Engine score */}
                        <span style={{
                          color: move.score > 0 ? '#81b64c' : move.score < 0 ? '#e74c3c' : '#888',
                          fontSize: isMobile ? '0.8rem' : '0.9rem',
                          fontWeight: 600
                        }}>
                          {formatEvaluation(move.score, move.mate)}
                        </span>

                        {/* R-Type badge */}
                        {move.rType && (
                          <span style={{
                            background: '#9b59b6',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: isMobile ? '0.6rem' : '0.7rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}>
                            {move.rType}
                          </span>
                        )}
                      </div>

                      {/* KROG explanation */}
                      {move.explanation && (
                        <div style={{
                          color: '#aaa',
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          lineHeight: 1.4,
                          marginBottom: move.principles?.length ? '8px' : '0'
                        }}>
                          {move.explanation}
                        </div>
                      )}

                      {/* Principles */}
                      {move.principles && move.principles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '4px' : '6px' }}>
                          {move.principles.slice(0, isMobile ? 2 : 3).map((principle) => (
                            <span
                              key={principle}
                              style={{
                                background: 'rgba(129, 182, 76, 0.2)',
                                color: '#81b64c',
                                padding: isMobile ? '2px 6px' : '2px 8px',
                                borderRadius: '4px',
                                fontSize: isMobile ? '0.65rem' : '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              ✓ {principle}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: '#888', textAlign: 'center', padding: isMobile ? '12px' : '20px' }}>
                {language === 'en'
                  ? 'Make a move to see analysis'
                  : 'Gjør et trekk for å se analyse'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
