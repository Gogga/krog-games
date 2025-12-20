import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

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
        <span style={{ fontSize: '1rem' }}>&#128101;</span>
        {language === 'en' ? 'Friends' : 'Venner'}
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

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '320px',
          maxHeight: '450px',
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
              { key: 'friends', label: language === 'en' ? 'Friends' : 'Venner', count: friends.length },
              { key: 'requests', label: language === 'en' ? 'Requests' : 'Foresp.', count: totalRequests },
              { key: 'search', label: language === 'en' ? 'Add' : 'Legg til', count: null }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: activeTab === tab.key ? 'var(--bg-primary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #3498db' : '2px solid transparent',
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
            maxHeight: '350px',
            overflowY: 'auto',
            padding: '12px'
          }}>
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <>
                {friends.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                    {language === 'en' ? 'No friends yet. Search to add friends!' : 'Ingen venner enda. Sok for a legge til venner!'}
                  </div>
                ) : (
                  friends.map(friend => (
                    <div
                      key={friend.id}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: friend.online ? '#2ecc71' : '#666'
                        }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{friend.username}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>
                            {friend.rating} rating
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {onChallengeFriend && friend.online && (
                          <button
                            onClick={() => onChallengeFriend(friend.id, friend.username)}
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
                        <button
                          onClick={() => removeFriend(friend.id)}
                          style={{
                            padding: '6px 10px',
                            background: 'transparent',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'inherit'
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
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                      {language === 'en' ? 'Incoming' : 'Innkommende'}
                    </div>
                    {incomingRequests.map(request => (
                      <div
                        key={request.request_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px',
                          background: 'var(--bg-primary)',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          border: '1px solid #3498db'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{request.username}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>
                            {request.rating} rating
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => acceptRequest(request.request_id)}
                            style={{
                              padding: '6px 12px',
                              background: '#2ecc71',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontFamily: 'inherit'
                            }}
                          >
                            &#10003;
                          </button>
                          <button
                            onClick={() => declineRequest(request.request_id)}
                            style={{
                              padding: '6px 12px',
                              background: '#e74c3c',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontFamily: 'inherit'
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
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '16px', marginBottom: '8px' }}>
                      {language === 'en' ? 'Sent' : 'Sendt'}
                    </div>
                    {outgoingRequests.map(request => (
                      <div
                        key={request.request_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px',
                          background: 'var(--bg-primary)',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          opacity: 0.7
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{request.username}</div>
                          <div style={{ fontSize: '0.8rem', color: '#888' }}>
                            {language === 'en' ? 'Pending...' : 'Venter...'}
                          </div>
                        </div>
                        <button
                          onClick={() => declineRequest(request.request_id)}
                          style={{
                            padding: '6px 12px',
                            background: 'transparent',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          {language === 'en' ? 'Cancel' : 'Avbryt'}
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                    {language === 'en' ? 'No pending requests' : 'Ingen ventende foresporrsler'}
                  </div>
                )}
              </>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                    onClick={handleSearch}
                    disabled={searchQuery.trim().length < 2}
                    style={{
                      padding: '10px 16px',
                      background: searchQuery.trim().length >= 2 ? '#3498db' : '#555',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: searchQuery.trim().length >= 2 ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit'
                    }}
                  >
                    &#128269;
                  </button>
                </div>

                {isSearching && (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
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
                        padding: '10px',
                        background: 'var(--bg-primary)',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.username}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          {user.rating} rating
                        </div>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(user.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#3498db',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontFamily: 'inherit'
                        }}
                      >
                        {language === 'en' ? 'Add Friend' : 'Legg til'}
                      </button>
                    </div>
                  ))
                )}

                {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
                    {language === 'en' ? 'No users found' : 'Ingen brukere funnet'}
                  </div>
                )}

                {searchQuery.length < 2 && (
                  <div style={{ color: '#888', textAlign: 'center', padding: '20px', fontSize: '0.9rem' }}>
                    {language === 'en'
                      ? 'Enter at least 2 characters to search'
                      : 'Skriv minst 2 tegn for a soke'}
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
