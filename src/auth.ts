import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  accounts,
  authenticators,
  sessions,
  userCredentials,
  users,
  verificationTokens,
} from "@/db/schema";
import { accountMaySignIn, readAccountStatus } from "@/lib/account-status";
import { authenticateDevUser, isEntraConfigured } from "@/lib/dev-auth";
import { ensureProfile } from "@/lib/profile";
import type { DepartmentId, LearningLevel, UserRole } from "@/types";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = credentials?.email;
      const password = credentials?.password;

      if (typeof email !== "string" || typeof password !== "string") {
        return null;
      }

      return authenticateDevUser(email, password);
    },
  }),
];

if (isEntraConfigured()) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    })
  );
}

const authConfig: NextAuthConfig = {
  ...(process.env.DATABASE_URL
    ? {
        adapter: DrizzleAdapter(getDb(), {
          usersTable: users,
          accountsTable: accounts,
          sessionsTable: sessions,
          verificationTokensTable: verificationTokens,
          authenticatorsTable: authenticators,
        }),
      }
    : {}),
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth: session, request: { nextUrl } }) {
      const isLoggedIn = !!session?.user;
      const isDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isLogin = nextUrl.pathname.startsWith("/login");
      const isChangePassword = nextUrl.pathname === "/dashboard/change-password";

      if (isDashboard) {
        if (!isLoggedIn) return false;
        // Force password-change screen for new invitees until they set their own password
        if (session?.user?.mustChangePassword && !isChangePassword) {
          return Response.redirect(new URL("/dashboard/change-password", nextUrl));
        }
        return true;
      }

      if (isLogin && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    async signIn({ user }) {
      const status = await readAccountStatus(user.id, user.email);
      return accountMaySignIn(status);
    },
    async jwt({ token, user }) {
      if (user?.id && process.env.DATABASE_URL) {
        const profile = await ensureProfile(user.id);
        token.id = user.id;
        token.role = profile.role;
        token.department = profile.department;
        token.designation = profile.designation;
        token.level = profile.level;
        token.xp = profile.xp;
        token.coins = profile.coins;
        // Read must_change_password for admin-invited users
        const [cred] = await getDb()
          .select({ mustChangePassword: userCredentials.mustChangePassword })
          .from(userCredentials)
          .where(eq(userCredentials.userId, user.id))
          .limit(1);
        token.mustChangePassword = cred?.mustChangePassword ?? false;
      } else if (user?.id) {
        token.id = user.id;
      } else if (token.id && process.env.DATABASE_URL) {
        const profile = await ensureProfile(token.id as string);
        token.role = profile.role;
        token.department = profile.department;
        token.designation = profile.designation;
        token.level = profile.level;
        token.xp = profile.xp;
        token.coins = profile.coins;
        const [cred] = await getDb()
          .select({ mustChangePassword: userCredentials.mustChangePassword })
          .from(userCredentials)
          .where(eq(userCredentials.userId, token.id as string))
          .limit(1);
        token.mustChangePassword = cred?.mustChangePassword ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.department = token.department as DepartmentId;
        session.user.designation = token.designation as string;
        session.user.level = token.level as LearningLevel;
        session.user.xp = (token.xp as number) ?? 0;
        session.user.coins = (token.coins as number) ?? 0;
        session.user.mustChangePassword = (token.mustChangePassword as boolean | undefined) ?? false;
      }

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id && process.env.DATABASE_URL) {
        await ensureProfile(user.id);
      }
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
