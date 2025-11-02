import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import FriendRequest from '@/models/FriendRequest';
import User from '@/models/userModel';

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
      .populate('senderId', 'name email image bio skills learning rating connections')
      .populate('receiverId', 'name email image bio skills learning rating connections')
      .sort({ createdAt: -1 })
      .lean();

    // Transform the data to return friend information with consistent avatar field
    const friends = friendships.map(friendship => ({
      _id: friendship._id,
      userId: {
        ...friendship.senderId,
        avatar: friendship.senderId.image
      },
      friendId: {
        ...friendship.receiverId,
        avatar: friendship.receiverId.image
      },
      status: friendship.status,
      createdAt: friendship.createdAt
    }));

    return NextResponse.json({
      success: true,
      friends
    });

  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends', details: error.message },
      { status: 500 }
    );
  }
}