'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface CompletedSwapItem {
  id: string;
  otherUser: { id: string; name: string; email: string; image?: string };
  skillOffered: string;
  skillRequested: string;
  completedAt: string;
  myRating: number | null;
  theirRating: number | null;
}

export default function CompletedSwapPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<CompletedSwapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompleted = useCallback(async () => {
    try {
      const res = await fetch('/api/matches/completed');
      if (!res.ok) throw new Error('Failed to load completed swaps');
      const data = await res.json();
      setItems(data.completedSwaps || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchCompleted();
    } else {
      setLoading(false);
    }
  }, [session, fetchCompleted]);

  if (loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading completed swaps...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-6">
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">{error}</div>
      )}
      <h1 className="text-2xl font-bold text-white mb-6">Completed Swaps</h1>
      {items.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
          <div className="text-gray-400 text-lg">No completed swaps yet.</div>
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
                      className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-green-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-green-500">
                      {i.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg mb-2">{i.otherUser.name}</h3>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-medium">You offered:</span>
                      <span className="text-white">{i.skillOffered}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-medium">You received:</span>
                      <span className="text-white">{i.skillRequested}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    Completed: {new Date(i.completedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-white">Your rating:</span>
                      <span className="text-yellow-400 font-semibold">{i.myRating ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-white">Their rating:</span>
                      <span className="text-yellow-400 font-semibold">{i.theirRating ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




