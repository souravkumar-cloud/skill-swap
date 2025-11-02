// models/userModel.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      select: false,
    },
    bio: {
      type: String,
      default: "No bio available",
    },
    skills: {
      type: [String],
      default: [],
    },
    learning: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    connections: {
      type: Number,
      default: 0,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    friendsCount: {
      type: Number,
      default: 0
    },
    // New fields for dashboard stats
    stats: {
      skillsShared: {
        type: Number,
        default: 0
      },
      activeConnections: {
        type: Number,
        default: 0
      },
      skillsLearning: {
        type: Number,
        default: 0
      },
      achievements: {
        type: Number,
        default: 0
      },
      weeklySkillsShared: {
        type: Number,
        default: 0
      },
      newConnectionsCount: {
        type: Number,
        default: 0
      },
      learningInProgress: {
        type: Number,
        default: 0
      },
      monthlyAchievements: {
        type: Number,
        default: 0
      }
    },
    // Learning progress tracking
    learningProgress: [{
      skill: String,
      progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      startedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
userSchema.index({ skills: 1 });
userSchema.index({ learning: 1 });
userSchema.index({ 'stats.activeConnections': -1 });

const User = mongoose.models?.User || mongoose.model("User", userSchema);

export default User;