'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Loader2 } from 'lucide-react';
import {
  faSearch,
  faFilter,
  faTimes,
  faUsers,
  faBriefcase,
  faStar,
  faCheckCircle,
  faUserMinus,
  faMessage,
  faHandshake,
  faLightbulb,
  faSpinner,
  faUserPlus,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

interface Friend {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    bio?: string;
    skills?: string[];
    learning?: string[];
    rating?: number;
    connections?: number;
    completedProjects?: number;
    lastSeen?: string;
    online?: boolean;
  };
  friendId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    bio?: string;
    skills?: string[];
    learning?: string[];
    rating?: number;
    connections?: number;
    completedProjects?: number;
    lastSeen?: string;
    online?: boolean;
  };
  status: string;
  createdAt: string;
}

export default function FriendsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [filterRating, setFilterRating] = useState('all');
  
  // Swap Proposal
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapTargetFriend, setSwapTargetFriend] = useState<any | null>(null);
  const [currentUserSkills, setCurrentUserSkills] = useState<string[]>([]);
  const [selectedSkillOffered, setSelectedSkillOffered] = useState('');
  const [selectedSkillRequested, setSelectedSkillRequested] = useState('');
  const [proposalMessage, setProposalMessage] = useState('');
  const [proposingSwap, setProposingSwap] = useState(false);

  const fetchFriends = useCallback(async () => {
    setError(null);

    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/friends/list');
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }
      
      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchFriends();
      // Fetch current user's skills for swap proposals
      fetch('/api/users/skills')
        .then(res => res.json())
        .then(data => {
          setCurrentUserSkills(data.skills || []);
        })
        .catch(err => console.error('Error fetching user skills:', err));
    } else {
      setLoading(false);
    }
  }, [session, fetchFriends]);

  const confirmRemoveFriend = (friend: Friend) => {
    setFriendToRemove(friend);
    setShowRemoveModal(true);
  };

  const removeFriend = async () => {
    if (!friendToRemove) return;

    const friend = getFriendData(friendToRemove);
    const friendId = friend._id;
    
    setRemovingFriend(friendId);
    setShowRemoveModal(false);

    try {
      const response = await fetch('/api/friends/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove friend');
      }

      const data = await response.json();
      
      if (data.success) {
        setFriends(prev => prev.filter(f => {
          const fData = getFriendData(f);
          return fData._id !== friendId;
        }));
        alert('Friend removed successfully');
      }
    } catch (error: any) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend: ' + error.message);
    } finally {
      setRemovingFriend(null);
      setFriendToRemove(null);
    }
  };

  const getFriendData = (friendship: Friend) => {
    if (!session?.user?.email) return friendship.friendId;
    
    return friendship.userId.email === session.user.email 
      ? friendship.friendId 
      : friendship.userId;
  };

  const openSwapModal = (friend: any) => {
    setSwapTargetFriend(friend);
    setSelectedSkillOffered('');
    setSelectedSkillRequested('');
    setProposalMessage('');
    setSwapModalOpen(true);
  };

  const handleProposeSwap = async () => {
    if (!swapTargetFriend || !selectedSkillOffered || !selectedSkillRequested) {
      alert('Please select both skills for the swap');
      return;
    }

    setProposingSwap(true);

    try {
      const response = await fetch('/api/matches/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchedUserId: swapTargetFriend._id,
          skillOffered: selectedSkillOffered,
          skillRequested: selectedSkillRequested,
          message: proposalMessage || `Hi! I'd like to swap services with you.`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send swap proposal');
      }

      const data = await response.json();
      
      if (data.message) {
        alert('✅ Swap proposal sent successfully!');
        setSwapModalOpen(false);
        setSwapTargetFriend(null);
        setSelectedSkillOffered('');
        setSelectedSkillRequested('');
        setProposalMessage('');
        // Refresh friends list
        await fetchFriends();
      }
    } catch (error: any) {
      console.error('Error proposing swap:', error);
      alert('❌ ' + error.message);
    } finally {
      setProposingSwap(false);
    }
  };

  const openChat = (friend: any) => {
    router.push(`/chat?friendId=${friend._id}`);
  };

  const filteredFriends = friends
    .filter(friendship => {
      const friend = getFriendData(friendship);
      const matchesSearch = searchTerm === '' || 
        friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        friend.learning?.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRating = filterRating === 'all' || 
        (filterRating === 'high' && (friend.rating || 0) >= 4.5) ||
        (filterRating === 'medium' && (friend.rating || 0) >= 4.0 && (friend.rating || 0) < 4.5);
      
      return matchesSearch && matchesRating;
    });

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 rounded-xl shadow-lg p-8 max-w-md border border-gray-700">
          <FontAwesomeIcon icon={faUsers} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <p className="text-gray-400">You need to be logged in to view your friends</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading friends...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FontAwesomeIcon icon={faUsers} className="w-20 h-20 text-blue-500" />
              <h1 className="text-4xl font-bold text-gray-800">My Network</h1>
            </div>
            <p className="text-lg text-gray-400">
              {friends.length === 0 
                ? 'You have no connections yet. Start networking with developers!'
                : `You have ${friends.length} ${friends.length === 1 ? 'connection' : 'connections'} in your network`
              }
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">{error}</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Connections</p>
                <p className="text-3xl font-bold text-blue-500">{friends.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faUsers} className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-500">
                  {friends.length > 0 
                    ? (friends.reduce((acc, f) => acc + (getFriendData(f).rating || 0), 0) / friends.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faStar} className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-green-500">
                  {friends.reduce((acc, f) => acc + (getFriendData(f).completedProjects || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faCheckCircle} className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        {friends.length > 0 && (
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-700">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faSearch} />
                  Search by Name, Email, or Skills
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g., John Doe, Web Development..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 text-lg bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {filteredFriends.length} {filteredFriends.length === 1 ? 'connection' : 'connections'} found
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
                  <label className="text-sm font-semibold text-gray-300">Filter by Rating:</label>
                </div>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                >
                  <option value="all">🌟 All Ratings</option>
                  <option value="high">⭐ High Rated (4.5+)</option>
                  <option value="medium">⭐ Medium Rated (4.0-4.5)</option>
                </select>
                {(searchTerm || filterRating !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterRating('all');
                    }}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Friends Grid */}
        {filteredFriends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFriends.map((friendship) => {
              const friend = getFriendData(friendship);
              const ONLINE_WINDOW_MS = 60 * 1000;
              const lastSeen = friend.lastSeen ? new Date(friend.lastSeen).getTime() : 0;
              const online = lastSeen > 0 && Date.now() - lastSeen <= ONLINE_WINDOW_MS;
              
              return (
                <div key={friendship._id} className="bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border border-gray-700 hover:border-gray-600">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {friend.image ? (
                          <img 
                            src={friend.image} 
                            alt={friend.name}
                            className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-blue-500"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-2 ring-blue-500">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {online && (
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-3 border-gray-800"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{friend.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                            <span className="font-semibold">{friend.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                            <span>{friend.completedProjects || 0} works</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {friend.bio && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{friend.bio}</p>
                  )}

                  {/* Services Offered */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                      <FontAwesomeIcon icon={faBriefcase} className="text-blue-500" />
                      Services Offered:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {friend.skills && Array.isArray(friend.skills) && friend.skills.length > 0 ? (
                        <>
                          {friend.skills.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="px-2.5 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full font-medium border border-blue-700">
                              {skill}
                            </span>
                          ))}
                          {friend.skills.length > 3 && (
                            <span className="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs rounded-full font-medium">
                              +{friend.skills.length - 3} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">No services listed</span>
                      )}
                    </div>
                  </div>

                  {/* Services Needed */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                      <FontAwesomeIcon icon={faLightbulb} className="text-orange-500" />
                      Looking for:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {friend.learning && Array.isArray(friend.learning) && friend.learning.length > 0 ? (
                        <>
                          {friend.learning.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="px-2.5 py-1 bg-orange-900/50 text-orange-300 text-xs rounded-full font-medium border border-orange-700">
                              {skill}
                            </span>
                          ))}
                          {friend.learning.length > 3 && (
                            <span className="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs rounded-full font-medium">
                              +{friend.learning.length - 3} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Not specified</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openChat(friend)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <FontAwesomeIcon icon={faMessage} />
                        Chat
                      </button>
                      
                      <button
                        onClick={() => confirmRemoveFriend(friendship)}
                        disabled={removingFriend === friend._id}
                        className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove connection"
                      >
                        {removingFriend === friend._id ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faUserMinus} />
                        )}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => openSwapModal(friend)}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <FontAwesomeIcon icon={faHandshake} />
                      Propose Swap
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : friends.length > 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <FontAwesomeIcon icon={faSearch} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No connections found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRating('all');
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <FontAwesomeIcon icon={faUsers} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No connections yet</h3>
            <p className="text-gray-400 mb-6">Start networking with developers to build your community!</p>
            <a
              href="/skill-exchange"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-lg"
            >
              <FontAwesomeIcon icon={faUserPlus} />
              Find Developers
            </a>
          </div>
        )}
      </div>

      {/* Swap Proposal Modal */}
      {swapModalOpen && swapTargetFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">Propose Swap</h2>
                <button
                  onClick={() => {
                    setSwapModalOpen(false);
                    setSwapTargetFriend(null);
                    setSelectedSkillOffered('');
                    setSelectedSkillRequested('');
                    setProposalMessage('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <p className="text-gray-400">Propose a skill swap with {swapTargetFriend.name}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  I will offer:
                </label>
                <select
                  value={selectedSkillOffered}
                  onChange={(e) => setSelectedSkillOffered(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a skill to offer</option>
                  {currentUserSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  I want to learn:
                </label>
                <select
                  value={selectedSkillRequested}
                  onChange={(e) => setSelectedSkillRequested(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a skill to learn</option>
                  {swapTargetFriend.skills?.map((skill: string) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Message (optional):
                </label>
                <textarea
                  value={proposalMessage}
                  onChange={(e) => setProposalMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setSwapModalOpen(false);
                  setSwapTargetFriend(null);
                  setSelectedSkillOffered('');
                  setSelectedSkillRequested('');
                  setProposalMessage('');
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProposeSwap}
                disabled={proposingSwap || !selectedSkillOffered || !selectedSkillRequested}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {proposingSwap ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Sending...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faHandshake} />
                    Send Proposal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Friend Confirmation Modal */}
      {showRemoveModal && friendToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserMinus} className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Remove Connection?</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-300 mb-2">
                  Are you sure you want to remove <span className="font-semibold text-white">{getFriendData(friendToRemove).name}</span> from your network?
                </p>
                <p className="text-xs text-gray-400">
                  You will no longer be connected and will need to send a new request to reconnect.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setFriendToRemove(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={removeFriend}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
