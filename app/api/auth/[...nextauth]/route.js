import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) {
        console.log("Sign-in denied: No email in profile.");
        return false;
      }

      const whitelistedEmail = await prisma.whitelistedEmail.findUnique({
        where: { email: profile.email },
      });

      if (!whitelistedEmail) {
        console.log(`Unauthorized sign-in attempt: ${profile.email}`);
        return false; // Deny access
      }
      
      return true; // Allow access
    },
    async jwt({ token, user }) {
      if (user) { // This is only available on first sign-in
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 