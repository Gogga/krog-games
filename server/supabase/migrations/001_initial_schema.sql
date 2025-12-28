-- KROG Chess Database Schema for Supabase (PostgreSQL)
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rating INTEGER DEFAULT 1200,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_drawn INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_rating ON users(rating DESC);

-- ============================================================================
-- GAMES
-- ============================================================================

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  room_code TEXT NOT NULL,
  white_id TEXT REFERENCES users(id),
  black_id TEXT REFERENCES users(id),
  pgn TEXT,
  result TEXT,
  time_control TEXT,
  variant TEXT DEFAULT 'standard',
  white_rating_before INTEGER,
  black_rating_before INTEGER,
  white_rating_change INTEGER,
  black_rating_change INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_games_white ON games(white_id);
CREATE INDEX idx_games_black ON games(black_id);
CREATE INDEX idx_games_created ON games(created_at DESC);

-- ============================================================================
-- RATING HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS rating_history (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  rating_change INTEGER NOT NULL,
  game_id TEXT REFERENCES games(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rating_history_user ON rating_history(user_id);

-- ============================================================================
-- MATCHMAKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  socket_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  time_control TEXT NOT NULL,
  variant TEXT DEFAULT 'standard',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_matchmaking_rating ON matchmaking_queue(rating);
CREATE INDEX idx_matchmaking_time_control ON matchmaking_queue(time_control);

-- ============================================================================
-- FRIENDSHIPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  friend_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friendships_user ON friendships(user_id);
CREATE INDEX idx_friendships_friend ON friendships(friend_id);

-- ============================================================================
-- CLUBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES users(id),
  logo_emoji TEXT DEFAULT '♔',
  member_count INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clubs_owner ON clubs(owner_id);
CREATE INDEX idx_clubs_public ON clubs(is_public);

CREATE TABLE IF NOT EXISTS club_members (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_user ON club_members(user_id);

CREATE TABLE IF NOT EXISTS club_messages (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_club_messages_club ON club_messages(club_id);
CREATE INDEX idx_club_messages_created ON club_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS club_invitations (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  club_id TEXT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  inviter_id TEXT NOT NULL REFERENCES users(id),
  invitee_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, invitee_id)
);

-- ============================================================================
-- TOURNAMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL REFERENCES users(id),
  club_id TEXT REFERENCES clubs(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'swiss',
  status TEXT NOT NULL DEFAULT 'upcoming',
  time_control TEXT NOT NULL DEFAULT '5+0',
  variant TEXT DEFAULT 'standard',
  max_participants INTEGER DEFAULT 32,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  starts_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tournaments_creator ON tournaments(creator_id);
CREATE INDEX idx_tournaments_club ON tournaments(club_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  score REAL DEFAULT 0,
  buchholz REAL DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  performance_rating INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  seed INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON tournament_participants(user_id);

CREATE TABLE IF NOT EXISTS tournament_games (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  board INTEGER DEFAULT 1,
  white_id TEXT NOT NULL REFERENCES users(id),
  black_id TEXT NOT NULL REFERENCES users(id),
  room_code TEXT,
  result TEXT,
  white_score REAL,
  black_score REAL,
  pgn TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tournament_games_tournament ON tournament_games(tournament_id);
CREATE INDEX idx_tournament_games_round ON tournament_games(tournament_id, round);

-- ============================================================================
-- LEAGUES
-- ============================================================================

CREATE TABLE IF NOT EXISTS leagues (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL REFERENCES users(id),
  club_id TEXT REFERENCES clubs(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'individual',
  format TEXT NOT NULL DEFAULT 'round_robin',
  status TEXT NOT NULL DEFAULT 'registration',
  time_control TEXT NOT NULL DEFAULT '10+0',
  variant TEXT DEFAULT 'standard',
  season TEXT,
  divisions INTEGER DEFAULT 1,
  promotion_spots INTEGER DEFAULT 2,
  relegation_spots INTEGER DEFAULT 2,
  points_for_win INTEGER DEFAULT 3,
  points_for_draw INTEGER DEFAULT 1,
  points_for_loss INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  starts_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_leagues_creator ON leagues(creator_id);
CREATE INDEX idx_leagues_club ON leagues(club_id);
CREATE INDEX idx_leagues_status ON leagues(status);

CREATE TABLE IF NOT EXISTS league_participants (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  league_id TEXT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  division INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  form TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

CREATE INDEX idx_league_participants_league ON league_participants(league_id);
CREATE INDEX idx_league_participants_division ON league_participants(league_id, division);

CREATE TABLE IF NOT EXISTS league_matches (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  league_id TEXT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  home_id TEXT NOT NULL REFERENCES users(id),
  away_id TEXT NOT NULL REFERENCES users(id),
  room_code TEXT,
  result TEXT,
  home_score REAL,
  away_score REAL,
  pgn TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_league_matches_league ON league_matches(league_id);
CREATE INDEX idx_league_matches_round ON league_matches(league_id, round);

-- ============================================================================
-- DAILY PUZZLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_puzzles (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  puzzle_id TEXT NOT NULL,
  puzzle_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_daily_puzzles_date ON daily_puzzles(puzzle_date);

CREATE TABLE IF NOT EXISTS daily_puzzle_completions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  puzzle_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_ms INTEGER,
  attempts INTEGER DEFAULT 1,
  UNIQUE(user_id, puzzle_date)
);

CREATE INDEX idx_daily_puzzle_completions_user ON daily_puzzle_completions(user_id);
CREATE INDEX idx_daily_puzzle_completions_date ON daily_puzzle_completions(puzzle_date);

CREATE TABLE IF NOT EXISTS daily_puzzle_streaks (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  total_completed INTEGER DEFAULT 0
);

-- ============================================================================
-- KROG ACTIVITY & LEADERBOARD
-- ============================================================================

CREATE TABLE IF NOT EXISTS krog_activity (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL,
  move_san TEXT,
  r_type TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_krog_activity_user ON krog_activity(user_id);
CREATE INDEX idx_krog_activity_type ON krog_activity(activity_type);

CREATE TABLE IF NOT EXISTS krog_stats (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  explanations_viewed INTEGER DEFAULT 0,
  explanations_shared INTEGER DEFAULT 0,
  unique_rtypes_seen TEXT DEFAULT '',
  unique_operators_seen TEXT DEFAULT '',
  last_activity_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE krog_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE krog_stats ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON games FOR ALL USING (true);
CREATE POLICY "Service role full access" ON rating_history FOR ALL USING (true);
CREATE POLICY "Service role full access" ON friendships FOR ALL USING (true);
CREATE POLICY "Service role full access" ON clubs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON club_members FOR ALL USING (true);
CREATE POLICY "Service role full access" ON club_messages FOR ALL USING (true);
CREATE POLICY "Service role full access" ON tournaments FOR ALL USING (true);
CREATE POLICY "Service role full access" ON leagues FOR ALL USING (true);
CREATE POLICY "Service role full access" ON krog_activity FOR ALL USING (true);
CREATE POLICY "Service role full access" ON krog_stats FOR ALL USING (true);
