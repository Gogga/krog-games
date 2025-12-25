import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useIsMobile } from '../hooks/useMediaQuery';

interface KrogStats {
  user_id: string;
  explanations_viewed: number;
  explanations_shared: number;
  unique_rtypes_seen: string;
  unique_operators_seen: string;
  last_activity_at: string | null;
  username?: string;
  rtype_count?: number;
}

interface KrogLeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket;
  language: 'en' | 'no';
  currentUserId?: string;
}

// Badge definitions
const BADGES = {
  NOVICE: { views: 10, icon: '📚', en: 'KROG Novice', no: 'KROG Nybegynner' },
  LEARNER: { views: 50, icon: '📖', en: 'KROG Learner', no: 'KROG Elev' },
  EXPERT: { views: 200, icon: '🎓', en: 'KROG Expert', no: 'KROG Ekspert' },
  MASTER: { rtypes: 15, icon: '🏅', en: 'KROG Master', no: 'KROG Mester' },
  EDUCATOR: { shares: 50, icon: '📤', en: 'KROG Educator', no: 'KROG Lærer' },
  AMBASSADOR: { shares: 200, icon: '🌟', en: 'KROG Ambassador', no: 'KROG Ambassadør' }
};

function getBadges(stats: KrogStats, language: 'en' | 'no'): { icon: string; name: string }[] {
  const badges: { icon: string; name: string }[] = [];
  const rtypeCount = stats.unique_rtypes_seen ? stats.unique_rtypes_seen.split(',').filter(Boolean).length : 0;

  if (stats.explanations_viewed >= BADGES.EXPERT.views) {
    badges.push({ icon: BADGES.EXPERT.icon, name: BADGES.EXPERT[language] });
  } else if (stats.explanations_viewed >= BADGES.LEARNER.views) {
    badges.push({ icon: BADGES.LEARNER.icon, name: BADGES.LEARNER[language] });
  } else if (stats.explanations_viewed >= BADGES.NOVICE.views) {
    badges.push({ icon: BADGES.NOVICE.icon, name: BADGES.NOVICE[language] });
  }

  if (rtypeCount >= BADGES.MASTER.rtypes) {
    badges.push({ icon: BADGES.MASTER.icon, name: BADGES.MASTER[language] });
  }

  if (stats.explanations_shared >= BADGES.AMBASSADOR.shares) {
    badges.push({ icon: BADGES.AMBASSADOR.icon, name: BADGES.AMBASSADOR[language] });
  } else if (stats.explanations_shared >= BADGES.EDUCATOR.shares) {
    badges.push({ icon: BADGES.EDUCATOR.icon, name: BADGES.EDUCATOR[language] });
  }

  return badges;
}

