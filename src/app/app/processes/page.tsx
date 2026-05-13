import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Processos" };

export default function ProcessesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Processos</h1>
        <p className="text-sm text-muted-foreground">
          Gestão de processos de importação e exportação.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em construção</CardTitle>
          <CardDescription>
            Cadastro com 14+ campos aduaneiros, timeline e documentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Etapas: Documentação Recebida → Embarque → Em Trânsito → Desembaraço → Liberado → Entrega Finalizada.
        </CardContent>
      </Card>
    </div>
  );
}
