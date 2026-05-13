"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Copy, KeyRound, MoreHorizontal, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addContactAction,
  deleteContactAction,
  resendContactInviteAction,
  type ContactState,
} from "@/app/app/customers/[id]/contacts-actions";

type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  canLogin: boolean;
  userActivated: boolean;
  isPrimary: boolean;
};

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

export function ContactsTab({
  customerId,
  contacts,
}: {
  customerId: string;
  contacts: ContactRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <p className="text-sm text-muted-foreground">
          {contacts.length === 0
            ? "Adicione contatos do cliente. Marque ‘Acesso ao portal’ para enviar convite por e-mail."
            : `${contacts.length} contato${contacts.length === 1 ? "" : "s"}.`}
        </p>
        <AddContactDialog customerId={customerId} />
      </div>

      {contacts.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <ContactRowItem key={c.id} customerId={customerId} contact={c} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AddContactDialog({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [canLogin, setCanLogin] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const action = (prev: ContactState, fd: FormData) => addContactAction(customerId, prev, fd);
  const [state, formAction, pending] = useActionState<ContactState, FormData>(action, {});
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) {
      toast.success(state.inviteUrl ? "Contato criado e convite gerado." : "Contato criado.");
      formRef.current?.reset();
      setCanLogin(false);
      if (state.inviteUrl) setLastUrl(state.inviteUrl);
      else setOpen(false);
    }
  }, [state.success, state.inviteUrl]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setLastUrl(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Adicionar contato
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo contato</DialogTitle>
          <DialogDescription>
            Pessoa do cliente que pode receber atualizações e (opcionalmente) acessar o portal.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" name="name" required />
            <ErrorText msg={f.name?.[0]} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" />
              <ErrorText msg={f.email?.[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" />
              <ErrorText msg={f.phone?.[0]} />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="canLogin"
              name="canLogin"
              checked={canLogin}
              onChange={(e) => setCanLogin(e.target.checked)}
              className="mt-1 size-4"
            />
            <div>
              <Label htmlFor="canLogin" className="cursor-pointer">
                Acesso ao portal
              </Label>
              <p className="text-xs text-muted-foreground">
                Envia um convite por e-mail para o contato definir senha e acompanhar os processos.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" id="isPrimary" name="isPrimary" className="mt-1 size-4" />
            <Label htmlFor="isPrimary" className="cursor-pointer">
              Marcar como contato principal
            </Label>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          {lastUrl && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Link do convite (expira em 72h):</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 truncate font-mono text-xs">{lastUrl}</code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(lastUrl);
                    toast.success("Link copiado.");
                  }}
                >
                  <Copy className="size-3.5" />
                  Copiar
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Fechar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContactRowItem({ customerId, contact }: { customerId: string; contact: ContactRow }) {
  const [pending, startTransition] = useTransition();
  const [removeOpen, setRemoveOpen] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          {contact.name}
          {contact.isPrimary && (
            <Badge variant="outline" className="ml-2 text-xs">
              Principal
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">{contact.email ?? "—"}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{contact.phone ?? "—"}</TableCell>
        <TableCell>
          {contact.canLogin ? (
            contact.userActivated ? (
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-700 text-xs">
                Ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Convite pendente</Badge>
            )
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
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
              {contact.email && (
                <DropdownMenuItem
                  disabled={pending}
                  onSelect={(e) => {
                    e.preventDefault();
                    startTransition(async () => {
                      try {
                        const r = await resendContactInviteAction(customerId, contact.id);
                        setLastUrl(r.inviteUrl);
                        toast.success("Convite enviado.");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Falha ao convidar.");
                      }
                    });
                  }}
                >
                  <KeyRound className="mr-2 size-4" />
                  {contact.canLogin ? "Reenviar convite" : "Conceder acesso ao portal"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setRemoveOpen(true);
                }}
              >
                <Trash2 className="mr-2 size-4" />
                Remover contato
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {lastUrl && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/40 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Link:</span>
              <code className="flex-1 truncate font-mono">{lastUrl}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(lastUrl);
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
            <DialogTitle>Remover contato?</DialogTitle>
            <DialogDescription>
              <strong>{contact.name}</strong> não receberá mais notificações
              {contact.canLogin && " e perderá o acesso ao portal"}.
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
                    await deleteContactAction(customerId, contact.id);
                    setRemoveOpen(false);
                    toast.success("Contato removido.");
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
