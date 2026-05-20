import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";

import { db, pool } from "../src/db/client";
import { organizations, orgMembers } from "../src/db/schema/organizations";
import { customers, customerContacts } from "../src/db/schema/customers";
import { processes } from "../src/db/schema/processes";
import { timelineEvents } from "../src/db/schema/timeline";
import { documents } from "../src/db/schema/documents";
import { users } from "../src/db/schema/auth";

/**
 * Populate a demo org with realistic customs-broker data so the UI doesn't
 * look empty during client demos. Idempotent-ish: skips customers whose CNPJ
 * already exists in the org.
 *
 * Usage: pnpm tsx scripts/seed-demo.ts [--org "<Org Name>"]
 */

type Args = { org: string };
function parseArgs(argv: string[]): Args {
  const out: Args = { org: "Aduanasync Test" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--org") out.org = argv[i + 1] ?? out.org;
  }
  return out;
}

const STORAGE_DIR = process.env.STORAGE_LOCAL_DIR ?? "/home/customs-saas/.storage";

// Minimal valid PDF (~250 bytes) used as placeholder for demo documents.
const PDF_BLOB = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n" +
    "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n" +
    "xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000054 00000 n \n0000000101 00000 n \n" +
    "trailer<</Size 4/Root 1 0 R>>\nstartxref\n145\n%%EOF\n",
);

const CUSTOMERS: Array<{
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  city: string;
  type: "importer" | "exporter" | "both";
  contact: { name: string; email: string; phone: string; canLogin: boolean };
}> = [
  {
    legalName: "Importadora Soluções Ltda.",
    tradeName: "ISolutions",
    cnpj: "12345678000190",
    email: "contato@importadorasolucoes.com.br",
    phone: "(11) 3456-7890",
    city: "São Paulo",
    type: "importer",
    contact: {
      name: "Carlos Mendes",
      email: "carlos@importadorasolucoes.com.br",
      phone: "(11) 3456-7890",
      canLogin: true,
    },
  },
  {
    legalName: "ExportaBrasil S.A.",
    tradeName: "ExportaBrasil",
    cnpj: "23456789000101",
    email: "contato@exportabrasil.com.br",
    phone: "(21) 2345-6789",
    city: "Rio de Janeiro",
    type: "exporter",
    contact: {
      name: "Fernanda Lima",
      email: "fernanda@exportabrasil.com.br",
      phone: "(21) 2345-6789",
      canLogin: true,
    },
  },
  {
    legalName: "Logística Global Ltda.",
    tradeName: "Logística Global",
    cnpj: "34567890000112",
    email: "ops@logisticaglobal.com.br",
    phone: "(31) 3456-7890",
    city: "Belo Horizonte",
    type: "both",
    contact: {
      name: "Roberto Souza",
      email: "roberto@logisticaglobal.com.br",
      phone: "(31) 3456-7890",
      canLogin: false,
    },
  },
  {
    legalName: "Metalúrgica Norte Ltda.",
    tradeName: "Metalúrgica Norte",
    cnpj: "45678901000123",
    email: "contato@metalurgicanorte.com.br",
    phone: "(41) 4567-8901",
    city: "Curitiba",
    type: "importer",
    contact: {
      name: "Ana Paula Costa",
      email: "ana@metalurgicanorte.com.br",
      phone: "(41) 4567-8901",
      canLogin: false,
    },
  },
  {
    legalName: "TecnoImport EIRELI",
    tradeName: "TecnoImport",
    cnpj: "56789012000134",
    email: "contato@tecnimport.com.br",
    phone: "(11) 5678-9012",
    city: "São Paulo",
    type: "importer",
    contact: {
      name: "Bruno Oliveira",
      email: "bruno@tecnimport.com.br",
      phone: "(11) 5678-9012",
      canLogin: false,
    },
  },
  {
    legalName: "AgroExport Brasil",
    tradeName: "AgroExport",
    cnpj: "67890123000145",
    email: "comercial@agroexport.com.br",
    phone: "(51) 6789-0123",
    city: "Porto Alegre",
    type: "exporter",
    contact: {
      name: "Juliana Martins",
      email: "juliana@agroexport.com.br",
      phone: "(51) 6789-0123",
      canLogin: true,
    },
  },
  {
    legalName: "Construtora Panorama",
    tradeName: "Panorama",
    cnpj: "78901234000156",
    email: "compras@panorama.com.br",
    phone: "(11) 7890-1234",
    city: "São Paulo",
    type: "importer",
    contact: {
      name: "Pedro Henrique",
      email: "pedro@panorama.com.br",
      phone: "(11) 7890-1234",
      canLogin: false,
    },
  },
  {
    legalName: "Química Sul Ltda.",
    tradeName: "Química Sul",
    cnpj: "89012345000167",
    email: "contato@quimicasul.com.br",
    phone: "(48) 8901-2345",
    city: "Florianópolis",
    type: "importer",
    contact: {
      name: "Mariana Torres",
      email: "mariana@quimicasul.com.br",
      phone: "(48) 8901-2345",
      canLogin: false,
    },
  },
];

