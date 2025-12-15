import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Chess } from 'chess.js';
import * as fs from 'fs';
import * as path from 'path';
import {
    explainMove,
    Square,
    MoveExplanation,
    IllegalMoveExplanation,
    suggestMoves,
    evaluatePosition,
    loadOpeningBook,
    ScoringContext,
    MoveSuggestion
} from './krog';

const app = express();
app.use(cors());

// Load opening book at startup
loadOpeningBook();

// Puzzle types
interface Puzzle {
    id: string;
    fen: string;
    solution: string[];
    themes: string[];
    level: number;
    rating: number;
    krog?: {
        formula: string;
        explanation: {
            en: string;
            no: string;
        };
    };
}

interface PuzzleData {
    metadata: {
        version: string;
        totalPuzzles: number;
        themes: number;
        levels: number;
    };
    puzzles: Puzzle[];
}

// Load puzzles from JSON
let puzzles: Puzzle[] = [];
try {
    const puzzlePath = path.join(__dirname, '../data/puzzles.json');
    const puzzleData: PuzzleData = JSON.parse(fs.readFileSync(puzzlePath, 'utf8'));
    puzzles = puzzleData.puzzles;
    console.log(`Loaded ${puzzles.length} puzzles`);
} catch (error) {
    console.error('Failed to load puzzles:', error);
}

// Opening types
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

interface Opening {
    id: string;
    name: { en: string; no: string };
    eco: string;
    moves: string;
    level: number;
    popularity: number;
    description: { en: string; no: string };
    keyIdeas?: {
        white: string[];
        black: string[];
    };
    krog?: {
        mainTheme: string;
        strategicFormula: string;
        tacticalPatterns?: string[];
    };
    statistics?: {
        whiteWins: number;
        draws: number;
        blackWins: number;
        avgMoves: number;
    };
    variations?: OpeningVariation[];
}

interface OpeningData {
    metadata: {
        version: string;
        totalOpenings: number;
        totalVariations: number;
    };
    openings: Opening[];
}

// Load openings from JSON
let openings: Opening[] = [];
try {
    const openingPath = path.join(__dirname, '../data/openings.json');
    const openingData: OpeningData = JSON.parse(fs.readFileSync(openingPath, 'utf8'));
    openings = openingData.openings;
    console.log(`Loaded ${openings.length} openings`);
} catch (error) {
    console.error('Failed to load openings:', error);
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for MVP
        methods: ["GET", "POST"]
    }
});

// Types for room management
interface RoomPlayers {
    white?: string;  // socket.id
    black?: string;  // socket.id
    spectators: string[];
}

// Time control presets (time in ms, increment in ms)
type TimeControlType = 'bullet' | 'blitz' | 'rapid' | 'unlimited';

interface TimeControl {
    type: TimeControlType;
    initialTime: number;  // ms
    increment: number;    // ms per move
}

const TIME_CONTROLS: Record<TimeControlType, TimeControl> = {
    bullet: { type: 'bullet', initialTime: 60000, increment: 0 },       // 1+0
    blitz: { type: 'blitz', initialTime: 180000, increment: 2000 },     // 3+2
    rapid: { type: 'rapid', initialTime: 600000, increment: 0 },        // 10+0
    unlimited: { type: 'unlimited', initialTime: 0, increment: 0 }      // No clock
};

interface ClockState {
    white: number;        // ms remaining
    black: number;        // ms remaining
    activeColor: 'white' | 'black' | null;  // whose clock is running
    lastUpdate: number;   // timestamp of last update
    gameStarted: boolean; // true after first move
}

interface Room {
    game: Chess;
    players: RoomPlayers;
    code: string;
    timeControl: TimeControl;
    clock: ClockState;
    clockInterval?: ReturnType<typeof setInterval>;
}

// Store rooms in memory for MVP
const rooms = new Map<string, Room>();
// Map socket.id to roomId for disconnect handling
const socketToRoom = new Map<string, string>();

