import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Portal" };

export default async function PortalHomePage() {
  const session = await auth();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Portal do cliente</h1>
        <p className="text-sm text-muted-foreground">
          Logado como {session?.user?.name ?? session?.user?.email}
        </p>
      </header>
      <p className="text-muted-foreground">
        Em breve: status dos seus processos, linha do tempo e documentos.
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
