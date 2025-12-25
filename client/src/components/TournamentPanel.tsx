import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  club_id: string | null;
  type: 'swiss' | 'round_robin' | 'knockout' | 'arena';
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
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

interface TournamentParticipant {
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

interface TournamentGame {
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
  status: 'pending' | 'active' | 'completed' | 'forfeit';
  white_username?: string;
  black_username?: string;
  white_rating?: number;
  black_rating?: number;
}

interface TournamentPanelProps {
  socket: Socket;
  language: 'en' | 'no';
  onJoinTournamentGame?: (roomCode: string) => void;
}

const translations = {
  en: {
    tournaments: 'Tournaments',
    upcoming: 'Upcoming',
    active: 'Active',
    completed: 'Completed',
    myTournaments: 'My Tournaments',
    create: 'Create',
    tournamentName: 'Tournament Name',
    description: 'Description',
    type: 'Type',
    swiss: 'Swiss',
    roundRobin: 'Round Robin',
    knockout: 'Knockout',
    arena: 'Arena',
    timeControl: 'Time Control',
    maxParticipants: 'Max Participants',
    createTournament: 'Create Tournament',
    join: 'Join',
    leave: 'Leave',
    start: 'Start',
    delete: 'Delete',
    participants: 'Participants',
    standings: 'Standings',
    games: 'Games',
    round: 'Round',
    score: 'Score',
    buchholz: 'Buchholz',
    wins: 'W',
    draws: 'D',
    losses: 'L',
    vs: 'vs',
    play: 'Play',
    view: 'View',
    noTournaments: 'No tournaments found',
    createdBy: 'Created by',
    status: 'Status',
    back: 'Back',
    myGames: 'My Games',
    pending: 'Pending',
    registrationOpen: 'Registration Open'
  },
  no: {
    tournaments: 'Turneringer',
    upcoming: 'Kommende',
    active: 'Aktive',
    completed: 'Fullførte',
    myTournaments: 'Mine Turneringer',
    create: 'Opprett',
    tournamentName: 'Turneringsnavn',
    description: 'Beskrivelse',
    type: 'Type',
    swiss: 'Sveitsisk',
    roundRobin: 'Rundspill',
    knockout: 'Utslagsspill',
    arena: 'Arena',
    timeControl: 'Tidskontroll',
    maxParticipants: 'Maks Deltakere',
    createTournament: 'Opprett Turnering',
    join: 'Bli med',
    leave: 'Forlat',
    start: 'Start',
    delete: 'Slett',
    participants: 'Deltakere',
    standings: 'Stillingen',
    games: 'Partier',
    round: 'Runde',
    score: 'Poeng',
    buchholz: 'Buchholz',
    wins: 'S',
    draws: 'R',
    losses: 'T',
    vs: 'mot',
    play: 'Spill',
    view: 'Se',
    noTournaments: 'Ingen turneringer funnet',
    createdBy: 'Opprettet av',
    status: 'Status',
    back: 'Tilbake',
    myGames: 'Mine Partier',
    pending: 'Venter',
    registrationOpen: 'Registrering åpen'
  }
};

export function TournamentPanel({ socket, language, onJoinTournamentGame }: TournamentPanelProps) {
  const { user } = useAuth();
  const t = translations[language];

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'active' | 'completed' | 'my' | 'create'>('upcoming');
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<Tournament[]>([]);
  const [myTournaments, setMyTournaments] = useState<Tournament[]>([]);

  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [currentRoundGames, setCurrentRoundGames] = useState<TournamentGame[]>([]);
  const [myGames, setMyGames] = useState<TournamentGame[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);

  // Create form state
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    type: 'swiss' as 'swiss' | 'round_robin' | 'knockout' | 'arena',
    timeControl: '5+0',
    maxParticipants: 16
  });

  // Fetch tournaments when panel opens and when tab changes
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'upcoming') {
      socket.emit('get_upcoming_tournaments');
    } else if (activeTab === 'active') {
      socket.emit('get_active_tournaments');
    } else if (activeTab === 'completed') {
      socket.emit('get_completed_tournaments');
    } else if (activeTab === 'my') {
      socket.emit('get_my_tournaments');
    }
  }, [isOpen, activeTab, socket]);

  // Socket event listeners
  useEffect(() => {
    const onUpcomingTournaments = ({ tournaments }: { tournaments: Tournament[] }) => {
      setUpcomingTournaments(tournaments);
    };

    const onActiveTournaments = ({ tournaments }: { tournaments: Tournament[] }) => {
      setActiveTournaments(tournaments);
    };

    const onCompletedTournaments = ({ tournaments }: { tournaments: Tournament[] }) => {
      setCompletedTournaments(tournaments);
    };

    const onMyTournaments = ({ tournaments }: { tournaments: Tournament[] }) => {
      setMyTournaments(tournaments);
    };

    const onTournamentCreated = ({ tournament }: { tournament: Tournament }) => {
      setUpcomingTournaments(prev => [tournament, ...prev]);
      setActiveTab('upcoming');
      setNewTournament({ name: '', description: '', type: 'swiss', timeControl: '5+0', maxParticipants: 16 });
    };

    const onTournamentDetails = ({ tournament, participants: p, currentRoundGames: games, myGames: mg, isRegistered: reg }: {
      tournament: Tournament;
      participants: TournamentParticipant[];
      currentRoundGames: TournamentGame[];
      myGames: TournamentGame[];
      isRegistered: boolean;
    }) => {
      setSelectedTournament(tournament);
      setParticipants(p);
      setCurrentRoundGames(games);
      setMyGames(mg);
      setIsRegistered(reg);
    };

    const onTournamentJoined = ({ tournamentId }: { tournamentId: string }) => {
      if (selectedTournament?.id === tournamentId) {
        socket.emit('get_tournament', { tournamentId });
      }
    };

    const onTournamentLeft = ({ tournamentId }: { tournamentId: string }) => {
      if (selectedTournament?.id === tournamentId) {
        socket.emit('get_tournament', { tournamentId });
      }
    };

    const onTournamentStarted = ({ tournamentId, pairings }: { tournamentId: string; pairings: TournamentGame[] }) => {
      if (selectedTournament?.id === tournamentId) {
        socket.emit('get_tournament', { tournamentId });
      }
      // Refresh active tournaments
      socket.emit('get_active_tournaments');
      socket.emit('get_upcoming_tournaments');
    };

    const onTournamentDeleted = ({ tournamentId }: { tournamentId: string }) => {
      setUpcomingTournaments(prev => prev.filter(t => t.id !== tournamentId));
      if (selectedTournament?.id === tournamentId) {
        setSelectedTournament(null);
      }
    };

    const onTournamentsUpdated = () => {
      socket.emit('get_upcoming_tournaments');
      socket.emit('get_active_tournaments');
    };

    const onTournamentParticipantUpdate = ({ tournamentId }: { tournamentId: string }) => {
      if (selectedTournament?.id === tournamentId) {
        socket.emit('get_tournament', { tournamentId });
      }
    };

    const onTournamentRoundStarted = ({ tournamentId }: { tournamentId: string }) => {
      if (selectedTournament?.id === tournamentId) {
        socket.emit('get_tournament', { tournamentId });
      }
    };

    const onTournamentGameCompleted = ({ tournamentId }: { tournamentId: string }) => {
      if (selectedTournament?.id === tournamentId) {
        socket.emit('get_tournament', { tournamentId });
      }
    };

    socket.on('upcoming_tournaments', onUpcomingTournaments);
    socket.on('active_tournaments', onActiveTournaments);
    socket.on('completed_tournaments', onCompletedTournaments);
    socket.on('my_tournaments', onMyTournaments);
    socket.on('tournament_created', onTournamentCreated);
    socket.on('tournament_details', onTournamentDetails);
    socket.on('tournament_joined', onTournamentJoined);
    socket.on('tournament_left', onTournamentLeft);
    socket.on('tournament_started', onTournamentStarted);
    socket.on('tournament_deleted', onTournamentDeleted);
    socket.on('tournaments_updated', onTournamentsUpdated);
    socket.on('tournament_participant_update', onTournamentParticipantUpdate);
    socket.on('tournament_round_started', onTournamentRoundStarted);
    socket.on('tournament_game_completed', onTournamentGameCompleted);

    return () => {
      socket.off('upcoming_tournaments', onUpcomingTournaments);
      socket.off('active_tournaments', onActiveTournaments);
      socket.off('completed_tournaments', onCompletedTournaments);
      socket.off('my_tournaments', onMyTournaments);
      socket.off('tournament_created', onTournamentCreated);
      socket.off('tournament_details', onTournamentDetails);
      socket.off('tournament_joined', onTournamentJoined);
      socket.off('tournament_left', onTournamentLeft);
      socket.off('tournament_started', onTournamentStarted);
      socket.off('tournament_deleted', onTournamentDeleted);
      socket.off('tournaments_updated', onTournamentsUpdated);
      socket.off('tournament_participant_update', onTournamentParticipantUpdate);
      socket.off('tournament_round_started', onTournamentRoundStarted);
      socket.off('tournament_game_completed', onTournamentGameCompleted);
    };
  }, [socket, selectedTournament]);

  const handleCreateTournament = () => {
    if (!newTournament.name.trim()) return;
    socket.emit('create_tournament', {
      name: newTournament.name,
      description: newTournament.description || undefined,
      type: newTournament.type,
      timeControl: newTournament.timeControl,
      maxParticipants: newTournament.maxParticipants
    });
  };

  const handleJoinTournament = (tournamentId: string) => {
    socket.emit('join_tournament', { tournamentId });
  };

  const handleLeaveTournament = (tournamentId: string) => {
    socket.emit('leave_tournament', { tournamentId });
  };

  const handleStartTournament = (tournamentId: string) => {
    socket.emit('start_tournament', { tournamentId });
  };

  const handleDeleteTournament = (tournamentId: string) => {
    if (confirm(language === 'en' ? 'Delete this tournament?' : 'Slett denne turneringen?')) {
      socket.emit('delete_tournament', { tournamentId });
    }
  };

  const handleViewTournament = (tournament: Tournament) => {
    socket.emit('get_tournament', { tournamentId: tournament.id });
  };

  const handlePlayGame = (roomCode: string) => {
    if (onJoinTournamentGame) {
      onJoinTournamentGame(roomCode);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      swiss: t.swiss,
      round_robin: t.roundRobin,
      knockout: t.knockout,
      arena: t.arena
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'upcoming') return t.registrationOpen;
    if (status === 'active') return t.active;
    if (status === 'completed') return t.completed;
    return status;
  };

  const renderTournamentList = (tournaments: Tournament[]) => {
    if (tournaments.length === 0) {
      return <div style={{ padding: '20px', color: '#888', textAlign: 'center' }}>{t.noTournaments}</div>;
    }

    return tournaments.map(tournament => (
      <div
        key={tournament.id}
        style={{
          padding: '12px',
          marginBottom: '8px',
          background: '#2a2a2a',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
        onClick={() => handleViewTournament(tournament)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {tournament.club_name && <span style={{ color: '#9b59b6', marginRight: '8px' }}>[{tournament.club_name}]</span>}
              {tournament.name}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {getTypeLabel(tournament.type)} | {tournament.time_control} | {tournament.participant_count || 0}/{tournament.max_participants}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              {t.createdBy}: {tournament.creator_username}
            </div>
          </div>
          <div style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            background: tournament.status === 'upcoming' ? '#27ae60' : tournament.status === 'active' ? '#e67e22' : '#7f8c8d',
            color: 'white'
          }}>
            {getStatusLabel(tournament.status)}
          </div>
        </div>
      </div>
    ));
  };

  const renderTournamentDetail = () => {
    if (!selectedTournament) return null;

    const isCreator = user?.id === selectedTournament.creator_id;
    const canStart = isCreator && selectedTournament.status === 'upcoming' && participants.length >= 2;
    const canJoin = selectedTournament.status === 'upcoming' && !isRegistered;
    const canLeave = selectedTournament.status === 'upcoming' && isRegistered && !isCreator;

    return (
      <div style={{ padding: '16px' }}>
        <button
          onClick={() => setSelectedTournament(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3498db',
            cursor: 'pointer',
            marginBottom: '16px',
            padding: 0
          }}
        >
          ← {t.back}
        </button>

        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: 0, marginBottom: '8px' }}>
            {selectedTournament.club_name && <span style={{ color: '#9b59b6', marginRight: '8px' }}>[{selectedTournament.club_name}]</span>}
            {selectedTournament.name}
          </h2>
          <div style={{ color: '#888', fontSize: '14px' }}>
            {getTypeLabel(selectedTournament.type)} | {selectedTournament.time_control} | {t.round} {selectedTournament.current_round}/{selectedTournament.total_rounds || '?'}
          </div>
          {selectedTournament.description && (
            <div style={{ marginTop: '8px', color: '#aaa' }}>{selectedTournament.description}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {canJoin && (
            <button
              onClick={() => handleJoinTournament(selectedTournament.id)}
              style={{
                background: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {t.join}
            </button>
          )}
          {canLeave && (
            <button
              onClick={() => handleLeaveTournament(selectedTournament.id)}
              style={{
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {t.leave}
            </button>
          )}
          {canStart && (
            <button
              onClick={() => handleStartTournament(selectedTournament.id)}
              style={{
                background: '#3498db',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {t.start}
            </button>
          )}
          {isCreator && selectedTournament.status !== 'active' && (
            <button
              onClick={() => handleDeleteTournament(selectedTournament.id)}
              style={{
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {t.delete}
            </button>
          )}
        </div>

        {/* My Games (if active) */}
        {selectedTournament.status === 'active' && myGames.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{t.myGames}</h3>
            {myGames.map(game => (
              <div
                key={game.id}
                style={{
                  padding: '8px',
                  background: '#3a3a3a',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ color: game.white_id === user?.id ? '#f1c40f' : 'white' }}>
                    {game.white_username}
                  </span>
                  <span style={{ color: '#888', margin: '0 8px' }}>{t.vs}</span>
                  <span style={{ color: game.black_id === user?.id ? '#f1c40f' : 'white' }}>
                    {game.black_username}
                  </span>
                  {game.result && (
                    <span style={{ marginLeft: '8px', color: '#888' }}>[{game.result}]</span>
                  )}
                </div>
                {game.status === 'pending' && game.room_code && (
                  <button
                    onClick={() => handlePlayGame(game.room_code!)}
                    style={{
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {t.play}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Standings */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{t.standings} ({participants.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>#</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Player</th>
                <th style={{ textAlign: 'center', padding: '8px 4px' }}>{t.score}</th>
                <th style={{ textAlign: 'center', padding: '8px 4px' }}>{t.buchholz}</th>
                <th style={{ textAlign: 'center', padding: '8px 4px' }}>{t.wins}/{t.draws}/{t.losses}</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '6px 4px' }}>{idx + 1}</td>
                  <td style={{ padding: '6px 4px' }}>
                    <span style={{ color: p.user_id === user?.id ? '#f1c40f' : 'white' }}>
                      {p.username}
                    </span>
                    <span style={{ color: '#888', marginLeft: '4px', fontSize: '11px' }}>({p.rating})</span>
                    {p.status === 'withdrawn' && <span style={{ color: '#e74c3c', marginLeft: '4px' }}>(W)</span>}
                  </td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', fontWeight: 'bold' }}>{p.score}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', color: '#888' }}>{p.buchholz}</td>
                  <td style={{ textAlign: 'center', padding: '6px 4px', color: '#888' }}>{p.wins}/{p.draws}/{p.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Current Round Games */}
        {currentRoundGames.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{t.round} {selectedTournament.current_round} {t.games}</h3>
            {currentRoundGames.map(game => (
              <div
                key={game.id}
                style={{
                  padding: '8px',
                  background: '#2a2a2a',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span>{game.white_username}</span>
                  <span style={{ color: '#888', margin: '0 8px' }}>{t.vs}</span>
                  <span>{game.black_username}</span>
                </div>
                <div style={{ fontSize: '12px' }}>
                  {game.status === 'completed' ? (
                    <span style={{ color: '#27ae60' }}>{game.result}</span>
                  ) : game.status === 'active' ? (
                    <span style={{ color: '#e67e22' }}>In progress</span>
                  ) : (
                    <span style={{ color: '#888' }}>{t.pending}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCreateForm = () => (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#888' }}>
          {t.tournamentName}
        </label>
        <input
          type="text"
          value={newTournament.name}
          onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: 'white',
            boxSizing: 'border-box'
          }}
          placeholder={language === 'en' ? 'Enter tournament name' : 'Skriv inn turneringsnavn'}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#888' }}>
          {t.description}
        </label>
        <textarea
          value={newTournament.description}
          onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: 'white',
            boxSizing: 'border-box',
            minHeight: '60px',
            resize: 'vertical'
          }}
          placeholder={language === 'en' ? 'Optional description' : 'Valgfri beskrivelse'}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#888' }}>
          {t.type}
        </label>
        <select
          value={newTournament.type}
          onChange={(e) => setNewTournament({ ...newTournament, type: e.target.value as any })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: 'white'
          }}
        >
          <option value="swiss">{t.swiss}</option>
          <option value="round_robin">{t.roundRobin}</option>
          <option value="knockout">{t.knockout}</option>
          <option value="arena">{t.arena}</option>
        </select>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#888' }}>
          {t.timeControl}
        </label>
        <select
          value={newTournament.timeControl}
          onChange={(e) => setNewTournament({ ...newTournament, timeControl: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: 'white'
          }}
        >
          <option value="1+0">Bullet 1+0</option>
          <option value="2+1">Bullet 2+1</option>
          <option value="3+0">Blitz 3+0</option>
          <option value="3+2">Blitz 3+2</option>
          <option value="5+0">Blitz 5+0</option>
          <option value="5+3">Blitz 5+3</option>
          <option value="10+0">Rapid 10+0</option>
          <option value="10+5">Rapid 10+5</option>
          <option value="15+10">Rapid 15+10</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#888' }}>
          {t.maxParticipants}
        </label>
        <select
          value={newTournament.maxParticipants}
          onChange={(e) => setNewTournament({ ...newTournament, maxParticipants: parseInt(e.target.value) })}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: 'white'
          }}
        >
          <option value="4">4</option>
          <option value="8">8</option>
          <option value="16">16</option>
          <option value="32">32</option>
          <option value="64">64</option>
        </select>
      </div>

      <button
        onClick={handleCreateTournament}
        disabled={!newTournament.name.trim()}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '4px',
          border: 'none',
          background: newTournament.name.trim() ? '#27ae60' : '#444',
          color: 'white',
          cursor: newTournament.name.trim() ? 'pointer' : 'not-allowed',
          fontWeight: 'bold'
        }}
      >
        {t.createTournament}
      </button>
    </div>
  );

  if (selectedTournament) {
    return (
      <div style={{
        background: '#1e1e1e',
        borderRadius: '8px',
        border: '1px solid #333',
        minHeight: '400px',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {renderTournamentDetail()}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? '#3498db' : 'transparent',
          border: '1px solid #444',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span style={{ fontSize: '1rem' }}>{'\u{1F3C6}'}</span>
        {t.tournaments}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '400px',
          maxHeight: '500px',
          background: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 100,
          marginTop: '8px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #333',
            padding: '0 8px'
          }}>
            {[
              { key: 'upcoming', label: t.upcoming },
              { key: 'active', label: t.active },
              { key: 'completed', label: t.completed },
              { key: 'my', label: t.myTournaments },
              { key: 'create', label: t.create }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '8px 12px',
                  background: activeTab === tab.key ? '#2a2a2a' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #3498db' : '2px solid transparent',
                  color: activeTab === tab.key ? 'white' : '#888',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: activeTab === 'create' ? 0 : '12px' }}>
            {activeTab === 'upcoming' && renderTournamentList(upcomingTournaments)}
            {activeTab === 'active' && renderTournamentList(activeTournaments)}
            {activeTab === 'completed' && renderTournamentList(completedTournaments)}
            {activeTab === 'my' && renderTournamentList(myTournaments)}
            {activeTab === 'create' && renderCreateForm()}
          </div>
        </div>
      )}
    </div>
  );
}
