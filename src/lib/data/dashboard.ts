import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { ProcessModal, ProcessStage } from "./processes";
import { STAGE_ORDER } from "@/lib/process-status";

export type DashboardKpis = {
  open: number;
  delayed: number;
  completedThisMonth: number;
  pendingDocReview: number;
  newCustomersThisMonth: number;
};

export async function getDashboardKpis(orgId: string): Promise<DashboardKpis> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM processes
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND stage <> 'pago')::int AS open,
      (SELECT count(*) FROM processes
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND stage NOT IN ('atracado', 'liberado', 'aguarda_pagamento', 'pago')
          AND arrival_date < CURRENT_DATE)::int AS delayed,
      (SELECT count(*) FROM processes
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND stage = 'pago'
          AND updated_at >= date_trunc('month', now()))::int AS completed_this_month,
      (SELECT count(*) FROM documents
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND status = 'pending_review')::int AS pending_doc_review,
      (SELECT count(*) FROM customers
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND created_at >= date_trunc('month', now()))::int AS new_customers_this_month
  `);
  const r = result.rows[0] as Record<string, number>;
  return {
    open: Number(r.open ?? 0),
    delayed: Number(r.delayed ?? 0),
    completedThisMonth: Number(r.completed_this_month ?? 0),
    pendingDocReview: Number(r.pending_doc_review ?? 0),
    newCustomersThisMonth: Number(r.new_customers_this_month ?? 0),
  };
}

export type DashboardDeltas = {
  newProcessesThisMonth: number;
  newProcessesLastMonth: number;
  completedLastMonth: number;
  pendingDocsWeekAgo: number;
  newCustomersLastMonth: number;
};

export async function getDashboardDeltas(orgId: string): Promise<DashboardDeltas> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*) FROM processes
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND created_at >= date_trunc('month', now()))::int AS new_processes_this_month,
      (SELECT count(*) FROM processes
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND created_at >= date_trunc('month', now()) - interval '1 month'
          AND created_at <  date_trunc('month', now()))::int AS new_processes_last_month,
      (SELECT count(*) FROM processes
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND stage = 'pago'
          AND updated_at >= date_trunc('month', now()) - interval '1 month'
          AND updated_at <  date_trunc('month', now()))::int AS completed_last_month,
      (SELECT count(*) FROM documents
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND status = 'pending_review'
          AND uploaded_at < now() - interval '7 days')::int AS pending_docs_week_ago,
      (SELECT count(*) FROM customers
        WHERE org_id = ${orgId} AND deleted_at IS NULL
          AND created_at >= date_trunc('month', now()) - interval '1 month'
          AND created_at <  date_trunc('month', now()))::int AS new_customers_last_month
  `);
  const r = result.rows[0] as Record<string, number>;
  return {
    newProcessesThisMonth: Number(r.new_processes_this_month ?? 0),
    newProcessesLastMonth: Number(r.new_processes_last_month ?? 0),
    completedLastMonth: Number(r.completed_last_month ?? 0),
    pendingDocsWeekAgo: Number(r.pending_docs_week_ago ?? 0),
    newCustomersLastMonth: Number(r.new_customers_last_month ?? 0),
  };
}

export type MonthlyPoint = { label: string; opened: number; closed: number };