// Generate unique 6-character room code [A-Z0-9]
function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms.has(code)); // Ensure uniqueness
    return code;
}

// Get player's color in a room
function getPlayerColor(room: Room, socketId: string): 'white' | 'black' | 'spectator' {
    if (room.players.white === socketId) return 'white';
    if (room.players.black === socketId) return 'black';
    return 'spectator';
}

// Initialize clock state for a room
function initializeClock(timeControl: TimeControl): ClockState {
    return {
        white: timeControl.initialTime,
        black: timeControl.initialTime,
        activeColor: null,
        lastUpdate: Date.now(),
        gameStarted: false
    };
}

// Get current clock times (accounting for elapsed time)
function getCurrentClockTimes(room: Room): { white: number; black: number } {
    if (room.timeControl.type === 'unlimited' || !room.clock.gameStarted) {
        return { white: room.clock.white, black: room.clock.black };
    }

    const now = Date.now();
    const elapsed = now - room.clock.lastUpdate;

    if (room.clock.activeColor === 'white') {
        return {
            white: Math.max(0, room.clock.white - elapsed),
            black: room.clock.black
        };
    } else if (room.clock.activeColor === 'black') {
        return {
            white: room.clock.white,
            black: Math.max(0, room.clock.black - elapsed)
        };
    }

    return { white: room.clock.white, black: room.clock.black };
}

// Check if a player has flagged (ran out of time)
function checkTimeoutAndHandle(room: Room, roomCode: string): boolean {
    if (room.timeControl.type === 'unlimited' || !room.clock.gameStarted) {
        return false;
    }

    const times = getCurrentClockTimes(room);

    if (times.white <= 0) {
        stopClock(room);
        io.to(roomCode).emit('time_forfeit', { loser: 'white', winner: 'black' });
        io.to(roomCode).emit('game_over', { reason: 'timeout', winner: 'black' });
        return true;
    }

    if (times.black <= 0) {
        stopClock(room);
        io.to(roomCode).emit('time_forfeit', { loser: 'black', winner: 'white' });
        io.to(roomCode).emit('game_over', { reason: 'timeout', winner: 'white' });
        return true;
    }

    return false;
}

// Start the clock tick interval for a room
function startClockInterval(room: Room, roomCode: string) {
    if (room.clockInterval) {
        clearInterval(room.clockInterval);
    }

    if (room.timeControl.type === 'unlimited') return;

    room.clockInterval = setInterval(() => {
        if (checkTimeoutAndHandle(room, roomCode)) {
            return;
        }

        // Broadcast clock update
        const times = getCurrentClockTimes(room);
        io.to(roomCode).emit('clock_update', {
            white: times.white,
            black: times.black,
            activeColor: room.clock.activeColor
        });
    }, 100);  // Update every 100ms for smooth display
}

// Stop the clock interval
function stopClock(room: Room) {
    if (room.clockInterval) {
        clearInterval(room.clockInterval);
        room.clockInterval = undefined;
    }

    // Save final times
    const times = getCurrentClockTimes(room);
    room.clock.white = times.white;
    room.clock.black = times.black;
    room.clock.activeColor = null;
    room.clock.lastUpdate = Date.now();
}

