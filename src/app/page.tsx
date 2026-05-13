import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.activeRole === "client" ? "/portal" : "/app");
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col items-start justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Customs SaaS
      </h1>
      <p className="text-muted-foreground">
        Gestão de processos de importação e exportação para despachantes — clara, simples, focada em comunicação com o cliente.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/signup">Criar conta</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    </main>
  );
}
