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

    const { swapId } = await req.json();

    if (!swapId) {
      return NextResponse.json({ error: 'Swap ID required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Unauthorized to cancel this swap' }, { status: 403 });
    }

    // Update the swap status to cancelled
    match.status = 'cancelled';
    await match.save();

    return NextResponse.json({ success: true, match });
  } catch (error: any) {
    console.error('Cancel swap error:', error);
    return NextResponse.json({ error: 'Failed to cancel swap', details: error.message }, { status: 500 });
  }
}