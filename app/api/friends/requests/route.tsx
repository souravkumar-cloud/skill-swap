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

    const requests = await FriendRequest.find({
      receiverId: currentUser._id,
      status: 'pending'
    })
      .populate('senderId', 'name email image')
      .sort({ createdAt: -1 })
      .lean();

    const formattedRequests = requests.map(req => ({
      ...req,
      senderId: {
        ...req.senderId,
        avatar: req.senderId.image
      }
    }));

    return NextResponse.json({
      success: true,
      requests: formattedRequests
    });

  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}