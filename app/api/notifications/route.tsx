import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import Notification from '@/models/notifications';
import User from '@/models/userModel';
import Message from '@/models/Message';

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
    const notificationsRaw = await Notification.find({ userId: currentUser._id })
      .populate('senderId', 'name email image avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    
    // Convert to plain objects ensuring proper serialization
    const notifications = notificationsRaw.map((notif: any) => {
      const obj = notif.toObject ? notif.toObject({ virtuals: true }) : notif;
      
      // Ensure _id is a string
      if (obj._id) {
        obj._id = obj._id.toString();
      }
      
      // Ensure senderId._id is a string
      if (obj.senderId && obj.senderId._id) {
        obj.senderId._id = obj.senderId._id.toString();
      }
      
      // Ensure data is properly serialized - handle nested ObjectIds
      if (obj.data) {
        try {
          // Deep clone and convert ObjectIds to strings
          const serializedData: any = {};
          for (const key in obj.data) {
            if (obj.data[key] && typeof obj.data[key] === 'object' && obj.data[key].toString) {
              serializedData[key] = obj.data[key].toString();
            } else {
              serializedData[key] = obj.data[key];
            }
          }
          obj.data = serializedData;
        } catch (e) {
          console.error('Error serializing notification data:', e);
          // Keep original data if serialization fails
        }
      }
      
      return obj;
    });

    // For message notifications, fetch the actual message content
    // Also ensure data fields are properly serialized
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notif: any) => {
        // Ensure data object exists and is properly formatted
        const dataObj: any = notif.data || {};
        const serializedData: any = { ...dataObj }; // Start with existing data

        // Convert all ID fields to strings if they exist
        if (dataObj.requestId) {
          serializedData.requestId = String(dataObj.requestId);
        }
        if (dataObj.messageId) {
          serializedData.messageId = String(dataObj.messageId);
        }
        if (dataObj.matchId) {
          serializedData.matchId = String(dataObj.matchId);
        }
        // Keep other fields as-is
        if (dataObj.skillOffered !== undefined) {
          serializedData.skillOffered = dataObj.skillOffered;
        }
        if (dataObj.skillRequested !== undefined) {
          serializedData.skillRequested = dataObj.skillRequested;
        }
        if (dataObj.proposalMessage !== undefined) {
          serializedData.proposalMessage = dataObj.proposalMessage;
        }

        // Replace the data object with properly serialized version
        notif.data = serializedData;

        if (notif.type === 'message' && serializedData.messageId) {
          try {
            const message = await Message.findById(serializedData.messageId)
              .select('message')
              .lean();
            if (message && typeof message === 'object' && 'message' in message) {
              serializedData.messageContent = (message as any).message;
            }
          } catch (e) {
            console.error('Error fetching message content:', e);
          }
        }
        return notif;
      })
    );

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({ 
      userId: currentUser._id, 
      read: false 
    });

    return NextResponse.json({
      notifications: enrichedNotifications,
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