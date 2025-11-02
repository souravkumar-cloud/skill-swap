import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import FriendRequest from '@/models/FriendRequest';
import User from '@/models/userModel';

export async function POST(req) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { requestId, action } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "reject"' },
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

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    if (friendRequest.receiverId.toString() !== currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized to respond to this request' },
        { status: 403 }
      );
    }

    if (friendRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request already responded to' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      friendRequest.status = 'accepted';
      await friendRequest.save();

      return NextResponse.json({
        success: true,
        message: 'Friend request accepted',
        request: friendRequest
      });

    } else if (action === 'reject') {
      friendRequest.status = 'rejected';
      await friendRequest.save();

      return NextResponse.json({
        success: true,
        message: 'Friend request rejected',
        request: friendRequest
      });
    }

  } catch (error) {
    console.error('Error responding to friend request:', error);
    return NextResponse.json(
      { error: 'Failed to respond to friend request', details: error.message },
      { status: 500 }
    );
  }
}