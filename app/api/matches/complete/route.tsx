import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';
import Match from '@/models/match';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { swapId, rating, feedback } = await req.json();

    if (!swapId || !rating) {
      return NextResponse.json({ error: 'Swap ID and rating are required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await connectDB();

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the match and verify the user is part of it
    const match = await Match.findById(swapId);
    if (!match) {
      return NextResponse.json({ error: 'Swap not found' }, { status: 404 });
    }

    // Verify user is either the proposer or the matched user
    const isUser = match.user.toString() === currentUser._id.toString();
    const isMatchedUser = match.matchedUser.toString() === currentUser._id.toString();
    
    if (!isUser && !isMatchedUser) {
      return NextResponse.json({ error: 'Unauthorized to complete this swap' }, { status: 403 });
    }

    // Verify the swap is in accepted status
    if (match.status !== 'accepted') {
      return NextResponse.json({ error: 'Swap must be accepted before it can be completed' }, { status: 400 });
    }

    // Determine which rating field to update
    if (isUser) {
      // Current user is the proposer, update userRating (rating given by proposer to matched user)
      // Actually, userRating is the rating given TO the proposer BY the matched user
      // So if current user is proposer, they're rating the matched user, which goes in matchedUserRating
      match.matchedUserRating = {
        rating,
        feedback: feedback || ''
      };
    } else {
      // Current user is the matched user, update userRating (rating given by matched user to proposer)
      match.userRating = {
        rating,
        feedback: feedback || ''
      };
    }

    // Check if both users have rated
    const hasUserRating = match.userRating && typeof match.userRating.rating === 'number';
    const hasMatchedUserRating = match.matchedUserRating && typeof match.matchedUserRating.rating === 'number';
    const bothRated = hasUserRating && hasMatchedUserRating;

    // Only mark as completed when both users have submitted ratings
    if (bothRated) {
      match.status = 'completed';
      match.completedAt = new Date();
    } else {
      // Keep status as accepted if only one user has rated
      // Don't update completedAt yet
    }

    await match.save();

    return NextResponse.json({ 
      success: true, 
      message: bothRated 
        ? 'Swap completed successfully! Both users have rated.' 
        : 'Rating submitted successfully! Waiting for the other user to rate.',
      match,
      bothRated
    });
  } catch (error: any) {
    console.error('Complete swap error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete swap', 
      details: error.message 
    }, { status: 500 });
  }
}

