"use client";

import { usePathname } from "next/navigation";

const TITLE_MAP: Array<[RegExp, string]> = [
  [/^\/app$/, "Dashboard"],
  [/^\/app\/processes\/new/, "Novo processo"],
  [/^\/app\/processes\/[^/]+/, "Processo"],
  [/^\/app\/processes/, "Processos"],
  [/^\/app\/customers\/new/, "Novo cliente"],
  [/^\/app\/customers\/[^/]+/, "Cliente"],
  [/^\/app\/customers/, "Clientes"],
  [/^\/app\/team/, "Equipe"],
  [/^\/app\/settings/, "Configurações"],
  [/^\/app\/profile/, "Perfil"],
];

export function TopbarTitle() {
  const pathname = usePathname();
  const match = TITLE_MAP.find(([re]) => re.test(pathname));
  const title = match?.[1] ?? "AduanaSync";
  return <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">{title}</h1>;
}
