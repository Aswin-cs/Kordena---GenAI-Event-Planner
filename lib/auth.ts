import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "./mongodb";
import User from "../models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          await connectToDatabase();
          await User.findOneAndUpdate(
            { email: user.email.toLowerCase() },
            {
              $set: {
                name: user.name || "Event Planner",
                image: user.image || "",
                googleId: account.providerAccountId,
              },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );
        } catch (error) {
          console.error("MongoDB User save error in NextAuth signIn callback:", error);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && session.user.email) {
        try {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: session.user.email.toLowerCase() });
          if (dbUser) {
            (session.user as any).id = dbUser._id.toString();
          }
        } catch (error) {
          console.error("Error attaching MongoDB ID to session:", error);
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.sub = user.id || account.providerAccountId;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/",
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          console.warn("[SECURITY WARNING] NEXTAUTH_SECRET is not set in production!");
          return "kordena_production_fallback_secret_must_be_set_in_env";
        })()
      : "kordena_development_secret_key_32chars_long"),
};
