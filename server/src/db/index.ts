import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Database file location
const DB_PATH = path.join(__dirname, '../../data/krog.db');

// Initialize database
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rating INTEGER DEFAULT 1200,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  );

  -- Games table
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    room_code TEXT NOT NULL,
    white_id TEXT,
    black_id TEXT,
    pgn TEXT,
    result TEXT,
    time_control TEXT,
    white_rating_before INTEGER,
    black_rating_before INTEGER,
    white_rating_change INTEGER,
    black_rating_change INTEGER,
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    FOREIGN KEY (white_id) REFERENCES users(id),
    FOREIGN KEY (black_id) REFERENCES users(id)
  );

  -- Rating history table
  CREATE TABLE IF NOT EXISTS rating_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    rating_change INTEGER NOT NULL,
    game_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (game_id) REFERENCES games(id)
  );

  -- Matchmaking queue table
  CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    socket_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    time_control TEXT NOT NULL,
    joined_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating);
  CREATE INDEX IF NOT EXISTS idx_games_white_id ON games(white_id);
  CREATE INDEX IF NOT EXISTS idx_games_black_id ON games(black_id);
  CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
  CREATE INDEX IF NOT EXISTS idx_rating_history_user_id ON rating_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_rating ON matchmaking_queue(rating);
  CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_time_control ON matchmaking_queue(time_control);
`);

// Prepared statements
const statements = {
  // User operations
  createUser: db.prepare(`
    INSERT INTO users (id, username, email, password_hash)
    VALUES (?, ?, ?, ?)
  `),

  getUserById: db.prepare(`
    SELECT id, username, email, rating, games_played, games_won, games_drawn, games_lost, created_at, last_login
    FROM users WHERE id = ?
  `),

  getUserByUsername: db.prepare(`
    SELECT * FROM users WHERE username = ?
  `),

  getUserByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),

  updateUserRating: db.prepare(`
    UPDATE users SET rating = ? WHERE id = ?
  `),

  updateUserStats: db.prepare(`
    UPDATE users SET
      games_played = games_played + 1,
      games_won = games_won + ?,
      games_drawn = games_drawn + ?,
      games_lost = games_lost + ?
    WHERE id = ?
  `),

  updateLastLogin: db.prepare(`
    UPDATE users SET last_login = datetime('now') WHERE id = ?
  `),

  getLeaderboard: db.prepare(`
    SELECT id, username, rating, games_played, games_won
    FROM users
    ORDER BY rating DESC
    LIMIT ?
  `),

  // Game operations
  createGame: db.prepare(`
    INSERT INTO games (id, room_code, white_id, black_id, time_control, white_rating_before, black_rating_before)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),

  getGameById: db.prepare(`
    SELECT * FROM games WHERE id = ?
  `),

  getGameByRoomCode: db.prepare(`
    SELECT * FROM games WHERE room_code = ? AND ended_at IS NULL
  `),

  endGame: db.prepare(`
    UPDATE games SET
      pgn = ?,
      result = ?,
      white_rating_change = ?,
      black_rating_change = ?,
      ended_at = datetime('now')
    WHERE id = ?
  `),

  getUserGames: db.prepare(`
    SELECT g.*,
           w.username as white_username,
           b.username as black_username
    FROM games g
    LEFT JOIN users w ON g.white_id = w.id
    LEFT JOIN users b ON g.black_id = b.id
    WHERE g.white_id = ? OR g.black_id = ?
    ORDER BY g.started_at DESC
    LIMIT ? OFFSET ?
  `),

  // Rating history operations
  addRatingHistory: db.prepare(`
    INSERT INTO rating_history (id, user_id, rating, rating_change, game_id)
    VALUES (?, ?, ?, ?, ?)
  `),

  getUserRatingHistory: db.prepare(`
    SELECT * FROM rating_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `),

  // Matchmaking operations
  addToQueue: db.prepare(`
    INSERT OR REPLACE INTO matchmaking_queue (id, user_id, socket_id, rating, time_control)
    VALUES (?, ?, ?, ?, ?)
  `),

  removeFromQueue: db.prepare(`
    DELETE FROM matchmaking_queue WHERE user_id = ?
  `),

  removeFromQueueBySocket: db.prepare(`
    DELETE FROM matchmaking_queue WHERE socket_id = ?
  `),

  findMatch: db.prepare(`
    SELECT * FROM matchmaking_queue
    WHERE time_control = ? AND user_id != ? AND ABS(rating - ?) <= ?
    ORDER BY ABS(rating - ?) ASC
    LIMIT 1
  `),

  getQueuePosition: db.prepare(`
    SELECT COUNT(*) as position FROM matchmaking_queue
    WHERE time_control = ? AND joined_at <= (
      SELECT joined_at FROM matchmaking_queue WHERE user_id = ?
    )
  `)
};

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  rating: number;
  games_played: number;
  games_won: number;
  games_drawn: number;
  games_lost: number;
  created_at: string;
  last_login: string | null;
}

