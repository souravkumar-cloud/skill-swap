import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';
import FriendRequest from '@/models/FriendRequest';

export async function GET(req) {
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
    }).select('name email image bio skills learning rating connections online').lean();

    // Get all friend requests involving the current user
    const friendRequests = await FriendRequest.find({
      $or: [
        { senderId: currentUser._id },
        { receiverId: currentUser._id }
      ]
    }).lean();

    // Map friend status for each user
    const usersWithFriendStatus = users.map(user => {
      // Check if there's a friend request between current user and this user
      const request = friendRequests.find(req => 
        (req.senderId.toString() === currentUser._id.toString() && req.receiverId.toString() === user._id.toString()) ||
        (req.receiverId.toString() === currentUser._id.toString() && req.senderId.toString() === user._id.toString())
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

      return {
        ...user,
        id: user._id.toString(),
        avatar: user.image || user.name?.charAt(0) || '?', // Use image field from your User model
        friendStatus
      };
    });

    return NextResponse.json(usersWithFriendStatus);

  } catch (error) {
    console.error('Error fetching users for skill exchange:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}