type StageKey =
  | "aguarda_prontidao_carga"
  | "aguarda_booking"
  | "aguarda_draft"
  | "aguarda_aprovacao_draft"
  | "aguarda_draft_atualizado"
  | "aguarda_embarque"
  | "aguarda_hbl_final"
  | "aguarda_transbordo"
  | "aguarda_desconsolidacao"
  | "aguarda_chegada"
  | "atracado"
  | "liberado"
  | "aguarda_pagamento"
  | "pago";

type ProcessSeed = {
  customerIdx: number;
  modal: "maritime" | "air";
  stage: StageKey;
  origin: string;
  destination: string;
  /** Days from today (negative = past). */
  shipmentDays: number;
  arrivalDays: number;
  containerNumber?: string;
  hbl?: string;
  mbl?: string;
  carrier?: string;
  vessel?: string;
  incoterm?: "FOB" | "CIF" | "EXW" | "CFR" | "DAP";
  invoiceUSD?: number;
  ncm?: string;
};

const PROCESSES: ProcessSeed[] = [
  // Customer 0 — Importadora Soluções (3 ativos, 12 total visual count)
  { customerIdx: 0, modal: "maritime", stage: "atracado", origin: "SHA — Shanghai", destination: "SSZ — Santos", shipmentDays: -32, arrivalDays: -2, containerNumber: "MSCU1234567", hbl: "HBL-2026-0142", mbl: "MAEU567890", carrier: "Maersk", vessel: "Maersk Saigon", incoterm: "CIF", invoiceUSD: 87500, ncm: "8517.62.41" },
  { customerIdx: 0, modal: "maritime", stage: "aguarda_chegada", origin: "HKG — Hong Kong", destination: "SSZ — Santos", shipmentDays: -18, arrivalDays: 8, containerNumber: "TCLU2233445", hbl: "HBL-2026-0151", mbl: "MAEU679012", carrier: "MSC", vessel: "MSC Bruxelles", incoterm: "FOB", invoiceUSD: 124000, ncm: "8528.72.00" },
  { customerIdx: 0, modal: "air", stage: "liberado", origin: "FRA — Frankfurt", destination: "GRU — Guarulhos", shipmentDays: -10, arrivalDays: -7, hbl: "HAWB-2026-0033", carrier: "Lufthansa Cargo", vessel: "LH8234", incoterm: "DAP", invoiceUSD: 22000, ncm: "9018.50.00" },

  // Customer 1 — ExportaBrasil (2 ativos, 28 total)
  { customerIdx: 1, modal: "maritime", stage: "aguarda_embarque", origin: "SSZ — Santos", destination: "ROT — Rotterdam", shipmentDays: 3, arrivalDays: 30, hbl: "HBL-2026-0162", mbl: "CMAU112233", carrier: "CMA CGM", vessel: "CMA CGM Marco Polo", incoterm: "CFR", invoiceUSD: 460000, ncm: "1701.14.00" },
  { customerIdx: 1, modal: "maritime", stage: "aguarda_chegada", origin: "PNG — Paranaguá", destination: "HKG — Hong Kong", shipmentDays: -20, arrivalDays: 15, containerNumber: "GESU4488991", hbl: "HBL-2026-0148", mbl: "HLCU998877", carrier: "Hapag-Lloyd", vessel: "Yantian Express", incoterm: "FOB", invoiceUSD: 310000, ncm: "0901.21.00" },

  // Customer 2 — Logística Global (1 ativo, 8 total)
  { customerIdx: 2, modal: "air", stage: "aguarda_chegada", origin: "MIA — Miami", destination: "GRU — Guarulhos", shipmentDays: -2, arrivalDays: 1, hbl: "HAWB-2026-0041", carrier: "American Airlines Cargo", vessel: "AA909", incoterm: "EXW", invoiceUSD: 18500, ncm: "8471.30.12" },

  // Customer 3 — Metalúrgica Norte (delayed)
  { customerIdx: 3, modal: "maritime", stage: "aguarda_chegada", origin: "BCN — Barcelona", destination: "ITJ — Itajaí", shipmentDays: -45, arrivalDays: -3, containerNumber: "MSKU5566778", hbl: "HBL-2026-0089", mbl: "MAEU443322", carrier: "Maersk", vessel: "Maersk Niagara", incoterm: "CIF", invoiceUSD: 215000, ncm: "7208.10.00" },

  // Customer 4 — TecnoImport (mixed)
  { customerIdx: 4, modal: "air", stage: "atracado", origin: "PVG — Shanghai PVG", destination: "GRU — Guarulhos", shipmentDays: -8, arrivalDays: -4, hbl: "HAWB-2026-0048", carrier: "China Cargo Airlines", vessel: "CK216", incoterm: "FOB", invoiceUSD: 56000, ncm: "8541.10.99" },
  { customerIdx: 4, modal: "maritime", stage: "aguarda_prontidao_carga", origin: "SHA — Shanghai", destination: "SSZ — Santos", shipmentDays: 6, arrivalDays: 38, hbl: "HBL-2026-0171", mbl: "MAEU991234", carrier: "Maersk", vessel: "Maersk Detroit", incoterm: "FOB", invoiceUSD: 73000, ncm: "8504.40.90" },

  // Customer 5 — AgroExport (export, delivered + in transit)
  { customerIdx: 5, modal: "maritime", stage: "pago", origin: "SSZ — Santos", destination: "HAM — Hamburgo", shipmentDays: -48, arrivalDays: -16, containerNumber: "HLBU7788990", hbl: "HBL-2026-0102", mbl: "HLCU441122", carrier: "Hapag-Lloyd", vessel: "Hamburg Express", incoterm: "CFR", invoiceUSD: 380000, ncm: "1201.90.00" },
  { customerIdx: 5, modal: "maritime", stage: "aguarda_chegada", origin: "SSZ — Santos", destination: "SHA — Shanghai", shipmentDays: -12, arrivalDays: 22, containerNumber: "COSU1122334", hbl: "HBL-2026-0157", mbl: "COSU557788", carrier: "COSCO", vessel: "COSCO Shipping Universe", incoterm: "FOB", invoiceUSD: 540000, ncm: "1005.90.10" },

  // Customer 6 — Construtora Panorama (1 ativo, 7 total)
  { customerIdx: 6, modal: "maritime", stage: "liberado", origin: "ROT — Rotterdam", destination: "RIO — Rio de Janeiro", shipmentDays: -38, arrivalDays: -9, containerNumber: "OOLU9988776", hbl: "HBL-2026-0123", mbl: "ONEU772255", carrier: "OOCL", vessel: "OOCL Hong Kong", incoterm: "CIF", invoiceUSD: 168000, ncm: "8474.20.00" },

  // Customer 7 — Química Sul (1 ativo, 9 total)
  { customerIdx: 7, modal: "maritime", stage: "aguarda_embarque", origin: "ANR — Antuérpia", destination: "ITJ — Itajaí", shipmentDays: 2, arrivalDays: 28, hbl: "HBL-2026-0168", mbl: "MAEU883344", carrier: "Maersk", vessel: "Maersk Stockholm", incoterm: "CIF", invoiceUSD: 92000, ncm: "2906.11.00" },

  // Extras for volume — completed this month (visible on dashboard KPI)
  { customerIdx: 0, modal: "maritime", stage: "pago", origin: "SHA — Shanghai", destination: "SSZ — Santos", shipmentDays: -60, arrivalDays: -25, containerNumber: "MSCU9988111", hbl: "HBL-2026-0061", mbl: "MAEU009988", carrier: "Maersk", vessel: "Maersk Eindhoven", incoterm: "CIF", invoiceUSD: 64000, ncm: "8517.62.41" },
  { customerIdx: 3, modal: "air", stage: "pago", origin: "JFK — New York", destination: "GRU — Guarulhos", shipmentDays: -22, arrivalDays: -18, hbl: "HAWB-2026-0029", carrier: "American Airlines Cargo", vessel: "AA961", incoterm: "DAP", invoiceUSD: 14500, ncm: "8536.69.10" },
  { customerIdx: 5, modal: "maritime", stage: "pago", origin: "SSZ — Santos", destination: "HKG — Hong Kong", shipmentDays: -55, arrivalDays: -20, containerNumber: "ONEU3344556", hbl: "HBL-2026-0078", mbl: "ONEU112299", carrier: "ONE", vessel: "ONE Stork", incoterm: "FOB", invoiceUSD: 295000, ncm: "0901.11.10" },
];

