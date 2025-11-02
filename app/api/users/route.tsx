import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // Adjust path to your auth.ts file
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all users except the current user
    const users = await User.find({
      email: { $ne: session.user.email },
    }).select('name email _id');

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}