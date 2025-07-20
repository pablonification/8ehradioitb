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
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) {
        return false;
      }

      // Look up whitelisted email case-insensitively (covers historical mixed-case entries)

      const whitelistedEmail = await prisma.whitelistedEmail.findFirst({
        where: {
          email: {
            equals: profile.email,
            mode: "insensitive",
          },
        },
      });

      if (!whitelistedEmail) {
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