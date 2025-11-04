import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import FriendRequest from '@/models/FriendRequest';
import User from '@/models/userModel';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { requestId, notificationId, senderId, action } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
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

    // If requestId is not provided, try to find it by senderId from notification
    let finalRequestId = requestId;
    if (!finalRequestId && senderId) {
      const foundRequest = await FriendRequest.findOne({
        senderId: senderId,
        receiverId: currentUser._id,
        status: 'pending'
      });
      if (foundRequest) {
        finalRequestId = foundRequest._id.toString();
      }
    }

    if (!finalRequestId) {
      return NextResponse.json(
        { error: 'Request ID is required. Please refresh the page and try again.' },
        { status: 400 }
      );
    }

    const friendRequest = await FriendRequest.findById(finalRequestId);
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

  } catch (error: any) {
    console.error('Error responding to friend request:', error);
    return NextResponse.json(
      { error: 'Failed to respond to friend request', details: error.message },
      { status: 500 }
    );
  }
}