// app/api/users/skills/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from "@/models/userModel";

// Get user's skills
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

    const user = await User.findOne({ email: session.user.email })
      .select('skills learning');
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      skills: user.skills || [],
      learning: user.learning || []
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add a skill or need
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { skill, type } = await req.json();

    if (!skill || !type || !['offer', 'need'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid request data. Provide 'skill' and 'type' (offer/need)" },
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

    const trimmedSkill = skill.trim();

    // Add to appropriate array
    if (type === 'offer') {
      if (user.skills?.includes(trimmedSkill)) {
        return NextResponse.json(
          { error: "Skill already exists" },
          { status: 400 }
        );
      }
      user.skills = [...(user.skills || []), trimmedSkill];
      
      // Update stats
      if (user.stats) {
        user.stats.skillsShared = user.skills.length;
      }
    } else {
      if (user.learning?.includes(trimmedSkill)) {
        return NextResponse.json(
          { error: "Skill already exists in your needs" },
          { status: 400 }
        );
      }
      user.learning = [...(user.learning || []), trimmedSkill];
      
      // Update stats
      if (user.stats) {
        user.stats.skillsLearning = user.learning.length;
      }
    }

    await user.save();

    return NextResponse.json({
      message: "Skill added successfully",
      skills: user.skills,
      learning: user.learning
    }, { status: 200 });

  } catch (error) {
    console.error("Error adding skill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove a skill or need
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { skill, type } = await req.json();

    if (!skill || !type || !['offer', 'need'].includes(type)) {
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

    // Remove from appropriate array
    if (type === 'offer') {
      user.skills = (user.skills || []).filter(s => s !== skill);
      
      // Update stats
      if (user.stats) {
        user.stats.skillsShared = user.skills.length;
      }
    } else {
      user.learning = (user.learning || []).filter(s => s !== skill);
      
      // Update stats
      if (user.stats) {
        user.stats.skillsLearning = user.learning.length;
      }
    }

    await user.save();

    return NextResponse.json({
      message: "Skill removed successfully",
      skills: user.skills,
      learning: user.learning
    }, { status: 200 });

  } catch (error) {
    console.error("Error removing skill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}