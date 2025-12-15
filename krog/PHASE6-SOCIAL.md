# KROG Chess Phase 6: Social Features
# Clubs, Leagues, Streaming, Community

---

## 6.1 Overview

### Purpose
Social features transform KROG Chess from a game into a community platform where players connect, compete, form teams, and share their chess journey.

### Core Components
```
Social Features
├── Clubs & Teams
├── Leagues & Ladders
├── Tournaments (Community)
├── Streaming & Spectating
├── Friends & Messaging
├── Content Sharing
├── Leaderboards
└── Community Events
```

### KROG Integration
```
Social interactions follow normative patterns:
- O(respect_privacy) - Privacy obligations
- P(communicate) ↔ mutual_consent - Permission-based messaging
- F(harassment) - Forbidden behaviors
- R_social(mentor, student) → teaching_relationship
```

---

## 6.2 Clubs & Teams

### 6.2.1 Club Structure

```typescript
interface Club {
  id: string;
  name: string;
  tag: string;                    // 2-6 char abbreviation
  description: string;
  avatar: string;
  banner: string;
  
  // Membership
  members: ClubMember[];
  memberLimit: number;            // Free: 50, Premium: 200, Enterprise: unlimited
  invitePolicy: 'open' | 'approval' | 'invite_only';
  
  // Organization
  roles: ClubRole[];
  departments: Department[];      // Coaching, Events, Social, etc.
  
  // Activity
  forums: ForumChannel[];
  clubGames: ClubGame[];
  clubTournaments: ClubTournament[];
  
  // Stats
  averageRating: number;
  totalGames: number;
  foundedAt: Date;
  country: string;
  timezone: string;
  
  // Settings
  settings: ClubSettings;
  krogPreferences: KROGClubConfig;
}

interface ClubMember {
  id: string;
  username: string;
  role: ClubRoleId;
  joinedAt: Date;
  contributions: number;         // Activity score
  gamesForClub: number;
  titles: ClubTitle[];           // Club-specific achievements
}

interface ClubRole {
  id: string;
  name: string;
  permissions: ClubPermission[];
  color: string;
  position: number;              // Hierarchy position
}

type ClubPermission =
  | 'manage_members'
  | 'manage_roles'
  | 'manage_settings'
  | 'create_events'
  | 'moderate_forums'
  | 'manage_teams'
  | 'invite_members'
  | 'kick_members'
  | 'ban_members'
  | 'manage_club_games'
  | 'pin_messages'
  | 'all';
```

### 6.2.2 Club Hierarchy

```
Club Structure:
├── Owner (1)
│   └── Full control, cannot be removed
├── Administrators
│   └── Manage most club functions
├── Moderators
│   └── Manage forums and members
├── Coaches
│   └── Run training sessions
├── Team Captains
│   └── Manage competitive teams
├── Members
│   └── Standard access
└── Newcomers
    └── Probationary period (7 days)
```

### 6.2.3 Club Activities

```typescript
interface ClubGame {
  id: string;
  type: 'internal_match' | 'club_vs_club' | 'training';
  
  // Match details
  whitePlayer: ClubMember;
  blackPlayer: ClubMember;
  timeControl: TimeControl;
  
  // Club context
  forTeam?: TeamId;
  forLeague?: LeagueId;
  coached: boolean;
  
  // Results
  result: GameResult;
  krogAnnotations: KROGAnnotation[];
}

interface ClubTournament {
  id: string;
  name: string;
  type: 'swiss' | 'round_robin' | 'knockout' | 'arena';
  
  // Participation
  entryType: 'club_only' | 'invite_guests' | 'open';
  maxParticipants: number;
  
  // Schedule
  startTime: Date;
  rounds: number;
  timeControl: TimeControl;
  
  // Prizes
  prizes: ClubPrize[];
  
  // KROG features
  requiredLevel?: number;
  krogExplanations: boolean;
}

interface TrainingSession {
  id: string;
  coach: ClubMember;
  title: string;
  description: string;
  
  type: 'lecture' | 'simul' | 'puzzle_session' | 'game_review' | 'opening_prep';
  
  // Schedule
  scheduledAt: Date;
  duration: number;              // minutes
  recurring?: RecurrenceRule;
  
  // Participation
  maxAttendees: number;
  attendees: ClubMember[];
  
  // Materials
  studyId?: string;
  puzzleSetId?: string;
  pgn?: string;
  
  // KROG integration
  krogTopics: string[];          // KROG concepts covered
  skillLevel: number;            // 0-7
}
```

