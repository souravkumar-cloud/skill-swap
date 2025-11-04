// app/api/users/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from '@/models/userModel';
import bcrypt from 'bcryptjs';

// GET current user profile
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email })
      .select('name email image bio skills learning rating connections');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      skills: user.skills,
      learning: user.learning,
      rating: user.rating,
      connections: user.connections
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT update user profile
export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, bio, password, skills, learning } = await request.json();

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {
      lastSeen: new Date()
    };

    // Update name if provided
    if (name !== undefined && name !== null && name.trim() !== '') {
      updateData.name = name.trim();
    }

    // Update email if provided (check for duplicates)
    if (email !== undefined && email !== null && email.trim() !== '') {
      const newEmail = email.trim();
      if (newEmail !== currentUser.email) {
        const emailExists = await User.findOne({ email: newEmail });
        if (emailExists) {
          return NextResponse.json(
            { error: 'Email already in use' },
            { status: 400 }
          );
        }
        updateData.email = newEmail;
      }
    }

    // Update bio if provided
    if (bio !== undefined) {
      updateData.bio = bio;
    }

    // Update skills if provided
    if (skills !== undefined) {
      updateData.skills = skills;
    }

    // Update learning if provided
    if (learning !== undefined) {
      updateData.learning = learning;
    }

    // Update password if provided
    if (password !== undefined && password !== null && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('name email image bio skills learning rating connections');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        learning: updatedUser.learning,
        rating: updatedUser.rating,
        connections: updatedUser.connections
      }
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
}