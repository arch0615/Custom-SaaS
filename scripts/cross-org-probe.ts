import "dotenv/config";
import { eq } from "drizzle-orm";

import { db, pool } from "../src/db/client";
import { users } from "../src/db/schema/auth";
import { organizations, orgMembers } from "../src/db/schema/organizations";
import { customers, customerContacts } from "../src/db/schema/customers";
import { processes } from "../src/db/schema/processes";
import { hashPassword } from "../src/lib/auth/password";
import {
  listCustomersForOrg,
  getCustomerForOrg,
  getCustomerForClientUser,
} from "../src/lib/data/customers";
import {
  listProcessesForOrg,
  getProcessForOrg,
} from "../src/lib/data/processes";
import { listDocumentsForProcess, getDocumentForOrg } from "../src/lib/data/documents";
import { listTimelineForProcess } from "../src/lib/data/timeline";

const PASSWORD = "probe-password-1234";

type Result = { name: string; pass: boolean; detail?: string };
const results: Result[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function uniqueEmail(prefix: string) {
  const stamp = Date.now().toString(36);
  return `${prefix}-${stamp}@probe.local`;
}

async function seedOrg(label: string) {
  const adminEmail = await uniqueEmail(`${label}-admin`);
  const clientEmail = await uniqueEmail(`${label}-client`);
  const passwordHash = await hashPassword(PASSWORD);

  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name: `Probe ${label}`, slug: `probe-${label}-${Date.now().toString(36)}` })
      .returning({ id: organizations.id });

    const [admin] = await tx
      .insert(users)
      .values({ name: `${label} admin`, email: adminEmail, passwordHash })
      .returning({ id: users.id });

    const [client] = await tx
      .insert(users)
      .values({ name: `${label} client`, email: clientEmail, passwordHash })
      .returning({ id: users.id });

    await tx.insert(orgMembers).values([
      { orgId: org.id, userId: admin.id, role: "broker_admin" },
      { orgId: org.id, userId: client.id, role: "client" },
    ]);

    const [customer] = await tx
      .insert(customers)
      .values({
        orgId: org.id,
        legalName: `Cliente ${label}`,
        cnpj: `99${Date.now().toString().slice(-12)}`,
        type: "importer",
      })
      .returning({ id: customers.id });

    await tx.insert(customerContacts).values({
      customerId: customer.id,
      name: `${label} contact`,
      email: clientEmail,
      canLogin: true,
      userId: client.id,
      isPrimary: true,
    });

    const [proc] = await tx
      .insert(processes)
      .values({
        orgId: org.id,
        customerId: customer.id,
        reference: `PROBE-${label}-${Date.now().toString(36)}`,
        modal: "maritime",
        stage: "docs_received",
        importerName: `Imp ${label}`,
        exporterName: `Exp ${label}`,
        origin: `${label}-origin`,
        destination: `${label}-dest`,
      })
      .returning({ id: processes.id });

    return {
      orgId: org.id,
      adminId: admin.id,
      clientId: client.id,
      customerId: customer.id,
      processId: proc.id,
    };
  });
}

async function main() {
  console.log("Seeding two isolated orgs...\n");
  const A = await seedOrg("A");
  const B = await seedOrg("B");

  console.log(`Org A: ${A.orgId.slice(0, 8)}…  Org B: ${B.orgId.slice(0, 8)}…\n`);
  console.log("Cross-org probes:");

  // customers
  const aCustomers = await listCustomersForOrg(A.orgId);
  const bCustomers = await listCustomersForOrg(B.orgId);
  check(
    "Org A's customer list contains only A's customers",
    aCustomers.every((c) => c.id === A.customerId),
  );
  check(
    "Org B's customer list contains only B's customers",
    bCustomers.every((c) => c.id === B.customerId),
  );

  // direct getById from the OTHER org
  const aTryingB = await getCustomerForOrg(A.orgId, B.customerId);
  check("Org A cannot fetch Org B's customer by id", aTryingB === null);
  const bTryingA = await getCustomerForOrg(B.orgId, A.customerId);
  check("Org B cannot fetch Org A's customer by id", bTryingA === null);

  // processes
  const aProcesses = await listProcessesForOrg(A.orgId);
  check(
    "Org A's process list contains only A's processes",
    aProcesses.every((p) => p.id === A.processId),
  );
  const aProcTryingB = await getProcessForOrg(A.orgId, B.processId);
  check("Org A cannot fetch Org B's process", aProcTryingB === null);

  // timeline
  const aTimelineForBProcess = await listTimelineForProcess(A.orgId, B.processId);
  check(
    "Org A's timeline query for B's process returns nothing",
    aTimelineForBProcess.length === 0,
  );

  // documents
  const aDocsForBProcess = await listDocumentsForProcess(A.orgId, B.processId);
  check(
    "Org A's document query for B's process returns nothing",
    aDocsForBProcess.length === 0,
  );

  // Insert a B document then try to fetch it as A
  const { documents } = await import("../src/db/schema/documents");
  const [bDoc] = await db
    .insert(documents)
    .values({
      orgId: B.orgId,
      processId: B.processId,
      type: "invoice",
      filename: "probe-b.pdf",
      storageKey: `org/${B.orgId}/process/${B.processId}/probe.pdf`,
      mimeType: "application/pdf",
      sizeBytes: 1,
      status: "active",
      uploadedBy: B.adminId,
    })
    .returning({ id: documents.id });
  const aGetBDoc = await getDocumentForOrg(A.orgId, bDoc.id);
  check("Org A cannot fetch Org B's document by id", aGetBDoc === null);

  // Client B's customer-lookup must point at B's customer only
  const clientBCust = await getCustomerForClientUser(B.orgId, B.clientId);
  check(
    "Client B's customer lookup returns Customer B",
    clientBCust?.customerId === B.customerId,
  );
  // Same user in wrong org should not match
  const clientBInOrgA = await getCustomerForClientUser(A.orgId, B.clientId);
  check("Client B has no customer in Org A's scope", clientBInOrgA === null);

  console.log("\nCleanup:");
  await db.delete(organizations).where(eq(organizations.id, A.orgId));
  await db.delete(organizations).where(eq(organizations.id, B.orgId));
  console.log("  Done.");

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} probes passed.`);
  if (failed.length > 0) {
    console.error("FAILED:");
    for (const f of failed) console.error("  -", f.name);
    process.exit(1);
  }
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
