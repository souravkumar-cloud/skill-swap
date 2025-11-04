// models/match.ts
import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    matchedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // What the user offers
    skillOffered: {
      type: String,
      required: true
    },
    // What the user wants/needs
    skillRequested: {
      type: String,
      required: true
    },
    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    },
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    proposalMessage: {
      type: String,
      default: ''
    },
    // For tracking progress
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completedAt: {
      type: Date
    },
    // Ratings after completion
    userRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String
    },
    matchedUserRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: String
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
matchSchema.index({ user: 1, status: 1 });
matchSchema.index({ matchedUser: 1, status: 1 });
matchSchema.index({ matchScore: -1 });
matchSchema.index({ createdAt: -1 });

// Prevent duplicate matches between same users for same skills
matchSchema.index(
  { user: 1, matchedUser: 1, skillOffered: 1, skillRequested: 1 },
  { unique: true }
);

const Match = mongoose.models?.Match || mongoose.model("Match", matchSchema);

export default Match;