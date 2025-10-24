import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB } from "./lib/connectDB";
import User from "./models/userModel";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 3600 
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log("=== SignIn Callback Started ===");
        console.log("User:", user);
        
        await connectDB();
        console.log("Database connected");
        
        const existingUser = await User.findOne({ email: user.email });
        console.log("Existing user:", existingUser);
        
        if (!existingUser) {
          console.log("Creating new user...");
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
          });
          console.log("New user created:", newUser);
        }
        
        console.log("=== SignIn Callback Success ===");
        return true;
      } catch (err) {
        console.error("=== SignIn Error ===");
        console.error(err);
        // Return true anyway to allow login (you can change this)
        return true; // Change to false if you want to block login on DB errors
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    error: '/login', // Redirect to login page on error
  },
});