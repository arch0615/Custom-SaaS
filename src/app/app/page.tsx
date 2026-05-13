import { requireSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard" };

export default async function AppHomePage() {
  const session = await requireSession();

  const cards = [
    { label: "Processos em aberto", value: "—" },
    { label: "Atrasados", value: "—" },
    { label: "Concluídos no mês", value: "—" },
    { label: "Documentos para revisar", value: "—" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo, {session.userName ?? session.userEmail}.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximas chegadas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sem processos cadastrados ainda. Crie o primeiro em <strong>Processos</strong>.
        </CardContent>
      </Card>
    </div>
  );
}
