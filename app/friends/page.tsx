'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Search, X, Trash2, MessageCircle, Star, Code2, GraduationCap, Loader2, UserMinus, Mail, Calendar, TrendingUp, Filter, UserPlus } from 'lucide-react';

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
  const [filterRating, setFilterRating] = useState('all');

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
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <p className="text-gray-400">You need to be logged in to view your friends</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading friends...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center bg-gray-800 rounded-xl shadow-lg p-8 max-w-md border border-gray-700">
          <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Friends</h2>
          <p className="text-gray-400 mb-4">{error}</p>
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-10 h-10 text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800">My Network</h1>
          </div>
          <p className="text-lg text-gray-400">
            {friends.length === 0 
              ? 'You have no connections yet. Start networking with developers!'
              : `You have ${friends.length} ${friends.length === 1 ? 'connection' : 'connections'} in your network`
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700 hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Connections</p>
                <p className="text-3xl font-bold text-blue-500">{friends.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        {friends.length > 0 && (
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white placeholder-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="bg-gray-700 text-white px-4 py-3 rounded-lg border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Ratings</option>
                <option value="high">High Rated (4.5+)</option>
                <option value="medium">Medium Rated (4.0-4.5)</option>
              </select>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              {filteredFriends.length} {filteredFriends.length === 1 ? 'connection' : 'connections'} found
            </p>
          </div>
        )}

        {/* Friends Grid */}
        {filteredFriends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFriends.map((friendship) => {
              const friend = getFriendData(friendship);
              
              return (
                <div key={friendship._id} className="bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-700 hover:border-gray-600">
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
                        <h3 className="font-bold text-white text-lg">{friend.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{friend.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Friend Stats */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-white">{friend.rating || '0.0'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
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
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{friend.bio}</p>
                  )}

                  {/* Skills they can teach */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                      <Code2 className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Can teach you:</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {friend.skills && friend.skills.length > 0 ? (
                        <>
                          {friend.skills.slice(0, 4).map((skill: string) => (
                            <span key={skill} className="px-2.5 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full font-medium border border-blue-700">
                              {skill}
                            </span>
                          ))}
                          {friend.skills.length > 4 && (
                            <span className="px-2.5 py-1 bg-gray-700 text-gray-300 text-xs rounded-full font-medium">
                              +{friend.skills.length - 4} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">No skills listed</span>
                      )}
                    </div>
                  </div>

                  {/* Skills they want to learn */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-400">Wants to learn:</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {friend.learning && friend.learning.length > 0 ? (
                        <>
                          {friend.learning.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="px-2.5 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full font-medium border border-purple-700">
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
                        <span className="text-xs text-gray-500">No learning goals</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                    <a
                      href={`/chat?friendId=${friend._id}`}
                      className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </a>
                    <button
                      onClick={() => confirmRemoveFriend(friendship)}
                      disabled={removingFriend === friend._id}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      title="Remove connection"
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
          <div className="text-center py-16 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No connections found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRating('all');
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No connections yet</h3>
            <p className="text-gray-400 mb-6">Start networking with developers to build your community!</p>
            <a
              href="/skill-exchange"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              Find Developers
            </a>
          </div>
        )}
      </div>

      {/* Remove Friend Confirmation Modal */}
      {showRemoveModal && friendToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Remove Connection?</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
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