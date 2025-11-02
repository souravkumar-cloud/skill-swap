// models/matchModel.ts
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
    skillOffered: {
      type: String,
      required: true
    },
    skillRequested: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending'
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
matchSchema.index({ user: 1, createdAt: -1 });
matchSchema.index({ matchedUser: 1, createdAt: -1 });
matchSchema.index({ status: 1 });

const Match = mongoose.models?.Match || mongoose.model("Match", matchSchema);

export default Match;