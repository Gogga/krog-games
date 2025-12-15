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

// Lesson types
interface LocalizedText {
    en: string;
    no: string;
}

interface QuizQuestion {
    question: LocalizedText;
    options: string[];
    correct: number;
}

interface LessonExercise {
    type: string;
    target?: string;
    instruction?: LocalizedText;
    fen?: string;
    validMoves?: string[];
}

interface Lesson {
    id: string;
    title: LocalizedText;
    duration: number;
    piece?: string;
    content: LocalizedText;
    keyPoints?: LocalizedText[];
    krog?: {
        formula: string;
        note?: string;
        fide?: string;
    };
    exercises?: LessonExercise[];
    quiz?: QuizQuestion[];
}

interface LessonModule {
    id: string;
    name: LocalizedText;
    lessons: Lesson[];
}

interface LessonLevel {
    level: number;
    name: LocalizedText;
    description: LocalizedText;
    estimatedTime: string;
    modules: LessonModule[];
}

interface LessonIndex {
    [key: string]: {
        level: number;
        module: string;
        next: string | null;
    };
}

interface LessonData {
    metadata: {
        version: string;
        totalLessons: number;
        levelsCovered: number[];
        languages: string[];
        format: string;
    };
    levels: LessonLevel[];
    lessonIndex: LessonIndex;
}

