import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
    }).select('name email _id image');

    // Transform users to match your frontend format
    const transformedUsers = users.map(user => ({
      id: user._id.toString(), // Convert ObjectId to string
      _id: user._id.toString(), // Also include _id for compatibility
      name: user.name,
      email: user.email,
      avatar: user.image || user.name.charAt(0).toUpperCase(),
      bio: `Developer passionate about learning and sharing knowledge`,
      skills: ['JavaScript', 'React', 'Node.js'], // You'll need to add these fields to your User model
      learning: ['Python', 'Machine Learning'], // You'll need to add these fields to your User model
      rating: 4.5,
      connections: Math.floor(Math.random() * 100),
      online: Math.random() > 0.5, // Random for now, you can add real presence tracking
    }));

    return NextResponse.json(transformedUsers);
  } catch (error: any) {
    console.error('Error fetching skill exchange users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}