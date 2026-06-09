import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Bell, Building2, ShieldCheck } from "lucide-react";

import { requireSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/db/client";
import { organizations } from "@/db/schema/organizations";
import { getPreferencesForUser } from "@/lib/data/notifications";
import {
  NOTIFICATION_DEFAULTS,
  type NotificationKind,
} from "@/lib/data/notifications-types";

import { ProfileForm } from "./profile-form";
import { NotificationsTab, type EmailPrefs } from "./notifications-tab";
import { SecurityTab } from "./security-tab";

export const metadata = { title: "Configurações" };

type Tab = "profile" | "notifications" | "security";

const TABS: Array<{ key: Tab; label: string; icon: typeof Building2 }> = [
  { key: "profile", label: "Perfil da empresa", icon: Building2 },
  { key: "notifications", label: "Notificações", icon: Bell },
  { key: "security", label: "Segurança", icon: ShieldCheck },
];

function isTab(v: string | undefined): v is Tab {
  return v === "profile" || v === "notifications" || v === "security";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  if (!hasPermission(session.role, "settings:org_profile")) redirect("/app");

  const { tab: tabParam } = await searchParams;
  const tab: Tab = isTab(tabParam) ? tabParam : "profile";

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.orgId))
    .limit(1);

  if (!org) redirect("/app");

  let prefs: EmailPrefs = {};
  if (tab === "notifications") {
    const map = await getPreferencesForUser(session.userId);
    prefs = Object.fromEntries(map.entries()) as EmailPrefs;
  }

  return (
    <div className="mx-auto w-full space-y-5 px-6 py-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">
          Gerencie os dados da empresa, preferências e segurança da conta
        </p>
      </header>

      <nav className="inline-flex w-full max-w-md items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <Link
              key={key}
              href={`/app/settings?tab=${key}`}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {tab === "profile" && (
        <ProfileForm
          initial={{
            name: org.name,
            cnpj: org.cnpj,
            phone: org.phone,
            email: org.email,
            website: org.website,
            address: org.address,
            city: org.city,
            uf: org.uf,
            cep: org.cep,
            description: org.description,
            updatedAt: org.updatedAt,
          }}
        />
      )}

      {tab === "notifications" && (
        <NotificationsTab
          userEmail={session.userEmail ?? "—"}
          prefs={prefs}
          defaults={NOTIFICATION_DEFAULTS as Record<NotificationKind, { email: boolean; inApp: boolean }>}
        />
      )}

      {tab === "security" && (
        <SecurityTab passwordChangedAt={null} currentSessionAgent="Navegador atual" />
      )}
    </div>
  );
}
