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
  session: { maxAge: 3600 },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create(user);
        }
        return true;
      } catch (err) {
        console.log("SignIn Error:", err);
        return false;
      }
    },
    session({ session, token }) {
      session.user.id = token.sub as string;
      return session;
    },
  },
});
