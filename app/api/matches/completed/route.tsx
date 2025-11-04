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

    const completed = await Match.find({
      $or: [{ user: currentUser._id }, { matchedUser: currentUser._id }],
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .populate('user', 'name email image')
      .populate('matchedUser', 'name email image')
      .lean();

    const items = completed.map((m: any) => {
      const isOwner = m.user._id.toString() === currentUser._id.toString();
      const other = isOwner ? m.matchedUser : m.user;
      const myRating = isOwner ? m.userRating?.rating : m.matchedUserRating?.rating;
      const theirRating = isOwner ? m.matchedUserRating?.rating : m.userRating?.rating;
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
        completedAt: m.completedAt || m.updatedAt,
        myRating: myRating || null,
        theirRating: theirRating || null
      };
    });

    return NextResponse.json({ completedSwaps: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch completed swaps' }, { status: 500 });
  }
}




