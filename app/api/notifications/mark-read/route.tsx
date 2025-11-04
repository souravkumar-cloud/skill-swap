import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import Notification from '@/models/notifications';
import User from '@/models/userModel';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { notificationId } = await req.json();

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Mark specific notification as read or all if no ID provided
    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId: currentUser._id },
        { read: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { userId: currentUser._id, read: false },
        { read: true }
      );
    }

    return NextResponse.json({
      message: "Notification(s) marked as read"
    }, { status: 200 });

  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}