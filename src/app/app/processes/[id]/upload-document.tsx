"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/data/documents-types";
import { uploadDocumentAction, type DocumentFormState } from "./document-actions";

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-sm text-destructive">{msg}</p>;
}

export function UploadDocument({ processId }: { processId: string }) {
  const [open, setOpen] = useState(false);
  const fileId = useId();
  const typeId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const action = (prev: DocumentFormState, fd: FormData) =>
    uploadDocumentAction(processId, prev, fd);

  const [state, formAction, pending] = useActionState<DocumentFormState, FormData>(action, {});
  const f = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) {
      toast.success("Documento enviado.");
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Adicionar documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar documento</DialogTitle>
          <DialogDescription>
            Anexe um arquivo ao processo. Tamanho máximo 25 MB.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={typeId}>Tipo *</Label>
            <Select name="type" defaultValue="invoice">
              <SelectTrigger id={typeId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ErrorText msg={f.type?.[0]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fileId}>Arquivo *</Label>
            <Input
              id={fileId}
              name="file"
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.tif,.tiff,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
            />
            <ErrorText msg={f.file?.[0]} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
