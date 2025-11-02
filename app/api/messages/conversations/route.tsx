import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // Adjust path to your auth.ts file
import { connectDB } from '@/lib/connectDB';
import Message from '@/models/Message';
import User from '@/models/userModel';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

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

    // Get all unique users that current user has chatted with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: currentUser._id },
            { receiverId: currentUser._id },
          ],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', currentUser._id] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$message' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', currentUser._id] },
                    { $eq: ['$isRead', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
    ]);

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}