### 6.2.4 Club vs Club Matches

```typescript
interface ClubMatch {
  id: string;
  homeClub: Club;
  awayClub: Club;
  
  // Format
  boards: number;                // Number of boards (4-20)
  timeControl: TimeControl;
  
  // Scheduling
  proposedTimes: Date[];
  confirmedTime?: Date;
  deadline: Date;
  
  // Board assignments
  homeLineup: BoardAssignment[];
  awayLineup: BoardAssignment[];
  
  // Rules
  ratingRestrictions?: {
    minRating?: number;
    maxRating?: number;
    maxRatingDiff?: number;
  };
  
  // Status
  status: 'proposed' | 'accepted' | 'scheduled' | 'in_progress' | 'completed';
  
  // Results
  games: ClubMatchGame[];
  homeScore: number;
  awayScore: number;
  
  // KROG
  krogMatch: boolean;            // Show KROG explanations
}

interface BoardAssignment {
  board: number;
  player: ClubMember;
  rating: number;
}
```

---

## 6.3 Leagues & Ladders

### 6.3.1 League System

```typescript
interface League {
  id: string;
  name: string;
  description: string;
  
  // Structure
  type: 'team' | 'individual';
  format: 'round_robin' | 'swiss' | 'double_round_robin';
  divisions: Division[];
  
  // Season
  season: number;
  startDate: Date;
  endDate: Date;
  
  // Rules
  rules: LeagueRules;
  timeControl: TimeControl;
  
  // Standings
  standings: LeagueStanding[];
  
  // Promotion/Relegation
  promotionSpots: number;
  relegationSpots: number;
  
  // KROG
  krogLeague: boolean;           // KROG-focused league
}

interface Division {
  id: string;
  name: string;                  // "Division 1", "Premier", etc.
  tier: number;                  // 1 = top
  
  participants: LeagueParticipant[];
  matches: LeagueMatch[];
  standings: DivisionStanding[];
}

interface LeagueParticipant {
  type: 'club' | 'player';
  id: string;
  name: string;
  rating: number;
  
  // Season stats
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  
  // Performance
  gamePoints: number;            // Individual game scores
  buchholz?: number;             // Tiebreak
}

interface LeagueRules {
  gamesPerMatch: number;         // For team leagues
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  
  // Forfeits
  forfeitPenalty: number;
  maxForfeits: number;           // Before disqualification
  
  // Scheduling
  roundDuration: number;         // Days per round
  rescheduleAllowed: boolean;
  maxReschedules: number;
  
  // Rating restrictions
  ratingCap?: number;
  ratingFloor?: number;
}
```

### 6.3.2 Ladder System

```typescript
interface Ladder {
  id: string;
  name: string;
  description: string;
  
  // Type
  type: 'individual' | 'team';
  timeControl: TimeControl;
  variant: ChessVariant;
  
  // Participants
  players: LadderPlayer[];
  maxPlayers?: number;
  
  // Rules
  challengeRules: ChallengeRules;
  decayRules: DecayRules;
  
  // Activity
  recentMatches: LadderMatch[];
  activeChallengers: Challenge[];
}

interface LadderPlayer {
  id: string;
  username: string;
  position: number;
  rating: number;
  
  // Activity
  lastActive: Date;
  gamesThisWeek: number;
  
  // Stats
  wins: number;
  losses: number;
  currentStreak: number;
}

interface ChallengeRules {
  // Who can challenge
  maxPositionsUp: number;        // Can challenge players up to N spots above
  challengesPerDay: number;
  
  // Response time
  responseDeadline: number;      // Hours to accept/decline
  playDeadline: number;          // Hours to complete game after acceptance
  
  // Cooldown
  rechallengeCooldown: number;   // Hours before can challenge same player
}

interface DecayRules {
  inactivityThreshold: number;   // Days before decay starts
  decayRate: number;             // Positions lost per day
  protectedPositions: number[];  // Top N protected from decay
}

interface Challenge {
  id: string;
  challenger: LadderPlayer;
  challenged: LadderPlayer;
  
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed';
  
  createdAt: Date;
  respondBy: Date;
  playBy?: Date;
  
  game?: LadderMatch;
  result?: 'challenger_won' | 'challenged_won' | 'draw';
  
  // Position swap
  newPositions?: {
    challenger: number;
    challenged: number;
  };
}
```

