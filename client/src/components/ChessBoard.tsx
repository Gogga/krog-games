import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { Socket } from 'socket.io-client';
import { useResponsiveBoard } from '../hooks/useMediaQuery';

interface PotentialMoveExplanation {
    from: string;
    to: string;
    isLegal: boolean;
    move?: string;
    reason?: string;
    krog: {
        formula: string;
        operator?: string;
        tType?: string;
        violation?: string;
        rType?: string;
        rTypeDescription?: {
            en: string;
            no: string;
        };
    };
    fide: {
        article: string;
        en: string;
        no: string;
    };
    explanation: {
        en: string;
        no: string;
    };
    conditions?: {
        name: string;
        met: boolean;
        description: string;
    }[];
}

export interface BoardTheme {
    name: string;
    light: string;
    dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
    { name: 'Classic', light: '#f0d9b5', dark: '#b58863' },
    { name: 'Green', light: '#ffffdd', dark: '#86a666' },
    { name: 'Blue', light: '#dee3e6', dark: '#8ca2ad' },
    { name: 'Purple', light: '#e8dff0', dark: '#9b7bb8' },
    { name: 'Gray', light: '#e0e0e0', dark: '#888888' },
    { name: 'Wood', light: '#e6c889', dark: '#a37e45' },
    { name: 'Ice', light: '#e0f0ff', dark: '#5fa8d3' },
    { name: 'Tournament', light: '#f5f5dc', dark: '#228b22' },
];

export interface PieceTheme {
    name: string;
    pieces: Record<string, Record<string, string>>;
}

export const PIECE_THEMES: PieceTheme[] = [
    {
        name: 'Classic',
        pieces: {
            w: {
                p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
                r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
                n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
                b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
                q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
                k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
            },
            b: {
                p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
                r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
                n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
                b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
                q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
                k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
            },
        },
    },
    {
        name: 'Neo',
        pieces: {
            w: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png',
            },
            b: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png',
            },
        },
    },
    {
        name: 'Alpha',
        pieces: {
            w: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wr.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/wk.png',
            },
            b: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/br.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/alpha/150/bk.png',
            },
        },
    },
    {
        name: 'Wood',
        pieces: {
            w: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/wp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/wr.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/wn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/wb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/wq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/wk.png',
            },
            b: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/bp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/br.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/bn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/bb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/bq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/wood/150/bk.png',
            },
        },
    },
    {
        name: 'Glass',
        pieces: {
            w: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/wp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/wr.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/wn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/wb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/wq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/wk.png',
            },
            b: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/bp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/br.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/bn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/bb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/bq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/bk.png',
            },
        },
    },
    {
        name: 'Gothic',
        pieces: {
            w: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/wp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/wr.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/wn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/wb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/wq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/wk.png',
            },
            b: {
                p: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/bp.png',
                r: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/br.png',
                n: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/bn.png',
                b: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/bb.png',
                q: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/bq.png',
                k: 'https://images.chesscomfiles.com/chess-themes/pieces/gothic/150/bk.png',
            },
        },
    },
];

interface ChessBoardProps {
    game: Chess;
    onMove: (move: { from: string; to: string; promotion?: string }) => void;
    orientation?: 'white' | 'black';
    learnMode?: boolean;
    roomCode?: string | null;
    socket?: Socket;
    language?: 'en' | 'no';
    theme?: BoardTheme;
    pieceTheme?: PieceTheme;
}

const PROMOTION_PIECES = ['q', 'r', 'b', 'n'] as const;

interface PendingPromotion {
    from: Square;
    to: Square;
    color: 'w' | 'b';
}

