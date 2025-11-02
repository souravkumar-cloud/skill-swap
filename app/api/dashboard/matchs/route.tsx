// app/api/dashboard/matches/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from "@/models/userModel";
import Match from "@/models/match";


export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get current user
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get recent matches (last 10)
    const recentMatches = await Match.find({
      $or: [
        { user: user._id },
        { matchedUser: user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('matchedUser', 'name image email')
      .populate('user', 'name image email');

    // Format matches for frontend
    const formattedMatches = recentMatches.map((match: any) => {
      const isCurrentUser = match.user._id.toString() === user._id.toString();
      const otherUser = isCurrentUser ? match.matchedUser : match.user;
      
      // Calculate time ago
      const now = new Date();
      const matchTime = new Date(match.createdAt);
      const diffMs = now.getTime() - matchTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      let timeAgo;
      if (diffMins < 60) {
        timeAgo = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        timeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      }

      // Generate avatar emoji based on name
      const avatars = ['👨‍💻', '👩‍💻', '👨‍💼', '👩‍💼', '👨‍🎨', '👩‍🎨', '👨‍🔬', '👩‍🔬'];
      const avatarIndex = (otherUser.name?.charCodeAt(0) || 0) % avatars.length;

      return {
        id: match._id,
        name: otherUser.name,
        email: otherUser.email,
        image: otherUser.image,
        skill: isCurrentUser ? match.skillRequested : match.skillOffered,
        exchange: isCurrentUser ? match.skillOffered : match.skillRequested,
        time: timeAgo,
        avatar: avatars[avatarIndex],
        status: match.status
      };
    });

    return NextResponse.json({ matches: formattedMatches }, { status: 200 });
  } catch (error) {
    console.error("Error fetching recent matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}