import { redirect } from "next/navigation";
import { requireSession, type ActiveSession } from "@/lib/auth/session";
import { getCustomerForOrg, listCustomersForClientUser } from "@/lib/data/customers";

export type PortalCustomer = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string;
};

export type PortalCustomerContext = {
  session: ActiveSession;
  /**
   * All customers (empresas / CNPJs) accessible by this login.
   * Real client users may have several when their group has multiple CNPJs;
   * the broker side links them by adding a customer_contacts row per company
   * sharing the same user_id. Broker impersonation always returns a
   * single-element array.
   */
  customers: PortalCustomer[];
  /** First customer — kept for headers / single-empresa flows. */
  primary: PortalCustomer;
  /** Convenience set of ids for `WHERE customer_id IN (…)` filters. */
  customerIds: string[];
  /** Backwards-compatible alias: legacy call sites only need the primary. */
  customer: PortalCustomer;
  impersonating: boolean;
};

export async function requirePortalCustomer(impersonateId?: string): Promise<PortalCustomerContext> {
  const session = await requireSession();

  if (session.role === "client") {
    const found = await listCustomersForClientUser(session.orgId, session.userId);
    if (found.length === 0) redirect("/login");
    const customers: PortalCustomer[] = found.map((c) => ({
      id: c.customerId,
      legalName: c.legalName,
      tradeName: c.tradeName,
      cnpj: c.cnpj,
    }));
    return {
      session,
      customers,
      primary: customers[0],
      customer: customers[0],
      customerIds: customers.map((c) => c.id),
      impersonating: false,
    };
  }

  if (!impersonateId) redirect("/app");

  const customer = await getCustomerForOrg(session.orgId, impersonateId);
  if (!customer || customer.deletedAt) redirect("/app");

  const c: PortalCustomer = {
    id: customer.id,
    legalName: customer.legalName,
    tradeName: customer.tradeName,
    cnpj: customer.cnpj,
  };
  return {
    session,
    customers: [c],
    primary: c,
    customer: c,
    customerIds: [c.id],
    impersonating: true,
  };
}
