"use client";

import { useActionState, useEffect } from "react";
import {
  Building2,
  Globe,
  Hash,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { updateOrgProfileAction, type ProfileState } from "./actions";

export type OrgProfileInitial = {
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  uf: string | null;
  cep: string | null;
  description: string | null;
  updatedAt: Date;
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

function InputWithIcon({
  id,
  name,
  defaultValue,
  type = "text",
  icon: Icon,
  placeholder,
  maxLength,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  icon: typeof Mail;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
    </div>
  );
}

export function ProfileForm({ initial }: { initial: OrgProfileInitial }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateOrgProfileAction,
    {},
  );
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) toast.success("Perfil atualizado.");
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Identidade visual</h2>
          <p className="text-xs text-slate-500">Logo e cores usadas no portal dos clientes</p>
        </header>
        <div className="flex items-start gap-5">
          <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <ImageIcon className="size-8" />
          </span>
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-semibold text-slate-900">Logo atual</p>
            <p className="text-xs text-slate-500">PNG ou SVG, máx. 2MB</p>
            <button
              type="button"
              disabled
              title="Upload em breve"
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="size-3.5" />
              Alterar logo
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">Dados da empresa</h2>
          <p className="text-xs text-slate-500">Informações cadastrais exibidas nos documentos e no portal</p>
        </header>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-700">
              Razão social
            </label>
            <InputWithIcon id="name" name="name" defaultValue={initial.name} icon={Building2} />
            <FieldError msg={f.name?.[0]} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cnpj" className="mb-1.5 block text-xs font-medium text-slate-700">
                CNPJ
              </label>
              <InputWithIcon
                id="cnpj"
                name="cnpj"
                defaultValue={initial.cnpj}
                icon={Hash}
                placeholder="00.000.000/0000-00"
              />
              <FieldError msg={f.cnpj?.[0]} />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-slate-700">
                Telefone
              </label>
              <InputWithIcon id="phone" name="phone" defaultValue={initial.phone} icon={Phone} />
              <FieldError msg={f.phone?.[0]} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-700">
                E-mail comercial
              </label>
              <InputWithIcon
                id="email"
                name="email"
                type="email"
                defaultValue={initial.email}
                icon={Mail}
              />
              <FieldError msg={f.email?.[0]} />
            </div>
            <div>
              <label htmlFor="website" className="mb-1.5 block text-xs font-medium text-slate-700">
                Website
              </label>
              <InputWithIcon
                id="website"
                name="website"
                defaultValue={initial.website}
                icon={Globe}
                placeholder="www.suaempresa.com.br"
              />
              <FieldError msg={f.website?.[0]} />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="mb-1.5 block text-xs font-medium text-slate-700">
              Endereço
            </label>
            <InputWithIcon id="address" name="address" defaultValue={initial.address} icon={MapPin} />
            <FieldError msg={f.address?.[0]} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-12">
            <div className="col-span-2 sm:col-span-6">
              <label htmlFor="city" className="mb-1.5 block text-xs font-medium text-slate-700">
                Cidade
              </label>
              <input
                id="city"
                name="city"
                defaultValue={initial.city ?? ""}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <FieldError msg={f.city?.[0]} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="uf" className="mb-1.5 block text-xs font-medium text-slate-700">
                UF
              </label>
              <input
                id="uf"
                name="uf"
                maxLength={2}
                defaultValue={initial.uf ?? ""}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm uppercase text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <FieldError msg={f.uf?.[0]} />
            </div>
            <div className="col-span-1 sm:col-span-4">
              <label htmlFor="cep" className="mb-1.5 block text-xs font-medium text-slate-700">
                CEP
              </label>
              <input
                id="cep"
                name="cep"
                defaultValue={initial.cep ?? ""}
                placeholder="00000-000"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              <FieldError msg={f.cep?.[0]} />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-xs font-medium text-slate-700">
              Descrição da empresa
            </label>
            <DescriptionTextarea defaultValue={initial.description ?? ""} />
            <FieldError msg={f.description?.[0]} />
          </div>
        </div>

        {state.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

        <div className="mt-5 flex flex-col items-start justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            Última atualização: {dateFmt.format(initial.updatedAt)}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </section>
    </form>
  );
}

function DescriptionTextarea({ defaultValue }: { defaultValue: string }) {
  const max = 500;
  return (
    <div className="relative">
      <textarea
        id="description"
        name="description"
        rows={3}
        maxLength={max}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
      <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">
        {defaultValue.length}/{max}
      </span>
    </div>
  );
}
