import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getDocumentForOrg } from "@/lib/data/documents";
import { storage } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allowed = rateLimit({
    bucket: `download:${session.user.id}`,
    max: 30,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { docId } = await params;

  const doc = await getDocumentForOrg(session.user.activeOrgId, docId);
  if (!doc || doc.deletedAt || doc.status === "deleted") {
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
