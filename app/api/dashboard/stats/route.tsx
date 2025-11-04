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

    // Calculate average rating from completed matches
    // Get all completed matches where user participated
    const completedMatches = await Match.find({
      $or: [
        { user: user._id, status: 'completed' },
        { matchedUser: user._id, status: 'completed' }
      ]
    }).lean();

    let totalRating = 0;
    let ratingCount = 0;
    let monthlyRatingSum = 0;
    let monthlyRatingCount = 0;

    for (const match of completedMatches) {
      let rating: number | null = null;
      
      // If user is the proposer, get rating from userRating (given by matchedUser)
      if (match.user.toString() === user._id.toString()) {
        if (match.userRating && typeof match.userRating.rating === 'number') {
          rating = match.userRating.rating;
        }
      } 
      // If user is the matched user, get rating from matchedUserRating (given by user)
      else if (match.matchedUser.toString() === user._id.toString()) {
        if (match.matchedUserRating && typeof match.matchedUserRating.rating === 'number') {
          rating = match.matchedUserRating.rating;
        }
      }

      if (rating !== null) {
        totalRating += rating;
        ratingCount += 1;

        // Check if rating was given this month
        const ratingDate = match.completedAt || match.updatedAt;
        if (ratingDate && new Date(ratingDate) >= oneMonthAgo) {
          monthlyRatingSum += rating;
          monthlyRatingCount += 1;
        }
      }
    }

    // Calculate average rating
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    const monthlyAverageRating = monthlyRatingCount > 0 ? monthlyRatingSum / monthlyRatingCount : 0;
    // DailyRating trend: average rating this month (if any ratings exist)
    const dailyRating = monthlyRatingCount > 0 ? monthlyAverageRating : 0;

    // Update user stats including rating
    await User.findByIdAndUpdate(user._id, {
      'stats.skillsShared': skillsShared,
      'stats.activeConnections': activeConnections,
      'stats.skillsLearning': skillsLearning,
      'stats.achievements': totalAchievements,
      'stats.weeklySkillsShared': Math.min(weeklyConnections, skillsShared),
      'stats.newConnectionsCount': weeklyConnections,
      'stats.learningInProgress': learningInProgress,
      'stats.monthlyAchievements': monthlyAchievements,
      rating: averageRating
    });

    const stats = {
      skillsShared,
      activeConnections,
      skillsLearning,
      achievements: totalAchievements,
      Rating: averageRating,
      trends: {
        weeklySkillsShared: Math.min(weeklyConnections, skillsShared),
        newConnections: weeklyConnections,
        learningInProgress,
        monthlyAchievements,
        DailyRating: dailyRating
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