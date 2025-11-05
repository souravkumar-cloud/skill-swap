import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "./lib/connectDB";
import User from "./models/userModel";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Trust the host header (needed for Vercel deployments)
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
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
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    error: '/login', // Redirect to login page on error
  },
});