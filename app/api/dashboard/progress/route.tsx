// app/api/dashboard/progress/route.ts
import { NextResponse,NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from "@/models/userModel";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get current user with learning progress
    const user = await User.findOne({ email: session.user.email })
      .select('learningProgress learning');
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If no learning progress exists, initialize from learning array
    let learningProgress = user.learningProgress || [];
    
    if (learningProgress.length === 0 && user.learning?.length > 0) {
      learningProgress = user.learning.slice(0, 3).map((skill: string, index: number) => ({
        skill,
        progress: [65, 45, 30][index] || 0, // Default progress values
        startedAt: new Date()
      }));
      
      // Update user with initial progress
      await User.findByIdAndUpdate(user._id, {
        learningProgress
      });
    }

    // Format progress with colors
    const colors = ['blue', 'purple', 'green', 'orange', 'pink'];
    const formattedProgress = learningProgress.slice(0, 5).map((lp: any, index: number) => ({
      skill: lp.skill,
      progress: lp.progress,
      color: colors[index % colors.length]
    }));

    return NextResponse.json({ progress: formattedProgress }, { status: 200 });
  } catch (error) {
    console.error("Error fetching learning progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req:NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { skill, progress } = await req.json();

    if (!skill || typeof progress !== 'number') {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update or add progress
    const existingIndex = user.learningProgress?.findIndex(
      (lp: any) => lp.skill === skill
    );

    if (existingIndex !== undefined && existingIndex >= 0) {
      user.learningProgress[existingIndex].progress = Math.min(100, Math.max(0, progress));
    } else {
      user.learningProgress = user.learningProgress || [];
      user.learningProgress.push({
        skill,
        progress: Math.min(100, Math.max(0, progress)),
        startedAt: new Date()
      });
    }

    await user.save();

    return NextResponse.json({ 
      message: "Progress updated successfully",
      progress: user.learningProgress
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating learning progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}