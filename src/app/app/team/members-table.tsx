"use client";

import { useState, useTransition } from "react";
import { Copy, MoreHorizontal, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { changeMemberRoleAction, removeMemberAction, resendInviteAction } from "./actions";

type MemberRow = {
  userId: string;
  name: string | null;
  email: string;
  role: "broker_admin" | "broker_staff";
  invited: boolean;
};

const ROLE_LABEL: Record<MemberRow["role"], string> = {
  broker_admin: "Administrador",
  broker_staff: "Equipe",
};

export function MembersTable({ members, selfUserId }: { members: MemberRow[]; selfUserId: string }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => (
            <MemberRowItem key={m.userId} member={m} isSelf={m.userId === selfUserId} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MemberRowItem({ member, isSelf }: { member: MemberRow; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const otherRole = member.role === "broker_admin" ? "broker_staff" : "broker_admin";

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          {member.name ?? "—"}
          {isSelf && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{member.email}</TableCell>
        <TableCell>
          <Badge variant="secondary">{ROLE_LABEL[member.role]}</Badge>
        </TableCell>
        <TableCell>
          {member.invited ? (
            <Badge variant="outline" className="text-xs">Convite pendente</Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-700 text-xs">Ativo</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Ações">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
                Tornar {ROLE_LABEL[otherRole]}
              </DropdownMenuItem>
              {member.invited && (
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
              <DropdownMenuSeparator />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {lastInviteUrl && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Novo link:</span>
              <code className="flex-1 truncate font-mono">{lastInviteUrl}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(lastInviteUrl);
                  toast.success("Link copiado.");
                }}
              >
                <Copy className="size-3" />
                Copiar
              </Button>
            </div>
          </TableCell>
        </TableRow>
      )}

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro?</DialogTitle>
            <DialogDescription>
              <strong>{member.name ?? member.email}</strong> perderá acesso a esta empresa. A conta de usuário em si não é apagada.
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
    </>
  );
}