// Switch clock after a move
function switchClock(room: Room, fromColor: 'white' | 'black') {
    if (room.timeControl.type === 'unlimited') return;

    const now = Date.now();
    const elapsed = now - room.clock.lastUpdate;

    // Deduct time from the player who just moved
    if (fromColor === 'white') {
        room.clock.white = Math.max(0, room.clock.white - elapsed);
        // Add increment
        room.clock.white += room.timeControl.increment;
        room.clock.activeColor = 'black';
    } else {
        room.clock.black = Math.max(0, room.clock.black - elapsed);
        // Add increment
        room.clock.black += room.timeControl.increment;
        room.clock.activeColor = 'white';
    }

    room.clock.lastUpdate = now;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create a new room
    socket.on('create_room', ({ timeControl: timeControlType }: { timeControl?: TimeControlType } = {}) => {
        const code = generateRoomCode();
        const timeControl = TIME_CONTROLS[timeControlType || 'rapid'];
        const room: Room = {
            game: new Chess(),
            players: { white: socket.id, spectators: [] },
            code,
            timeControl,
            clock: initializeClock(timeControl)
        };
        rooms.set(code, room);
        socketToRoom.set(socket.id, code);

        socket.join(code);
        socket.emit('room_created', { code, timeControl });
        socket.emit('player_assigned', { color: 'white' });
        socket.emit('game_state', room.game.fen());
        socket.emit('clock_update', {
            white: room.clock.white,
            black: room.clock.black,
            activeColor: null
        });

        console.log(`Room ${code} created by ${socket.id} (white) - ${timeControl.type}`);
    });

    // Join existing room by code
    socket.on('join_room', ({ code }: { code: string }) => {
        const roomCode = code.toUpperCase().trim();
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        // Leave any previous room
        const previousRoom = socketToRoom.get(socket.id);
        if (previousRoom) {
            socket.leave(previousRoom);
        }

        socket.join(roomCode);
        socketToRoom.set(socket.id, roomCode);

        // Assign color: first empty slot, or spectator
        let assignedColor: 'white' | 'black' | 'spectator';
        if (!room.players.white) {
            room.players.white = socket.id;
            assignedColor = 'white';
        } else if (!room.players.black) {
            room.players.black = socket.id;
            assignedColor = 'black';
        } else {
            room.players.spectators.push(socket.id);
            assignedColor = 'spectator';
        }

        socket.emit('room_joined', { code: roomCode, timeControl: room.timeControl });
        socket.emit('player_assigned', { color: assignedColor });
        socket.emit('game_state', room.game.fen());

        // Send current clock state
        const times = getCurrentClockTimes(room);
        socket.emit('clock_update', {
            white: times.white,
            black: times.black,
            activeColor: room.clock.activeColor
        });

        // Notify others
        socket.to(roomCode).emit('player_joined', { color: assignedColor });

        console.log(`User ${socket.id} joined room ${roomCode} as ${assignedColor}`);
    });

    // Make a move (with color enforcement)
    socket.on('make_move', ({ roomId, move }: { roomId: string, move: any }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const playerColor = getPlayerColor(room, socket.id);
        const currentTurn = room.game.turn() === 'w' ? 'white' : 'black';

        // Spectators can't move
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot make moves' });
            return;
        }

        // Can only move on your turn
        if (playerColor !== currentTurn) {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        // Check for time forfeit before allowing move
        if (checkTimeoutAndHandle(room, roomId)) {
            return;
        }

        // Generate KROG explanation before attempting the move
        const from = move.from as Square;
        const to = move.to as Square;
        const krogExplanation = explainMove(room.game, from, to, move.promotion);

        // Try to make the move
        let result = null;
        try {
            result = room.game.move(move);
        } catch (e) {
            // chess.js threw an error - move is definitely illegal
            result = null;
        }

        if (result) {
            // Legal move
            // Handle clock on first move
            if (!room.clock.gameStarted && room.timeControl.type !== 'unlimited') {
                room.clock.gameStarted = true;
                room.clock.activeColor = 'black';  // White just moved, black's clock starts
                room.clock.lastUpdate = Date.now();
                startClockInterval(room, roomId);
            } else {
                // Switch clock (adds increment to player who moved)
                switchClock(room, currentTurn);
            }

            // Broadcast game state with KROG explanation
            io.to(roomId).emit('game_state', room.game.fen());

            // Send move explanation to all clients
            const legalExplanation = krogExplanation as MoveExplanation;
            io.to(roomId).emit('move_explanation', {
                move: result.san,
                from: result.from,
                to: result.to,
                krog: {
                    formula: legalExplanation.krog.formula,
                    operator: legalExplanation.krog.operator,
                    tType: legalExplanation.krog.tType
                },
                fide: legalExplanation.fide,
                explanation: legalExplanation.explanation,
                conditions: legalExplanation.conditions
            });

            // Send updated clock times
            const times = getCurrentClockTimes(room);
            io.to(roomId).emit('clock_update', {
                white: times.white,
                black: times.black,
                activeColor: room.clock.activeColor
            });

            // Check for game over conditions
            if (room.game.isGameOver()) {
                stopClock(room);
                let reason = 'unknown';
                let winner: 'white' | 'black' | 'draw' = 'draw';

                if (room.game.isCheckmate()) {
                    reason = 'checkmate';
                    winner = room.game.turn() === 'w' ? 'black' : 'white';
                } else if (room.game.isStalemate()) {
                    reason = 'stalemate';
                } else if (room.game.isThreefoldRepetition()) {
                    reason = 'repetition';
                } else if (room.game.isInsufficientMaterial()) {
                    reason = 'insufficient';
                } else if (room.game.isDraw()) {
                    reason = 'fifty_moves';
                }

                io.to(roomId).emit('game_over', { reason, winner });
            }
        } else {
            // Illegal move - send KROG explanation for why
            const illegalExplanation = krogExplanation as IllegalMoveExplanation;
            socket.emit('illegal_move', {
                from: illegalExplanation.from,
                to: illegalExplanation.to,
                reason: illegalExplanation.reason,
                krog: {
                    formula: illegalExplanation.krog.formula,
                    violation: illegalExplanation.krog.violation
                },
                fide: illegalExplanation.fide,
                explanation: illegalExplanation.explanation
            });
        }
    });

    // Get KROG explanation for a potential move (Learn Mode)
    socket.on('explain_potential_move', ({ roomId, from, to }: { roomId: string; from: string; to: string }) => {
        console.log('Learn Mode: Received explain_potential_move request', { roomId, from, to });

        const room = rooms.get(roomId);
        if (!room) {
            console.log('Learn Mode: Room not found', roomId);
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const explanation = explainMove(room.game, from as Square, to as Square);
        console.log('Learn Mode: Sending explanation', explanation);

        // Check if it's a legal move explanation
        if ('isLegal' in explanation && explanation.isLegal) {
            socket.emit('potential_move_explanation', {
                from,
                to,
                isLegal: true,
                move: explanation.move,
                krog: {
                    formula: explanation.krog.formula,
                    operator: explanation.krog.operator,
                    tType: explanation.krog.tType
                },
                fide: explanation.fide,
                explanation: explanation.explanation,
                conditions: explanation.conditions
            });
        } else {
            // Illegal move
            const illegal = explanation as IllegalMoveExplanation;
            socket.emit('potential_move_explanation', {
                from,
                to,
                isLegal: false,
                reason: illegal.reason,
                krog: {
                    formula: illegal.krog.formula,
                    violation: illegal.krog.violation
                },
                fide: illegal.fide,
                explanation: illegal.explanation
            });
        }
    });

    // Reset game (only players can reset)
    socket.on('reset_game', (roomId: string) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const playerColor = getPlayerColor(room, socket.id);
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot reset the game' });
            return;
        }

        // Stop and reset clock
        stopClock(room);
        room.clock = initializeClock(room.timeControl);

        room.game.reset();
        io.to(roomId).emit('game_state', room.game.fen());
        io.to(roomId).emit('clock_update', {
            white: room.clock.white,
            black: room.clock.black,
            activeColor: null
        });
        console.log(`Room ${roomId} reset by ${socket.id}`);
    });

    // Get move suggestions for current position
    socket.on('suggest_moves', ({ roomId, context, limit }: { roomId: string; context?: ScoringContext; limit?: number }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        try {
            const suggestions = suggestMoves(
                room.game,
                context || 'learning',
                limit || 5
            );

            socket.emit('move_suggestions', {
                suggestions: suggestions.suggestions,
                bestMove: suggestions.bestMove,
                totalLegalMoves: suggestions.totalLegalMoves,
                context: suggestions.context
            });
        } catch (error) {
            console.error('Error generating suggestions:', error);
            socket.emit('error', { message: 'Failed to generate suggestions' });
        }
    });

    // Evaluate current position
    socket.on('evaluate_position', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        try {
            const evaluation = evaluatePosition(room.game);

            socket.emit('position_evaluation', {
                phase: evaluation.phase,
                sideToMove: evaluation.sideToMove,
                material: evaluation.material,
                principles: evaluation.principles,
                tactics: evaluation.tactics.map(t => ({
                    pattern: t.pattern,
                    score: t.score,
                    targets: t.targets,
                    explanation: t.explanation
                })),
                krogScore: evaluation.krogScore,
                explanation: evaluation.explanation
            });
        } catch (error) {
            console.error('Error evaluating position:', error);
            socket.emit('error', { message: 'Failed to evaluate position' });
        }
    });

    // ==================== PUZZLE MODE ====================

    // Get list of puzzles with optional filters
    socket.on('get_puzzles_list', ({ theme, level, limit }: { theme?: string; level?: number; limit?: number }) => {
        let filtered = puzzles;

        if (theme) {
            filtered = filtered.filter(p => p.themes.includes(theme));
        }
        if (level !== undefined) {
            filtered = filtered.filter(p => p.level === level);
        }

        const result = (limit ? filtered.slice(0, limit) : filtered).map(p => ({
            id: p.id,
            themes: p.themes,
            level: p.level,
            rating: p.rating
        }));

        socket.emit('puzzles_list', {
            puzzles: result,
            total: filtered.length,
            themes: [...new Set(puzzles.flatMap(p => p.themes))],
            levels: [...new Set(puzzles.map(p => p.level))].sort((a, b) => a - b)
        });
    });

    // Get a specific puzzle or random one
    socket.on('get_puzzle', ({ id, random, theme, level }: { id?: string; random?: boolean; theme?: string; level?: number }) => {
        let puzzle: Puzzle | undefined;

        if (id) {
            puzzle = puzzles.find(p => p.id === id);
        } else if (random) {
            let candidates = puzzles;
            if (theme) {
                candidates = candidates.filter(p => p.themes.includes(theme));
            }
            if (level !== undefined) {
                candidates = candidates.filter(p => p.level === level);
            }
            if (candidates.length > 0) {
                puzzle = candidates[Math.floor(Math.random() * candidates.length)];
            }
        } else {
            // Return first puzzle
            puzzle = puzzles[0];
        }

        if (!puzzle) {
            socket.emit('error', { message: 'Puzzle not found' });
            return;
        }

        // Find index for navigation
        const currentIndex = puzzles.findIndex(p => p.id === puzzle!.id);

        socket.emit('puzzle_data', {
            id: puzzle.id,
            fen: puzzle.fen,
            themes: puzzle.themes,
            level: puzzle.level,
            rating: puzzle.rating,
            solutionLength: puzzle.solution.length,
            krog: puzzle.krog,
            currentIndex,
            totalPuzzles: puzzles.length
        });
    });

    // Check if a move is correct for the puzzle
    socket.on('check_puzzle_move', ({ puzzleId, moveIndex, move }: { puzzleId: string; moveIndex: number; move: string }) => {
        const puzzle = puzzles.find(p => p.id === puzzleId);
        if (!puzzle) {
            socket.emit('error', { message: 'Puzzle not found' });
            return;
        }

        // Get expected move(s) at this index
        const expectedMoves = puzzle.solution[moveIndex];
        if (!expectedMoves) {
            socket.emit('puzzle_move_result', {
                correct: false,
                message: 'No more moves expected',
                completed: true
            });
            return;
        }

        // Check if move matches (solution can have multiple correct answers separated by commas or as array)
        const correctMoves = Array.isArray(expectedMoves) ? expectedMoves : [expectedMoves];
        const isCorrect = correctMoves.some(cm => cm === move || cm.replace(/[+#]/, '') === move.replace(/[+#]/, ''));

        if (isCorrect) {
            const isComplete = moveIndex >= puzzle.solution.length - 1;
            socket.emit('puzzle_move_result', {
                correct: true,
                completed: isComplete,
                message: isComplete ? 'Puzzle solved!' : 'Correct! Keep going...',
                krog: isComplete ? puzzle.krog : undefined
            });
        } else {
            socket.emit('puzzle_move_result', {
                correct: false,
                completed: false,
                message: 'Incorrect move. Try again!',
                hint: `The correct move starts with ${expectedMoves.toString().charAt(0)}...`
            });
        }
    });

    // Get next/previous puzzle
    socket.on('get_adjacent_puzzle', ({ currentId, direction }: { currentId: string; direction: 'next' | 'prev' }) => {
        const currentIndex = puzzles.findIndex(p => p.id === currentId);
        if (currentIndex === -1) {
            socket.emit('error', { message: 'Current puzzle not found' });
            return;
        }

        let newIndex: number;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % puzzles.length;
        } else {
            newIndex = currentIndex === 0 ? puzzles.length - 1 : currentIndex - 1;
        }

        const puzzle = puzzles[newIndex];
        socket.emit('puzzle_data', {
            id: puzzle.id,
            fen: puzzle.fen,
            themes: puzzle.themes,
            level: puzzle.level,
            rating: puzzle.rating,
            solutionLength: puzzle.solution.length,
            krog: puzzle.krog,
            currentIndex: newIndex,
            totalPuzzles: puzzles.length
        });
    });

    // ==================== OPENING EXPLORER ====================

    // Get all openings (for tree view)
    socket.on('get_openings', () => {
        const openingsList = openings.map(o => ({
            id: o.id,
            name: o.name,
            eco: o.eco,
            moves: o.moves,
            level: o.level,
            popularity: o.popularity,
            description: o.description,
            statistics: o.statistics,
            variationCount: o.variations?.length || 0
        }));

        socket.emit('openings_list', {
            openings: openingsList,
            total: openings.length
        });
    });

    // Get specific opening with full details
    socket.on('get_opening', ({ id }: { id: string }) => {
        const opening = openings.find(o => o.id === id);
        if (!opening) {
            socket.emit('error', { message: 'Opening not found' });
            return;
        }

        socket.emit('opening_data', opening);
    });

    // Get opening by current position (match moves)
    socket.on('get_opening_by_moves', ({ moves }: { moves: string }) => {
        // Find opening that matches these moves
        const matchingOpening = openings.find(o => {
            if (moves.startsWith(o.moves) || o.moves.startsWith(moves)) {
                return true;
            }
            // Check variations too
            return o.variations?.some(v => {
                const fullMoves = o.moves + ' ' + v.moves;
                return moves.startsWith(fullMoves) || fullMoves.startsWith(moves);
            });
        });

        if (matchingOpening) {
            socket.emit('opening_match', {
                opening: {
                    id: matchingOpening.id,
                    name: matchingOpening.name,
                    eco: matchingOpening.eco,
                    moves: matchingOpening.moves,
                    description: matchingOpening.description,
                    krog: matchingOpening.krog
                },
                isExactMatch: matchingOpening.moves === moves
            });
        } else {
            socket.emit('opening_match', { opening: null, isExactMatch: false });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const roomCode = socketToRoom.get(socket.id);
        if (roomCode) {
            const room = rooms.get(roomCode);
            if (room) {
                // Remove from players
                if (room.players.white === socket.id) {
                    room.players.white = undefined;
                    io.to(roomCode).emit('player_left', { color: 'white' });
                } else if (room.players.black === socket.id) {
                    room.players.black = undefined;
                    io.to(roomCode).emit('player_left', { color: 'black' });
                } else {
                    room.players.spectators = room.players.spectators.filter(id => id !== socket.id);
                }

                // Clean up empty rooms
                if (!room.players.white && !room.players.black && room.players.spectators.length === 0) {
                    stopClock(room);  // Clean up clock interval
                    rooms.delete(roomCode);
                    console.log(`Room ${roomCode} deleted (empty)`);
                }
            }
            socketToRoom.delete(socket.id);
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
