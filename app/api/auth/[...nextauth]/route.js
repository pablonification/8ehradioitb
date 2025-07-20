import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  debug: process.env.NODE_ENV !== "production", // Enable verbose logs in dev
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) {
        console.log("[signIn] denied: No email in profile.");
        return false;
      }

      // Look up whitelisted email case-insensitively (covers historical mixed-case entries)
      console.log("[signIn] Checking whitelist for: ", profile.email);

      const whitelistedEmail = await prisma.whitelistedEmail.findFirst({
        where: {
          email: {
            equals: profile.email,
            mode: "insensitive",
          },
        },
      });

      if (!whitelistedEmail) {
        console.log(`[signIn] Unauthorized: ${profile.email} not found in whitelist`);
        return false; // Deny access
      }

      console.log(`[signIn] Authorized: ${profile.email} is whitelisted.`);
      return true; // Allow access
    },
    async jwt({ token, user }) {
      console.log('[jwt] before', { token, user });
      if (user) { // This is only available on first sign-in
        token.role = user.role;
      }
      console.log('[jwt] after', token);
      return token;
    },
    async session({ session, token }) {
      console.log('[session callback] input', { session, token });
      if (session?.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      console.log('[session callback] output', session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 