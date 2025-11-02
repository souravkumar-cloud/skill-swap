import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({
        error: 'Not authenticated',
        session: null,
      });
    }

    await connectDB();

    // Try to find user by email
    const userByEmail = await User.findOne({ email: session.user.email });
    
    // Try to find user by id if available
    let userById = null;
    if (session.user.id) {
      userById = await User.findById(session.user.id);
    }

    return NextResponse.json({
      success: true,
      session: {
        user: session.user,
      },
      database: {
        userByEmail: userByEmail ? { 
          _id: userByEmail._id, 
          name: userByEmail.name, 
          email: userByEmail.email 
        } : null,
        userById: userById ? { 
          _id: userById._id, 
          name: userById.name, 
          email: userById.email 
        } : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}