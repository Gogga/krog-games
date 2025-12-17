import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, LeaderboardEntry, getUserGames, Game } from '../api/auth';

interface UserPanelProps {
  onOpenAuth: () => void;
}

type PanelTab = 'profile' | 'leaderboard' | 'history';

export function UserPanel({ onOpenAuth }: UserPanelProps) {
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
        top: '10px',
        right: '10px',
        zIndex: 100
      }}>
        <button
          onClick={onOpenAuth}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Login / Sign Up
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
      top: '10px',
      right: '10px',
      zIndex: 100
    }}>
      {/* Collapsed view */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          cursor: 'pointer',
          border: '1px solid #444'
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#4CAF50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{user.username}</div>
          <div style={{ color: '#aaa', fontSize: '12px' }}>Rating: {user.rating}</div>
        </div>
        <div style={{ color: '#666', marginLeft: '8px' }}>
          {isExpanded ? '^' : 'v'}
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '320px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          border: '1px solid #444',
          overflow: 'hidden'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #444' }}>
            {(['profile', 'leaderboard', 'history'] as PanelTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: activeTab === tab ? '#333' : 'transparent',
                  border: 'none',
                  color: activeTab === tab ? '#fff' : '#888',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
            {activeTab === 'profile' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '28px',
                    margin: '0 auto 10px'
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{user.username}</div>
                  <div style={{ color: '#888', fontSize: '13px' }}>{user.email}</div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>{user.rating}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Rating</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>{user.games_played}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Games</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                    <div style={{ color: '#4CAF50', fontSize: '24px', fontWeight: 'bold' }}>{user.games_won}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Wins</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#1a1a1a', borderRadius: '6px' }}>
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>{winRate}%</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Win Rate</div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#f44336',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Logout
                </button>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div>
                {leaderboard.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center' }}>Loading...</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: '#888', fontSize: '12px' }}>
                        <th style={{ textAlign: 'left', padding: '6px' }}>#</th>
                        <th style={{ textAlign: 'left', padding: '6px' }}>Player</th>
                        <th style={{ textAlign: 'right', padding: '6px' }}>Rating</th>
                        <th style={{ textAlign: 'right', padding: '6px' }}>W/L</th>
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
                          <td style={{ padding: '8px 6px', color: '#888', fontSize: '13px' }}>{i + 1}</td>
                          <td style={{ padding: '8px 6px', color: '#fff', fontSize: '13px' }}>
                            {entry.username}
                            {entry.id === user.id && <span style={{ color: '#4CAF50', marginLeft: '4px' }}>(you)</span>}
                          </td>
                          <td style={{ padding: '8px 6px', color: '#fff', fontSize: '13px', textAlign: 'right' }}>
                            {entry.rating}
                          </td>
                          <td style={{ padding: '8px 6px', color: '#888', fontSize: '13px', textAlign: 'right' }}>
                            {entry.games_won}/{entry.games_played - entry.games_won}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {games.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center' }}>No games yet</div>
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
                            padding: '10px',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '6px',
                            marginBottom: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '4px',
                                backgroundColor: getResultColor(result),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}>
                                {result}
                              </div>
                              <div>
                                <div style={{ color: '#fff', fontSize: '13px' }}>
                                  vs {opponent || 'Anonymous'}
                                </div>
                                <div style={{ color: '#888', fontSize: '11px' }}>
                                  {isWhite ? 'White' : 'Black'} | {game.time_control || 'Unlimited'}
                                </div>
                              </div>
                            </div>
                            {ratingChange !== null && (
                              <div style={{
                                color: ratingChange > 0 ? '#4CAF50' : ratingChange < 0 ? '#f44336' : '#888',
                                fontWeight: 'bold',
                                fontSize: '13px'
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
