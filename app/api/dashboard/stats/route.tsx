// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectDB } from '@/lib/connectDB';
import User from "@/models/userModel";
import Match from "@/models/match";

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

    // Get current user
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Calculate stats
    const skillsShared = user.skills?.length || 0;
    const skillsLearning = user.learning?.length || 0;
    
    // Get active connections (accepted matches)
    const activeConnections = await Match.countDocuments({
      $or: [
        { user: user._id, status: 'accepted' },
        { matchedUser: user._id, status: 'accepted' }
      ]
    });

    // Get weekly new connections
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyConnections = await Match.countDocuments({
      $or: [
        { user: user._id },
        { matchedUser: user._id }
      ],
      createdAt: { $gte: oneWeekAgo }
    });

    // Get monthly achievements (completed matches)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const monthlyAchievements = await Match.countDocuments({
      $or: [
        { user: user._id },
        { matchedUser: user._id }
      ],
      status: 'completed',
      createdAt: { $gte: oneMonthAgo }
    });

    // Total achievements
    const totalAchievements = await Match.countDocuments({
      $or: [
        { user: user._id },
        { matchedUser: user._id }
      ],
      status: 'completed'
    });

    // Learning in progress
    const learningInProgress = user.learningProgress?.filter(
      (lp: any) => lp.progress > 0 && lp.progress < 100
    ).length || 0;

    // Update user stats
    await User.findByIdAndUpdate(user._id, {
      'stats.skillsShared': skillsShared,
      'stats.activeConnections': activeConnections,
      'stats.skillsLearning': skillsLearning,
      'stats.achievements': totalAchievements,
      'stats.weeklySkillsShared': Math.min(weeklyConnections, skillsShared),
      'stats.newConnectionsCount': weeklyConnections,
      'stats.learningInProgress': learningInProgress,
      'stats.monthlyAchievements': monthlyAchievements
    });

    const stats = {
      skillsShared,
      activeConnections,
      skillsLearning,
      achievements: totalAchievements,
      trends: {
        weeklySkillsShared: Math.min(weeklyConnections, skillsShared),
        newConnections: weeklyConnections,
        learningInProgress,
        monthlyAchievements
      }
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}