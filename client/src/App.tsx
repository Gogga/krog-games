import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { io } from 'socket.io-client';
import { Chess } from 'chess.js';
import ChessBoard, { BoardTheme, BOARD_THEMES, PieceTheme, PIECE_THEMES } from './components/ChessBoard';
import { useMediaQuery } from './hooks/useMediaQuery';
import { ChessSounds, resumeAudio } from './utils/sounds';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { UserPanel } from './components/UserPanel';
import { MatchmakingPanel } from './components/MatchmakingPanel';
import MoveExplanationModal from './components/MoveExplanationModal';
import { MobileNav } from './components/MobileNav';
import { getStoredToken } from './api/auth';
import './index.css';

// Lazy load heavy components for better initial load performance
const PuzzleMode = lazy(() => import('./components/PuzzleMode'));
const DailyPuzzle = lazy(() => import('./components/DailyPuzzle'));
const OpeningExplorer = lazy(() => import('./components/OpeningExplorer'));
const LessonsMode = lazy(() => import('./components/LessonsMode'));
const KrogLeaderboard = lazy(() => import('./components/KrogLeaderboard'));
const FAQModal = lazy(() => import('./components/FAQModal'));
const FriendsPanel = lazy(() => import('./components/FriendsPanel').then(m => ({ default: m.FriendsPanel })));
const ClubsPanel = lazy(() => import('./components/ClubsPanel').then(m => ({ default: m.ClubsPanel })));
const TournamentPanel = lazy(() => import('./components/TournamentPanel').then(m => ({ default: m.TournamentPanel })));
const LeaguePanel = lazy(() => import('./components/LeaguePanel').then(m => ({ default: m.LeaguePanel })));
const GestureHelp = lazy(() => import('./components/GestureHelp'));
const InstallPrompt = lazy(() => import('./components/InstallPrompt').then(m => ({ default: m.InstallPrompt })));
const OfflineIndicator = lazy(() => import('./components/InstallPrompt').then(m => ({ default: m.OfflineIndicator })));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="loading-fallback">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

// Initialize socket outside component to prevent multiple connections
// Connect to backend on same host (works for both localhost and network IP)
const getSocketUrl = () => {
  const host = window.location.hostname;
  return `http://${host}:3000`;
};
const socket = io(getSocketUrl());

type PlayerColor = 'white' | 'black' | 'spectator' | null;
type TimeControlType = 'bullet' | 'blitz' | 'rapid' | 'unlimited';
type Language = 'en' | 'no';
type VariantType = 'standard' | 'chess960' | 'threeCheck' | 'kingOfTheHill';

interface VariantState {
  variant: VariantType;
  positionId?: number;
  checkCount?: { white: number; black: number };
  hillReached?: boolean;
}

interface ClockState {
  white: number;
  black: number;
  activeColor: 'white' | 'black' | null;
}

interface TimeControl {
  type: TimeControlType;
  initialTime: number;
  increment: number;
}

interface MoveExplanation {
  move: string;
  from: string;
  to: string;
  krog: {
    formula: string;
    operator: string;
    tType: string;
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
  conditions: {
    name: string;
    met: boolean;
    description: string;
  }[];
}

interface IllegalMoveExplanation {
  from: string;
  to: string;
  reason: string;
  krog: {
    formula: string;
    violation: string;
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
}

interface MoveSuggestion {
  move: string;
  from: string;
  to: string;
  score: number;
  rank: number;
  classification: 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  isBookMove: boolean;
  bookStats?: {
    white: number;
    draw: number;
    black: number;
  };
  principlesSatisfied: string[];
  tacticalPatterns: string[];
  explanation: {
    en: string;
    no: string;
  };
}

const TIME_CONTROL_OPTIONS: { type: TimeControlType; label: string; description: string }[] = [
  { type: 'bullet', label: '1+0', description: 'Bullet' },
  { type: 'blitz', label: '3+2', description: 'Blitz' },
  { type: 'rapid', label: '10+0', description: 'Rapid' },
  { type: 'unlimited', label: '∞', description: 'No clock' }
];

const VARIANT_OPTIONS: { type: VariantType; label: string; description: string }[] = [
  { type: 'standard', label: 'Standard', description: 'Classic chess' },
  { type: 'chess960', label: 'Chess960', description: 'Random start position' },
  { type: 'threeCheck', label: '3-Check', description: 'Win by giving 3 checks' },
  { type: 'kingOfTheHill', label: 'KotH', description: 'Win by reaching center' }
];

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTY_OPTIONS: { type: Difficulty; label: string; description: string }[] = [
  { type: 'beginner', label: 'Beginner', description: 'Easy opponent' },
  { type: 'intermediate', label: 'Intermediate', description: 'Moderate challenge' },
  { type: 'advanced', label: 'Advanced', description: 'Strong opponent' }
];

// Format milliseconds to MM:SS.t
function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);

