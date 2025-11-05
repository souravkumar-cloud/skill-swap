import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import Message from '@/models/Message'; // You'll need to create this model
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

    // Count unread messages (you'll need to add an 'isRead' field to your Message model)
    const unreadCount = await Message.countDocuments({
      receiverId: currentUser._id,
      isRead: false
    });

    return NextResponse.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}