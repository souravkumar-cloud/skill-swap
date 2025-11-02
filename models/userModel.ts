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
      unique: true, // This already creates an index
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
  },
  {
    timestamps: true,
  }
);

// REMOVED: userSchema.index({ email: 1 }); - This was causing duplicate index warning
// The unique: true already creates this index

// Keep these indexes for performance
userSchema.index({ skills: 1 });
userSchema.index({ learning: 1 });

const User = mongoose.models?.User || mongoose.model("User", userSchema);

export default User;