### 6.3.3 Promotion/Relegation

```yaml
Season End Process:
  1. Final standings calculated
  2. Tiebreaks applied (Buchholz, head-to-head, etc.)
  3. Promotion/relegation determined:
     - Top N promote to higher division
     - Bottom M relegate to lower division
     - Playoff option for borderline positions
  4. New season divisions formed
  5. Notifications sent to all participants
  
KROG Formalization:
  promotion(player) ↔ position(player) ≤ promotion_spots
  relegation(player) ↔ position(player) > (total - relegation_spots)
  playoff(player) ↔ position(player) ∈ playoff_zone
```

---

## 6.4 Streaming & Spectating

### 6.4.1 Spectator Mode

```typescript
interface SpectatorSession {
  gameId: string;
  spectators: Spectator[];
  
  // View options
  viewMode: 'live' | 'delayed';  // Delayed for anti-cheating
  delay: number;                 // Seconds (0-900)
  
  // Features available
  features: {
    chat: boolean;
    analysis: boolean;           // Can use engine
    krogExplanations: boolean;   // See KROG analysis
    arrows: boolean;             // Draw arrows
    evaluation: boolean;         // See eval bar
  };
  
  // Broadcasting
  broadcaster?: Broadcaster;
  commentary?: Commentary;
}

interface Spectator {
  id: string;
  username: string;
  isAnonymous: boolean;
  
  joinedAt: Date;
  viewPreferences: ViewPreferences;
}

interface ViewPreferences {
  boardTheme: string;
  pieceSet: string;
  showCoordinates: boolean;
  showKROG: boolean;
  soundEnabled: boolean;
  autoFlip: boolean;            // Flip board based on whose move
}
```

### 6.4.2 Broadcasting System

```typescript
interface Broadcast {
  id: string;
  title: string;
  description: string;
  
  // Broadcaster
  broadcaster: {
    id: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  
  // Content
  type: 'single_game' | 'tournament' | 'event' | 'educational';
  games: BroadcastGame[];
  
  // Stream settings
  isLive: boolean;
  startTime: Date;
  endTime?: Date;
  
  // Audience
  viewers: number;
  peakViewers: number;
  chatEnabled: boolean;
  
  // Monetization
  subscribersOnly: boolean;
  donationsEnabled: boolean;
  
  // Recording
  recorded: boolean;
  vodUrl?: string;
}

interface BroadcastGame {
  gameId: string;
  board: number;                 // For multi-board events
  
  // Players
  white: BroadcastPlayer;
  black: BroadcastPlayer;
  
  // Game state
  fen: string;
  pgn: string;
  result?: GameResult;
  
  // Commentary
  annotations: BroadcastAnnotation[];
}

interface BroadcastAnnotation {
  ply: number;                   // Half-move number
  type: 'text' | 'arrow' | 'highlight' | 'krog';
  
  // Content based on type
  text?: string;
  arrow?: { from: Square; to: Square; color: string };
  highlight?: { square: Square; color: string };
  krogFormula?: string;
}

interface Commentary {
  commentators: Commentator[];
  mode: 'text' | 'audio' | 'video';
  
  // For audio/video
  streamUrl?: string;
  
  // For text
  messages: CommentaryMessage[];
}
```

### 6.4.3 Featured Broadcasts

```typescript
interface FeaturedContent {
  // Homepage features
  liveNow: Broadcast[];
  upcoming: ScheduledBroadcast[];
  
  // Categories
  topGames: LiveGame[];          // Highest-rated games in progress
  tournamentGames: LiveGame[];   // Official tournament games
  educationalStreams: Broadcast[];
  
  // Recommendations
  recommended: {
    basedOnHistory: Broadcast[];
    followedPlayers: LiveGame[];
    clubMatches: LiveGame[];
  };
}

interface ScheduledBroadcast {
  id: string;
  title: string;
  broadcaster: Broadcaster;
  
  startTime: Date;
  expectedDuration: number;
  
  // Notifications
  subscriberCount: number;
  reminderSet: boolean;
}
```

