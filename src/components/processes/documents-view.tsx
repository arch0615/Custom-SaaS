import { FileText, FileSpreadsheet, Image as ImageIcon, File as FileIcon } from "lucide-react";
import {
  DOCUMENT_TYPE_ORDER,
  DOCUMENT_TYPE_LABEL,
  formatBytes,
  groupDocumentsByType,
  type DocumentRow,
} from "@/lib/data/documents";
import { Badge } from "@/components/ui/badge";
import { DocumentRowActions } from "@/app/app/processes/[id]/document-row-actions";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function MimeIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <ImageIcon className="size-4 text-muted-foreground" />;
  if (mime.includes("pdf")) return <FileText className="size-4 text-red-600" />;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv"))
    return <FileSpreadsheet className="size-4 text-emerald-600" />;
  return <FileIcon className="size-4 text-muted-foreground" />;
}

export function DocumentsView({
  processId,
  rows,
  canWrite,
}: {
  processId: string;
  rows: DocumentRow[];
  canWrite: boolean;
}) {
  const groups = groupDocumentsByType(rows);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum documento enviado ainda.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {DOCUMENT_TYPE_ORDER.map((type) => {
        const items = groups.get(type)!;
        if (items.length === 0) return null;
        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">{DOCUMENT_TYPE_LABEL[type]}</h3>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <ul className="divide-y">
                {items.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <MimeIcon mime={doc.mimeType} />
                      <div className="min-w-0 flex-1">
                        <a
                          href={`/app/processes/${processId}/documents/${doc.id}/download`}
                          className="block truncate text-sm font-medium hover:underline"
                          title={doc.filename}
                        >
                          {doc.filename}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(doc.sizeBytes)} · enviado por{" "}
                          {doc.uploadedByName ?? "usuário"} · {dateFmt.format(doc.uploadedAt)}
                          {doc.status === "pending_review" && (
                            <Badge variant="outline" className="ml-2 text-xs">Aguardando revisão</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    {canWrite && (
                      <DocumentRowActions
                        processId={processId}
                        documentId={doc.id}
                        filename={doc.filename}
                        downloadUrl={`/app/processes/${processId}/documents/${doc.id}/download`}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
