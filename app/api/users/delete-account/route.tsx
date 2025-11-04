import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';
import Match from '@/models/match';
import FriendRequest from '@/models/FriendRequest';
import Notification from '@/models/notifications';
import Message from '@/models/Message';

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    const userId = currentUser._id;

    // Delete all related data
    // 1. Delete all matches involving this user
    await Match.deleteMany({
      $or: [
        { user: userId },
        { matchedUser: userId }
      ]
    });

    // 2. Delete all friend requests involving this user
    await FriendRequest.deleteMany({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });

    // 3. Delete all notifications for this user
    await Notification.deleteMany({ userId: userId });

    // 4. Delete all messages sent by this user
    await Message.deleteMany({ senderId: userId });

    // 5. Remove user from other users' friends lists
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    // 6. Finally, delete the user account
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account', details: error.message },
      { status: 500 }
    );
  }
}

