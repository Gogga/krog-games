import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Chess } from 'chess.js';
import ChessBoard from './components/ChessBoard';
import PuzzleMode from './components/PuzzleMode';
import './index.css';

// Initialize socket outside component to prevent multiple connections
const socket = io('http://localhost:3000');

type PlayerColor = 'white' | 'black' | 'spectator' | null;
type TimeControlType = 'bullet' | 'blitz' | 'rapid' | 'unlimited';
type Language = 'en' | 'no';

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
  const [moveExplanation, setMoveExplanation] = useState<MoveExplanation | null>(null);
  const [illegalMoveExplanation, setIllegalMoveExplanation] = useState<IllegalMoveExplanation | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [showExplanation, setShowExplanation] = useState(true);
  const [learnMode, setLearnMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MoveSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [puzzleMode, setPuzzleMode] = useState(false);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      console.log('Connected to server');
    }

    function onDisconnect() {
      setIsConnected(false);
      setRoomCode(null);
      setPlayerColor(null);
    }

    function onGameState(fen: string) {
      const newGame = new Chess(fen);
      setGame(newGame);
    }

    function onRoomCreated({ code, timeControl: tc }: { code: string; timeControl: TimeControl }) {
      setRoomCode(code);
      setTimeControl(tc);
      setGameOverMessage(null);
      setError(null);
      console.log('Room created:', code, tc);
    }

    function onRoomJoined({ code, timeControl: tc }: { code: string; timeControl: TimeControl }) {
      setRoomCode(code);
      setTimeControl(tc);
      setGameOverMessage(null);
      setError(null);
      console.log('Joined room:', code, tc);
    }

    function onClockUpdate({ white, black, activeColor }: ClockState) {
      setClock({ white, black, activeColor });
    }

    function onTimeForfeit({ loser, winner }: { loser: string; winner: string }) {
      setGameOverMessage(`Time out! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins on time.`);
    }

    function onGameOver({ reason, winner }: { reason: string; winner: string }) {
      const reasonText: Record<string, string> = {
        checkmate: 'Checkmate',
        stalemate: 'Stalemate - Draw',
        repetition: 'Threefold repetition - Draw',
        insufficient: 'Insufficient material - Draw',
        fifty_moves: 'Fifty-move rule - Draw',
        timeout: 'Time out'
      };
      if (winner === 'draw') {
        setGameOverMessage(reasonText[reason] || 'Game Over - Draw');
      } else {
        setGameOverMessage(`${reasonText[reason] || 'Game Over'} - ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`);
      }
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
      // Auto-clear after 10 seconds
      setTimeout(() => setIllegalMoveExplanation(null), 10000);
    }

    function onMoveSuggestions({ suggestions: newSuggestions }: { suggestions: MoveSuggestion[] }) {
      setSuggestions(newSuggestions);
      setLoadingSuggestions(false);
      console.log('Move suggestions:', newSuggestions);
    }

    function onPlayerJoined({ color }: { color: string }) {
      console.log('Another player joined as:', color);
    }

    function onPlayerLeft({ color }: { color: string }) {
      console.log('Player left:', color);
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
    socket.on('move_explanation', onMoveExplanation);
    socket.on('illegal_move', onIllegalMove);
    socket.on('move_suggestions', onMoveSuggestions);

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
      socket.off('move_explanation', onMoveExplanation);
      socket.off('illegal_move', onIllegalMove);
      socket.off('move_suggestions', onMoveSuggestions);
    };
  }, []);

  const createRoom = () => {
    setError(null);
    socket.emit('create_room', { timeControl: selectedTimeControl });
  };

  const joinRoom = () => {
    if (!joinCodeInput.trim()) {
      setError('Please enter a room code');
      return;
    }
    setError(null);
    socket.emit('join_room', { code: joinCodeInput.trim() });
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
  };

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!roomCode) return;
    socket.emit('make_move', { roomId: roomCode, move });
  };

  const resetGame = () => {
    if (!roomCode) return;
    setGameOverMessage(null);
    setMoveExplanation(null);
    setIllegalMoveExplanation(null);
    setSuggestions([]);
    socket.emit('reset_game', roomCode);
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

    const pgn = `${headers}\n\n${game.pgn()}`;
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

  // Puzzle Mode view
  if (puzzleMode) {
    return (
      <PuzzleMode
        socket={socket}
        language={language}
        onExit={() => setPuzzleMode(false)}
      />
    );
  }

  // Lobby view (no room joined)
  if (!roomCode) {
    return (
      <div className="app-container">
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>KROG Chess</h1>
          <div style={{ color: isConnected ? '#81b64c' : 'red', marginTop: '5px' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          {/* Time Control Selection */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#888', marginBottom: '10px', fontSize: '0.9rem' }}>
              Time Control
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {TIME_CONTROL_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setSelectedTimeControl(option.type)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    borderRadius: '6px',
                    border: selectedTimeControl === option.type ? '2px solid #81b64c' : '1px solid #444',
                    background: selectedTimeControl === option.type ? 'rgba(129, 182, 76, 0.2)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{option.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>{option.description}</div>
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
              padding: '15px 20px',
              borderRadius: '6px',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              fontSize: '1.1rem',
              fontWeight: 600,
              marginBottom: '20px',
              opacity: isConnected ? 1 : 0.5
            }}
          >
            Create New Game
          </button>

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

          {/* Puzzle Mode */}
          <div style={{ textAlign: 'center', color: '#666', margin: '20px 0' }}>
            — or practice tactics —
          </div>

          <button
            onClick={() => setPuzzleMode(true)}
            disabled={!isConnected}
            style={{
              width: '100%',
              background: '#9b59b6',
              border: 'none',
              color: 'white',
              padding: '15px 20px',
              borderRadius: '6px',
              cursor: isConnected ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              fontSize: '1.1rem',
              fontWeight: 600,
              opacity: isConnected ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>♟</span>
            Puzzle Mode
          </button>
        </div>
      </div>
    );
  }

  // Game view (in a room)
  const isMyTurn = playerColor !== 'spectator' &&
    ((game.turn() === 'w' && playerColor === 'white') ||
     (game.turn() === 'b' && playerColor === 'black'));

  return (
    <div className="app-container">
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>KROG Chess</h1>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '15px',
          marginTop: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '1.1rem',
            fontWeight: 600,
            letterSpacing: '3px'
          }}>
            Room: {roomCode}
          </div>
          <div style={{
            background: playerColor === 'white' ? '#f0d9b5' :
                       playerColor === 'black' ? '#b58863' : '#666',
            color: playerColor === 'white' ? '#000' : '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            {playerColor === 'spectator' ? 'Spectating' : `Playing as ${playerColor}`}
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        {/* Opponent's clock (top) */}
        {timeControl && timeControl.type !== 'unlimited' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '10px 15px',
            background: clock.activeColor === (playerColor === 'black' ? 'white' : 'black')
              ? 'rgba(129, 182, 76, 0.3)' : 'rgba(0,0,0,0.3)',
            borderRadius: '8px'
          }}>
            <span style={{ fontWeight: 600, color: '#888' }}>
              {playerColor === 'black' ? 'White' : 'Black'}
            </span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '1.5rem',
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
        />

        {/* Player's clock (bottom) */}
        {timeControl && timeControl.type !== 'unlimited' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px',
            padding: '10px 15px',
            background: clock.activeColor === playerColor
              ? 'rgba(129, 182, 76, 0.3)' : 'rgba(0,0,0,0.3)',
            borderRadius: '8px'
          }}>
            <span style={{ fontWeight: 600, color: '#888' }}>
              {playerColor === 'black' ? 'Black' : 'White'} (You)
            </span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: (playerColor === 'black' ? clock.black : clock.white) < 30000 ? '#e74c3c' : 'white'
            }}>
              {formatTime(playerColor === 'black' ? clock.black : clock.white)}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setLearnMode(!learnMode)}
          style={{
            background: learnMode ? '#9b59b6' : 'var(--bg-secondary)',
            border: learnMode ? '2px solid #9b59b6' : '1px solid #444',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: learnMode ? 600 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>📚</span>
          {learnMode ? 'Learn Mode ON' : 'Learn Mode'}
        </button>
        {playerColor !== 'spectator' && (
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
            Reset Board
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

      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <div style={{
          color: gameOverMessage ? '#e74c3c' : (isMyTurn ? '#81b64c' : '#888'),
          fontSize: '1.1rem',
          fontWeight: (gameOverMessage || isMyTurn) ? 600 : 400
        }}>
          {gameOverMessage
            ? gameOverMessage
            : game.isGameOver()
              ? `Game Over - ${game.isCheckmate() ? (game.turn() === 'w' ? 'Black' : 'White') + ' wins!' : 'Draw'}`
              : isMyTurn
                ? 'Your turn!'
                : playerColor === 'spectator'
                  ? `${game.turn() === 'w' ? 'White' : 'Black'} to move`
                  : "Opponent's turn"}
          {game.inCheck() && !game.isGameOver() && !gameOverMessage && <span style={{ color: '#e74c3c', marginLeft: '10px' }}>CHECK!</span>}
        </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
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
                </div>

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
            {loadingSuggestions ? (
              <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                {language === 'en' ? 'Analyzing position...' : 'Analyserer posisjon...'}
              </div>
            ) : suggestions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.move}
                    style={{
                      background: index === 0 ? 'rgba(129, 182, 76, 0.15)' : 'rgba(255,255,255,0.05)',
                      border: index === 0 ? '2px solid #81b64c' : '1px solid #333',
                      borderRadius: '8px',
                      padding: '12px'
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
                        <span style={{
                          color: isLastWhite && !blackMove ? '#81b64c' : '#fff',
                          fontWeight: isLastWhite && !blackMove ? 700 : 400,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isLastWhite && !blackMove ? 'rgba(129, 182, 76, 0.2)' : 'transparent'
                        }}>
                          {whiteMove}
                        </span>
                        {/* Black's move */}
                        <span style={{
                          color: isLastBlack ? '#81b64c' : '#ccc',
                          fontWeight: isLastBlack ? 700 : 400,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isLastBlack ? 'rgba(129, 182, 76, 0.2)' : 'transparent'
                        }}>
                          {blackMove || ''}
                        </span>
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
    </div>
  );
}

export default App;
