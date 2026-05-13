import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { organizations } from "@/db/schema/organizations";

export type MemberRole = "broker_admin" | "broker_staff" | "client";

export type ActiveSession = {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  orgId: string;
  orgName: string;
  role: MemberRole;
};

export async function requireSession(): Promise<ActiveSession> {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId || !session.user.activeRole) {
    redirect("/login");
  }

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, session.user.activeOrgId))
    .limit(1);

  if (!org) redirect("/login");

  return {
    userId: session.user.id,
    userName: session.user.name ?? null,
    userEmail: session.user.email ?? null,
    orgId: org.id,
    orgName: org.name,
    role: session.user.activeRole,
  };
}