---

## 6.5 Friends & Messaging

### 6.5.1 Friend System

```typescript
interface FriendSystem {
  friends: Friend[];
  pending: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
  blocked: BlockedUser[];
  
  // Settings
  settings: FriendSettings;
}

interface Friend {
  id: string;
  username: string;
  avatar: string;
  
  // Status
  status: 'online' | 'playing' | 'idle' | 'offline';
  currentGame?: GameId;
  lastSeen: Date;
  
  // Friendship
  friendsSince: Date;
  nickname?: string;             // Personal nickname
  notes?: string;                // Private notes
  
  // Stats together
  gamesPlayed: number;
  myWins: number;
  theirWins: number;
  draws: number;
}

interface FriendRequest {
  id: string;
  from: User;
  to: User;
  message?: string;
  sentAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
}

interface FriendSettings {
  allowRequests: 'anyone' | 'friends_of_friends' | 'nobody';
  showOnlineStatus: 'everyone' | 'friends' | 'nobody';
  showCurrentGame: 'everyone' | 'friends' | 'nobody';
  showRating: 'everyone' | 'friends' | 'nobody';
}
```

### 6.5.2 Messaging System

```typescript
interface MessagingSystem {
  conversations: Conversation[];
  unreadCount: number;
  
  settings: MessageSettings;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  
  // Participants
  participants: ConversationParticipant[];
  
  // Messages
  messages: Message[];
  lastMessage: Message;
  
  // Status
  unreadCount: number;
  muted: boolean;
  archived: boolean;
}

interface Message {
  id: string;
  sender: User;
  
  // Content
  type: 'text' | 'game_link' | 'puzzle_link' | 'study_link' | 'image';
  content: string;
  
  // Metadata
  sentAt: Date;
  editedAt?: Date;
  readBy: UserId[];
  
  // Reactions
  reactions: MessageReaction[];
  
  // Moderation
  reported: boolean;
  deleted: boolean;
}

interface MessageSettings {
  allowMessages: 'anyone' | 'friends' | 'nobody';
  allowGameChallenges: 'anyone' | 'friends' | 'nobody';
  showTypingIndicator: boolean;
  readReceipts: boolean;
}

// KROG: Privacy formalization
const messagePermissions = `
  P(send_message, A, B) ↔ 
    friends(A, B) ∨ 
    (settings(B).allowMessages = 'anyone' ∧ ¬blocked(A, B))
  
  F(message) when harassment ∨ spam ∨ inappropriate
`;
```

### 6.5.3 Notifications

```typescript
interface NotificationSystem {
  notifications: Notification[];
  preferences: NotificationPreferences;
}

interface Notification {
  id: string;
  type: NotificationType;
  
  // Content
  title: string;
  body: string;
  icon: string;
  
  // Action
  actionUrl?: string;
  actions?: NotificationAction[];
  
  // Status
  read: boolean;
  createdAt: Date;
}

type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'game_challenge'
  | 'game_started'
  | 'game_ended'
  | 'tournament_starting'
  | 'tournament_round'
  | 'club_invite'
  | 'club_match'
  | 'ladder_challenge'
  | 'message'
  | 'achievement'
  | 'follower'
  | 'mention'
  | 'system';

interface NotificationPreferences {
  // Channels
  inApp: boolean;
  email: boolean;
  push: boolean;
  
  // Per-type settings
  types: {
    [key in NotificationType]: {
      enabled: boolean;
      channels: ('inApp' | 'email' | 'push')[];
    };
  };
  
  // Quiet hours
  quietHours: {
    enabled: boolean;
    start: string;               // "22:00"
    end: string;                 // "08:00"
    timezone: string;
  };
}
```

---

## 6.6 Content Sharing

### 6.6.1 Studies

