import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const session = await requireSession();
  if (session.role !== "broker_admin") redirect("/app");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Dados da sua empresa. Logo, preferências de notificação e etapas customizadas chegam em breve.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresa</CardTitle>
          <CardDescription>
            O nome aparece no topo do app, no portal do cliente e nos e-mails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm orgName={session.orgName} />
        </CardContent>
      </Card>
    </div>
  );
}
