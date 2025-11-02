import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'; // Adjust path to your auth.ts file
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { userId } = params;

    // Get user by ID
    const user = await User.findById(userId).select('name email _id image');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}