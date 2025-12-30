import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Use Node.js built-in UUID generator
const uuidv4 = randomUUID;

// Database connection pool (exported for direct queries in research endpoints)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

// Test connection on startup (non-blocking)
setTimeout(() => {
  pool.query('SELECT NOW()').then(() => {
    console.log('Database connected successfully');
  }).catch((err) => {
    console.error('Database connection error:', err.message);
  });
}, 1000);

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

export interface League {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  club_id: string | null;
  type: 'individual' | 'team';
  format: 'round_robin' | 'swiss' | 'double_round_robin';
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  time_control: string;
  season: string | null;
  division: number;
  max_divisions: number;
  promotion_count: number;
  relegation_count: number;
  points_for_win: number;
  points_for_draw: number;
  points_for_loss: number;
  current_round: number;
  total_rounds: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  creator_username?: string;
  club_name?: string;
  participant_count?: number;
}

export interface LeagueParticipant {
  id: string;
  league_id: string;
  user_id: string;
  division: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  games_played: number;
  goals_for: number;
  goals_against: number;
  form: string;
  status: 'active' | 'withdrawn' | 'relegated' | 'promoted';
  joined_at: string;
  username?: string;
  rating?: number;
}

export interface LeagueMatch {
  id: string;
  league_id: string;
  round: number;
  home_id: string;
  away_id: string;
  room_code: string | null;
  result: string | null;
  home_score: number | null;
  away_score: number | null;
  pgn: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'forfeit';
  scheduled_at: string | null;
  played_at: string | null;
  home_username?: string;
  away_username?: string;
  home_rating?: number;
  away_rating?: number;
}

export interface DailyPuzzle {
  id: string;
  puzzle_id: string;
  puzzle_date: string;
  created_at: string;
}

export interface DailyPuzzleCompletion {
  id: string;
  user_id: string;
  puzzle_date: string;
  completed_at: string;
  time_spent_ms: number | null;
  attempts: number;
}

export interface DailyPuzzleStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_completed: number;
  username?: string;
}

export interface KrogActivity {
  id: string;
  user_id: string;
  activity_type: 'view' | 'share';
  move_san: string | null;
  r_type: string | null;
  operator: string | null;
  created_at: string;
}

export interface KrogStats {
  user_id: string;
  explanations_viewed: number;
  explanations_shared: number;
  unique_rtypes_seen: string;
  unique_operators_seen: string;
  last_activity_at: string | null;
  username?: string;
  rtype_count?: number;
}

export interface MoveRecord {
  id?: number;
  game_id: string;
  move_number: number;
  color: 'white' | 'black';
  san: string;
  from_square: string;
  to_square: string;
  piece: string;
  captured: string | null;
  promotion: string | null;
  flags: string;
  r_type: string;
  r_type_description: string;
  conditions: string;
  fide_ref: string;
  move_type: string;
  fen_after: string;
  is_check: boolean;
  is_checkmate: boolean;
  created_at?: string;
}

