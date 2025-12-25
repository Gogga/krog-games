import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Socket } from 'socket.io-client';
import ChessBoard from './ChessBoard';

// Hook to detect mobile viewport
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
};

interface OpeningVariationLine {
    name: string;
    moves: string;
    evaluation: string;
    warning?: string;
    idea?: string;
    krog?: string;
}

interface OpeningVariation {
    id: string;
    name: { en: string; no: string };
    moves: string;
    eco: string;
    level: number;
    idea: string;
    krog?: string;
    lines?: OpeningVariationLine[];
}

interface OpeningSummary {
    id: string;
    name: { en: string; no: string };
    eco: string;
    moves: string;
    level: number;
    popularity: number;
    description: { en: string; no: string };
    statistics?: {
        whiteWins: number;
        draws: number;
        blackWins: number;
        avgMoves: number;
    };
    variationCount: number;
}

interface OpeningFull extends OpeningSummary {
    keyIdeas?: {
        white: string[];
        black: string[];
    };
    krog?: {
        mainTheme: string;
        strategicFormula: string;
        tacticalPatterns?: string[];
    };
    variations?: OpeningVariation[];
}

interface OpeningExplorerProps {
    socket: Socket;
    language: 'en' | 'no';
    onExit: () => void;
}

const OpeningExplorer: React.FC<OpeningExplorerProps> = ({ socket, language, onExit }) => {
    const isMobile = useIsMobile();
    const [openings, setOpenings] = useState<OpeningSummary[]>([]);
    const [selectedOpening, setSelectedOpening] = useState<OpeningFull | null>(null);
    const [expandedOpenings, setExpandedOpenings] = useState<Set<string>>(new Set());
    const [expandedVariations, setExpandedVariations] = useState<Set<string>>(new Set());
    const [game, setGame] = useState<Chess>(new Chess());
    const [loading, setLoading] = useState(true);

    // Load openings list
    useEffect(() => {
        const handleOpeningsList = ({ openings: list }: { openings: OpeningSummary[] }) => {
            setOpenings(list);
            setLoading(false);
        };

        const handleOpeningData = (data: OpeningFull) => {
            setSelectedOpening(data);
            // Set up the board with the opening position
            const newGame = new Chess();
            const moves = data.moves.split(/\d+\.\s*/).filter(Boolean).join(' ').split(' ').filter(Boolean);
            moves.forEach(move => {
                try {
                    newGame.move(move);
                } catch {
                    // Invalid move, stop
                }
            });
            setGame(newGame);
        };

        socket.on('openings_list', handleOpeningsList);
        socket.on('opening_data', handleOpeningData);

        // Request openings
        socket.emit('get_openings');

        return () => {
            socket.off('openings_list', handleOpeningsList);
            socket.off('opening_data', handleOpeningData);
        };
    }, [socket]);

    const toggleOpening = (id: string) => {
        const newExpanded = new Set(expandedOpenings);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
            // Load full opening data
            socket.emit('get_opening', { id });
        }
        setExpandedOpenings(newExpanded);
    };

    const toggleVariation = (id: string) => {
        const newExpanded = new Set(expandedVariations);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedVariations(newExpanded);
    };

    const playMoves = (moves: string, baseMoves?: string) => {
        const newGame = new Chess();
        const fullMoves = baseMoves ? `${baseMoves} ${moves}` : moves;
        const moveList = fullMoves.split(/\d+\.\s*/).filter(Boolean).join(' ').split(' ').filter(Boolean);
        moveList.forEach(move => {
            try {
                newGame.move(move);
            } catch {
                // Invalid move
            }
        });
        setGame(newGame);
    };

    const getLevelBadge = (level: number) => {
        const colors: Record<number, string> = {
            1: '#81b64c', // Beginner - green
            2: '#4a90d9', // Intermediate - blue
            3: '#9b59b6', // Advanced - purple
            4: '#e74c3c'  // Expert - red
        };
        const labels: Record<number, { en: string; no: string }> = {
            1: { en: 'Beginner', no: 'Nybegynner' },
            2: { en: 'Intermediate', no: 'Middels' },
            3: { en: 'Advanced', no: 'Avansert' },
            4: { en: 'Expert', no: 'Ekspert' }
        };
        return (
            <span style={{
                background: colors[level] || '#666',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600
            }}>
                {labels[level]?.[language] || `L${level}`}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="app-container">
                <div style={{ textAlign: 'center', padding: isMobile ? '24px 16px' : '40px' }}>
                    <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }}>
                        {language === 'en' ? 'Loading openings...' : 'Laster åpninger...'}
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container" style={{ padding: isMobile ? '12px' : undefined }}>
            {/* Header */}
            <div style={{ marginBottom: isMobile ? '12px' : '20px', textAlign: 'center' }}>
                <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: 700 }}>
                    {language === 'en' ? 'Opening Explorer' : 'Åpningsutforsker'}
                </h1>
                <p style={{ color: '#888', marginTop: isMobile ? '6px' : '10px', fontSize: isMobile ? '0.85rem' : '1rem' }}>
                    {language === 'en'
                        ? `${openings.length} openings`
                        : `${openings.length} åpninger`}
                </p>
            </div>

            <div style={{
                display: 'flex',
                gap: isMobile ? '12px' : '20px',
                flexWrap: 'wrap',
                flexDirection: isMobile ? 'column-reverse' : 'row'
            }}>
                {/* Tree View Panel */}
                <div style={{
                    flex: '1 1 350px',
                    background: 'var(--bg-secondary)',
                    borderRadius: isMobile ? '8px' : '12px',
                    padding: isMobile ? '12px' : '16px',
                    maxHeight: isMobile ? '350px' : '600px',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    <h3 style={{ margin: isMobile ? '0 0 10px 0' : '0 0 16px 0', color: '#888', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                        {language === 'en' ? 'Openings' : 'Åpninger'}
                    </h3>

                    {openings.map(opening => (
                        <div key={opening.id} style={{ marginBottom: isMobile ? '6px' : '8px' }}>
                            {/* Opening header */}
                            <div
                                onClick={() => toggleOpening(opening.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isMobile ? '8px' : '10px',
                                    padding: isMobile ? '10px' : '10px 12px',
                                    background: selectedOpening?.id === opening.id
                                        ? 'rgba(129, 182, 76, 0.2)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: selectedOpening?.id === opening.id
                                        ? '1px solid #81b64c'
                                        : '1px solid transparent',
                                    borderRadius: isMobile ? '6px' : '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    minHeight: isMobile ? '44px' : 'auto'
                                }}
                            >
                                <span style={{
                                    transform: expandedOpenings.has(opening.id) ? 'rotate(90deg)' : 'rotate(0)',
                                    transition: 'transform 0.2s',
                                    color: '#888',
                                    fontSize: isMobile ? '0.8rem' : '1rem'
                                }}>
                                    ▶
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 600,
                                        color: 'white',
                                        fontSize: isMobile ? '0.85rem' : '1rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {opening.name[language]}
                                    </div>
                                    <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: '#888' }}>
                                        {opening.eco} {isMobile ? '' : `• ${opening.moves}`}
                                    </div>
                                </div>
                                {getLevelBadge(opening.level)}
                            </div>

                            {/* Expanded opening with variations */}
                            {expandedOpenings.has(opening.id) && selectedOpening?.id === opening.id && (
                                <div style={{ marginLeft: isMobile ? '12px' : '20px', marginTop: isMobile ? '6px' : '8px' }}>
                                    {/* Description */}
                                    <div style={{
                                        padding: isMobile ? '8px' : '10px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '6px',
                                        marginBottom: isMobile ? '6px' : '8px',
                                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                                        color: '#ccc',
                                        lineHeight: 1.4
                                    }}>
                                        {selectedOpening.description[language]}
                                    </div>

                                    {/* Statistics */}
                                    {selectedOpening.statistics && (
                                        <div style={{
                                            display: 'flex',
                                            gap: isMobile ? '6px' : '8px',
                                            marginBottom: isMobile ? '8px' : '10px',
                                            fontSize: isMobile ? '0.7rem' : '0.8rem'
                                        }}>
                                            <span style={{ color: '#81b64c' }}>
                                                W: {selectedOpening.statistics.whiteWins}%
                                            </span>
                                            <span style={{ color: '#888' }}>
                                                D: {selectedOpening.statistics.draws}%
                                            </span>
                                            <span style={{ color: '#e74c3c' }}>
                                                B: {selectedOpening.statistics.blackWins}%
                                            </span>
                                        </div>
                                    )}

                                    {/* Variations */}
                                    {selectedOpening.variations?.map(variation => (
                                        <div key={variation.id} style={{ marginBottom: isMobile ? '4px' : '6px' }}>
                                            <div
                                                onClick={() => {
                                                    toggleVariation(variation.id);
                                                    playMoves(variation.moves, selectedOpening.moves);
                                                }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: isMobile ? '6px' : '8px',
                                                    padding: isMobile ? '8px' : '8px 10px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                                                    minHeight: isMobile ? '40px' : 'auto'
                                                }}
                                            >
                                                <span style={{
                                                    transform: expandedVariations.has(variation.id) ? 'rotate(90deg)' : 'rotate(0)',
                                                    transition: 'transform 0.2s',
                                                    color: '#666',
                                                    fontSize: isMobile ? '0.7rem' : '0.8rem'
                                                }}>
                                                    ▶
                                                </span>
                                                <span style={{
                                                    color: '#4a90d9',
                                                    fontWeight: 500,
                                                    flex: isMobile ? 1 : 'none',
                                                    whiteSpace: isMobile ? 'nowrap' : 'normal',
                                                    overflow: isMobile ? 'hidden' : 'visible',
                                                    textOverflow: isMobile ? 'ellipsis' : 'clip'
                                                }}>
                                                    {variation.name[language]}
                                                </span>
                                                {!isMobile && (
                                                    <span style={{ color: '#666', fontSize: '0.8rem' }}>
                                                        {variation.moves}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Variation lines */}
                                            {expandedVariations.has(variation.id) && variation.lines && (
                                                <div style={{ marginLeft: isMobile ? '16px' : '24px', marginTop: isMobile ? '4px' : '6px' }}>
                                                    {variation.lines.map((line, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => playMoves(
                                                                `${variation.moves} ${line.moves}`,
                                                                selectedOpening.moves
                                                            )}
                                                            style={{
                                                                padding: isMobile ? '6px 8px' : '6px 10px',
                                                                background: 'rgba(0,0,0,0.2)',
                                                                borderRadius: '4px',
                                                                marginBottom: isMobile ? '3px' : '4px',
                                                                cursor: 'pointer',
                                                                fontSize: isMobile ? '0.75rem' : '0.85rem'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px' }}>
                                                                <span style={{ color: '#9b59b6' }}>{line.name}</span>
                                                                <span style={{
                                                                    background: line.evaluation === '=' ? '#666'
                                                                        : line.evaluation.includes('+') ? '#81b64c'
                                                                        : '#e74c3c',
                                                                    color: 'white',
                                                                    padding: '1px 6px',
                                                                    borderRadius: '3px',
                                                                    fontSize: isMobile ? '0.6rem' : '0.7rem'
                                                                }}>
                                                                    {line.evaluation}
                                                                </span>
                                                            </div>
                                                            {!isMobile && (
                                                                <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '2px' }}>
                                                                    {line.moves}
                                                                </div>
                                                            )}
                                                            {line.warning && (
                                                                <div style={{ color: '#f39c12', fontSize: isMobile ? '0.65rem' : '0.75rem', marginTop: isMobile ? '3px' : '4px' }}>
                                                                    ⚠️ {line.warning}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* KROG Analysis */}
                                    {selectedOpening.krog && (
                                        <div style={{
                                            marginTop: isMobile ? '8px' : '10px',
                                            padding: isMobile ? '8px' : '10px',
                                            background: 'rgba(129, 182, 76, 0.1)',
                                            border: '1px solid #81b64c',
                                            borderRadius: '6px'
                                        }}>
                                            <div style={{ color: '#81b64c', fontWeight: 600, marginBottom: isMobile ? '4px' : '6px', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                                                KROG
                                            </div>
                                            <div style={{
                                                fontFamily: 'monospace',
                                                fontSize: isMobile ? '0.7rem' : '0.8rem',
                                                color: '#81b64c',
                                                marginBottom: '4px',
                                                overflowX: 'auto',
                                                WebkitOverflowScrolling: 'touch'
                                            }}>
                                                {selectedOpening.krog.mainTheme}
                                            </div>
                                            {!isMobile && (
                                                <div style={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.75rem',
                                                    color: '#888'
                                                }}>
                                                    {selectedOpening.krog.strategicFormula}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Board and Details Panel */}
                <div style={{ flex: '1 1 400px' }}>
                    {/* Board */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: isMobile ? '8px' : '20px',
                        borderRadius: isMobile ? '8px' : '12px',
                        marginBottom: isMobile ? '12px' : '20px'
                    }}>
                        <ChessBoard
                            game={game}
                            onMove={() => {}}
                            orientation="white"
                            language={language}
                        />
                    </div>

                    {/* Current Position Info */}
                    {selectedOpening && (
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: isMobile ? '12px' : '16px',
                            borderRadius: isMobile ? '8px' : '12px'
                        }}>
                            <h3 style={{ margin: isMobile ? '0 0 8px 0' : '0 0 12px 0', color: '#81b64c', fontSize: isMobile ? '1rem' : '1.17rem' }}>
                                {selectedOpening.name[language]}
                            </h3>
                            <div style={{
                                fontFamily: 'monospace',
                                background: 'rgba(0,0,0,0.3)',
                                padding: isMobile ? '8px' : '10px',
                                borderRadius: '6px',
                                marginBottom: isMobile ? '10px' : '12px',
                                fontSize: isMobile ? '0.8rem' : '0.9rem',
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch'
                            }}>
                                {selectedOpening.moves}
                            </div>

                            {/* Key Ideas */}
                            {selectedOpening.keyIdeas && (
                                <div style={{ display: 'flex', gap: isMobile ? '10px' : '16px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 150px' }}>
                                        <div style={{ color: '#81b64c', fontWeight: 600, marginBottom: isMobile ? '4px' : '6px', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                                            {language === 'en' ? 'White Ideas' : 'Hvite ideer'}
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: isMobile ? '14px' : '18px', color: '#ccc', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                                            {selectedOpening.keyIdeas.white.slice(0, isMobile ? 2 : 3).map((idea, i) => (
                                                <li key={i} style={{ marginBottom: isMobile ? '2px' : '4px' }}>{idea}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div style={{ flex: '1 1 150px' }}>
                                        <div style={{ color: '#e74c3c', fontWeight: 600, marginBottom: isMobile ? '4px' : '6px', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
                                            {language === 'en' ? 'Black Ideas' : 'Svarte ideer'}
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: isMobile ? '14px' : '18px', color: '#ccc', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                                            {selectedOpening.keyIdeas.black.slice(0, isMobile ? 2 : 3).map((idea, i) => (
                                                <li key={i} style={{ marginBottom: isMobile ? '2px' : '4px' }}>{idea}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Exit button */}
            <div style={{ marginTop: isMobile ? '16px' : '20px', textAlign: 'center' }}>
                <button
                    onClick={onExit}
                    style={{
                        background: '#e74c3c',
                        border: 'none',
                        color: 'white',
                        padding: isMobile ? '12px 24px' : '10px 30px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        minHeight: '44px'
                    }}
                >
                    {language === 'en' ? 'Exit Explorer' : 'Avslutt utforsker'}
                </button>
            </div>
        </div>
    );
};

export default OpeningExplorer;
