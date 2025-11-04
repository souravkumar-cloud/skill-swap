// app/api/matches/propose/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from "@/models/userModel";
import Match from "@/models/match";
import Notification from "@/models/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { 
      matchedUserId, 
      skillOffered,  // What I will do for them
      skillRequested, // What I want them to do for me
      message 
    } = await req.json();

    if (!matchedUserId || !skillOffered || !skillRequested) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify matched user exists - handle both string and ObjectId
    let matchedUser;
    try {
      // Try to find by ID (handles both string and ObjectId)
      matchedUser = await User.findById(matchedUserId);
      
      // If not found, try to find by _id as string
      if (!matchedUser) {
        matchedUser = await User.findOne({ _id: matchedUserId });
      }
    } catch (idError: any) {
      console.error("Error finding matched user:", idError);
      return NextResponse.json(
        { error: "Invalid user ID format", details: idError.message },
        { status: 400 }
      );
    }
    
    if (!matchedUser) {
      return NextResponse.json(
        { error: "Matched user not found" },
        { status: 404 }
      );
    }

    // Verify the current user has the skill they're offering
    if (!currentUser.skills?.includes(skillOffered)) {
      return NextResponse.json(
        { error: "You don't have the skill you're offering" },
        { status: 400 }
      );
    }

    // Verify the matched user has the skill being requested
    if (!matchedUser.skills?.includes(skillRequested)) {
      return NextResponse.json(
        { error: "The other user doesn't have the skill you're requesting" },
        { status: 400 }
      );
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({
      $or: [
        {
          user: currentUser._id,
          matchedUser: matchedUser._id,
          skillOffered,
          skillRequested,
          status: { $in: ['pending', 'accepted'] }
        },
        {
          user: matchedUser._id,
          matchedUser: currentUser._id,
          skillOffered: skillRequested,
          skillRequested: skillOffered,
          status: { $in: ['pending', 'accepted'] }
        }
      ]
    });

    if (existingMatch) {
      return NextResponse.json(
        { error: "Swap proposal already exists" },
        { status: 400 }
      );
    }

    // Calculate match score
    const currentUserSkillsMatch = currentUser.skills?.filter(s => 
      matchedUser.learning?.includes(s)
    ).length || 0;
    
    const matchedUserSkillsMatch = matchedUser.skills?.filter(s => 
      currentUser.learning?.includes(s)
    ).length || 0;

    let matchScore = 50;
    if (currentUserSkillsMatch > 0 && matchedUserSkillsMatch > 0) {
      matchScore = 90 + Math.min(currentUserSkillsMatch + matchedUserSkillsMatch, 10);
    } else if (currentUserSkillsMatch > 0 || matchedUserSkillsMatch > 0) {
      matchScore = 70;
    }

    // Create new match
    let newMatch;
    try {
      newMatch = new Match({
        user: currentUser._id,
        matchedUser: matchedUser._id,
        skillOffered,
        skillRequested,
        matchScore,
        status: 'pending',
        proposedBy: currentUser._id,
        proposalMessage: message || ''
      });

      await newMatch.save();
      console.log("Match created successfully:", newMatch._id);
    } catch (matchError: any) {
      console.error("Error creating match:", matchError);
      // Check for duplicate key error
      if (matchError.code === 11000) {
        return NextResponse.json(
          { error: "Swap proposal already exists" },
          { status: 400 }
        );
      }
      throw matchError; // Re-throw to be caught by outer catch
    }

    // 🔥 CREATE NOTIFICATION FOR THE MATCHED USER
    try {
      const notification = new Notification({
        userId: matchedUser._id,
        type: 'swap_proposal',
        senderId: currentUser._id,
        message: `${currentUser.name || 'Someone'} wants to swap services with you!`,
        data: {
          matchId: newMatch._id.toString(),
          skillOffered: skillRequested, // What they'll get from me
          skillRequested: skillOffered,  // What I want from them
          proposalMessage: message || ''
        },
        read: false
      });

      await notification.save();
    } catch (notifError: any) {
      console.error("Error creating notification:", notifError);
      // Don't fail the whole request if notification fails
      // The match was already created successfully
    }

    // Update user stats (optional, don't fail if this fails)
    try {
      if (currentUser.stats) {
        currentUser.stats.newConnectionsCount = (currentUser.stats.newConnectionsCount || 0) + 1;
        await currentUser.save();
      }
    } catch (statsError: any) {
      console.error("Error updating user stats:", statsError);
      // Continue - stats update is not critical
    }

    // Populate the match for response
    let populatedMatch;
    try {
      populatedMatch = await Match.findById(newMatch._id)
        .populate('user', 'name email image')
        .populate('matchedUser', 'name email image')
        .lean();
      
      // If population fails, return the basic match
      if (!populatedMatch) {
        populatedMatch = newMatch.toObject();
      }
    } catch (populateError: any) {
      console.error("Error populating match:", populateError);
      // Return basic match info if population fails
      populatedMatch = {
        _id: newMatch._id,
        user: { _id: currentUser._id, name: currentUser.name, email: currentUser.email, image: currentUser.image },
        matchedUser: { _id: matchedUser._id, name: matchedUser.name, email: matchedUser.email, image: matchedUser.image },
        skillOffered,
        skillRequested,
        status: 'pending',
        matchScore
      };
    }

    return NextResponse.json({
      message: "Swap proposal sent successfully",
      match: populatedMatch
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error proposing swap:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}