const ChessBoard: React.FC<ChessBoardProps> = ({
    game,
    onMove,
    orientation = 'white',
    learnMode = false,
    roomCode,
    socket,
    language = 'en',
    theme = BOARD_THEMES[0],
    pieceTheme = PIECE_THEMES[0]
}) => {
    const { isMobile, boardSize } = useResponsiveBoard();
    const squareSize = boardSize / 8;

    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [optionSquares, setOptionSquares] = useState<Square[]>([]);
    const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
    const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);
    const [hoverExplanation, setHoverExplanation] = useState<PotentialMoveExplanation | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

    // Track which square we're currently requesting an explanation for
    const pendingRequestRef = useRef<string | null>(null);

    // Track FEN to detect actual position changes (not just object reference changes)
    const prevFenRef = useRef<string>(game.fen());
    const currentFen = useMemo(() => game.fen(), [game]);

    // Calculate board squares based on orientation
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    const board = [];
    const rankIter = orientation === 'white' ? [...ranks].reverse() : ranks;
    const fileIter = orientation === 'white' ? files : [...files].reverse();

    for (const rank of rankIter) {
        for (const file of fileIter) {
            board.push(file + rank);
        }
    }

    useEffect(() => {
        // Only clear selection when the actual position changes (FEN), not on every game object change
        if (prevFenRef.current !== currentFen) {
            setSelectedSquare(null);
            setOptionSquares([]);
            setPendingPromotion(null);
            // Also clear Learn Mode hover state
            pendingRequestRef.current = null;
            setHoveredSquare(null);
            setHoverExplanation(null);
            setTooltipPosition(null);
            prevFenRef.current = currentFen;
        }
    }, [currentFen]);

    // Listen for potential move explanations in Learn Mode
    useEffect(() => {
        if (!socket) return;

        const handlePotentialMoveExplanation = (explanation: PotentialMoveExplanation) => {
            // Only update if this response matches our pending request
            if (pendingRequestRef.current === explanation.to) {
                setHoverExplanation(explanation);
            }
        };

        socket.on('potential_move_explanation', handlePotentialMoveExplanation);

        return () => {
            socket.off('potential_move_explanation', handlePotentialMoveExplanation);
        };
    }, [socket]);

    // Request explanation when hovering over a valid move square in Learn Mode
    const handleSquareHover = (square: Square, event: React.MouseEvent) => {
        if (!learnMode || !selectedSquare || !socket || !roomCode) return;

        if (optionSquares.includes(square)) {
            pendingRequestRef.current = square;
            setHoveredSquare(square);
            setTooltipPosition({ x: event.clientX, y: event.clientY });
            socket.emit('explain_potential_move', {
                roomId: roomCode,
                from: selectedSquare,
                to: square
            });
        } else {
            pendingRequestRef.current = null;
            setHoveredSquare(null);
            setHoverExplanation(null);
            setTooltipPosition(null);
        }
    };

    // Only clear hover state when leaving the board entirely
    const handleBoardLeave = useCallback(() => {
        pendingRequestRef.current = null;
        setHoveredSquare(null);
        setHoverExplanation(null);
        setTooltipPosition(null);
    }, []);

    const getPieceImage = (piece: { type: string; color: string } | null) => {
        if (!piece) return undefined;
        return pieceTheme.pieces[piece.color][piece.type];
    };

    // Check if a move is a pawn promotion
    const isPromotion = (from: Square, to: Square): boolean => {
        const piece = game.get(from);
        if (!piece || piece.type !== 'p') return false;
        const toRank = to[1];
        return (piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1');
    };

    // Handle the actual move (with or without promotion)
    const executeMove = (from: Square, to: Square, promotion?: string) => {
        onMove({ from, to, promotion });
        setSelectedSquare(null);
        setOptionSquares([]);
        setPendingPromotion(null);
    };

    // Handle promotion piece selection
    const handlePromotionSelect = (piece: string) => {
        if (pendingPromotion) {
            executeMove(pendingPromotion.from, pendingPromotion.to, piece);
        }
    };

    // Cancel promotion
    const cancelPromotion = () => {
        setPendingPromotion(null);
        setSelectedSquare(null);
        setOptionSquares([]);
    };

    const handleSquareClick = (square: string) => {
        const sq = square as Square;

        // If promotion modal is open, ignore clicks on board
        if (pendingPromotion) return;

        // If we already selected a square
        if (selectedSquare) {
            // Check if clicked on another of own pieces first
            const clickedPiece = game.get(sq);
            if (clickedPiece && clickedPiece.color === game.turn()) {
                setSelectedSquare(sq);
                const moves = game.moves({ square: sq, verbose: true });
                setOptionSquares(moves.map(m => m.to as Square));
                return;
            }

            // User is attempting a move - check if it's valid
            const moves = game.moves({ square: selectedSquare, verbose: true });
            const validMove = moves.find(m => m.to === sq);

            if (validMove) {
                // Valid move - check if promotion
                if (isPromotion(selectedSquare, sq)) {
                    const piece = game.get(selectedSquare);
                    setPendingPromotion({
                        from: selectedSquare,
                        to: sq,
                        color: piece!.color as 'w' | 'b'
                    });
                } else {
                    executeMove(selectedSquare, sq);
                }
            } else {
                // Invalid move - still send to server to get KROG explanation
                // Only if user is attempting to move to a different square
                if (selectedSquare !== sq) {
                    onMove({ from: selectedSquare, to: sq });
                }
                setSelectedSquare(null);
                setOptionSquares([]);
            }
        } else {
            // Select a piece
            const piece = game.get(sq);
            if (piece && piece.color === game.turn()) {
                setSelectedSquare(sq);
                const moves = game.moves({ square: sq, verbose: true });
                setOptionSquares(moves.map(m => m.to as Square));
            }
        }
    };

    return (
        <div style={{ position: 'relative' }}>
        <div
            onMouseLeave={handleBoardLeave}
            onTouchEnd={isMobile ? handleBoardLeave : undefined}
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                width: `${boardSize}px`,
                height: `${boardSize}px`,
                border: isMobile ? '3px solid #333' : '5px solid #333',
                borderRadius: isMobile ? '6px' : '4px',
                overflow: 'hidden',
                position: 'relative',
                touchAction: 'manipulation'
            }}
        >
            {board.map((square, index) => {
                const row = Math.floor(index / 8);
                const col = index % 8;
                const isDark = (row + col) % 2 === 1;
                const color = isDark ? theme.dark : theme.light;

                const piece = game.get(square as Square);
                const isSelected = selectedSquare === square;
                const isOption = optionSquares.includes(square as Square);
                const lastMove = game.history({ verbose: true }).pop();
                const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
                const isHovered = hoveredSquare === square;

                return (
                    <div
                        key={square}
                        onClick={() => handleSquareClick(square)}
                        onMouseEnter={(e) => handleSquareHover(square as Square, e)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (pendingPromotion) return;
                            const fromSquare = e.dataTransfer.getData('text/plain') as Square;
                            if (fromSquare && fromSquare !== square) {
                                // Check if the move is legal
                                const moves = game.moves({ square: fromSquare, verbose: true });
                                const validMove = moves.find(m => m.to === square);
                                if (validMove) {
                                    // Valid move - check if this is a promotion move
                                    if (isPromotion(fromSquare, square as Square)) {
                                        const piece = game.get(fromSquare);
                                        setPendingPromotion({
                                            from: fromSquare,
                                            to: square as Square,
                                            color: piece!.color as 'w' | 'b'
                                        });
                                    } else {
                                        executeMove(fromSquare, square as Square);
                                    }
                                } else {
                                    // Invalid move - send to server to get KROG explanation
                                    onMove({ from: fromSquare, to: square });
                                    setSelectedSquare(null);
                                    setOptionSquares([]);
                                }
                            }
                        }}
                        style={{
                            backgroundColor: isSelected
                                ? 'rgba(255, 255, 0, 0.8)'
                                : isHovered && learnMode
                                    ? 'rgba(155, 89, 182, 0.6)'
                                    : isLastMove
                                        ? 'rgba(255, 255, 0, 0.5)'
                                        : color,
                            position: 'relative',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        {/* Helper dot for valid moves */}
                        {isOption && !piece && (
                            <div style={{
                                width: `${squareSize * 0.28}px`,
                                height: `${squareSize * 0.28}px`,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                zIndex: 1
                            }} />
                        )}

                        {/* Capture ring */}
                        {isOption && piece && (
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                border: `${isMobile ? 3 : 4}px solid rgba(0,0,0,0.2)`,
                                borderRadius: '50%',
                                boxSizing: 'border-box',
                                zIndex: 1
                            }} />
                        )}

                        {piece && (
                            <img
                                src={getPieceImage(piece)}
                                alt={`${piece.color}${piece.type} `}
                                draggable={piece.color === game.turn()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSquareClick(square);
                                }}
                                onDragStart={(e) => {
                                    // Only allow dragging own pieces
                                    if (piece.color !== game.turn()) {
                                        e.preventDefault();
                                        return;
                                    }
                                    e.dataTransfer.setData('text/plain', square);
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                                style={{
                                    width: '90%',
                                    height: '90%',
                                    zIndex: 2,
                                    userSelect: 'none',
                                    cursor: piece.color === game.turn() ? 'grab' : 'default'
                                }}
                            />
                        )}

                        {/* Rank/File Labels (optional polish) */}
                        {col === 0 && (
                            <span style={{
                                position: 'absolute',
                                top: isMobile ? 1 : 2,
                                left: isMobile ? 1 : 2,
                                fontSize: isMobile ? '8px' : '10px',
                                fontWeight: 'bold',
                                color: isDark ? theme.light : theme.dark
                            }}>
                                {orientation === 'white' ? (8 - row) : (row + 1)}
                            </span>
                        )}
                        {row === 7 && (
                            <span style={{
                                position: 'absolute',
                                bottom: isMobile ? 1 : 2,
                                right: isMobile ? 1 : 2,
                                fontSize: isMobile ? '8px' : '10px',
                                fontWeight: 'bold',
                                color: isDark ? theme.light : theme.dark
                            }}>
                                {orientation === 'white' ? files[col] : files[7 - col]}
                            </span>
                        )}
                    </div>
                );
            })}

            {/* Promotion Modal */}
            {pendingPromotion && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 100
                    }}
                    onClick={cancelPromotion}
                >
                    <div
                        style={{
                            background: '#2d2d2d',
                            borderRadius: isMobile ? '14px' : '12px',
                            padding: isMobile ? '16px' : '20px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            color: '#888',
                            textAlign: 'center',
                            marginBottom: isMobile ? '12px' : '15px',
                            fontSize: isMobile ? '0.85rem' : '0.9rem'
                        }}>
                            Choose promotion piece
                        </div>
                        <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px' }}>
                            {PROMOTION_PIECES.map((piece) => (
                                <button
                                    key={piece}
                                    onClick={() => handlePromotionSelect(piece)}
                                    style={{
                                        width: isMobile ? `${squareSize * 0.9}px` : '70px',
                                        height: isMobile ? `${squareSize * 0.9}px` : '70px',
                                        minWidth: isMobile ? '50px' : '70px',
                                        minHeight: isMobile ? '50px' : '70px',
                                        border: '2px solid #444',
                                        borderRadius: isMobile ? '10px' : '8px',
                                        background: '#3d3d3d',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        transition: 'all 0.15s ease',
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isMobile) {
                                            e.currentTarget.style.background = '#4d4d4d';
                                            e.currentTarget.style.borderColor = '#81b64c';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isMobile) {
                                            e.currentTarget.style.background = '#3d3d3d';
                                            e.currentTarget.style.borderColor = '#444';
                                        }
                                    }}
                                >
                                    <img
                                        src={pieceTheme.pieces[pendingPromotion.color][piece]}
                                        alt={piece}
                                        style={{
                                            width: isMobile ? `${squareSize * 0.7}px` : '55px',
                                            height: isMobile ? `${squareSize * 0.7}px` : '55px',
                                            minWidth: isMobile ? '40px' : '55px',
                                            minHeight: isMobile ? '40px' : '55px'
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                        <div style={{
                            color: '#666',
                            textAlign: 'center',
                            marginTop: isMobile ? '10px' : '12px',
                            fontSize: isMobile ? '0.75rem' : '0.8rem'
                        }}>
                            {isMobile ? 'Tap outside to cancel' : 'Click outside to cancel'}
                        </div>
                    </div>
                </div>
            )}
        </div>

            {/* Learn Mode Tooltip - Hidden on mobile since hover doesn't work well */}
            {learnMode && hoverExplanation && tooltipPosition && !isMobile && (
                <div
                    style={{
                        position: 'fixed',
                        left: tooltipPosition.x + 15,
                        top: tooltipPosition.y - 10,
                        background: '#1a1a2e',
                        border: '2px solid #9b59b6',
                        borderRadius: '10px',
                        padding: '14px',
                        maxWidth: '320px',
                        boxShadow: '0 8px 32px rgba(155, 89, 182, 0.4)',
                        zIndex: 200,
                        pointerEvents: 'none'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #333',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{
                            background: '#9b59b6',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '1rem'
                        }}>
                            {hoverExplanation.move || `${hoverExplanation.from}→${hoverExplanation.to}`}
                        </span>
                        {hoverExplanation.krog.tType && (
                            <span style={{
                                background: '#4a90d9',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                {hoverExplanation.krog.tType}
                            </span>
                        )}
                        {hoverExplanation.krog.rType && (
                            <span style={{
                                background: '#8e44ad',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600
                            }}>
                                {hoverExplanation.krog.rType.replace('_', ' ').replace(/^R(\d+)/, 'R$1:')}
                            </span>
                        )}
                    </div>

                    {/* R-Type Description */}
                    {hoverExplanation.krog.rType && hoverExplanation.krog.rTypeDescription && (
                        <div style={{
                            background: 'rgba(142, 68, 173, 0.15)',
                            border: '1px solid rgba(142, 68, 173, 0.4)',
                            padding: '6px 10px',
                            borderRadius: '5px',
                            marginBottom: '10px',
                            fontSize: '0.8rem',
                            color: '#bb8fce'
                        }}>
                            {hoverExplanation.krog.rTypeDescription[language]}
                        </div>
                    )}

                    {/* KROG Formula */}
                    <div style={{
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        color: '#9b59b6',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        wordBreak: 'break-word'
                    }}>
                        {hoverExplanation.krog.formula}
                    </div>

                    {/* Explanation */}
                    <div style={{
                        color: '#ddd',
                        fontSize: '0.85rem',
                        marginBottom: '10px',
                        lineHeight: 1.4
                    }}>
                        {hoverExplanation.explanation[language]}
                    </div>

                    {/* Conditions */}
                    {hoverExplanation.conditions && hoverExplanation.conditions.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginBottom: '10px'
                        }}>
                            {hoverExplanation.conditions.map((cond, i) => (
                                <span
                                    key={i}
                                    style={{
                                        background: cond.met ? 'rgba(129, 182, 76, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                                        border: `1px solid ${cond.met ? '#81b64c' : '#e74c3c'}`,
                                        color: cond.met ? '#81b64c' : '#e74c3c',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontSize: '0.7rem',
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    {cond.met ? '✓' : '✗'} {cond.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* FIDE Reference */}
                    <div style={{
                        color: '#888',
                        fontSize: '0.75rem',
                        borderTop: '1px solid #333',
                        paddingTop: '8px'
                    }}>
                        <span style={{
                            background: '#333',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            marginRight: '6px'
                        }}>
                            FIDE {hoverExplanation.fide.article}
                        </span>
                        {hoverExplanation.fide[language]}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChessBoard;
