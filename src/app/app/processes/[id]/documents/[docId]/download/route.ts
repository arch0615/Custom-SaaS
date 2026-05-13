import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getDocumentForOrg } from "@/lib/data/documents";
import { storage } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: processId, docId } = await params;

  const doc = await getDocumentForOrg(session.user.activeOrgId, docId);
  if (!doc || doc.processId !== processId || doc.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const inline = request.nextUrl.searchParams.get("inline") === "1";
  const stored = await storage().get(doc.storageKey);

  return new NextResponse(stored.stream, {
    status: 200,
    headers: {
      "Content-Type": stored.contentType,
      "Content-Length": String(stored.size),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
