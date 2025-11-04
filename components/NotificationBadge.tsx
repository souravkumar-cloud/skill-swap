// components/NotificationBadge.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export default function NotificationBadge() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!session?.user) return;

    try {
      // Fetch swap notifications count
      const notifRes = await fetch('/api/notifications');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        const swapCount = notifData.unreadCount || 0;

        // Fetch friend requests count
        const friendsRes = await fetch('/api/friends/requests');
        if (friendsRes.ok) {
          const friendsData = await friendsRes.json();
          const friendCount = friendsData.requests?.filter(
            (req: any) => req.status === 'pending'
          ).length || 0;

          setUnreadCount(swapCount + friendCount);
        } else {
          setUnreadCount(swapCount);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchUnreadCount, 10000);

    return () => clearInterval(interval);
  }, [session]);

  if (!session?.user) return null;

  return (
    <Link href="/notifications" className="relative">
      <button className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-700">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </Link>
  );
}