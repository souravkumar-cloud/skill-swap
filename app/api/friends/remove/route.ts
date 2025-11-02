import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import FriendRequest from '@/models/FriendRequest';
import User from '@/models/userModel';

export async function DELETE(req) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { friendId } = await req.json();

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
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

    // Delete the friendship (check both directions)
    const result = await FriendRequest.findOneAndDelete({
      $or: [
        { senderId: currentUser._id, receiverId: friendId, status: 'accepted' },
        { senderId: friendId, receiverId: currentUser._id, status: 'accepted' }
      ]
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Friendship not found or already removed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend', details: error.message },
      { status: 500 }
    );
  }
}