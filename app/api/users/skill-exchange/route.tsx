import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';
import FriendRequest from '@/models/FriendRequest';
import Match from '@/models/match';

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

    // Find current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all users except current user
    const users = await User.find({
      email: { $ne: session.user.email }
    })
      .select('name email image bio skills learning rating connections lastSeen')
      .lean();

    // Get all friend requests involving the current user
    const friendRequests = await FriendRequest.find({
      $or: [
        { senderId: currentUser._id },
        { receiverId: currentUser._id }
      ]
    }).lean();

    // Get all swap proposals involving the current user
    const swapProposals = await Match.find({
      $or: [
        { user: currentUser._id, status: { $in: ['pending', 'accepted'] } },
        { matchedUser: currentUser._id, status: { $in: ['pending', 'accepted'] } }
      ]
    }).lean();

    // Pre-compute per-user completed swaps and average ratings
    const userIds = users.map(u => u._id);

    const completedMatches = await Match.find({
      status: 'completed',
      $or: [
        { user: { $in: userIds } },
        { matchedUser: { $in: userIds } }
      ]
    })
      .select('user matchedUser userRating matchedUserRating')
      .lean();

    const statsMap: Record<string, { completed: number; ratingSum: number; ratingCount: number }> = {};
    for (const m of completedMatches) {
      const userIdStr = (m.user as any).toString();
      const matchedIdStr = (m.matchedUser as any).toString();

      // Rating for primary user from matchedUserRating
      if (!statsMap[userIdStr]) statsMap[userIdStr] = { completed: 0, ratingSum: 0, ratingCount: 0 };
      statsMap[userIdStr].completed += 1;
      if (m.matchedUserRating && typeof m.matchedUserRating.rating === 'number') {
        statsMap[userIdStr].ratingSum += m.matchedUserRating.rating;
        statsMap[userIdStr].ratingCount += 1;
      }

      // Rating for matched user from userRating
      if (!statsMap[matchedIdStr]) statsMap[matchedIdStr] = { completed: 0, ratingSum: 0, ratingCount: 0 };
      statsMap[matchedIdStr].completed += 1;
      if (m.userRating && typeof m.userRating.rating === 'number') {
        statsMap[matchedIdStr].ratingSum += m.userRating.rating;
        statsMap[matchedIdStr].ratingCount += 1;
      }
    }

    // Map friend status and swap proposal status for each user
    const usersWithFriendStatus = users.map((user: any) => {
      const userId = user._id?.toString() || '';
      // Check if there's a friend request between current user and this user
      const request = friendRequests.find((req: any) => 
        (req.senderId.toString() === currentUser._id.toString() && req.receiverId.toString() === userId) ||
        (req.receiverId.toString() === currentUser._id.toString() && req.senderId.toString() === userId)
      );

      let friendStatus = 'none';
      
      if (request) {
        if (request.status === 'accepted') {
          friendStatus = 'accepted';
        } else if (request.status === 'pending') {
          // Check if current user sent or received the request
          if (request.senderId.toString() === currentUser._id.toString()) {
            friendStatus = 'sent';
          } else {
            friendStatus = 'pending';
          }
        }
      }

      // Check if there's a swap proposal between current user and this user
      const hasSwapProposal = swapProposals.some((proposal: any) => 
        (proposal.user.toString() === currentUser._id.toString() && proposal.matchedUser.toString() === userId) ||
        (proposal.matchedUser.toString() === currentUser._id.toString() && proposal.user.toString() === userId)
      );

      const uId = userId;
      const stat = statsMap[uId] || { completed: 0, ratingSum: 0, ratingCount: 0 };
      const averageRating = stat.ratingCount > 0 ? stat.ratingSum / stat.ratingCount : (user.rating || 0);

      const ONLINE_WINDOW_MS = 60 * 1000; // 1 minute window
      const lastSeen = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
      const online = lastSeen > 0 && Date.now() - lastSeen <= ONLINE_WINDOW_MS;

      return {
        ...user,
        id: uId,
        avatar: user.image || user.name?.charAt(0) || '?',
        friendStatus,
        hasSwapProposal,
        online,
        completedProjects: stat.completed,
        rating: averageRating
      };
    });

    return NextResponse.json(usersWithFriendStatus);

  } catch (error) {
    console.error('Error fetching users for skill exchange:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}