  if (minutes === 0 && totalSeconds < 10) {
    return `${seconds}.${tenths}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function App() {
  const { isMobile, isTablet: _isTablet } = useMediaQuery();
  const [game, setGame] = useState(new Chess());
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlType>('rapid');
  const [timeControl, setTimeControl] = useState<TimeControl | null>(null);
  const [clock, setClock] = useState<ClockState>({ white: 0, black: 0, activeColor: null });
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);
  const [drawOffer, setDrawOffer] = useState<'white' | 'black' | null>(null);
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [rematchRequest, setRematchRequest] = useState<'white' | 'black' | null>(null);
  const [moveExplanation, setMoveExplanation] = useState<MoveExplanation | null>(null);
  const [illegalMoveExplanation, setIllegalMoveExplanation] = useState<IllegalMoveExplanation | null>(null);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainModalData, setExplainModalData] = useState<any | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [showExplanation, setShowExplanation] = useState(true);
  const [learnMode, setLearnMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MoveSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [puzzleMode, setPuzzleMode] = useState(false);
  const [dailyPuzzleMode, setDailyPuzzleMode] = useState(false);
  const [openingExplorer, setOpeningExplorer] = useState(false);
  const [lessonsMode, setLessonsMode] = useState(false);
  const [showKrogLeaderboard, setShowKrogLeaderboard] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [mobileNavTab, setMobileNavTab] = useState('home');
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => {
    const saved = localStorage.getItem('krog-board-theme');
    if (saved) {
      const found = BOARD_THEMES.find(t => t.name === saved);
      if (found) return found;
    }
    return BOARD_THEMES[0];
  });
  const [pieceTheme, setPieceTheme] = useState<PieceTheme>(() => {
    const saved = localStorage.getItem('krog-piece-theme');
    if (saved) {
      const found = PIECE_THEMES.find(t => t.name === saved);
      if (found) return found;
    }
    return PIECE_THEMES[0];
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('krog-sound-enabled');
    return saved !== 'false'; // Default to true
  });
  const soundEnabledRef = useRef(soundEnabled);
  const prevFenRef = useRef<string>(game.fen());

  // Auth state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [matchOpponent, setMatchOpponent] = useState<{ username: string; rating: number } | null>(null);
  const [ratingChange, setRatingChange] = useState<{ white: number; black: number } | null>(null);

  // Variant state
  const [selectedVariant, setSelectedVariant] = useState<VariantType>('standard');
  const [variant, setVariant] = useState<VariantType>('standard');
  const [variantState, setVariantState] = useState<VariantState>({ variant: 'standard' });

  // Computer game state
  const [showComputerOptions, setShowComputerOptions] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('intermediate');
  const [selectedPlayerColor, setSelectedPlayerColor] = useState<'white' | 'black' | 'random'>('white');
  const [isComputerGame, setIsComputerGame] = useState(false);

  // Spectator state
  const [spectators, setSpectators] = useState<{ id: string; username: string }[]>([]);

  // PGN import state
  const [showPGNImport, setShowPGNImport] = useState(false);
  const [pgnInput, setPgnInput] = useState('');
  const [pgnError, setPgnError] = useState<string | null>(null);

  // Chat state
  interface ChatMessage {
    id: string;
    username: string;
    role: 'white' | 'black' | 'spectator';
    message: string;
    timestamp: number;
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Challenge state
  interface Challenge {
    challengeId: string;
    from: { id: string; username: string; rating: number; socketId?: string };
    timeControl: TimeControlType;
    variant: VariantType;
  }
  interface OutgoingChallenge {
    challengeId: string;
    to: { id: string; username: string; rating: number };
    timeControl: TimeControlType;
    variant: VariantType;
  }
  const [incomingChallenges, setIncomingChallenges] = useState<Challenge[]>([]);
  const [outgoingChallenges, setOutgoingChallenges] = useState<OutgoingChallenge[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Authenticate socket on connect
  useEffect(() => {
    const token = getStoredToken();
    if (token && socket.connected) {
      socket.emit('authenticate', { token });
    }
  }, []);

  // Handle matchmaking callback
  const handleMatchFound = useCallback((data: { roomCode: string; color: 'white' | 'black'; opponent: { username: string; rating: number }; timeControl: string }) => {
    setRoomCode(data.roomCode);
    setPlayerColor(data.color);
    setMatchOpponent(data.opponent);
    setGame(new Chess());
    setGameOverMessage(null);
    setMoveExplanation(null);
    setIllegalMoveExplanation(null);
    setDrawOffer(null);
    setRematchRequest(null);
    setRatingChange(null);
    if (soundEnabledRef.current) {
      ChessSounds.gameStart();
    }
  }, []);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log('Connected to server');
      // Re-authenticate on reconnect
      const token = getStoredToken();
      if (token) {
        socket.emit('authenticate', { token });
      }
    }

    function onDisconnect() {
      setIsConnected(false);
      setRoomCode(null);
      setPlayerColor(null);
    }

    interface GameStateData {
      pgn: string;
      fen: string;
      lastMove: {
        san: string;
        from: string;
        to: string;
        captured?: string;
        flags: string;
        promotion?: string;
      } | null;
      variant?: VariantType;
      variantState?: VariantState;
    }

    function onGameState(data: GameStateData) {
      const newGame = new Chess();
      // Load from PGN to preserve move history
      if (data.pgn) {
        newGame.loadPgn(data.pgn);
      } else {
        newGame.load(data.fen);
      }

      // Update variant state if provided
      if (data.variant) {
        setVariant(data.variant);
      }
      if (data.variantState) {
        setVariantState(data.variantState);
      }

      const prevFen = prevFenRef.current;
      const currentFen = newGame.fen();

      // Detect what happened by comparing positions
      if (prevFen !== currentFen) {
        const lastMove = data.lastMove;

        if (lastMove && soundEnabledRef.current) {
          // Determine which sound to play
          if (newGame.isCheckmate()) {
            ChessSounds.gameEnd();
          } else if (newGame.isCheck()) {
            ChessSounds.check();
          } else if (lastMove.flags.includes('k') || lastMove.flags.includes('q')) {
            // Castling (k = kingside, q = queenside)
            ChessSounds.castle();
          } else if (lastMove.flags.includes('p')) {
            // Promotion
            ChessSounds.promote();
          } else if (lastMove.captured) {
            // Capture (including en passant)
            ChessSounds.capture();
          } else {
            // Regular move
            ChessSounds.move();
          }
        } else if (!data.lastMove && prevFen !== 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
          // Game was reset (not initial load)
          if (soundEnabledRef.current) ChessSounds.gameStart();
        }

        prevFenRef.current = currentFen;
      }

      setGame(newGame);
    }

    function onRoomCreated({ code, timeControl: tc, variant: v, variantState: vs, isComputerGame: isComputer }: { code: string; timeControl: TimeControl; variant?: VariantType; variantState?: VariantState; isComputerGame?: boolean }) {
      setRoomCode(code);
      setTimeControl(tc);
      if (v) setVariant(v);
      if (vs) setVariantState(vs);
      setIsComputerGame(!!isComputer);
      setGameOverMessage(null);
      setError(null);
      console.log('Room created:', code, tc, v, isComputer ? '(vs Computer)' : '');
    }

    function onRoomJoined({ code, timeControl: tc, variant: v, variantState: vs }: { code: string; timeControl: TimeControl; variant?: VariantType; variantState?: VariantState }) {
      setRoomCode(code);
      setTimeControl(tc);
      if (v) setVariant(v);
      if (vs) setVariantState(vs);
      setGameOverMessage(null);
      setError(null);
      console.log('Joined room:', code, tc, v);
    }

    function onClockUpdate({ white, black, activeColor }: ClockState) {
      setClock({ white, black, activeColor });
    }

    function onTimeForfeit({ winner }: { loser: string; winner: string }) {
      setGameOverMessage(`Time out! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins on time.`);
      if (soundEnabledRef.current) ChessSounds.timeout();
    }

    function onGameOver({ reason, winner, ratingChanges }: { reason: string; winner: string; ratingChanges?: { white: number; black: number } | null }) {
      const reasonText: Record<string, string> = {
        checkmate: 'Checkmate',
        stalemate: 'Stalemate - Draw',
        repetition: 'Threefold repetition - Draw',
        insufficient: 'Insufficient material - Draw',
        fifty_moves: 'Fifty-move rule - Draw',
        timeout: 'Time out',
        agreement: 'Draw by agreement',
        resignation: 'Resignation',
        // Variant-specific
        three_check: 'Three checks delivered',
        king_of_the_hill: 'King reached the hill'
      };
      setDrawOffer(null); // Clear any pending draw offer
      if (ratingChanges) {
        setRatingChange(ratingChanges);
      }
      if (winner === 'draw') {
        setGameOverMessage(reasonText[reason] || 'Game Over - Draw');
      } else {
        setGameOverMessage(`${reasonText[reason] || 'Game Over'} - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`);
      }
      if (soundEnabledRef.current) ChessSounds.gameEnd();
    }

    function onDrawOffered({ by }: { by: 'white' | 'black' }) {
      setDrawOffer(by);
      if (soundEnabledRef.current) ChessSounds.drawOffer();
    }

    function onDrawAccepted() {
      setDrawOffer(null);
    }

    function onDrawDeclined() {
      setDrawOffer(null);
    }

    function onPlayerResigned({ winner }: { player: string; winner: string }) {
      setDrawOffer(null);
      setGameOverMessage(`Resignation - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`);
    }

    function onRematchRequested({ by }: { by: 'white' | 'black' }) {
      setRematchRequest(by);
      if (soundEnabledRef.current) ChessSounds.notify();
    }

    function onRematchAccepted() {
      setRematchRequest(null);
      setGameOverMessage(null);
      setDrawOffer(null);
      setMoveExplanation(null);
      setIllegalMoveExplanation(null);
      setSuggestions([]);
      if (soundEnabledRef.current) ChessSounds.gameStart();
    }

    function onRematchDeclined() {
      setRematchRequest(null);
    }

    function onPlayerAssigned({ color }: { color: PlayerColor }) {
      setPlayerColor(color);
      console.log('Assigned color:', color);
    }

    function onError({ message }: { message: string }) {
      setError(message);
      console.error('Server error:', message);
    }

    function onMoveExplanation(explanation: MoveExplanation) {
      setMoveExplanation(explanation);
      setIllegalMoveExplanation(null); // Clear any previous illegal move
      console.log('Move explanation:', explanation);
    }

    function onIllegalMove(explanation: IllegalMoveExplanation) {
      setIllegalMoveExplanation(explanation);
      setError(null); // Clear generic error
      console.log('Illegal move explanation:', explanation);
      if (soundEnabledRef.current) ChessSounds.illegal();
      // Auto-clear after 10 seconds
      setTimeout(() => setIllegalMoveExplanation(null), 10000);
    }

    function onHistoricalMoveExplanation(data: any) {
      setExplainModalData(data);
      setExplainModalOpen(true);
    }

    function onMoveSuggestions({ suggestions: newSuggestions }: { suggestions: MoveSuggestion[] }) {
      setSuggestions(newSuggestions);
      setLoadingSuggestions(false);
      console.log('Move suggestions:', newSuggestions);
    }

    function onPlayerJoined({ color }: { color: string }) {
      console.log('Another player joined as:', color);
      if (soundEnabledRef.current) ChessSounds.notify();
    }

    function onPlayerLeft({ color }: { color: string }) {
      console.log('Player left:', color);
    }

    function onSpectatorUpdate({ count, spectators: specs }: { count: number; spectators: { id: string; username: string }[] }) {
      setSpectators(specs);
      console.log('Spectators:', count, specs);
    }

    function onChatMessage(msg: { id: string; username: string; role: 'white' | 'black' | 'spectator'; message: string; timestamp: number }) {
      setChatMessages(prev => [...prev, msg]);
    }

    // Challenge handlers
    function onChallengeReceived(data: { challengeId: string; from: { id: string; username: string; rating: number }; timeControl: TimeControlType; variant: VariantType }) {
      setIncomingChallenges(prev => [...prev, data]);
      if (soundEnabledRef.current) ChessSounds.notify();
    }

    function onChallengeSent(data: { success: boolean; challengeId?: string; to?: { id: string; username: string; rating: number }; timeControl?: TimeControlType; variant?: VariantType; error?: string }) {
      if (data.success && data.challengeId && data.to && data.timeControl) {
        setOutgoingChallenges(prev => [...prev, {
          challengeId: data.challengeId!,
          to: data.to!,
          timeControl: data.timeControl!,
          variant: data.variant || 'standard'
        }]);
      }
    }

    function onChallengeAccepted(data: { success: boolean; roomCode?: string; color?: 'white' | 'black'; opponent?: { username: string; rating: number }; timeControl?: string; variant?: VariantType; error?: string }) {
      if (data.success && data.roomCode) {
        setIncomingChallenges([]);
        setOutgoingChallenges([]);
        setRoomCode(data.roomCode);
        setPlayerColor(data.color || null);
        setMatchOpponent(data.opponent || null);
        setVariant(data.variant || 'standard');
        setGame(new Chess());
        setGameOverMessage(null);
        setMoveExplanation(null);
        setIllegalMoveExplanation(null);
        setDrawOffer(null);
        setRematchRequest(null);
        setRatingChange(null);
        if (soundEnabledRef.current) ChessSounds.gameStart();
      }
    }

    function onChallengeDeclined(data: { challengeId?: string; by?: string; success?: boolean }) {
      if (data.challengeId) {
        setOutgoingChallenges(prev => prev.filter(c => c.challengeId !== data.challengeId));
      }
      setIncomingChallenges(prev => prev.filter(c => c.challengeId !== data.challengeId));
    }

    function onChallengeCancelled(data: { challengeId: string; by?: string; success?: boolean }) {
      setIncomingChallenges(prev => prev.filter(c => c.challengeId !== data.challengeId));
      setOutgoingChallenges(prev => prev.filter(c => c.challengeId !== data.challengeId));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_state', onGameState);
    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('player_assigned', onPlayerAssigned);
    socket.on('error', onError);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('clock_update', onClockUpdate);
    socket.on('time_forfeit', onTimeForfeit);
    socket.on('game_over', onGameOver);
    socket.on('draw_offered', onDrawOffered);
    socket.on('draw_accepted', onDrawAccepted);
    socket.on('draw_declined', onDrawDeclined);
    socket.on('player_resigned', onPlayerResigned);
    socket.on('rematch_requested', onRematchRequested);
    socket.on('rematch_accepted', onRematchAccepted);
    socket.on('rematch_declined', onRematchDeclined);
    socket.on('move_explanation', onMoveExplanation);
    socket.on('illegal_move', onIllegalMove);
    socket.on('historical_move_explanation', onHistoricalMoveExplanation);
    socket.on('move_suggestions', onMoveSuggestions);
    socket.on('spectator_update', onSpectatorUpdate);
    socket.on('chat_message', onChatMessage);
    socket.on('challenge_received', onChallengeReceived);
    socket.on('challenge_sent', onChallengeSent);
    socket.on('challenge_accepted', onChallengeAccepted);
    socket.on('challenge_declined', onChallengeDeclined);
    socket.on('challenge_cancelled', onChallengeCancelled);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_state', onGameState);
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('player_assigned', onPlayerAssigned);
      socket.off('error', onError);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('clock_update', onClockUpdate);
      socket.off('time_forfeit', onTimeForfeit);
      socket.off('game_over', onGameOver);
      socket.off('draw_offered', onDrawOffered);
      socket.off('draw_accepted', onDrawAccepted);
      socket.off('draw_declined', onDrawDeclined);
      socket.off('player_resigned', onPlayerResigned);
      socket.off('rematch_requested', onRematchRequested);
      socket.off('rematch_accepted', onRematchAccepted);
      socket.off('rematch_declined', onRematchDeclined);
      socket.off('move_explanation', onMoveExplanation);
      socket.off('illegal_move', onIllegalMove);
      socket.off('historical_move_explanation', onHistoricalMoveExplanation);
      socket.off('move_suggestions', onMoveSuggestions);
      socket.off('spectator_update', onSpectatorUpdate);
      socket.off('chat_message', onChatMessage);
      socket.off('challenge_received', onChallengeReceived);
      socket.off('challenge_sent', onChallengeSent);
      socket.off('challenge_accepted', onChallengeAccepted);
      socket.off('challenge_declined', onChallengeDeclined);
      socket.off('challenge_cancelled', onChallengeCancelled);
    };
  }, []);

  const createRoom = () => {
    setError(null);
    socket.emit('create_room', { timeControl: selectedTimeControl, variant: selectedVariant });
  };

  const createComputerGame = () => {
    setError(null);
    const playerColor = selectedPlayerColor === 'random'
      ? (Math.random() < 0.5 ? 'white' : 'black')
      : selectedPlayerColor;
    socket.emit('create_computer_game', {
      timeControl: selectedTimeControl,
      variant: selectedVariant,
      playerColor,
      difficulty: selectedDifficulty
    });
  };

  const joinRoom = () => {
    if (!joinCodeInput.trim()) {
      setError('Please enter a room code');
      return;
    }
    setError(null);
    socket.emit('join_room', { code: joinCodeInput.trim() });
  };

  const handleExplainMove = (moveIndex: number) => {
    const moves = game.history();
    socket.emit('explain_historical_move', {
      moves: moves.slice(0, moveIndex + 1),
      moveIndex
    });
  };

  const leaveRoom = () => {
    setRoomCode(null);
    setPlayerColor(null);
    setGame(new Chess());
    setTimeControl(null);
    setClock({ white: 0, black: 0, activeColor: null });
    setGameOverMessage(null);
    setMoveExplanation(null);
    setIllegalMoveExplanation(null);
    setMatchOpponent(null);
    setRatingChange(null);
    setVariant('standard');
    setVariantState({ variant: 'standard' });
    setIsComputerGame(false);
    setShowComputerOptions(false);
    setSpectators([]);
    setChatMessages([]);
  };

  // Mobile navigation tab change handler
  const handleMobileNavChange = (tabId: string) => {
    setMobileNavTab(tabId);
    // Navigate based on tab
    switch (tabId) {
      case 'home':
        // Reset to lobby
        setPuzzleMode(false);
        setDailyPuzzleMode(false);
        setOpeningExplorer(false);
        setLessonsMode(false);
        setShowKrogLeaderboard(false);
        break;
      case 'daily':
        setDailyPuzzleMode(true);
        setPuzzleMode(false);
        setOpeningExplorer(false);
        setLessonsMode(false);
        setShowKrogLeaderboard(false);
        break;
      case 'krog':
        setShowKrogLeaderboard(true);
        setPuzzleMode(false);
        setDailyPuzzleMode(false);
        setOpeningExplorer(false);
        setLessonsMode(false);
        break;
      case 'profile':
        // Open auth modal if not logged in, otherwise just scroll to profile area
        setShowAuthModal(true);
        break;
      default:
        break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!roomCode) return;

    // Analysis mode - handle moves locally
    if (roomCode === 'ANALYSIS') {
      try {
        const newGame = new Chess(game.fen());
        // Load PGN to preserve history, then try the move
        newGame.loadPgn(game.pgn());
        const result = newGame.move(move);
        if (result) {
          setGame(newGame);
          // Play appropriate sound
          if (soundEnabledRef.current) {
            if (newGame.isCheckmate()) {
              ChessSounds.gameEnd();
            } else if (newGame.isCheck()) {
              ChessSounds.check();
            } else if (result.captured) {
              ChessSounds.capture();
            } else {
              ChessSounds.move();
            }
          }
        }
      } catch {
        // Invalid move - ignore silently in analysis mode
      }
      return;
    }

    socket.emit('make_move', { roomId: roomCode, move });
  };

  const resetGame = () => {
    if (!roomCode) return;
    setGameOverMessage(null);
    setMoveExplanation(null);
    setIllegalMoveExplanation(null);
    setSuggestions([]);
    setDrawOffer(null);
    setRatingChange(null);

    // Analysis mode - reset locally
    if (roomCode === 'ANALYSIS') {
      setGame(new Chess());
      if (soundEnabledRef.current) {
        ChessSounds.gameStart();
      }
      return;
    }

    socket.emit('reset_game', roomCode);
  };

  const offerDraw = () => {
    if (!roomCode) return;
    socket.emit('offer_draw', { roomId: roomCode });
  };

  const acceptDraw = () => {
    if (!roomCode) return;
    socket.emit('accept_draw', { roomId: roomCode });
  };

  const declineDraw = () => {
    if (!roomCode) return;
    socket.emit('decline_draw', { roomId: roomCode });
  };

  const resign = () => {
    if (!roomCode) return;
    setShowResignConfirm(false);
    socket.emit('resign', { roomId: roomCode });
  };

  const requestRematch = () => {
    if (!roomCode) return;
    socket.emit('request_rematch', { roomId: roomCode });
  };

  const acceptRematch = () => {
    if (!roomCode) return;
    socket.emit('accept_rematch', { roomId: roomCode });
  };

  const declineRematch = () => {
    if (!roomCode) return;
    socket.emit('decline_rematch', { roomId: roomCode });
  };

  const requestSuggestions = () => {
    if (!roomCode) return;
    setLoadingSuggestions(true);
    socket.emit('suggest_moves', { roomId: roomCode, context: 'learning', limit: 5 });
  };

  // Request suggestions when panel is opened
  const toggleSuggestions = () => {
    const newValue = !showSuggestions;
    setShowSuggestions(newValue);
    if (newValue && suggestions.length === 0) {
      requestSuggestions();
    }
  };

  // Export game as PGN
  const exportPGN = () => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    // Determine result
    let result = '*';
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        result = game.turn() === 'w' ? '0-1' : '1-0';
      } else {
        result = '1/2-1/2';
      }
    }

    // Build PGN with headers
    const headers = [
      `[Event "KROG Chess Game"]`,
      `[Site "localhost"]`,
      `[Date "${dateStr}"]`,
      `[White "Player"]`,
      `[Black "Player"]`,
      `[Result "${result}"]`,
      roomCode ? `[Room "${roomCode}"]` : null,
      timeControl ? `[TimeControl "${timeControl.type}"]` : null
    ].filter(Boolean).join('\n');

    // Get just the moves (without chess.js default headers)
    const moves = game.history();
    let moveText = '';
    for (let i = 0; i < moves.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const whiteMove = moves[i];
      const blackMove = moves[i + 1] || '';
      moveText += `${moveNum}. ${whiteMove}${blackMove ? ' ' + blackMove : ''} `;
    }

    const pgn = `${headers}\n\n${moveText.trim()} ${result}`;
    return pgn;
  };

  const copyPGN = async () => {
    const pgn = exportPGN();
    try {
      await navigator.clipboard.writeText(pgn);
      alert(language === 'en' ? 'PGN copied to clipboard!' : 'PGN kopiert til utklippstavlen!');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = pgn;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(language === 'en' ? 'PGN copied to clipboard!' : 'PGN kopiert til utklippstavlen!');
    }
  };

  const downloadPGN = () => {
    const pgn = exportPGN();
    const blob = new Blob([pgn], { type: 'application/x-chess-pgn' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krog-chess-${roomCode || 'game'}-${Date.now()}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const changeTheme = (theme: BoardTheme) => {
    setBoardTheme(theme);
    localStorage.setItem('krog-board-theme', theme.name);
  };

  const changePieceTheme = (theme: PieceTheme) => {
    setPieceTheme(theme);
    localStorage.setItem('krog-piece-theme', theme.name);
  };

  const importPGN = () => {
    const trimmedPgn = pgnInput.trim();
    if (!trimmedPgn) {
      setPgnError(language === 'en' ? 'Please enter a PGN' : 'Vennligst skriv inn en PGN');
      return;
    }

    try {
      const newGame = new Chess();
      newGame.loadPgn(trimmedPgn);

      // Successfully loaded - set up analysis mode
      setGame(newGame);
      setShowPGNImport(false);
      setPgnInput('');
      setPgnError(null);
      setPlayerColor('white'); // Allow both sides to be played in analysis
      setRoomCode('ANALYSIS');
      setTimeControl(null);
      setIsComputerGame(false);
      setGameOverMessage(null);
      setVariant('standard');
      setVariantState({ variant: 'standard' });

      if (soundEnabledRef.current) {
        ChessSounds.gameStart();
      }
    } catch {
      setPgnError(language === 'en' ? 'Invalid PGN format' : 'Ugyldig PGN-format');
    }
  };

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('krog-sound-enabled', String(newValue));
    if (newValue) {
      await resumeAudio();
      ChessSounds.notify(); // Play a sound to confirm it's working
    }
  };

  const sendChatMessage = () => {
    if (!roomCode || roomCode === 'ANALYSIS' || !chatInput.trim()) return;
    socket.emit('chat_message', { roomId: roomCode, message: chatInput.trim() });
    setChatInput('');
  };

  // Challenge functions
  const challengeFriend = (friendId: string, _friendUsername: string) => {
    socket.emit('challenge_friend', {
      friendId,
      timeControl: selectedTimeControl,
      variant: selectedVariant
    });
  };

  const acceptChallenge = (challenge: Challenge) => {
    socket.emit('accept_challenge', {
      challengeId: challenge.challengeId,
      challengerId: challenge.from.id,
      challengerSocketId: challenge.from.socketId,  // Pass the socket ID directly
      timeControl: challenge.timeControl,
      variant: challenge.variant
    });
  };

  const declineChallenge = (challenge: Challenge) => {
    socket.emit('decline_challenge', {
      challengeId: challenge.challengeId,
      challengerId: challenge.from.id
    });
    setIncomingChallenges(prev => prev.filter(c => c.challengeId !== challenge.challengeId));
  };

  const cancelChallenge = (challenge: OutgoingChallenge) => {
    socket.emit('cancel_challenge', {
      challengeId: challenge.challengeId,
      friendId: challenge.to.id
    });
    setOutgoingChallenges(prev => prev.filter(c => c.challengeId !== challenge.challengeId));
  };

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Puzzle Mode view
  if (puzzleMode) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PuzzleMode
          socket={socket}
          language={language}
          onExit={() => setPuzzleMode(false)}
        />
      </Suspense>
    );
  }

  // Daily Puzzle view
  if (dailyPuzzleMode) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DailyPuzzle
          socket={socket}
          language={language}
          user={null}
          onExit={() => setDailyPuzzleMode(false)}
        />
      </Suspense>
    );
  }

  // Opening Explorer view
  if (openingExplorer) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <OpeningExplorer
          socket={socket}
          language={language}
          onExit={() => setOpeningExplorer(false)}
        />
      </Suspense>
    );
  }

  // Lessons view
  if (lessonsMode) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LessonsMode
          socket={socket}
          language={language}
          onExit={() => setLessonsMode(false)}
        />
      </Suspense>
    );
  }

  // Lobby view (no room joined)
  if (!roomCode) {
    return (
      <div className="app-container" style={{ padding: isMobile ? '8px' : undefined }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          gap: isMobile ? '8px' : '0'
        }}>
          <UserPanel onOpenAuth={() => setShowAuthModal(true)} />
          <div style={{
            display: 'flex',
            gap: isMobile ? '6px' : '10px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: isMobile ? 'center' : 'flex-end'
          }}>
            <Suspense fallback={null}>
              <TournamentPanel socket={socket} language={language} onJoinTournamentGame={(roomCode) => {
                socket.emit('join_tournament_game', { roomCode });
                setRoomCode(roomCode);
              }} />
              <LeaguePanel socket={socket} language={language} onJoinLeagueMatch={(roomCode) => {
                socket.emit('join_league_match', { roomCode });
                setRoomCode(roomCode);
              }} />
              <ClubsPanel socket={socket} language={language} onChallengeMember={challengeFriend} />
              <FriendsPanel socket={socket} language={language} onChallengeFriend={challengeFriend} />
            </Suspense>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

        <div style={{ marginTop: isMobile ? '16px' : '24px', marginBottom: isMobile ? '16px' : '20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '10px' : '15px' }}>
            <img
              src="/logo.png"
              alt="KROG Chess"
              style={{
                width: isMobile ? '48px' : '64px',
                height: isMobile ? '48px' : '64px',
                borderRadius: '12px'
              }}
            />
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 700 }}>KROG Chess</h1>
          </div>
          <div style={{ color: isConnected ? '#81b64c' : 'red', marginTop: '5px', fontSize: isMobile ? '0.85rem' : '1rem' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Mobile Lobby - Card-based layout */}
        {isMobile && (
          <div className="mobile-lobby">
            {/* Incoming Challenges - Show at top on mobile too */}
            {incomingChallenges.length > 0 && (
              <div className="lobby-card" style={{ borderColor: '#3498db', borderWidth: '2px' }}>
                <div className="lobby-card-header">
                  <span className="lobby-card-icon">⚔️</span>
                  <h3>{language === 'en' ? 'Incoming Challenges' : 'Utfordringer'}</h3>
                </div>
                {incomingChallenges.map(challenge => (
                  <div key={challenge.challengeId} style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{challenge.from.username}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>
                      {challenge.from.rating} • {challenge.timeControl} • {challenge.variant}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-lobby btn-lobby-primary"
                        onClick={() => acceptChallenge(challenge)}
                        style={{ flex: 1, background: '#2ecc71' }}
                      >
                        {language === 'en' ? 'Accept' : 'Godta'}
                      </button>
                      <button
                        className="btn-lobby btn-lobby-secondary"
                        onClick={() => declineChallenge(challenge)}
                        style={{ flex: 1 }}
                      >
                        {language === 'en' ? 'Decline' : 'Avvis'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Card 1: Quick Play */}
            <div className="lobby-card">
              <div className="lobby-card-header">
                <span className="lobby-card-icon">⚡</span>
                <h3>{language === 'en' ? 'Quick Play' : 'Hurtigspill'}</h3>
              </div>

              {/* Time Control Selector */}
              <div className="time-control-selector">
                {TIME_CONTROL_OPTIONS.slice(0, 3).map((option) => (
                  <button
                    key={option.type}
                    className={`time-control ${selectedTimeControl === option.type ? 'active' : ''}`}
                    onClick={() => setSelectedTimeControl(option.type)}
                  >
                    <span className="time-label">{option.label}</span>
                    <span className="time-desc">{option.description}</span>
                  </button>
                ))}
              </div>

              {/* Matchmaking integrated */}
              <MatchmakingPanel socket={socket} onMatchFound={handleMatchFound} />

              <button
                className="btn-lobby btn-lobby-primary"
                onClick={createRoom}
                disabled={!isConnected}
              >
                {language === 'en' ? 'Create Game' : 'Opprett spill'}
              </button>
            </div>

            {/* Card 2: Play with Friend */}
            <div className="lobby-card">
              <div className="lobby-card-header">
                <span className="lobby-card-icon">👥</span>
                <h3>{language === 'en' ? 'Play with Friend' : 'Spill med venn'}</h3>
              </div>

              {/* Variant Selector */}
              <div className="variant-selector">
                {VARIANT_OPTIONS.map((option) => (
                  <button
                    key={option.type}
                    className={`variant-btn ${selectedVariant === option.type ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(option.type)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                className="btn-lobby btn-lobby-primary"
                onClick={createRoom}
                disabled={!isConnected}
                style={{ marginBottom: '8px' }}
              >
                {language === 'en' ? 'Create Room' : 'Opprett rom'}
              </button>

              <div className="room-code-input">
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                  placeholder={language === 'en' ? 'Room code' : 'Romkode'}
                  maxLength={6}
                />
                <button
                  className="btn-lobby btn-lobby-secondary"
                  onClick={joinRoom}
                  disabled={!isConnected || !joinCodeInput}
                >
                  {language === 'en' ? 'Join' : 'Bli med'}
                </button>
              </div>
            </div>

            {/* Card 3: Daily Puzzle */}
            <div className="lobby-card">
              <div className="lobby-card-header">
                <span className="lobby-card-icon">📅</span>
                <h3>{language === 'en' ? 'Daily Puzzle' : 'Dagens oppgave'}</h3>
              </div>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>
                {language === 'en' ? 'Solve today\'s challenge!' : 'Løs dagens utfordring!'}
              </p>
              <button
                className="btn-lobby btn-lobby-primary"
                onClick={() => setDailyPuzzleMode(true)}
                disabled={!isConnected}
                style={{ background: '#f39c12' }}
              >
                {language === 'en' ? 'Solve Puzzle' : 'Løs oppgave'}
              </button>
            </div>

            {/* Card 4: Practice & Learn */}
            <div className="lobby-card">
              <div className="lobby-card-header">
                <span className="lobby-card-icon">📚</span>
                <h3>{language === 'en' ? 'Practice & Learn' : 'Øv og lær'}</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  className="btn-lobby btn-lobby-secondary"
                  onClick={() => setShowComputerOptions(true)}
                  style={{ background: '#3498db', borderColor: '#3498db' }}
                >
                  🤖 {language === 'en' ? 'vs Computer' : 'Mot datamaskin'}
                </button>
                <button
                  className="btn-lobby btn-lobby-secondary"
                  onClick={() => setLessonsMode(true)}
                  disabled={!isConnected}
                  style={{ background: '#e67e22', borderColor: '#e67e22' }}
                >
                  🎓 {language === 'en' ? 'Lessons' : 'Leksjoner'}
                </button>
                <button
                  className="btn-lobby btn-lobby-secondary"
                  onClick={() => setPuzzleMode(true)}
                  disabled={!isConnected}
                  style={{ background: '#9b59b6', borderColor: '#9b59b6' }}
                >
                  ♟ {language === 'en' ? 'Puzzles' : 'Oppgaver'}
                </button>
                <button
                  className="btn-lobby btn-lobby-secondary"
                  onClick={() => setOpeningExplorer(true)}
                  disabled={!isConnected}
                  style={{ background: '#2ecc71', borderColor: '#2ecc71' }}
                >
                  📖 {language === 'en' ? 'Openings' : 'Åpninger'}
                </button>
              </div>

              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <button
                  className="btn-lobby btn-lobby-secondary"
                  onClick={() => setShowPGNImport(true)}
                  style={{ flex: 1, background: '#1abc9c', borderColor: '#1abc9c' }}
                >
                  📋 PGN
                </button>
                <button
                  className="btn-lobby btn-lobby-secondary"
                  onClick={() => setShowKrogLeaderboard(true)}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #81b64c 0%, #5d8c3a 100%)', borderColor: '#81b64c' }}
                >
                  🏆 KROG
                </button>
                <button
                  className="btn-lobby btn-lobby-secondary"
                  onClick={() => setShowFAQ(true)}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #6c5ce7 0%, #5541d7 100%)', borderColor: '#6c5ce7' }}
                >
                  ❓ {language === 'en' ? 'Help' : 'Hjelp'}
                </button>
              </div>
            </div>

            {/* Computer Options Modal for Mobile */}
            {showComputerOptions && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1000,
                  padding: '16px'
                }}
                onClick={(e) => {
                  // Only close if clicking the overlay itself, not children
                  if (e.target === e.currentTarget) {
                    setShowComputerOptions(false);
                  }
                }}
              >
                <div
                  className="lobby-card"
                  style={{ maxWidth: '400px', width: '100%', margin: 0 }}
                >
                  <div className="lobby-card-header">
                    <span className="lobby-card-icon">🤖</span>
                    <h3>{language === 'en' ? 'Play vs Computer' : 'Spill mot datamaskin'}</h3>
                  </div>

                  {/* Difficulty */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: '#888', marginBottom: '8px', fontSize: '0.85rem' }}>
                      {language === 'en' ? 'Difficulty' : 'Vanskelighetsgrad'}
                    </div>
                    <div className="time-control-selector">
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <button
                          key={option.type}
                          className={`time-control ${selectedDifficulty === option.type ? 'active' : ''}`}
                          onClick={() => setSelectedDifficulty(option.type)}
                          style={{ borderColor: selectedDifficulty === option.type ? '#3498db' : undefined }}
                        >
                          <span className="time-label">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: '#888', marginBottom: '8px', fontSize: '0.85rem' }}>
                      {language === 'en' ? 'Play as' : 'Spill som'}
                    </div>
                    <div className="time-control-selector">
                      {[
                        { value: 'white', label: '♔', desc: language === 'en' ? 'White' : 'Hvit' },
                        { value: 'random', label: '🎲', desc: language === 'en' ? 'Random' : 'Tilfeldig' },
                        { value: 'black', label: '♚', desc: language === 'en' ? 'Black' : 'Svart' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          className={`time-control ${selectedPlayerColor === option.value ? 'active' : ''}`}
                          onClick={() => setSelectedPlayerColor(option.value as 'white' | 'black' | 'random')}
                          style={{ borderColor: selectedPlayerColor === option.value ? '#3498db' : undefined }}
                        >
                          <span className="time-label">{option.label}</span>
                          <span className="time-desc">{option.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    className="btn-lobby btn-lobby-primary"
                    onClick={() => {
                      createComputerGame();
                      setShowComputerOptions(false);
                    }}
                    disabled={!isConnected}
                    style={{ background: '#2980b9' }}
                  >
                    {language === 'en' ? 'Start Game' : 'Start spill'}
                  </button>
                  <button
                    className="btn-lobby btn-lobby-secondary"
                    onClick={() => setShowComputerOptions(false)}
                    style={{ marginTop: '8px' }}
                  >
                    {language === 'en' ? 'Cancel' : 'Avbryt'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div style={{ color: '#e74c3c', textAlign: 'center', padding: '12px' }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Desktop Lobby - Original layout */}
        <div className="desktop-lobby" style={{
          background: 'var(--bg-secondary)',
          padding: isMobile ? '16px' : '30px',
          borderRadius: isMobile ? '10px' : '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          maxWidth: isMobile ? '100%' : '400px',
          margin: '0 auto'
        }}>
          {/* Matchmaking Section - for logged in users */}
          <MatchmakingPanel socket={socket} onMatchFound={handleMatchFound} />

          {/* Incoming Challenges */}
          {incomingChallenges.length > 0 && (
            <div style={{
              background: 'rgba(52, 152, 219, 0.15)',
              border: '2px solid #3498db',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>&#9876;</span>
                {language === 'en' ? 'Incoming Challenges' : 'Innkommende utfordringer'}
              </div>
              {incomingChallenges.map(challenge => (
                <div
                  key={challenge.challengeId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{challenge.from.username}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {challenge.from.rating} rating | {challenge.timeControl} | {challenge.variant}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => acceptChallenge(challenge)}
                      style={{
                        padding: '8px 16px',
                        background: '#2ecc71',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 600
                      }}
                    >
                      {language === 'en' ? 'Accept' : 'Godta'}
                    </button>
                    <button
                      onClick={() => declineChallenge(challenge)}
                      style={{
                        padding: '8px 16px',
                        background: '#e74c3c',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 600
                      }}
                    >
                      {language === 'en' ? 'Decline' : 'Avvis'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Outgoing Challenges */}
          {outgoingChallenges.length > 0 && (
            <div style={{
              background: 'rgba(155, 89, 182, 0.15)',
              border: '1px solid #9b59b6',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '10px', fontSize: '0.9rem', color: '#888' }}>
                {language === 'en' ? 'Waiting for response...' : 'Venter pa svar...'}
              </div>
              {outgoingChallenges.map(challenge => (
                <div
                  key={challenge.challengeId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{challenge.to.username}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {challenge.timeControl} | {challenge.variant}
                    </div>
                  </div>
                  <button
                    onClick={() => cancelChallenge(challenge)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid #666',
                      borderRadius: '4px',
                      color: '#888',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '0.85rem'
                    }}
                  >
                    {language === 'en' ? 'Cancel' : 'Avbryt'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Time Control Selection */}
          <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
            <div style={{ color: '#888', marginBottom: isMobile ? '8px' : '10px', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
              Time Control
            </div>
            <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px' }}>
              {TIME_CONTROL_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSelectedTimeControl(option.type)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '10px 6px' : '12px 8px',
                    minHeight: isMobile ? '54px' : 'auto',
                    borderRadius: isMobile ? '8px' : '6px',
                    border: selectedTimeControl === option.type ? '2px solid #81b64c' : '1px solid #444',
                    background: selectedTimeControl === option.type ? 'rgba(129, 182, 76, 0.2)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 600 }}>{option.label}</div>
                  <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#888', marginTop: '2px' }}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Variant Selection */}
          <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
            <div style={{ color: '#888', marginBottom: isMobile ? '8px' : '10px', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
              Variant
            </div>
            <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px', flexWrap: 'wrap' }}>
              {VARIANT_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSelectedVariant(option.type)}
                  style={{
                    flex: '1 1 calc(50% - 4px)',
                    minWidth: isMobile ? '80px' : '90px',
                    minHeight: isMobile ? '50px' : 'auto',
                    padding: isMobile ? '8px 6px' : '10px 8px',
                    borderRadius: isMobile ? '8px' : '6px',
                    border: selectedVariant === option.type ? '2px solid #9b59b6' : '1px solid #444',
                    background: selectedVariant === option.type ? 'rgba(155, 89, 182, 0.2)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 600 }}>{option.label}</div>
                  <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#888', marginTop: '2px' }}>{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={createRoom}
            disabled={!isConnected}
            style={{
              width: '100%',
              background: '#81b64c',
              border: 'none',
              color: 'white',
              padding: isMobile ? '14px 16px' : '15px 20px',
              minHeight: isMobile ? '50px' : 'auto',
              borderRadius: isMobile ? '10px' : '6px',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 600,
              marginBottom: isMobile ? '8px' : '10px',
              opacity: isConnected ? 1 : 0.5,
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Create New Game
          </button>

          {/* Play vs Computer Section */}
          <button
            onClick={() => setShowComputerOptions(!showComputerOptions)}
            style={{
              width: '100%',
              background: showComputerOptions ? '#2980b9' : '#3498db',
              border: 'none',
              color: 'white',
              padding: isMobile ? '14px 16px' : '15px 20px',
              minHeight: isMobile ? '50px' : 'auto',
              borderRadius: isMobile ? '10px' : '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 600,
              marginBottom: isMobile ? '8px' : '10px',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {showComputerOptions ? '▼' : '▶'} Play vs Computer
          </button>

          {showComputerOptions && (
            <div style={{
              background: 'rgba(52, 152, 219, 0.1)',
              border: '1px solid #3498db',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              {/* Difficulty Selection */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: '#888', marginBottom: '8px', fontSize: '0.85rem' }}>
                  Difficulty
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setSelectedDifficulty(option.type)}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: '6px',
                        border: selectedDifficulty === option.type ? '2px solid #3498db' : '1px solid #444',
                        background: selectedDifficulty === option.type ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ color: '#888', marginBottom: '8px', fontSize: '0.85rem' }}>
                  Play as
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { value: 'white', label: 'White', emoji: '♔' },
                    { value: 'random', label: 'Random', emoji: '🎲' },
                    { value: 'black', label: 'Black', emoji: '♚' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedPlayerColor(option.value as 'white' | 'black' | 'random')}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: '6px',
                        border: selectedPlayerColor === option.value ? '2px solid #3498db' : '1px solid #444',
                        background: selectedPlayerColor === option.value ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'center',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ fontSize: '1.2rem' }}>{option.emoji}</div>
                      <div>{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={createComputerGame}
                disabled={!isConnected}
                style={{
                  width: '100%',
                  background: '#2980b9',
                  border: 'none',
                  color: 'white',
                  padding: '12px 15px',
                  borderRadius: '6px',
                  cursor: isConnected ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  fontWeight: 600,
                  opacity: isConnected ? 1 : 0.5
                }}
              >
                Start Game vs Computer
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', color: '#666', margin: '20px 0' }}>
            — or join existing game —
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              placeholder="Enter room code"
              maxLength={6}
              style={{
                flex: 1,
                padding: '12px 15px',
                borderRadius: '6px',
                border: '1px solid #444',
                background: 'var(--bg-primary)',
                color: 'white',
                fontFamily: 'inherit',
                fontSize: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
            />
            <button
              onClick={joinRoom}
              disabled={!isConnected}
              style={{
                background: '#4a90d9',
                border: 'none',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '6px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 600,
                opacity: isConnected ? 1 : 0.5
              }}
            >
              Join
            </button>
          </div>

          {error && (
            <div style={{ color: '#e74c3c', marginTop: '15px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Practice & Learn */}
          <div style={{ textAlign: 'center', color: '#666', margin: isMobile ? '16px 0' : '20px 0', fontSize: isMobile ? '0.85rem' : '1rem' }}>
            — or practice & learn —
          </div>

          <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setLessonsMode(true)}
              disabled={!isConnected}
              style={{
                flex: '1 1 calc(50% - 5px)',
                minWidth: isMobile ? '90px' : '100px',
                minHeight: isMobile ? '50px' : 'auto',
                background: '#e67e22',
                border: 'none',
                color: 'white',
                padding: isMobile ? '12px 10px' : '15px 12px',
                borderRadius: isMobile ? '10px' : '6px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                opacity: isConnected ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>{'\u{1F393}'}</span>
              Lessons
            </button>

            <button
              onClick={() => setPuzzleMode(true)}
              disabled={!isConnected}
              style={{
                flex: '1 1 calc(50% - 5px)',
                minWidth: isMobile ? '90px' : '100px',
                minHeight: isMobile ? '50px' : 'auto',
                background: '#9b59b6',
                border: 'none',
                color: 'white',
                padding: isMobile ? '12px 10px' : '15px 12px',
                borderRadius: isMobile ? '10px' : '6px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                opacity: isConnected ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>{'\u265F'}</span>
              Puzzles
            </button>

            <button
              onClick={() => setDailyPuzzleMode(true)}
              disabled={!isConnected}
              style={{
                flex: '1 1 calc(50% - 5px)',
                minWidth: isMobile ? '90px' : '100px',
                minHeight: isMobile ? '50px' : 'auto',
                background: '#f39c12',
                border: 'none',
                color: 'white',
                padding: isMobile ? '12px 10px' : '15px 12px',
                borderRadius: isMobile ? '10px' : '6px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                opacity: isConnected ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>{'\u{1F4C5}'}</span>
              Daily
            </button>

            <button
              onClick={() => setOpeningExplorer(true)}
              disabled={!isConnected}
              style={{
                flex: '1 1 calc(50% - 5px)',
                minWidth: isMobile ? '90px' : '100px',
                minHeight: isMobile ? '50px' : 'auto',
                background: '#2ecc71',
                border: 'none',
                color: 'white',
                padding: isMobile ? '12px 10px' : '15px 12px',
                borderRadius: isMobile ? '10px' : '6px',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                opacity: isConnected ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>{'\u{1F4D6}'}</span>
              Openings
            </button>

            <button
              onClick={() => setShowPGNImport(true)}
              style={{
                flex: '1 1 calc(50% - 5px)',
                minWidth: isMobile ? '90px' : '100px',
                minHeight: isMobile ? '50px' : 'auto',
                background: '#1abc9c',
                border: 'none',
                color: 'white',
                padding: isMobile ? '12px 10px' : '15px 12px',
                borderRadius: isMobile ? '10px' : '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>📋</span>
              {isMobile ? 'PGN' : 'Import PGN'}
            </button>

            <button
              onClick={() => setShowKrogLeaderboard(true)}
              style={{
                flex: '1 1 calc(50% - 5px)',
                minWidth: isMobile ? '90px' : '100px',
                minHeight: isMobile ? '50px' : 'auto',
                background: 'linear-gradient(135deg, #81b64c 0%, #5d8c3a 100%)',
                border: 'none',
                color: 'white',
                padding: isMobile ? '12px 10px' : '15px 12px',
                borderRadius: isMobile ? '10px' : '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>{'\u{1F3C6}'}</span>
              KROG
            </button>

            <button
              onClick={() => setShowFAQ(true)}
              style={{
                flex: '1 1 calc(50% - 5px)',
                minWidth: isMobile ? '90px' : '100px',
                minHeight: isMobile ? '50px' : 'auto',
                background: 'linear-gradient(135deg, #6c5ce7 0%, #5541d7 100%)',
                border: 'none',
                color: 'white',
                padding: isMobile ? '12px 10px' : '15px 12px',
                borderRadius: isMobile ? '10px' : '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '6px' : '8px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span style={{ fontSize: isMobile ? '1.1rem' : '1.2rem' }}>{'\u2753'}</span>
              {isMobile ? 'Help' : (language === 'en' ? 'Help / FAQ' : 'Hjelp / FAQ')}
            </button>
          </div>

          {/* PGN Import Modal */}
          {showPGNImport && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}
            onClick={() => {
              setShowPGNImport(false);
              setPgnError(null);
            }}
            >
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '500px',
                  width: '90%',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.3rem' }}>
                  {language === 'en' ? 'Import PGN' : 'Importer PGN'}
                </h3>
                <textarea
                  value={pgnInput}
                  onChange={(e) => {
                    setPgnInput(e.target.value);
                    setPgnError(null);
                  }}
                  placeholder={language === 'en'
                    ? 'Paste PGN here...\n\nExample:\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6'
                    : 'Lim inn PGN her...\n\nEksempel:\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6'
                  }
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: pgnError ? '2px solid #e74c3c' : '1px solid #444',
                    background: 'var(--bg-primary)',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                {pgnError && (
                  <div style={{ color: '#e74c3c', marginTop: '8px', fontSize: '0.9rem' }}>
                    {pgnError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    onClick={importPGN}
                    style={{
                      flex: 1,
                      background: '#1abc9c',
                      border: 'none',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    {language === 'en' ? 'Load Game' : 'Last inn spill'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPGNImport(false);
                      setPgnError(null);
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid #444',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '1rem'
                    }}
                  >
                    {language === 'en' ? 'Cancel' : 'Avbryt'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KROG Leaderboard - Lobby */}
        <Suspense fallback={null}>
          <KrogLeaderboard
            isOpen={showKrogLeaderboard}
            onClose={() => setShowKrogLeaderboard(false)}
            socket={socket}
            language={language}
          />
        </Suspense>

        {/* FAQ Modal - Lobby */}
        <Suspense fallback={null}>
          <FAQModal
            isOpen={showFAQ}
            onClose={() => setShowFAQ(false)}
            language={language}
          />
        </Suspense>
      </div>
    );
  }

  // Game view (in a room)
  const isMyTurn = playerColor !== 'spectator' &&
    ((game.turn() === 'w' && playerColor === 'white') ||
     (game.turn() === 'b' && playerColor === 'black'));

  return (
    <div className="app-container">
      <UserPanel onOpenAuth={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <div style={{ marginBottom: isMobile ? '12px' : '20px', textAlign: 'center' }}>
        {/* Back button */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: isMobile ? '8px' : '10px' }}>
          <button
            onClick={leaveRoom}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: '#888',
              padding: isMobile ? '8px 12px' : '8px 16px',
              borderRadius: isMobile ? '8px' : '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              minHeight: isMobile ? '40px' : 'auto',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.borderColor = '#666';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.borderColor = '#444';
                e.currentTarget.style.color = '#888';
              }
            }}
          >
            <span style={{ fontSize: '1rem' }}>{'\u2190'}</span>
            {isMobile ? (language === 'en' ? 'Back' : 'Tilbake') : (language === 'en' ? 'Back to Lobby' : 'Tilbake til lobbyen')}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '8px' : '12px' }}>
          <img
            src="/logo.png"
            alt="KROG Chess"
            style={{
              width: isMobile ? '36px' : '48px',
              height: isMobile ? '36px' : '48px',
              borderRadius: '10px'
            }}
          />
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.6rem' : '2.5rem', fontWeight: 700 }}>KROG Chess</h1>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isMobile ? '6px' : '15px',
          marginTop: isMobile ? '8px' : '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: roomCode === 'ANALYSIS' ? '#1abc9c' : 'var(--bg-secondary)',
            padding: isMobile ? '6px 10px' : '8px 16px',
            borderRadius: isMobile ? '8px' : '6px',
            fontSize: isMobile ? '0.85rem' : '1.1rem',
            fontWeight: 600,
            letterSpacing: roomCode === 'ANALYSIS' ? '1px' : (isMobile ? '1px' : '3px'),
            color: roomCode === 'ANALYSIS' ? 'white' : 'inherit'
          }}>
            {roomCode === 'ANALYSIS' ? (language === 'en' ? 'Analysis' : 'Analyse') : (isMobile ? roomCode : `Room: ${roomCode}`)}
          </div>
          {roomCode !== 'ANALYSIS' && (
            <div style={{
              background: playerColor === 'white' ? '#f0d9b5' :
                         playerColor === 'black' ? '#b58863' : '#666',
              color: playerColor === 'white' ? '#000' : '#fff',
              padding: isMobile ? '6px 10px' : '8px 16px',
              borderRadius: isMobile ? '8px' : '6px',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: 600
            }}>
              {isMobile ? (playerColor === 'spectator' ? '👁' : (playerColor === 'white' ? '♔' : '♚')) : (playerColor === 'spectator' ? 'Spectating' : `Playing as ${playerColor}`)}
            </div>
          )}
          {matchOpponent && (
            <div style={{
              background: 'var(--bg-secondary)',
              padding: isMobile ? '6px 10px' : '8px 16px',
              borderRadius: isMobile ? '8px' : '6px',
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}>
              vs <span style={{ fontWeight: 600 }}>{matchOpponent.username}</span> {!isMobile && `(${matchOpponent.rating})`}
            </div>
          )}
          {isComputerGame && (
            <div style={{
              background: '#3498db',
              padding: isMobile ? '6px 10px' : '8px 16px',
              borderRadius: isMobile ? '8px' : '6px',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: 600,
              color: 'white'
            }}>
              {isMobile ? '🤖' : 'vs Computer'}
            </div>
          )}
          {/* Variant badge */}
          {variant !== 'standard' && (
            <div style={{
              background: '#9b59b6',
              padding: isMobile ? '6px 10px' : '8px 16px',
              borderRadius: isMobile ? '8px' : '6px',
              fontSize: isMobile ? '0.8rem' : '0.9rem',
              fontWeight: 600,
              color: 'white'
            }}>
              {VARIANT_OPTIONS.find(v => v.type === variant)?.label || variant}
            </div>
          )}
          {/* Spectator count */}
          {spectators.length > 0 && (
            <div
              style={{
                background: '#95a5a6',
                padding: isMobile ? '6px 10px' : '8px 16px',
                borderRadius: isMobile ? '8px' : '6px',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontWeight: 600,
                color: 'white',
                cursor: 'help'
              }}
              title={spectators.map(s => s.username).join(', ')}
            >
              👁 {spectators.length}
            </div>
          )}
        </div>
        {/* Variant-specific info */}
        {variant === 'threeCheck' && variantState.checkCount && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '30px',
            marginTop: '10px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>White Checks</div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: variantState.checkCount.white >= 3 ? '#81b64c' : 'white'
              }}>
                {variantState.checkCount.white}/3
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: '#888' }}>Black Checks</div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: variantState.checkCount.black >= 3 ? '#81b64c' : 'white'
              }}>
                {variantState.checkCount.black}/3
              </div>
            </div>
          </div>
        )}
        {variant === 'kingOfTheHill' && (
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '0.85rem',
            color: '#888'
          }}>
            Win by moving your King to d4, d5, e4, or e5 (without being in check)
          </div>
        )}
        {variant === 'chess960' && variantState.positionId !== undefined && (
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '0.85rem',
            color: '#888'
          }}>
            Position #{variantState.positionId}
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        padding: isMobile ? '10px' : '20px',
        borderRadius: isMobile ? '10px' : '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {/* Opponent's clock (top) */}
        {timeControl && timeControl.type !== 'unlimited' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '6px' : '10px',
            padding: isMobile ? '8px 10px' : '10px 15px',
            background: clock.activeColor === (playerColor === 'black' ? 'white' : 'black')
              ? 'rgba(129, 182, 76, 0.3)' : 'rgba(0,0,0,0.3)',
            borderRadius: isMobile ? '6px' : '8px'
          }}>
            <span style={{ fontWeight: 600, color: '#888', fontSize: isMobile ? '0.85rem' : '1rem' }}>
              {playerColor === 'black' ? 'White' : 'Black'}
            </span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              fontWeight: 700,
              color: (playerColor === 'black' ? clock.white : clock.black) < 30000 ? '#e74c3c' : 'white'
            }}>
              {formatTime(playerColor === 'black' ? clock.white : clock.black)}
            </span>
          </div>
        )}

        <ChessBoard
          game={game}
          onMove={handleMove}
          orientation={playerColor === 'black' ? 'black' : 'white'}
          learnMode={learnMode}
          roomCode={roomCode}
          socket={socket}
          language={language}
          theme={boardTheme}
          pieceTheme={pieceTheme}
        />

        {/* Player's clock (bottom) */}
        {timeControl && timeControl.type !== 'unlimited' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: isMobile ? '6px' : '10px',
            padding: isMobile ? '8px 10px' : '10px 15px',
            background: clock.activeColor === playerColor
              ? 'rgba(129, 182, 76, 0.3)' : 'rgba(0,0,0,0.3)',
            borderRadius: isMobile ? '6px' : '8px'
          }}>
            <span style={{ fontWeight: 600, color: '#888', fontSize: isMobile ? '0.85rem' : '1rem' }}>
              {playerColor === 'black' ? 'Black' : 'White'} {isMobile ? '' : '(You)'}
            </span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              fontWeight: 700,
              color: (playerColor === 'black' ? clock.black : clock.white) < 30000 ? '#e74c3c' : 'white'
            }}>
              {formatTime(playerColor === 'black' ? clock.black : clock.white)}
            </span>
          </div>
        )}
      </div>

      {/* Draw Offer Notification */}
      {drawOffer && playerColor !== 'spectator' && !gameOverMessage && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: drawOffer === playerColor
            ? 'rgba(74, 144, 217, 0.15)'
            : 'rgba(230, 126, 34, 0.2)',
          border: drawOffer === playerColor
            ? '2px solid #4a90d9'
            : '2px solid #e67e22',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {drawOffer === playerColor ? (
            <div style={{ color: '#4a90d9' }}>
              Draw offer sent. Waiting for opponent...
            </div>
          ) : (
            <div>
              <div style={{ color: '#e67e22', marginBottom: '12px', fontWeight: 600 }}>
                Your opponent offers a draw
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={acceptDraw}
                  style={{
                    background: '#81b64c',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 600
                  }}
                >
                  Accept Draw
                </button>
                <button
                  onClick={declineDraw}
                  style={{
                    background: '#e74c3c',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 600
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resign Confirmation */}
      {showResignConfirm && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(231, 76, 60, 0.2)',
          border: '2px solid #e74c3c',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#e74c3c', marginBottom: '12px', fontWeight: 600 }}>
            Are you sure you want to resign?
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={resign}
              style={{
                background: '#e74c3c',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600
              }}
            >
              Yes, Resign
            </button>
            <button
              onClick={() => setShowResignConfirm(false)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid #444',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rematch Notification */}
      {rematchRequest && playerColor !== 'spectator' && gameOverMessage && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: rematchRequest === playerColor
            ? 'rgba(74, 144, 217, 0.15)'
            : 'rgba(129, 182, 76, 0.2)',
          border: rematchRequest === playerColor
            ? '2px solid #4a90d9'
            : '2px solid #81b64c',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {rematchRequest === playerColor ? (
            <div style={{ color: '#4a90d9' }}>
              Rematch requested. Waiting for opponent...
            </div>
          ) : (
            <div>
              <div style={{ color: '#81b64c', marginBottom: '12px', fontWeight: 600 }}>
                Your opponent wants a rematch!
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={acceptRematch}
                  style={{
                    background: '#81b64c',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 600
                  }}
                >
                  Accept Rematch
                </button>
                <button
                  onClick={declineRematch}
                  style={{
                    background: '#e74c3c',
                    border: 'none',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 600
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: isMobile ? '12px' : '20px', display: 'flex', gap: isMobile ? '6px' : '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setLearnMode(!learnMode)}
          style={{
            background: learnMode ? '#9b59b6' : 'var(--bg-secondary)',
            border: learnMode ? '2px solid #9b59b6' : '1px solid #444',
            color: 'white',
            padding: isMobile ? '8px 12px' : '10px 20px',
            minHeight: isMobile ? '40px' : 'auto',
            borderRadius: isMobile ? '8px' : '6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: learnMode ? 600 : 400,
            fontSize: isMobile ? '0.85rem' : '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>{'\u{1F4DA}'}</span>
          {isMobile ? (learnMode ? 'Learn ON' : 'Learn') : (learnMode ? 'Learn Mode ON' : 'Learn Mode')}
        </button>

        {/* Draw/Resign buttons - only for players, only during active game, not in analysis mode */}
        {playerColor !== 'spectator' && !gameOverMessage && roomCode !== 'ANALYSIS' && (
          <>
            <button
              onClick={offerDraw}
              disabled={drawOffer === playerColor}
              style={{
                background: drawOffer === playerColor ? '#666' : '#e67e22',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: drawOffer === playerColor ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: drawOffer === playerColor ? 0.6 : 1
              }}
            >
              {drawOffer === playerColor ? 'Draw Offered' : 'Offer Draw'}
            </button>
            <button
              onClick={() => setShowResignConfirm(true)}
              style={{
                background: '#c0392b',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Resign
            </button>
          </>
        )}

        {/* Rematch button - only for players, only after game over, not in analysis mode */}
        {playerColor !== 'spectator' && gameOverMessage && roomCode !== 'ANALYSIS' && (
          <button
            onClick={requestRematch}
            disabled={rematchRequest === playerColor}
            style={{
              background: rematchRequest === playerColor ? '#666' : '#81b64c',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: rematchRequest === playerColor ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
              opacity: rematchRequest === playerColor ? 0.6 : 1
            }}
          >
            {rematchRequest === playerColor ? 'Rematch Requested' : 'Rematch'}
          </button>
        )}

        {/* Reset button - always show in analysis mode or for players */}
        {(roomCode === 'ANALYSIS' || playerColor !== 'spectator') && (
          <button
            onClick={resetGame}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid #444',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            {roomCode === 'ANALYSIS' ? (language === 'en' ? 'New Position' : 'Ny posisjon') : 'Reset Board'}
          </button>
        )}
        <button
          onClick={leaveRoom}
          style={{
            background: '#e74c3c',
            border: 'none',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Leave Room
        </button>
      </div>

      {/* PGN Export buttons */}
      {game.history().length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={copyPGN}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid #444',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📋</span> Copy PGN
          </button>
          <button
            onClick={downloadPGN}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid #444',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>💾</span> Download PGN
          </button>
        </div>
      )}

      {/* Board Theme, Piece Theme & Sound Settings */}
      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {/* Board theme selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>
            {language === 'en' ? 'Board:' : 'Brett:'}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {BOARD_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => changeTheme(theme)}
                title={theme.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  border: boardTheme.name === theme.name ? '2px solid #81b64c' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: '2px',
                  background: 'transparent',
                  display: 'flex',
                  flexWrap: 'wrap',
                  overflow: 'hidden'
                }}
              >
                {/* 2x2 preview of the theme colors */}
                <span style={{ width: '50%', height: '50%', background: theme.light }} />
                <span style={{ width: '50%', height: '50%', background: theme.dark }} />
                <span style={{ width: '50%', height: '50%', background: theme.dark }} />
                <span style={{ width: '50%', height: '50%', background: theme.light }} />
              </button>
            ))}
          </div>
        </div>

        {/* Piece theme selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>
            {language === 'en' ? 'Pieces:' : 'Brikker:'}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {PIECE_THEMES.map((theme) => (
              <button
                key={theme.name}
                onClick={() => changePieceTheme(theme)}
                title={theme.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  border: pieceTheme.name === theme.name ? '2px solid #81b64c' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: '2px',
                  background: '#333',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={theme.pieces.w.n}
                  alt={theme.name}
                  style={{ width: '26px', height: '26px' }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          title={language === 'en' ? (soundEnabled ? 'Sound On' : 'Sound Off') : (soundEnabled ? 'Lyd på' : 'Lyd av')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: soundEnabled ? '2px solid #81b64c' : '1px solid #444',
            background: soundEnabled ? 'rgba(129, 182, 76, 0.2)' : 'transparent',
            color: soundEnabled ? '#81b64c' : '#888',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.85rem'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{soundEnabled ? '\u{1F50A}' : '\u{1F507}'}</span>
          {language === 'en' ? 'Sound' : 'Lyd'}
        </button>

        {/* Help/FAQ button */}
        <button
          onClick={() => setShowFAQ(true)}
          title={language === 'en' ? 'Help / FAQ' : 'Hjelp / FAQ'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #444',
            background: 'transparent',
            color: '#888',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.85rem'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{'\u2753'}</span>
          {language === 'en' ? 'Help' : 'Hjelp'}
        </button>
      </div>

      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <div style={{
          color: gameOverMessage ? '#e74c3c' : (roomCode === 'ANALYSIS' ? '#1abc9c' : (isMyTurn ? '#81b64c' : '#888')),
          fontSize: '1.1rem',
          fontWeight: (gameOverMessage || isMyTurn || roomCode === 'ANALYSIS') ? 600 : 400
        }}>
          {gameOverMessage
            ? gameOverMessage
            : game.isGameOver()
              ? `Game Over - ${game.isCheckmate() ? (game.turn() === 'w' ? 'Black' : 'White') + ' wins!' : 'Draw'}`
              : roomCode === 'ANALYSIS'
                ? `${game.turn() === 'w' ? 'White' : 'Black'} to move`
                : isMyTurn
                  ? 'Your turn!'
                  : playerColor === 'spectator'
                    ? `${game.turn() === 'w' ? 'White' : 'Black'} to move`
                    : "Opponent's turn"}
          {game.inCheck() && !game.isGameOver() && !gameOverMessage && <span style={{ color: '#e74c3c', marginLeft: '10px' }}>CHECK!</span>}
        </div>
        {/* Rating change display */}
        {ratingChange && playerColor && playerColor !== 'spectator' && (
          <div style={{
            marginTop: '10px',
            fontSize: '1rem'
          }}>
            Rating: <span style={{
              color: ratingChange[playerColor] > 0 ? '#4CAF50' : ratingChange[playerColor] < 0 ? '#f44336' : '#888',
              fontWeight: 'bold'
            }}>
              {ratingChange[playerColor] > 0 ? '+' : ''}{ratingChange[playerColor]}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: '#e74c3c', marginTop: '10px', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* KROG Explanation Panel */}
      <div style={{
        marginTop: '20px',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Header with toggle and language selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: showExplanation ? '1px solid #333' : 'none'
        }}>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ transform: showExplanation ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              ▶
            </span>
            KROG Explanation
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                background: language === 'en' ? '#81b64c' : '#333',
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('no')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                background: language === 'no' ? '#81b64c' : '#333',
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              NO
            </button>
          </div>
        </div>

        {/* Explanation content */}
        {showExplanation && (
          <div style={{ padding: '16px' }}>
            {/* Illegal move explanation */}
            {illegalMoveExplanation && (
              <div style={{
                background: 'rgba(231, 76, 60, 0.15)',
                border: '2px solid #e74c3c',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: moveExplanation ? '16px' : 0
              }}>
                {/* Header with attempted move */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <span style={{ color: '#e74c3c', fontSize: '1.3rem' }}>✗</span>
                  <span style={{
                    color: '#e74c3c',
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}>
                    {language === 'en' ? 'Illegal Move' : 'Ulovlig trekk'}
                  </span>
                  <span style={{
                    color: '#fff',
                    background: '#e74c3c',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {illegalMoveExplanation.from} → {illegalMoveExplanation.to}
                  </span>
                </div>

                {/* KROG Formula */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>
                    KROG Formula
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    color: '#e74c3c',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '10px 14px',
                    borderRadius: '6px'
                  }}>
                    F({illegalMoveExplanation.to}) ↔ {illegalMoveExplanation.krog.violation}
                  </div>
                </div>

                {/* Explanation */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>
                    {language === 'en' ? 'Why Illegal' : 'Hvorfor ulovlig'}
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.95rem' }}>
                    {illegalMoveExplanation.explanation[language]}
                  </div>
                </div>

                {/* FIDE Reference */}
                <div style={{
                  borderTop: '1px solid rgba(231, 76, 60, 0.3)',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#e74c3c',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    FIDE {illegalMoveExplanation.fide.article}
                  </span>
                  <span style={{ color: '#ccc', fontSize: '0.85rem' }}>
                    {illegalMoveExplanation.fide[language]}
                  </span>
                </div>
              </div>
            )}

            {/* Legal move explanation */}
            {moveExplanation ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: '#81b64c',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}>
                    {moveExplanation.move}
                  </span>
                  <span style={{ color: '#888', fontSize: '0.9rem' }}>
                    {moveExplanation.from} → {moveExplanation.to}
                  </span>
                  <span style={{
                    background: '#4a90d9',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {moveExplanation.krog.tType}
                  </span>
                  {moveExplanation.krog.rType && (
                    <span style={{
                      background: '#9b59b6',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                    title={moveExplanation.krog.rTypeDescription?.[language] || moveExplanation.krog.rType}
                    >
                      {moveExplanation.krog.rType.replace('_', ' ').replace(/^R(\d+)/, 'R$1:')}
                    </span>
                  )}
                </div>

                {/* R-Type Classification */}
                {moveExplanation.krog.rType && moveExplanation.krog.rTypeDescription && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>
                      {language === 'en' ? 'Rule Classification' : 'Regelklassifisering'}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(155, 89, 182, 0.15)',
                      border: '1px solid rgba(155, 89, 182, 0.4)',
                      padding: '8px 12px',
                      borderRadius: '6px'
                    }}>
                      <span style={{
                        color: '#9b59b6',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        fontSize: '0.9rem'
                      }}>
                        {moveExplanation.krog.rType}
                      </span>
                      <span style={{ color: '#ccc', fontSize: '0.9rem' }}>
                        {moveExplanation.krog.rTypeDescription[language]}
                      </span>
                    </div>
                  </div>
                )}

                {/* KROG Formula */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>
                    KROG Formula
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    color: '#81b64c',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    overflowX: 'auto'
                  }}>
                    {moveExplanation.krog.formula}
                  </div>
                </div>

                {/* Human-readable explanation */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '4px' }}>
                    {language === 'en' ? 'Explanation' : 'Forklaring'}
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.95rem' }}>
                    {moveExplanation.explanation[language]}
                  </div>
                </div>

                {/* Conditions */}
                {moveExplanation.conditions.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px' }}>
                      {language === 'en' ? 'Conditions' : 'Betingelser'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {moveExplanation.conditions.map((condition, i) => (
                        <span
                          key={i}
                          style={{
                            background: condition.met ? 'rgba(129, 182, 76, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                            border: `1px solid ${condition.met ? '#81b64c' : '#e74c3c'}`,
                            color: condition.met ? '#81b64c' : '#e74c3c',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace'
                          }}
                          title={condition.description}
                        >
                          {condition.met ? '✓' : '✗'} {condition.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* FIDE Reference */}
                <div style={{
                  borderTop: '1px solid #333',
                  paddingTop: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#333',
                    color: '#888',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    FIDE {moveExplanation.fide.article}
                  </span>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>
                    {moveExplanation.fide[language]}
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                {language === 'en'
                  ? 'Make a move to see the KROG explanation'
                  : 'Gjør et trekk for å se KROG-forklaringen'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Move Suggestions Panel */}
      <div style={{
        marginTop: '20px',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Header with toggle and refresh */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: showSuggestions ? '1px solid #333' : 'none'
        }}>
          <button
            onClick={toggleSuggestions}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ transform: showSuggestions ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              ▶
            </span>
            {language === 'en' ? 'Move Suggestions' : 'Trekkforslag'}
          </button>
          {showSuggestions && (
            <button
              onClick={requestSuggestions}
              disabled={loadingSuggestions}
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: 'none',
                background: '#4a90d9',
                color: 'white',
                cursor: loadingSuggestions ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.8rem',
                fontWeight: 600,
                opacity: loadingSuggestions ? 0.6 : 1
              }}
            >
              {loadingSuggestions ? '...' : (language === 'en' ? 'Refresh' : 'Oppdater')}
            </button>
          )}
        </div>

        {/* Suggestions content */}
        {showSuggestions && (
          <div style={{ padding: '16px' }}>
            {isMyTurn && suggestions.length > 0 && !loadingSuggestions && (
              <div style={{
                color: '#81b64c',
                fontSize: '0.8rem',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                {language === 'en' ? 'Click a move to play it' : 'Klikk et trekk for å spille det'}
              </div>
            )}
            {loadingSuggestions ? (
              <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                {language === 'en' ? 'Analyzing position...' : 'Analyserer posisjon...'}
              </div>
            ) : suggestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.move}
                    onClick={() => {
                      if (isMyTurn) {
                        handleMove({ from: suggestion.from, to: suggestion.to });
                        setShowSuggestions(false);
                      }
                    }}
                    style={{
                      background: index === 0 ? 'rgba(129, 182, 76, 0.15)' : 'rgba(255,255,255,0.05)',
                      border: index === 0 ? '2px solid #81b64c' : '1px solid #333',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: isMyTurn ? 'pointer' : 'default',
                      transition: 'transform 0.1s, box-shadow 0.1s'
                    }}
                    onMouseEnter={(e) => {
                      if (isMyTurn) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Move header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      {/* Rank badge */}
                      <span style={{
                        background: index === 0 ? '#81b64c' : index === 1 ? '#4a90d9' : '#666',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        minWidth: '24px',
                        textAlign: 'center'
                      }}>
                        #{suggestion.rank}
                      </span>

                      {/* Move notation */}
                      <span style={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: index === 0 ? '#81b64c' : 'white'
                      }}>
                        {suggestion.move}
                      </span>

                      {/* Score */}
                      <span style={{
                        color: '#888',
                        fontSize: '0.85rem'
                      }}>
                        {Math.round(suggestion.score * 100)}%
                      </span>

                      {/* Book move indicator */}
                      {suggestion.isBookMove && (
                        <span style={{
                          background: '#9b59b6',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}>
                          BOOK
                        </span>
                      )}

                      {/* Classification badge */}
                      {suggestion.classification !== 'best' && (
                        <span style={{
                          background: suggestion.classification === 'excellent' ? '#2ecc71'
                            : suggestion.classification === 'good' ? '#3498db'
                            : '#f39c12',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase'
                        }}>
                          {suggestion.classification}
                        </span>
                      )}
                    </div>

                    {/* Explanation */}
                    <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '6px' }}>
                      {suggestion.explanation[language]}
                    </div>

                    {/* Principles satisfied */}
                    {suggestion.principlesSatisfied.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {suggestion.principlesSatisfied.slice(0, 3).map((principle) => (
                          <span
                            key={principle}
                            style={{
                              background: 'rgba(129, 182, 76, 0.2)',
                              border: '1px solid #81b64c',
                              color: '#81b64c',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '0.7rem',
                              fontFamily: 'monospace'
                            }}
                          >
                            ✓ {principle.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                {game.isGameOver()
                  ? (language === 'en' ? 'Game is over' : 'Spillet er over')
                  : (language === 'en' ? 'Click Refresh to get suggestions' : 'Klikk Oppdater for å få forslag')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Move History Panel */}
      <div style={{
        marginTop: '20px',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Header with toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(0,0,0,0.2)',
          borderBottom: showHistory ? '1px solid #333' : 'none'
        }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '1rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ transform: showHistory ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
              ▶
            </span>
            {language === 'en' ? 'Move History' : 'Trekkhistorikk'}
          </button>
          {showHistory && game.history().length > 0 && (
            <span style={{ color: '#888', fontSize: '0.85rem' }}>
              {Math.ceil(game.history().length / 2)} {language === 'en' ? 'moves' : 'trekk'}
            </span>
          )}
        </div>

        {/* History content */}
        {showHistory && (
          <div style={{ padding: '16px' }}>
            {game.history().length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr 1fr',
                gap: '4px 12px',
                fontFamily: 'monospace',
                fontSize: '0.95rem'
              }}>
                {(() => {
                  const moves = game.history();
                  const rows = [];
                  for (let i = 0; i < moves.length; i += 2) {
                    const moveNumber = Math.floor(i / 2) + 1;
                    const whiteMove = moves[i];
                    const blackMove = moves[i + 1];
                    const isLastWhite = i === moves.length - 1 || i === moves.length - 2;
                    const isLastBlack = i + 1 === moves.length - 1;

                    rows.push(
                      <React.Fragment key={moveNumber}>
                        {/* Move number */}
                        <span style={{ color: '#666', textAlign: 'right' }}>
                          {moveNumber}.
                        </span>
                        {/* White's move */}
                        <span
                          style={{
                            color: isLastWhite && !blackMove ? '#81b64c' : '#fff',
                            fontWeight: isLastWhite && !blackMove ? 700 : 400,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isLastWhite && !blackMove ? 'rgba(129, 182, 76, 0.2)' : 'transparent',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => handleExplainMove(i)}
                          title={language === 'en' ? 'Click to explain this move' : 'Klikk for å forklare dette trekket'}
                        >
                          {whiteMove}
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>ℹ️</span>
                        </span>
                        {/* Black's move */}
                        {blackMove ? (
                          <span
                            style={{
                              color: isLastBlack ? '#81b64c' : '#ccc',
                              fontWeight: isLastBlack ? 700 : 400,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isLastBlack ? 'rgba(129, 182, 76, 0.2)' : 'transparent',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => handleExplainMove(i + 1)}
                            title={language === 'en' ? 'Click to explain this move' : 'Klikk for å forklare dette trekket'}
                          >
                            {blackMove}
                            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>ℹ️</span>
                          </span>
                        ) : (
                          <span></span>
                        )}
                      </React.Fragment>
                    );
                  }
                  return rows;
                })()}
              </div>
            ) : (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                {language === 'en' ? 'No moves yet' : 'Ingen trekk ennå'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Panel - only show in multiplayer games, not in analysis mode */}
      {roomCode && roomCode !== 'ANALYSIS' && (
        <div style={{
          marginTop: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Header with toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(0,0,0,0.2)',
            borderBottom: showChat ? '1px solid #333' : 'none'
          }}>
            <button
              onClick={() => setShowChat(!showChat)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ transform: showChat ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                ▶
              </span>
              {language === 'en' ? 'Game Chat' : 'Spillchat'}
            </button>
            {chatMessages.length > 0 && !showChat && (
              <span style={{
                background: '#81b64c',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                {chatMessages.length}
              </span>
            )}
          </div>

          {/* Chat content */}
          {showChat && (
            <div style={{ padding: '16px' }}>
              {/* Messages area */}
              <div style={{
                height: '200px',
                overflowY: 'auto',
                marginBottom: '12px',
                padding: '8px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px'
              }}>
                {chatMessages.length > 0 ? (
                  chatMessages.map((msg) => (
                    <div key={msg.id} style={{
                      marginBottom: '8px',
                      padding: '6px 10px',
                      background: msg.role === 'white' ? 'rgba(240, 217, 181, 0.1)' :
                                 msg.role === 'black' ? 'rgba(181, 136, 99, 0.1)' :
                                 'rgba(150, 165, 166, 0.1)',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${
                        msg.role === 'white' ? '#f0d9b5' :
                        msg.role === 'black' ? '#b58863' :
                        '#95a5a6'
                      }`
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontWeight: 600,
                          color: msg.role === 'white' ? '#f0d9b5' :
                                 msg.role === 'black' ? '#b58863' :
                                 '#95a5a6',
                          fontSize: '0.85rem'
                        }}>
                          {msg.username}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          color: '#666'
                        }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ color: '#ccc', fontSize: '0.9rem', wordBreak: 'break-word' }}>
                        {msg.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#666', textAlign: 'center', padding: '40px 20px' }}>
                    {language === 'en' ? 'No messages yet. Say hi!' : 'Ingen meldinger ennå. Si hei!'}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder={language === 'en' ? 'Type a message...' : 'Skriv en melding...'}
                  maxLength={500}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    background: 'var(--bg-primary)',
                    color: 'white',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim()}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: chatInput.trim() ? '#81b64c' : '#444',
                    color: 'white',
                    cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  {language === 'en' ? 'Send' : 'Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Move Explanation Modal */}
      <MoveExplanationModal
        isOpen={explainModalOpen}
        onClose={() => setExplainModalOpen(false)}
        data={explainModalData}
        language={language}
        socket={socket}
      />

      {/* KROG Leaderboard */}
      <Suspense fallback={null}>
        <KrogLeaderboard
          isOpen={showKrogLeaderboard}
          onClose={() => setShowKrogLeaderboard(false)}
          socket={socket}
          language={language}
        />
      </Suspense>

      {/* FAQ Modal */}
      <Suspense fallback={null}>
        <FAQModal
          isOpen={showFAQ}
          onClose={() => setShowFAQ(false)}
          language={language}
        />
      </Suspense>

      {/* Gesture Help Overlay (Mobile only, first visit) */}
      {isMobile && (
        <Suspense fallback={null}>
          <GestureHelp />
        </Suspense>
      )}

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={mobileNavTab}
        onTabChange={handleMobileNavChange}
      />
    </div>
  );
}

// Wrap App in AuthProvider with PWA components
function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
      <Suspense fallback={null}>
        <InstallPrompt language="en" delayMs={15000} />
        <OfflineIndicator language="en" />
      </Suspense>
    </AuthProvider>
  );
}

export default AppWithAuth;
