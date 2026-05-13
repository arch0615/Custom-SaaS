import type { NextAuthConfig } from "next-auth";

type MemberRole = "broker_admin" | "broker_staff" | "client";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user?.activeRole ?? null) as MemberRole | null;
      const path = nextUrl.pathname;

      const isAuthPage = path === "/login" || path === "/signup";
      const isApp = path.startsWith("/app");
      const isPortal = path.startsWith("/portal");

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL(role === "client" ? "/portal" : "/app", nextUrl));
        }
        return true;
      }

      if (isApp || isPortal) {
        if (!isLoggedIn) return false;
        if (isApp && role === "client") {
          return Response.redirect(new URL("/portal", nextUrl));
        }
        if (isPortal && role && role !== "client") {
          if (!nextUrl.searchParams.get("impersonate")) {
            return Response.redirect(new URL("/app", nextUrl));
          }
        }
        return true;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.activeOrgId = user.activeOrgId ?? null;
        token.activeRole = user.activeRole ?? null;
      }
      if (trigger === "update" && session) {
        if (session.activeOrgId !== undefined) token.activeOrgId = session.activeOrgId;
        if (session.activeRole !== undefined) token.activeRole = session.activeRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.activeOrgId = (token.activeOrgId ?? null) as string | null;
        session.user.activeRole = (token.activeRole ?? null) as MemberRole | null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
