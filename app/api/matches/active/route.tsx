import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';
import Match from '@/models/match';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const currentUser = await User.findOne({ email: session.user.email }).select('_id name');
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const active = await Match.find({
      $or: [{ user: currentUser._id }, { matchedUser: currentUser._id }],
      status: { $in: ['pending', 'accepted'] }
    })
      .sort({ updatedAt: -1 })
      .populate('user', 'name email image')
      .populate('matchedUser', 'name email image')
      .lean();

    const items = active.map((m: any) => {
      const isOwner = m.user._id.toString() === currentUser._id.toString();
      const other = isOwner ? m.matchedUser : m.user;
      
      // Check if current user has already rated
      let hasUserRated = false;
      if (isOwner) {
        // Current user is proposer, check if matchedUserRating exists (their rating of the matched user)
        hasUserRated = m.matchedUserRating && typeof m.matchedUserRating.rating === 'number';
      } else {
        // Current user is matched user, check if userRating exists (their rating of the proposer)
        hasUserRated = m.userRating && typeof m.userRating.rating === 'number';
      }
      
      // Check if other user has rated
      let hasOtherUserRated = false;
      if (isOwner) {
        // Current user is proposer, check if userRating exists (matched user's rating of proposer)
        hasOtherUserRated = m.userRating && typeof m.userRating.rating === 'number';
      } else {
        // Current user is matched user, check if matchedUserRating exists (proposer's rating of matched user)
        hasOtherUserRated = m.matchedUserRating && typeof m.matchedUserRating.rating === 'number';
      }
      
      return {
        id: m._id.toString(),
        otherUser: {
          id: other._id.toString(),
          name: other.name,
          email: other.email,
          image: other.image
        },
        skillOffered: m.skillOffered,
        skillRequested: m.skillRequested,
        status: m.status,
        progress: m.progress || 0,
        updatedAt: m.updatedAt,
        hasUserRated,
        hasOtherUserRated,
        bothRated: hasUserRated && hasOtherUserRated
      };
    });

    return NextResponse.json({ activeSwaps: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch active swaps' }, { status: 500 });
  }
}




