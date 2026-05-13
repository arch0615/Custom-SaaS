import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Portal" };

export default function PortalHomePage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Seus processos</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o andamento de cada importação ou exportação.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sem processos ainda</CardTitle>
          <CardDescription>
            Assim que o despachante cadastrar um processo em seu nome, ele aparecerá aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Em cada processo você verá a etapa atual, a linha do tempo e os documentos disponíveis.
        </CardContent>
      </Card>
    </div>
  );
}
