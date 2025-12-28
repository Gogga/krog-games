// ==========================================
// KROG Games Platform - Shared Types
// ==========================================

// User types
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

// Game types
export type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'unlimited';
export type GameVariant = 'standard' | 'chess960' | '3check' | 'koth';
export type PlayerColor = 'white' | 'black' | 'spectator';
export type GameResult = 'white' | 'black' | 'draw' | null;

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

export interface GameState {
  pgn: string;
  fen: string;
  lastMove: MoveInfo | null;
}

export interface MoveInfo {
  from: string;
  to: string;
  san: string;
  promotion?: string;
}

export interface ClockState {
  white: number;
  black: number;
  activeColor: PlayerColor | null;
}

// Room types
export interface Room {
  code: string;
  timeControl: TimeControl;
  variant: GameVariant;
  players: {
    white?: string;
    black?: string;
  };
  spectators: string[];
}

// Queue types
export interface QueueEntry {
  id: string;
  user_id: string;
  socket_id: string;
  rating: number;
  time_control: string;
  joined_at: string;
}

// Friend types
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

// Challenge types
export interface Challenge {
  id: string;
  from: User;
  to: User;
  timeControl: TimeControl;
  variant: GameVariant;
  created_at: Date;
}

// Club types
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

export type ClubRole = 'owner' | 'admin' | 'member';

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: ClubRole;
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

// Tournament types
export type TournamentType = 'swiss' | 'round_robin' | 'knockout' | 'arena';
export type TournamentStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  club_id: string | null;
  type: TournamentType;
  status: TournamentStatus;
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

// League types
export type LeagueType = 'individual' | 'team';
export type LeagueFormat = 'round_robin' | 'swiss' | 'double_round_robin';
export type LeagueStatus = 'registration' | 'active' | 'completed' | 'cancelled';

export interface League {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  club_id: string | null;
  type: LeagueType;
  format: LeagueFormat;
  status: LeagueStatus;
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

// Daily puzzle types
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

// KROG types
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

// Auth types
export interface TokenPayload {
  userId: string;
  username: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: Omit<User, 'password_hash'>;
  token?: string;
}

// Socket event types (for type-safe socket communication)
export interface ServerToClientEvents {
  // Room events
  room_created: (data: { code: string; timeControl: TimeControl }) => void;
  room_joined: (data: { code: string; timeControl: TimeControl }) => void;
  player_assigned: (data: { color: PlayerColor }) => void;
  player_joined: (data: { color: string }) => void;
  player_left: (data: { color: string }) => void;

  // Game events
  game_state: (data: GameState) => void;
  clock_update: (data: ClockState) => void;
  time_forfeit: (data: { loser: string; winner: string }) => void;
  game_over: (data: { reason: string; winner: GameResult }) => void;
  error: (data: { message: string }) => void;

  // Draw/Resign events
  draw_offered: (data: { by: PlayerColor }) => void;
  draw_accepted: () => void;
  draw_declined: (data: { by: PlayerColor }) => void;
  player_resigned: (data: { player: string; winner: string }) => void;

  // Rematch events
  rematch_requested: (data: { by: PlayerColor }) => void;
  rematch_accepted: () => void;
  rematch_declined: (data: { by: PlayerColor }) => void;

  // Chat events
  game_chat: (data: { username: string; message: string; timestamp: number; isSpectator: boolean }) => void;

  // Spectator events
  spectator_joined: (data: { id: string; username: string }) => void;
  spectator_left: (data: { id: string; username: string }) => void;
  spectator_list: (data: { spectators: { id: string; username: string }[] }) => void;
}

export interface ClientToServerEvents {
  // Room events
  create_room: (data: { timeControl: TimeControl; variant?: GameVariant }) => void;
  join_room: (data: { code: string }) => void;

  // Game events
  make_move: (data: { roomId: string; move: { from: string; to: string; promotion?: string } }) => void;
  reset_game: (roomId: string) => void;

  // Draw/Resign events
  offer_draw: (data: { roomId: string }) => void;
  accept_draw: (data: { roomId: string }) => void;
  decline_draw: (data: { roomId: string }) => void;
  resign: (data: { roomId: string }) => void;

  // Rematch events
  request_rematch: (data: { roomId: string }) => void;
  accept_rematch: (data: { roomId: string }) => void;
  decline_rematch: (data: { roomId: string }) => void;

  // Chat events
  chat_message: (data: { roomId: string; message: string }) => void;
}

// Utility result type
export interface OperationResult {
  success: boolean;
  message: string;
}
