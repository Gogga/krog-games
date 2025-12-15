import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { Socket } from 'socket.io-client';
import ChessBoard from './ChessBoard';

interface PuzzleData {
    id: string;
    fen: string;
    themes: string[];
    level: number;
    rating: number;
    solutionLength: number;
    krog?: {
        formula: string;
        explanation: {
            en: string;
            no: string;
        };
    };
    currentIndex: number;
    totalPuzzles: number;
}

interface PuzzleMoveResult {
    correct: boolean;
    completed: boolean;
    message: string;
    hint?: string;
    krog?: {
        formula: string;
        explanation: {
            en: string;
            no: string;
        };
    };
}

interface PuzzleModeProps {
    socket: Socket;
    language: 'en' | 'no';
    onExit: () => void;
}

const PuzzleMode: React.FC<PuzzleModeProps> = ({ socket, language, onExit }) => {
    const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
    const [game, setGame] = useState<Chess>(new Chess());
    const [moveIndex, setMoveIndex] = useState(0);
    const [status, setStatus] = useState<'playing' | 'correct' | 'incorrect' | 'solved'>('playing');
    const [message, setMessage] = useState('');
    const [hint, setHint] = useState<string | null>(null);
    const [solvedKrog, setSolvedKrog] = useState<PuzzleData['krog'] | null>(null);
    const [loading, setLoading] = useState(true);

    // Determine who plays (based on whose turn it is in the puzzle FEN)
    const playerColor = game.turn() === 'w' ? 'white' : 'black';

    // Load puzzle data
    useEffect(() => {
        const handlePuzzleData = (data: PuzzleData) => {
            setPuzzle(data);
            const newGame = new Chess(data.fen);
            setGame(newGame);
            setMoveIndex(0);
            setStatus('playing');
            setMessage(language === 'en'
                ? `Find the best move for ${newGame.turn() === 'w' ? 'White' : 'Black'}`
                : `Finn det beste trekket for ${newGame.turn() === 'w' ? 'Hvit' : 'Svart'}`);
            setHint(null);
            setSolvedKrog(null);
            setLoading(false);
        };

        const handleMoveResult = (result: PuzzleMoveResult) => {
            if (result.correct) {
                if (result.completed) {
                    setStatus('solved');
                    setMessage(language === 'en' ? 'Puzzle solved!' : 'Oppgave løst!');
                    if (result.krog) {
                        setSolvedKrog(result.krog);
                    }
                } else {
                    setStatus('correct');
                    setMessage(language === 'en' ? 'Correct! Keep going...' : 'Riktig! Fortsett...');
                    // Move to next move
                    setMoveIndex(prev => prev + 1);
                    // Reset status after brief delay
                    setTimeout(() => setStatus('playing'), 500);
                }
            } else {
                setStatus('incorrect');
                setMessage(result.message);
                if (result.hint) {
                    setHint(result.hint);
                }
                // Undo the incorrect move
                game.undo();
                setGame(new Chess(game.fen()));
            }
        };

        socket.on('puzzle_data', handlePuzzleData);
        socket.on('puzzle_move_result', handleMoveResult);

        // Request first puzzle
        socket.emit('get_puzzle', { random: true });

        return () => {
            socket.off('puzzle_data', handlePuzzleData);
            socket.off('puzzle_move_result', handleMoveResult);
        };
    }, [socket, language]);

    // Handle player move
    const handleMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
        if (!puzzle || status === 'solved') return;

        // Try to make the move
        const gameCopy = new Chess(game.fen());
        try {
            const result = gameCopy.move({
                from: move.from as Square,
                to: move.to as Square,
                promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined
            });

            if (result) {
                // Update local game state
                setGame(gameCopy);
                setHint(null);

                // Check with server
                socket.emit('check_puzzle_move', {
                    puzzleId: puzzle.id,
                    moveIndex,
                    move: result.san
                });
            }
        } catch {
            // Invalid move
        }
    }, [puzzle, game, moveIndex, status, socket]);

    // Navigation
    const nextPuzzle = () => {
        if (!puzzle) return;
        setLoading(true);
        socket.emit('get_adjacent_puzzle', { currentId: puzzle.id, direction: 'next' });
    };

    const prevPuzzle = () => {
        if (!puzzle) return;
        setLoading(true);
        socket.emit('get_adjacent_puzzle', { currentId: puzzle.id, direction: 'prev' });
    };

    const randomPuzzle = () => {
        setLoading(true);
        socket.emit('get_puzzle', { random: true });
    };

    const retryPuzzle = () => {
        if (!puzzle) return;
        const newGame = new Chess(puzzle.fen);
        setGame(newGame);
        setMoveIndex(0);
        setStatus('playing');
        setMessage(language === 'en'
            ? `Find the best move for ${newGame.turn() === 'w' ? 'White' : 'Black'}`
            : `Finn det beste trekket for ${newGame.turn() === 'w' ? 'Hvit' : 'Svart'}`);
        setHint(null);
        setSolvedKrog(null);
    };

    if (loading) {
        return (
            <div className="app-container">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h2>{language === 'en' ? 'Loading puzzle...' : 'Laster oppgave...'}</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Header */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>
                    {language === 'en' ? 'Puzzle Mode' : 'Oppgavemodus'}
                </h1>
                {puzzle && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '15px',
                        marginTop: '10px',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{
                            background: 'var(--bg-secondary)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                        }}>
                            #{puzzle.currentIndex + 1} / {puzzle.totalPuzzles}
                        </span>
                        <span style={{
                            background: '#4a90d9',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}>
                            {language === 'en' ? 'Rating' : 'Vurdering'}: {puzzle.rating}
                        </span>
                        {puzzle.themes.slice(0, 2).map(theme => (
                            <span key={theme} style={{
                                background: '#9b59b6',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '0.85rem'
                            }}>
                                {theme.replace(/_/g, ' ')}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Board */}
            <div style={{
                background: 'var(--bg-secondary)',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                <ChessBoard
                    game={game}
                    onMove={handleMove}
                    orientation={playerColor}
                    language={language}
                />
            </div>

            {/* Status message */}
            <div style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center',
                background: status === 'solved' ? 'rgba(129, 182, 76, 0.2)' :
                           status === 'correct' ? 'rgba(129, 182, 76, 0.15)' :
                           status === 'incorrect' ? 'rgba(231, 76, 60, 0.2)' :
                           'var(--bg-secondary)',
                border: status === 'solved' ? '2px solid #81b64c' :
                       status === 'correct' ? '1px solid #81b64c' :
                       status === 'incorrect' ? '2px solid #e74c3c' :
                       '1px solid #333'
            }}>
                <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: status === 'solved' || status === 'correct' ? '#81b64c' :
                          status === 'incorrect' ? '#e74c3c' : 'white'
                }}>
                    {message}
                </div>
                {hint && (
                    <div style={{ color: '#888', marginTop: '8px', fontSize: '0.9rem' }}>
                        {hint}
                    </div>
                )}
            </div>

            {/* KROG Explanation (on solve) */}
            {solvedKrog && (
                <div style={{
                    marginTop: '20px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '2px solid #81b64c'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '10px', color: '#81b64c' }}>
                        KROG {language === 'en' ? 'Explanation' : 'Forklaring'}
                    </div>
                    <div style={{
                        fontFamily: 'monospace',
                        fontSize: '0.95rem',
                        color: '#81b64c',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        marginBottom: '10px'
                    }}>
                        {solvedKrog.formula}
                    </div>
                    <div style={{ color: '#ccc' }}>
                        {solvedKrog.explanation[language]}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{
                marginTop: '20px',
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={prevPuzzle}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid #444',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '1rem'
                    }}
                >
                    ← {language === 'en' ? 'Previous' : 'Forrige'}
                </button>

                {status === 'incorrect' || status === 'solved' ? (
                    <button
                        onClick={retryPuzzle}
                        style={{
                            background: '#f39c12',
                            border: 'none',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '1rem',
                            fontWeight: 600
                        }}
                    >
                        {language === 'en' ? 'Retry' : 'Prøv igjen'}
                    </button>
                ) : null}

                <button
                    onClick={randomPuzzle}
                    style={{
                        background: '#9b59b6',
                        border: 'none',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        fontWeight: 600
                    }}
                >
                    {language === 'en' ? 'Random' : 'Tilfeldig'}
                </button>

                <button
                    onClick={nextPuzzle}
                    style={{
                        background: status === 'solved' ? '#81b64c' : 'var(--bg-secondary)',
                        border: status === 'solved' ? 'none' : '1px solid #444',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        fontWeight: status === 'solved' ? 600 : 400
                    }}
                >
                    {language === 'en' ? 'Next' : 'Neste'} →
                </button>
            </div>

            {/* Exit button */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                    onClick={onExit}
                    style={{
                        background: '#e74c3c',
                        border: 'none',
                        color: 'white',
                        padding: '10px 30px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '1rem'
                    }}
                >
                    {language === 'en' ? 'Exit Puzzles' : 'Avslutt oppgaver'}
                </button>
            </div>
        </div>
    );
};

export default PuzzleMode;
