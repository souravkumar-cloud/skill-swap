import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import Notification from '@/models/notifications';
import Match from '@/models/match';
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

    const { notificationId, action } = await req.json();

    if (!notificationId || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
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

    // Find the notification
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: currentUser._id,
      type: 'swap_proposal'
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Find the related match
    const match = await Match.findById(notification.data.matchId);

    if (!match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Update match status
    match.status = action === 'accept' ? 'accepted' : 'rejected';
    match.respondedAt = new Date();
    await match.save();

    // Mark notification as read
    notification.read = true;
    await notification.save();

    // Create a response notification for the sender
    const responseNotification = new Notification({
      userId: notification.senderId,
      type: action === 'accept' ? 'swap_accepted' : 'swap_rejected',
      senderId: currentUser._id,
      message: action === 'accept' 
        ? `${currentUser.name} accepted your swap proposal!`
        : `${currentUser.name} declined your swap proposal.`,
      data: {
        matchId: match._id.toString(),
        skillOffered: notification.data.skillOffered,
        skillRequested: notification.data.skillRequested
      },
      read: false
    });

    await responseNotification.save();

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? 'Swap proposal accepted!' : 'Swap proposal rejected.'
    }, { status: 200 });

  } catch (error) {
    console.error("Error responding to notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}