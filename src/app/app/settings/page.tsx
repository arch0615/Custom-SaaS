import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const session = await requireSession();
  if (session.role !== "broker_admin") redirect("/app");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Configure os dados da sua empresa.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em construção</CardTitle>
          <CardDescription>
            Nome da empresa, logo, preferências de notificação padrão.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Disponível para administradores.
        </CardContent>
      </Card>
    </div>
  );
}
