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
    MoveSuggestion,
    // KROG Framework Engine
    createKROGEngine,
    KROGValidation
} from './krog';
import { dbOperations, calculateEloChange, User, Game, DailyPuzzleStreak } from './db';
import * as auth from './auth';
import {
    VariantType,
    VariantState,
    VariantGameResult,
    createVariantGame,
    getVariantResult,
    updateVariantState,
    generateChess960Position,
    HILL_SQUARES,
    ThreeCheckState
} from './variants';
import { getBestMove, getThinkingTime, Difficulty } from './ai';

const app = express();
app.use(cors());
app.use(express.json());

// ==================== KROG HELPER FUNCTIONS ====================

// Helper to classify R-types from chess.js moves
function classifyMoveRType(move: { piece: string; flags: string; san: string }): string {
    // Castling
    if (move.flags.includes('k') || move.flags.includes('q')) {
        return 'R9_compound_move';
    }

    // Pawn moves
    if (move.piece === 'p') {
        // En passant
        if (move.flags.includes('e')) {
            return 'R7_temporal_window';
        }
        // Promotion
        if (move.san.includes('=')) {
            return 'R8_mandatory_transformation';
        }
        // Double pawn push
        if (move.flags.includes('b')) {
            return 'R6_first_move_special';
        }
        // Capture
        if (move.flags.includes('c') || move.flags.includes('x')) {
            return 'R4_capture_only';
        }
        // Forward move
        return 'R5_non_capture';
    }

    // Knight
    if (move.piece === 'n') {
        return 'R11_discrete_jump';
    }

    // King
    if (move.piece === 'k') {
        return 'R2_intransitive';
    }

    // Sliding pieces (Queen, Rook, Bishop)
    if (['q', 'r', 'b'].includes(move.piece)) {
        return 'R3_path_dependent';
    }

    return 'R10_conditional';
}

// Get R-type description from KROG framework
function getRTypeDescription(rtype: string): { en: string; no: string } {
    const descriptions: Record<string, { en: string; no: string }> = {
        'R1_asymmetric': { en: 'Asymmetric movement', no: 'Asymmetrisk bevegelse' },
        'R2_intransitive': { en: 'Intransitive movement (King cannot be captured)', no: 'Intransitiv bevegelse (Kongen kan ikke tas)' },
        'R3_path_dependent': { en: 'Path-dependent (cannot jump over pieces)', no: 'Baneavhengig (kan ikke hoppe over brikker)' },
        'R4_capture_only': { en: 'Capture-only movement', no: 'Kun slag-bevegelse' },
        'R5_non_capture': { en: 'Non-capture movement', no: 'Ikke-slag bevegelse' },
        'R6_first_move_special': { en: 'First move special rule', no: 'Spesiell førstetrekk-regel' },
        'R7_temporal_window': { en: 'Temporal window (en passant)', no: 'Tidsvindu (en passant)' },
        'R8_mandatory_transformation': { en: 'Mandatory transformation (promotion)', no: 'Obligatorisk transformasjon (bondeforvandling)' },
        'R9_compound_move': { en: 'Compound move (castling)', no: 'Sammensatt trekk (rokade)' },
        'R10_conditional': { en: 'Conditional movement', no: 'Betinget bevegelse' },
        'R11_discrete_jump': { en: 'Discrete jump (knight)', no: 'Diskret hopp (springer)' },
        'R12_state_dependent': { en: 'State-dependent', no: 'Tilstandsavhengig' },
        'R13_terminal_state': { en: 'Terminal state (checkmate/stalemate)', no: 'Terminaltilstand (sjakkmatt/patt)' },
        'R14_repetition': { en: 'Repetition-based', no: 'Repetisjonsbasert' },
        'R15_counter_based': { en: 'Counter-based (50-move rule)', no: 'Tellerbasert (50-trekksregelen)' }
    };
    return descriptions[rtype] || { en: rtype, no: rtype };
}

// ==================== AUTH REST ENDPOINTS ====================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    const result = await auth.register(username, email, password);
    if (result.success) {
        res.json(result);
    } else {
        res.status(400).json(result);
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    const result = await auth.login(usernameOrEmail, password);
    if (result.success) {
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});

// Get current user (verify token)
app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
    }
    const user = auth.getUserFromToken(token);
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
});

// Refresh token
app.post('/api/auth/refresh', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
    }
    const result = auth.refreshToken(token);
    if (result.success) {
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});

// Get user profile
app.get('/api/profile/:userId', (req, res) => {
    const profile = auth.getUserProfile(req.params.userId);
    if (profile) {
        res.json({ success: true, ...profile });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const leaderboard = auth.getLeaderboard(limit);
    res.json({ success: true, leaderboard });
});

// Get user's game history
app.get('/api/games/:userId', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const games = dbOperations.getUserGames(req.params.userId, limit, offset);
    res.json({ success: true, games });
});

// ==================== KROG API ENDPOINTS ====================

// Get KROG framework info
app.get('/api/krog/info', (req, res) => {
    // Import is at module level, krogEngine created later, so we use a placeholder here
    res.json({
        success: true,
        version: '1.0.0',
        operators: {
            core: ['P', 'O', 'F', 'C', 'L', 'W', 'B', 'I', 'D'],
            pieceLogic: ['PM', 'PC', 'PA', 'NV', 'PD', 'CR', 'EP', 'PO'],
            boardLogic: ['PV', 'MH', 'CS', 'LMG', 'GT', 'TC', 'PR', 'FMC'],
            notation: ['PSA', 'PLA', 'PUCI', 'PVN', 'GN', 'NC'],
            temporal: ['G', 'F', 'X', 'U', 'R']
        },
        totalOperators: 36,
        rtypes: [
            'R1_asymmetric', 'R2_intransitive', 'R3_path_dependent',
            'R4_capture_only', 'R5_non_capture', 'R6_first_move_special',
            'R7_temporal_window', 'R8_mandatory_transformation', 'R9_compound_move',
            'R10_conditional', 'R11_discrete_jump', 'R12_state_dependent',
            'R13_terminal_state', 'R14_repetition', 'R15_counter_based'
        ]
    });
});

// Get R-type classification for a move
app.post('/api/krog/classify', (req, res) => {
    const { piece, flags, san } = req.body;
    if (!piece || !flags || !san) {
        res.status(400).json({ success: false, message: 'Missing required fields: piece, flags, san' });
        return;
    }
    const rType = classifyMoveRType({ piece, flags, san });
    const rTypeDescription = getRTypeDescription(rType);
    res.json({
        success: true,
        rType,
        description: rTypeDescription
    });
});

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

// Initialize KROG Chess Engine for enhanced move validation
const krogEngine = createKROGEngine();
console.log('KROG Chess Engine initialized with 36 operators (9 core, 8 piece logic, 8 board logic, 6 notation, 5 temporal)');

// Types for room management
interface RoomPlayers {
    white?: string;  // socket.id
    black?: string;  // socket.id
    spectators: string[];
}

// Authenticated player info
interface AuthenticatedPlayer {
    socketId: string;
    userId?: string;
    username?: string;
    rating?: number;
}

// Map socket.id to authenticated user
const authenticatedSockets = new Map<string, { userId: string; username: string; rating: number }>();

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
    dbGameId?: string;  // Database game ID for storing results
    whiteUserId?: string;
    blackUserId?: string;
    // Variant support
    variant: VariantType;
    variantState: VariantState;
    // AI support
    isComputerGame?: boolean;
    computerColor?: 'white' | 'black';
    computerDifficulty?: Difficulty;
    // Tournament support
    tournamentGameId?: string;
    // League support
    leagueMatchId?: string;
}

// Helper to parse time control strings like "5+0", "3+2" etc.
function parseTimeControlString(tcString: string): TimeControl {
    const match = tcString.match(/^(\d+)\+(\d+)$/);
    if (match) {
        const minutes = parseInt(match[1], 10);
        const increment = parseInt(match[2], 10);
        let type: TimeControlType = 'rapid';
        if (minutes <= 2) type = 'bullet';
        else if (minutes <= 5) type = 'blitz';
        else type = 'rapid';
        return {
            type,
            initialTime: minutes * 60000,
            increment: increment * 1000
        };
    }
    // Default to rapid if parsing fails
    return TIME_CONTROLS.rapid;
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
        io.to(roomCode).emit('time_forfeit', { loser: 'white', winner: 'black' });
        endGameAndUpdateRatings(room, roomCode, '0-1', 'timeout');
        return true;
    }

    if (times.black <= 0) {
        io.to(roomCode).emit('time_forfeit', { loser: 'black', winner: 'white' });
        endGameAndUpdateRatings(room, roomCode, '1-0', 'timeout');
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

// Helper function to get spectator list with usernames
function getSpectatorList(room: Room): { id: string; username: string }[] {
    return room.players.spectators.map(socketId => {
        const authInfo = authenticatedSockets.get(socketId);
        return {
            id: socketId,
            username: authInfo?.username || 'Anonymous'
        };
    });
}

// Helper function to broadcast spectator update
function broadcastSpectatorUpdate(roomCode: string, room: Room) {
    const spectators = getSpectatorList(room);
    io.to(roomCode).emit('spectator_update', {
        count: spectators.length,
        spectators
    });
}

// Helper function to make computer move
function makeComputerMove(room: Room, roomCode: string) {
    if (!room.isComputerGame || !room.computerColor) return;

    const currentTurn = room.game.turn() === 'w' ? 'white' : 'black';
    if (currentTurn !== room.computerColor) return;

    // Simulate thinking time
    const thinkingTime = getThinkingTime(room.computerDifficulty || 'intermediate');

    setTimeout(() => {
        // Double-check it's still computer's turn (in case of reset)
        const turnNow = room.game.turn() === 'w' ? 'white' : 'black';
        if (turnNow !== room.computerColor) return;
        if (room.game.isGameOver()) return;

        const bestMove = getBestMove(room.game, room.computerDifficulty);
        if (!bestMove) return;

        // Make the move
        const result = room.game.move(bestMove);
        if (!result) return;

        // Handle clock
        if (room.clock.gameStarted && room.timeControl.type !== 'unlimited') {
            switchClock(room, room.computerColor!);
        }

        // Update variant state
        room.variantState = updateVariantState(room.game, room.variantState, room.computerColor!);

        // Broadcast game state
        const history = room.game.history({ verbose: true });
        const lastMove = history[history.length - 1];
        io.to(roomCode).emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: lastMove ? {
                san: lastMove.san,
                from: lastMove.from,
                to: lastMove.to,
                captured: lastMove.captured,
                flags: lastMove.flags,
                promotion: lastMove.promotion
            } : null,
            variant: room.variant,
            variantState: room.variantState
        });

        // Send clock update
        const times = getCurrentClockTimes(room);
        io.to(roomCode).emit('clock_update', {
            white: times.white,
            black: times.black,
            activeColor: room.clock.activeColor
        });

        // Check for game over
        const variantResult = getVariantResult(room.game, room.variantState);
        if (variantResult.gameOver) {
            let gameResult: '1-0' | '0-1' | '1/2-1/2';
            if (variantResult.winner === 'white') {
                gameResult = '1-0';
            } else if (variantResult.winner === 'black') {
                gameResult = '0-1';
            } else {
                gameResult = '1/2-1/2';
            }

            const reasonMap: Record<string, string> = {
                'Checkmate': 'checkmate',
                'Stalemate': 'stalemate',
                'Threefold repetition': 'repetition',
                'Insufficient material': 'insufficient',
                'Fifty-move rule': 'fifty_moves',
                'Three checks delivered': 'three_check',
                'King reached the hill': 'king_of_the_hill'
            };
            const reason = reasonMap[variantResult.reason || ''] || variantResult.reason || 'unknown';

            endGameAndUpdateRatings(room, roomCode, gameResult, reason);
        }
    }, thinkingTime);
}

