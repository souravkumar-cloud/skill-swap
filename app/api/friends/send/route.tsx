import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import FriendRequest from '@/models/FriendRequest';
import User from '@/models/userModel';
import Notification from '@/models/notifications';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
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

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    if (currentUser._id.toString() === receiverId.toString()) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId: currentUser._id, receiverId: receiverId },
        { senderId: receiverId, receiverId: currentUser._id }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already exists' },
          { status: 400 }
        );
      } else if (existingRequest.status === 'accepted') {
        return NextResponse.json(
          { error: 'You are already friends' },
          { status: 400 }
        );
      } else {
        existingRequest.status = 'pending';
        existingRequest.senderId = currentUser._id;
        existingRequest.receiverId = receiverId;
        existingRequest.createdAt = new Date();
        await existingRequest.save();

        // Create notification for receiver
        try {
          await Notification.create({
            userId: receiver._id,
            type: 'friend_request',
            senderId: currentUser._id,
            message: `${currentUser.name} sent you a friend request`,
            data: { requestId: existingRequest._id.toString() },
            read: false
          });
        } catch (e) {
          console.error('Failed to create notification for friend request', e);
        }

        return NextResponse.json({
          success: true,
          message: 'Friend request sent successfully',
          request: existingRequest
        });
      }
    }

    const friendRequest = await FriendRequest.create({
      senderId: currentUser._id,
      receiverId: receiverId,
      status: 'pending'
    });

    // Create notification for receiver
    try {
      await Notification.create({
        userId: receiver._id,
        type: 'friend_request',
        senderId: currentUser._id,
        message: `${currentUser.name} sent you a friend request`,
        data: { requestId: friendRequest._id.toString() },
        read: false
      });
    } catch (e) {
      console.error('Failed to create notification for friend request', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Friend request sent successfully',
      request: friendRequest
    });

  } catch (error) {
    console.error('Error sending friend request:', error);
    
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Friend request already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send friend request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}