```typescript
interface Study {
  id: string;
  name: string;
  description: string;
  
  // Ownership
  owner: User;
  collaborators: StudyCollaborator[];
  
  // Content
  chapters: StudyChapter[];
  
  // Visibility
  visibility: 'private' | 'unlisted' | 'club' | 'public';
  cloneable: boolean;
  
  // Engagement
  likes: number;
  clones: number;
  views: number;
  comments: Comment[];
  
  // KROG
  krogAnnotations: boolean;
  krogLevel: number;
}

interface StudyChapter {
  id: string;
  name: string;
  
  // Position
  initialFen: string;
  orientation: 'white' | 'black';
  
  // Moves
  moves: StudyMove[];           // Tree structure
  
  // Annotations
  annotations: ChapterAnnotation[];
  
  // Practice mode
  practiceMode: 'disabled' | 'white' | 'black' | 'both';
}

interface StudyMove {
  san: string;
  fen: string;
  
  // Annotations
  comment?: string;
  nags?: number[];              // $1 = !, $2 = ?, etc.
  arrows?: Arrow[];
  highlights?: Square[];
  
  // KROG
  krogAnalysis?: {
    formula: string;
    explanation: string;
    concept: string;
  };
  
  // Variations
  variations: StudyMove[][];
}

interface StudyCollaborator {
  user: User;
  role: 'viewer' | 'contributor' | 'admin';
  addedAt: Date;
}
```

### 6.6.2 Blog Posts

```typescript
interface BlogPost {
  id: string;
  author: User;
  
  // Content
  title: string;
  summary: string;
  content: string;               // Markdown
  
  // Media
  coverImage?: string;
  embeddedGames: EmbeddedGame[];
  embeddedStudies: EmbeddedStudy[];
  
  // Categorization
  tags: string[];
  category: BlogCategory;
  
  // Publication
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  
  // Engagement
  views: number;
  likes: number;
  comments: Comment[];
  shares: number;
  
  // KROG
  krogConcepts: string[];        // KROG concepts discussed
}

interface EmbeddedGame {
  gameId: string;
  startPly?: number;
  endPly?: number;
  orientation: 'white' | 'black';
  showKROG: boolean;
}
```

### 6.6.3 Game Sharing

```typescript
interface SharedGame {
  gameId: string;
  
  // Share options
  shareUrl: string;
  embedCode: string;
  gifUrl?: string;               // Animated GIF of game
  
  // Customization
  startPly: number;
  endPly: number;
  orientation: 'white' | 'black';
  
  // Features
  showEvaluation: boolean;
  showKROG: boolean;
  showClock: boolean;
  
  // Social
  title?: string;
  description?: string;
}

// Generate share URLs
const shareFormats = {
  twitter: (game: SharedGame) => 
    `https://twitter.com/intent/tweet?url=${game.shareUrl}&text=${game.title}`,
  
  reddit: (game: SharedGame) =>
    `https://reddit.com/submit?url=${game.shareUrl}&title=${game.title}`,
  
  discord: (game: SharedGame) =>
    game.shareUrl,  // Discord auto-embeds
  
  embed: (game: SharedGame) =>
    `<iframe src="${game.shareUrl}/embed" width="600" height="400"></iframe>`
};
```

---

## 6.7 Leaderboards

### 6.7.1 Global Leaderboards

```typescript
interface Leaderboard {
  id: string;
  name: string;
  type: LeaderboardType;
  
  // Scope
  scope: 'global' | 'country' | 'club' | 'friends';
  country?: string;
  clubId?: string;
  
  // Time period
  period: 'all_time' | 'season' | 'month' | 'week' | 'day';
  
  // Entries
  entries: LeaderboardEntry[];
  totalEntries: number;
  
  // User position
  myPosition?: number;
  myEntry?: LeaderboardEntry;
  
  // Updates
  lastUpdated: Date;
  updateFrequency: 'realtime' | 'hourly' | 'daily';
}

type LeaderboardType =
  | 'rating_bullet'
  | 'rating_blitz'
  | 'rating_rapid'
  | 'rating_classical'
  | 'puzzle_rating'
  | 'puzzle_streak'
  | 'puzzle_rush'
  | 'games_played'
  | 'games_won'
  | 'win_streak'
  | 'time_played'
  | 'lessons_completed'
  | 'krog_mastery'
  | 'tournament_wins';

interface LeaderboardEntry {
  position: number;
  previousPosition?: number;     // For tracking movement
  
  // Player
  user: {
    id: string;
    username: string;
    avatar: string;
    title?: ChessTitle;
    country: string;
    isOnline: boolean;
  };
  