// Load lessons from JSON
let lessonData: LessonData | null = null;
try {
    const lessonPath = path.join(__dirname, '../data/lessons.json');
    lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
    const totalLessons = lessonData!.levels.reduce((acc, level) =>
        acc + level.modules.reduce((acc2, mod) => acc2 + mod.lessons.length, 0), 0);
    console.log(`Loaded ${totalLessons} lessons across ${lessonData!.levels.length} levels`);
} catch (error) {
    console.error('Failed to load lessons:', error);
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
    drawOffer?: 'white' | 'black';  // Who offered the draw (pending offer)
    rematchRequest?: 'white' | 'black';  // Who requested the rematch
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

    // ==================== DRAW & RESIGN ====================

    // Offer a draw
    socket.on('offer_draw', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const playerColor = getPlayerColor(room, socket.id);
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot offer draws' });
            return;
        }

        // Can't offer draw if game is over
        if (room.game.isGameOver()) {
            socket.emit('error', { message: 'Game is already over' });
            return;
        }

        // Can't offer draw if there's already a pending offer from you
        if (room.drawOffer === playerColor) {
            socket.emit('error', { message: 'You already have a pending draw offer' });
            return;
        }

        // Set the draw offer
        room.drawOffer = playerColor;

        // Notify both players
        io.to(roomId).emit('draw_offered', { by: playerColor });
        console.log(`Draw offered by ${playerColor} in room ${roomId}`);
    });

    // Accept a draw offer
    socket.on('accept_draw', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const playerColor = getPlayerColor(room, socket.id);
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot accept draws' });
            return;
        }

        // Can only accept if opponent offered
        if (!room.drawOffer || room.drawOffer === playerColor) {
            socket.emit('error', { message: 'No draw offer to accept' });
            return;
        }

        // Stop the clock
        stopClock(room);

        // Clear the draw offer
        room.drawOffer = undefined;

        // End the game as a draw
        io.to(roomId).emit('game_over', { reason: 'agreement', winner: 'draw' });
        io.to(roomId).emit('draw_accepted', {});
        console.log(`Draw accepted in room ${roomId}`);
    });

    // Decline a draw offer
    socket.on('decline_draw', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const playerColor = getPlayerColor(room, socket.id);
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot decline draws' });
            return;
        }

        // Can only decline if opponent offered
        if (!room.drawOffer || room.drawOffer === playerColor) {
            socket.emit('error', { message: 'No draw offer to decline' });
            return;
        }

        // Clear the draw offer
        room.drawOffer = undefined;

        // Notify both players
        io.to(roomId).emit('draw_declined', { by: playerColor });
        console.log(`Draw declined by ${playerColor} in room ${roomId}`);
    });

    // Resign the game
    socket.on('resign', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const playerColor = getPlayerColor(room, socket.id);
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot resign' });
            return;
        }

        // Can't resign if game is over
        if (room.game.isGameOver()) {
            socket.emit('error', { message: 'Game is already over' });
            return;
        }

        // Stop the clock
        stopClock(room);

        // Clear any pending draw offer
        room.drawOffer = undefined;

        // Determine winner
        const winner = playerColor === 'white' ? 'black' : 'white';

        // End the game
        io.to(roomId).emit('game_over', { reason: 'resignation', winner });
        io.to(roomId).emit('player_resigned', { player: playerColor, winner });
        console.log(`${playerColor} resigned in room ${roomId}, ${winner} wins`);
    });

    // ==================== REMATCH ====================

    // Request a rematch
    socket.on('request_rematch', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const playerColor = getPlayerColor(room, socket.id);
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot request rematches' });
            return;
        }

        // Can only request rematch if game is over
        if (!room.game.isGameOver() && !room.clock.gameStarted) {
            // Game hasn't started or isn't over - check if it was ended by resignation/draw
            // We'll allow rematch requests anyway since game_over event was sent
        }

        // Can't request rematch if you already have a pending request
        if (room.rematchRequest === playerColor) {
            socket.emit('error', { message: 'You already have a pending rematch request' });
            return;
        }

        // Set the rematch request
        room.rematchRequest = playerColor;

        // Notify both players
        io.to(roomId).emit('rematch_requested', { by: playerColor });
        console.log(`Rematch requested by ${playerColor} in room ${roomId}`);
    });

    // Accept a rematch request
    socket.on('accept_rematch', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const playerColor = getPlayerColor(room, socket.id);
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot accept rematches' });
            return;
        }

        // Can only accept if opponent requested
        if (!room.rematchRequest || room.rematchRequest === playerColor) {
            socket.emit('error', { message: 'No rematch request to accept' });
            return;
        }

        // Clear the rematch request
        room.rematchRequest = undefined;
        room.drawOffer = undefined;

        // Swap player colors
        const whiteSocketId = room.players.white;
        const blackSocketId = room.players.black;
        room.players.white = blackSocketId;
        room.players.black = whiteSocketId;

        // Reset the game
        room.game.reset();

        // Reset the clock
        stopClock(room);
        room.clock = initializeClock(room.timeControl);

        // Notify players of their new colors
        if (room.players.white) {
            io.to(room.players.white).emit('player_assigned', { color: 'white' });
        }
        if (room.players.black) {
            io.to(room.players.black).emit('player_assigned', { color: 'black' });
        }

        // Notify all of rematch accepted and new game state
        io.to(roomId).emit('rematch_accepted', {});
        io.to(roomId).emit('game_state', room.game.fen());
        io.to(roomId).emit('clock_update', {
            white: room.clock.white,
            black: room.clock.black,
            activeColor: null
        });

        console.log(`Rematch accepted in room ${roomId}, colors swapped`);
    });

    // Decline a rematch request
    socket.on('decline_rematch', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const playerColor = getPlayerColor(room, socket.id);
        if (playerColor === 'spectator') {
            socket.emit('error', { message: 'Spectators cannot decline rematches' });
            return;
        }

        // Can only decline if opponent requested
        if (!room.rematchRequest || room.rematchRequest === playerColor) {
            socket.emit('error', { message: 'No rematch request to decline' });
            return;
        }

        // Clear the rematch request
        room.rematchRequest = undefined;

        // Notify both players
        io.to(roomId).emit('rematch_declined', { by: playerColor });
        console.log(`Rematch declined by ${playerColor} in room ${roomId}`);
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

    // ==================== LESSONS ====================

    // Get all levels with modules (for navigation)
    socket.on('get_lessons_overview', () => {
        if (!lessonData) {
            socket.emit('error', { message: 'Lessons not available' });
            return;
        }

        const overview = lessonData.levels.map(level => ({
            level: level.level,
            name: level.name,
            description: level.description,
            estimatedTime: level.estimatedTime,
            modules: level.modules.map(mod => ({
                id: mod.id,
                name: mod.name,
                lessonCount: mod.lessons.length,
                lessons: mod.lessons.map(l => ({
                    id: l.id,
                    title: l.title,
                    duration: l.duration,
                    piece: l.piece
                }))
            }))
        }));

        socket.emit('lessons_overview', {
            levels: overview,
            totalLessons: lessonData.metadata.totalLessons
        });
    });

    // Get a specific lesson by ID
    socket.on('get_lesson', ({ id }: { id: string }) => {
        if (!lessonData) {
            socket.emit('error', { message: 'Lessons not available' });
            return;
        }

        // Find the lesson across all levels and modules
        let foundLesson: Lesson | undefined;
        let foundLevel: number | undefined;
        let foundModule: string | undefined;

        for (const level of lessonData.levels) {
            for (const mod of level.modules) {
                const lesson = mod.lessons.find(l => l.id === id);
                if (lesson) {
                    foundLesson = lesson;
                    foundLevel = level.level;
                    foundModule = mod.id;
                    break;
                }
            }
            if (foundLesson) break;
        }

        if (!foundLesson) {
            socket.emit('error', { message: 'Lesson not found' });
            return;
        }

        // Get navigation info
        const indexInfo = lessonData.lessonIndex[id];

        socket.emit('lesson_data', {
            ...foundLesson,
            level: foundLevel,
            module: foundModule,
            nextLessonId: indexInfo?.next || null
        });
    });

    // Get first lesson (for starting fresh)
    socket.on('get_first_lesson', () => {
        if (!lessonData || lessonData.levels.length === 0) {
            socket.emit('error', { message: 'Lessons not available' });
            return;
        }

        const firstLevel = lessonData.levels[0];
        const firstModule = firstLevel.modules[0];
        const firstLesson = firstModule.lessons[0];

        if (!firstLesson) {
            socket.emit('error', { message: 'No lessons available' });
            return;
        }

        const indexInfo = lessonData.lessonIndex[firstLesson.id];

        socket.emit('lesson_data', {
            ...firstLesson,
            level: firstLevel.level,
            module: firstModule.id,
            nextLessonId: indexInfo?.next || null
        });
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
