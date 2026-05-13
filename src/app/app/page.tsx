import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

export default async function AppHomePage() {
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo</h1>
        <p className="text-sm text-muted-foreground">
          Logado como {session?.user?.name ?? session?.user?.email} ·{" "}
          {session?.user?.activeRole ?? "sem papel"} ·{" "}
          org {session?.user?.activeOrgId?.slice(0, 8) ?? "—"}
        </p>
      </header>
      <p className="text-muted-foreground">
        Dashboard em construção. Próximos módulos: clientes, processos, timeline, documentos.
      </p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button variant="outline" type="submit">
          Sair
        </Button>
      </form>
    </main>
  );
}
