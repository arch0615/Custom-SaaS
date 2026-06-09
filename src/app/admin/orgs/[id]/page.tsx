import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getAdminOrg } from "@/lib/data/admin-orgs";
import { OrgEditForm } from "./edit-form";

export const metadata = { title: "Empresa · Painel" };

export default async function AdminOrgEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getAdminOrg(id);
  if (!org) notFound();

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <Link
        href="/admin/orgs"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="size-4" />
        Voltar para empresas
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{org.name}</h1>
        <p className="text-sm text-slate-500">
          {org.memberCount} usuário{org.memberCount === 1 ? "" : "s"} ·{" "}
          {org.cnpj ? `CNPJ ${org.cnpj}` : "Sem CNPJ"}
        </p>
      </header>

      <OrgEditForm
        orgId={org.id}
        initial={{
          name: org.name,
          plan: org.plan,
          status: org.status,
          planExpiresAt: org.planExpiresAt ? org.planExpiresAt.toISOString().slice(0, 10) : "",
          trackingAuto: !!org.features.tracking_auto,
          suspensionReason: org.suspensionReason ?? "",
        }}
      />
    </div>
  );
}