  // Score
  value: number;
  formattedValue: string;        // "2847", "1:23:45", "156 games"
  
  // Trend
  change: number;                // Positions gained/lost
  trend: 'up' | 'down' | 'stable' | 'new';
}
```

### 6.7.2 Achievement Leaderboards

```typescript
interface AchievementLeaderboard {
  // Categories
  totalAchievements: Leaderboard;
  rareAchievements: Leaderboard;
  recentAchievements: Leaderboard;
  
  // By category
  byCategory: {
    learning: Leaderboard;
    puzzles: Leaderboard;
    gameplay: Leaderboard;
    social: Leaderboard;
    krog: Leaderboard;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // Rarity
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedBy: number;              // Percentage of players
  
  // Category
  category: AchievementCategory;
  
  // Requirements
  requirement: AchievementRequirement;
  progress?: number;             // 0-100 for progressive achievements
  
  // Rewards
  rewards: AchievementReward[];
  
  // KROG special achievements
  krogAchievement: boolean;
}
```

---

## 6.8 Community Events

### 6.8.1 Event System

```typescript
interface CommunityEvent {
  id: string;
  name: string;
  description: string;
  banner: string;
  
  // Organizer
  organizer: {
    type: 'official' | 'club' | 'user';
    id: string;
    name: string;
  };
  
  // Type
  type: EventType;
  
  // Schedule
  startTime: Date;
  endTime: Date;
  timezone: string;
  
  // Participation
  maxParticipants?: number;
  participants: EventParticipant[];
  registrationDeadline?: Date;
  
  // Requirements
  requirements: EventRequirements;
  
  // Prizes
  prizes: EventPrize[];
  
  // Content
  activities: EventActivity[];
}

type EventType =
  | 'tournament'
  | 'simul'
  | 'lecture'
  | 'puzzle_competition'
  | 'team_battle'
  | 'marathon'
  | 'charity'
  | 'celebration';

interface EventActivity {
  id: string;
  name: string;
  startTime: Date;
  duration: number;
  
  type: 'tournament' | 'simul' | 'lecture' | 'puzzle_rush' | 'custom';
  
  // Details based on type
  details: TournamentDetails | SimulDetails | LectureDetails | PuzzleRushDetails;
}
```

### 6.8.2 Simultaneous Exhibitions

```typescript
interface Simul {
  id: string;
  host: {
    id: string;
    username: string;
    title?: ChessTitle;
    rating: number;
  };
  
  // Settings
  name: string;
  description: string;
  
  // Game settings
  timeControl: {
    host: TimeControl;           // Usually more time
    participants: TimeControl;   // Usually less time
  };
  color: 'white' | 'black' | 'random';
  variant: ChessVariant;
  
  // Participation
  maxBoards: number;
  participants: SimulParticipant[];
  
  // Requirements
  minRating?: number;
  maxRating?: number;
  
  // Status
  status: 'upcoming' | 'in_progress' | 'completed';
  
  // Results
  hostWins: number;
  hostLosses: number;
  draws: number;
}

interface SimulParticipant {
  user: User;
  board: number;
  game?: Game;
  result?: 'win' | 'loss' | 'draw' | 'ongoing';
}
```

### 6.8.3 Team Battles

```typescript
interface TeamBattle {
  id: string;
  name: string;
  
  // Format
  teams: TeamBattleTeam[];
  duration: number;              // Minutes
  
  // Scoring
  scoringSystem: 'arena' | 'fixed';
  
  // Settings
  timeControl: TimeControl;
  variant: ChessVariant;
  berserking: boolean;
  
  // Participation
  minPlayers: number;
  maxPlayers: number;
  
  // Schedule
  startTime: Date;
  status: 'upcoming' | 'in_progress' | 'completed';
  
  // Results
  standings: TeamBattleStanding[];
  topScorers: TeamBattleScorer[];
}

interface TeamBattleTeam {
  id: string;
  name: string;
  club?: Club;
  
  players: TeamBattlePlayer[];
  score: number;
}

interface TeamBattlePlayer {
  user: User;
  score: number;
  gamesPlayed: number;
  performance: number;
}
```

---

## 6.9 Moderation System

### 6.9.1 Report System

```typescript
interface Report {
  id: string;
  reporter: User;
  reported: User;
  
