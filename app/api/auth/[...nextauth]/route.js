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
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async signIn({ user, account, profile }) {
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

      // Keep Account tokens fresh on every sign-in so server-side API calls
      // (e.g. Drive export) always have a valid access_token + refresh_token.
      if (account?.provider === "google" && user?.id) {
        await prisma.account.updateMany({
          where: { userId: user.id, provider: "google" },
          data: {
            access_token: account.access_token,
            expires_at: account.expires_at,
            scope: account.scope,
            ...(account.refresh_token && { refresh_token: account.refresh_token }),
          },
        });
      }

      return true; // Allow access
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      } else if (token?.sub) {
        const latestUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = latestUser?.role || token.role;
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
