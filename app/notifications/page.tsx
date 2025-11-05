'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Ban, Loader2, Users, X, UserPlus, Clock, RefreshCw, Handshake, AlertCircle, CheckCircle, XCircle, ArrowRightLeft, MessageSquare } from 'lucide-react';

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
  type: 'swap_proposal' | 'swap_accepted' | 'swap_rejected' | 'message' | 'friend_request';
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
    messageId?: string;
    messageContent?: string;
    requestId?: string;
  };
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [swapNotifications, setSwapNotifications] = useState<SwapNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'swaps'>('swaps');

  const fetchAllNotifications = useCallback(async (isManualRefresh = false, isBackgroundPoll = false) => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      // Only show loading state on initial load or manual refresh
      if (isManualRefresh) {
        setRefreshing(true);
      } else if (!isBackgroundPoll) {
        setLoading(true);
      }

      // Fetch notifications (includes messages, swaps, etc.)
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setSwapNotifications(notifData.notifications || []);
      }
      
      setError(null);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      // Only show error on initial load or manual refresh, not during background polling
      if (!isBackgroundPoll) {
        setError(error.message);
      }
    } finally {
      if (!isBackgroundPoll) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    // Initial load
    fetchAllNotifications(false, false);

    // Background polling for real-time updates (no loading state, no page reload)
    // Only poll when page is visible to avoid unnecessary requests
    let interval: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        fetchAllNotifications(false, true);
      }, 5000); // Poll every 5 seconds for faster updates
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop polling
        stopPolling();
      } else {
        // Page is visible, fetch immediately and start polling
        fetchAllNotifications(false, true);
        startPolling();
      }
    };

    // Start polling if page is visible
    if (!document.hidden) {
      startPolling();
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, fetchAllNotifications]);

  const handleRefresh = () => {
    fetchAllNotifications(true, false);
  };

  const handleFriendRequest = async (notificationId: string, requestId: string, senderId: string, action: 'accept' | 'reject') => {
    setProcessingRequest(notificationId);

    try {
      // Send requestId if available, otherwise send senderId as fallback
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: requestId || undefined,
          senderId: senderId || undefined,
          notificationId: notificationId,
          action 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} friend request`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Mark notification as read
        await fetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId })
        });

        // Remove the notification from the list
        setSwapNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        alert(action === 'accept' ? '✅ Friend request accepted!' : '❌ Friend request rejected');
        
        // Dispatch custom event to update notification badge in header
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      }
    } catch (error: any) {
      console.error(`Error ${action}ing friend request:`, error);
      console.error('Request ID:', requestId);
      console.error('Notification ID:', notificationId);
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
        alert(action === 'accept' ? '🎉 Swap proposal accepted!' : '❌ Swap proposal declined');
        fetchAllNotifications(true, false);
        
        // Dispatch custom event to update notification badge in header
        window.dispatchEvent(new CustomEvent('notifications-updated'));
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

      // Dispatch custom event to update notification badge in header
      window.dispatchEvent(new CustomEvent('notifications-updated'));
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

      // Dispatch custom event to update notification badge in header
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsDone = async (notificationId: string) => {
    try {
      // First mark as read, then delete
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      // Delete the notification
      const response = await fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss notification');
      }

      // Remove from local state
      setSwapNotifications(prev => prev.filter(notif => notif._id !== notificationId));

      // Dispatch custom event to update notification badge in header
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (error) {
      console.error('Error marking as done:', error);
      alert('Failed to dismiss notification. Please try again.');
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

  const messageNotifications = swapNotifications.filter(notif => notif.type === 'message');
  const friendRequestNotifications = swapNotifications.filter(notif => notif.type === 'friend_request' && !notif.read);
  const pendingSwapProposals = swapNotifications.filter(notif => notif.type === 'swap_proposal' && !notif.read);
  const otherSwapNotifications = swapNotifications.filter(notif => notif.type !== 'swap_proposal' && notif.type !== 'message' && notif.type !== 'friend_request');

  const filteredNotifications = () => {
    // Show messages, friend requests, and swaps in the swap tab
    return [...messageNotifications, ...friendRequestNotifications, ...pendingSwapProposals, ...otherSwapNotifications];
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
      <div className="min-h-screen  flex items-center justify-center">
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
    <div className="min-h-screen ">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="w-10 h-10 text-blue-500" />
              </div>
              <h1 className="text-4xl font-bold text-blue-500">Notifications</h1>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors border border-gray-600"
              >
                Mark All Read
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-400">
            Messages and swap notifications
          </p>
        </div>

        {/* Notifications List */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
          {filteredNotifications().length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No notifications</h3>
              <p className="text-gray-500 mb-6">All caught up! No new messages or notifications.</p>
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
              {/* Friend Request Notifications */}
              {friendRequestNotifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-6 transition-colors ${
                    !notif.read ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      {notif.senderId.image ? (
                        <img
                          src={notif.senderId.image}
                          alt={notif.senderId.name}
                          className="w-16 h-16 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {notif.senderId.avatar || notif.senderId.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                        <UserPlus className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-white text-lg">
                          {notif.senderId.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {getTimeAgo(notif.createdAt)}
                          </span>
                          <button
                            onClick={() => markAsDone(notif._id)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Mark as Done"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-4">{notif.message}</p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Try multiple ways to get the requestId
                            let reqId = '';
                            if (notif.data) {
                              if (typeof notif.data.requestId === 'string') {
                                reqId = notif.data.requestId;
                              } else if (notif.data.requestId) {
                                reqId = String(notif.data.requestId);
                              }
                            }
                            
                            // Get senderId as fallback
                            const senderIdStr = notif.senderId?._id?.toString() || notif.senderId?._id || '';
                            
                            handleFriendRequest(notif._id, reqId, senderIdStr, 'accept');
                          }}
                          disabled={processingRequest === notif._id || notif.read}
                          className="flex-1 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                          {processingRequest === notif._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            // Try multiple ways to get the requestId
                            let reqId = '';
                            if (notif.data) {
                              if (typeof notif.data.requestId === 'string') {
                                reqId = notif.data.requestId;
                              } else if (notif.data.requestId) {
                                reqId = String(notif.data.requestId);
                              }
                            }
                            
                            // Get senderId as fallback
                            const senderIdStr = notif.senderId?._id?.toString() || notif.senderId?._id || '';
                            
                            handleFriendRequest(notif._id, reqId, senderIdStr, 'reject');
                          }}
                          disabled={processingRequest === notif._id || notif.read}
                          className="flex-1 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                          {processingRequest === notif._id ? (
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
                </div>
              ))}

              {/* Message Notifications */}
              {messageNotifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-6 transition-colors ${
                    !notif.read ? 'bg-blue-900/20 hover:bg-blue-900/30' : 'hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      onClick={() => {
                        if (!notif.read) markAsRead(notif._id);
                        // Navigate to chat with the sender
                        if (notif.senderId._id) {
                          router.push(`/chat?userId=${notif.senderId._id}`);
                        }
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          {notif.senderId.image ? (
                            <img
                              src={notif.senderId.image}
                              alt={notif.senderId.name}
                              className="w-16 h-16 rounded-full object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                              {notif.senderId.avatar || notif.senderId.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                            <MessageSquare className="w-3 h-3 text-white" />
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
                          <p className="text-sm text-gray-300 mb-2">{notif.message}</p>
                          {notif.data?.messageContent && (
                            <div className="bg-gray-700/50 rounded-lg p-3 mt-2">
                              <p className="text-sm text-white">{notif.data.messageContent}</p>
                            </div>
                          )}
                          {!notif.read && (
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsDone(notif._id);
                      }}
                      className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      title="Mark as Done"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Swap Proposal Notifications */}
              {pendingSwapProposals.map((notif) => (
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {getTimeAgo(notif.createdAt)}
                            </span>
                            <button
                              onClick={() => markAsDone(notif._id)}
                              className="text-gray-400 hover:text-white transition-colors"
                              title="Mark as Done"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </div>
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

              {/* Other Swap Notifications (Accepted/Rejected) */}
              {otherSwapNotifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-6 transition-colors ${
                    !notif.read ? 'bg-gray-750 hover:bg-gray-700' : 'hover:bg-gray-750'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      onClick={() => !notif.read && markAsRead(notif._id)}
                      className="flex-1 cursor-pointer"
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsDone(notif._id);
                      }}
                      className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      title="Mark as Done"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
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