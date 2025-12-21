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

  -- Friendships table
  CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    UNIQUE(user_id, friend_id)
  );

  -- Clubs table
  CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    logo_emoji TEXT DEFAULT '♔',
    member_count INTEGER DEFAULT 1,
    is_public INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  -- Club members table
  CREATE TABLE IF NOT EXISTS club_members (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(club_id, user_id)
  );

  -- Club messages table (chat)
  CREATE TABLE IF NOT EXISTS club_messages (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Club invitations table
  CREATE TABLE IF NOT EXISTS club_invitations (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    inviter_id TEXT NOT NULL,
    invitee_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (inviter_id) REFERENCES users(id),
    FOREIGN KEY (invitee_id) REFERENCES users(id),
    UNIQUE(club_id, invitee_id)
  );

  -- Tournaments table
  CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id TEXT NOT NULL,
    club_id TEXT,
    type TEXT NOT NULL DEFAULT 'swiss',
    status TEXT NOT NULL DEFAULT 'upcoming',
    time_control TEXT NOT NULL DEFAULT '5+0',
    max_participants INTEGER DEFAULT 32,
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 0,
    start_time TEXT,
    end_time TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
  );

  -- Tournament participants table
  CREATE TABLE IF NOT EXISTS tournament_participants (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score REAL DEFAULT 0,
    buchholz REAL DEFAULT 0,
    wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    performance_rating INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    joined_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(tournament_id, user_id)
  );

  -- Tournament games table
  CREATE TABLE IF NOT EXISTS tournament_games (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    board INTEGER DEFAULT 1,
    white_id TEXT NOT NULL,
    black_id TEXT NOT NULL,
    room_code TEXT,
    result TEXT,
    white_score REAL,
    black_score REAL,
    pgn TEXT,
    status TEXT DEFAULT 'pending',
    scheduled_at TEXT,
    started_at TEXT,
    ended_at TEXT,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (white_id) REFERENCES users(id),
    FOREIGN KEY (black_id) REFERENCES users(id)
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
  CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
  CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
  CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
  CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);
  CREATE INDEX IF NOT EXISTS idx_clubs_owner_id ON clubs(owner_id);
  CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
  CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
  CREATE INDEX IF NOT EXISTS idx_club_messages_club_id ON club_messages(club_id);
  CREATE INDEX IF NOT EXISTS idx_club_invitations_club_id ON club_invitations(club_id);
  CREATE INDEX IF NOT EXISTS idx_club_invitations_invitee_id ON club_invitations(invitee_id);
  CREATE INDEX IF NOT EXISTS idx_tournaments_creator_id ON tournaments(creator_id);
  CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON tournaments(club_id);
  CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
  CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
  CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);
  CREATE INDEX IF NOT EXISTS idx_tournament_games_tournament_id ON tournament_games(tournament_id);
  CREATE INDEX IF NOT EXISTS idx_tournament_games_round ON tournament_games(round);
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
  `),

  // Friendship operations
  sendFriendRequest: db.prepare(`
    INSERT INTO friendships (id, user_id, friend_id, status)
    VALUES (?, ?, ?, 'pending')
  `),

  getFriendship: db.prepare(`
    SELECT * FROM friendships
    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
  `),

  acceptFriendRequest: db.prepare(`
    UPDATE friendships SET status = 'accepted' WHERE id = ?
  `),

  declineFriendRequest: db.prepare(`
    DELETE FROM friendships WHERE id = ?
  `),

  removeFriend: db.prepare(`
    DELETE FROM friendships
    WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
    AND status = 'accepted'
  `),

  getFriends: db.prepare(`
    SELECT u.id, u.username, u.rating, u.last_login, f.created_at as friends_since
    FROM friendships f
    JOIN users u ON (
      (f.user_id = ? AND u.id = f.friend_id) OR
      (f.friend_id = ? AND u.id = f.user_id)
    )
    WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
  `),

  getIncomingRequests: db.prepare(`
    SELECT f.id as request_id, u.id, u.username, u.rating, f.created_at
    FROM friendships f
    JOIN users u ON f.user_id = u.id
    WHERE f.friend_id = ? AND f.status = 'pending'
  `),

  getOutgoingRequests: db.prepare(`
    SELECT f.id as request_id, u.id, u.username, u.rating, f.created_at
    FROM friendships f
    JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ? AND f.status = 'pending'
  `),

  searchUsers: db.prepare(`
    SELECT id, username, rating
    FROM users
    WHERE username LIKE ? AND id != ?
    ORDER BY rating DESC
    LIMIT 20
  `),

  // Club operations
  createClub: db.prepare(`
    INSERT INTO clubs (id, name, description, owner_id, logo_emoji, is_public)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  getClubById: db.prepare(`
    SELECT * FROM clubs WHERE id = ?
  `),

  getClubByName: db.prepare(`
    SELECT * FROM clubs WHERE name = ?
  `),

  updateClub: db.prepare(`
    UPDATE clubs SET name = ?, description = ?, logo_emoji = ?, is_public = ?
    WHERE id = ?
  `),

  deleteClub: db.prepare(`
    DELETE FROM clubs WHERE id = ?
  `),

  updateClubMemberCount: db.prepare(`
    UPDATE clubs SET member_count = (
      SELECT COUNT(*) FROM club_members WHERE club_id = ?
    ) WHERE id = ?
  `),

  getPublicClubs: db.prepare(`
    SELECT c.*, u.username as owner_username
    FROM clubs c
    JOIN users u ON c.owner_id = u.id
    WHERE c.is_public = 1
    ORDER BY c.member_count DESC
    LIMIT ? OFFSET ?
  `),

  searchClubs: db.prepare(`
    SELECT c.*, u.username as owner_username
    FROM clubs c
    JOIN users u ON c.owner_id = u.id
    WHERE c.name LIKE ? AND c.is_public = 1
    ORDER BY c.member_count DESC
    LIMIT 20
  `),

  getUserClubs: db.prepare(`
    SELECT c.*, cm.role, u.username as owner_username
    FROM clubs c
    JOIN club_members cm ON c.id = cm.club_id
    JOIN users u ON c.owner_id = u.id
    WHERE cm.user_id = ?
    ORDER BY cm.joined_at DESC
  `),

  // Club member operations
  addClubMember: db.prepare(`
    INSERT INTO club_members (id, club_id, user_id, role)
    VALUES (?, ?, ?, ?)
  `),

  removeClubMember: db.prepare(`
    DELETE FROM club_members WHERE club_id = ? AND user_id = ?
  `),

  getClubMember: db.prepare(`
    SELECT cm.*, u.username, u.rating
    FROM club_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.club_id = ? AND cm.user_id = ?
  `),

  getClubMembers: db.prepare(`
    SELECT cm.*, u.username, u.rating
    FROM club_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.club_id = ?
    ORDER BY
      CASE cm.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        ELSE 3
      END,
      cm.joined_at ASC
  `),

  updateMemberRole: db.prepare(`
    UPDATE club_members SET role = ? WHERE club_id = ? AND user_id = ?
  `),

  // Club message operations
  addClubMessage: db.prepare(`
    INSERT INTO club_messages (id, club_id, user_id, message)
    VALUES (?, ?, ?, ?)
  `),

  getClubMessages: db.prepare(`
    SELECT cm.*, u.username
    FROM club_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.club_id = ?
    ORDER BY cm.created_at DESC
    LIMIT ? OFFSET ?
  `),

  deleteClubMessage: db.prepare(`
    DELETE FROM club_messages WHERE id = ?
  `),

  // Club invitation operations
  createClubInvitation: db.prepare(`
    INSERT INTO club_invitations (id, club_id, inviter_id, invitee_id)
    VALUES (?, ?, ?, ?)
  `),

  getClubInvitation: db.prepare(`
    SELECT * FROM club_invitations WHERE club_id = ? AND invitee_id = ?
  `),

  getPendingInvitation: db.prepare(`
    SELECT ci.*, c.name as club_name, u.username as inviter_username
    FROM club_invitations ci
    JOIN clubs c ON ci.club_id = c.id
    JOIN users u ON ci.inviter_id = u.id
    WHERE ci.invitee_id = ? AND ci.status = 'pending'
  `),

  updateInvitationStatus: db.prepare(`
    UPDATE club_invitations SET status = ? WHERE id = ?
  `),

  deleteClubInvitation: db.prepare(`
    DELETE FROM club_invitations WHERE id = ?
  `),

  // Tournament operations
  createTournament: db.prepare(`
    INSERT INTO tournaments (id, name, description, creator_id, club_id, type, time_control, max_participants, start_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getTournamentById: db.prepare(`
    SELECT t.*, u.username as creator_username, c.name as club_name
    FROM tournaments t
    JOIN users u ON t.creator_id = u.id
    LEFT JOIN clubs c ON t.club_id = c.id
    WHERE t.id = ?
  `),

  updateTournament: db.prepare(`
    UPDATE tournaments SET name = ?, description = ?, type = ?, time_control = ?, max_participants = ?, start_time = ?
    WHERE id = ?
  `),

  updateTournamentStatus: db.prepare(`
    UPDATE tournaments SET status = ?, current_round = ?, total_rounds = ?, end_time = ?
    WHERE id = ?
  `),

  deleteTournament: db.prepare(`
    DELETE FROM tournaments WHERE id = ?
  `),

  getUpcomingTournaments: db.prepare(`
    SELECT t.*, u.username as creator_username, c.name as club_name,
           (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
    FROM tournaments t
    JOIN users u ON t.creator_id = u.id
    LEFT JOIN clubs c ON t.club_id = c.id
    WHERE t.status = 'upcoming'
    ORDER BY t.start_time ASC
    LIMIT ? OFFSET ?
  `),

  getActiveTournaments: db.prepare(`
    SELECT t.*, u.username as creator_username, c.name as club_name,
           (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
    FROM tournaments t
    JOIN users u ON t.creator_id = u.id
    LEFT JOIN clubs c ON t.club_id = c.id
    WHERE t.status = 'active'
    ORDER BY t.start_time DESC
    LIMIT ? OFFSET ?
  `),

  getCompletedTournaments: db.prepare(`
    SELECT t.*, u.username as creator_username, c.name as club_name,
           (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
    FROM tournaments t
    JOIN users u ON t.creator_id = u.id
    LEFT JOIN clubs c ON t.club_id = c.id
    WHERE t.status = 'completed'
    ORDER BY t.end_time DESC
    LIMIT ? OFFSET ?
  `),

  getClubTournaments: db.prepare(`
    SELECT t.*, u.username as creator_username,
           (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
    FROM tournaments t
    JOIN users u ON t.creator_id = u.id
    WHERE t.club_id = ?
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `),

  getUserTournaments: db.prepare(`
    SELECT t.*, u.username as creator_username, c.name as club_name, tp.score, tp.status as participant_status
    FROM tournament_participants tp
    JOIN tournaments t ON tp.tournament_id = t.id
    JOIN users u ON t.creator_id = u.id
    LEFT JOIN clubs c ON t.club_id = c.id
    WHERE tp.user_id = ?
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `),

  // Tournament participant operations
  addTournamentParticipant: db.prepare(`
    INSERT INTO tournament_participants (id, tournament_id, user_id)
    VALUES (?, ?, ?)
  `),

  removeTournamentParticipant: db.prepare(`
    DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?
  `),

  getTournamentParticipant: db.prepare(`
    SELECT tp.*, u.username, u.rating
    FROM tournament_participants tp
    JOIN users u ON tp.user_id = u.id
    WHERE tp.tournament_id = ? AND tp.user_id = ?
  `),

  getTournamentParticipants: db.prepare(`
    SELECT tp.*, u.username, u.rating
    FROM tournament_participants tp
    JOIN users u ON tp.user_id = u.id
    WHERE tp.tournament_id = ?
    ORDER BY tp.score DESC, tp.buchholz DESC, u.rating DESC
  `),

  updateParticipantScore: db.prepare(`
    UPDATE tournament_participants
    SET score = ?, buchholz = ?, wins = ?, draws = ?, losses = ?, performance_rating = ?
    WHERE tournament_id = ? AND user_id = ?
  `),

  updateParticipantStatus: db.prepare(`
    UPDATE tournament_participants SET status = ? WHERE tournament_id = ? AND user_id = ?
  `),

  // Tournament game operations
  createTournamentGame: db.prepare(`
    INSERT INTO tournament_games (id, tournament_id, round, board, white_id, black_id, room_code, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `),

  getTournamentGame: db.prepare(`
    SELECT tg.*, w.username as white_username, b.username as black_username
    FROM tournament_games tg
    JOIN users w ON tg.white_id = w.id
    JOIN users b ON tg.black_id = b.id
    WHERE tg.id = ?
  `),

  getTournamentGameByRoom: db.prepare(`
    SELECT tg.*, w.username as white_username, b.username as black_username
    FROM tournament_games tg
    JOIN users w ON tg.white_id = w.id
    JOIN users b ON tg.black_id = b.id
    WHERE tg.room_code = ?
  `),

  getTournamentRoundGames: db.prepare(`
    SELECT tg.*, w.username as white_username, b.username as black_username, w.rating as white_rating, b.rating as black_rating
    FROM tournament_games tg
    JOIN users w ON tg.white_id = w.id
    JOIN users b ON tg.black_id = b.id
    WHERE tg.tournament_id = ? AND tg.round = ?
    ORDER BY tg.board ASC
  `),

  getUserTournamentGames: db.prepare(`
    SELECT tg.*, w.username as white_username, b.username as black_username
    FROM tournament_games tg
    JOIN users w ON tg.white_id = w.id
    JOIN users b ON tg.black_id = b.id
    WHERE tg.tournament_id = ? AND (tg.white_id = ? OR tg.black_id = ?)
    ORDER BY tg.round ASC
  `),

  updateTournamentGameStatus: db.prepare(`
    UPDATE tournament_games SET status = ?, started_at = datetime('now') WHERE id = ?
  `),

  updateTournamentGameResult: db.prepare(`
    UPDATE tournament_games
    SET result = ?, white_score = ?, black_score = ?, pgn = ?, status = 'completed', ended_at = datetime('now')
    WHERE id = ?
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

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface Friend {
  id: string;
  username: string;
  rating: number;
  last_login: string | null;
  friends_since: string;
}

export interface FriendRequest {
  request_id: string;
  id: string;
  username: string;
  rating: number;
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  logo_emoji: string;
  member_count: number;
  is_public: boolean;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  username?: string;
  rating?: number;
}

export interface ClubMessage {
  id: string;
  club_id: string;
  user_id: string;
  message: string;
  created_at: string;
  username?: string;
}

export interface ClubInvitation {
  id: string;
  club_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  club_name?: string;
  inviter_username?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  club_id: string | null;
  type: 'swiss' | 'round_robin' | 'knockout' | 'arena';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  time_control: string;
  max_participants: number;
  current_round: number;
  total_rounds: number;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  creator_username?: string;
  club_name?: string;
  participant_count?: number;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  score: number;
  buchholz: number;
  wins: number;
  draws: number;
  losses: number;
  performance_rating: number;
  status: 'active' | 'withdrawn' | 'disqualified';
  joined_at: string;
  username?: string;
  rating?: number;
}

export interface TournamentGame {
  id: string;
  tournament_id: string;
  round: number;
  board: number;
  white_id: string;
  black_id: string;
  room_code: string | null;
  result: string | null;
  white_score: number | null;
  black_score: number | null;
  pgn: string | null;
  status: 'pending' | 'active' | 'completed' | 'forfeit';
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  white_username?: string;
  black_username?: string;
  white_rating?: number;
  black_rating?: number;
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
  },

  // Friendship operations
  sendFriendRequest(userId: string, friendId: string): { success: boolean; error?: string; requestId?: string } {
    try {
      // Check if friendship already exists
      const existing = statements.getFriendship.get(userId, friendId, userId, friendId) as Friendship | null;
      if (existing) {
        if (existing.status === 'accepted') {
          return { success: false, error: 'Already friends' };
        }
        if (existing.user_id === userId) {
          return { success: false, error: 'Friend request already sent' };
        }
        // If they sent us a request, auto-accept it
        statements.acceptFriendRequest.run(existing.id);
        return { success: true, requestId: existing.id };
      }
      const id = uuidv4();
      statements.sendFriendRequest.run(id, userId, friendId);
      return { success: true, requestId: id };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  },

  acceptFriendRequest(requestId: string, userId: string): { success: boolean; error?: string } {
    try {
      // Verify the request is for this user
      const request = db.prepare('SELECT * FROM friendships WHERE id = ? AND friend_id = ? AND status = ?').get(requestId, userId, 'pending') as Friendship | null;
      if (!request) {
        return { success: false, error: 'Friend request not found' };
      }
      statements.acceptFriendRequest.run(requestId);
      return { success: true };
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return { success: false, error: 'Failed to accept friend request' };
    }
  },

  declineFriendRequest(requestId: string, userId: string): { success: boolean; error?: string } {
    try {
      // Verify the request is for this user (either as sender or receiver)
      const request = db.prepare('SELECT * FROM friendships WHERE id = ? AND (friend_id = ? OR user_id = ?) AND status = ?').get(requestId, userId, userId, 'pending') as Friendship | null;
      if (!request) {
        return { success: false, error: 'Friend request not found' };
      }
      statements.declineFriendRequest.run(requestId);
      return { success: true };
    } catch (error) {
      console.error('Error declining friend request:', error);
      return { success: false, error: 'Failed to decline friend request' };
    }
  },

  removeFriend(userId: string, friendId: string): { success: boolean; error?: string } {
    try {
      const result = statements.removeFriend.run(userId, friendId, userId, friendId);
      if (result.changes === 0) {
        return { success: false, error: 'Friend not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, error: 'Failed to remove friend' };
    }
  },

  getFriends(userId: string): Friend[] {
    return statements.getFriends.all(userId, userId, userId, userId) as Friend[];
  },

  getIncomingRequests(userId: string): FriendRequest[] {
    return statements.getIncomingRequests.all(userId) as FriendRequest[];
  },

  getOutgoingRequests(userId: string): FriendRequest[] {
    return statements.getOutgoingRequests.all(userId) as FriendRequest[];
  },

  searchUsers(query: string, excludeUserId: string): { id: string; username: string; rating: number }[] {
    const searchQuery = `%${query.toLowerCase()}%`;
    return statements.searchUsers.all(searchQuery, excludeUserId) as { id: string; username: string; rating: number }[];
  },

  // Club operations
  createClub(name: string, description: string | null, ownerId: string, logoEmoji: string = '♔', isPublic: boolean = true): { success: boolean; club?: Club; error?: string } {
    try {
      const id = uuidv4();
      statements.createClub.run(id, name, description, ownerId, logoEmoji, isPublic ? 1 : 0);
      // Add owner as first member
      const memberId = uuidv4();
      statements.addClubMember.run(memberId, id, ownerId, 'owner');
      const club = statements.getClubById.get(id) as Club;
      return { success: true, club };
    } catch (error: unknown) {
      console.error('Error creating club:', error);
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return { success: false, error: 'Club name already exists' };
      }
      return { success: false, error: 'Failed to create club' };
    }
  },

  getClubById(id: string): Club | null {
    return statements.getClubById.get(id) as Club | null;
  },

  getClubByName(name: string): Club | null {
    return statements.getClubByName.get(name) as Club | null;
  },

  updateClub(clubId: string, userId: string, updates: { name?: string; description?: string; logoEmoji?: string; isPublic?: boolean }): { success: boolean; error?: string } {
    try {
      const member = statements.getClubMember.get(clubId, userId) as ClubMember | null;
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return { success: false, error: 'Not authorized to update club' };
      }
      const club = statements.getClubById.get(clubId) as Club | null;
      if (!club) {
        return { success: false, error: 'Club not found' };
      }
      statements.updateClub.run(
        updates.name ?? club.name,
        updates.description ?? club.description,
        updates.logoEmoji ?? club.logo_emoji,
        updates.isPublic !== undefined ? (updates.isPublic ? 1 : 0) : (club.is_public ? 1 : 0),
        clubId
      );
      return { success: true };
    } catch (error: unknown) {
      console.error('Error updating club:', error);
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return { success: false, error: 'Club name already exists' };
      }
      return { success: false, error: 'Failed to update club' };
    }
  },

  deleteClub(clubId: string, userId: string): { success: boolean; error?: string } {
    try {
      const member = statements.getClubMember.get(clubId, userId) as ClubMember | null;
      if (!member || member.role !== 'owner') {
        return { success: false, error: 'Only the owner can delete the club' };
      }
      statements.deleteClub.run(clubId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting club:', error);
      return { success: false, error: 'Failed to delete club' };
    }
  },

  getPublicClubs(limit: number = 20, offset: number = 0): (Club & { owner_username: string })[] {
    return statements.getPublicClubs.all(limit, offset) as (Club & { owner_username: string })[];
  },

  searchClubs(query: string): (Club & { owner_username: string })[] {
    const searchQuery = `%${query}%`;
    return statements.searchClubs.all(searchQuery) as (Club & { owner_username: string })[];
  },

  getUserClubs(userId: string): (Club & { role: string; owner_username: string })[] {
    return statements.getUserClubs.all(userId) as (Club & { role: string; owner_username: string })[];
  },

  // Club member operations
  joinClub(clubId: string, userId: string): { success: boolean; error?: string } {
    try {
      const club = statements.getClubById.get(clubId) as Club | null;
      if (!club) {
        return { success: false, error: 'Club not found' };
      }
      if (!club.is_public) {
        return { success: false, error: 'Club is private, invitation required' };
      }
      const existing = statements.getClubMember.get(clubId, userId) as ClubMember | null;
      if (existing) {
        return { success: false, error: 'Already a member' };
      }
      const id = uuidv4();
      statements.addClubMember.run(id, clubId, userId, 'member');
      statements.updateClubMemberCount.run(clubId, clubId);
      return { success: true };
    } catch (error) {
      console.error('Error joining club:', error);
      return { success: false, error: 'Failed to join club' };
    }
  },

  leaveClub(clubId: string, userId: string): { success: boolean; error?: string } {
    try {
      const member = statements.getClubMember.get(clubId, userId) as ClubMember | null;
      if (!member) {
        return { success: false, error: 'Not a member' };
      }
      if (member.role === 'owner') {
        return { success: false, error: 'Owner cannot leave, transfer ownership or delete club' };
      }
      statements.removeClubMember.run(clubId, userId);
      statements.updateClubMemberCount.run(clubId, clubId);
      return { success: true };
    } catch (error) {
      console.error('Error leaving club:', error);
      return { success: false, error: 'Failed to leave club' };
    }
  },

  getClubMember(clubId: string, userId: string): ClubMember | null {
    return statements.getClubMember.get(clubId, userId) as ClubMember | null;
  },

  getClubMembers(clubId: string): ClubMember[] {
    return statements.getClubMembers.all(clubId) as ClubMember[];
  },

  updateMemberRole(clubId: string, userId: string, targetUserId: string, newRole: 'admin' | 'member'): { success: boolean; error?: string } {
    try {
      const member = statements.getClubMember.get(clubId, userId) as ClubMember | null;
      if (!member || member.role !== 'owner') {
        return { success: false, error: 'Only the owner can change roles' };
      }
      const target = statements.getClubMember.get(clubId, targetUserId) as ClubMember | null;
      if (!target) {
        return { success: false, error: 'Member not found' };
      }
      if (target.role === 'owner') {
        return { success: false, error: 'Cannot change owner role' };
      }
      statements.updateMemberRole.run(newRole, clubId, targetUserId);
      return { success: true };
    } catch (error) {
      console.error('Error updating member role:', error);
      return { success: false, error: 'Failed to update role' };
    }
  },

  kickMember(clubId: string, userId: string, targetUserId: string): { success: boolean; error?: string } {
    try {
      const member = statements.getClubMember.get(clubId, userId) as ClubMember | null;
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return { success: false, error: 'Not authorized to kick members' };
      }
      const target = statements.getClubMember.get(clubId, targetUserId) as ClubMember | null;
      if (!target) {
        return { success: false, error: 'Member not found' };
      }
      if (target.role === 'owner') {
        return { success: false, error: 'Cannot kick the owner' };
      }
      if (target.role === 'admin' && member.role !== 'owner') {
        return { success: false, error: 'Only owner can kick admins' };
      }
      statements.removeClubMember.run(clubId, targetUserId);
      statements.updateClubMemberCount.run(clubId, clubId);
      return { success: true };
    } catch (error) {
      console.error('Error kicking member:', error);
      return { success: false, error: 'Failed to kick member' };
    }
  },

  // Club message operations
  addClubMessage(clubId: string, userId: string, message: string): { success: boolean; message?: ClubMessage; error?: string } {
    try {
      const member = statements.getClubMember.get(clubId, userId) as ClubMember | null;
      if (!member) {
        return { success: false, error: 'Not a member of this club' };
      }
      const id = uuidv4();
      statements.addClubMessage.run(id, clubId, userId, message);
      const user = statements.getUserById.get(userId) as User;
      return {
        success: true,
        message: {
          id,
          club_id: clubId,
          user_id: userId,
          message,
          created_at: new Date().toISOString(),
          username: user?.username
        }
      };
    } catch (error) {
      console.error('Error adding club message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  },

  getClubMessages(clubId: string, limit: number = 50, offset: number = 0): ClubMessage[] {
    return statements.getClubMessages.all(clubId, limit, offset) as ClubMessage[];
  },

  deleteClubMessage(messageId: string, userId: string, clubId: string): { success: boolean; error?: string } {
    try {
      const member = statements.getClubMember.get(clubId, userId) as ClubMember | null;
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return { success: false, error: 'Not authorized to delete messages' };
      }
      statements.deleteClubMessage.run(messageId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: 'Failed to delete message' };
    }
  },

  // Club invitation operations
  sendClubInvitation(clubId: string, inviterId: string, inviteeId: string): { success: boolean; invitation?: ClubInvitation; error?: string } {
    try {
      const member = statements.getClubMember.get(clubId, inviterId) as ClubMember | null;
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return { success: false, error: 'Not authorized to send invitations' };
      }
      const existingMember = statements.getClubMember.get(clubId, inviteeId) as ClubMember | null;
      if (existingMember) {
        return { success: false, error: 'User is already a member' };
      }
      const existingInvite = statements.getClubInvitation.get(clubId, inviteeId) as ClubInvitation | null;
      if (existingInvite && existingInvite.status === 'pending') {
        return { success: false, error: 'Invitation already pending' };
      }
      const id = uuidv4();
      statements.createClubInvitation.run(id, clubId, inviterId, inviteeId);
      return {
        success: true,
        invitation: {
          id,
          club_id: clubId,
          inviter_id: inviterId,
          invitee_id: inviteeId,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error sending club invitation:', error);
      return { success: false, error: 'Failed to send invitation' };
    }
  },

  getPendingClubInvitations(userId: string): ClubInvitation[] {
    return statements.getPendingInvitation.all(userId) as ClubInvitation[];
  },

  acceptClubInvitation(invitationId: string, userId: string): { success: boolean; error?: string } {
    try {
      const invitation = db.prepare('SELECT * FROM club_invitations WHERE id = ? AND invitee_id = ? AND status = ?').get(invitationId, userId, 'pending') as ClubInvitation | null;
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }
      // Add as member
      const memberId = uuidv4();
      statements.addClubMember.run(memberId, invitation.club_id, userId, 'member');
      statements.updateClubMemberCount.run(invitation.club_id, invitation.club_id);
      // Update invitation status
      statements.updateInvitationStatus.run('accepted', invitationId);
      return { success: true };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  },

  declineClubInvitation(invitationId: string, userId: string): { success: boolean; error?: string } {
    try {
      const invitation = db.prepare('SELECT * FROM club_invitations WHERE id = ? AND invitee_id = ? AND status = ?').get(invitationId, userId, 'pending') as ClubInvitation | null;
      if (!invitation) {
        return { success: false, error: 'Invitation not found' };
      }
      statements.updateInvitationStatus.run('declined', invitationId);
      return { success: true };
    } catch (error) {
      console.error('Error declining invitation:', error);
      return { success: false, error: 'Failed to decline invitation' };
    }
  },

  // Tournament operations
  createTournament(
    name: string,
    description: string | null,
    creatorId: string,
    clubId: string | null,
    type: 'swiss' | 'round_robin' | 'knockout' | 'arena',
    timeControl: string,
    maxParticipants: number,
    startTime: string | null
  ): { success: boolean; tournament?: Tournament; error?: string } {
    try {
      const id = uuidv4();
      statements.createTournament.run(id, name, description, creatorId, clubId, type, timeControl, maxParticipants, startTime);
      // Creator automatically joins
      const participantId = uuidv4();
      statements.addTournamentParticipant.run(participantId, id, creatorId);
      const tournament = statements.getTournamentById.get(id) as Tournament;
      return { success: true, tournament };
    } catch (error) {
      console.error('Error creating tournament:', error);
      return { success: false, error: 'Failed to create tournament' };
    }
  },

  getTournamentById(id: string): Tournament | null {
    return statements.getTournamentById.get(id) as Tournament | null;
  },

  updateTournament(
    tournamentId: string,
    userId: string,
    updates: { name?: string; description?: string; type?: string; timeControl?: string; maxParticipants?: number; startTime?: string }
  ): { success: boolean; error?: string } {
    try {
      const tournament = statements.getTournamentById.get(tournamentId) as Tournament | null;
      if (!tournament) {
        return { success: false, error: 'Tournament not found' };
      }
      if (tournament.creator_id !== userId) {
        return { success: false, error: 'Only the creator can update the tournament' };
      }
      if (tournament.status !== 'upcoming') {
        return { success: false, error: 'Cannot update an active or completed tournament' };
      }
      statements.updateTournament.run(
        updates.name ?? tournament.name,
        updates.description ?? tournament.description,
        updates.type ?? tournament.type,
        updates.timeControl ?? tournament.time_control,
        updates.maxParticipants ?? tournament.max_participants,
        updates.startTime ?? tournament.start_time,
        tournamentId
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating tournament:', error);
      return { success: false, error: 'Failed to update tournament' };
    }
  },

  deleteTournament(tournamentId: string, userId: string): { success: boolean; error?: string } {
    try {
      const tournament = statements.getTournamentById.get(tournamentId) as Tournament | null;
      if (!tournament) {
        return { success: false, error: 'Tournament not found' };
      }
      if (tournament.creator_id !== userId) {
        return { success: false, error: 'Only the creator can delete the tournament' };
      }
      if (tournament.status === 'active') {
        return { success: false, error: 'Cannot delete an active tournament' };
      }
      statements.deleteTournament.run(tournamentId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting tournament:', error);
      return { success: false, error: 'Failed to delete tournament' };
    }
  },

  getUpcomingTournaments(limit: number = 20, offset: number = 0): Tournament[] {
    return statements.getUpcomingTournaments.all(limit, offset) as Tournament[];
  },

  getActiveTournaments(limit: number = 20, offset: number = 0): Tournament[] {
    return statements.getActiveTournaments.all(limit, offset) as Tournament[];
  },

  getCompletedTournaments(limit: number = 20, offset: number = 0): Tournament[] {
    return statements.getCompletedTournaments.all(limit, offset) as Tournament[];
  },

  getClubTournaments(clubId: string, limit: number = 20, offset: number = 0): Tournament[] {
    return statements.getClubTournaments.all(clubId, limit, offset) as Tournament[];
  },

  getUserTournaments(userId: string, limit: number = 20, offset: number = 0): Tournament[] {
    return statements.getUserTournaments.all(userId, limit, offset) as Tournament[];
  },

  // Tournament participant operations
  joinTournament(tournamentId: string, userId: string): { success: boolean; error?: string } {
    try {
      const tournament = statements.getTournamentById.get(tournamentId) as Tournament | null;
      if (!tournament) {
        return { success: false, error: 'Tournament not found' };
      }
      if (tournament.status !== 'upcoming') {
        return { success: false, error: 'Tournament is not open for registration' };
      }
      const existing = statements.getTournamentParticipant.get(tournamentId, userId) as TournamentParticipant | null;
      if (existing) {
        return { success: false, error: 'Already registered for this tournament' };
      }
      const participants = statements.getTournamentParticipants.all(tournamentId) as TournamentParticipant[];
      if (participants.length >= tournament.max_participants) {
        return { success: false, error: 'Tournament is full' };
      }
      const id = uuidv4();
      statements.addTournamentParticipant.run(id, tournamentId, userId);
      return { success: true };
    } catch (error) {
      console.error('Error joining tournament:', error);
      return { success: false, error: 'Failed to join tournament' };
    }
  },

  leaveTournament(tournamentId: string, userId: string): { success: boolean; error?: string } {
    try {
      const tournament = statements.getTournamentById.get(tournamentId) as Tournament | null;
      if (!tournament) {
        return { success: false, error: 'Tournament not found' };
      }
      if (tournament.creator_id === userId) {
        return { success: false, error: 'Creator cannot leave, delete the tournament instead' };
      }
      const participant = statements.getTournamentParticipant.get(tournamentId, userId) as TournamentParticipant | null;
      if (!participant) {
        return { success: false, error: 'Not registered for this tournament' };
      }
      if (tournament.status === 'active') {
        // Mark as withdrawn instead of deleting
        statements.updateParticipantStatus.run('withdrawn', tournamentId, userId);
      } else {
        statements.removeTournamentParticipant.run(tournamentId, userId);
      }
      return { success: true };
    } catch (error) {
      console.error('Error leaving tournament:', error);
      return { success: false, error: 'Failed to leave tournament' };
    }
  },

  getTournamentParticipant(tournamentId: string, userId: string): TournamentParticipant | null {
    return statements.getTournamentParticipant.get(tournamentId, userId) as TournamentParticipant | null;
  },

  getTournamentParticipants(tournamentId: string): TournamentParticipant[] {
    return statements.getTournamentParticipants.all(tournamentId) as TournamentParticipant[];
  },

  updateParticipantScore(
    tournamentId: string,
    userId: string,
    score: number,
    buchholz: number,
    wins: number,
    draws: number,
    losses: number,
    performanceRating: number
  ): void {
    statements.updateParticipantScore.run(score, buchholz, wins, draws, losses, performanceRating, tournamentId, userId);
  },

  // Tournament game operations
  createTournamentGame(
    tournamentId: string,
    round: number,
    board: number,
    whiteId: string,
    blackId: string,
    roomCode: string
  ): TournamentGame | null {
    try {
      const id = uuidv4();
      statements.createTournamentGame.run(id, tournamentId, round, board, whiteId, blackId, roomCode);
      return statements.getTournamentGame.get(id) as TournamentGame;
    } catch (error) {
      console.error('Error creating tournament game:', error);
      return null;
    }
  },

  getTournamentGame(gameId: string): TournamentGame | null {
    return statements.getTournamentGame.get(gameId) as TournamentGame | null;
  },

  getTournamentGameByRoom(roomCode: string): TournamentGame | null {
    return statements.getTournamentGameByRoom.get(roomCode) as TournamentGame | null;
  },

  getTournamentRoundGames(tournamentId: string, round: number): TournamentGame[] {
    return statements.getTournamentRoundGames.all(tournamentId, round) as TournamentGame[];
  },

  getUserTournamentGames(tournamentId: string, userId: string): TournamentGame[] {
    return statements.getUserTournamentGames.all(tournamentId, userId, userId) as TournamentGame[];
  },

  updateTournamentGameStatus(gameId: string, status: 'active' | 'completed' | 'forfeit'): void {
    statements.updateTournamentGameStatus.run(status, gameId);
  },

  updateTournamentGameResult(
    gameId: string,
    result: string,
    whiteScore: number,
    blackScore: number,
    pgn: string
  ): void {
    statements.updateTournamentGameResult.run(result, whiteScore, blackScore, pgn, gameId);
  },

  // Start a tournament and generate pairings
  startTournament(tournamentId: string, userId: string): { success: boolean; error?: string; pairings?: TournamentGame[] } {
    try {
      const tournament = statements.getTournamentById.get(tournamentId) as Tournament | null;
      if (!tournament) {
        return { success: false, error: 'Tournament not found' };
      }
      if (tournament.creator_id !== userId) {
        return { success: false, error: 'Only the creator can start the tournament' };
      }
      if (tournament.status !== 'upcoming') {
        return { success: false, error: 'Tournament is not in upcoming status' };
      }
      const participants = statements.getTournamentParticipants.all(tournamentId) as TournamentParticipant[];
      if (participants.length < 2) {
        return { success: false, error: 'Need at least 2 participants to start' };
      }

      // Calculate total rounds based on type
      let totalRounds = 0;
      if (tournament.type === 'swiss') {
        totalRounds = Math.ceil(Math.log2(participants.length));
      } else if (tournament.type === 'round_robin') {
        totalRounds = participants.length - 1;
      } else if (tournament.type === 'knockout') {
        totalRounds = Math.ceil(Math.log2(participants.length));
      } else {
        totalRounds = 1; // Arena is time-based, not round-based
      }

      // Update tournament status
      statements.updateTournamentStatus.run('active', 1, totalRounds, null, tournamentId);

      // Generate first round pairings
      const pairings = this.generatePairings(tournamentId, 1, participants);

      return { success: true, pairings };
    } catch (error) {
      console.error('Error starting tournament:', error);
      return { success: false, error: 'Failed to start tournament' };
    }
  },

  // Generate pairings for a round
  generatePairings(tournamentId: string, round: number, participants: TournamentParticipant[]): TournamentGame[] {
    const games: TournamentGame[] = [];
    const activePlayers = participants.filter(p => p.status === 'active');

    // Shuffle for first round, sort by score for subsequent rounds
    if (round === 1) {
      for (let i = activePlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activePlayers[i], activePlayers[j]] = [activePlayers[j], activePlayers[i]];
      }
    } else {
      activePlayers.sort((a, b) => b.score - a.score || b.buchholz - a.buchholz);
    }

    // Create pairings
    let board = 1;
    for (let i = 0; i < activePlayers.length - 1; i += 2) {
      const roomCode = `T${tournamentId.substring(0, 6).toUpperCase()}R${round}B${board}`;
      const game = this.createTournamentGame(
        tournamentId,
        round,
        board,
        activePlayers[i].user_id,
        activePlayers[i + 1].user_id,
        roomCode
      );
      if (game) {
        games.push(game);
      }
      board++;
    }

    // Handle bye for odd number of players
    if (activePlayers.length % 2 === 1) {
      const byePlayer = activePlayers[activePlayers.length - 1];
      // Give bye (1 point)
      const participant = statements.getTournamentParticipant.get(tournamentId, byePlayer.user_id) as TournamentParticipant;
      statements.updateParticipantScore.run(
        participant.score + 1,
        participant.buchholz,
        participant.wins + 1,
        participant.draws,
        participant.losses,
        participant.performance_rating,
        tournamentId,
        byePlayer.user_id
      );
    }

    return games;
  },

  // Advance tournament to next round
  advanceRound(tournamentId: string): { success: boolean; error?: string; pairings?: TournamentGame[] } {
    try {
      const tournament = statements.getTournamentById.get(tournamentId) as Tournament | null;
      if (!tournament) {
        return { success: false, error: 'Tournament not found' };
      }
      if (tournament.status !== 'active') {
        return { success: false, error: 'Tournament is not active' };
      }

      // Check if all games in current round are completed
      const currentGames = this.getTournamentRoundGames(tournamentId, tournament.current_round);
      const incompleteGames = currentGames.filter(g => g.status !== 'completed' && g.status !== 'forfeit');
      if (incompleteGames.length > 0) {
        return { success: false, error: 'Not all games in current round are completed' };
      }

      // Calculate Buchholz scores
      this.calculateBuchholz(tournamentId);

      // Check if tournament is complete
      if (tournament.current_round >= tournament.total_rounds) {
        statements.updateTournamentStatus.run('completed', tournament.current_round, tournament.total_rounds, new Date().toISOString(), tournamentId);
        return { success: true };
      }

      // Advance to next round
      const nextRound = tournament.current_round + 1;
      statements.updateTournamentStatus.run('active', nextRound, tournament.total_rounds, null, tournamentId);

      // Generate next round pairings
      const participants = this.getTournamentParticipants(tournamentId);
      const pairings = this.generatePairings(tournamentId, nextRound, participants);

      return { success: true, pairings };
    } catch (error) {
      console.error('Error advancing round:', error);
      return { success: false, error: 'Failed to advance round' };
    }
  },

  // Calculate Buchholz tiebreak scores
  calculateBuchholz(tournamentId: string): void {
    const participants = this.getTournamentParticipants(tournamentId);
    const games = db.prepare('SELECT * FROM tournament_games WHERE tournament_id = ? AND status = ?').all(tournamentId, 'completed') as TournamentGame[];

    const opponentScores: Map<string, number[]> = new Map();

    for (const p of participants) {
      opponentScores.set(p.user_id, []);
    }

    for (const game of games) {
      const whiteParticipant = participants.find(p => p.user_id === game.white_id);
      const blackParticipant = participants.find(p => p.user_id === game.black_id);

      if (whiteParticipant && blackParticipant) {
        opponentScores.get(game.white_id)?.push(blackParticipant.score);
        opponentScores.get(game.black_id)?.push(whiteParticipant.score);
      }
    }

    for (const p of participants) {
      const scores = opponentScores.get(p.user_id) || [];
      const buchholz = scores.reduce((a, b) => a + b, 0);
      statements.updateParticipantScore.run(
        p.score,
        buchholz,
        p.wins,
        p.draws,
        p.losses,
        p.performance_rating,
        tournamentId,
        p.user_id
      );
    }
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
