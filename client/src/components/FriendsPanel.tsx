import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

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

interface Friend {
  id: string;
  username: string;
  rating: number;
  last_login: string | null;
  friends_since: string;
  online: boolean;
}

interface FriendRequest {
  request_id: string;
  id: string;
  username: string;
  rating: number;
  created_at: string;
}

interface SearchResult {
  id: string;
  username: string;
  rating: number;
}

interface FriendsPanelProps {
  socket: Socket;
  language: 'en' | 'no';
  onChallengeFriend?: (friendId: string, friendUsername: string) => void;
}

export function FriendsPanel({ socket, language, onChallengeFriend }: FriendsPanelProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  const fetchFriends = useCallback(() => {
    socket.emit('get_friends');
  }, [socket]);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen, fetchFriends]);

  useEffect(() => {
    function onFriendsList(data: { friends: Friend[]; incomingRequests: FriendRequest[]; outgoingRequests: FriendRequest[] }) {
      setFriends(data.friends);
      setIncomingRequests(data.incomingRequests);
      setOutgoingRequests(data.outgoingRequests);
    }

    function onUserSearchResults(data: { users: SearchResult[] }) {
      setSearchResults(data.users);
      setIsSearching(false);
    }

    function onFriendRequestSent(data: { success: boolean; error?: string }) {
      if (data.success) {
        fetchFriends();
        setSearchQuery('');
        setSearchResults([]);
      }
    }

    function onFriendRequestAccepted(data: { success: boolean; requestId: string }) {
      if (data.success) {
        fetchFriends();
      }
    }

    function onFriendRequestDeclined(data: { success: boolean; requestId: string }) {
      if (data.success) {
        fetchFriends();
      }
    }

    function onFriendRemoved(data: { success: boolean; friendId: string }) {
      if (data.success) {
        fetchFriends();
      }
    }

    function onFriendRequestReceived() {
      fetchFriends();
    }

    socket.on('friends_list', onFriendsList);
    socket.on('user_search_results', onUserSearchResults);
    socket.on('friend_request_sent', onFriendRequestSent);
    socket.on('friend_request_accepted', onFriendRequestAccepted);
    socket.on('friend_request_declined', onFriendRequestDeclined);
    socket.on('friend_removed', onFriendRemoved);
    socket.on('friend_request_received', onFriendRequestReceived);

    return () => {
      socket.off('friends_list', onFriendsList);
      socket.off('user_search_results', onUserSearchResults);
      socket.off('friend_request_sent', onFriendRequestSent);
      socket.off('friend_request_accepted', onFriendRequestAccepted);
      socket.off('friend_request_declined', onFriendRequestDeclined);
      socket.off('friend_removed', onFriendRemoved);
      socket.off('friend_request_received', onFriendRequestReceived);
    };
  }, [socket, fetchFriends]);

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      socket.emit('search_users', { query: searchQuery.trim() });
    }
  };

  const sendFriendRequest = (friendId: string) => {
    socket.emit('send_friend_request', { friendId });
  };

  const acceptRequest = (requestId: string) => {
    socket.emit('accept_friend_request', { requestId });
  };

  const declineRequest = (requestId: string) => {
    socket.emit('decline_friend_request', { requestId });
  };

  const removeFriend = (friendId: string) => {
    if (window.confirm(language === 'en' ? 'Remove this friend?' : 'Fjerne denne vennen?')) {
      socket.emit('remove_friend', { friendId });
    }
  };

  const totalRequests = incomingRequests.length + outgoingRequests.length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? '#2980b9' : 'transparent',
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
        <span style={{ fontSize: isMobile ? '1.1rem' : '1rem' }}>&#128101;</span>
        {isMobile ? '' : (language === 'en' ? 'Friends' : 'Venner')}
        {totalRequests > 0 && (
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
            {totalRequests}
          </span>
        )}
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
          width: isMobile ? '100%' : '320px',
          maxHeight: isMobile ? '70vh' : '450px',
          background: 'var(--bg-secondary)',
          border: isMobile ? 'none' : '1px solid #444',
          borderRadius: isMobile ? '16px 16px 0 0' : '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 100,
          marginTop: isMobile ? 0 : '8px',
          overflow: 'hidden'
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
                {language === 'en' ? 'Friends' : 'Venner'}
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
            borderBottom: '1px solid #444'
          }}>
            {[
              { key: 'friends', label: language === 'en' ? 'Friends' : 'Venner', count: friends.length },
              { key: 'requests', label: language === 'en' ? 'Requests' : 'Foresp.', count: totalRequests },
              { key: 'search', label: language === 'en' ? 'Add' : 'Legg til', count: null }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{
                  flex: 1,
                  padding: isMobile ? '14px 8px' : '12px 8px',
                  background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #3498db' : '2px solid transparent',
                  color: activeTab === tab.key ? 'white' : '#888',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: isMobile ? '0.9rem' : '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  minHeight: isMobile ? '48px' : 'auto'
                }}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span style={{
                    background: tab.key === 'requests' && incomingRequests.length > 0 ? '#e74c3c' : '#555',
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
            maxHeight: isMobile ? 'calc(70vh - 120px)' : '350px',
            overflowY: 'auto',
            padding: isMobile ? '16px' : '12px',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <>
                {friends.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    {language === 'en' ? 'No friends yet. Search to add!' : 'Ingen venner enda. Sok for a legge til!'}
                  </div>
                ) : (
                  friends.map(friend => (
                    <div
                      key={friend.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: isMobile ? '12px' : '10px',
                        background: 'var(--bg-primary)',
                        borderRadius: '6px',
                        marginBottom: isMobile ? '10px' : '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '10px', flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: isMobile ? '10px' : '8px',
                          height: isMobile ? '10px' : '8px',
                          borderRadius: '50%',
                          background: friend.online ? '#2ecc71' : '#666',
                          flexShrink: 0
                        }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: isMobile ? '0.95rem' : '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.username}</div>
                          <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#888' }}>
                            {friend.rating}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {onChallengeFriend && friend.online && (
                          <button
                            onClick={() => onChallengeFriend(friend.id, friend.username)}
                            style={{
                              padding: isMobile ? '10px 14px' : '6px 10px',
                              background: '#81b64c',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: isMobile ? '0.8rem' : '0.75rem',
                              fontFamily: 'inherit',
                              minHeight: isMobile ? '44px' : 'auto'
                            }}
                          >
                            {isMobile ? '⚔️' : (language === 'en' ? 'Challenge' : 'Utfordre')}
                          </button>
                        )}
                        <button
                          onClick={() => removeFriend(friend.id)}
                          style={{
                            padding: isMobile ? '10px 14px' : '6px 10px',
                            background: 'transparent',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: isMobile ? '0.8rem' : '0.75rem',
                            fontFamily: 'inherit',
                            minHeight: isMobile ? '44px' : 'auto'
                          }}
                          title={language === 'en' ? 'Remove friend' : 'Fjern venn'}
                        >
                          &#10005;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <>
                {incomingRequests.length > 0 && (
                  <>
                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#888', marginBottom: '8px' }}>
                      {language === 'en' ? 'Incoming' : 'Innkommende'}
                    </div>
                    {incomingRequests.map(request => (
                      <div
                        key={request.request_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: isMobile ? '12px' : '10px',
                          background: 'var(--bg-primary)',
                          borderRadius: '6px',
                          marginBottom: isMobile ? '10px' : '8px',
                          border: '1px solid #3498db'
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: isMobile ? '0.95rem' : '1rem' }}>{request.username}</div>
                          <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#888' }}>
                            {request.rating}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={() => acceptRequest(request.request_id)}
                            style={{
                              padding: isMobile ? '10px 16px' : '6px 12px',
                              background: '#2ecc71',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: isMobile ? '0.9rem' : '0.8rem',
                              fontFamily: 'inherit',
                              minHeight: isMobile ? '44px' : 'auto'
                            }}
                          >
                            &#10003;
                          </button>
                          <button
                            onClick={() => declineRequest(request.request_id)}
                            style={{
                              padding: isMobile ? '10px 16px' : '6px 12px',
                              background: '#e74c3c',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: isMobile ? '0.9rem' : '0.8rem',
                              fontFamily: 'inherit',
                              minHeight: isMobile ? '44px' : 'auto'
                            }}
                          >
                            &#10005;
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {outgoingRequests.length > 0 && (
                  <>
                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#888', marginTop: isMobile ? '12px' : '16px', marginBottom: '8px' }}>
                      {language === 'en' ? 'Sent' : 'Sendt'}
                    </div>
                    {outgoingRequests.map(request => (
                      <div
                        key={request.request_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: isMobile ? '12px' : '10px',
                          background: 'var(--bg-primary)',
                          borderRadius: '6px',
                          marginBottom: isMobile ? '10px' : '8px',
                          opacity: 0.7
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: isMobile ? '0.95rem' : '1rem' }}>{request.username}</div>
                          <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#888' }}>
                            {language === 'en' ? 'Pending...' : 'Venter...'}
                          </div>
                        </div>
                        <button
                          onClick={() => declineRequest(request.request_id)}
                          style={{
                            padding: isMobile ? '10px 14px' : '6px 12px',
                            background: 'transparent',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: isMobile ? '0.8rem' : '0.75rem',
                            fontFamily: 'inherit',
                            minHeight: isMobile ? '44px' : 'auto'
                          }}
                        >
                          {language === 'en' ? 'Cancel' : 'Avbryt'}
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    {language === 'en' ? 'No pending requests' : 'Ingen ventende foresporrsler'}
                  </div>
                )}
              </>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: isMobile ? '16px' : '12px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={language === 'en' ? 'Search username...' : 'Sok brukernavn...'}
                    style={{
                      flex: 1,
                      padding: isMobile ? '12px 14px' : '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      background: 'var(--bg-primary)',
                      color: 'white',
                      fontFamily: 'inherit',
                      fontSize: isMobile ? '1rem' : '0.9rem',
                      minHeight: isMobile ? '44px' : 'auto'
                    }}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchQuery.trim().length < 2}
                    style={{
                      padding: isMobile ? '12px 18px' : '10px 16px',
                      background: searchQuery.trim().length >= 2 ? '#3498db' : '#555',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: searchQuery.trim().length >= 2 ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                      minHeight: isMobile ? '44px' : 'auto',
                      fontSize: isMobile ? '1.1rem' : '1rem'
                    }}
                  >
                    &#128269;
                  </button>
                </div>

                {isSearching && (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    {language === 'en' ? 'Searching...' : 'Soker...'}
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  searchResults.map(user => (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: isMobile ? '12px' : '10px',
                        background: 'var(--bg-primary)',
                        borderRadius: '6px',
                        marginBottom: isMobile ? '10px' : '8px'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: isMobile ? '0.95rem' : '1rem' }}>{user.username}</div>
                        <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#888' }}>
                          {user.rating}
                        </div>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(user.id)}
                        style={{
                          padding: isMobile ? '10px 16px' : '6px 12px',
                          background: '#3498db',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: isMobile ? '0.85rem' : '0.8rem',
                          fontFamily: 'inherit',
                          minHeight: isMobile ? '44px' : 'auto'
                        }}
                      >
                        {language === 'en' ? 'Add' : 'Legg til'}
                      </button>
                    </div>
                  ))
                )}

                {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    {language === 'en' ? 'No users found' : 'Ingen brukere funnet'}
                  </div>
                )}

                {searchQuery.length < 2 && (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: isMobile ? '0.85rem' : '0.9rem' }}>
                    {language === 'en'
                      ? 'Enter at least 2 characters'
                      : 'Skriv minst 2 tegn'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