  // What's being reported
  targetType: 'user' | 'game' | 'message' | 'study' | 'post' | 'comment';
  targetId: string;
  
  // Reason
  category: ReportCategory;
  description: string;
  evidence?: string[];           // URLs, screenshots
  
  // Status
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Resolution
  moderator?: Moderator;
  resolution?: ReportResolution;
  resolvedAt?: Date;
}

type ReportCategory =
  | 'cheating'
  | 'harassment'
  | 'hate_speech'
  | 'inappropriate_content'
  | 'spam'
  | 'impersonation'
  | 'sandbagging'
  | 'stalling'
  | 'other';

interface ReportResolution {
  action: ModAction;
  notes: string;
  appealable: boolean;
}

type ModAction =
  | 'no_action'
  | 'warning'
  | 'mute_chat'
  | 'temp_ban'
  | 'perm_ban'
  | 'rating_rollback'
  | 'game_annulled';
```

### 6.9.2 Anti-Cheat System

```typescript
interface AntiCheatSystem {
  // Detection methods
  methods: {
    moveTimeAnalysis: boolean;
    engineCorrelation: boolean;
    behaviorPatterns: boolean;
    tabSwitchDetection: boolean;
    mouseMovementAnalysis: boolean;
  };
  
  // Thresholds
  thresholds: {
    engineCorrelation: number;   // 0-100
    suspiciousBehavior: number;
    confidenceRequired: number;
  };
}

interface CheatAnalysis {
  gameId: string;
  player: User;
  
  // Metrics
  engineCorrelation: number;
  averageCentipawnLoss: number;
  blunderRate: number;
  moveTimeConsistency: number;
  
  // Red flags
  flags: CheatFlag[];
  
  // Verdict
  verdict: 'clean' | 'suspicious' | 'likely_cheating' | 'confirmed';
  confidence: number;
  
  // Action
  autoAction?: ModAction;
  requiresReview: boolean;
}

interface CheatFlag {
  type: 'perfect_moves' | 'engine_correlation' | 'time_pattern' | 'tab_focus' | 'rating_manipulation';
  description: string;
  severity: 'low' | 'medium' | 'high';
  evidence: any;
}
```

---

## 6.10 KROG Social Integration

### 6.10.1 KROG in Social Features

```typescript
interface KROGSocialFeatures {
  // Club features
  clubTraining: {
    krogLessons: boolean;        // Club can run KROG-focused training
    krogRequirements: boolean;   // Club can require KROG level
    krogLeaderboard: boolean;    // Track KROG mastery
  };
  
  // Sharing features
  sharing: {
    krogAnnotatedGames: boolean; // Share games with KROG analysis
    krogStudies: boolean;        // Create KROG-focused studies
    krogPuzzles: boolean;        // Share KROG-analyzed puzzles
  };
  
  // Competition features
  competition: {
    krogLeagues: boolean;        // Leagues with KROG explanations
    krogTournaments: boolean;    // Tournaments with KROG features
    krogLadders: boolean;        // Ladders with KROG integration
  };
  
