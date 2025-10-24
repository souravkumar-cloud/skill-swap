import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("Already connected!");
      return;
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log("Database connected!");
  } catch (err) {
    console.error("Database connection error:", err);
    console.log("Database not connected!");
  }
};