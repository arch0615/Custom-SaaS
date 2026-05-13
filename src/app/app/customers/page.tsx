import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Clientes" };

export default function CustomersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Cadastro e gestão de importadores, exportadores e seus contatos.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Em construção</CardTitle>
          <CardDescription>
            O CRUD de clientes é o próximo módulo a ser entregue.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Campos previstos: razão social, CNPJ, nome fantasia, contatos, tipo (importador/exportador), observações.
        </CardContent>
      </Card>
    </div>
  );
}