  // Educational features
  education: {
    krogMentoring: boolean;      // Mentor with KROG tools
    krogExplanations: boolean;   // Explain with KROG formulas
    krogProgress: boolean;       // Track KROG learning progress
  };
}

// KROG Social Formulas
const krogSocialRules = `
  // Mentoring relationship
  R_mentor(A, B) ↔ 
    skill_level(A) > skill_level(B) + 2 ∧
    agreed(A, mentor_role) ∧
    agreed(B, student_role)
  
  // Teaching obligation
  R_mentor(A, B) → O(A, provide_guidance)
  
  // Learning permission
  R_mentor(A, B) → P(B, ask_questions)
  
  // Club membership obligations
  member(P, Club) → O(P, follow_club_rules)
  member(P, Club) → O(P, respect_other_members)
  
  // Competition fairness
  participant(P, Tournament) → O(P, play_fairly)
  participant(P, Tournament) → F(P, use_engine)
`;
```

### 6.10.2 KROG Achievements (Social)

```typescript
const krogSocialAchievements = [
  {
    id: "krog_teacher",
    name: { en: "KROG Teacher", no: "KROG Lærer" },
    description: "Explain a move using KROG formulas in 10 different games",
    rarity: "rare",
    krogFormula: "count(explain_with_krog) ≥ 10"
  },
  {
    id: "krog_club_leader",
    name: { en: "KROG Club Leader", no: "KROG Klubbleder" },
    description: "Lead a club where all members have KROG Level 3+",
    rarity: "epic",
    krogFormula: "∀m ∈ club.members: skill_level(m) ≥ 3"
  },
  {
    id: "krog_tournament_champion",
    name: { en: "KROG Champion", no: "KROG Mester" },
    description: "Win a KROG-focused tournament",
    rarity: "epic",
    krogFormula: "winner(P, krog_tournament)"
  },
  {
    id: "krog_mentor",
    name: { en: "KROG Mentor", no: "KROG Mentor" },
    description: "Help 5 players increase their KROG level",
    rarity: "rare",
    krogFormula: "count(mentored_level_ups) ≥ 5"
  }
];
```

---

## 6.11 Implementation Checklist

### Database Schema

```sql
-- Clubs
CREATE TABLE clubs (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tag VARCHAR(6) NOT NULL,
  description TEXT,
  avatar_url VARCHAR(255),
  banner_url VARCHAR(255),
  owner_id UUID REFERENCES users(id),
  member_limit INT DEFAULT 50,
  invite_policy VARCHAR(20) DEFAULT 'approval',
  country VARCHAR(2),
  timezone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE club_members (
  club_id UUID REFERENCES clubs(id),
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES club_roles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  contributions INT DEFAULT 0,
  PRIMARY KEY (club_id, user_id)
);

-- Leagues
CREATE TABLE leagues (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  format VARCHAR(20) NOT NULL,
  season INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships
CREATE TABLE friendships (
  user_a UUID REFERENCES users(id),
  user_b UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_a, user_b)
);

-- Messages
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  reporter_id UUID REFERENCES users(id),
  reported_id UUID REFERENCES users(id),
  target_type VARCHAR(20),
  target_id UUID,
  category VARCHAR(30),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Implementation Tasks

```
Phase 6 Implementation:

[ ] 6.1 Core Infrastructure
    [ ] Club CRUD operations
    [ ] Membership management
    [ ] Role/permission system

[ ] 6.2 Clubs & Teams
    [ ] Club creation flow
    [ ] Member invitation system
    [ ] Club forums
    [ ] Club tournaments
    [ ] Training sessions
    [ ] Club vs Club matches

[ ] 6.3 Leagues & Ladders
    [ ] League creation
    [ ] Division management
    [ ] Match scheduling
    [ ] Standings calculation
    [ ] Promotion/relegation
    [ ] Ladder challenges

[ ] 6.4 Streaming & Spectating
    [ ] Spectator mode
    [ ] Broadcast system
    [ ] Commentary tools
    [ ] VOD recording

[ ] 6.5 Friends & Messaging
    [ ] Friend system
    [ ] Direct messaging
    [ ] Group chats
    [ ] Notifications

[ ] 6.6 Content Sharing
    [ ] Study system
    [ ] Blog platform
    [ ] Game sharing
    [ ] Embed codes

[ ] 6.7 Leaderboards
    [ ] Global leaderboards
    [ ] Filtered leaderboards
    [ ] Achievement tracking

[ ] 6.8 Community Events
    [ ] Event system
    [ ] Simultaneous exhibitions
    [ ] Team battles
    [ ] Custom events

[ ] 6.9 Moderation
    [ ] Report system
    [ ] Mod tools
    [ ] Anti-cheat integration
    [ ] Ban system

[ ] 6.10 KROG Integration
    [ ] KROG-focused features
    [ ] Social achievements
    [ ] Mentoring system
```

---

## 6.12 Summary

Phase 6 transforms KROG Chess into a complete social platform with:

1. **Clubs**: Full-featured team system with hierarchies, tournaments, and training
2. **Leagues**: Competitive structured play with divisions and seasons
3. **Streaming**: Live broadcasting with commentary and KROG explanations
4. **Social**: Friends, messaging, and content sharing
5. **Events**: Community tournaments, simuls, and team battles
6. **Moderation**: Comprehensive safety and anti-cheat systems
7. **KROG Integration**: Social features enhanced with KROG formalization

Total specification: ~1500 lines covering all social features for a complete chess community platform.
