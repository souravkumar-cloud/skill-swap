import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import FriendRequest from '@/models/FriendRequest';
import User from '@/models/userModel';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find all accepted friend requests where current user is either sender or receiver
    const friendships = await FriendRequest.find({
      $or: [
        { senderId: currentUser._id, status: 'accepted' },
        { receiverId: currentUser._id, status: 'accepted' }
      ]
    })
      .populate('senderId', 'name email image bio skills learning rating connections lastSeen')
      .populate('receiverId', 'name email image bio skills learning rating connections lastSeen')
      .sort({ createdAt: -1 })
      .lean();

    // Get completed projects for all friends
    const Match = (await import('@/models/match')).default;
    const friendIds = friendships.flatMap(f => [
      (f.senderId as any)?._id?.toString(),
      (f.receiverId as any)?._id?.toString()
    ]).filter(Boolean);

    const completedMatches = await Match.find({
      status: 'completed',
      $or: [
        { user: { $in: friendIds } },
        { matchedUser: { $in: friendIds } }
      ]
    })
      .select('user matchedUser')
      .lean();

    const completedProjectsMap: Record<string, number> = {};
    completedMatches.forEach(match => {
      const userId = (match.user as any)?.toString();
      const matchedId = (match.matchedUser as any)?.toString();
      if (userId) completedProjectsMap[userId] = (completedProjectsMap[userId] || 0) + 1;
      if (matchedId) completedProjectsMap[matchedId] = (completedProjectsMap[matchedId] || 0) + 1;
    });

    // Transform the data to return friend information with consistent avatar field
    const friends = friendships.map(friendship => {
      const senderId = (friendship.senderId as any)?._id?.toString();
      const receiverId = (friendship.receiverId as any)?._id?.toString();
      
      return {
        _id: friendship._id,
        userId: {
          ...friendship.senderId,
          avatar: friendship.senderId.image,
          completedProjects: completedProjectsMap[senderId] || 0,
          online: senderId ? (() => {
            const lastSeen = (friendship.senderId as any)?.lastSeen;
            if (!lastSeen) return false;
            const lastSeenDate = new Date(lastSeen).getTime();
            const ONLINE_WINDOW_MS = 60 * 1000;
            return Date.now() - lastSeenDate <= ONLINE_WINDOW_MS;
          })() : false
        },
        friendId: {
          ...friendship.receiverId,
          avatar: friendship.receiverId.image,
          completedProjects: completedProjectsMap[receiverId] || 0,
          online: receiverId ? (() => {
            const lastSeen = (friendship.receiverId as any)?.lastSeen;
            if (!lastSeen) return false;
            const lastSeenDate = new Date(lastSeen).getTime();
            const ONLINE_WINDOW_MS = 60 * 1000;
            return Date.now() - lastSeenDate <= ONLINE_WINDOW_MS;
          })() : false
        },
        status: friendship.status,
        createdAt: friendship.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      friends
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}