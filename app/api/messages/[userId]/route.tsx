import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // Adjust path to your auth.ts file
import { connectDB } from '@/lib/connectDB';
import Message from '@/models/Message';
import User from '@/models/userModel';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // FIXED: Await params before accessing properties
    const { userId } = await params;

    // Get current user - check both email and id
    let currentUser = await User.findOne({ email: session.user.email });
    
    // If not found by email, try by id
    if (!currentUser && session.user.id) {
      currentUser = await User.findById(session.user.id);
    }
    
    if (!currentUser) {
      console.error('Current user not found. Session:', session.user);
      return NextResponse.json(
        { error: 'Current user not found. Please log in again.' },
        { status: 404 }
      );
    }

    console.log('Fetching messages between:', currentUser._id, 'and', userId);

    // Get all messages between current user and the specified user
    const messages = await Message.find({
      $or: [
        { senderId: currentUser._id, receiverId: userId },
        { senderId: userId, receiverId: currentUser._id },
      ],
    })
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: currentUser._id,
        isRead: false,
      },
      { isRead: true }
    );

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}