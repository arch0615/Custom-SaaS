import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { getCustomerForOrg } from "@/lib/data/customers";
import { formatCNPJ } from "@/lib/cnpj";
import { CUSTOMER_TYPE_LABEL } from "@/lib/labels";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerEditTab } from "./edit-tab";
import { DeleteCustomerButton } from "./delete-button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const c = await getCustomerForOrg(session.orgId, id);
  return { title: c?.legalName ?? "Cliente" };
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  const customer = await getCustomerForOrg(session.orgId, id);
  if (!customer) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href="/app/customers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Voltar para clientes
        </Link>
      </div>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{customer.legalName}</h1>
            <Badge variant="secondary">{CUSTOMER_TYPE_LABEL[customer.type]}</Badge>
            {customer.deletedAt && <Badge variant="destructive">Inativo</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            CNPJ <span className="font-mono">{formatCNPJ(customer.cnpj)}</span>
            {customer.tradeName ? <> · {customer.tradeName}</> : null}
          </p>
        </div>
        {!customer.deletedAt && <DeleteCustomerButton id={customer.id} name={customer.legalName} />}
      </header>

      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="processes">Processos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-6">
          <CustomerEditTab customer={customer} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Em construção</CardTitle>
              <CardDescription>
                Cadastro de contatos adicionais com opção de conceder acesso ao portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Próximo módulo.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Em construção</CardTitle>
              <CardDescription>Listagem dos processos vinculados a este cliente.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Disponível após o módulo de Processos entrar.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Em construção</CardTitle>
              <CardDescription>
                Documentos compartilhados entre processos deste cliente.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Próximo módulo.</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
