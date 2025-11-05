'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Star, X, CheckCircle } from 'lucide-react';

interface ActiveSwapItem {
  id: string;
  otherUser: { id: string; name: string; email: string; image?: string };
  skillOffered: string;
  skillRequested: string;
  status: 'pending' | 'accepted';
  progress: number;
  updatedAt: string;
  hasUserRated?: boolean;
  hasOtherUserRated?: boolean;
  bothRated?: boolean;
}

export default function ActiveSwapPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ActiveSwapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Rating modal state
  const [ratingModal, setRatingModal] = useState<{ swapId: string; userName: string } | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch('/api/matches/active');
      if (!res.ok) throw new Error('Failed to load active swaps');
      const data = await res.json();
      setItems(data.activeSwaps || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchActive();
    } else {
      setLoading(false);
    }
  }, [session, fetchActive]);

  useEffect(() => {
    if (!session?.user) return;
    const id = setInterval(() => {
      fetchActive();
    }, 10000);
    return () => clearInterval(id);
  }, [session, fetchActive]);

  const handleMarkDone = async (swapId: string, userName: string) => {
    setRatingModal({ swapId, userName });
    setRating(0);
    setFeedback('');
  };

  const handleSubmitRating = async () => {
    if (!ratingModal || rating === 0) return;
    
    setActionLoading(ratingModal.swapId);
    try {
      const res = await fetch('/api/matches/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swapId: ratingModal.swapId,
          rating,
          feedback
        })
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete swap');
      }

      setRatingModal(null);
      setRating(0);
      setFeedback('');
      await fetchActive(); // Refresh the list
      
      // Show appropriate message based on whether both users have rated
      if (data.bothRated) {
        alert('Swap completed successfully! Both users have rated.');
      } else {
        alert('Rating submitted successfully! Waiting for the other user to rate.');
      }
    } catch (e: any) {
      console.error('Error completing swap:', e);
      alert(e.message || 'Failed to complete swap. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (swapId: string) => {
    if (!confirm('Are you sure you want to cancel this swap?')) return;
    
    setActionLoading(swapId);
    try {
      const res = await fetch('/api/matches/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swapId })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel swap');
      }

      await fetchActive(); // Refresh the list
      alert('Swap cancelled successfully');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading active swaps...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">{error}</div>
      )}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Active Swaps</h1>
      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
          <div className="text-gray-400 text-lg">No active or pending swaps.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(i => (
            <div key={i.id} className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg hover:shadow-2xl transition-all p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative flex-shrink-0">
                  {i.otherUser.image ? (
                    <img
                      src={i.otherUser.image}
                      alt={i.otherUser.name}
                      className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-blue-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-blue-500">
                      {i.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-bold text-lg">{i.otherUser.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${i.status === 'accepted' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                      {i.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-medium">You offer:</span>
                      <span className="text-white">{i.skillOffered}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-medium">You need:</span>
                      <span className="text-white">{i.skillRequested}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, i.progress))}%` }} />
              </div>

              {i.status === 'accepted' && (
                <div className="space-y-2">
                  {/* Show rating status */}
                  {i.hasUserRated && (
                    <div className="text-sm text-green-400 bg-green-900/20 px-3 py-2 rounded-lg">
                      ✓ You have rated this swap
                    </div>
                  )}
                  {i.hasOtherUserRated && !i.hasUserRated && (
                    <div className="text-sm text-blue-400 bg-blue-900/20 px-3 py-2 rounded-lg">
                      ⏳ {i.otherUser.name} has rated. Please rate to complete.
                    </div>
                  )}
                  {i.bothRated && (
                    <div className="text-sm text-yellow-400 bg-yellow-900/20 px-3 py-2 rounded-lg">
                      ⚠️ Both users have rated. This swap will be moved to completed soon.
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkDone(i.id, i.otherUser.name)}
                      disabled={actionLoading === i.id || i.hasUserRated}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {actionLoading === i.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {i.hasUserRated ? 'Already Rated' : 'Mark as Done'}
                    </button>
                    
                    <button
                      onClick={() => handleCancel(i.id)}
                      disabled={actionLoading === i.id}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {i.status === 'pending' && (
                <button
                  onClick={() => handleCancel(i.id)}
                  disabled={actionLoading === i.id}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {actionLoading === i.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Cancel Request
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Rate Your Experience</h2>
            <p className="text-gray-400 mb-6">How was your swap with {ratingModal.userName}?</p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your feedback (optional)"
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg p-3 mb-4 resize-none"
              rows={3}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={rating === 0 || actionLoading === ratingModal.swapId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === ratingModal.swapId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

