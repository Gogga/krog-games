import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Socket } from 'socket.io-client';
import { useIsMobile } from '../hooks/useMediaQuery';

interface MatchmakingPanelProps {
  socket: Socket | null;
  onMatchFound: (data: { roomCode: string; color: 'white' | 'black'; opponent: { username: string; rating: number }; timeControl: string }) => void;
}

type TimeControl = 'bullet' | 'blitz' | 'rapid';

interface TimeControlOption {
  id: TimeControl;
  label: string;
  description: string;
}

const TIME_CONTROLS: TimeControlOption[] = [
  { id: 'bullet', label: 'Bullet', description: '1 min' },
  { id: 'blitz', label: 'Blitz', description: '3+2' },
  { id: 'rapid', label: 'Rapid', description: '10 min' }
];

export function MatchmakingPanel({ socket, onMatchFound }: MatchmakingPanelProps) {
  const { user, token } = useAuth();
  const isMobile = useIsMobile();
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('blitz');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [searchTime, setSearchTime] = useState(0);

  // Authenticate socket when token changes
  useEffect(() => {
    if (socket && token) {
      socket.emit('authenticate', { token });
    }
  }, [socket, token]);

  // Listen for matchmaking events
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data: { roomCode: string; color: 'white' | 'black'; opponent: { username: string; rating: number }; timeControl: string }) => {
      setIsSearching(false);
      setQueuePosition(null);
      onMatchFound(data);
    };

    const handleMatchmakingJoined = (_data: { timeControl: string; rating: number }) => {
      setIsSearching(true);
    };

    const handleMatchmakingWaiting = (data: { position: number; timeControl: string }) => {
      setQueuePosition(data.position);
    };

    const handleMatchmakingLeft = () => {
      setIsSearching(false);
      setQueuePosition(null);
    };

    socket.on('match_found', handleMatchFound);
    socket.on('matchmaking_joined', handleMatchmakingJoined);
    socket.on('matchmaking_waiting', handleMatchmakingWaiting);
    socket.on('matchmaking_left', handleMatchmakingLeft);

    return () => {
      socket.off('match_found', handleMatchFound);
      socket.off('matchmaking_joined', handleMatchmakingJoined);
      socket.off('matchmaking_waiting', handleMatchmakingWaiting);
      socket.off('matchmaking_left', handleMatchmakingLeft);
    };
  }, [socket, onMatchFound]);

  // Search timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSearching) {
      setSearchTime(0);
      interval = setInterval(() => {
        setSearchTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleStartSearch = () => {
    if (!socket || !user) return;
    socket.emit('join_matchmaking', { timeControl: selectedTimeControl });
  };

  const handleCancelSearch = () => {
    if (!socket) return;
    socket.emit('leave_matchmaking');
    setIsSearching(false);
    setQueuePosition(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#2a2a2a',
      borderRadius: isMobile ? '12px' : '8px',
      padding: isMobile ? '12px' : '16px',
      marginBottom: isMobile ? '12px' : '16px'
    }}>
      <h3 style={{ color: '#fff', margin: '0 0 12px 0', fontSize: isMobile ? '15px' : '16px' }}>
        Find a Match
      </h3>

      {!isSearching ? (
        <>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#888', fontSize: isMobile ? '11px' : '12px', marginBottom: '8px' }}>Time Control</div>
            <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px' }}>
              {TIME_CONTROLS.map(tc => (
                <button
                  key={tc.id}
                  onClick={() => setSelectedTimeControl(tc.id)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '12px 8px' : '10px',
                    minHeight: isMobile ? '54px' : 'auto',
                    backgroundColor: selectedTimeControl === tc.id ? '#4CAF50' : '#1a1a1a',
                    border: selectedTimeControl === tc.id ? '2px solid #4CAF50' : '2px solid #444',
                    borderRadius: isMobile ? '8px' : '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: isMobile ? '13px' : '14px' }}>{tc.label}</div>
                  <div style={{ fontSize: isMobile ? '10px' : '11px', color: selectedTimeControl === tc.id ? '#fff' : '#888' }}>
                    {tc.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartSearch}
            style={{
              width: '100%',
              padding: isMobile ? '14px' : '12px',
              minHeight: isMobile ? '48px' : 'auto',
              backgroundColor: '#4CAF50',
              border: 'none',
              borderRadius: isMobile ? '8px' : '6px',
              color: '#fff',
              fontSize: isMobile ? '15px' : '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Find Opponent
          </button>

          <div style={{ color: '#888', fontSize: isMobile ? '11px' : '12px', textAlign: 'center', marginTop: '8px' }}>
            Your rating: {user.rating}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: isMobile ? '8px 0' : '0' }}>
          <div style={{
            width: isMobile ? '50px' : '60px',
            height: isMobile ? '50px' : '60px',
            border: isMobile ? '3px solid #333' : '4px solid #333',
            borderTop: isMobile ? '3px solid #4CAF50' : '4px solid #4CAF50',
            borderRadius: '50%',
            margin: isMobile ? '0 auto 12px' : '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />

          <div style={{ color: '#fff', fontSize: isMobile ? '14px' : '16px', marginBottom: '4px' }}>
            Searching for opponent...
          </div>

          <div style={{ color: '#888', fontSize: isMobile ? '13px' : '14px', marginBottom: '4px' }}>
            {formatTime(searchTime)}
          </div>

          {queuePosition !== null && (
            <div style={{ color: '#888', fontSize: isMobile ? '11px' : '12px', marginBottom: isMobile ? '10px' : '12px' }}>
              Queue position: {queuePosition}
            </div>
          )}

          <div style={{ color: '#888', fontSize: isMobile ? '11px' : '12px', marginBottom: isMobile ? '10px' : '12px' }}>
            {TIME_CONTROLS.find(tc => tc.id === selectedTimeControl)?.label} | Rating: {user.rating} (±200)
          </div>

          <button
            onClick={handleCancelSearch}
            style={{
              padding: isMobile ? '12px 28px' : '10px 24px',
              minHeight: isMobile ? '44px' : 'auto',
              backgroundColor: '#f44336',
              border: 'none',
              borderRadius: isMobile ? '8px' : '6px',
              color: '#fff',
              fontSize: isMobile ? '14px' : '14px',
              fontWeight: isMobile ? '500' : 'normal',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
