// api/user/skills/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {connectDB} from '@/lib/connectDB';
import User from '@/models/userModel';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { skill, type } = await req.json();

    if (!skill || !type) {
      return NextResponse.json(
        { message: 'Skill and type are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Add skill to appropriate array
    if (type === 'teach') {
      if (user.skills.includes(skill)) {
        return NextResponse.json(
          { message: 'Skill already exists' },
          { status: 400 }
        );
      }
      user.skills.push(skill);
      user.stats.skillsShared += 1;
      user.stats.weeklySkillsShared += 1;
    } else if (type === 'learn') {
      if (user.learning.includes(skill)) {
        return NextResponse.json(
          { message: 'Already learning this skill' },
          { status: 400 }
        );
      }
      user.learning.push(skill);
      user.stats.skillsLearning += 1;
      user.stats.learningInProgress += 1;
      
      // Add to learning progress tracking
      user.learningProgress.push({
        skill: skill,
        progress: 0,
        startedAt: new Date()
      });
    }

    await user.save();

    return NextResponse.json(
      { message: 'Skill added successfully', user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
