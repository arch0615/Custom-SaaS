"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Link copiado.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar. Selecione e copie manualmente.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? "Copiado" : label}
    </button>
  );
}