const MONTH_LABELS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export async function getMonthlyOpenedClosed(orgId: string, months = 5): Promise<MonthlyPoint[]> {
  const result = await db.execute(sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', now()) - (${months - 1} || ' months')::interval,
        date_trunc('month', now()),
        '1 month'::interval
      ) AS month_start
    )
    SELECT
      m.month_start,
      (SELECT count(*) FROM processes p
        WHERE p.org_id = ${orgId} AND p.deleted_at IS NULL
          AND p.created_at >= m.month_start
          AND p.created_at <  m.month_start + interval '1 month')::int AS opened,
      (SELECT count(*) FROM processes p
        WHERE p.org_id = ${orgId} AND p.deleted_at IS NULL
          AND p.stage = 'pago'
          AND p.updated_at >= m.month_start
          AND p.updated_at <  m.month_start + interval '1 month')::int AS closed
    FROM months m
    ORDER BY m.month_start ASC
  `);
  return result.rows.map((r) => {
    const o = r as Record<string, unknown>;
    const d = new Date(o.month_start as string);
    return {
      label: MONTH_LABELS_PT[d.getMonth()],
      opened: Number(o.opened ?? 0),
      closed: Number(o.closed ?? 0),
    };
  });
}

export type StageCount = { stage: ProcessStage; count: number };

export async function getProcessesByStage(orgId: string): Promise<StageCount[]> {
  const result = await db.execute(sql`
    SELECT stage, count(*)::int AS count
    FROM processes
    WHERE org_id = ${orgId} AND deleted_at IS NULL
    GROUP BY stage
  `);
  const byStage = new Map<ProcessStage, number>(
    result.rows.map((r) => [
      (r as Record<string, unknown>).stage as ProcessStage,
      Number((r as Record<string, unknown>).count ?? 0),
    ]),
  );
  return STAGE_ORDER.map((stage) => ({ stage, count: byStage.get(stage) ?? 0 }));
}

export type NextArrivalRow = {
  id: string;
  reference: string;
  modal: ProcessModal;
  stage: ProcessStage;
  customerName: string;
  origin: string;
  destination: string;
  arrivalDate: string;
};

export async function getNextArrivals(orgId: string, days = 7): Promise<NextArrivalRow[]> {
  const result = await db.execute(sql`
    SELECT
      p.id,
      p.reference,
      p.modal,
      p.stage,
      c.legal_name AS customer_name,
      p.origin,
      p.destination,
      p.arrival_date
    FROM processes p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.org_id = ${orgId}
      AND p.deleted_at IS NULL
      AND p.stage NOT IN ('atracado', 'liberado', 'aguarda_pagamento', 'pago')
      AND p.arrival_date IS NOT NULL
      AND p.arrival_date >= CURRENT_DATE
      AND p.arrival_date <= (CURRENT_DATE + ${`${days} days`}::interval)
    ORDER BY p.arrival_date ASC
    LIMIT 10
  `);
  return result.rows.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      id: o.id as string,
      reference: o.reference as string,
      modal: o.modal as ProcessModal,
      stage: o.stage as ProcessStage,
      customerName: o.customer_name as string,
      origin: o.origin as string,
      destination: o.destination as string,
      arrivalDate: String(o.arrival_date),
    };
  });
}

export type RecentActivityRow = {
  id: string;
  title: string;
  source: "manual" | "auto" | "system";
  processId: string;
  processReference: string;
  customerName: string;
  actorName: string | null;
  occurredAt: Date;
};

export type FeaturedProcess = {
  id: string;
  reference: string;
  customerName: string;
  stage: ProcessStage;
  shipmentDate: Date | null;
  arrivalDate: Date | null;
  updatedAt: Date;
};

export async function getFeaturedActiveProcess(orgId: string): Promise<FeaturedProcess | null> {
  const result = await db.execute(sql`
    SELECT
      p.id, p.reference, p.stage, p.shipment_date, p.arrival_date, p.updated_at,
      c.legal_name AS customer_name
    FROM processes p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.org_id = ${orgId}
      AND p.deleted_at IS NULL
      AND p.stage <> 'pago'
    ORDER BY p.updated_at DESC
    LIMIT 1
  `);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    reference: row.reference as string,
    customerName: row.customer_name as string,
    stage: row.stage as ProcessStage,
    shipmentDate: row.shipment_date ? new Date(row.shipment_date as string) : null,
    arrivalDate: row.arrival_date ? new Date(row.arrival_date as string) : null,
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getRecentActivity(orgId: string, limit = 20): Promise<RecentActivityRow[]> {
  const result = await db.execute(sql`
    SELECT
      te.id,
      te.title,
      te.source,
      te.process_id,
      p.reference AS process_reference,
      c.legal_name AS customer_name,
      u.name AS actor_name,
      te.occurred_at
    FROM timeline_events te
    JOIN processes p ON p.id = te.process_id
    JOIN customers c ON c.id = p.customer_id
    LEFT JOIN users u ON u.id = te.actor_id
    WHERE te.org_id = ${orgId}
      AND te.deleted_at IS NULL
      AND p.deleted_at IS NULL
    ORDER BY te.occurred_at DESC
    LIMIT ${limit}
  `);
  return result.rows.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      id: o.id as string,
      title: o.title as string,
      source: o.source as RecentActivityRow["source"],
      processId: o.process_id as string,
      processReference: o.process_reference as string,
      customerName: o.customer_name as string,
      actorName: (o.actor_name as string | null) ?? null,
      occurredAt: new Date(o.occurred_at as string),
    };
  });
}
