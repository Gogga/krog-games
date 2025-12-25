import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, LeaderboardEntry, getUserGames, Game } from '../api/auth';

// Hook to detect mobile viewport
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

interface UserPanelProps {
  onOpenAuth: () => void;
}

type PanelTab = 'profile' | 'leaderboard' | 'history';

export function UserPanel({ onOpenAuth }: UserPanelProps) {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<PanelTab>('profile');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded && activeTab === 'leaderboard') {
      getLeaderboard(50).then(res => {
        if (res.success) setLeaderboard(res.leaderboard);
      });
    }
    if (isExpanded && activeTab === 'history' && user) {
      getUserGames(user.id, 20).then(res => {
        if (res.success) setGames(res.games);
      });
    }
  }, [isExpanded, activeTab, user]);

  const formatResult = (game: Game, userId: string) => {
    if (!game.result) return '-';
    const isWhite = game.white_id === userId;
    const won = (isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1');
    const lost = (isWhite && game.result === '0-1') || (!isWhite && game.result === '1-0');
    if (won) return 'W';
    if (lost) return 'L';
    return 'D';
  };

  const getResultColor = (result: string) => {
    if (result === 'W') return '#4CAF50';
    if (result === 'L') return '#f44336';
    return '#888';
  };

  if (!user) {
    return (
      <div style={{
        position: 'fixed',
        top: isMobile ? '8px' : '10px',
        right: isMobile ? '8px' : '10px',
        zIndex: 100
      }}>
        <button
          onClick={onOpenAuth}
          style={{
            padding: isMobile ? '10px 14px' : '10px 20px',
            backgroundColor: '#4CAF50',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: isMobile ? '0.85rem' : '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            minHeight: isMobile ? '44px' : 'auto'
          }}
        >
          {isMobile ? 'Login' : 'Login / Sign Up'}
        </button>
      </div>
    );
  }

  const winRate = user.games_played > 0
    ? Math.round((user.games_won / user.games_played) * 100)
    : 0;

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '8px' : '10px',
      right: isMobile ? '8px' : '10px',
      zIndex: 100
    }}>
      {/* Collapsed view */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '10px',
          padding: isMobile ? '8px 12px' : '8px 14px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          cursor: 'pointer',
          border: '1px solid #444',
          minHeight: isMobile ? '44px' : 'auto'
        }}
      >
        <div style={{
          width: isMobile ? '28px' : '32px',
          height: isMobile ? '28px' : '32px',
          borderRadius: '50%',
          backgroundColor: '#4CAF50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: isMobile ? '12px' : '14px'
        }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        {!isMobile && (
          <div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{user.username}</div>
            <div style={{ color: '#aaa', fontSize: '12px' }}>Rating: {user.rating}</div>
          </div>
        )}
        {isMobile && (
          <div style={{ color: '#aaa', fontSize: '12px' }}>{user.rating}</div>
        )}
        <div style={{ color: '#666', marginLeft: isMobile ? '4px' : '8px' }}>
          {isExpanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Mobile overlay backdrop */}
      {isExpanded && isMobile && (
        <div
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
        />
      )}

      {/* Expanded panel */}
      {isExpanded && (
        <div style={{
          position: isMobile ? 'fixed' : 'absolute',
          top: isMobile ? 'auto' : '100%',
          bottom: isMobile ? 0 : 'auto',
          left: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 0,
          marginTop: isMobile ? 0 : '8px',
          width: isMobile ? '100%' : '320px',
          backgroundColor: '#2a2a2a',
          borderRadius: isMobile ? '16px 16px 0 0' : '8px',
          border: isMobile ? 'none' : '1px solid #444',
          overflow: 'hidden',
          zIndex: 100,
          maxHeight: isMobile ? '75vh' : 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Mobile header with close button */}
          {isMobile && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #444'
            }}>
              <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff' }}>
                {user.username}
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #444' }}>
            {(['profile', 'leaderboard', 'history'] as PanelTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: isMobile ? '14px 10px' : '10px',
                  backgroundColor: activeTab === tab ? '#333' : 'transparent',
                  border: 'none',
                  color: activeTab === tab ? '#fff' : '#888',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.85rem' : '13px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  minHeight: isMobile ? '44px' : 'auto'
                }}
              >
                {isMobile ? (tab === 'leaderboard' ? 'Top' : tab.charAt(0).toUpperCase() + tab.slice(1)) : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{
            padding: isMobile ? '16px' : '16px',
            maxHeight: isMobile ? 'calc(75vh - 120px)' : '400px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            flex: 1
          }}>
            {activeTab === 'profile' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: isMobile ? '72px' : '64px',
                    height: isMobile ? '72px' : '64px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '32px' : '28px',
                    margin: '0 auto 10px'
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ color: '#fff', fontSize: isMobile ? '1.25rem' : '18px', fontWeight: 'bold' }}>{user.username}</div>
                  <div style={{ color: '#888', fontSize: isMobile ? '0.85rem' : '13px' }}>{user.email}</div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: isMobile ? '10px' : '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ textAlign: 'center', padding: isMobile ? '14px 10px' : '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                    <div style={{ color: '#fff', fontSize: isMobile ? '1.5rem' : '24px', fontWeight: 'bold' }}>{user.rating}</div>
                    <div style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '12px' }}>Rating</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: isMobile ? '14px 10px' : '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                    <div style={{ color: '#fff', fontSize: isMobile ? '1.5rem' : '24px', fontWeight: 'bold' }}>{user.games_played}</div>
                    <div style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '12px' }}>Games</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: isMobile ? '14px 10px' : '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                    <div style={{ color: '#4CAF50', fontSize: isMobile ? '1.5rem' : '24px', fontWeight: 'bold' }}>{user.games_won}</div>
                    <div style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '12px' }}>Wins</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: isMobile ? '14px 10px' : '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                    <div style={{ color: '#fff', fontSize: isMobile ? '1.5rem' : '24px', fontWeight: 'bold' }}>{winRate}%</div>
                    <div style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '12px' }}>Win Rate</div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    padding: isMobile ? '14px' : '10px',
                    backgroundColor: '#f44336',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: isMobile ? '1rem' : '14px',
                    minHeight: isMobile ? '48px' : 'auto'
                  }}
                >
                  Logout
                </button>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div>
                {leaderboard.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', fontSize: isMobile ? '0.9rem' : '1rem' }}>Loading...</div>
                ) : (
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '12px' }}>
                          <th style={{ textAlign: 'left', padding: isMobile ? '8px 4px' : '6px' }}>#</th>
                          <th style={{ textAlign: 'left', padding: isMobile ? '8px 4px' : '6px' }}>Player</th>
                          <th style={{ textAlign: 'right', padding: isMobile ? '8px 4px' : '6px' }}>Rating</th>
                          <th style={{ textAlign: 'right', padding: isMobile ? '8px 4px' : '6px' }}>W/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, i) => (
                          <tr
                            key={entry.id}
                            style={{
                              backgroundColor: entry.id === user.id ? 'rgba(76, 175, 80, 0.2)' : 'transparent'
                            }}
                          >
                            <td style={{ padding: isMobile ? '10px 4px' : '8px 6px', color: '#888', fontSize: isMobile ? '0.85rem' : '13px' }}>{i + 1}</td>
                            <td style={{ padding: isMobile ? '10px 4px' : '8px 6px', color: '#fff', fontSize: isMobile ? '0.85rem' : '13px' }}>
                              {entry.username}
                              {entry.id === user.id && <span style={{ color: '#4CAF50', marginLeft: '4px' }}>{isMobile ? '★' : '(you)'}</span>}
                            </td>
                            <td style={{ padding: isMobile ? '10px 4px' : '8px 6px', color: '#fff', fontSize: isMobile ? '0.85rem' : '13px', textAlign: 'right' }}>
                              {entry.rating}
                            </td>
                            <td style={{ padding: isMobile ? '10px 4px' : '8px 6px', color: '#888', fontSize: isMobile ? '0.85rem' : '13px', textAlign: 'right' }}>
                              {entry.games_won}/{entry.games_played - entry.games_won}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {games.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', fontSize: isMobile ? '0.9rem' : '1rem' }}>No games yet</div>
                ) : (
                  <div>
                    {games.map(game => {
                      const result = formatResult(game, user.id);
                      const isWhite = game.white_id === user.id;
                      const opponent = isWhite ? game.black_username : game.white_username;
                      const ratingChange = isWhite ? game.white_rating_change : game.black_rating_change;

                      return (
                        <div
                          key={game.id}
                          style={{
                            padding: isMobile ? '12px' : '10px',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '6px',
                            marginBottom: isMobile ? '10px' : '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '10px', flex: 1, minWidth: 0 }}>
                              <div style={{
                                width: isMobile ? '36px' : '28px',
                                height: isMobile ? '36px' : '28px',
                                borderRadius: '4px',
                                backgroundColor: getResultColor(result),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: isMobile ? '1rem' : '14px',
                                flexShrink: 0
                              }}>
                                {result}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: '#fff', fontSize: isMobile ? '0.9rem' : '13px' }}>
                                  vs {opponent || 'Anonymous'}
                                </div>
                                <div style={{ color: '#888', fontSize: isMobile ? '0.75rem' : '11px' }}>
                                  {isWhite ? 'W' : 'B'} | {game.time_control || 'Unlimited'}
                                </div>
                              </div>
                            </div>
                            {ratingChange !== null && (
                              <div style={{
                                color: ratingChange > 0 ? '#4CAF50' : ratingChange < 0 ? '#f44336' : '#888',
                                fontWeight: 'bold',
                                fontSize: isMobile ? '0.95rem' : '13px',
                                flexShrink: 0
                              }}>
                                {ratingChange > 0 ? '+' : ''}{ratingChange}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