export interface Game {
  id: string;
  room_code: string;
  white_id: string | null;
  black_id: string | null;
  pgn: string | null;
  result: string | null;
  time_control: string | null;
  white_rating_before: number | null;
  black_rating_before: number | null;
  white_rating_change: number | null;
  black_rating_change: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface QueueEntry {
  id: string;
  user_id: string;
  socket_id: string;
  rating: number;
  time_control: string;
  joined_at: string;
}

// Database operations
export const dbOperations = {
  // User operations
  async createUser(username: string, email: string, password: string): Promise<User | null> {
    try {
      const id = uuidv4();
      const password_hash = await bcrypt.hash(password, 10);
      statements.createUser.run(id, username.toLowerCase(), email.toLowerCase(), password_hash);
      return statements.getUserById.get(id) as User;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  getUserById(id: string): User | null {
    return statements.getUserById.get(id) as User | null;
  },

  getUserByUsername(username: string): User | null {
    return statements.getUserByUsername.get(username.toLowerCase()) as User | null;
  },

  getUserByEmail(email: string): User | null {
    return statements.getUserByEmail.get(email.toLowerCase()) as User | null;
  },

  async verifyPassword(user: User & { password_hash: string }, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  },

  updateUserRating(userId: string, newRating: number): void {
    statements.updateUserRating.run(newRating, userId);
  },

  updateUserStats(userId: string, result: 'win' | 'draw' | 'loss'): void {
    const win = result === 'win' ? 1 : 0;
    const draw = result === 'draw' ? 1 : 0;
    const loss = result === 'loss' ? 1 : 0;
    statements.updateUserStats.run(win, draw, loss, userId);
  },

  updateLastLogin(userId: string): void {
    statements.updateLastLogin.run(userId);
  },

  getLeaderboard(limit: number = 100): User[] {
    return statements.getLeaderboard.all(limit) as User[];
  },

  // Game operations
  createGame(roomCode: string, whiteId: string | null, blackId: string | null, timeControl: string | null, whiteRating: number | null, blackRating: number | null): Game {
    const id = uuidv4();
    statements.createGame.run(id, roomCode, whiteId, blackId, timeControl, whiteRating, blackRating);
    return statements.getGameById.get(id) as Game;
  },

  getGameById(id: string): Game | null {
    return statements.getGameById.get(id) as Game | null;
  },

  getGameByRoomCode(roomCode: string): Game | null {
    return statements.getGameByRoomCode.get(roomCode) as Game | null;
  },

  endGame(gameId: string, pgn: string, result: string, whiteRatingChange: number, blackRatingChange: number): void {
    statements.endGame.run(pgn, result, whiteRatingChange, blackRatingChange, gameId);
  },

  getUserGames(userId: string, limit: number = 20, offset: number = 0): Game[] {
    return statements.getUserGames.all(userId, userId, limit, offset) as Game[];
  },

  // Rating history
  addRatingHistory(userId: string, rating: number, ratingChange: number, gameId: string | null): void {
    const id = uuidv4();
    statements.addRatingHistory.run(id, userId, rating, ratingChange, gameId);
  },

  getUserRatingHistory(userId: string, limit: number = 50): { rating: number; rating_change: number; created_at: string }[] {
    return statements.getUserRatingHistory.all(userId, limit) as { rating: number; rating_change: number; created_at: string }[];
  },

  // Matchmaking
  addToQueue(userId: string, socketId: string, rating: number, timeControl: string): void {
    const id = uuidv4();
    statements.addToQueue.run(id, userId, socketId, rating, timeControl);
  },

  removeFromQueue(userId: string): void {
    statements.removeFromQueue.run(userId);
  },

  removeFromQueueBySocket(socketId: string): void {
    statements.removeFromQueueBySocket.run(socketId);
  },

  findMatch(userId: string, rating: number, timeControl: string, ratingRange: number = 200): QueueEntry | null {
    return statements.findMatch.get(timeControl, userId, rating, ratingRange, rating) as QueueEntry | null;
  },

  getQueuePosition(userId: string, timeControl: string): number {
    const result = statements.getQueuePosition.get(timeControl, userId) as { position: number };
    return result?.position || 0;
  }
};

// ELO Rating calculation
export function calculateEloChange(
  playerRating: number,
  opponentRating: number,
  result: 0 | 0.5 | 1, // 0 = loss, 0.5 = draw, 1 = win
  kFactor: number = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const ratingChange = Math.round(kFactor * (result - expectedScore));
  return ratingChange;
}

// Close database on process exit
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit();
});

export default db;
