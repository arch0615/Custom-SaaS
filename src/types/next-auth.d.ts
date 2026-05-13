import "next-auth";
import "next-auth/jwt";

type MemberRole = "broker_admin" | "broker_staff" | "client";

declare module "next-auth" {
  interface User {
    activeOrgId?: string | null;
    activeRole?: MemberRole | null;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      activeOrgId: string | null;
      activeRole: MemberRole | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    activeOrgId?: string | null;
    activeRole?: MemberRole | null;
  }
}
