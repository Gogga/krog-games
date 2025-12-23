import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { Socket } from 'socket.io-client';
import ChessBoard from './ChessBoard';

interface KROGExplanation {
    formula: string;
    explanation: {
        en: string;
        no: string;
    };
    rtype?: string;
    fide?: {
        norwegian: { section: string; text: string };
        english: { section: string; text: string };
    };
}

interface PuzzleData {
    id: string;
    fen: string;
    themes: string[];
    level: number;
    rating: number;
    solutionLength: number;
    krog?: KROGExplanation;
}

interface DailyPuzzleData {
    puzzleNumber: number;
    date: string;
    puzzle: PuzzleData;
    alreadyCompleted: boolean;
    completion: {
        completedAt: string;
        timeSpentMs: number | null;
        attempts: number;
    } | null;
    streak: {
        current: number;
        longest: number;
        total: number;
    };
}

interface MoveResult {
    correct: boolean;
    completed: boolean;
    message: string;
    hint?: string;
    krog?: KROGExplanation;
}

interface CompletionResult {
    success: boolean;
    streak: {
        current: number;
        longest: number;
        total: number;
    };
    alreadyCompleted?: boolean;
    isGuest?: boolean;
}

interface DailyPuzzleProps {
    socket: Socket;
    language: 'en' | 'no';
    user: { id: string; username: string } | null;
    onExit: () => void;
}

// FIDE rule mappings for common puzzle tactics
const FIDE_RULES: Record<string, { norwegian: { section: string; text: string }; english: { section: string; text: string } }> = {
    'checkmate': {
        norwegian: { section: '§5.1.1', text: 'Partiet vinnes av spilleren som har satt motstanderens konge matt.' },
        english: { section: '5.1.1', text: 'The game is won by the player who has checkmated his opponent\'s king.' }
    },
    'check': {
        norwegian: { section: '§3.9', text: 'Kongen er i sjakk hvis den står på et felt angrepet av en fiendtlig brikke.' },
        english: { section: '3.9', text: 'The king is in check if it is on a square attacked by an opponent\'s piece.' }
    },
    'pin': {
        norwegian: { section: '§3.1', text: 'En binding oppstår når en brikke ikke kan flyttes uten å eksponere kongen for sjakk.' },
        english: { section: '3.1', text: 'A pin occurs when a piece cannot move without exposing the king to check.' }
    },
    'fork': {
        norwegian: { section: '§3.6', text: 'En gaffel er et angrep på to eller flere brikker samtidig.' },
        english: { section: '3.6', text: 'A fork is an attack on two or more pieces at the same time.' }
    },
    'default': {
        norwegian: { section: '§1.1', text: 'Sjakk spilles mellom to motstandere som flytter brikker på et sjakkbrett.' },
        english: { section: '1.1', text: 'Chess is played between two opponents who move pieces on a chessboard.' }
    }
};

function getFIDERule(themes: string[]): { norwegian: { section: string; text: string }; english: { section: string; text: string } } {
    if (themes.some(t => t.includes('mate'))) return FIDE_RULES['checkmate'];
    if (themes.some(t => t.includes('pin'))) return FIDE_RULES['pin'];
    if (themes.some(t => t.includes('fork'))) return FIDE_RULES['fork'];
    if (themes.some(t => t.includes('check'))) return FIDE_RULES['check'];
    return FIDE_RULES['default'];
}

function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
}

function getTimeUntilMidnightUTC(): { hours: number; minutes: number; seconds: number } {
    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const diff = midnight.getTime() - now.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
}

