import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { useIsMobile } from '../hooks/useMediaQuery';

interface League {
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

interface LeagueParticipant {
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

interface LeagueMatch {
  id: string;
  league_id: string;
  round: number;
  home_id: string;
  away_id: string;
  room_code: string | null;
  result: string | null;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'active' | 'completed' | 'forfeit';
  scheduled_at: string | null;
  played_at: string | null;
  home_username?: string;
  away_username?: string;
  home_rating?: number;
  away_rating?: number;
}

interface LeaguePanelProps {
  socket: Socket;
  language: 'en' | 'no';
  onJoinLeagueMatch?: (roomCode: string) => void;
}

const translations = {
  en: {
    leagues: 'Leagues',
    open: 'Registration',
    active: 'Active',
    completed: 'Completed',
    myLeagues: 'My Leagues',
    create: 'Create',
    leagueName: 'League Name',
    description: 'Description',
    type: 'Type',
    individual: 'Individual',
    team: 'Team',
    format: 'Format',
    roundRobin: 'Round Robin',
    swiss: 'Swiss',
    doubleRoundRobin: 'Double Round Robin',
    timeControl: 'Time Control',
    season: 'Season',
    maxDivisions: 'Divisions',
    pointsForWin: 'Win Points',
    pointsForDraw: 'Draw Points',
    pointsForLoss: 'Loss Points',
    createLeague: 'Create League',
    join: 'Join',
    leave: 'Leave',
    start: 'Start',
    delete: 'Delete',
    participants: 'Participants',
    standings: 'Standings',
    fixtures: 'Fixtures',
    round: 'Round',
    points: 'Pts',
    played: 'P',
    won: 'W',
    drawn: 'D',
    lost: 'L',
    goalDiff: 'GD',
    form: 'Form',
    vs: 'vs',
    play: 'Play',
    view: 'View',
    noLeagues: 'No leagues found',
    createdBy: 'Created by',
    status: 'Status',
    back: 'Back',
    myMatches: 'My Matches',
    scheduled: 'Scheduled',
    registrationOpen: 'Registration Open',
    division: 'Division',
    promotion: 'Promotion',
    relegation: 'Relegation',
    home: 'Home',
    away: 'Away'
  },
  no: {
    leagues: 'Ligaer',
    open: 'Registrering',
    active: 'Aktive',
    completed: 'Fullforte',
    myLeagues: 'Mine Ligaer',
    create: 'Opprett',
    leagueName: 'Liganavn',
    description: 'Beskrivelse',
    type: 'Type',
    individual: 'Individuell',
    team: 'Lag',
    format: 'Format',
    roundRobin: 'Rundspill',
    swiss: 'Sveitsisk',
    doubleRoundRobin: 'Dobbel Rundspill',
    timeControl: 'Tidskontroll',
    season: 'Sesong',
    maxDivisions: 'Divisjoner',
    pointsForWin: 'Seierpoeng',
    pointsForDraw: 'Uavgjortpoeng',
    pointsForLoss: 'Tapspoeng',
    createLeague: 'Opprett Liga',
    join: 'Bli med',
    leave: 'Forlat',
    start: 'Start',
    delete: 'Slett',
    participants: 'Deltakere',
    standings: 'Tabell',
    fixtures: 'Kamper',
    round: 'Runde',
    points: 'P',
    played: 'K',
    won: 'S',
    drawn: 'U',
    lost: 'T',
    goalDiff: 'MF',
    form: 'Form',
    vs: 'mot',
    play: 'Spill',
    view: 'Se',
    noLeagues: 'Ingen ligaer funnet',
    createdBy: 'Opprettet av',
    status: 'Status',
    back: 'Tilbake',
    myMatches: 'Mine Kamper',
    scheduled: 'Planlagt',
    registrationOpen: 'Registrering apen',
    division: 'Divisjon',
    promotion: 'Opprykk',
    relegation: 'Nedrykk',
    home: 'Hjemme',
    away: 'Borte'
  }
};

export function LeaguePanel({ socket, language, onJoinLeagueMatch }: LeaguePanelProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const t = translations[language];

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'active' | 'completed' | 'my' | 'create' | 'standings' | 'fixtures' | 'myMatches'>('open');
  const [openLeagues, setOpenLeagues] = useState<League[]>([]);
  const [activeLeagues, setActiveLeagues] = useState<League[]>([]);
  const [completedLeagues, setCompletedLeagues] = useState<League[]>([]);
  const [myLeagues, setMyLeagues] = useState<League[]>([]);

  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [participants, setParticipants] = useState<LeagueParticipant[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [myMatches, setMyMatches] = useState<LeagueMatch[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(1);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createType, setCreateType] = useState<'individual' | 'team'>('individual');
  const [createFormat, setCreateFormat] = useState<'round_robin' | 'swiss' | 'double_round_robin'>('round_robin');
  const [createTimeControl, setCreateTimeControl] = useState('10+0');
  const [createSeason, setCreateSeason] = useState('');
  const [createMaxDivisions, setCreateMaxDivisions] = useState(1);
  const [createPointsWin, setCreatePointsWin] = useState(3);
  const [createPointsDraw, setCreatePointsDraw] = useState(1);
  const [createPointsLoss, _setCreatePointsLoss] = useState(0);

  useEffect(() => {
    // Request leagues only when panel is open
    if (isOpen) {
      socket.emit('get_open_leagues');
      socket.emit('get_active_leagues');
      socket.emit('get_completed_leagues');
      socket.emit('get_my_leagues');
    }

    // Listen for league updates
    socket.on('open_leagues', ({ leagues }) => setOpenLeagues(leagues));
    socket.on('active_leagues', ({ leagues }) => setActiveLeagues(leagues));
    socket.on('completed_leagues', ({ leagues }) => setCompletedLeagues(leagues));
    socket.on('my_leagues', ({ leagues }) => setMyLeagues(leagues));

    socket.on('league_details', ({ league, participants: p, matches: m, myMatches: mm, isRegistered: reg }) => {
      setSelectedLeague(league);
      setParticipants(p);
      setMatches(m);
      setMyMatches(mm);
      setIsRegistered(reg);
    });

    socket.on('league_standings', ({ standings }) => {
      setParticipants(standings);
    });

    socket.on('league_created', ({ success }) => {
      if (success) {
        setActiveTab('my');
        setCreateName('');
        setCreateDescription('');
        socket.emit('get_open_leagues');
        socket.emit('get_my_leagues');
      }
    });

    socket.on('league_joined', ({ success }) => {
      if (success && selectedLeague) {
        socket.emit('get_league', { leagueId: selectedLeague.id });
      }
    });

    socket.on('league_left', ({ success }) => {
      if (success && selectedLeague) {
        socket.emit('get_league', { leagueId: selectedLeague.id });
      }
    });

    socket.on('league_started', ({ success }) => {
      if (success && selectedLeague) {
        socket.emit('get_league', { leagueId: selectedLeague.id });
      }
    });

    socket.on('leagues_updated', () => {
      socket.emit('get_open_leagues');
      socket.emit('get_active_leagues');
      socket.emit('get_completed_leagues');
      socket.emit('get_my_leagues');
    });

    socket.on('league_participant_update', ({ leagueId }) => {
      if (selectedLeague?.id === leagueId) {
        socket.emit('get_league', { leagueId });
      }
    });

    socket.on('league_fixtures_generated', ({ leagueId }) => {
      if (selectedLeague?.id === leagueId) {
        socket.emit('get_league', { leagueId });
      }
      socket.emit('get_open_leagues');
      socket.emit('get_active_leagues');
    });

    socket.on('league_match_completed', ({ leagueId }) => {
      if (selectedLeague?.id === leagueId) {
        socket.emit('get_league', { leagueId });
      }
    });

    return () => {
      socket.off('open_leagues');
      socket.off('active_leagues');
      socket.off('completed_leagues');
      socket.off('my_leagues');
      socket.off('league_details');
      socket.off('league_standings');
      socket.off('league_created');
      socket.off('league_joined');
      socket.off('league_left');
      socket.off('league_started');
      socket.off('leagues_updated');
      socket.off('league_participant_update');
      socket.off('league_fixtures_generated');
      socket.off('league_match_completed');
    };
  }, [socket, selectedLeague?.id, isOpen]);

  const handleCreateLeague = () => {
    if (!createName.trim()) return;
    socket.emit('create_league', {
      name: createName.trim(),
      description: createDescription.trim() || undefined,
      type: createType,
      format: createFormat,
      timeControl: createTimeControl,
      season: createSeason.trim() || undefined,
      maxDivisions: createMaxDivisions,
      pointsForWin: createPointsWin,
      pointsForDraw: createPointsDraw,
      pointsForLoss: createPointsLoss
    });
  };

  const handleViewLeague = (league: League) => {
    socket.emit('get_league', { leagueId: league.id });
  };

  const handleJoinLeague = () => {
    if (!selectedLeague) return;
    socket.emit('join_league', { leagueId: selectedLeague.id });
  };

  const handleLeaveLeague = () => {
    if (!selectedLeague) return;
    socket.emit('leave_league', { leagueId: selectedLeague.id });
  };

  const handleStartLeague = () => {
    if (!selectedLeague) return;
    socket.emit('start_league', { leagueId: selectedLeague.id });
  };

  const handleDeleteLeague = () => {
    if (!selectedLeague) return;
    if (confirm('Are you sure you want to delete this league?')) {
      socket.emit('delete_league', { leagueId: selectedLeague.id });
      setSelectedLeague(null);
    }
  };

  const handlePlayMatch = (match: LeagueMatch) => {
    if (match.room_code && onJoinLeagueMatch) {
      onJoinLeagueMatch(match.room_code);
    }
  };

  const renderLeagueList = (leagues: League[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '8px' }}>
      {leagues.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: isMobile ? '0.9rem' : '1rem' }}>{t.noLeagues}</div>
      ) : (
        leagues.map(league => (
          <div
            key={league.id}
            onClick={() => handleViewLeague(league)}
            style={{
              padding: isMobile ? '14px' : '12px',
              background: '#1a1a1a',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid #333',
              minHeight: isMobile ? '60px' : 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
              <strong style={{ fontSize: isMobile ? '0.95rem' : '1rem', flex: 1, minWidth: 0 }}>{league.name}</strong>
              <span style={{
                color: league.status === 'registration' ? '#4CAF50' :
                       league.status === 'active' ? '#2196F3' : '#888',
                fontSize: isMobile ? '0.7rem' : '12px',
                flexShrink: 0,
                padding: isMobile ? '4px 8px' : '0',
                background: isMobile ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderRadius: '4px'
              }}>
                {league.status === 'registration' ? (isMobile ? 'Open' : t.registrationOpen) : league.status}
              </span>
            </div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '12px', color: '#888' }}>
              {isMobile ? '' : `${t.createdBy}: ${league.creator_username} | `}{league.format.replace('_', ' ')} | {league.time_control}
            </div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '12px', color: '#888' }}>
              {t.participants}: {league.participant_count || 0} | {t.round}: {league.current_round}/{league.total_rounds}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderStandings = () => {
    const divisionParticipants = participants.filter(p => p.division === selectedDivision);
    const sortedParticipants = [...divisionParticipants].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aGD = a.goals_for - a.goals_against;
      const bGD = b.goals_for - b.goals_against;
      if (bGD !== aGD) return bGD - aGD;
      return b.wins - a.wins;
    });