// Helper function to end game and update ratings
function endGameAndUpdateRatings(
    room: Room,
    roomCode: string,
    result: '1-0' | '0-1' | '1/2-1/2',
    reason: string
) {
    stopClock(room);

    // Calculate ELO changes if both players are authenticated
    let whiteChange = 0;
    let blackChange = 0;

    if (room.whiteUserId && room.blackUserId) {
        const whiteUser = dbOperations.getUserById(room.whiteUserId);
        const blackUser = dbOperations.getUserById(room.blackUserId);

        if (whiteUser && blackUser) {
            let whiteResult: 0 | 0.5 | 1;
            let blackResult: 0 | 0.5 | 1;

            if (result === '1-0') {
                whiteResult = 1;
                blackResult = 0;
            } else if (result === '0-1') {
                whiteResult = 0;
                blackResult = 1;
            } else {
                whiteResult = 0.5;
                blackResult = 0.5;
            }

            whiteChange = calculateEloChange(whiteUser.rating, blackUser.rating, whiteResult);
            blackChange = calculateEloChange(blackUser.rating, whiteUser.rating, blackResult);

            // Update ratings
            dbOperations.updateUserRating(room.whiteUserId, whiteUser.rating + whiteChange);
            dbOperations.updateUserRating(room.blackUserId, blackUser.rating + blackChange);

            // Update stats
            dbOperations.updateUserStats(room.whiteUserId, whiteResult === 1 ? 'win' : whiteResult === 0 ? 'loss' : 'draw');
            dbOperations.updateUserStats(room.blackUserId, blackResult === 1 ? 'win' : blackResult === 0 ? 'loss' : 'draw');

            // Add rating history
            dbOperations.addRatingHistory(room.whiteUserId, whiteUser.rating + whiteChange, whiteChange, room.dbGameId || null);
            dbOperations.addRatingHistory(room.blackUserId, blackUser.rating + blackChange, blackChange, room.dbGameId || null);

            // Update authenticated socket ratings
            const whiteSocketAuth = authenticatedSockets.get(room.players.white || '');
            const blackSocketAuth = authenticatedSockets.get(room.players.black || '');
            if (whiteSocketAuth) whiteSocketAuth.rating = whiteUser.rating + whiteChange;
            if (blackSocketAuth) blackSocketAuth.rating = blackUser.rating + blackChange;
        }
    }

    // Store game in database
    if (room.dbGameId) {
        dbOperations.endGame(room.dbGameId, room.game.pgn(), result, whiteChange, blackChange);
    }

    // Handle tournament game result
    if (room.tournamentGameId && room.whiteUserId && room.blackUserId) {
        let whiteScore: number;
        let blackScore: number;

        if (result === '1-0') {
            whiteScore = 1;
            blackScore = 0;
        } else if (result === '0-1') {
            whiteScore = 0;
            blackScore = 1;
        } else {
            whiteScore = 0.5;
            blackScore = 0.5;
        }

        // Update tournament game
        dbOperations.updateTournamentGameResult(room.tournamentGameId, result, whiteScore, blackScore, room.game.pgn());

        // Update participant scores
        const tournamentGame = dbOperations.getTournamentGame(room.tournamentGameId);
        if (tournamentGame) {
            const whiteParticipant = dbOperations.getTournamentParticipant(tournamentGame.tournament_id, room.whiteUserId);
            const blackParticipant = dbOperations.getTournamentParticipant(tournamentGame.tournament_id, room.blackUserId);

            if (whiteParticipant) {
                dbOperations.updateParticipantScore(
                    tournamentGame.tournament_id,
                    room.whiteUserId,
                    whiteParticipant.score + whiteScore,
                    whiteParticipant.buchholz,
                    whiteParticipant.wins + (whiteScore === 1 ? 1 : 0),
                    whiteParticipant.draws + (whiteScore === 0.5 ? 1 : 0),
                    whiteParticipant.losses + (whiteScore === 0 ? 1 : 0),
                    whiteParticipant.performance_rating
                );
            }
            if (blackParticipant) {
                dbOperations.updateParticipantScore(
                    tournamentGame.tournament_id,
                    room.blackUserId,
                    blackParticipant.score + blackScore,
                    blackParticipant.buchholz,
                    blackParticipant.wins + (blackScore === 1 ? 1 : 0),
                    blackParticipant.draws + (blackScore === 0.5 ? 1 : 0),
                    blackParticipant.losses + (blackScore === 0 ? 1 : 0),
                    blackParticipant.performance_rating
                );
            }

            // Notify tournament participants of game result
            io.emit('tournament_game_completed', {
                tournamentId: tournamentGame.tournament_id,
                gameId: room.tournamentGameId,
                result,
                whiteScore,
                blackScore
            });
        }
    }

    // Handle league match result
    if (room.leagueMatchId && room.whiteUserId && room.blackUserId) {
        let homeScore: number;  // White = Home
        let awayScore: number;  // Black = Away

        if (result === '1-0') {
            homeScore = 1;
            awayScore = 0;
        } else if (result === '0-1') {
            homeScore = 0;
            awayScore = 1;
        } else {
            homeScore = 0.5;
            awayScore = 0.5;
        }

        // Update league match
        dbOperations.updateLeagueMatchResult(room.leagueMatchId, result, homeScore, awayScore, room.game.pgn());

        // Update participant stats
        const leagueMatch = dbOperations.getLeagueMatch(room.leagueMatchId);
        if (leagueMatch) {
            const league = dbOperations.getLeagueById(leagueMatch.league_id);
            if (league) {
                const homeParticipant = dbOperations.getLeagueParticipant(leagueMatch.league_id, room.whiteUserId);
                const awayParticipant = dbOperations.getLeagueParticipant(leagueMatch.league_id, room.blackUserId);

                // Calculate points based on league settings
                const homePoints = result === '1-0' ? league.points_for_win : result === '0-1' ? league.points_for_loss : league.points_for_draw;
                const awayPoints = result === '0-1' ? league.points_for_win : result === '1-0' ? league.points_for_loss : league.points_for_draw;

                if (homeParticipant) {
                    const newWins = homeParticipant.wins + (result === '1-0' ? 1 : 0);
                    const newDraws = homeParticipant.draws + (result === '1/2-1/2' ? 1 : 0);
                    const newLosses = homeParticipant.losses + (result === '0-1' ? 1 : 0);
                    const newForm = (homeParticipant.form + (result === '1-0' ? 'W' : result === '0-1' ? 'L' : 'D')).slice(-5);

                    dbOperations.updateLeagueParticipantStats(
                        leagueMatch.league_id,
                        room.whiteUserId,
                        homeParticipant.points + homePoints,
                        newWins,
                        newDraws,
                        newLosses,
                        homeParticipant.games_played + 1,
                        homeParticipant.goals_for + (result === '1-0' ? 1 : 0),
                        homeParticipant.goals_against + (result === '0-1' ? 1 : 0),
                        newForm
                    );
                }

                if (awayParticipant) {
                    const newWins = awayParticipant.wins + (result === '0-1' ? 1 : 0);
                    const newDraws = awayParticipant.draws + (result === '1/2-1/2' ? 1 : 0);
                    const newLosses = awayParticipant.losses + (result === '1-0' ? 1 : 0);
                    const newForm = (awayParticipant.form + (result === '0-1' ? 'W' : result === '1-0' ? 'L' : 'D')).slice(-5);

                    dbOperations.updateLeagueParticipantStats(
                        leagueMatch.league_id,
                        room.blackUserId,
                        awayParticipant.points + awayPoints,
                        newWins,
                        newDraws,
                        newLosses,
                        awayParticipant.games_played + 1,
                        awayParticipant.goals_for + (result === '0-1' ? 1 : 0),
                        awayParticipant.goals_against + (result === '1-0' ? 1 : 0),
                        newForm
                    );
                }

                // Notify league participants of match result
                io.emit('league_match_completed', {
                    leagueId: leagueMatch.league_id,
                    matchId: room.leagueMatchId,
                    result,
                    homeScore,
                    awayScore
                });
            }
        }
    }

    // Notify clients
    const winner = result === '1-0' ? 'white' : result === '0-1' ? 'black' : 'draw';
    io.to(roomCode).emit('game_over', {
        reason,
        winner,
        result,
        ratingChanges: (room.whiteUserId && room.blackUserId) ? {
            white: whiteChange,
            black: blackChange
        } : null
    });
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // ==================== SOCKET AUTHENTICATION ====================

    // Authenticate socket with JWT token
    socket.on('authenticate', ({ token }: { token: string }) => {
        const user = auth.getUserFromToken(token);
        if (user) {
            authenticatedSockets.set(socket.id, {
                userId: user.id,
                username: user.username,
                rating: user.rating
            });
            socket.emit('authenticated', {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    rating: user.rating
                }
            });
            console.log(`Socket ${socket.id} authenticated as ${user.username}`);
        } else {
            socket.emit('authenticated', { success: false, message: 'Invalid token' });
        }
    });

    // Logout (clear socket authentication)
    socket.on('logout', () => {
        authenticatedSockets.delete(socket.id);
        // Also remove from matchmaking queue
        dbOperations.removeFromQueueBySocket(socket.id);
        socket.emit('logged_out', { success: true });
    });

    // ==================== MATCHMAKING ====================

    // Join matchmaking queue
    socket.on('join_matchmaking', ({ timeControl }: { timeControl: TimeControlType }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to use matchmaking' });
            return;
        }

        // Add to queue
        dbOperations.addToQueue(authInfo.userId, socket.id, authInfo.rating, timeControl);
        socket.emit('matchmaking_joined', { timeControl, rating: authInfo.rating });

        // Try to find a match (rating range starts at 100, expands over time)
        const match = dbOperations.findMatch(authInfo.userId, authInfo.rating, timeControl, 200);
        if (match) {
            // Found a match! Create a room
            dbOperations.removeFromQueue(authInfo.userId);
            dbOperations.removeFromQueue(match.user_id);

            const code = generateRoomCode();
            const tc = TIME_CONTROLS[timeControl];

            // Get both users
            const user1 = dbOperations.getUserById(authInfo.userId);
            const user2 = dbOperations.getUserById(match.user_id);

            // Randomly assign colors
            const user1White = Math.random() < 0.5;
            const whiteUser = user1White ? user1 : user2;
            const blackUser = user1White ? user2 : user1;
            const whiteSocketId = user1White ? socket.id : match.socket_id;
            const blackSocketId = user1White ? match.socket_id : socket.id;

            // Create the room (matchmaking always uses standard variant for now)
            const room: Room = {
                game: new Chess(),
                players: {
                    white: whiteSocketId,
                    black: blackSocketId,
                    spectators: []
                },
                code,
                timeControl: tc,
                clock: initializeClock(tc),
                whiteUserId: whiteUser?.id,
                blackUserId: blackUser?.id,
                variant: 'standard',
                variantState: { variant: 'standard' }
            };

            // Create database game record
            const dbGame = dbOperations.createGame(
                code,
                whiteUser?.id || null,
                blackUser?.id || null,
                timeControl,
                whiteUser?.rating || null,
                blackUser?.rating || null
            );
            room.dbGameId = dbGame.id;

            rooms.set(code, room);
            socketToRoom.set(whiteSocketId, code);
            socketToRoom.set(blackSocketId, code);

            // Join both sockets to the room
            const whiteSocket = io.sockets.sockets.get(whiteSocketId);
            const blackSocket = io.sockets.sockets.get(blackSocketId);

            if (whiteSocket) whiteSocket.join(code);
            if (blackSocket) blackSocket.join(code);

            // Notify both players
            io.to(whiteSocketId).emit('match_found', {
                roomCode: code,
                color: 'white',
                opponent: { username: blackUser?.username, rating: blackUser?.rating },
                timeControl
            });
            io.to(blackSocketId).emit('match_found', {
                roomCode: code,
                color: 'black',
                opponent: { username: whiteUser?.username, rating: whiteUser?.rating },
                timeControl
            });

            // Send initial game state
            io.to(code).emit('game_state', { pgn: room.game.pgn(), fen: room.game.fen(), lastMove: null });
            io.to(code).emit('clock_update', {
                white: room.clock.white,
                black: room.clock.black,
                activeColor: null
            });

            console.log(`Match found: ${whiteUser?.username} vs ${blackUser?.username} in room ${code}`);
        } else {
            // No match yet, notify position in queue
            const position = dbOperations.getQueuePosition(authInfo.userId, timeControl);
            socket.emit('matchmaking_waiting', { position, timeControl });
        }
    });

    // Leave matchmaking queue
    socket.on('leave_matchmaking', () => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (authInfo) {
            dbOperations.removeFromQueue(authInfo.userId);
            socket.emit('matchmaking_left', { success: true });
        }
    });

    // Create a new room
    socket.on('create_room', ({ timeControl: timeControlType, variant: variantType }: { timeControl?: TimeControlType; variant?: VariantType } = {}) => {
        const code = generateRoomCode();
        const timeControl = TIME_CONTROLS[timeControlType || 'rapid'];
        const authInfo = authenticatedSockets.get(socket.id);
        const variant = variantType || 'standard';

        // Create variant-specific game
        const { game, state: variantState } = createVariantGame(variant);

        const room: Room = {
            game,
            players: { white: socket.id, spectators: [] },
            code,
            timeControl,
            clock: initializeClock(timeControl),
            whiteUserId: authInfo?.userId,
            variant,
            variantState
        };
        rooms.set(code, room);
        socketToRoom.set(socket.id, code);

        socket.join(code);
        socket.emit('room_created', { code, timeControl, variant, variantState });
        socket.emit('player_assigned', { color: 'white' });
        socket.emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: null,
            variant,
            variantState
        });
        socket.emit('clock_update', {
            white: room.clock.white,
            black: room.clock.black,
            activeColor: null
        });

        console.log(`Room ${code} created by ${socket.id} (${authInfo?.username || 'anonymous'}) (white) - ${timeControl.type} - ${variant}`);
    });

    // Create a game against the computer
    socket.on('create_computer_game', ({
        timeControl: timeControlType,
        variant: variantType,
        playerColor,
        difficulty
    }: {
        timeControl?: TimeControlType;
        variant?: VariantType;
        playerColor?: 'white' | 'black';
        difficulty?: Difficulty;
    } = {}) => {
        const code = generateRoomCode();
        const timeControl = TIME_CONTROLS[timeControlType || 'rapid'];
        const authInfo = authenticatedSockets.get(socket.id);
        const variant = variantType || 'standard';
        const humanColor = playerColor || 'white';
        const computerColor = humanColor === 'white' ? 'black' : 'white';

        // Create variant-specific game
        const { game, state: variantState } = createVariantGame(variant);

        const room: Room = {
            game,
            players: humanColor === 'white'
                ? { white: socket.id, black: 'computer', spectators: [] }
                : { white: 'computer', black: socket.id, spectators: [] },
            code,
            timeControl,
            clock: initializeClock(timeControl),
            whiteUserId: humanColor === 'white' ? authInfo?.userId : undefined,
            blackUserId: humanColor === 'black' ? authInfo?.userId : undefined,
            variant,
            variantState,
            isComputerGame: true,
            computerColor,
            computerDifficulty: difficulty || 'intermediate'
        };
        rooms.set(code, room);
        socketToRoom.set(socket.id, code);

        socket.join(code);
        socket.emit('room_created', {
            code,
            timeControl,
            variant,
            variantState,
            isComputerGame: true,
            computerDifficulty: difficulty || 'intermediate'
        });
        socket.emit('player_assigned', { color: humanColor });
        socket.emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: null,
            variant,
            variantState
        });
        socket.emit('clock_update', {
            white: room.clock.white,
            black: room.clock.black,
            activeColor: null
        });

        console.log(`Computer game ${code} created by ${socket.id} (${authInfo?.username || 'anonymous'}) (${humanColor}) vs Computer (${difficulty || 'intermediate'}) - ${timeControl.type} - ${variant}`);

        // If computer plays white, make the first move
        if (computerColor === 'white') {
            makeComputerMove(room, code);
        }
    });

    // Join existing room by code
    socket.on('join_room', ({ code }: { code: string }) => {
        const roomCode = code.toUpperCase().trim();
        const room = rooms.get(roomCode);

        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        const authInfo = authenticatedSockets.get(socket.id);

        // Check if this socket is already a player in this room
        const existingColor = getPlayerColor(room, socket.id);
        if (existingColor !== 'spectator') {
            // Already a player in this room, just re-send the current state
            socket.join(roomCode);
            socketToRoom.set(socket.id, roomCode);
            socket.emit('room_joined', {
                roomCode,
                color: existingColor,
                timeControl: room.timeControl,
                variant: room.variant,
                variantState: room.variantState
            });
            socket.emit('player_assigned', { color: existingColor });
            socket.emit('game_state', {
                pgn: room.game.pgn(),
                fen: room.game.fen(),
                variant: room.variant,
                variantState: room.variantState
            });
            const times = getCurrentClockTimes(room);
            socket.emit('clock_update', {
                white: times.white,
                black: times.black,
                activeColor: room.clock.activeColor
            });
            console.log(`User ${socket.id} (${authInfo?.username || 'anonymous'}) rejoined room ${roomCode} as ${existingColor}`);
            return;
        }

        // Leave any previous room (if different from this one)
        const previousRoom = socketToRoom.get(socket.id);
        if (previousRoom && previousRoom !== roomCode) {
            socket.leave(previousRoom);
            // Clean up player slot in previous room
            const prevRoom = rooms.get(previousRoom);
            if (prevRoom) {
                if (prevRoom.players.white === socket.id) {
                    prevRoom.players.white = undefined;
                    io.to(previousRoom).emit('player_left', { color: 'white' });
                } else if (prevRoom.players.black === socket.id) {
                    prevRoom.players.black = undefined;
                    io.to(previousRoom).emit('player_left', { color: 'black' });
                }
            }
        }

        socket.join(roomCode);
        socketToRoom.set(socket.id, roomCode);

        // Assign color: first empty slot, or spectator
        let assignedColor: 'white' | 'black' | 'spectator';
        if (!room.players.white) {
            room.players.white = socket.id;
            room.whiteUserId = authInfo?.userId;
            assignedColor = 'white';
        } else if (!room.players.black) {
            room.players.black = socket.id;
            room.blackUserId = authInfo?.userId;
            assignedColor = 'black';

            // Both players joined - create database game record if both authenticated
            if (room.whiteUserId || room.blackUserId) {
                const whiteUser = room.whiteUserId ? dbOperations.getUserById(room.whiteUserId) : null;
                const blackUser = room.blackUserId ? dbOperations.getUserById(room.blackUserId) : null;
                const dbGame = dbOperations.createGame(
                    roomCode,
                    room.whiteUserId || null,
                    room.blackUserId || null,
                    room.timeControl.type,
                    whiteUser?.rating || null,
                    blackUser?.rating || null
                );
                room.dbGameId = dbGame.id;
            }
        } else {
            room.players.spectators.push(socket.id);
            assignedColor = 'spectator';
        }

        socket.emit('room_joined', { code: roomCode, timeControl: room.timeControl, variant: room.variant, variantState: room.variantState });
        socket.emit('player_assigned', { color: assignedColor });
        socket.emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: null,
            variant: room.variant,
            variantState: room.variantState
        });

        // Send current clock state
        const times = getCurrentClockTimes(room);
        socket.emit('clock_update', {
            white: times.white,
            black: times.black,
            activeColor: room.clock.activeColor
        });

        // Notify others
        socket.to(roomCode).emit('player_joined', { color: assignedColor });

        // Send spectator list to new joiner and broadcast update if spectator joined
        broadcastSpectatorUpdate(roomCode, room);

        console.log(`User ${socket.id} (${authInfo?.username || 'anonymous'}) joined room ${roomCode} as ${assignedColor}`);
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

            // Update variant state (e.g., check count for Three-Check)
            room.variantState = updateVariantState(room.game, room.variantState, currentTurn);

            // Broadcast game state with KROG explanation (send PGN for history + last move for sounds)
            const history = room.game.history({ verbose: true });
            const lastMove = history[history.length - 1];
            io.to(roomId).emit('game_state', {
                pgn: room.game.pgn(),
                fen: room.game.fen(),
                lastMove: lastMove ? {
                    san: lastMove.san,
                    from: lastMove.from,
                    to: lastMove.to,
                    captured: lastMove.captured,
                    flags: lastMove.flags,
                    promotion: lastMove.promotion
                } : null,
                variant: room.variant,
                variantState: room.variantState
            });

            // Send move explanation to all clients
            const legalExplanation = krogExplanation as MoveExplanation;
            // Classify R-type using KROG framework
            const rType = classifyMoveRType(result);
            const rTypeDescription = getRTypeDescription(rType);

            io.to(roomId).emit('move_explanation', {
                move: result.san,
                from: result.from,
                to: result.to,
                krog: {
                    formula: legalExplanation.krog.formula,
                    operator: legalExplanation.krog.operator,
                    tType: legalExplanation.krog.tType,
                    rType: rType,
                    rTypeDescription: rTypeDescription
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

            // Check for variant-specific game over conditions
            const variantResult = getVariantResult(room.game, room.variantState);
            if (variantResult.gameOver) {
                let gameResult: '1-0' | '0-1' | '1/2-1/2';
                if (variantResult.winner === 'white') {
                    gameResult = '1-0';
                } else if (variantResult.winner === 'black') {
                    gameResult = '0-1';
                } else {
                    gameResult = '1/2-1/2';
                }

                // Map variant-specific reasons to display strings
                const reasonMap: Record<string, string> = {
                    'Checkmate': 'checkmate',
                    'Stalemate': 'stalemate',
                    'Threefold repetition': 'repetition',
                    'Insufficient material': 'insufficient',
                    'Fifty-move rule': 'fifty_moves',
                    'Three checks delivered': 'three_check',
                    'King reached the hill': 'king_of_the_hill'
                };
                const reason = reasonMap[variantResult.reason || ''] || variantResult.reason || 'unknown';

                endGameAndUpdateRatings(room, roomId, gameResult, reason);
            } else {
                // Game not over - trigger computer move if applicable
                if (room.isComputerGame) {
                    makeComputerMove(room, roomId);
                }
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
            // Get move details from the game for R-type classification
            const moves = room.game.moves({ verbose: true });
            const moveInfo = moves.find(m => m.from === from && m.to === to);
            let rType = 'R10_conditional';
            let rTypeDescription = getRTypeDescription(rType);

            if (moveInfo) {
                rType = classifyMoveRType(moveInfo);
                rTypeDescription = getRTypeDescription(rType);
            }

            socket.emit('potential_move_explanation', {
                from,
                to,
                isLegal: true,
                move: explanation.move,
                krog: {
                    formula: explanation.krog.formula,
                    operator: explanation.krog.operator,
                    tType: explanation.krog.tType,
                    rType: rType,
                    rTypeDescription: rTypeDescription
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

    // ==================== EXPLAIN HISTORICAL MOVE ====================
    // Explain any move from a game's move history
    socket.on('explain_historical_move', ({ moves, moveIndex }: { moves: string[]; moveIndex: number }) => {
        try {
            // Create a fresh game and replay moves up to the one before the target
            const tempGame = new Chess();

            // Make all moves up to (but not including) the target move
            for (let i = 0; i < moveIndex; i++) {
                const result = tempGame.move(moves[i]);
                if (!result) {
                    socket.emit('error', { message: `Invalid move at index ${i}: ${moves[i]}` });
                    return;
                }
            }

            // Now get the move we want to explain
            const targetMove = moves[moveIndex];

            // Get detailed move info before making the move
            const legalMoves = tempGame.moves({ verbose: true });
            const moveInfo = legalMoves.find(m => m.san === targetMove);

            if (!moveInfo) {
                socket.emit('error', { message: `Move not found: ${targetMove}` });
                return;
            }

            // Generate KROG explanation
            const explanation = explainMove(tempGame, moveInfo.from as Square, moveInfo.to as Square, moveInfo.promotion);

            if ('isLegal' in explanation && explanation.isLegal) {
                // Classify R-type
                const rType = classifyMoveRType(moveInfo);
                const rTypeDescription = getRTypeDescription(rType);

                socket.emit('historical_move_explanation', {
                    moveIndex,
                    move: targetMove,
                    from: moveInfo.from,
                    to: moveInfo.to,
                    piece: moveInfo.piece,
                    krog: {
                        formula: explanation.krog.formula,
                        operator: explanation.krog.operator,
                        tType: explanation.krog.tType,
                        rType: rType,
                        rTypeDescription: rTypeDescription
                    },
                    fide: explanation.fide,
                    explanation: explanation.explanation,
                    conditions: explanation.conditions || []
                });
            } else {
                // This shouldn't happen for historical moves, but handle it
                socket.emit('error', { message: 'Could not explain move' });
            }
        } catch (error) {
            console.error('Error explaining historical move:', error);
            socket.emit('error', { message: 'Failed to explain move' });
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

        // Reset game and variant state
        const { game, state: variantState } = createVariantGame(room.variant, room.variantState.positionId);
        room.game = game;
        room.variantState = variantState;

        io.to(roomId).emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: null,
            variant: room.variant,
            variantState: room.variantState
        });
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

        // Clear the draw offer
        room.drawOffer = undefined;

        // End the game as a draw with rating updates
        io.to(roomId).emit('draw_accepted', {});
        endGameAndUpdateRatings(room, roomId, '1/2-1/2', 'agreement');
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

        // Clear any pending draw offer
        room.drawOffer = undefined;

        // Determine result
        const result = playerColor === 'white' ? '0-1' : '1-0';
        const winner = playerColor === 'white' ? 'black' : 'white';

        // End the game with rating updates
        io.to(roomId).emit('player_resigned', { player: playerColor, winner });
        endGameAndUpdateRatings(room, roomId, result, 'resignation');
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

        // Reset the game and variant state (for Chess960, generate new position)
        const newPositionId = room.variant === 'chess960' ? undefined : room.variantState.positionId;
        const { game, state: variantState } = createVariantGame(room.variant, newPositionId);
        room.game = game;
        room.variantState = variantState;

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
        io.to(roomId).emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: null,
            variant: room.variant,
            variantState: room.variantState
        });
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

    // ==================== DAILY PUZZLE ====================

    // Helper function to get today's date in UTC
    function getTodayUTC(): string {
        return new Date().toISOString().split('T')[0];
    }

    // Helper function to calculate puzzle number (days since epoch)
    function calculatePuzzleNumber(dateStr: string): number {
        const date = new Date(dateStr);
        const epoch = new Date('2024-01-01');
        return Math.floor((date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Helper function to get or assign today's puzzle
    function getOrAssignDailyPuzzle(date: string): Puzzle | null {
        // Check if already assigned
        let dailyPuzzle = dbOperations.getDailyPuzzle(date);

        if (!dailyPuzzle) {
            // Generate deterministic puzzle selection based on date
            // Use a simple hash of the date string
            let hash = 0;
            for (let i = 0; i < date.length; i++) {
                const char = date.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            const puzzleIndex = Math.abs(hash) % puzzles.length;
            const selectedPuzzle = puzzles[puzzleIndex];

            // Save to database
            dbOperations.setDailyPuzzle(date, selectedPuzzle.id);
            dailyPuzzle = dbOperations.getDailyPuzzle(date);
        }

        if (!dailyPuzzle) return null;

        // Return the actual puzzle data
        return puzzles.find(p => p.id === dailyPuzzle!.puzzle_id) || null;
    }

    // Get today's daily puzzle
    socket.on('get_daily_puzzle', () => {
        const today = getTodayUTC();
        const puzzle = getOrAssignDailyPuzzle(today);

        if (!puzzle) {
            socket.emit('error', { message: 'Failed to get daily puzzle' });
            return;
        }

        // Check if user has already completed today's puzzle
        let alreadyCompleted = false;
        let completion = null;
        let streak: DailyPuzzleStreak | null = null;

        const authInfo = authenticatedSockets.get(socket.id);
        if (authInfo) {
            completion = dbOperations.getDailyPuzzleCompletion(authInfo.userId, today);
            alreadyCompleted = !!completion;
            streak = dbOperations.getDailyPuzzleStreak(authInfo.userId);
        }

        socket.emit('daily_puzzle_data', {
            puzzleNumber: calculatePuzzleNumber(today),
            date: today,
            puzzle: {
                id: puzzle.id,
                fen: puzzle.fen,
                themes: puzzle.themes,
                level: puzzle.level,
                rating: puzzle.rating,
                solutionLength: puzzle.solution.length,
                krog: puzzle.krog
            },
            alreadyCompleted,
            completion: completion ? {
                completedAt: completion.completed_at,
                timeSpentMs: completion.time_spent_ms,
                attempts: completion.attempts
            } : null,
            streak: streak ? {
                current: streak.current_streak,
                longest: streak.longest_streak,
                total: streak.total_completed
            } : { current: 0, longest: 0, total: 0 }
        });
    });

    // Check daily puzzle move
    socket.on('check_daily_puzzle_move', ({ moveIndex, move, attempts }: { moveIndex: number; move: string; attempts: number }) => {
        const today = getTodayUTC();
        const puzzle = getOrAssignDailyPuzzle(today);

        if (!puzzle) {
            socket.emit('error', { message: 'Daily puzzle not found' });
            return;
        }

        const expectedMoves = puzzle.solution[moveIndex];
        const correctMoves = Array.isArray(expectedMoves) ? expectedMoves : [expectedMoves];

        // Check if move matches (ignore +, #, and x notation differences)
        const normalizeMove = (m: string) => m.replace(/[+#x]/g, '');
        const isCorrect = correctMoves.some(cm =>
            cm === move || normalizeMove(cm) === normalizeMove(move)
        );

        if (isCorrect) {
            const isComplete = moveIndex >= puzzle.solution.length - 1;

            socket.emit('daily_puzzle_move_result', {
                correct: true,
                completed: isComplete,
                message: isComplete ? 'Puzzle solved!' : 'Correct! Keep going...',
                krog: isComplete ? puzzle.krog : undefined
            });
        } else {
            socket.emit('daily_puzzle_move_result', {
                correct: false,
                completed: false,
                message: 'Incorrect move. Try again!',
                hint: `The correct move starts with ${expectedMoves.toString().charAt(0)}...`
            });
        }
    });

    // Complete daily puzzle (record completion)
    socket.on('complete_daily_puzzle', ({ timeSpentMs, attempts }: { timeSpentMs: number; attempts: number }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            // For guests, just confirm completion without saving
            socket.emit('daily_puzzle_completed', {
                success: true,
                streak: { current: 0, longest: 0, total: 0 },
                isGuest: true
            });
            return;
        }

        const today = getTodayUTC();

        // Check if already completed
        const existing = dbOperations.getDailyPuzzleCompletion(authInfo.userId, today);
        if (existing) {
            const streak = dbOperations.getDailyPuzzleStreak(authInfo.userId);
            socket.emit('daily_puzzle_completed', {
                success: true,
                alreadyCompleted: true,
                streak: streak ? {
                    current: streak.current_streak,
                    longest: streak.longest_streak,
                    total: streak.total_completed
                } : { current: 0, longest: 0, total: 0 }
            });
            return;
        }

        // Record completion
        dbOperations.recordDailyPuzzleCompletion(authInfo.userId, today, timeSpentMs, attempts);

        // Update streak
        const updatedStreak = dbOperations.processStreakAfterCompletion(authInfo.userId, today);

        socket.emit('daily_puzzle_completed', {
            success: true,
            streak: {
                current: updatedStreak.current_streak,
                longest: updatedStreak.longest_streak,
                total: updatedStreak.total_completed
            }
        });
    });

    // Get user's daily puzzle stats
    socket.on('get_daily_puzzle_stats', () => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('daily_puzzle_stats', {
                streak: { current: 0, longest: 0, total: 0 },
                isGuest: true
            });
            return;
        }

        const streak = dbOperations.getDailyPuzzleStreak(authInfo.userId);
        const today = getTodayUTC();
        const todayCompletion = dbOperations.getDailyPuzzleCompletion(authInfo.userId, today);

        socket.emit('daily_puzzle_stats', {
            streak: streak ? {
                current: streak.current_streak,
                longest: streak.longest_streak,
                total: streak.total_completed
            } : { current: 0, longest: 0, total: 0 },
            completedToday: !!todayCompletion
        });
    });

    // Get daily puzzle leaderboard
    socket.on('get_daily_puzzle_leaderboard', ({ limit }: { limit?: number }) => {
        const leaderboard = dbOperations.getDailyPuzzleLeaderboard(limit || 20);

        socket.emit('daily_puzzle_leaderboard', {
            entries: leaderboard.map((entry, index) => ({
                rank: index + 1,
                username: entry.username,
                currentStreak: entry.current_streak,
                longestStreak: entry.longest_streak,
                totalCompleted: entry.total_completed
            }))
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

    // Handle chat messages
    socket.on('chat_message', ({ roomId, message }: { roomId: string; message: string }) => {
        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        // Check if user is in the room
        const isInRoom = room.players.white === socket.id ||
                        room.players.black === socket.id ||
                        room.players.spectators.includes(socket.id);

        if (!isInRoom) {
            socket.emit('error', { message: 'You are not in this room' });
            return;
        }

        // Get username
        const authInfo = authenticatedSockets.get(socket.id);
        const username = authInfo?.username || 'Anonymous';

        // Determine user role
        let role: 'white' | 'black' | 'spectator' = 'spectator';
        if (room.players.white === socket.id) role = 'white';
        else if (room.players.black === socket.id) role = 'black';

        // Sanitize message (limit length, trim whitespace)
        const sanitizedMessage = message.trim().slice(0, 500);

        if (!sanitizedMessage) return;

        // Broadcast to all users in room
        io.to(roomId).emit('chat_message', {
            id: `${Date.now()}-${socket.id.slice(-4)}`,
            username,
            role,
            message: sanitizedMessage,
            timestamp: Date.now()
        });
    });

    // ==================== FRIENDS ====================

    // Get friends list
    socket.on('get_friends', () => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to view friends' });
            return;
        }

        const friends = dbOperations.getFriends(authInfo.userId);
        const incomingRequests = dbOperations.getIncomingRequests(authInfo.userId);
        const outgoingRequests = dbOperations.getOutgoingRequests(authInfo.userId);

        // Add online status to friends
        const friendsWithStatus = friends.map(friend => ({
            ...friend,
            online: Array.from(authenticatedSockets.values()).some(s => s.userId === friend.id)
        }));

        socket.emit('friends_list', {
            friends: friendsWithStatus,
            incomingRequests,
            outgoingRequests
        });
    });

    // Search users
    socket.on('search_users', ({ query }: { query: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to search users' });
            return;
        }

        if (!query || query.trim().length < 2) {
            socket.emit('user_search_results', { users: [] });
            return;
        }

        const users = dbOperations.searchUsers(query.trim(), authInfo.userId);
        socket.emit('user_search_results', { users });
    });

    // Send friend request
    socket.on('send_friend_request', ({ friendId }: { friendId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to send friend requests' });
            return;
        }

        if (authInfo.userId === friendId) {
            socket.emit('error', { message: 'Cannot add yourself as a friend' });
            return;
        }

        const result = dbOperations.sendFriendRequest(authInfo.userId, friendId);
        if (result.success) {
            socket.emit('friend_request_sent', { success: true });

            // Notify the target user if they're online
            const targetSocket = Array.from(authenticatedSockets.entries())
                .find(([_, info]) => info.userId === friendId);
            if (targetSocket) {
                io.to(targetSocket[0]).emit('friend_request_received', {
                    from: { id: authInfo.userId, username: authInfo.username, rating: authInfo.rating }
                });
            }
        } else {
            socket.emit('friend_request_sent', { success: false, error: result.error });
        }
    });

    // Accept friend request
    socket.on('accept_friend_request', ({ requestId }: { requestId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to accept friend requests' });
            return;
        }

        const result = dbOperations.acceptFriendRequest(requestId, authInfo.userId);
        if (result.success) {
            socket.emit('friend_request_accepted', { success: true, requestId });
        } else {
            socket.emit('friend_request_accepted', { success: false, error: result.error });
        }
    });

    // Decline friend request
    socket.on('decline_friend_request', ({ requestId }: { requestId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to decline friend requests' });
            return;
        }

        const result = dbOperations.declineFriendRequest(requestId, authInfo.userId);
        if (result.success) {
            socket.emit('friend_request_declined', { success: true, requestId });
        } else {
            socket.emit('friend_request_declined', { success: false, error: result.error });
        }
    });

    // Remove friend
    socket.on('remove_friend', ({ friendId }: { friendId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to remove friends' });
            return;
        }

        const result = dbOperations.removeFriend(authInfo.userId, friendId);
        if (result.success) {
            socket.emit('friend_removed', { success: true, friendId });
        } else {
            socket.emit('friend_removed', { success: false, error: result.error });
        }
    });

    // ==================== CLUBS ====================

    // Create a new club
    socket.on('create_club', ({ name, description, logoEmoji, isPublic }: { name: string; description?: string; logoEmoji?: string; isPublic?: boolean }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to create clubs' });
            return;
        }

        if (!name || name.trim().length < 3) {
            socket.emit('club_created', { success: false, error: 'Club name must be at least 3 characters' });
            return;
        }

        const result = dbOperations.createClub(name.trim(), description || null, authInfo.userId, logoEmoji, isPublic);
        if (result.success && result.club) {
            socket.emit('club_created', { success: true, club: result.club });
        } else {
            socket.emit('club_created', { success: false, error: result.error });
        }
    });

    // Get user's clubs
    socket.on('get_my_clubs', () => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to view clubs' });
            return;
        }

        const clubs = dbOperations.getUserClubs(authInfo.userId);
        socket.emit('my_clubs', { clubs });
    });

    // Get public clubs
    socket.on('get_public_clubs', ({ limit, offset }: { limit?: number; offset?: number }) => {
        const clubs = dbOperations.getPublicClubs(limit || 20, offset || 0);
        socket.emit('public_clubs', { clubs });
    });

    // Search clubs
    socket.on('search_clubs', ({ query }: { query: string }) => {
        if (!query || query.trim().length < 2) {
            socket.emit('club_search_results', { clubs: [] });
            return;
        }

        const clubs = dbOperations.searchClubs(query.trim());
        socket.emit('club_search_results', { clubs });
    });

    // Get club details
    socket.on('get_club', ({ clubId }: { clubId: string }) => {
        const club = dbOperations.getClubById(clubId);
        if (!club) {
            socket.emit('error', { message: 'Club not found' });
            return;
        }

        const members = dbOperations.getClubMembers(clubId);
        const authInfo = authenticatedSockets.get(socket.id);
        const myMembership = authInfo ? dbOperations.getClubMember(clubId, authInfo.userId) : null;

        // Add online status to members
        const membersWithStatus = members.map(member => ({
            ...member,
            online: Array.from(authenticatedSockets.values()).some(s => s.userId === member.user_id)
        }));

        socket.emit('club_details', {
            club,
            members: membersWithStatus,
            myRole: myMembership?.role || null
        });
    });

    // Update club
    socket.on('update_club', ({ clubId, name, description, logoEmoji, isPublic }: { clubId: string; name?: string; description?: string; logoEmoji?: string; isPublic?: boolean }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to update clubs' });
            return;
        }

        const result = dbOperations.updateClub(clubId, authInfo.userId, { name, description, logoEmoji, isPublic });
        if (result.success) {
            const club = dbOperations.getClubById(clubId);
            socket.emit('club_updated', { success: true, club });
            // Notify all members in the club room
            io.to(`club:${clubId}`).emit('club_info_updated', { club });
        } else {
            socket.emit('club_updated', { success: false, error: result.error });
        }
    });

    // Delete club
    socket.on('delete_club', ({ clubId }: { clubId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to delete clubs' });
            return;
        }

        const result = dbOperations.deleteClub(clubId, authInfo.userId);
        if (result.success) {
            socket.emit('club_deleted', { success: true, clubId });
            // Notify all members
            io.to(`club:${clubId}`).emit('club_disbanded', { clubId });
        } else {
            socket.emit('club_deleted', { success: false, error: result.error });
        }
    });

    // Join a public club
    socket.on('join_club', ({ clubId }: { clubId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to join clubs' });
            return;
        }

        const result = dbOperations.joinClub(clubId, authInfo.userId);
        if (result.success) {
            socket.emit('club_joined', { success: true, clubId });
            // Join the club socket room for real-time updates
            socket.join(`club:${clubId}`);
            // Notify other members
            io.to(`club:${clubId}`).emit('member_joined', {
                clubId,
                member: { userId: authInfo.userId, username: authInfo.username, rating: authInfo.rating }
            });
        } else {
            socket.emit('club_joined', { success: false, error: result.error });
        }
    });

    // Leave a club
    socket.on('leave_club', ({ clubId }: { clubId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to leave clubs' });
            return;
        }

        const result = dbOperations.leaveClub(clubId, authInfo.userId);
        if (result.success) {
            socket.emit('club_left', { success: true, clubId });
            // Leave the club socket room
            socket.leave(`club:${clubId}`);
            // Notify other members
            io.to(`club:${clubId}`).emit('member_left', {
                clubId,
                userId: authInfo.userId,
                username: authInfo.username
            });
        } else {
            socket.emit('club_left', { success: false, error: result.error });
        }
    });

    // Update member role
    socket.on('update_member_role', ({ clubId, targetUserId, newRole }: { clubId: string; targetUserId: string; newRole: 'admin' | 'member' }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to update roles' });
            return;
        }

        const result = dbOperations.updateMemberRole(clubId, authInfo.userId, targetUserId, newRole);
        if (result.success) {
            socket.emit('member_role_updated', { success: true, clubId, targetUserId, newRole });
            io.to(`club:${clubId}`).emit('role_changed', {
                clubId,
                userId: targetUserId,
                newRole
            });
            // Also notify the affected user directly if they're online
            const targetSocket = Array.from(authenticatedSockets.entries())
                .find(([_, info]) => info.userId === targetUserId);
            if (targetSocket) {
                io.to(targetSocket[0]).emit('your_role_changed', {
                    clubId,
                    newRole
                });
            }
        } else {
            socket.emit('member_role_updated', { success: false, error: result.error });
        }
    });

    // Kick member
    socket.on('kick_member', ({ clubId, targetUserId }: { clubId: string; targetUserId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to kick members' });
            return;
        }

        const result = dbOperations.kickMember(clubId, authInfo.userId, targetUserId);
        if (result.success) {
            socket.emit('member_kicked', { success: true, clubId, targetUserId });
            io.to(`club:${clubId}`).emit('member_removed', {
                clubId,
                userId: targetUserId
            });
        } else {
            socket.emit('member_kicked', { success: false, error: result.error });
        }
    });

    // Send club invitation
    socket.on('invite_to_club', ({ clubId, inviteeId }: { clubId: string; inviteeId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to send invitations' });
            return;
        }

        const result = dbOperations.sendClubInvitation(clubId, authInfo.userId, inviteeId);
        if (result.success) {
            socket.emit('invitation_sent', { success: true, invitation: result.invitation });
            // Notify the invitee if online
            const inviteeSocket = Array.from(authenticatedSockets.entries())
                .find(([_, info]) => info.userId === inviteeId);
            if (inviteeSocket) {
                const club = dbOperations.getClubById(clubId);
                io.to(inviteeSocket[0]).emit('club_invitation_received', {
                    invitation: result.invitation,
                    clubName: club?.name,
                    inviterUsername: authInfo.username
                });
            }
        } else {
            socket.emit('invitation_sent', { success: false, error: result.error });
        }
    });

    // Get pending club invitations
    socket.on('get_club_invitations', () => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to view invitations' });
            return;
        }

        const invitations = dbOperations.getPendingClubInvitations(authInfo.userId);
        socket.emit('club_invitations', { invitations });
    });

    // Accept club invitation
    socket.on('accept_club_invitation', ({ invitationId }: { invitationId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to accept invitations' });
            return;
        }

        const result = dbOperations.acceptClubInvitation(invitationId, authInfo.userId);
        if (result.success) {
            socket.emit('invitation_accepted', { success: true, invitationId });
        } else {
            socket.emit('invitation_accepted', { success: false, error: result.error });
        }
    });

    // Decline club invitation
    socket.on('decline_club_invitation', ({ invitationId }: { invitationId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to decline invitations' });
            return;
        }

        const result = dbOperations.declineClubInvitation(invitationId, authInfo.userId);
        if (result.success) {
            socket.emit('invitation_declined', { success: true, invitationId });
        } else {
            socket.emit('invitation_declined', { success: false, error: result.error });
        }
    });

    // Join club chat room (for real-time messages)
    socket.on('join_club_chat', ({ clubId }: { clubId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to join club chat' });
            return;
        }

        const member = dbOperations.getClubMember(clubId, authInfo.userId);
        if (!member) {
            socket.emit('error', { message: 'Not a member of this club' });
            return;
        }

        socket.join(`club:${clubId}`);
        const messages = dbOperations.getClubMessages(clubId, 50, 0);
        socket.emit('club_chat_joined', { clubId, messages: messages.reverse() });
    });

    // Leave club chat room
    socket.on('leave_club_chat', ({ clubId }: { clubId: string }) => {
        socket.leave(`club:${clubId}`);
        socket.emit('club_chat_left', { clubId });
    });

    // Send message to club chat
    socket.on('send_club_message', ({ clubId, message }: { clubId: string; message: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to send messages' });
            return;
        }

        if (!message || message.trim().length === 0) {
            return;
        }

        const sanitizedMessage = message.trim().slice(0, 500);
        const result = dbOperations.addClubMessage(clubId, authInfo.userId, sanitizedMessage);

        if (result.success && result.message) {
            // Broadcast to all club members
            io.to(`club:${clubId}`).emit('club_message', result.message);
        } else {
            socket.emit('error', { message: result.error || 'Failed to send message' });
        }
    });

    // Get more club messages (pagination)
    socket.on('get_club_messages', ({ clubId, limit, offset }: { clubId: string; limit?: number; offset?: number }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to view messages' });
            return;
        }

        const member = dbOperations.getClubMember(clubId, authInfo.userId);
        if (!member) {
            socket.emit('error', { message: 'Not a member of this club' });
            return;
        }

        const messages = dbOperations.getClubMessages(clubId, limit || 50, offset || 0);
        socket.emit('club_messages', { clubId, messages: messages.reverse(), offset: offset || 0 });
    });

    // Delete club message (admin/owner only)
    socket.on('delete_club_message', ({ clubId, messageId }: { clubId: string; messageId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to delete messages' });
            return;
        }

        const result = dbOperations.deleteClubMessage(messageId, authInfo.userId, clubId);
        if (result.success) {
            io.to(`club:${clubId}`).emit('club_message_deleted', { clubId, messageId });
        } else {
            socket.emit('error', { message: result.error || 'Failed to delete message' });
        }
    });

    // ==================== DIRECT CHALLENGES ====================

    // Challenge a friend
    socket.on('challenge_friend', ({ friendId, timeControl: timeControlType, variant: variantType }: { friendId: string; timeControl?: TimeControlType; variant?: VariantType }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to challenge friends' });
            return;
        }

        // Find the friend's socket
        const friendSocket = Array.from(authenticatedSockets.entries())
            .find(([_, info]) => info.userId === friendId);

        if (!friendSocket) {
            socket.emit('challenge_sent', { success: false, error: 'Friend is not online' });
            return;
        }

        const timeControl = TIME_CONTROLS[timeControlType || 'rapid'];
        const variant = variantType || 'standard';

        const challengeId = `${socket.id}-${Date.now()}`;

        // Send challenge to the friend - include challenger's SOCKET ID
        io.to(friendSocket[0]).emit('challenge_received', {
            challengeId,
            from: {
                id: authInfo.userId,
                username: authInfo.username,
                rating: authInfo.rating,
                socketId: socket.id  // Include socket ID for direct communication
            },
            timeControl: timeControl.type,
            variant
        });

        socket.emit('challenge_sent', {
            success: true,
            challengeId,
            to: {
                id: friendId,
                username: friendSocket[1].username,
                rating: friendSocket[1].rating
            },
            timeControl: timeControl.type,
            variant
        });
    });

    // Accept a challenge
    socket.on('accept_challenge', ({ challengeId, challengerId, challengerSocketId: providedSocketId, timeControl: timeControlType, variant: variantType }: { challengeId: string; challengerId: string; challengerSocketId?: string; timeControl: TimeControlType; variant?: VariantType }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to accept challenges' });
            return;
        }

        // Use provided socket ID if available, otherwise fall back to lookup
        let challengerSocketId = providedSocketId;
        let challengerInfo = providedSocketId ? authenticatedSockets.get(providedSocketId) : null;

        // If socket ID not provided or not found, try to find by user ID
        if (!challengerInfo) {
            const challengerEntry = Array.from(authenticatedSockets.entries())
                .find(([_, info]) => info.userId === challengerId);
            if (challengerEntry) {
                [challengerSocketId, challengerInfo] = [challengerEntry[0], challengerEntry[1]];
            }
        }

        if (!challengerSocketId || !challengerInfo) {
            socket.emit('challenge_accepted', { success: false, error: 'Challenger is no longer online' });
            return;
        }

        // Create a room for the game
        const code = generateRoomCode();
        const timeControl = TIME_CONTROLS[timeControlType || 'rapid'];
        const variant = variantType || 'standard';

        // Randomly assign colors
        const challengerIsWhite = Math.random() < 0.5;
        const whiteSocketId = challengerIsWhite ? challengerSocketId : socket.id;
        const blackSocketId = challengerIsWhite ? socket.id : challengerSocketId;
        const whiteUserId = challengerIsWhite ? challengerInfo.userId : authInfo.userId;
        const blackUserId = challengerIsWhite ? authInfo.userId : challengerInfo.userId;

        // Create variant-specific game
        const { game, state: variantState } = createVariantGame(variant);

        const room: Room = {
            game,
            players: {
                white: whiteSocketId,
                black: blackSocketId,
                spectators: []
            },
            code,
            timeControl,
            clock: initializeClock(timeControl),
            whiteUserId,
            blackUserId,
            variant,
            variantState
        };

        // Create database game record if both players are authenticated
        const whiteUser = dbOperations.getUserById(whiteUserId);
        const blackUser = dbOperations.getUserById(blackUserId);
        const dbGame = dbOperations.createGame(
            code,
            whiteUserId,
            blackUserId,
            timeControl.type,
            whiteUser?.rating || null,
            blackUser?.rating || null
        );
        room.dbGameId = dbGame.id;

        rooms.set(code, room);
        socketToRoom.set(whiteSocketId, code);
        socketToRoom.set(blackSocketId, code);

        // Get socket references
        const whiteSocket = io.sockets.sockets.get(whiteSocketId);
        const blackSocket = io.sockets.sockets.get(blackSocketId);

        // Join both sockets to the room FIRST
        if (whiteSocket) whiteSocket.join(code);
        if (blackSocket) blackSocket.join(code);

        // Notify the challenger directly using their socket
        const challengerSocket = io.sockets.sockets.get(challengerSocketId);

        if (challengerSocket) {
            challengerSocket.emit('challenge_accepted', {
                success: true,
                roomCode: code,
                color: challengerIsWhite ? 'white' : 'black',
                opponent: { username: authInfo.username, rating: authInfo.rating },
                timeControl: timeControl.type,
                variant
            });
            challengerSocket.emit('player_assigned', { color: challengerIsWhite ? 'white' : 'black' });
        }

        // Notify the acceptor
        socket.emit('challenge_accepted', {
            success: true,
            roomCode: code,
            color: challengerIsWhite ? 'black' : 'white',
            opponent: { username: challengerInfo.username, rating: challengerInfo.rating },
            timeControl: timeControl.type,
            variant
        });
        socket.emit('player_assigned', { color: challengerIsWhite ? 'black' : 'white' });

        // Send initial game state
        io.to(code).emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: null,
            variant,
            variantState
        });
        io.to(code).emit('clock_update', {
            white: room.clock.white,
            black: room.clock.black,
            activeColor: null
        });

        console.log(`Challenge accepted: ${challengerInfo.username} vs ${authInfo.username} in room ${code}`);
    });

    // Decline a challenge
    socket.on('decline_challenge', ({ challengeId, challengerId }: { challengeId: string; challengerId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to decline challenges' });
            return;
        }

        // Find the challenger's socket
        const challengerEntry = Array.from(authenticatedSockets.entries())
            .find(([_, info]) => info.userId === challengerId);

        if (challengerEntry) {
            io.to(challengerEntry[0]).emit('challenge_declined', {
                challengeId,
                by: authInfo.username
            });
        }

        socket.emit('challenge_declined', { success: true, challengeId });
    });

    // Cancel a sent challenge
    socket.on('cancel_challenge', ({ challengeId, friendId }: { challengeId: string; friendId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to cancel challenges' });
            return;
        }

        // Find the friend's socket and notify them
        const friendSocket = Array.from(authenticatedSockets.entries())
            .find(([_, info]) => info.userId === friendId);

        if (friendSocket) {
            io.to(friendSocket[0]).emit('challenge_cancelled', {
                challengeId,
                by: authInfo.username
            });
        }

        socket.emit('challenge_cancelled', { success: true, challengeId });
    });

    // ============ Tournament Events ============

    // Create a tournament
    socket.on('create_tournament', ({ name, description, clubId, type, timeControl, maxParticipants, startTime }: {
        name: string;
        description?: string;
        clubId?: string;
        type: 'swiss' | 'round_robin' | 'knockout' | 'arena';
        timeControl: string;
        maxParticipants: number;
        startTime?: string;
    }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to create tournaments' });
            return;
        }

        // If club tournament, verify user is admin/owner
        if (clubId) {
            const member = dbOperations.getClubMember(clubId, authInfo.userId);
            if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
                socket.emit('error', { message: 'Must be club admin or owner to create club tournaments' });
                return;
            }
        }

        const result = dbOperations.createTournament(
            name,
            description || null,
            authInfo.userId,
            clubId || null,
            type,
            timeControl,
            maxParticipants,
            startTime || null
        );

        if (result.success && result.tournament) {
            socket.emit('tournament_created', { success: true, tournament: result.tournament });
            // Broadcast to all users so they can see the new tournament
            io.emit('tournaments_updated');
        } else {
            socket.emit('error', { message: result.error || 'Failed to create tournament' });
        }
    });

    // Get upcoming tournaments
    socket.on('get_upcoming_tournaments', () => {
        const tournaments = dbOperations.getUpcomingTournaments();
        socket.emit('upcoming_tournaments', { tournaments });
    });

    // Get active tournaments
    socket.on('get_active_tournaments', () => {
        const tournaments = dbOperations.getActiveTournaments();
        socket.emit('active_tournaments', { tournaments });
    });

    // Get completed tournaments
    socket.on('get_completed_tournaments', () => {
        const tournaments = dbOperations.getCompletedTournaments();
        socket.emit('completed_tournaments', { tournaments });
    });

    // Get club tournaments
    socket.on('get_club_tournaments', ({ clubId }: { clubId: string }) => {
        const tournaments = dbOperations.getClubTournaments(clubId);
        socket.emit('club_tournaments', { clubId, tournaments });
    });

    // Get user's tournaments
    socket.on('get_my_tournaments', () => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('my_tournaments', { tournaments: [] });
            return;
        }
        const tournaments = dbOperations.getUserTournaments(authInfo.userId);
        socket.emit('my_tournaments', { tournaments });
    });

    // Get tournament details
    socket.on('get_tournament', ({ tournamentId }: { tournamentId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        const tournament = dbOperations.getTournamentById(tournamentId);
        if (!tournament) {
            socket.emit('error', { message: 'Tournament not found' });
            return;
        }
        const participants = dbOperations.getTournamentParticipants(tournamentId);
        const currentRoundGames = tournament.current_round > 0
            ? dbOperations.getTournamentRoundGames(tournamentId, tournament.current_round)
            : [];
        const myGames = authInfo
            ? dbOperations.getUserTournamentGames(tournamentId, authInfo.userId)
            : [];

        const participant = authInfo ? dbOperations.getTournamentParticipant(tournamentId, authInfo.userId) : null;
        const isRegistered = participant != null;  // Use != to catch both null and undefined

        socket.emit('tournament_details', {
            tournament,
            participants,
            currentRoundGames,
            myGames,
            isRegistered
        });
    });

    // Join a tournament
    socket.on('join_tournament', ({ tournamentId }: { tournamentId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to join tournaments' });
            return;
        }

        const result = dbOperations.joinTournament(tournamentId, authInfo.userId);
        if (result.success) {
            socket.emit('tournament_joined', { success: true, tournamentId });
            // Notify all users viewing this tournament
            io.emit('tournament_participant_update', { tournamentId });
        } else {
            socket.emit('error', { message: result.error || 'Failed to join tournament' });
        }
    });

    // Leave a tournament
    socket.on('leave_tournament', ({ tournamentId }: { tournamentId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to leave tournaments' });
            return;
        }

        const result = dbOperations.leaveTournament(tournamentId, authInfo.userId);
        if (result.success) {
            socket.emit('tournament_left', { success: true, tournamentId });
            io.emit('tournament_participant_update', { tournamentId });
        } else {
            socket.emit('error', { message: result.error || 'Failed to leave tournament' });
        }
    });

    // Start a tournament (creator only)
    socket.on('start_tournament', ({ tournamentId }: { tournamentId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to start tournaments' });
            return;
        }

        const result = dbOperations.startTournament(tournamentId, authInfo.userId);
        if (result.success) {
            socket.emit('tournament_started', { success: true, tournamentId, pairings: result.pairings });
            // Notify all participants
            io.emit('tournament_round_started', {
                tournamentId,
                round: 1,
                pairings: result.pairings
            });
        } else {
            socket.emit('error', { message: result.error || 'Failed to start tournament' });
        }
    });

    // Delete a tournament (creator only, if not active)
    socket.on('delete_tournament', ({ tournamentId }: { tournamentId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to delete tournaments' });
            return;
        }

        const result = dbOperations.deleteTournament(tournamentId, authInfo.userId);
        if (result.success) {
            socket.emit('tournament_deleted', { success: true, tournamentId });
            io.emit('tournaments_updated');
        } else {
            socket.emit('error', { message: result.error || 'Failed to delete tournament' });
        }
    });

    // Join a tournament game room
    socket.on('join_tournament_game', ({ roomCode }: { roomCode: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to play tournament games' });
            return;
        }

        const tournamentGame = dbOperations.getTournamentGameByRoom(roomCode);
        if (!tournamentGame) {
            socket.emit('error', { message: 'Tournament game not found' });
            return;
        }

        // Check if user is a participant
        if (tournamentGame.white_id !== authInfo.userId && tournamentGame.black_id !== authInfo.userId) {
            socket.emit('error', { message: 'You are not a participant in this game' });
            return;
        }

        // Create room if it doesn't exist
        let room = rooms.get(roomCode);
        if (!room) {
            const tournament = dbOperations.getTournamentById(tournamentGame.tournament_id);
            const timeControl = parseTimeControlString(tournament?.time_control || '5+0');

            const newRoom: Room = {
                game: new Chess(),
                players: {
                    white: undefined,
                    black: undefined,
                    spectators: []
                },
                code: roomCode,
                timeControl,
                clock: {
                    white: timeControl.initialTime,
                    black: timeControl.initialTime,
                    lastUpdate: Date.now(),
                    activeColor: null,
                    gameStarted: false
                },
                variant: 'standard',
                variantState: { variant: 'standard' },
                whiteUserId: tournamentGame.white_id,
                blackUserId: tournamentGame.black_id,
                tournamentGameId: tournamentGame.id
            };
            rooms.set(roomCode, newRoom);
            room = newRoom;
        }

        // Assign player
        const color = tournamentGame.white_id === authInfo.userId ? 'white' : 'black';
        if (color === 'white') {
            room.players.white = socket.id;
        } else {
            room.players.black = socket.id;
        }

        socket.join(roomCode);
        socketToRoom.set(socket.id, roomCode);

        socket.emit('player_assigned', { color });
        socket.emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: null
        });
        socket.emit('clock_update', {
            white: room.clock.white,
            black: room.clock.black,
            activeColor: room.clock.activeColor
        });

        // Update game status if both players have joined
        if (room.players.white && room.players.black && tournamentGame.status === 'pending') {
            dbOperations.updateTournamentGameStatus(tournamentGame.id, 'active');
        }
    });

    // ============ League Events ============

    // Create a league
    socket.on('create_league', ({ name, description, clubId, type, format, timeControl, season, maxDivisions, pointsForWin, pointsForDraw, pointsForLoss, startDate, endDate }: {
        name: string;
        description?: string;
        clubId?: string;
        type: 'individual' | 'team';
        format: 'round_robin' | 'swiss' | 'double_round_robin';
        timeControl: string;
        season?: string;
        maxDivisions?: number;
        pointsForWin?: number;
        pointsForDraw?: number;
        pointsForLoss?: number;
        startDate?: string;
        endDate?: string;
    }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to create leagues' });
            return;
        }

        // If club league, verify user is admin/owner
        if (clubId) {
            const member = dbOperations.getClubMember(clubId, authInfo.userId);
            if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
                socket.emit('error', { message: 'Must be club admin or owner to create club leagues' });
                return;
            }
        }

        const result = dbOperations.createLeague(
            name,
            description || null,
            authInfo.userId,
            clubId || null,
            type,
            format,
            timeControl,
            season || null,
            maxDivisions || 1,
            pointsForWin ?? 3,
            pointsForDraw ?? 1,
            pointsForLoss ?? 0,
            startDate || null,
            endDate || null
        );

        if (result.success && result.league) {
            socket.emit('league_created', { success: true, league: result.league });
            io.emit('leagues_updated');
        } else {
            socket.emit('error', { message: result.error || 'Failed to create league' });
        }
    });

    // Get open leagues (registration)
    socket.on('get_open_leagues', () => {
        const leagues = dbOperations.getOpenLeagues();
        socket.emit('open_leagues', { leagues });
    });

    // Get active leagues
    socket.on('get_active_leagues', () => {
        const leagues = dbOperations.getActiveLeagues();
        socket.emit('active_leagues', { leagues });
    });

    // Get completed leagues
    socket.on('get_completed_leagues', () => {
        const leagues = dbOperations.getCompletedLeagues();
        socket.emit('completed_leagues', { leagues });
    });

    // Get club leagues
    socket.on('get_club_leagues', ({ clubId }: { clubId: string }) => {
        const leagues = dbOperations.getClubLeagues(clubId);
        socket.emit('club_leagues', { clubId, leagues });
    });

    // Get user's leagues
    socket.on('get_my_leagues', () => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('my_leagues', { leagues: [] });
            return;
        }
        const leagues = dbOperations.getUserLeagues(authInfo.userId);
        socket.emit('my_leagues', { leagues });
    });

    // Get league details
    socket.on('get_league', ({ leagueId }: { leagueId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        const league = dbOperations.getLeagueById(leagueId);
        if (!league) {
            socket.emit('error', { message: 'League not found' });
            return;
        }
        const participants = dbOperations.getLeagueParticipants(leagueId);
        const matches = dbOperations.getLeagueMatches(leagueId);
        const myMatches = authInfo
            ? dbOperations.getUserLeagueMatches(leagueId, authInfo.userId)
            : [];

        const participant = authInfo ? dbOperations.getLeagueParticipant(leagueId, authInfo.userId) : null;
        const isRegistered = participant != null;

        socket.emit('league_details', {
            league,
            participants,
            matches,
            myMatches,
            isRegistered
        });
    });

    // Get league standings by division
    socket.on('get_league_standings', ({ leagueId, division }: { leagueId: string; division?: number }) => {
        const standings = dbOperations.getLeagueStandings(leagueId, division || 1);
        socket.emit('league_standings', { leagueId, division: division || 1, standings });
    });

    // Join a league
    socket.on('join_league', ({ leagueId, division }: { leagueId: string; division?: number }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to join leagues' });
            return;
        }

        const result = dbOperations.joinLeague(leagueId, authInfo.userId, division || 1);
        if (result.success) {
            socket.emit('league_joined', { success: true, leagueId });
            io.emit('league_participant_update', { leagueId });
        } else {
            socket.emit('error', { message: result.error || 'Failed to join league' });
        }
    });

    // Leave a league
    socket.on('leave_league', ({ leagueId }: { leagueId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to leave leagues' });
            return;
        }

        const result = dbOperations.leaveLeague(leagueId, authInfo.userId);
        if (result.success) {
            socket.emit('league_left', { success: true, leagueId });
            io.emit('league_participant_update', { leagueId });
        } else {
            socket.emit('error', { message: result.error || 'Failed to leave league' });
        }
    });

    // Start a league (creator only)
    socket.on('start_league', ({ leagueId }: { leagueId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to start leagues' });
            return;
        }

        const result = dbOperations.startLeague(leagueId, authInfo.userId);
        if (result.success) {
            socket.emit('league_started', { success: true, leagueId, matches: result.matches });
            io.emit('league_fixtures_generated', {
                leagueId,
                matches: result.matches
            });
        } else {
            socket.emit('error', { message: result.error || 'Failed to start league' });
        }
    });

    // Delete a league (creator only, if not active)
    socket.on('delete_league', ({ leagueId }: { leagueId: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to delete leagues' });
            return;
        }

        const result = dbOperations.deleteLeague(leagueId, authInfo.userId);
        if (result.success) {
            socket.emit('league_deleted', { success: true, leagueId });
            io.emit('leagues_updated');
        } else {
            socket.emit('error', { message: result.error || 'Failed to delete league' });
        }
    });

    // Join a league match room
    socket.on('join_league_match', ({ roomCode }: { roomCode: string }) => {
        const authInfo = authenticatedSockets.get(socket.id);
        if (!authInfo) {
            socket.emit('error', { message: 'Must be logged in to play league matches' });
            return;
        }

        const leagueMatch = dbOperations.getLeagueMatchByRoom(roomCode);
        if (!leagueMatch) {
            socket.emit('error', { message: 'League match not found' });
            return;
        }

        // Check if user is a participant
        if (leagueMatch.home_id !== authInfo.userId && leagueMatch.away_id !== authInfo.userId) {
            socket.emit('error', { message: 'You are not a participant in this match' });
            return;
        }

        // Create room if it doesn't exist
        let room = rooms.get(roomCode);
        if (!room) {
            const league = dbOperations.getLeagueById(leagueMatch.league_id);
            const timeControl = parseTimeControlString(league?.time_control || '10+0');

            const newRoom: Room = {
                game: new Chess(),
                players: {
                    white: undefined,
                    black: undefined,
                    spectators: []
                },
                code: roomCode,
                timeControl,
                clock: {
                    white: timeControl.initialTime,
                    black: timeControl.initialTime,
                    lastUpdate: Date.now(),
                    activeColor: null,
                    gameStarted: false
                },
                variant: 'standard',
                variantState: { variant: 'standard' },
                whiteUserId: leagueMatch.home_id,  // Home plays white
                blackUserId: leagueMatch.away_id,   // Away plays black
                leagueMatchId: leagueMatch.id
            };
            rooms.set(roomCode, newRoom);
            room = newRoom;
        }

        // Assign player (home = white, away = black)
        const color = leagueMatch.home_id === authInfo.userId ? 'white' : 'black';
        if (color === 'white') {
            room.players.white = socket.id;
        } else {
            room.players.black = socket.id;
        }

        socket.join(roomCode);
        socketToRoom.set(socket.id, roomCode);

        socket.emit('player_assigned', { color });
        socket.emit('game_state', {
            pgn: room.game.pgn(),
            fen: room.game.fen(),
            lastMove: null
        });
        socket.emit('clock_update', {
            white: room.clock.white,
            black: room.clock.black,
            activeColor: room.clock.activeColor
        });

        // Update match status if both players have joined
        if (room.players.white && room.players.black && leagueMatch.status === 'scheduled') {
            dbOperations.updateLeagueMatchStatus(leagueMatch.id, 'active');
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        // Clean up authenticated socket and matchmaking queue
        const authInfo = authenticatedSockets.get(socket.id);
        if (authInfo) {
            dbOperations.removeFromQueue(authInfo.userId);
            authenticatedSockets.delete(socket.id);
        }
        dbOperations.removeFromQueueBySocket(socket.id);

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
                    // Broadcast spectator update when spectator leaves
                    broadcastSpectatorUpdate(roomCode, room);
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
