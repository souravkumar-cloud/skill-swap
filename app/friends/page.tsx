'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Search, X, Trash2, MessageCircle, Star, Code2, GraduationCap, Loader2, UserMinus, Mail, Calendar, TrendingUp } from 'lucide-react';

interface Friend {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    skills?: string[];
    learning?: string[];
    rating?: number;
    connections?: number;
  };
  friendId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    skills?: string[];
    learning?: string[];
    rating?: number;
    connections?: number;
  };
  status: string;
  createdAt: string;
}

export default function FriendsPage() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [removingFriend, setRemovingFriend] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/friends/list');
        
        if (!response.ok) {
          throw new Error('Failed to fetch friends');
        }
        
        const data = await response.json();
        setFriends(data.friends || []);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching friends:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [session]);

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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  };

  const filteredFriends = friends.filter(friendship => {
    const friend = getFriendData(friendship);
    const matchesSearch = searchTerm === '' || 
      friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      friend.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      friend.learning?.some(l => l.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const findCommonSkills = (friend: any) => {
    if (!session?.user) return { canTeach: [], canLearn: [] };
    
    // Skills you can teach them (your skills that they want to learn)
    const canTeach = friend.learning?.filter((skill: string) => 
      // Assuming current user's skills are available - you may need to fetch this
      true // Replace with actual logic
    ) || [];
    
    // Skills they can teach you (their skills that you want to learn)
    const canLearn = friend.skills || [];
    
    return { canTeach, canLearn };
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600">You need to be logged in to view your friends</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading friends...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Friends</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">My Friends</h1>
          </div>
          <p className="text-lg text-gray-600">
            {friends.length === 0 
              ? 'You have no friends yet. Start connecting with developers!'
              : `You have ${friends.length} ${friends.length === 1 ? 'friend' : 'friends'} in your network`
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Friends</p>
                <p className="text-2xl font-bold text-blue-600">{friends.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-purple-600">{filteredFriends.length}</p>
              </div>
              <Search className="w-8 h-8 text-purple-500 opacity-80" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Skill Exchange</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {friends.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search friends by name, email, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {filteredFriends.length} {filteredFriends.length === 1 ? 'friend' : 'friends'} found
            </p>
          </div>
        )}

        {/* Friends Grid */}
        {filteredFriends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFriends.map((friendship) => {
              const friend = getFriendData(friendship);
              const { canTeach, canLearn } = findCommonSkills(friend);
              
              return (
                <div key={friendship._id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                  {/* Friend Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {friend.avatar && friend.avatar.startsWith('http') ? (
                        <img 
                          src={friend.avatar} 
                          alt={friend.name}
                          className="w-16 h-16 rounded-full object-cover shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{friend.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{friend.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Friend Stats */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-700">{friend.rating || '0.0'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{friend.connections || 0} connections</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                      <Calendar className="w-3 h-3" />
                      <span>{getTimeAgo(friendship.createdAt)}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  {friend.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{friend.bio}</p>
                  )}

                  {/* Skills they can teach */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Can teach you:</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {friend.skills && friend.skills.length > 0 ? (
                        <>
                          {friend.skills.slice(0, 4).map((skill: string) => (
                            <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-200">
                              {skill}
                            </span>
                          ))}
                          {friend.skills.length > 4 && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                              +{friend.skills.length - 4} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No skills listed</span>
                      )}
                    </div>
                  </div>

                  {/* Skills they want to learn */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-orange-600" />
                      <span className="text-orange-600">Wants to learn:</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {friend.learning && friend.learning.length > 0 ? (
                        <>
                          {friend.learning.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium border border-green-200">
                              {skill}
                            </span>
                          ))}
                          {friend.learning.length > 3 && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                              +{friend.learning.length - 3} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No learning goals</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <a
                      href={`/chat?friendId=${friend._id}`}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </a>
                    <button
                      onClick={() => confirmRemoveFriend(friendship)}
                      disabled={removingFriend === friend._id}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      title="Remove friend"
                    >
                      {removingFriend === friend._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : friends.length > 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No friends found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No friends yet</h3>
            <p className="text-gray-500 mb-6">Start connecting with developers to build your network!</p>
            <a
              href="/skill-exchange"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
            >
              <Users className="w-5 h-5" />
              Browse Developers
            </a>
          </div>
        )}
      </div>

      {/* Remove Friend Confirmation Modal */}
      {showRemoveModal && friendToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Remove Friend?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to remove <span className="font-semibold text-gray-900">{getFriendData(friendToRemove).name}</span> from your friends list?
              </p>
              <p className="text-xs text-gray-500">
                You will no longer be connected and will need to send a new friend request to reconnect.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setFriendToRemove(null);
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={removeFriend}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}