import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import Notification from '@/models/notifications';
import User from '@/models/userModel';

// GET - Fetch all notifications for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Fetch notifications with sender details
    const notifications = await Notification.find({ userId: currentUser._id })
      .populate('senderId', 'name email image avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({ 
      userId: currentUser._id, 
      read: false 
    });

    return NextResponse.json({
      notifications,
      unreadCount
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}