    return (
      <div>
        {selectedLeague && selectedLeague.max_divisions > 1 && (
          <div style={{ marginBottom: '12px' }}>
            <select
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(parseInt(e.target.value));
                socket.emit('get_league_standings', { leagueId: selectedLeague.id, division: parseInt(e.target.value) });
              }}
              style={{
                padding: isMobile ? '12px' : '8px',
                background: '#1a1a1a',
                color: 'white',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: isMobile ? '1rem' : '1rem',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              {Array.from({ length: selectedLeague.max_divisions }, (_, i) => (
                <option key={i + 1} value={i + 1}>{t.division} {i + 1}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '0.75rem' : '14px', minWidth: isMobile ? '400px' : 'auto' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ textAlign: 'left', padding: isMobile ? '8px 4px' : '8px' }}>#</th>
                <th style={{ textAlign: 'left', padding: isMobile ? '8px 4px' : '8px' }}>{isMobile ? 'Name' : 'Player'}</th>
                <th style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px' }}>{t.played}</th>
                <th style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px' }}>{t.won}</th>
                <th style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px' }}>{t.drawn}</th>
                <th style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px' }}>{t.lost}</th>
                {!isMobile && <th style={{ textAlign: 'center', padding: '8px' }}>{t.goalDiff}</th>}
                <th style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px' }}>{t.points}</th>
                {!isMobile && <th style={{ textAlign: 'center', padding: '8px' }}>{t.form}</th>}
              </tr>
            </thead>
            <tbody>
              {sortedParticipants.map((p, idx) => {
                const isPromotion = selectedLeague && selectedDivision > 1 && idx < selectedLeague.promotion_count;
                const isRelegation = selectedLeague && selectedDivision < selectedLeague.max_divisions &&
                                     idx >= sortedParticipants.length - selectedLeague.relegation_count;
                return (
                  <tr key={p.id} style={{
                    borderBottom: '1px solid #222',
                    background: isPromotion ? 'rgba(76, 175, 80, 0.1)' :
                               isRelegation ? 'rgba(244, 67, 54, 0.1)' : 'transparent'
                  }}>
                    <td style={{ padding: isMobile ? '8px 4px' : '8px' }}>{idx + 1}</td>
                    <td style={{ padding: isMobile ? '8px 4px' : '8px' }}>
                      {p.username}
                      {!isMobile && <span style={{ color: '#888', fontSize: '12px', marginLeft: '4px' }}>({p.rating})</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px' }}>{p.games_played}</td>
                    <td style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px', color: '#4CAF50' }}>{p.wins}</td>
                    <td style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px', color: '#888' }}>{p.draws}</td>
                    <td style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px', color: '#F44336' }}>{p.losses}</td>
                    {!isMobile && <td style={{ textAlign: 'center', padding: '8px' }}>{p.goals_for - p.goals_against}</td>}
                    <td style={{ textAlign: 'center', padding: isMobile ? '8px 4px' : '8px', fontWeight: 'bold' }}>{p.points}</td>
                    {!isMobile && (
                      <td style={{ textAlign: 'center', padding: '8px' }}>
                        {p.form.split('').map((f, i) => (
                          <span key={i} style={{
                            color: f === 'W' ? '#4CAF50' : f === 'L' ? '#F44336' : '#888',
                            marginRight: '2px'
                          }}>
                            {f}
                          </span>
                        ))}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFixtures = () => {
    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

    return (
      <div>
        {rounds.map(round => (
          <div key={round} style={{ marginBottom: isMobile ? '12px' : '16px' }}>
            <h4 style={{ color: '#888', marginBottom: '8px', fontSize: isMobile ? '0.85rem' : '1rem' }}>{t.round} {round}</h4>
            {matches.filter(m => m.round === round).map(match => {
              const isMyMatch = user && (match.home_id === user.id || match.away_id === user.id);
              const canPlay = isMyMatch && match.status === 'scheduled' && selectedLeague?.status === 'active';

              return (
                <div
                  key={match.id}
                  style={{
                    padding: isMobile ? '12px' : '8px 12px',
                    background: isMyMatch ? '#1a2a3a' : '#1a1a1a',
                    borderRadius: '4px',
                    marginBottom: isMobile ? '6px' : '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: isMobile ? 'wrap' : 'nowrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, fontSize: isMobile ? '0.85rem' : '1rem' }}>
                    <span style={{ minWidth: isMobile ? 'auto' : '100px' }}>{match.home_username}</span>
                    <span style={{ color: '#888' }}>{t.vs}</span>
                    <span style={{ minWidth: isMobile ? 'auto' : '100px' }}>{match.away_username}</span>
                    {match.result && (
                      <span style={{ color: '#4CAF50', marginLeft: '8px', fontSize: isMobile ? '0.8rem' : '1rem' }}>
                        {match.home_score} - {match.away_score}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: isMobile ? '0.7rem' : '12px',
                      color: match.status === 'completed' ? '#4CAF50' :
                             match.status === 'active' ? '#2196F3' : '#888'
                    }}>
                      {match.status}
                    </span>
                    {canPlay && (
                      <button
                        onClick={() => handlePlayMatch(match)}
                        style={{
                          padding: isMobile ? '10px 16px' : '4px 12px',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: isMobile ? '0.85rem' : '1rem',
                          minHeight: isMobile ? '44px' : 'auto'
                        }}
                      >
                        {t.play}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderLeagueDetail = () => {
    if (!selectedLeague) return null;

    const isCreator = user?.id === selectedLeague.creator_id;
    const canStart = isCreator && selectedLeague.status === 'registration' && participants.length >= 2;
    const canJoin = user && !isRegistered && selectedLeague.status === 'registration';
    const canLeave = user && isRegistered && !isCreator && selectedLeague.status === 'registration';

    return (
      <div>
        <button
          onClick={() => setSelectedLeague(null)}
          style={{
            padding: isMobile ? '10px 16px' : '8px 16px',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: isMobile ? '12px' : '16px',
            fontSize: isMobile ? '0.9rem' : '1rem',
            minHeight: isMobile ? '44px' : 'auto',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ← {t.back}
        </button>

        <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '1.1rem' : '1.17rem' }}>{selectedLeague.name}</h3>
          {selectedLeague.description && (
            <p style={{ color: '#888', margin: '0 0 8px 0', fontSize: isMobile ? '0.85rem' : '1rem' }}>{selectedLeague.description}</p>
          )}
          <div style={{ fontSize: isMobile ? '0.8rem' : '14px', color: '#888' }}>
            {selectedLeague.format.replace('_', ' ')} | {selectedLeague.time_control} | {selectedLeague.status}
            {selectedLeague.season && ` | ${selectedLeague.season}`}
          </div>
          <div style={{ fontSize: isMobile ? '0.8rem' : '14px', color: '#888' }}>
            {t.round}: {selectedLeague.current_round}/{selectedLeague.total_rounds} | {t.participants}: {participants.length}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: isMobile ? '12px' : '16px', flexWrap: 'wrap' }}>
          {canJoin && (
            <button
              onClick={handleJoinLeague}
              style={{
                padding: isMobile ? '12px 20px' : '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              {t.join}
            </button>
          )}
          {canLeave && (
            <button
              onClick={handleLeaveLeague}
              style={{
                padding: isMobile ? '12px 20px' : '8px 16px',
                background: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              {t.leave}
            </button>
          )}
          {canStart && (
            <button
              onClick={handleStartLeague}
              style={{
                padding: isMobile ? '12px 20px' : '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              {t.start}
            </button>
          )}
          {isCreator && selectedLeague.status !== 'active' && (
            <button
              onClick={handleDeleteLeague}
              style={{
                padding: isMobile ? '12px 20px' : '8px 16px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              {t.delete}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: isMobile ? '12px' : '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('standings')}
            style={{
              padding: isMobile ? '10px 16px' : '8px 16px',
              background: activeTab === 'standings' ? '#4CAF50' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: isMobile ? '0.85rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          >
            {t.standings}
          </button>
          <button
            onClick={() => setActiveTab('fixtures')}
            style={{
              padding: isMobile ? '10px 16px' : '8px 16px',
              background: activeTab === 'fixtures' ? '#4CAF50' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: isMobile ? '0.85rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          >
            {t.fixtures}
          </button>
          {myMatches.length > 0 && (
            <button
              onClick={() => setActiveTab('myMatches')}
              style={{
                padding: isMobile ? '10px 16px' : '8px 16px',
                background: activeTab === 'myMatches' ? '#4CAF50' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '0.85rem' : '1rem',
                minHeight: isMobile ? '44px' : 'auto'
              }}
            >
              {isMobile ? 'My' : t.myMatches}
            </button>
          )}
        </div>

        {activeTab === 'standings' && renderStandings()}
        {activeTab === 'fixtures' && renderFixtures()}
        {activeTab === 'myMatches' && (
          <div>
            {myMatches.map(match => {
              const isHome = user?.id === match.home_id;
              const canPlay = match.status === 'scheduled' && selectedLeague.status === 'active';

              return (
                <div
                  key={match.id}
                  style={{
                    padding: isMobile ? '14px' : '12px',
                    background: '#1a2a3a',
                    borderRadius: '4px',
                    marginBottom: isMobile ? '10px' : '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <div style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', color: '#888' }}>{t.round} {match.round}</div>
                    <div>
                      {isHome ? (
                        <><strong>{t.home}</strong> {t.vs} {match.away_username}</>
                      ) : (
                        <>{match.home_username} {t.vs} <strong>{t.away}</strong></>
                      )}
                    </div>
                    {match.result && (
                      <div style={{ color: '#4CAF50', fontSize: isMobile ? '0.85rem' : '1rem' }}>
                        {match.home_score} - {match.away_score}
                      </div>
                    )}
                  </div>
                  {canPlay && (
                    <button
                      onClick={() => handlePlayMatch(match)}
                      style={{
                        padding: isMobile ? '12px 20px' : '8px 16px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        minHeight: isMobile ? '44px' : 'auto',
                        flexShrink: 0
                      }}
                    >
                      {t.play}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCreateForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '12px' }}>
      <input
        type="text"
        placeholder={t.leagueName}
        value={createName}
        onChange={(e) => setCreateName(e.target.value)}
        style={{
          padding: isMobile ? '12px' : '10px',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '4px',
          color: 'white',
          fontSize: isMobile ? '1rem' : '1rem',
          minHeight: isMobile ? '44px' : 'auto'
        }}
      />
      <textarea
        placeholder={t.description}
        value={createDescription}
        onChange={(e) => setCreateDescription(e.target.value)}
        style={{
          padding: isMobile ? '12px' : '10px',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '4px',
          color: 'white',
          minHeight: isMobile ? '80px' : '60px',
          resize: 'vertical',
          fontSize: isMobile ? '1rem' : '1rem'
        }}
      />
      <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: isMobile ? '0.8rem' : '12px', color: '#888' }}>{t.type}</label>
          <select
            value={createType}
            onChange={(e) => setCreateType(e.target.value as 'individual' | 'team')}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '10px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              fontSize: isMobile ? '1rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          >
            <option value="individual">{t.individual}</option>
            <option value="team">{t.team}</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: isMobile ? '0.8rem' : '12px', color: '#888' }}>{t.format}</label>
          <select
            value={createFormat}
            onChange={(e) => setCreateFormat(e.target.value as 'round_robin' | 'swiss' | 'double_round_robin')}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '10px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              fontSize: isMobile ? '1rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          >
            <option value="round_robin">{t.roundRobin}</option>
            <option value="double_round_robin">{isMobile ? 'Double RR' : t.doubleRoundRobin}</option>
            <option value="swiss">{t.swiss}</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: isMobile ? '0.8rem' : '12px', color: '#888' }}>{t.timeControl}</label>
          <select
            value={createTimeControl}
            onChange={(e) => setCreateTimeControl(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '10px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              fontSize: isMobile ? '1rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          >
            <option value="3+0">3+0 Blitz</option>
            <option value="3+2">3+2 Blitz</option>
            <option value="5+0">5+0 Blitz</option>
            <option value="5+3">5+3 Blitz</option>
            <option value="10+0">10+0 Rapid</option>
            <option value="10+5">10+5 Rapid</option>
            <option value="15+10">15+10 Rapid</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: isMobile ? '0.8rem' : '12px', color: '#888' }}>{t.season}</label>
          <input
            type="text"
            placeholder="2024/2025"
            value={createSeason}
            onChange={(e) => setCreateSeason(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '10px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              boxSizing: 'border-box',
              fontSize: isMobile ? '1rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: isMobile ? '0.8rem' : '12px', color: '#888' }}>{isMobile ? 'Div' : t.maxDivisions}</label>
          <input
            type="number"
            min="1"
            max="10"
            value={createMaxDivisions}
            onChange={(e) => setCreateMaxDivisions(parseInt(e.target.value) || 1)}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '10px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              boxSizing: 'border-box',
              fontSize: isMobile ? '1rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: isMobile ? '0.8rem' : '12px', color: '#888' }}>{isMobile ? 'W' : t.pointsForWin}</label>
          <input
            type="number"
            min="0"
            value={createPointsWin}
            onChange={(e) => setCreatePointsWin(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '10px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              boxSizing: 'border-box',
              fontSize: isMobile ? '1rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: isMobile ? '0.8rem' : '12px', color: '#888' }}>{isMobile ? 'D' : t.pointsForDraw}</label>
          <input
            type="number"
            min="0"
            value={createPointsDraw}
            onChange={(e) => setCreatePointsDraw(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '10px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: 'white',
              boxSizing: 'border-box',
              fontSize: isMobile ? '1rem' : '1rem',
              minHeight: isMobile ? '44px' : 'auto'
            }}
          />
        </div>
      </div>
      <button
        onClick={handleCreateLeague}
        disabled={!createName.trim()}
        style={{
          padding: isMobile ? '14px' : '12px',
          background: createName.trim() ? '#4CAF50' : '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: createName.trim() ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          fontSize: isMobile ? '1rem' : '1rem',
          minHeight: isMobile ? '48px' : 'auto'
        }}
      >
        {t.createLeague}
      </button>
    </div>
  );

  if (selectedLeague) {
    return (
      <div style={{
        padding: isMobile ? '16px' : '16px',
        background: '#121212',
        borderRadius: isMobile ? '16px 16px 0 0' : '8px',
        minHeight: isMobile ? 'auto' : '400px',
        maxHeight: isMobile ? '80vh' : 'auto',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: isMobile ? 'fixed' : 'relative',
        bottom: isMobile ? 0 : 'auto',
        left: isMobile ? 0 : 'auto',
        right: isMobile ? 0 : 'auto',
        zIndex: isMobile ? 100 : 'auto'
      }}>
        {renderLeagueDetail()}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? '#4CAF50' : 'transparent',
          border: '1px solid #444',
          color: 'white',
          padding: isMobile ? '10px 12px' : '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : '8px',
          minHeight: isMobile ? '44px' : 'auto'
        }}
      >
        <span style={{ fontSize: isMobile ? '1.1rem' : '1rem' }}>{'\u{1F3C5}'}</span>
        {isMobile ? '' : t.leagues}
      </button>

      {/* Mobile overlay backdrop */}
      {isOpen && isMobile && (
        <div
          onClick={() => setIsOpen(false)}
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

      {isOpen && (
        <div style={{
          position: isMobile ? 'fixed' : 'absolute',
          top: isMobile ? 'auto' : '100%',
          bottom: isMobile ? 0 : 'auto',
          left: isMobile ? 0 : 'auto',
          right: isMobile ? 0 : 0,
          width: isMobile ? '100%' : '400px',
          maxHeight: isMobile ? '75vh' : '500px',
          background: '#121212',
          border: isMobile ? 'none' : '1px solid #333',
          borderRadius: isMobile ? '16px 16px 0 0' : '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 100,
          marginTop: isMobile ? 0 : '8px',
          overflow: 'hidden',
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
              borderBottom: '1px solid #333'
            }}>
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {t.leagues}
              </span>
              <button
                onClick={() => setIsOpen(false)}
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
          <div style={{
            display: 'flex',
            gap: '4px',
            padding: isMobile ? '8px 12px' : '8px',
            flexWrap: 'wrap',
            borderBottom: '1px solid #333',
            overflowX: isMobile ? 'auto' : 'visible',
            WebkitOverflowScrolling: 'touch'
          }}>
            {(['open', 'active', 'completed', 'my', 'create'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: isMobile ? '10px 14px' : '6px 12px',
                  background: activeTab === tab ? '#4CAF50' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : '12px',
                  whiteSpace: 'nowrap',
                  minHeight: isMobile ? '40px' : 'auto'
                }}
              >
                {tab === 'open' ? (isMobile ? 'Open' : t.open) :
                 tab === 'active' ? t.active :
                 tab === 'completed' ? (isMobile ? 'Done' : t.completed) :
                 tab === 'my' ? (isMobile ? 'My' : t.myLeagues) :
                 '+'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '16px' : '12px',
            WebkitOverflowScrolling: 'touch'
          }}>
            {activeTab === 'open' && renderLeagueList(openLeagues)}
            {activeTab === 'active' && renderLeagueList(activeLeagues)}
            {activeTab === 'completed' && renderLeagueList(completedLeagues)}
            {activeTab === 'my' && renderLeagueList(myLeagues)}
            {activeTab === 'create' && renderCreateForm()}
          </div>
        </div>
      )}
    </div>
  );
}
