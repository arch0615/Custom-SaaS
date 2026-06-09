"use client";

import { useState, useTransition } from "react";
import {
  Calendar,
  Copy,
  FolderOpen,
  Mail,
  MoreHorizontal,
  RefreshCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { changeMemberRoleAction, removeMemberAction, resendInviteAction } from "./actions";

export type MemberCardData = {
  userId: string;
  name: string | null;
  email: string;
  role: "broker_admin" | "broker_staff";
  invited: boolean;
  joinedAt: Date;
  processesTouched: number;
};

const ROLE_LABEL: Record<MemberCardData["role"], string> = {
  broker_admin: "Administrador",
  broker_staff: "Equipe",
};

const ROLE_TONE: Record<MemberCardData["role"], { wrap: string; dot: string }> = {
  broker_admin: {
    wrap: "bg-primary/10 text-primary ring-1 ring-primary/20",
    dot: "bg-primary",
  },
  broker_staff: {
    wrap: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    dot: "bg-amber-500",
  },
};

const AVATAR_PALETTE = [
  "bg-primary",
  "bg-primary/100",
  "bg-blue-600",
  "bg-red-500",
  "bg-orange-500",
  "bg-emerald-600",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-slate-500",
];

function avatarBg(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsOf(name: string | null, email: string): string {
  const source = name?.trim() || email.split("@")[0] || "?";
  const words = source.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const joinFmt = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" });

function formatJoinDate(d: Date): string {
  const formatted = joinFmt.format(d).replace(".", "");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function MemberCard({
  member,
  isSelf,
  canChangeRole,
  canRemove,
  canResendInvite,
}: {
  member: MemberCardData;
  isSelf: boolean;
  canChangeRole: boolean;
  canRemove: boolean;
  canResendInvite: boolean;
}) {
  const showMenu = canChangeRole || canRemove || (canResendInvite && member.invited);
  const [pending, startTransition] = useTransition();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const otherRole = member.role === "broker_admin" ? "broker_staff" : "broker_admin";
  const roleTone = ROLE_TONE[member.role];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg ${avatarBg(member.userId)} text-sm font-semibold text-white`}
        >
          {initialsOf(member.name, member.email)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {member.name ?? "—"}
                {isSelf && <span className="ml-2 text-xs font-normal text-slate-400">(você)</span>}
              </h3>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                <Mail className="size-3.5" />
                <span className="truncate">{member.email}</span>
              </p>
            </div>
            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 shrink-0" aria-label="Ações">
                    <MoreHorizontal className="size-4 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {canChangeRole && (
                    <DropdownMenuItem
                      disabled={isSelf || pending}
                      onSelect={(e) => {
                        e.preventDefault();
                        startTransition(async () => {
                          const fd = new FormData();
                          fd.set("role", otherRole);
                          try {
                            await changeMemberRoleAction(member.userId, fd);
                            toast.success(`Papel alterado para ${ROLE_LABEL[otherRole]}.`);
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Falha ao alterar papel.");
                          }
                        });
                      }}
                    >
                      <ShieldCheck className="mr-2 size-4" />
                      Tornar {ROLE_LABEL[otherRole]}
                    </DropdownMenuItem>
                  )}
                  {canResendInvite && member.invited && (
                    <DropdownMenuItem
                      disabled={pending}
                      onSelect={(e) => {
                        e.preventDefault();
                        startTransition(async () => {
                          try {
                            const r = await resendInviteAction(member.email);
                            setLastInviteUrl(r.inviteUrl);
                            toast.success("Convite reenviado.");
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Falha ao reenviar.");
                          }
                        });
                      }}
                    >
                      <RefreshCcw className="mr-2 size-4" />
                      Reenviar convite
                    </DropdownMenuItem>
                  )}
                  {canRemove && (
                    <>
                      {canChangeRole && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={isSelf}
                        onSelect={(e) => {
                          e.preventDefault();
                          setRemoveOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Remover do grupo
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${roleTone.wrap}`}
            >
              <span className={`size-1.5 rounded-full ${roleTone.dot}`} />
              {ROLE_LABEL[member.role]}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                member.invited
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              }`}
            >
              <span className={`size-1.5 rounded-full ${member.invited ? "bg-amber-500" : "bg-emerald-500"}`} />
              {member.invited ? "Pendente" : "Ativo"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <FolderOpen className="size-3.5 text-slate-400" />
            {member.processesTouched} processo{member.processesTouched === 1 ? "" : "s"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3.5 text-slate-400" />
          Entrou em {formatJoinDate(member.joinedAt)}
        </span>
      </div>

      {lastInviteUrl && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-600">
            {lastInviteUrl}
          </code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 text-xs"
            onClick={async () => {
              await navigator.clipboard.writeText(lastInviteUrl);
              toast.success("Link copiado.");
            }}
          >
            <Copy className="size-3" />
            Copiar
          </Button>
        </div>
      )}

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro?</DialogTitle>
            <DialogDescription>
              <strong>{member.name ?? member.email}</strong> perderá acesso a esta empresa. A conta
              de usuário em si não é apagada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    await removeMemberAction(member.userId);
                    setRemoveOpen(false);
                    toast.success("Membro removido.");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Falha ao remover.");
                  }
                })
              }
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
