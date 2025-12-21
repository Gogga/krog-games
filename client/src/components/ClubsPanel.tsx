import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface Club {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  logo_emoji: string;
  member_count: number;
  is_public: boolean;
  created_at: string;
  owner_username?: string;
  role?: string;
}

interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  username?: string;
  rating?: number;
  online?: boolean;
}

interface ClubMessage {
  id: string;
  club_id: string;
  user_id: string;
  message: string;
  created_at: string;
  username?: string;
}

interface ClubInvitation {
  id: string;
  club_id: string;
  inviter_id: string;
  invitee_id: string;
  status: string;
  created_at: string;
  club_name?: string;
  inviter_username?: string;
}

interface ClubsPanelProps {
  socket: Socket;
  language: 'en' | 'no';
  onChallengeMember?: (memberId: string, memberUsername: string) => void;
}

export function ClubsPanel({ socket, language, onChallengeMember }: ClubsPanelProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [publicClubs, setPublicClubs] = useState<Club[]>([]);
  const [invitations, setInvitations] = useState<ClubInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<'my-clubs' | 'browse' | 'create' | 'invites'>('my-clubs');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Club[]>([]);

  // Club details view
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);

  // Chat
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create club form
  const [newClubName, setNewClubName] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [newClubEmoji, setNewClubEmoji] = useState('♔');
  const [newClubPublic, setNewClubPublic] = useState(true);
  const [createError, setCreateError] = useState('');

  // Invite members
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState<{ id: string; username: string; rating: number }[]>([]);

  const fetchMyClubs = useCallback(() => {
    socket.emit('get_my_clubs');
  }, [socket]);

  const fetchPublicClubs = useCallback(() => {
    socket.emit('get_public_clubs', { limit: 20, offset: 0 });
  }, [socket]);

  const fetchInvitations = useCallback(() => {
    socket.emit('get_club_invitations');
  }, [socket]);

  // Fetch invitations on mount to show badge count even when panel is closed
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  useEffect(() => {
    if (isOpen) {
      fetchMyClubs();
      fetchPublicClubs();
      fetchInvitations();
    }
  }, [isOpen, fetchMyClubs, fetchPublicClubs, fetchInvitations]);

  useEffect(() => {
    function onMyClubs(data: { clubs: Club[] }) {
      setMyClubs(data.clubs);
    }

    function onPublicClubs(data: { clubs: Club[] }) {
      setPublicClubs(data.clubs);
    }

    function onClubSearchResults(data: { clubs: Club[] }) {
      setSearchResults(data.clubs);
    }

    function onClubDetails(data: { club: Club; members: ClubMember[]; myRole: string | null }) {
      setSelectedClub(data.club);
      setClubMembers(data.members);
      setMyRole(data.myRole);
    }

    function onClubCreated(data: { success: boolean; club?: Club; error?: string }) {
      if (data.success) {
        setNewClubName('');
        setNewClubDescription('');
        setNewClubEmoji('♔');
        setCreateError('');
        setActiveTab('my-clubs');
        fetchMyClubs();
      } else {
        setCreateError(data.error || 'Failed to create club');
      }
    }

    function onClubJoined(data: { success: boolean; clubId: string; error?: string }) {
      if (data.success) {
        fetchMyClubs();
        fetchPublicClubs();
      }
    }

    function onClubLeft(data: { success: boolean; clubId: string }) {
      if (data.success) {
        fetchMyClubs();
        if (selectedClub?.id === data.clubId) {
          setSelectedClub(null);
          setShowChat(false);
        }
      }
    }

    function onClubInvitations(data: { invitations: ClubInvitation[] }) {
      setInvitations(data.invitations);
    }

    function onInvitationAccepted(data: { success: boolean }) {
      if (data.success) {
        fetchMyClubs();
        fetchInvitations();
      }
    }

    function onClubChatJoined(data: { clubId: string; messages: ClubMessage[] }) {
      setMessages(data.messages);
    }

    function onClubMessage(message: ClubMessage) {
      setMessages(prev => [...prev, message]);
    }

    function onClubMessageDeleted(data: { clubId: string; messageId: string }) {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    }

    function onMemberJoined(data: { clubId: string; member: { userId: string; username: string; rating: number } }) {
      if (selectedClub?.id === data.clubId) {
        socket.emit('get_club', { clubId: data.clubId });
      }
    }

    function onMemberLeft(data: { clubId: string; userId: string }) {
      if (selectedClub?.id === data.clubId) {
        socket.emit('get_club', { clubId: data.clubId });
      }
    }

    function onRoleChanged(data: { clubId: string; userId: string; newRole: string }) {
      if (selectedClub?.id === data.clubId) {
        socket.emit('get_club', { clubId: data.clubId });
      }
    }

    function onYourRoleChanged(data: { clubId: string; newRole: string }) {
      // My role in a club was changed - refresh if viewing that club
      if (selectedClub?.id === data.clubId) {
        socket.emit('get_club', { clubId: data.clubId });
      }
      // Also refresh my clubs list to update the role shown there
      fetchMyClubs();
    }

    function onUserSearchResults(data: { users: { id: string; username: string; rating: number }[] }) {
      setInviteSearchResults(data.users);
    }

    function onInvitationSent(data: { success: boolean; error?: string }) {
      if (data.success) {
        setInviteSearchQuery('');
        setInviteSearchResults([]);
        setShowInviteModal(false);
      }
    }

    function onMemberRoleUpdated(data: { success: boolean; clubId?: string; error?: string }) {
      if (data.success && data.clubId && selectedClub?.id === data.clubId) {
        // Refresh club details to show updated role
        socket.emit('get_club', { clubId: data.clubId });
      }
    }

    socket.on('my_clubs', onMyClubs);
    socket.on('member_role_updated', onMemberRoleUpdated);
    socket.on('user_search_results', onUserSearchResults);
    socket.on('invitation_sent', onInvitationSent);
    socket.on('public_clubs', onPublicClubs);
    socket.on('club_search_results', onClubSearchResults);
    socket.on('club_details', onClubDetails);
    socket.on('club_created', onClubCreated);
    socket.on('club_joined', onClubJoined);
    socket.on('club_left', onClubLeft);
    socket.on('club_invitations', onClubInvitations);
    socket.on('invitation_accepted', onInvitationAccepted);
    socket.on('invitation_declined', () => fetchInvitations());
    socket.on('club_chat_joined', onClubChatJoined);
    socket.on('club_message', onClubMessage);
    socket.on('club_message_deleted', onClubMessageDeleted);
    socket.on('member_joined', onMemberJoined);
    socket.on('member_left', onMemberLeft);
    socket.on('role_changed', onRoleChanged);
    socket.on('your_role_changed', onYourRoleChanged);
    socket.on('club_invitation_received', fetchInvitations);

    return () => {
      socket.off('my_clubs', onMyClubs);
      socket.off('member_role_updated', onMemberRoleUpdated);
      socket.off('user_search_results', onUserSearchResults);
      socket.off('invitation_sent', onInvitationSent);
      socket.off('public_clubs', onPublicClubs);
      socket.off('club_search_results', onClubSearchResults);
      socket.off('club_details', onClubDetails);
      socket.off('club_created', onClubCreated);
      socket.off('club_joined', onClubJoined);
      socket.off('club_left', onClubLeft);
      socket.off('club_invitations', onClubInvitations);
      socket.off('invitation_accepted', onInvitationAccepted);
      socket.off('invitation_declined');
      socket.off('club_chat_joined', onClubChatJoined);
      socket.off('club_message', onClubMessage);
      socket.off('club_message_deleted', onClubMessageDeleted);
      socket.off('member_joined', onMemberJoined);
      socket.off('member_left', onMemberLeft);
      socket.off('role_changed', onRoleChanged);
      socket.off('your_role_changed', onYourRoleChanged);
      socket.off('club_invitation_received');
    };
  }, [socket, fetchMyClubs, fetchPublicClubs, fetchInvitations, selectedClub]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      socket.emit('search_clubs', { query: searchQuery.trim() });
    }
  };

  const handleCreateClub = () => {
    if (newClubName.trim().length < 3) {
      setCreateError(language === 'en' ? 'Club name must be at least 3 characters' : 'Klubbnavn ma vaere minst 3 tegn');
      return;
    }
    socket.emit('create_club', {
      name: newClubName.trim(),
      description: newClubDescription.trim() || null,
      logoEmoji: newClubEmoji,
      isPublic: newClubPublic
    });
  };

  const handleJoinClub = (clubId: string) => {
    socket.emit('join_club', { clubId });
  };

  const handleLeaveClub = (clubId: string) => {
    if (window.confirm(language === 'en' ? 'Leave this club?' : 'Forlate denne klubben?')) {
      socket.emit('leave_club', { clubId });
    }
  };

  const handleViewClub = (club: Club) => {
    socket.emit('get_club', { clubId: club.id });
    setShowChat(false);
  };

  const handleOpenChat = () => {
    if (selectedClub && myRole) {
      socket.emit('join_club_chat', { clubId: selectedClub.id });
      setShowChat(true);
    }
  };

  const handleCloseChat = () => {
    if (selectedClub) {
      socket.emit('leave_club_chat', { clubId: selectedClub.id });
    }
    setShowChat(false);
    setMessages([]);
  };

  const handleSendMessage = () => {
    if (selectedClub && newMessage.trim()) {
      socket.emit('send_club_message', { clubId: selectedClub.id, message: newMessage.trim() });
      setNewMessage('');
    }
  };

  const handleAcceptInvitation = (invitationId: string) => {
    socket.emit('accept_club_invitation', { invitationId });
  };

  const handleDeclineInvitation = (invitationId: string) => {
    socket.emit('decline_club_invitation', { invitationId });
  };

  const handleSearchUsersToInvite = () => {
    if (inviteSearchQuery.trim().length >= 2) {
      socket.emit('search_users', { query: inviteSearchQuery.trim() });
    }
  };

  const handleInviteUser = (userId: string) => {
    if (selectedClub) {
      socket.emit('invite_to_club', { clubId: selectedClub.id, inviteeId: userId });
    }
  };

  const handleBackToList = () => {
    if (showChat) {
      handleCloseChat();
    }
    setSelectedClub(null);
    setClubMembers([]);
    setMyRole(null);
  };

  const emojiOptions = ['♔', '♕', '♖', '♗', '♘', '♙', '⚔️', '🏆', '🎯', '🌟', '🔥', '💎'];

  // Club detail view
  if (selectedClub) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: isOpen ? '#8e44ad' : 'transparent',
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
          <span>{selectedClub.logo_emoji}</span>
          {selectedClub.name}
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            width: '380px',
            maxHeight: '500px',
            background: 'var(--bg-secondary)',
            border: '1px solid #444',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            zIndex: 100,
            marginTop: '8px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '12px',
              borderBottom: '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={handleBackToList}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px'
                }}
              >
                ←
              </button>
              <span style={{ fontSize: '1.5rem' }}>{selectedClub.logo_emoji}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{selectedClub.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                  {clubMembers.length} {language === 'en' ? 'members' : 'medlemmer'}
                </div>
              </div>
              {myRole && (
                <button
                  onClick={showChat ? handleCloseChat : handleOpenChat}
                  style={{
                    marginLeft: 'auto',
                    padding: '6px 12px',
                    background: showChat ? '#e74c3c' : '#3498db',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: 'inherit'
                  }}
                >
                  {showChat ? '✕' : '💬'}
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {showChat ? (
                // Chat view
                <>
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {messages.length === 0 ? (
                      <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                        {language === 'en' ? 'No messages yet. Start the conversation!' : 'Ingen meldinger enda. Start samtalen!'}
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} style={{
                          background: 'var(--bg-primary)',
                          padding: '8px 12px',
                          borderRadius: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#3498db' }}>{msg.username}</span>
                            <span style={{ fontSize: '0.7rem', color: '#666' }}>
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div style={{ wordBreak: 'break-word' }}>{msg.message}</div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div style={{ padding: '12px', borderTop: '1px solid #444', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={language === 'en' ? 'Type a message...' : 'Skriv en melding...'}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid #444',
                        background: 'var(--bg-primary)',
                        color: 'white',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem'
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      style={{
                        padding: '10px 16px',
                        background: newMessage.trim() ? '#3498db' : '#555',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                        fontFamily: 'inherit'
                      }}
                    >
                      ↑
                    </button>
                  </div>
                </>
              ) : (
                // Members view
                <div style={{ overflowY: 'auto', padding: '12px' }}>
                  {selectedClub.description && (
                    <div style={{ marginBottom: '16px', color: '#888', fontSize: '0.9rem' }}>
                      {selectedClub.description}
                    </div>
                  )}
                  <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                    {language === 'en' ? 'Members' : 'Medlemmer'}
                  </div>
                  {clubMembers.map(member => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px',
                        background: 'var(--bg-primary)',
                        borderRadius: '6px',
                        marginBottom: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: member.online ? '#2ecc71' : '#666'
                        }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {member.username}
                            {member.role === 'owner' && <span style={{ marginLeft: '6px', color: '#f1c40f' }}>👑</span>}
                            {member.role === 'admin' && <span style={{ marginLeft: '6px', color: '#9b59b6' }}>⭐</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>
                            {member.online ? (language === 'en' ? 'Online' : 'Tilkoblet') : (language === 'en' ? 'Offline' : 'Frakoblet')}
                            {member.rating ? ` • ${member.rating}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {/* Challenge button for online members (not yourself) */}
                        {onChallengeMember && member.online && user?.id && member.user_id !== user.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (member.username) {
                                onChallengeMember(member.user_id, member.username);
                              }
                            }}
                            style={{
                              padding: '6px 10px',
                              background: '#81b64c',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontFamily: 'inherit'
                            }}
                          >
                            {language === 'en' ? 'Challenge' : 'Utfordre'}
                          </button>
                        )}
                        {/* Owner can promote/demote members (not themselves) */}
                        {myRole === 'owner' && member.role !== 'owner' && member.user_id !== user?.id && (
                          <>
                            {member.role === 'member' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  socket.emit('update_member_role', { clubId: selectedClub?.id, targetUserId: member.user_id, newRole: 'admin' });
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: '#9b59b6',
                                  border: 'none',
                                  borderRadius: '4px',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                  fontFamily: 'inherit'
                                }}
                                title={language === 'en' ? 'Promote to Admin' : 'Forfrem til admin'}
                              >
                                ⭐
                              </button>
                            ) : member.role === 'admin' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  socket.emit('update_member_role', { clubId: selectedClub?.id, targetUserId: member.user_id, newRole: 'member' });
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: '#e67e22',
                                  border: 'none',
                                  borderRadius: '4px',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                  fontFamily: 'inherit'
                                }}
                                title={language === 'en' ? 'Demote to Member' : 'Degrader til medlem'}
                              >
                                ↓
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Invite Members Button - for owners and admins */}
                  {(myRole === 'owner' || myRole === 'admin') && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '10px',
                        background: '#8e44ad',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>+</span>
                      {language === 'en' ? 'Invite Members' : 'Inviter medlemmer'}
                    </button>
                  )}

                  {/* Invite Modal */}
                  {showInviteModal && (
                    <div style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000
                    }}>
                      <div style={{
                        background: 'var(--bg-secondary)',
                        borderRadius: '12px',
                        padding: '20px',
                        width: '320px',
                        maxHeight: '400px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <h3 style={{ margin: 0 }}>{language === 'en' ? 'Invite Members' : 'Inviter medlemmer'}</h3>
                          <button
                            onClick={() => {
                              setShowInviteModal(false);
                              setInviteSearchQuery('');
                              setInviteSearchResults([]);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#888',
                              fontSize: '1.2rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <input
                            type="text"
                            value={inviteSearchQuery}
                            onChange={(e) => setInviteSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchUsersToInvite()}
                            placeholder={language === 'en' ? 'Search username...' : 'Sok brukernavn...'}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: '6px',
                              border: '1px solid #444',
                              background: 'var(--bg-primary)',
                              color: 'white',
                              fontFamily: 'inherit',
                              fontSize: '0.9rem'
                            }}
                          />
                          <button
                            onClick={handleSearchUsersToInvite}
                            disabled={inviteSearchQuery.trim().length < 2}
                            style={{
                              padding: '10px 16px',
                              background: inviteSearchQuery.trim().length >= 2 ? '#8e44ad' : '#555',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              cursor: inviteSearchQuery.trim().length >= 2 ? 'pointer' : 'not-allowed',
                              fontFamily: 'inherit'
                            }}
                          >
                            🔍
                          </button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                          {inviteSearchResults.length === 0 ? (
                            <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                              {inviteSearchQuery.length >= 2
                                ? (language === 'en' ? 'No users found' : 'Ingen brukere funnet')
                                : (language === 'en' ? 'Search for users to invite' : 'Sok etter brukere a invitere')}
                            </div>
                          ) : (
                            inviteSearchResults
                              .filter(user => !clubMembers.some(m => m.user_id === user.id))
                              .map(user => (
                                <div
                                  key={user.id}
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
                                    <div style={{ fontWeight: 600 }}>{user.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888' }}>{user.rating} rating</div>
                                  </div>
                                  <button
                                    onClick={() => handleInviteUser(user.id)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#27ae60',
                                      border: 'none',
                                      borderRadius: '4px',
                                      color: 'white',
                                      cursor: 'pointer',
                                      fontSize: '0.8rem',
                                      fontFamily: 'inherit'
                                    }}
                                  >
                                    {language === 'en' ? 'Invite' : 'Inviter'}
                                  </button>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {myRole && myRole !== 'owner' && (
                    <button
                      onClick={() => handleLeaveClub(selectedClub.id)}
                      style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '10px',
                        background: 'transparent',
                        border: '1px solid #e74c3c',
                        borderRadius: '6px',
                        color: '#e74c3c',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem'
                      }}
                    >
                      {language === 'en' ? 'Leave Club' : 'Forlat klubb'}
                    </button>
                  )}

                  {!myRole && selectedClub.is_public && (
                    <button
                      onClick={() => handleJoinClub(selectedClub.id)}
                      style={{
                        width: '100%',
                        marginTop: '16px',
                        padding: '10px',
                        background: '#27ae60',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem'
                      }}
                    >
                      {language === 'en' ? 'Join Club' : 'Bli med i klubb'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? '#8e44ad' : 'transparent',
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
        <span style={{ fontSize: '1rem' }}>♔</span>
        {language === 'en' ? 'Clubs' : 'Klubber'}
        {invitations.length > 0 && (
          <span style={{
            background: '#e74c3c',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {invitations.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '360px',
          maxHeight: '480px',
          background: 'var(--bg-secondary)',
          border: '1px solid #444',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 100,
          marginTop: '8px',
          overflow: 'hidden'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #444'
          }}>
            {[
              { key: 'my-clubs', label: language === 'en' ? 'My Clubs' : 'Mine', count: myClubs.length },
              { key: 'browse', label: language === 'en' ? 'Browse' : 'Utforsk', count: null },
              { key: 'create', label: language === 'en' ? 'Create' : 'Opprett', count: null },
              { key: 'invites', label: '✉', count: invitations.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{
                  flex: tab.key === 'invites' ? 0 : 1,
                  padding: tab.key === 'invites' ? '12px 16px' : '12px 8px',
                  background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #8e44ad' : '2px solid transparent',
                  color: activeTab === tab.key ? 'white' : '#888',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span style={{
                    background: tab.key === 'invites' ? '#e74c3c' : '#555',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '1px 6px',
                    fontSize: '0.7rem'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '12px'
          }}>
            {/* My Clubs Tab */}
            {activeTab === 'my-clubs' && (
              <>
                {myClubs.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                    {language === 'en' ? 'You are not in any clubs yet.' : 'Du er ikke med i noen klubber enda.'}
                  </div>
                ) : (
                  myClubs.map(club => (
                    <div
                      key={club.id}
                      onClick={() => handleViewClub(club)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--bg-primary)',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>{club.logo_emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{club.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          {club.member_count} {language === 'en' ? 'members' : 'medlemmer'}
                          {club.role && ` • ${club.role === 'owner' ? (language === 'en' ? 'Owner' : 'Eier') :
                                            club.role === 'admin' ? 'Admin' :
                                            (language === 'en' ? 'Member' : 'Medlem')}`}
                        </div>
                      </div>
                      <span style={{ color: '#888' }}>→</span>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Browse Tab */}
            {activeTab === 'browse' && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={language === 'en' ? 'Search clubs...' : 'Sok etter klubber...'}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      background: 'var(--bg-primary)',
                      color: 'white',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchQuery.trim().length < 2}
                    style={{
                      padding: '10px 16px',
                      background: searchQuery.trim().length >= 2 ? '#8e44ad' : '#555',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: searchQuery.trim().length >= 2 ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit'
                    }}
                  >
                    🔍
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  searchResults.map(club => (
                    <div
                      key={club.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--bg-primary)',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>{club.logo_emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{club.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          {club.member_count} {language === 'en' ? 'members' : 'medlemmer'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewClub(club)}
                        style={{
                          padding: '6px 12px',
                          background: '#8e44ad',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontFamily: 'inherit'
                        }}
                      >
                        {language === 'en' ? 'View' : 'Se'}
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                      {language === 'en' ? 'Popular Clubs' : 'Populaere klubber'}
                    </div>
                    {publicClubs.map(club => (
                      <div
                        key={club.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          background: 'var(--bg-primary)',
                          borderRadius: '8px',
                          marginBottom: '8px'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>{club.logo_emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{club.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>
                            {club.member_count} {language === 'en' ? 'members' : 'medlemmer'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewClub(club)}
                          style={{
                            padding: '6px 12px',
                            background: '#8e44ad',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          {language === 'en' ? 'View' : 'Se'}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* Create Tab */}
            {activeTab === 'create' && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#888' }}>
                    {language === 'en' ? 'Club Name' : 'Klubbnavn'}
                  </label>
                  <input
                    type="text"
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    placeholder={language === 'en' ? 'Enter club name...' : 'Skriv klubbnavn...'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      background: 'var(--bg-primary)',
                      color: 'white',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#888' }}>
                    {language === 'en' ? 'Description (optional)' : 'Beskrivelse (valgfritt)'}
                  </label>
                  <textarea
                    value={newClubDescription}
                    onChange={(e) => setNewClubDescription(e.target.value)}
                    placeholder={language === 'en' ? 'Describe your club...' : 'Beskriv klubben din...'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      background: 'var(--bg-primary)',
                      color: 'white',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      minHeight: '60px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: '#888' }}>
                    {language === 'en' ? 'Logo' : 'Logo'}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {emojiOptions.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setNewClubEmoji(emoji)}
                        style={{
                          width: '40px',
                          height: '40px',
                          fontSize: '1.2rem',
                          background: newClubEmoji === emoji ? '#8e44ad' : 'var(--bg-primary)',
                          border: newClubEmoji === emoji ? '2px solid #9b59b6' : '1px solid #444',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={newClubPublic}
                      onChange={(e) => setNewClubPublic(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>
                      {language === 'en' ? 'Public club (anyone can join)' : 'Offentlig klubb (alle kan bli med)'}
                    </span>
                  </label>
                </div>

                {createError && (
                  <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '12px' }}>
                    {createError}
                  </div>
                )}

                <button
                  onClick={handleCreateClub}
                  disabled={newClubName.trim().length < 3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: newClubName.trim().length >= 3 ? '#8e44ad' : '#555',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: newClubName.trim().length >= 3 ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  {language === 'en' ? 'Create Club' : 'Opprett klubb'}
                </button>
              </div>
            )}

            {/* Invitations Tab */}
            {activeTab === 'invites' && (
              <>
                {invitations.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                    {language === 'en' ? 'No pending invitations' : 'Ingen ventende invitasjoner'}
                  </div>
                ) : (
                  invitations.map(inv => (
                    <div
                      key={inv.id}
                      style={{
                        padding: '12px',
                        background: 'var(--bg-primary)',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #8e44ad'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{inv.club_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>
                        {language === 'en' ? 'Invited by' : 'Invitert av'} {inv.inviter_username}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAcceptInvitation(inv.id)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: '#27ae60',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {language === 'en' ? 'Accept' : 'Godta'}
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(inv.id)}
                          style={{
                            flex: 1,
                            padding: '8px',
                            background: 'transparent',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            color: '#888',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {language === 'en' ? 'Decline' : 'Avslå'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
