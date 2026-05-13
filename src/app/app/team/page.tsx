import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { listOrgTeamMembers } from "@/lib/data/members";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InvitePanel } from "./invite-panel";
import { MembersTable } from "./members-table";

export const metadata = { title: "Equipe" };

export default async function TeamPage() {
  const session = await requireSession();
  if (session.role !== "broker_admin") redirect("/app");

  const members = await listOrgTeamMembers(session.orgId);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
        <p className="text-sm text-muted-foreground">
          Convide membros, gerencie papéis e remova acessos.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convidar novo membro</CardTitle>
          <CardDescription>
            O convite chega por e-mail (se Resend estiver configurado) e o link aparece aqui para você poder copiar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitePanel />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Membros</CardTitle>
        </CardHeader>
        <CardContent>
          <MembersTable
            members={members
              .filter((m) => m.role !== "client")
              .map((m) => ({
                userId: m.userId,
                name: m.name,
                email: m.email,
                role: m.role as "broker_admin" | "broker_staff",
                invited: m.invited,
              }))}
            selfUserId={session.userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
