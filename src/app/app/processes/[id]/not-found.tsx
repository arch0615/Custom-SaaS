import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProcessNotFound() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-12 text-center">
      <h1 className="text-xl font-semibold">Processo não encontrado</h1>
      <p className="text-sm text-muted-foreground">
        O processo que você tentou abrir não existe ou foi removido.
      </p>
      <Button asChild>
        <Link href="/app/processes">Voltar para processos</Link>
      </Button>
    </div>
  );
}