const DailyPuzzle: React.FC<DailyPuzzleProps> = ({ socket, language, user: _user, onExit }) => {
    const [dailyData, setDailyData] = useState<DailyPuzzleData | null>(null);
    const [game, setGame] = useState<Chess>(new Chess());
    const [moveIndex, setMoveIndex] = useState(0);
    const [status, setStatus] = useState<'loading' | 'playing' | 'correct' | 'incorrect' | 'solved' | 'already_completed'>('loading');
    const [message, setMessage] = useState('');
    const [hint, setHint] = useState<string | null>(null);
    const [solvedKrog, setSolvedKrog] = useState<KROGExplanation | null>(null);
    const [attempts, setAttempts] = useState(1);
    const [startTime] = useState(Date.now());
    const [streak, setStreak] = useState({ current: 0, longest: 0, total: 0 });
    const [countdown, setCountdown] = useState(getTimeUntilMidnightUTC());
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const [moveHistory, setMoveHistory] = useState<{ correct: boolean }[]>([]);

    const gameRef = useRef<Chess>(game);
    gameRef.current = game;

    const playerColor = game.turn() === 'w' ? 'white' : 'black';

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(getTimeUntilMidnightUTC());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Load daily puzzle
    useEffect(() => {
        const handleDailyPuzzleData = (data: DailyPuzzleData) => {
            setDailyData(data);
            setStreak(data.streak);

            if (data.alreadyCompleted && data.completion) {
                // Show completed state
                const newGame = new Chess(data.puzzle.fen);
                setGame(newGame);
                setStatus('already_completed');
                setSolvedKrog(data.puzzle.krog || null);
                setMessage(language === 'en' ? 'Already completed today!' : 'Allerede fullfort i dag!');
            } else {
                // Fresh puzzle
                const newGame = new Chess(data.puzzle.fen);
                setGame(newGame);
                setMoveIndex(0);
                setStatus('playing');
                setMessage(language === 'en'
                    ? `Find the best move for ${newGame.turn() === 'w' ? 'White' : 'Black'}`
                    : `Finn det beste trekket for ${newGame.turn() === 'w' ? 'Hvit' : 'Svart'}`);
                setHint(null);
                setSolvedKrog(null);
                setAttempts(1);
                setMoveHistory([]);
            }
        };

        const handleMoveResult = (result: MoveResult) => {
            setMoveHistory(prev => [...prev, { correct: result.correct }]);

            if (result.correct) {
                if (result.completed) {
                    setStatus('solved');
                    setMessage(language === 'en' ? 'Puzzle solved!' : 'Oppgave lost!');
                    if (result.krog) {
                        setSolvedKrog(result.krog);
                    } else if (dailyData?.puzzle.krog) {
                        setSolvedKrog(dailyData.puzzle.krog);
                    }

                    // Record completion
                    const timeSpentMs = Date.now() - startTime;
                    socket.emit('complete_daily_puzzle', { timeSpentMs, attempts });
                } else {
                    setStatus('correct');
                    setMessage(language === 'en' ? 'Correct! Keep going...' : 'Riktig! Fortsett...');
                    setMoveIndex(prev => prev + 1);
                    setTimeout(() => setStatus('playing'), 500);
                }
            } else {
                setStatus('incorrect');
                setMessage(result.message);
                if (result.hint) {
                    setHint(result.hint);
                }
                setAttempts(prev => prev + 1);

                // Undo incorrect move
                const currentGame = gameRef.current;
                currentGame.undo();
                setGame(new Chess(currentGame.fen()));
            }
        };

        const handleCompletion = (result: CompletionResult) => {
            if (result.success) {
                setStreak(result.streak);
            }
        };

        socket.on('daily_puzzle_data', handleDailyPuzzleData);
        socket.on('daily_puzzle_move_result', handleMoveResult);
        socket.on('daily_puzzle_completed', handleCompletion);

        // Request today's puzzle
        socket.emit('get_daily_puzzle');

        return () => {
            socket.off('daily_puzzle_data', handleDailyPuzzleData);
            socket.off('daily_puzzle_move_result', handleMoveResult);
            socket.off('daily_puzzle_completed', handleCompletion);
        };
    }, [socket, language, startTime, attempts, dailyData?.puzzle.krog]);

    // Handle move
    const handleMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
        if (!dailyData || status === 'solved' || status === 'already_completed') return;

        const gameCopy = new Chess(game.fen());
        try {
            const result = gameCopy.move({
                from: move.from as Square,
                to: move.to as Square,
                promotion: move.promotion as 'q' | 'r' | 'b' | 'n' | undefined
            });

            if (result) {
                setGame(gameCopy);
                setHint(null);

                socket.emit('check_daily_puzzle_move', {
                    moveIndex,
                    move: result.san,
                    attempts
                });
            }
        } catch {
            // Invalid move
        }
    }, [dailyData, game, moveIndex, status, socket, attempts]);

    // Share functionality
    const handleShare = () => {
        if (!dailyData) return;

        const moveEmojis = moveHistory.map(m => m.correct ? '🟩' : '⬛').join('');
        const timeSpentMs = Date.now() - startTime;
        const timeStr = formatTime(timeSpentMs);
        const streakStr = streak.current > 0 ? ` | 🔥 ${streak.current}` : '';

        const shareText = `KROG Daily Puzzle #${dailyData.puzzleNumber}
${moveEmojis || '🟩'}
⏱️ ${timeStr}${streakStr}
${language === 'en' ? 'Play at' : 'Spill pa'}: krogchess.com`;

        navigator.clipboard.writeText(shareText).then(() => {
            setShareMessage(language === 'en' ? 'Copied to clipboard!' : 'Kopiert til utklippstavlen!');
            setTimeout(() => setShareMessage(null), 2000);
        });
    };

    // Retry puzzle
    const retryPuzzle = () => {
        if (!dailyData) return;
        const newGame = new Chess(dailyData.puzzle.fen);
        setGame(newGame);
        setMoveIndex(0);
        setStatus('playing');
        setMessage(language === 'en'
            ? `Find the best move for ${newGame.turn() === 'w' ? 'White' : 'Black'}`
            : `Finn det beste trekket for ${newGame.turn() === 'w' ? 'Hvit' : 'Svart'}`);
        setHint(null);
        setMoveHistory([]);
    };

    if (status === 'loading' || !dailyData) {
        return (
            <div className="app-container">
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h2>{language === 'en' ? 'Loading daily puzzle...' : 'Laster daglig oppgave...'}</h2>
                </div>
            </div>
        );
    }

    const fideRule = getFIDERule(dailyData.puzzle.themes);

    return (
        <div className="app-container">
            {/* Header */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>
                    {language === 'en' ? 'Daily Puzzle' : 'Daglig Oppgave'}
                </h1>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    marginTop: '10px',
                    flexWrap: 'wrap'
                }}>
                    <span style={{
                        background: '#4a90d9',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}>
                        #{dailyData.puzzleNumber}
                    </span>
                    <span style={{
                        background: 'var(--bg-secondary)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                    }}>
                        {new Date(dailyData.date).toLocaleDateString(language === 'en' ? 'en-US' : 'nb-NO', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                    {streak.current > 0 && (
                        <span style={{
                            background: '#f39c12',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            fontWeight: 600
                        }}>
                            🔥 {streak.current} {language === 'en' ? 'day streak' : 'dagers rekke'}
                        </span>
                    )}
                </div>
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
                background: status === 'solved' || status === 'already_completed' ? 'rgba(129, 182, 76, 0.2)' :
                           status === 'correct' ? 'rgba(129, 182, 76, 0.15)' :
                           status === 'incorrect' ? 'rgba(231, 76, 60, 0.2)' :
                           'var(--bg-secondary)',
                border: status === 'solved' || status === 'already_completed' ? '2px solid #81b64c' :
                       status === 'correct' ? '1px solid #81b64c' :
                       status === 'incorrect' ? '2px solid #e74c3c' :
                       '1px solid #333'
            }}>
                <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: status === 'solved' || status === 'correct' || status === 'already_completed' ? '#81b64c' :
                          status === 'incorrect' ? '#e74c3c' : 'white'
                }}>
                    {message}
                </div>
                {hint && (
                    <div style={{ color: '#888', marginTop: '8px', fontSize: '0.9rem' }}>
                        {hint}
                    </div>
                )}
                {(status === 'solved' || status === 'already_completed') && dailyData.completion && (
                    <div style={{ color: '#888', marginTop: '8px', fontSize: '0.9rem' }}>
                        ⏱️ {formatTime(dailyData.completion.timeSpentMs || 0)} |
                        {dailyData.completion.attempts} {language === 'en' ? 'attempts' : 'forsok'}
                    </div>
                )}
            </div>

            {/* KROG Explanation Panel */}
            {(status === 'solved' || status === 'already_completed') && (
                <div style={{
                    marginTop: '20px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #81b64c'
                }}>
                    {/* KROG Formula */}
                    {solvedKrog && (
                        <div style={{ padding: '16px', borderBottom: '1px solid #333' }}>
                            <div style={{ fontWeight: 600, marginBottom: '10px', color: '#81b64c' }}>
                                KROG Formula
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

                    {/* R-Type */}
                    {solvedKrog?.rtype && (
                        <div style={{ padding: '16px', borderBottom: '1px solid #333' }}>
                            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#9b59b6' }}>
                                {language === 'en' ? 'Rule Type' : 'Regeltype'}: {solvedKrog.rtype.replace('_', ' ')}
                            </div>
                        </div>
                    )}

                    {/* FIDE Rules */}
                    <div style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '10px', color: '#4a90d9' }}>
                            FIDE {language === 'en' ? 'Rules' : 'Regler'}
                        </div>
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🇳🇴</span>
                                <span style={{ fontWeight: 600, color: '#4a90d9' }}>{fideRule.norwegian.section}</span>
                            </div>
                            <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                                {fideRule.norwegian.text}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '8px',
                            padding: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🇬🇧</span>
                                <span style={{ fontWeight: 600, color: '#4a90d9' }}>{fideRule.english.section}</span>
                            </div>
                            <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                                {fideRule.english.text}
                            </div>
                        </div>
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
                {status === 'incorrect' && (
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
                        {language === 'en' ? 'Retry' : 'Prov igjen'}
                    </button>
                )}

                {(status === 'solved' || status === 'already_completed') && (
                    <button
                        onClick={handleShare}
                        style={{
                            background: '#81b64c',
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
                        {shareMessage || (language === 'en' ? 'Share Result' : 'Del resultat')}
                    </button>
                )}
            </div>

            {/* Countdown to next puzzle */}
            {(status === 'solved' || status === 'already_completed') && (
                <div style={{
                    marginTop: '20px',
                    textAlign: 'center',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px'
                }}>
                    <div style={{ color: '#888', marginBottom: '8px' }}>
                        {language === 'en' ? 'Next puzzle in' : 'Neste oppgave om'}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'monospace' }}>
                        {countdown.hours.toString().padStart(2, '0')}:
                        {countdown.minutes.toString().padStart(2, '0')}:
                        {countdown.seconds.toString().padStart(2, '0')}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
            }}>
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>🔥 {streak.current}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>
                        {language === 'en' ? 'Current Streak' : 'Navaerende rekke'}
                    </div>
                </div>
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>🏆 {streak.longest}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>
                        {language === 'en' ? 'Best Streak' : 'Beste rekke'}
                    </div>
                </div>
                <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>✅ {streak.total}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>
                        {language === 'en' ? 'Total Solved' : 'Totalt lost'}
                    </div>
                </div>
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
                    {language === 'en' ? 'Exit' : 'Avslutt'}
                </button>
            </div>
        </div>
    );
};

export default DailyPuzzle;
