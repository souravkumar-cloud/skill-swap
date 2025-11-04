'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, Ban, Loader2, Users, X, UserPlus, Clock, RefreshCw, Handshake, AlertCircle, CheckCircle, XCircle, ArrowRightLeft } from 'lucide-react';

interface FriendRequest {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  };
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface SwapNotification {
  _id: string;
  type: 'swap_proposal' | 'swap_accepted' | 'swap_rejected';
  senderId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    avatar: string;
  };
  message: string;
  data: {
    matchId?: string;
    skillOffered?: string;
    skillRequested?: string;
    proposalMessage?: string;
  };
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [swapNotifications, setSwapNotifications] = useState<SwapNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'swaps' | 'friends'>('all');

  const fetchAllNotifications = async (isManualRefresh = false) => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Fetch friend requests
      const friendsRes = await fetch('/api/friends/requests');
      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriendRequests(friendsData.requests || []);
      }

      // Fetch swap notifications
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setSwapNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);
      }
      
      setError(null);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllNotifications();

    // Poll for new notifications every 10 seconds
    const interval = setInterval(() => {
      fetchAllNotifications(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [session]);

  const handleRefresh = () => {
    fetchAllNotifications(true);
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessingRequest(requestId);

    try {
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} friend request`);
      }

      const data = await response.json();
      
      if (data.success) {
        setFriendRequests(prev => prev.filter(req => req._id !== requestId));
        alert(action === 'accept' ? '✅ Friend request accepted!' : '❌ Friend request rejected');
      }
    } catch (error: any) {
      console.error(`Error ${action}ing friend request:`, error);
      alert(`Failed to ${action} friend request: ` + error.message);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleSwapResponse = async (notificationId: string, action: 'accept' | 'reject') => {
    setProcessingRequest(notificationId);

    try {
      const response = await fetch('/api/notifications/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, action })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} swap proposal`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSwapNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        alert(action === 'accept' ? '🎉 Swap proposal accepted!' : '❌ Swap proposal declined');
        fetchAllNotifications(true);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing swap proposal:`, error);
      alert(`Failed to ${action} swap proposal: ` + error.message);
    } finally {
      setProcessingRequest(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      setSwapNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      setSwapNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const pendingFriendRequests = friendRequests.filter(req => req.status === 'pending');
  const pendingSwapProposals = swapNotifications.filter(notif => notif.type === 'swap_proposal' && !notif.read);
  const otherSwapNotifications = swapNotifications.filter(notif => notif.type !== 'swap_proposal');
  
  const totalPending = pendingFriendRequests.length + pendingSwapProposals.length;

  const filteredNotifications = () => {
    if (activeTab === 'swaps') {
      return [...pendingSwapProposals, ...otherSwapNotifications];
    }
    if (activeTab === 'friends') {
      return pendingFriendRequests;
    }
    return [...pendingSwapProposals, ...pendingFriendRequests, ...otherSwapNotifications];
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 rounded-xl shadow-lg p-8 max-w-md border border-gray-700">
          <Bell className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Please sign in</h2>
          <p className="text-gray-400">You need to be logged in to view notifications</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading notifications...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 rounded-xl shadow-lg p-8 max-w-md border border-gray-700">
          <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Notifications</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-10 h-10 text-blue-500" />
                {totalPending > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {totalPending}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold text-white">Notifications</h1>
            </div>
            
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors border border-gray-600"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-400">
            {totalPending > 0
              ? `You have ${totalPending} pending notification${totalPending === 1 ? '' : 's'}`
              : 'All caught up! No new notifications'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            All ({totalPending + otherSwapNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('swaps')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'swaps'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Swaps ({pendingSwapProposals.length + otherSwapNotifications.length})
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            Friends ({pendingFriendRequests.length})
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 shadow-md border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Swaps</p>
                <p className="text-2xl font-bold text-orange-500">{pendingSwapProposals.length}</p>
              </div>
              <Handshake className="w-8 h-8 text-orange-500 opacity-80" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 shadow-md border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Friend Requests</p>
                <p className="text-2xl font-bold text-blue-500">{pendingFriendRequests.length}</p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 shadow-md border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-green-500">{unreadCount}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
          {filteredNotifications().length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No notifications</h3>
              <p className="text-gray-500 mb-6">
                {activeTab === 'swaps' && 'No swap proposals yet'}
                {activeTab === 'friends' && 'No friend requests yet'}
                {activeTab === 'all' && 'All caught up!'}
              </p>
              <a
                href="/work-exchange"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Handshake className="w-5 h-5" />
                Browse Work Exchange
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {/* Swap Proposal Notifications */}
              {(activeTab === 'all' || activeTab === 'swaps') && pendingSwapProposals.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-6 transition-colors ${
                    !notif.read ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative flex-shrink-0">
                        {notif.senderId.image ? (
                          <img
                            src={notif.senderId.image}
                            alt={notif.senderId.name}
                            className="w-16 h-16 rounded-full object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {notif.senderId.avatar || notif.senderId.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                          <Handshake className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-white text-lg">
                            {notif.senderId.name}
                          </h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {getTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{notif.message}</p>

                        {/* Swap Details */}
                        <div className="bg-gray-700/50 rounded-lg p-4 space-y-3 mb-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">You'll receive:</p>
                            <p className="text-green-400 font-semibold flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {notif.data.skillOffered}
                            </p>
                          </div>
                          <div className="flex justify-center">
                            <ArrowRightLeft className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">You'll provide:</p>
                            <p className="text-blue-400 font-semibold flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              {notif.data.skillRequested}
                            </p>
                          </div>
                          {notif.data.proposalMessage && (
                            <div className="pt-3 border-t border-gray-600">
                              <p className="text-xs text-gray-400 mb-1">Message:</p>
                              <p className="text-sm text-gray-300 italic">"{notif.data.proposalMessage}"</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSwapResponse(notif._id, 'accept')}
                            disabled={processingRequest === notif._id}
                            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            {processingRequest === notif._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Accept Swap
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleSwapResponse(notif._id, 'reject')}
                            disabled={processingRequest === notif._id}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            {processingRequest === notif._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Ban className="w-4 h-4" />
                                Decline
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Friend Request Notifications */}
              {(activeTab === 'all' || activeTab === 'friends') && pendingFriendRequests.map((request) => (
                <div
                  key={request._id}
                  className="p-6 hover:bg-gray-750 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative flex-shrink-0">
                        {request.senderId.avatar?.startsWith('http') ? (
                          <img
                            src={request.senderId.avatar}
                            alt={request.senderId.name}
                            className="w-16 h-16 rounded-full object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {request.senderId.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                          <UserPlus className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">
                            {request.senderId.name}
                          </h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {getTimeAgo(request.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{request.senderId.email}</p>
                        <p className="text-sm text-gray-300">
                          Wants to connect with you
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleFriendRequest(request._id, 'accept')}
                        disabled={processingRequest === request._id}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        {processingRequest === request._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleFriendRequest(request._id, 'reject')}
                        disabled={processingRequest === request._id}
                        className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        {processingRequest === request._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Ban className="w-4 h-4" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Other Swap Notifications (Accepted/Rejected) */}
              {(activeTab === 'all' || activeTab === 'swaps') && otherSwapNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && markAsRead(notif._id)}
                  className={`p-6 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-gray-750 hover:bg-gray-700' : 'hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      {notif.senderId.image ? (
                        <img
                          src={notif.senderId.image}
                          alt={notif.senderId.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                          {notif.senderId.avatar || notif.senderId.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-800 flex items-center justify-center ${
                        notif.type === 'swap_accepted' ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {notif.type === 'swap_accepted' ? (
                          <CheckCircle className="w-3 h-3 text-white" />
                        ) : (
                          <XCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-white font-medium">{notif.message}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {getTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      {!notif.read && (
                        <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}