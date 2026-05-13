"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { Download, MoreHorizontal, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteDocumentAction,
  replaceDocumentAction,
  type DocumentFormState,
} from "./document-actions";

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

export function DocumentRowActions({
  processId,
  documentId,
  filename,
  downloadUrl,
}: {
  processId: string;
  documentId: string;
  filename: string;
  downloadUrl: string;
}) {
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, startDelete] = useTransition();
  const fileId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const replaceAct = (prev: DocumentFormState, fd: FormData) =>
    replaceDocumentAction(processId, documentId, prev, fd);
  const [state, replaceFormAction, pendingReplace] = useActionState<DocumentFormState, FormData>(
    replaceAct,
    {},
  );

  useEffect(() => {
    if (state.success) {
      toast.success("Documento substituído.");
      setReplaceOpen(false);
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Mais ações">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <a href={downloadUrl}>
              <Download className="mr-2 size-4" />
              Baixar
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setReplaceOpen(true); }}>
            <RefreshCcw className="mr-2 size-4" />
            Reenviar
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setDeleteOpen(true); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Remover
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar documento</DialogTitle>
            <DialogDescription>
              Envie uma nova versão de <strong>{filename}</strong>. A versão antiga fica arquivada
              como referência.
            </DialogDescription>
          </DialogHeader>
          <form ref={formRef} action={replaceFormAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={fileId}>Novo arquivo *</Label>
              <Input id={fileId} name="file" type="file" required />
              <ErrorText msg={state.fieldErrors?.file?.[0]} />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={pendingReplace}>
                {pendingReplace ? "Enviando..." : "Substituir"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover documento?</DialogTitle>
            <DialogDescription>
              <strong>{filename}</strong> não ficará mais visível, mas o evento de remoção entra na
              linha do tempo para auditoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pendingDelete}
              onClick={() =>
                startDelete(async () => {
                  try {
                    await deleteDocumentAction(processId, documentId);
                    toast.success("Documento removido.");
                    setDeleteOpen(false);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Falha ao remover.");
                  }
                })
              }
            >
              {pendingDelete ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