export default function KrogLeaderboard({ isOpen, onClose, socket, language, currentUserId }: KrogLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'views' | 'shares' | 'rtypes'>('views');
  const [leaderboard, setLeaderboard] = useState<KrogStats[]>([]);
  const [myStats, setMyStats] = useState<KrogStats | null>(null);
  const [myRank, setMyRank] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isOpen) return;

    const handleLeaderboard = ({ type, leaderboard: data }: { type: string; leaderboard: KrogStats[] }) => {
      if (type === activeTab) {
        setLeaderboard(data);
        setLoading(false);
      }
    };

    const handleStats = ({ stats, rank }: { stats: KrogStats | null; rank: number }) => {
      setMyStats(stats);
      setMyRank(rank);
    };

    socket.on('krog_leaderboard', handleLeaderboard);
    socket.on('krog_stats', handleStats);

    // Fetch data
    setLoading(true);
    socket.emit('get_krog_leaderboard', { type: activeTab });
    socket.emit('get_krog_stats');

    return () => {
      socket.off('krog_leaderboard', handleLeaderboard);
      socket.off('krog_stats', handleStats);
    };
  }, [isOpen, activeTab, socket]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'views' as const, en: 'Views', no: 'Visninger' },
    { id: 'shares' as const, en: 'Shares', no: 'Delinger' },
    { id: 'rtypes' as const, en: 'R-Types', no: 'R-Typer' }
  ];

  const myRtypeCount = myStats?.unique_rtypes_seen ? myStats.unique_rtypes_seen.split(',').filter(Boolean).length : 0;
  const myBadges = myStats ? getBadges(myStats, language) : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? 0 : undefined
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: isMobile ? '16px 16px 0 0' : '12px',
          border: isMobile ? 'none' : '1px solid #333',
          maxWidth: isMobile ? '100%' : '550px',
          width: isMobile ? '100%' : '95%',
          maxHeight: isMobile ? '90vh' : '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isMobile ? '14px 16px' : '16px 20px',
            borderBottom: '1px solid #333',
            background: 'linear-gradient(180deg, #252525 0%, #1a1a1a 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
            <span style={{ fontSize: isMobile ? '1.2rem' : '1.4rem' }}>🏆</span>
            <span style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 600, color: '#fff' }}>
              KROG {language === 'en' ? 'Leaderboard' : 'Toppliste'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: isMobile ? '1.3rem' : '1.5rem',
              cursor: 'pointer',
              padding: isMobile ? '8px' : '4px 8px',
              borderRadius: '4px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: isMobile ? '10px 8px' : '12px',
                backgroundColor: activeTab === tab.id ? '#333' : 'transparent',
                color: activeTab === tab.id ? '#81b64c' : '#888',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #81b64c' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                transition: 'all 0.2s',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#aaa';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#888';
              }}
            >
              {tab[language]}
            </button>
          ))}
        </div>

        {/* My Stats */}
        {myStats && (
          <div style={{ padding: isMobile ? '12px 14px' : '16px 20px', borderBottom: '1px solid #333', backgroundColor: '#222' }}>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: '#888', marginBottom: isMobile ? '8px' : '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {language === 'en' ? 'Your Stats' : 'Din statistikk'}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)',
              gap: isMobile ? '8px' : '16px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>📖</span>
                <span style={{ color: '#ddd', fontSize: isMobile ? '0.85rem' : '1rem' }}>{isMobile ? '' : (language === 'en' ? 'Views: ' : 'Visninger: ')}<strong style={{ color: '#81b64c' }}>{myStats.explanations_viewed}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>📤</span>
                <span style={{ color: '#ddd', fontSize: isMobile ? '0.85rem' : '1rem' }}>{isMobile ? '' : (language === 'en' ? 'Shares: ' : 'Delinger: ')}<strong style={{ color: '#81b64c' }}>{myStats.explanations_shared}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>🎯</span>
                <span style={{ color: '#ddd', fontSize: isMobile ? '0.85rem' : '1rem' }}><strong style={{ color: '#9b59b6' }}>{myRtypeCount}/15</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>🏅</span>
                <span style={{ color: '#ddd', fontSize: isMobile ? '0.85rem' : '1rem' }}><strong style={{ color: '#f1c40f' }}>#{myRank || '-'}</strong></span>
              </div>
            </div>
            {myBadges.length > 0 && (
              <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px', flexWrap: 'wrap' }}>
                {myBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'rgba(129, 182, 76, 0.15)',
                      color: '#81b64c',
                      padding: isMobile ? '3px 8px' : '4px 10px',
                      borderRadius: '12px',
                      fontSize: isMobile ? '0.75rem' : '0.85rem'
                    }}
                  >
                    <span>{badge.icon}</span>
                    <span>{isMobile ? '' : badge.name}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '10px 12px' : '12px 20px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: isMobile ? '30px' : '40px' }}>
              {language === 'en' ? 'Loading...' : 'Laster...'}
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: isMobile ? '30px 16px' : '40px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
              {language === 'en' ? 'No data yet. Start exploring KROG explanations!' : 'Ingen data ennå. Begynn å utforske KROG-forklaringer!'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px' }}>
              {leaderboard.map((entry, idx) => {
                const isCurrentUser = entry.user_id === currentUserId;
                const rtypeCount = entry.unique_rtypes_seen ? entry.unique_rtypes_seen.split(',').filter(Boolean).length : 0;
                const entryBadges = getBadges(entry, language);

                return (
                  <div
                    key={entry.user_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: isMobile ? '10px' : '12px',
                      backgroundColor: isCurrentUser ? 'rgba(129, 182, 76, 0.1)' : '#252525',
                      borderRadius: '8px',
                      border: isCurrentUser ? '1px solid rgba(129, 182, 76, 0.3)' : '1px solid #333'
                    }}
                  >
                    {/* Rank */}
                    <div
                      style={{
                        width: isMobile ? '30px' : '36px',
                        fontWeight: 700,
                        fontSize: idx < 3 ? (isMobile ? '1rem' : '1.2rem') : (isMobile ? '0.85rem' : '1rem'),
                        color: idx === 0 ? '#f1c40f' : idx === 1 ? '#bdc3c7' : idx === 2 ? '#cd7f32' : '#888',
                        flexShrink: 0
                      }}
                    >
                      {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                    </div>

                    {/* Username */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{
                        color: isCurrentUser ? '#81b64c' : '#ddd',
                        fontWeight: isCurrentUser ? 600 : 400,
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {entry.username || 'Unknown'}
                        {isCurrentUser && <span style={{ marginLeft: '4px', fontSize: isMobile ? '0.7rem' : '0.8rem', color: '#888' }}>({language === 'en' ? 'you' : 'deg'})</span>}
                      </div>
                      {entryBadges.length > 0 && (
                        <div style={{ marginTop: '3px' }}>
                          {entryBadges.map((badge, bidx) => (
                            <span key={bidx} style={{ marginRight: '4px', fontSize: isMobile ? '0.75rem' : '0.85rem' }} title={badge.name}>
                              {badge.icon}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats based on active tab */}
                    <div style={{ display: 'flex', gap: isMobile ? '8px' : '16px', alignItems: 'center', flexShrink: 0 }}>
                      {activeTab === 'views' && (
                        <div style={{ color: '#81b64c', fontWeight: 600, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
                          {entry.explanations_viewed}
                        </div>
                      )}
                      {activeTab === 'shares' && (
                        <div style={{ color: '#81b64c', fontWeight: 600, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
                          {entry.explanations_shared}
                        </div>
                      )}
                      {activeTab === 'rtypes' && (
                        <div style={{ color: '#9b59b6', fontWeight: 600, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>
                          {rtypeCount}/15
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: isMobile ? '10px 14px' : '12px 20px', borderTop: '1px solid #333', backgroundColor: '#222' }}>
          <div style={{ textAlign: 'center', color: '#666', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>
            {language === 'en'
              ? (isMobile ? 'Tap moves to learn KROG formulas' : 'Click moves in game history to learn KROG formulas')
              : (isMobile ? 'Trykk på trekk for KROG-formler' : 'Klikk på trekk i spillhistorikken for å lære KROG-formler')}
          </div>
        </div>
      </div>
    </div>
  );
}