async function getOrgByName(name: string): Promise<{ id: string; name: string } | null> {
  const [row] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.name, name))
    .limit(1);
  return row ?? null;
}

async function getAdminUserId(orgId: string): Promise<string> {
  const [row] = await db
    .select({ userId: orgMembers.userId })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, "broker_admin")))
    .limit(1);
  if (!row) throw new Error("No broker_admin found in org. Run scripts/seed-admin.ts first.");
  return row.userId;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function writeStorageFile(orgId: string, processId: string, docId: string, filename: string): Promise<{ storageKey: string; sizeBytes: number; mimeType: string }> {
  const storageKey = `org/${orgId}/process/${processId}/${docId}-${filename}`;
  const abs = join(STORAGE_DIR, storageKey);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, PDF_BLOB);
  return { storageKey, sizeBytes: PDF_BLOB.byteLength, mimeType: "application/pdf" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const org = await getOrgByName(args.org);
  if (!org) {
    console.error(`Org "${args.org}" not found. Run scripts/seed-admin.ts first.`);
    process.exit(1);
  }
  const adminId = await getAdminUserId(org.id);

  console.log(`Seeding demo data into org "${org.name}" (${org.id})`);

  // 1. Customers + primary contacts
  const customerIds: string[] = [];
  let createdCustomers = 0;
  for (const c of CUSTOMERS) {
    const [existing] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.orgId, org.id), eq(customers.cnpj, c.cnpj)))
      .limit(1);
    if (existing) {
      customerIds.push(existing.id);
      continue;
    }
    const [row] = await db
      .insert(customers)
      .values({
        orgId: org.id,
        legalName: c.legalName,
        tradeName: c.tradeName,
        cnpj: c.cnpj,
        email: c.email,
        phone: c.phone,
        address: null,
        type: c.type,
        notes: null,
      })
      .returning({ id: customers.id });
    customerIds.push(row.id);
    createdCustomers += 1;

    await db.insert(customerContacts).values({
      customerId: row.id,
      name: c.contact.name,
      email: c.contact.email,
      phone: c.contact.phone,
      canLogin: c.contact.canLogin,
      userId: null,
      isPrimary: true,
    });
  }

  // 2. Processes
  const refBase = `AD-${new Date().getFullYear()}`;
  let refCounter = Date.now() % 1000;
  let createdProcesses = 0;
  const processIds: Array<{ id: string; stage: StageKey; customerName: string }> = [];

  for (const p of PROCESSES) {
    const customerId = customerIds[p.customerIdx];
    const customer = CUSTOMERS[p.customerIdx];
    refCounter += 1;
    const reference = `${refBase}-${String(refCounter).padStart(4, "0")}`;

    const importerName = customer.type === "exporter" ? "Importador Estrangeiro" : customer.legalName;
    const exporterName = customer.type === "importer" ? "Fornecedor Estrangeiro" : customer.legalName;

    const [row] = await db
      .insert(processes)
      .values({
        orgId: org.id,
        customerId,
        reference,
        modal: p.modal,
        stage: p.stage,
        importerName,
        exporterName,
        origin: p.origin,
        destination: p.destination,
        shipmentDate: daysAgoISO(p.shipmentDays),
        arrivalDate: daysAgoISO(p.arrivalDays),
        containerNumber: p.containerNumber ?? null,
        hblNumber: p.hbl ?? null,
        mblNumber: p.mbl ?? null,
        carrier: p.carrier ?? null,
        vesselFlight: p.vessel ?? null,
        incoterm: p.incoterm ?? null,
        currency: p.invoiceUSD ? "USD" : null,
        invoiceValue: p.invoiceUSD ? p.invoiceUSD.toFixed(2) : null,
        ncm: p.ncm ?? null,
      })
      .returning({ id: processes.id });
    processIds.push({ id: row.id, stage: p.stage, customerName: customer.legalName });
    createdProcesses += 1;

    // Timeline: creation event + stage advances up to current
    const stages: StageKey[] = ["aguarda_prontidao_carga","aguarda_booking","aguarda_embarque","aguarda_chegada","atracado","liberado","pago"];
    const currentIdx = stages.indexOf(p.stage);
    const baseDate = daysAgoDate(Math.min(p.shipmentDays, -1));
    await db.insert(timelineEvents).values({
      orgId: org.id,
      processId: row.id,
      title: `Processo ${reference} criado em ${customer.legalName}`,
      source: "system",
      actorId: adminId,
      occurredAt: baseDate,
      fromStage: null,
      toStage: "aguarda_prontidao_carga",
    });
    for (let s = 1; s <= currentIdx; s++) {
      const eventDate = new Date(baseDate);
      eventDate.setDate(eventDate.getDate() + s * 2);
      await db.insert(timelineEvents).values({
        orgId: org.id,
        processId: row.id,
        title: `Etapa avançada para ${stages[s]}`,
        source: "system",
        actorId: adminId,
        occurredAt: eventDate,
        fromStage: stages[s - 1],
        toStage: stages[s],
      });
    }
  }

  // 3. Documents — one Invoice per process, plus BL on in-transit+ and a few pending uploads
  let createdDocs = 0;
  for (const p of processIds) {
    const isPostShipment = ["aguarda_chegada", "atracado", "liberado", "aguarda_pagamento", "pago"].includes(p.stage);

    // Invoice (always)
    {
      const docId = randomUUID();
      const filename = "invoice.pdf";
      const stored = await writeStorageFile(org.id, p.id, docId, filename);
      await db.insert(documents).values({
        id: docId,
        orgId: org.id,
        processId: p.id,
        type: "invoice",
        filename,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        status: "active",
        uploadedBy: adminId,
      });
      createdDocs += 1;
    }

    if (isPostShipment) {
      const docId = randomUUID();
      const filename = "bl.pdf";
      const stored = await writeStorageFile(org.id, p.id, docId, filename);
      await db.insert(documents).values({
        id: docId,
        orgId: org.id,
        processId: p.id,
        type: "bl",
        filename,
        storageKey: stored.storageKey,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        status: "active",
        uploadedBy: adminId,
      });
      createdDocs += 1;
    }
  }

  // Sprinkle 3 client-uploaded pending docs across in-transit processes
  const pendingTargets = processIds.filter((p) => p.stage === "aguarda_chegada").slice(0, 3);
  for (const p of pendingTargets) {
    const docId = randomUUID();
    const filename = "packing-list.pdf";
    const stored = await writeStorageFile(org.id, p.id, docId, filename);
    await db.insert(documents).values({
      id: docId,
      orgId: org.id,
      processId: p.id,
      type: "packing_list",
      filename,
      storageKey: stored.storageKey,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      status: "pending_review",
      uploadedBy: adminId,
    });
    createdDocs += 1;
  }

  console.log(`\n✓ Seed complete:`);
  console.log(`    customers:  ${createdCustomers} new (skipped existing by CNPJ)`);
  console.log(`    processes:  ${createdProcesses}`);
  console.log(`    documents:  ${createdDocs}`);
  console.log(`    storage:    ${STORAGE_DIR}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