// Database operations
export const dbOperations = {
  // User operations
  async createUser(username: string, email: string, password: string): Promise<User | null> {
    try {
      const id = uuidv4();
      const password_hash = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)`,
        [id, username.toLowerCase(), email.toLowerCase(), password_hash]
      );
      const result = await pool.query(
        `SELECT id, username, email, rating, games_played, games_won, games_drawn, games_lost, created_at, last_login FROM users WHERE id = $1`,
        [id]
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  async getUserById(id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT id, username, email, rating, games_played, games_won, games_drawn, games_lost, created_at, last_login FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username.toLowerCase()]);
    return result.rows[0] || null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase()]);
    return result.rows[0] || null;
  },

  async verifyPassword(user: User & { password_hash: string }, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  },

  async updateUserRating(userId: string, newRating: number): Promise<void> {
    await pool.query(`UPDATE users SET rating = $1 WHERE id = $2`, [newRating, userId]);
  },

  async updateUserStats(userId: string, result: 'win' | 'draw' | 'loss'): Promise<void> {
    const win = result === 'win' ? 1 : 0;
    const draw = result === 'draw' ? 1 : 0;
    const loss = result === 'loss' ? 1 : 0;
    await pool.query(
      `UPDATE users SET games_played = games_played + 1, games_won = games_won + $1, games_drawn = games_drawn + $2, games_lost = games_lost + $3 WHERE id = $4`,
      [win, draw, loss, userId]
    );
  },

  async updateLastLogin(userId: string): Promise<void> {
    await pool.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [userId]);
  },

  async getLeaderboard(limit: number = 100): Promise<User[]> {
    const result = await pool.query(
      `SELECT id, username, rating, games_played, games_won FROM users ORDER BY rating DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  // Game operations
  async createGame(roomCode: string, whiteId: string | null, blackId: string | null, timeControl: string | null, whiteRating: number | null, blackRating: number | null): Promise<Game> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO games (id, room_code, white_id, black_id, time_control, white_rating_before, black_rating_before) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, roomCode, whiteId, blackId, timeControl, whiteRating, blackRating]
    );
    const result = await pool.query(`SELECT * FROM games WHERE id = $1`, [id]);
    return result.rows[0];
  },

  async getGameById(id: string): Promise<Game | null> {
    const result = await pool.query(`SELECT * FROM games WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async getGameByRoomCode(roomCode: string): Promise<Game | null> {
    const result = await pool.query(`SELECT * FROM games WHERE room_code = $1 AND ended_at IS NULL`, [roomCode]);
    return result.rows[0] || null;
  },

  async endGame(gameId: string, pgn: string, result: string, whiteRatingChange: number, blackRatingChange: number): Promise<void> {
    await pool.query(
      `UPDATE games SET pgn = $1, result = $2, white_rating_change = $3, black_rating_change = $4, ended_at = NOW() WHERE id = $5`,
      [pgn, result, whiteRatingChange, blackRatingChange, gameId]
    );
  },

  async getUserGames(userId: string, limit: number = 20, offset: number = 0): Promise<Game[]> {
    const result = await pool.query(
      `SELECT g.*, w.username as white_username, b.username as black_username
       FROM games g
       LEFT JOIN users w ON g.white_id = w.id
       LEFT JOIN users b ON g.black_id = b.id
       WHERE g.white_id = $1 OR g.black_id = $1
       ORDER BY g.started_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  // Move records with KROG R-type annotations
  async insertMove(move: MoveRecord): Promise<void> {
    await pool.query(
      `INSERT INTO moves (
        game_id, move_number, color, san, from_square, to_square,
        piece, captured, promotion, flags, r_type, r_type_description,
        conditions, fide_ref, move_type, fen_after, is_check, is_checkmate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        move.game_id,
        move.move_number,
        move.color,
        move.san,
        move.from_square,
        move.to_square,
        move.piece,
        move.captured,
        move.promotion,
        move.flags,
        move.r_type,
        move.r_type_description,
        move.conditions,
        move.fide_ref,
        move.move_type,
        move.fen_after,
        move.is_check,
        move.is_checkmate
      ]
    );
  },

  async getMovesByGame(gameId: string): Promise<MoveRecord[]> {
    const result = await pool.query(
      `SELECT * FROM moves WHERE game_id = $1 ORDER BY move_number ASC, color ASC`,
      [gameId]
    );
    return result.rows;
  },

  async getMovesByRType(rType: string, limit: number = 100): Promise<MoveRecord[]> {
    const result = await pool.query(
      `SELECT m.*, g.room_code, g.white_id, g.black_id
       FROM moves m
       JOIN games g ON m.game_id = g.id
       WHERE m.r_type = $1
       ORDER BY m.created_at DESC
       LIMIT $2`,
      [rType, limit]
    );
    return result.rows;
  },

  async getMoveStats(): Promise<{ r_type: string; count: number }[]> {
    const result = await pool.query(
      `SELECT r_type, COUNT(*) as count
       FROM moves
       GROUP BY r_type
       ORDER BY count DESC`
    );
    return result.rows;
  },

  // Rating history
  async addRatingHistory(userId: string, rating: number, ratingChange: number, gameId: string | null): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO rating_history (id, user_id, rating, rating_change, game_id) VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, rating, ratingChange, gameId]
    );
  },

  async getUserRatingHistory(userId: string, limit: number = 50): Promise<{ rating: number; rating_change: number; created_at: string }[]> {
    const result = await pool.query(
      `SELECT rating, rating_change, created_at FROM rating_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // Matchmaking
  async addToQueue(userId: string, socketId: string, rating: number, timeControl: string): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO matchmaking_queue (id, user_id, socket_id, rating, time_control)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET socket_id = $3, rating = $4, time_control = $5, joined_at = NOW()`,
      [id, userId, socketId, rating, timeControl]
    );
  },

  async removeFromQueue(userId: string): Promise<void> {
    await pool.query(`DELETE FROM matchmaking_queue WHERE user_id = $1`, [userId]);
  },

  async removeFromQueueBySocket(socketId: string): Promise<void> {
    await pool.query(`DELETE FROM matchmaking_queue WHERE socket_id = $1`, [socketId]);
  },

  async findMatch(timeControl: string, userId: string, rating: number, ratingRange: number): Promise<QueueEntry | null> {
    const result = await pool.query(
      `SELECT * FROM matchmaking_queue
       WHERE time_control = $1 AND user_id != $2 AND ABS(rating - $3) <= $4
       ORDER BY ABS(rating - $3) ASC
       LIMIT 1`,
      [timeControl, userId, rating, ratingRange]
    );
    return result.rows[0] || null;
  },

  async getQueuePosition(timeControl: string, userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as position FROM matchmaking_queue
       WHERE time_control = $1 AND joined_at <= (
         SELECT joined_at FROM matchmaking_queue WHERE user_id = $2
       )`,
      [timeControl, userId]
    );
    return parseInt(result.rows[0]?.position || '0');
  },

  // Friendship operations
  async sendFriendRequest(userId: string, friendId: string): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO friendships (id, user_id, friend_id, status) VALUES ($1, $2, $3, 'pending')`,
      [id, userId, friendId]
    );
  },

  async getFriendship(userId: string, friendId: string): Promise<Friendship | null> {
    const result = await pool.query(
      `SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );
    return result.rows[0] || null;
  },

  async acceptFriendRequest(id: string): Promise<void> {
    await pool.query(`UPDATE friendships SET status = 'accepted' WHERE id = $1`, [id]);
  },

  async declineFriendRequest(id: string): Promise<void> {
    await pool.query(`DELETE FROM friendships WHERE id = $1`, [id]);
  },

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await pool.query(
      `DELETE FROM friendships WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)) AND status = 'accepted'`,
      [userId, friendId]
    );
  },

  async getFriends(userId: string): Promise<Friend[]> {
    const result = await pool.query(
      `SELECT u.id, u.username, u.rating, u.last_login, f.created_at as friends_since
       FROM friendships f
       JOIN users u ON ((f.user_id = $1 AND u.id = f.friend_id) OR (f.friend_id = $1 AND u.id = f.user_id))
       WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'accepted'`,
      [userId]
    );
    return result.rows;
  },

  async getIncomingRequests(userId: string): Promise<FriendRequest[]> {
    const result = await pool.query(
      `SELECT f.id as request_id, u.id, u.username, u.rating, f.created_at
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.status = 'pending'`,
      [userId]
    );
    return result.rows;
  },

  async getOutgoingRequests(userId: string): Promise<FriendRequest[]> {
    const result = await pool.query(
      `SELECT f.id as request_id, u.id, u.username, u.rating, f.created_at
       FROM friendships f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = $1 AND f.status = 'pending'`,
      [userId]
    );
    return result.rows;
  },

  async searchUsers(query: string, excludeUserId: string): Promise<User[]> {
    const result = await pool.query(
      `SELECT id, username, rating FROM users WHERE username LIKE $1 AND id != $2 ORDER BY rating DESC LIMIT 20`,
      [`%${query}%`, excludeUserId]
    );
    return result.rows;
  },

  // Club operations
  async createClub(name: string, description: string | null, ownerId: string, logoEmoji: string, isPublic: boolean): Promise<Club | null> {
    try {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO clubs (id, name, description, owner_id, logo_emoji, is_public) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, name, description, ownerId, logoEmoji, isPublic]
      );
      // Add owner as a member
      const memberId = uuidv4();
      await pool.query(
        `INSERT INTO club_members (id, club_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
        [memberId, id, ownerId]
      );
      const result = await pool.query(`SELECT * FROM clubs WHERE id = $1`, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating club:', error);
      return null;
    }
  },

  async getClubById(id: string): Promise<Club | null> {
    const result = await pool.query(`SELECT * FROM clubs WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async getClubByName(name: string): Promise<Club | null> {
    const result = await pool.query(`SELECT * FROM clubs WHERE name = $1`, [name]);
    return result.rows[0] || null;
  },

  async updateClub(id: string, name: string, description: string | null, logoEmoji: string, isPublic: boolean): Promise<void> {
    await pool.query(
      `UPDATE clubs SET name = $1, description = $2, logo_emoji = $3, is_public = $4 WHERE id = $5`,
      [name, description, logoEmoji, isPublic, id]
    );
  },

  async deleteClub(id: string): Promise<void> {
    await pool.query(`DELETE FROM clubs WHERE id = $1`, [id]);
  },

  async updateClubMemberCount(clubId: string): Promise<void> {
    await pool.query(
      `UPDATE clubs SET member_count = (SELECT COUNT(*) FROM club_members WHERE club_id = $1) WHERE id = $1`,
      [clubId]
    );
  },

  async getPublicClubs(limit: number, offset: number): Promise<Club[]> {
    const result = await pool.query(
      `SELECT c.*, u.username as owner_username
       FROM clubs c
       JOIN users u ON c.owner_id = u.id
       WHERE c.is_public = true
       ORDER BY c.member_count DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async searchClubs(query: string): Promise<Club[]> {
    const result = await pool.query(
      `SELECT c.*, u.username as owner_username
       FROM clubs c
       JOIN users u ON c.owner_id = u.id
       WHERE c.name ILIKE $1 AND c.is_public = true
       ORDER BY c.member_count DESC
       LIMIT 20`,
      [`%${query}%`]
    );
    return result.rows;
  },

  async getUserClubs(userId: string): Promise<Club[]> {
    const result = await pool.query(
      `SELECT c.*, cm.role, u.username as owner_username
       FROM clubs c
       JOIN club_members cm ON c.id = cm.club_id
       JOIN users u ON c.owner_id = u.id
       WHERE cm.user_id = $1
       ORDER BY cm.joined_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Club member operations
  async addClubMember(clubId: string, userId: string, role: string): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO club_members (id, club_id, user_id, role) VALUES ($1, $2, $3, $4)`,
      [id, clubId, userId, role]
    );
  },

  async removeClubMember(clubId: string, userId: string): Promise<void> {
    await pool.query(`DELETE FROM club_members WHERE club_id = $1 AND user_id = $2`, [clubId, userId]);
  },

  async getClubMember(clubId: string, userId: string): Promise<ClubMember | null> {
    const result = await pool.query(
      `SELECT cm.*, u.username, u.rating
       FROM club_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.club_id = $1 AND cm.user_id = $2`,
      [clubId, userId]
    );
    return result.rows[0] || null;
  },

  async getClubMembers(clubId: string): Promise<ClubMember[]> {
    const result = await pool.query(
      `SELECT cm.*, u.username, u.rating
       FROM club_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.club_id = $1
       ORDER BY
         CASE cm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
         cm.joined_at ASC`,
      [clubId]
    );
    return result.rows;
  },

  async updateMemberRole(clubId: string, userId: string, role: string): Promise<void> {
    await pool.query(`UPDATE club_members SET role = $1 WHERE club_id = $2 AND user_id = $3`, [role, clubId, userId]);
  },

  // Club message operations
  async addClubMessage(clubId: string, userId: string, message: string): Promise<ClubMessage> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO club_messages (id, club_id, user_id, message) VALUES ($1, $2, $3, $4)`,
      [id, clubId, userId, message]
    );
    const result = await pool.query(
      `SELECT cm.*, u.username FROM club_messages cm JOIN users u ON cm.user_id = u.id WHERE cm.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async getClubMessages(clubId: string, limit: number, offset: number): Promise<ClubMessage[]> {
    const result = await pool.query(
      `SELECT cm.*, u.username
       FROM club_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.club_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [clubId, limit, offset]
    );
    return result.rows;
  },

  async deleteClubMessage(id: string): Promise<void> {
    await pool.query(`DELETE FROM club_messages WHERE id = $1`, [id]);
  },

  // Club invitation operations
  async createClubInvitation(clubId: string, inviterId: string, inviteeId: string): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO club_invitations (id, club_id, inviter_id, invitee_id) VALUES ($1, $2, $3, $4)`,
      [id, clubId, inviterId, inviteeId]
    );
  },

  async getClubInvitation(clubId: string, inviteeId: string): Promise<ClubInvitation | null> {
    const result = await pool.query(
      `SELECT * FROM club_invitations WHERE club_id = $1 AND invitee_id = $2`,
      [clubId, inviteeId]
    );
    return result.rows[0] || null;
  },

  async getPendingInvitations(userId: string): Promise<ClubInvitation[]> {
    const result = await pool.query(
      `SELECT ci.*, c.name as club_name, u.username as inviter_username
       FROM club_invitations ci
       JOIN clubs c ON ci.club_id = c.id
       JOIN users u ON ci.inviter_id = u.id
       WHERE ci.invitee_id = $1 AND ci.status = 'pending'`,
      [userId]
    );
    return result.rows;
  },

  async updateInvitationStatus(id: string, status: string): Promise<void> {
    await pool.query(`UPDATE club_invitations SET status = $1 WHERE id = $2`, [status, id]);
  },

  async deleteClubInvitation(id: string): Promise<void> {
    await pool.query(`DELETE FROM club_invitations WHERE id = $1`, [id]);
  },

  // Tournament operations
  async createTournament(name: string, description: string | null, creatorId: string, clubId: string | null, type: string, timeControl: string, maxParticipants: number, startTime: string | null): Promise<Tournament | null> {
    try {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO tournaments (id, name, description, creator_id, club_id, type, time_control, max_participants, starts_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, name, description, creatorId, clubId, type, timeControl, maxParticipants, startTime]
      );
      const result = await pool.query(
        `SELECT t.*, u.username as creator_username, c.name as club_name
         FROM tournaments t
         JOIN users u ON t.creator_id = u.id
         LEFT JOIN clubs c ON t.club_id = c.id
         WHERE t.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating tournament:', error);
      return null;
    }
  },

  async getTournamentById(id: string): Promise<Tournament | null> {
    const result = await pool.query(
      `SELECT t.*, u.username as creator_username, c.name as club_name
       FROM tournaments t
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN clubs c ON t.club_id = c.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async updateTournamentStatus(id: string, status: string, currentRound: number, totalRounds: number, endTime: string | null): Promise<void> {
    await pool.query(
      `UPDATE tournaments SET status = $1, current_round = $2, total_rounds = $3, ended_at = $4 WHERE id = $5`,
      [status, currentRound, totalRounds, endTime, id]
    );
  },

  async deleteTournament(id: string): Promise<void> {
    await pool.query(`DELETE FROM tournaments WHERE id = $1`, [id]);
  },

  async getUpcomingTournaments(limit: number, offset: number): Promise<Tournament[]> {
    const result = await pool.query(
      `SELECT t.*, u.username as creator_username, c.name as club_name,
              (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
       FROM tournaments t
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN clubs c ON t.club_id = c.id
       WHERE t.status = 'upcoming'
       ORDER BY t.starts_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async getActiveTournaments(limit: number, offset: number): Promise<Tournament[]> {
    const result = await pool.query(
      `SELECT t.*, u.username as creator_username, c.name as club_name,
              (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
       FROM tournaments t
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN clubs c ON t.club_id = c.id
       WHERE t.status = 'active'
       ORDER BY t.starts_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async getCompletedTournaments(limit: number, offset: number): Promise<Tournament[]> {
    const result = await pool.query(
      `SELECT t.*, u.username as creator_username, c.name as club_name,
              (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
       FROM tournaments t
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN clubs c ON t.club_id = c.id
       WHERE t.status = 'completed'
       ORDER BY t.ended_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async getClubTournaments(clubId: string, limit: number, offset: number): Promise<Tournament[]> {
    const result = await pool.query(
      `SELECT t.*, u.username as creator_username,
              (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
       FROM tournaments t
       JOIN users u ON t.creator_id = u.id
       WHERE t.club_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [clubId, limit, offset]
    );
    return result.rows;
  },

  async getUserTournaments(userId: string, limit: number, offset: number): Promise<Tournament[]> {
    const result = await pool.query(
      `SELECT t.*, u.username as creator_username, c.name as club_name, tp.score, tp.status as participant_status
       FROM tournament_participants tp
       JOIN tournaments t ON tp.tournament_id = t.id
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN clubs c ON t.club_id = c.id
       WHERE tp.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  // Tournament participant operations
  async addTournamentParticipant(tournamentId: string, userId: string): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tournament_participants (id, tournament_id, user_id) VALUES ($1, $2, $3)`,
      [id, tournamentId, userId]
    );
  },

  async removeTournamentParticipant(tournamentId: string, userId: string): Promise<void> {
    await pool.query(`DELETE FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2`, [tournamentId, userId]);
  },

  async getTournamentParticipant(tournamentId: string, userId: string): Promise<TournamentParticipant | null> {
    const result = await pool.query(
      `SELECT tp.*, u.username, u.rating
       FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.tournament_id = $1 AND tp.user_id = $2`,
      [tournamentId, userId]
    );
    return result.rows[0] || null;
  },

  async getTournamentParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
    const result = await pool.query(
      `SELECT tp.*, u.username, u.rating
       FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.tournament_id = $1
       ORDER BY tp.score DESC, tp.buchholz DESC, u.rating DESC`,
      [tournamentId]
    );
    return result.rows;
  },

  async updateParticipantScore(tournamentId: string, userId: string, score: number, buchholz: number, wins: number, draws: number, losses: number, performanceRating: number): Promise<void> {
    await pool.query(
      `UPDATE tournament_participants SET score = $1, buchholz = $2, wins = $3, draws = $4, losses = $5, performance_rating = $6 WHERE tournament_id = $7 AND user_id = $8`,
      [score, buchholz, wins, draws, losses, performanceRating, tournamentId, userId]
    );
  },

  // Tournament game operations
  async createTournamentGame(tournamentId: string, round: number, board: number, whiteId: string, blackId: string, roomCode: string): Promise<TournamentGame> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tournament_games (id, tournament_id, round, board, white_id, black_id, room_code) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, tournamentId, round, board, whiteId, blackId, roomCode]
    );
    const result = await pool.query(
      `SELECT tg.*, w.username as white_username, b.username as black_username
       FROM tournament_games tg
       JOIN users w ON tg.white_id = w.id
       JOIN users b ON tg.black_id = b.id
       WHERE tg.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async getTournamentGame(id: string): Promise<TournamentGame | null> {
    const result = await pool.query(
      `SELECT tg.*, w.username as white_username, b.username as black_username
       FROM tournament_games tg
       JOIN users w ON tg.white_id = w.id
       JOIN users b ON tg.black_id = b.id
       WHERE tg.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getTournamentGameByRoom(roomCode: string): Promise<TournamentGame | null> {
    const result = await pool.query(
      `SELECT tg.*, w.username as white_username, b.username as black_username
       FROM tournament_games tg
       JOIN users w ON tg.white_id = w.id
       JOIN users b ON tg.black_id = b.id
       WHERE tg.room_code = $1`,
      [roomCode]
    );
    return result.rows[0] || null;
  },

  async getTournamentRoundGames(tournamentId: string, round: number): Promise<TournamentGame[]> {
    const result = await pool.query(
      `SELECT tg.*, w.username as white_username, b.username as black_username, w.rating as white_rating, b.rating as black_rating
       FROM tournament_games tg
       JOIN users w ON tg.white_id = w.id
       JOIN users b ON tg.black_id = b.id
       WHERE tg.tournament_id = $1 AND tg.round = $2
       ORDER BY tg.board ASC`,
      [tournamentId, round]
    );
    return result.rows;
  },

  async updateTournamentGameResult(id: string, result: string, whiteScore: number, blackScore: number, pgn: string): Promise<void> {
    await pool.query(
      `UPDATE tournament_games SET result = $1, white_score = $2, black_score = $3, pgn = $4, ended_at = NOW() WHERE id = $5`,
      [result, whiteScore, blackScore, pgn, id]
    );
  },

  // League operations
  async createLeague(name: string, description: string | null, creatorId: string, clubId: string | null, type: string, format: string, timeControl: string, season: string | null, maxDivisions: number, pointsForWin: number, pointsForDraw: number, pointsForLoss: number, startDate: string | null, endDate: string | null): Promise<League | null> {
    try {
      const id = uuidv4();
      await pool.query(
        `INSERT INTO leagues (id, name, description, creator_id, club_id, type, format, time_control, season, divisions, points_for_win, points_for_draw, points_for_loss, starts_at, ended_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [id, name, description, creatorId, clubId, type, format, timeControl, season, maxDivisions, pointsForWin, pointsForDraw, pointsForLoss, startDate, endDate]
      );
      const result = await pool.query(
        `SELECT l.*, u.username as creator_username, c.name as club_name,
                (SELECT COUNT(*) FROM league_participants WHERE league_id = l.id) as participant_count
         FROM leagues l
         JOIN users u ON l.creator_id = u.id
         LEFT JOIN clubs c ON l.club_id = c.id
         WHERE l.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating league:', error);
      return null;
    }
  },

  async getLeagueById(id: string): Promise<League | null> {
    const result = await pool.query(
      `SELECT l.*, u.username as creator_username, c.name as club_name,
              (SELECT COUNT(*) FROM league_participants WHERE league_id = l.id) as participant_count
       FROM leagues l
       JOIN users u ON l.creator_id = u.id
       LEFT JOIN clubs c ON l.club_id = c.id
       WHERE l.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async updateLeagueStatus(id: string, status: string, currentRound: number, totalRounds: number): Promise<void> {
    await pool.query(
      `UPDATE leagues SET status = $1, current_round = $2, total_rounds = $3 WHERE id = $4`,
      [status, currentRound, totalRounds, id]
    );
  },

  async deleteLeague(id: string): Promise<void> {
    await pool.query(`DELETE FROM leagues WHERE id = $1`, [id]);
  },

  async getOpenLeagues(limit: number, offset: number): Promise<League[]> {
    const result = await pool.query(
      `SELECT l.*, u.username as creator_username, c.name as club_name,
              (SELECT COUNT(*) FROM league_participants WHERE league_id = l.id) as participant_count
       FROM leagues l
       JOIN users u ON l.creator_id = u.id
       LEFT JOIN clubs c ON l.club_id = c.id
       WHERE l.status = 'registration'
       ORDER BY l.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async getActiveLeagues(limit: number, offset: number): Promise<League[]> {
    const result = await pool.query(
      `SELECT l.*, u.username as creator_username, c.name as club_name,
              (SELECT COUNT(*) FROM league_participants WHERE league_id = l.id) as participant_count
       FROM leagues l
       JOIN users u ON l.creator_id = u.id
       LEFT JOIN clubs c ON l.club_id = c.id
       WHERE l.status = 'active'
       ORDER BY l.starts_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async getUserLeagues(userId: string, limit: number, offset: number): Promise<League[]> {
    const result = await pool.query(
      `SELECT l.*, u.username as creator_username, c.name as club_name, lp.points, lp.status as participant_status, lp.division
       FROM league_participants lp
       JOIN leagues l ON lp.league_id = l.id
       JOIN users u ON l.creator_id = u.id
       LEFT JOIN clubs c ON l.club_id = c.id
       WHERE lp.user_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  // League participant operations
  async addLeagueParticipant(leagueId: string, userId: string, division: number): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO league_participants (id, league_id, user_id, division) VALUES ($1, $2, $3, $4)`,
      [id, leagueId, userId, division]
    );
  },

  async removeLeagueParticipant(leagueId: string, userId: string): Promise<void> {
    await pool.query(`DELETE FROM league_participants WHERE league_id = $1 AND user_id = $2`, [leagueId, userId]);
  },

  async getLeagueParticipant(leagueId: string, userId: string): Promise<LeagueParticipant | null> {
    const result = await pool.query(
      `SELECT lp.*, u.username, u.rating
       FROM league_participants lp
       JOIN users u ON lp.user_id = u.id
       WHERE lp.league_id = $1 AND lp.user_id = $2`,
      [leagueId, userId]
    );
    return result.rows[0] || null;
  },

  async getLeagueParticipants(leagueId: string): Promise<LeagueParticipant[]> {
    const result = await pool.query(
      `SELECT lp.*, u.username, u.rating
       FROM league_participants lp
       JOIN users u ON lp.user_id = u.id
       WHERE lp.league_id = $1
       ORDER BY lp.division ASC, lp.points DESC, (lp.goals_for - lp.goals_against) DESC, lp.wins DESC`,
      [leagueId]
    );
    return result.rows;
  },

  async getLeagueStandings(leagueId: string, division: number): Promise<LeagueParticipant[]> {
    const result = await pool.query(
      `SELECT lp.*, u.username, u.rating
       FROM league_participants lp
       JOIN users u ON lp.user_id = u.id
       WHERE lp.league_id = $1 AND lp.division = $2
       ORDER BY lp.points DESC, (lp.goals_for - lp.goals_against) DESC, lp.wins DESC`,
      [leagueId, division]
    );
    return result.rows;
  },

  async updateLeagueParticipantStats(leagueId: string, userId: string, points: number, wins: number, draws: number, losses: number, gamesPlayed: number, goalsFor: number, goalsAgainst: number, form: string): Promise<void> {
    await pool.query(
      `UPDATE league_participants SET points = $1, wins = $2, draws = $3, losses = $4, games_played = $5, goals_for = $6, goals_against = $7, form = $8 WHERE league_id = $9 AND user_id = $10`,
      [points, wins, draws, losses, gamesPlayed, goalsFor, goalsAgainst, form, leagueId, userId]
    );
  },

  // League match operations
  async createLeagueMatch(leagueId: string, round: number, homeId: string, awayId: string, roomCode: string, scheduledAt: string | null): Promise<LeagueMatch> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO league_matches (id, league_id, round, home_id, away_id, room_code, scheduled_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, leagueId, round, homeId, awayId, roomCode, scheduledAt]
    );
    const result = await pool.query(
      `SELECT lm.*, h.username as home_username, a.username as away_username
       FROM league_matches lm
       JOIN users h ON lm.home_id = h.id
       JOIN users a ON lm.away_id = a.id
       WHERE lm.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async getLeagueMatch(id: string): Promise<LeagueMatch | null> {
    const result = await pool.query(
      `SELECT lm.*, h.username as home_username, a.username as away_username, h.rating as home_rating, a.rating as away_rating
       FROM league_matches lm
       JOIN users h ON lm.home_id = h.id
       JOIN users a ON lm.away_id = a.id
       WHERE lm.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getLeagueMatchByRoom(roomCode: string): Promise<LeagueMatch | null> {
    const result = await pool.query(
      `SELECT lm.*, h.username as home_username, a.username as away_username
       FROM league_matches lm
       JOIN users h ON lm.home_id = h.id
       JOIN users a ON lm.away_id = a.id
       WHERE lm.room_code = $1`,
      [roomCode]
    );
    return result.rows[0] || null;
  },

  async getLeagueRoundMatches(leagueId: string, round: number): Promise<LeagueMatch[]> {
    const result = await pool.query(
      `SELECT lm.*, h.username as home_username, a.username as away_username, h.rating as home_rating, a.rating as away_rating
       FROM league_matches lm
       JOIN users h ON lm.home_id = h.id
       JOIN users a ON lm.away_id = a.id
       WHERE lm.league_id = $1 AND lm.round = $2
       ORDER BY lm.scheduled_at ASC`,
      [leagueId, round]
    );
    return result.rows;
  },

  async getLeagueMatches(leagueId: string): Promise<LeagueMatch[]> {
    const result = await pool.query(
      `SELECT lm.*, h.username as home_username, a.username as away_username, h.rating as home_rating, a.rating as away_rating
       FROM league_matches lm
       JOIN users h ON lm.home_id = h.id
       JOIN users a ON lm.away_id = a.id
       WHERE lm.league_id = $1
       ORDER BY lm.round ASC, lm.scheduled_at ASC`,
      [leagueId]
    );
    return result.rows;
  },

  async updateLeagueMatchResult(id: string, result: string, homeScore: number, awayScore: number, pgn: string): Promise<void> {
    await pool.query(
      `UPDATE league_matches SET result = $1, home_score = $2, away_score = $3, pgn = $4, ended_at = NOW() WHERE id = $5`,
      [result, homeScore, awayScore, pgn, id]
    );
  },

  // Daily puzzle operations
  async getDailyPuzzle(puzzleDate: string): Promise<DailyPuzzle | null> {
    const result = await pool.query(`SELECT * FROM daily_puzzles WHERE puzzle_date = $1`, [puzzleDate]);
    return result.rows[0] || null;
  },

  async setDailyPuzzle(puzzleId: string, puzzleDate: string): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO daily_puzzles (id, puzzle_id, puzzle_date) VALUES ($1, $2, $3)
       ON CONFLICT (puzzle_date) DO UPDATE SET puzzle_id = $2`,
      [id, puzzleId, puzzleDate]
    );
  },

  async getDailyPuzzleCompletion(userId: string, puzzleDate: string): Promise<DailyPuzzleCompletion | null> {
    const result = await pool.query(
      `SELECT * FROM daily_puzzle_completions WHERE user_id = $1 AND puzzle_date = $2`,
      [userId, puzzleDate]
    );
    return result.rows[0] || null;
  },

  async recordDailyPuzzleCompletion(userId: string, puzzleDate: string, timeSpentMs: number, attempts: number): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO daily_puzzle_completions (id, user_id, puzzle_date, time_spent_ms, attempts) VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, puzzleDate, timeSpentMs, attempts]
    );
  },

  async getDailyPuzzleStreak(userId: string): Promise<DailyPuzzleStreak | null> {
    const result = await pool.query(`SELECT * FROM daily_puzzle_streaks WHERE user_id = $1`, [userId]);
    return result.rows[0] || null;
  },

  async upsertDailyPuzzleStreak(userId: string, currentStreak: number, longestStreak: number, lastCompletedDate: string, totalCompleted: number): Promise<void> {
    await pool.query(
      `INSERT INTO daily_puzzle_streaks (user_id, current_streak, longest_streak, last_completed_date, total_completed)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE SET
         current_streak = $2,
         longest_streak = $3,
         last_completed_date = $4,
         total_completed = $5`,
      [userId, currentStreak, longestStreak, lastCompletedDate, totalCompleted]
    );
  },

  async getDailyPuzzleLeaderboard(limit: number): Promise<DailyPuzzleStreak[]> {
    const result = await pool.query(
      `SELECT dps.*, u.username
       FROM daily_puzzle_streaks dps
       JOIN users u ON dps.user_id = u.id
       ORDER BY dps.current_streak DESC, dps.longest_streak DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  // KROG activity operations
  async recordKrogActivity(userId: string, activityType: string, moveSan: string | null, rType: string | null, operator: string | null): Promise<void> {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO krog_activity (id, user_id, activity_type, move_san, r_type, operator) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, activityType, moveSan, rType, operator]
    );
  },

  async getKrogStats(userId: string): Promise<KrogStats | null> {
    const result = await pool.query(`SELECT * FROM krog_stats WHERE user_id = $1`, [userId]);
    return result.rows[0] || null;
  },

  async upsertKrogStats(userId: string, explanationsViewed: number, explanationsShared: number, uniqueRtypesSeen: string, uniqueOperatorsSeen: string): Promise<void> {
    await pool.query(
      `INSERT INTO krog_stats (user_id, explanations_viewed, explanations_shared, unique_rtypes_seen, unique_operators_seen, last_activity_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         explanations_viewed = $2,
         explanations_shared = $3,
         unique_rtypes_seen = $4,
         unique_operators_seen = $5,
         last_activity_at = NOW()`,
      [userId, explanationsViewed, explanationsShared, uniqueRtypesSeen, uniqueOperatorsSeen]
    );
  },

  async getKrogLeaderboardByViews(limit: number): Promise<KrogStats[]> {
    const result = await pool.query(
      `SELECT ks.*, u.username
       FROM krog_stats ks
       JOIN users u ON ks.user_id = u.id
       ORDER BY ks.explanations_viewed DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async getKrogLeaderboardByShares(limit: number): Promise<KrogStats[]> {
    const result = await pool.query(
      `SELECT ks.*, u.username
       FROM krog_stats ks
       JOIN users u ON ks.user_id = u.id
       ORDER BY ks.explanations_shared DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async getKrogLeaderboardByRtypes(limit: number): Promise<KrogStats[]> {
    const result = await pool.query(
      `SELECT ks.*, u.username,
              LENGTH(ks.unique_rtypes_seen) - LENGTH(REPLACE(ks.unique_rtypes_seen, ',', '')) +
              CASE WHEN ks.unique_rtypes_seen != '' THEN 1 ELSE 0 END as rtype_count
       FROM krog_stats ks
       JOIN users u ON ks.user_id = u.id
       ORDER BY rtype_count DESC, ks.explanations_viewed DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  async getKrogRank(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) + 1 as rank
       FROM krog_stats
       WHERE explanations_viewed > (SELECT COALESCE(explanations_viewed, 0) FROM krog_stats WHERE user_id = $1)`,
      [userId]
    );
    return parseInt(result.rows[0]?.rank || '1');
  },

  // Update KROG stats with new activity
  async updateKrogStats(userId: string, activityType: 'view' | 'share', rType: string | null, operator: string | null): Promise<void> {
    // Get current stats or create new
    const stats = await this.getKrogStats(userId);

    let explanationsViewed = stats?.explanations_viewed || 0;
    let explanationsShared = stats?.explanations_shared || 0;
    let uniqueRtypes = stats?.unique_rtypes_seen ? stats.unique_rtypes_seen.split(',').filter(Boolean) : [];
    let uniqueOperators = stats?.unique_operators_seen ? stats.unique_operators_seen.split(',').filter(Boolean) : [];

    if (activityType === 'view') {
      explanationsViewed++;
    } else if (activityType === 'share') {
      explanationsShared++;
    }

    if (rType && !uniqueRtypes.includes(rType)) {
      uniqueRtypes.push(rType);
    }
    if (operator && !uniqueOperators.includes(operator)) {
      uniqueOperators.push(operator);
    }

    await this.upsertKrogStats(
      userId,
      explanationsViewed,
      explanationsShared,
      uniqueRtypes.join(','),
      uniqueOperators.join(',')
    );
  },

  // Get KROG leaderboard by type
  async getKrogLeaderboard(type: string, limit: number): Promise<KrogStats[]> {
    if (type === 'views') {
      return this.getKrogLeaderboardByViews(limit);
    } else if (type === 'shares') {
      return this.getKrogLeaderboardByShares(limit);
    } else if (type === 'rtypes') {
      return this.getKrogLeaderboardByRtypes(limit);
    }
    return this.getKrogLeaderboardByViews(limit);
  },

  // Process streak after completing daily puzzle
  async processStreakAfterCompletion(userId: string, completionDate: string): Promise<DailyPuzzleStreak> {
    const currentStreak = await this.getDailyPuzzleStreak(userId);

    let newCurrentStreak = 1;
    let newLongestStreak = currentStreak?.longest_streak || 0;
    let totalCompleted = (currentStreak?.total_completed || 0) + 1;

    if (currentStreak) {
      const lastDate = currentStreak.last_completed_date;
      if (lastDate) {
        const lastDateObj = new Date(lastDate);
        const completionDateObj = new Date(completionDate);
        const diffDays = Math.floor((completionDateObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          newCurrentStreak = currentStreak.current_streak + 1;
        } else if (diffDays === 0) {
          // Same day (shouldn't happen but handle it)
          newCurrentStreak = currentStreak.current_streak;
          totalCompleted--;
        }
        // Otherwise reset to 1 (gap in streak)
      }
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    await this.upsertDailyPuzzleStreak(userId, newCurrentStreak, newLongestStreak, completionDate, totalCompleted);

    return {
      user_id: userId,
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_completed_date: completionDate,
      total_completed: totalCompleted
    };
  },

  // Friend operations wrapper
  async sendFriendRequestWithResult(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
    try {
      const existing = await this.getFriendship(userId, friendId);
      if (existing) {
        return { success: false, message: 'Friend request already exists' };
      }
      await this.sendFriendRequest(userId, friendId);
      return { success: true, message: 'Friend request sent' };
    } catch (error) {
      return { success: false, message: 'Failed to send friend request' };
    }
  },

  async acceptFriendRequestWithResult(requestId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.acceptFriendRequest(requestId);
      return { success: true, message: 'Friend request accepted' };
    } catch (error) {
      return { success: false, message: 'Failed to accept friend request' };
    }
  },

  async declineFriendRequestWithResult(requestId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.declineFriendRequest(requestId);
      return { success: true, message: 'Friend request declined' };
    } catch (error) {
      return { success: false, message: 'Failed to decline friend request' };
    }
  },

  async removeFriendWithResult(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.removeFriend(userId, friendId);
      return { success: true, message: 'Friend removed' };
    } catch (error) {
      return { success: false, message: 'Failed to remove friend' };
    }
  },

  // Club wrapper operations
  async joinClub(clubId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const member = await this.getClubMember(clubId, userId);
      if (member) {
        return { success: false, message: 'Already a member' };
      }
      await this.addClubMember(clubId, userId, 'member');
      await this.updateClubMemberCount(clubId);
      return { success: true, message: 'Joined club' };
    } catch (error) {
      return { success: false, message: 'Failed to join club' };
    }
  },

  async leaveClub(clubId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const member = await this.getClubMember(clubId, userId);
      if (!member) {
        return { success: false, message: 'Not a member' };
      }
      if (member.role === 'owner') {
        return { success: false, message: 'Owner cannot leave club' };
      }
      await this.removeClubMember(clubId, userId);
      await this.updateClubMemberCount(clubId);
      return { success: true, message: 'Left club' };
    } catch (error) {
      return { success: false, message: 'Failed to leave club' };
    }
  },

  async updateClubWithAuth(clubId: string, userId: string, updates: { name?: string; description?: string | null; logoEmoji?: string; isPublic?: boolean }): Promise<{ success: boolean; message: string }> {
    try {
      const member = await this.getClubMember(clubId, userId);
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return { success: false, message: 'Not authorized' };
      }
      const club = await this.getClubById(clubId);
      if (!club) {
        return { success: false, message: 'Club not found' };
      }
      await this.updateClub(
        clubId,
        updates.name || club.name,
        updates.description !== undefined ? updates.description : club.description,
        updates.logoEmoji || club.logo_emoji,
        updates.isPublic !== undefined ? updates.isPublic : club.is_public
      );
      return { success: true, message: 'Club updated' };
    } catch (error) {
      return { success: false, message: 'Failed to update club' };
    }
  },

  async deleteClubWithAuth(clubId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const member = await this.getClubMember(clubId, userId);
      if (!member || member.role !== 'owner') {
        return { success: false, message: 'Not authorized' };
      }
      await this.deleteClub(clubId);
      return { success: true, message: 'Club deleted' };
    } catch (error) {
      return { success: false, message: 'Failed to delete club' };
    }
  },

  async updateMemberRoleWithAuth(clubId: string, requesterId: string, targetUserId: string, newRole: string): Promise<{ success: boolean; message: string }> {
    try {
      const requesterMember = await this.getClubMember(clubId, requesterId);
      if (!requesterMember || (requesterMember.role !== 'owner' && requesterMember.role !== 'admin')) {
        return { success: false, message: 'Not authorized' };
      }
      const targetMember = await this.getClubMember(clubId, targetUserId);
      if (!targetMember) {
        return { success: false, message: 'Member not found' };
      }
      if (targetMember.role === 'owner') {
        return { success: false, message: 'Cannot change owner role' };
      }
      await this.updateMemberRole(clubId, targetUserId, newRole);
      return { success: true, message: 'Role updated' };
    } catch (error) {
      return { success: false, message: 'Failed to update role' };
    }
  },

  async kickMember(clubId: string, requesterId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      const requesterMember = await this.getClubMember(clubId, requesterId);
      if (!requesterMember || (requesterMember.role !== 'owner' && requesterMember.role !== 'admin')) {
        return { success: false, message: 'Not authorized' };
      }
      const targetMember = await this.getClubMember(clubId, targetUserId);
      if (!targetMember) {
        return { success: false, message: 'Member not found' };
      }
      if (targetMember.role === 'owner') {
        return { success: false, message: 'Cannot kick owner' };
      }
      await this.removeClubMember(clubId, targetUserId);
      await this.updateClubMemberCount(clubId);
      return { success: true, message: 'Member kicked' };
    } catch (error) {
      return { success: false, message: 'Failed to kick member' };
    }
  },

  async sendClubInvitation(clubId: string, inviterId: string, inviteeId: string): Promise<{ success: boolean; message: string }> {
    try {
      const member = await this.getClubMember(clubId, inviterId);
      if (!member) {
        return { success: false, message: 'Not a member' };
      }
      const existing = await this.getClubInvitation(clubId, inviteeId);
      if (existing) {
        return { success: false, message: 'Invitation already sent' };
      }
      const alreadyMember = await this.getClubMember(clubId, inviteeId);
      if (alreadyMember) {
        return { success: false, message: 'User is already a member' };
      }
      await this.createClubInvitation(clubId, inviterId, inviteeId);
      return { success: true, message: 'Invitation sent' };
    } catch (error) {
      return { success: false, message: 'Failed to send invitation' };
    }
  },

  async getPendingClubInvitations(userId: string): Promise<ClubInvitation[]> {
    return this.getPendingInvitations(userId);
  },

  async acceptClubInvitation(invitationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.updateInvitationStatus(invitationId, 'accepted');
      // Note: Need to get the invitation to find the club_id and add member
      return { success: true, message: 'Invitation accepted' };
    } catch (error) {
      return { success: false, message: 'Failed to accept invitation' };
    }
  },

  async declineClubInvitation(invitationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.updateInvitationStatus(invitationId, 'declined');
      return { success: true, message: 'Invitation declined' };
    } catch (error) {
      return { success: false, message: 'Failed to decline invitation' };
    }
  },

  async deleteClubMessageWithAuth(messageId: string, userId: string, clubId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user is authorized
      const member = await this.getClubMember(clubId, userId);
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        return { success: false, message: 'Not authorized' };
      }
      await this.deleteClubMessage(messageId);
      return { success: true, message: 'Message deleted' };
    } catch (error) {
      return { success: false, message: 'Failed to delete message' };
    }
  },

  // Tournament operations
  async joinTournament(tournamentId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const participant = await this.getTournamentParticipant(tournamentId, userId);
      if (participant) {
        return { success: false, message: 'Already registered' };
      }
      await this.addTournamentParticipant(tournamentId, userId);
      return { success: true, message: 'Joined tournament' };
    } catch (error) {
      return { success: false, message: 'Failed to join tournament' };
    }
  },

  async leaveTournament(tournamentId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.removeTournamentParticipant(tournamentId, userId);
      return { success: true, message: 'Left tournament' };
    } catch (error) {
      return { success: false, message: 'Failed to leave tournament' };
    }
  },

  async startTournament(tournamentId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const tournament = await this.getTournamentById(tournamentId);
      if (!tournament) {
        return { success: false, message: 'Tournament not found' };
      }
      if (tournament.creator_id !== userId) {
        return { success: false, message: 'Not authorized' };
      }
      await this.updateTournamentStatus(tournamentId, 'active', 1, 0, null);
      return { success: true, message: 'Tournament started' };
    } catch (error) {
      return { success: false, message: 'Failed to start tournament' };
    }
  },

  async deleteTournamentWithAuth(tournamentId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const tournament = await this.getTournamentById(tournamentId);
      if (!tournament) {
        return { success: false, message: 'Tournament not found' };
      }
      if (tournament.creator_id !== userId) {
        return { success: false, message: 'Not authorized' };
      }
      await this.deleteTournament(tournamentId);
      return { success: true, message: 'Tournament deleted' };
    } catch (error) {
      return { success: false, message: 'Failed to delete tournament' };
    }
  },

  async updateTournamentGameStatus(id: string, status: string): Promise<void> {
    await pool.query(`UPDATE tournament_games SET started_at = NOW() WHERE id = $1`, [id]);
  },

  async getUserTournamentGames(tournamentId: string, userId: string): Promise<TournamentGame[]> {
    const result = await pool.query(
      `SELECT tg.*, w.username as white_username, b.username as black_username
       FROM tournament_games tg
       JOIN users w ON tg.white_id = w.id
       JOIN users b ON tg.black_id = b.id
       WHERE tg.tournament_id = $1 AND (tg.white_id = $2 OR tg.black_id = $2)
       ORDER BY tg.round ASC`,
      [tournamentId, userId]
    );
    return result.rows;
  },

  // League operations
  async joinLeague(leagueId: string, userId: string, division: number): Promise<{ success: boolean; message: string }> {
    try {
      const participant = await this.getLeagueParticipant(leagueId, userId);
      if (participant) {
        return { success: false, message: 'Already registered' };
      }
      await this.addLeagueParticipant(leagueId, userId, division);
      return { success: true, message: 'Joined league' };
    } catch (error) {
      return { success: false, message: 'Failed to join league' };
    }
  },

  async leaveLeague(leagueId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.removeLeagueParticipant(leagueId, userId);
      return { success: true, message: 'Left league' };
    } catch (error) {
      return { success: false, message: 'Failed to leave league' };
    }
  },

  async startLeague(leagueId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const league = await this.getLeagueById(leagueId);
      if (!league) {
        return { success: false, message: 'League not found' };
      }
      if (league.creator_id !== userId) {
        return { success: false, message: 'Not authorized' };
      }
      await this.updateLeagueStatus(leagueId, 'active', 1, 0);
      return { success: true, message: 'League started' };
    } catch (error) {
      return { success: false, message: 'Failed to start league' };
    }
  },

  async deleteLeagueWithAuth(leagueId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const league = await this.getLeagueById(leagueId);
      if (!league) {
        return { success: false, message: 'League not found' };
      }
      if (league.creator_id !== userId) {
        return { success: false, message: 'Not authorized' };
      }
      await this.deleteLeague(leagueId);
      return { success: true, message: 'League deleted' };
    } catch (error) {
      return { success: false, message: 'Failed to delete league' };
    }
  },

  async updateLeagueMatchStatus(id: string, status: string): Promise<void> {
    await pool.query(`UPDATE league_matches SET started_at = NOW() WHERE id = $1`, [id]);
  },

  async getUserLeagueMatches(leagueId: string, userId: string): Promise<LeagueMatch[]> {
    const result = await pool.query(
      `SELECT lm.*, h.username as home_username, a.username as away_username
       FROM league_matches lm
       JOIN users h ON lm.home_id = h.id
       JOIN users a ON lm.away_id = a.id
       WHERE lm.league_id = $1 AND (lm.home_id = $2 OR lm.away_id = $2)
       ORDER BY lm.round ASC`,
      [leagueId, userId]
    );
    return result.rows;
  },

  async getCompletedLeagues(limit: number = 20, offset: number = 0): Promise<League[]> {
    const result = await pool.query(
      `SELECT l.*, u.username as creator_username, c.name as club_name,
              (SELECT COUNT(*) FROM league_participants WHERE league_id = l.id) as participant_count
       FROM leagues l
       JOIN users u ON l.creator_id = u.id
       LEFT JOIN clubs c ON l.club_id = c.id
       WHERE l.status = 'completed'
       ORDER BY l.ended_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  async getClubLeagues(clubId: string, limit: number = 20, offset: number = 0): Promise<League[]> {
    const result = await pool.query(
      `SELECT l.*, u.username as creator_username,
              (SELECT COUNT(*) FROM league_participants WHERE league_id = l.id) as participant_count
       FROM leagues l
       JOIN users u ON l.creator_id = u.id
       WHERE l.club_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [clubId, limit, offset]
    );
    return result.rows;
  }
};

// ELO rating calculation
export function calculateEloChange(
  rating1: number,
  rating2: number,
  score1: number,
  K: number = 32
): { change1: number; change2: number } {
  const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  const expected2 = 1 / (1 + Math.pow(10, (rating1 - rating2) / 400));

  const change1 = Math.round(K * (score1 - expected1));
  const change2 = Math.round(K * ((1 - score1) - expected2));

  return { change1, change2 };
}

export default dbOperations;
