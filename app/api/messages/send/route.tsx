import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // Adjust path to your auth.ts file
import { connectDB } from '@/lib/connectDB';
import Message from '@/models/Message';
import User from '@/models/userModel';
import Notification from '@/models/notifications';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Send Message API Called ===');
    
    const session = await auth();
    
    if (!session || !session.user) {
      console.error('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Session user:', session.user);

    await connectDB();
    console.log('Database connected');

    const body = await req.json();
    console.log('Request body:', body);
    
    const { receiverId, message } = body;

    if (!receiverId || !message) {
      console.error('Missing receiverId or message');
      return NextResponse.json(
        { error: 'Receiver ID and message are required' },
        { status: 400 }
      );
    }

    // Verify receiver exists
    console.log('Looking for receiver with ID:', receiverId);
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.error('Receiver not found:', receiverId);
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }
    console.log('Receiver found:', receiver.name);

    // Get current user - check both email and id
    let currentUser = await User.findOne({ email: session.user.email });
    
    // If not found by email, try by id (session.user.id from your callback)
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

    console.log('Current user found:', currentUser._id);
    console.log('Sending to:', receiverId);

    // Create message
    const newMessage = await Message.create({
      senderId: currentUser._id,
      receiverId,
      message: message.trim(),
    });

    console.log('Message created:', newMessage._id);

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email');

    // Create a notification for receiver
    try {
      await Notification.create({
        userId: receiver._id,
        type: 'message',
        senderId: currentUser._id,
        message: `${currentUser.name} sent you a message`,
        data: { messageId: newMessage._id.toString() },
        read: false
      });
    } catch (e) {
      // do not break message send if notification fails
      console.error('Failed to create notification for message', e);
    }

    return NextResponse.json({
      success: true,
      message: populatedMessage,
    });
  } catch (error: any) {
    console.error('=== Error sending message ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check for specific MongoDB errors
    if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}