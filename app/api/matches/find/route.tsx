// app/api/matches/find/route.ts
import { NextResponse } from 'next/server';
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

    // Get current user
    const currentUser = await User.findOne({ email: session.user.email })
      .select('skills learning friends');
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find potential matches
    // Users who:
    // 1. Have skills that I need (their skills overlap with my learning)
    // 2. Need skills that I have (their learning overlaps with my skills)
    const potentialMatches = await User.find({
      _id: { $ne: currentUser._id }, // Not the current user
      $or: [
        // They can do what I need
        { skills: { $in: currentUser.learning || [] } },
        // They need what I can do
        { learning: { $in: currentUser.skills || [] } }
      ]
    })
      .select('name email image skills learning rating connections lastSeen')
      .limit(20)
      .sort({ lastSeen: -1 }); // Most recently active first

    // Calculate match scores and format response
    const matches = potentialMatches.map(user => {
      // Skills they have that I need
      const theyCanDoForMe = user.skills?.filter(skill => 
        currentUser.learning?.includes(skill)
      ) || [];

      // Skills I have that they need
      const iCanDoForThem = currentUser.skills?.filter(skill => 
        user.learning?.includes(skill)
      ) || [];

      // Calculate match score (0-100)
      let matchScore = 0;
      
      // Base score from mutual skill needs
      if (theyCanDoForMe.length > 0 && iCanDoForThem.length > 0) {
        matchScore = 90; // Perfect mutual match
      } else if (theyCanDoForMe.length > 0 || iCanDoForThem.length > 0) {
        matchScore = 70; // One-way match
      } else {
        matchScore = 40; // Weak match
      }

      // Boost score based on number of matching skills
      matchScore += Math.min(theyCanDoForMe.length * 2, 10);
      matchScore = Math.min(matchScore, 100);

      // Avatar emoji based on name
      const avatars = ['👨‍💻', '👩‍💻', '👨‍💼', '👩‍💼', '👨‍🎨', '👩‍🎨', '👨‍🔬', '👩‍🔬'];
      const avatarIndex = (user.name?.charCodeAt(0) || 0) % avatars.length;

      // Calculate response time based on lastSeen
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60));
      
      let responseTime;
      if (diffHours < 1) responseTime = "< 1 hour";
      else if (diffHours < 4) responseTime = `~${diffHours} hours`;
      else if (diffHours < 24) responseTime = "Today";
      else if (diffHours < 48) responseTime = "Yesterday";
      else responseTime = `${Math.floor(diffHours / 24)} days ago`;

      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        avatar: avatars[avatarIndex],
        offersSkill: theyCanDoForMe[0] || user.skills?.[0] || 'Various services',
        needsSkill: iCanDoForThem[0] || user.learning?.[0] || 'Various services',
        allOfferedSkills: theyCanDoForMe,
        allNeededSkills: iCanDoForThem,
        matchScore,
        rating: user.rating || 4.5,
        completedProjects: user.connections || 0,
        responseTime,
        canSwap: theyCanDoForMe.length > 0 && iCanDoForThem.length > 0,
        lastSeen: user.lastSeen
      };
    });

    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({ 
      matches,
      total: matches.length,
      perfectMatches: matches.filter(m => m.matchScore >= 90).length
    }, { status: 200 });

  } catch (error) {
    console.error("Error finding matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}