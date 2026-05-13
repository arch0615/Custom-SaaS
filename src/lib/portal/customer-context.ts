import { redirect } from "next/navigation";
import { requireSession, type ActiveSession } from "@/lib/auth/session";
import { getCustomerForOrg, getCustomerForClientUser } from "@/lib/data/customers";

export type PortalCustomerContext = {
  session: ActiveSession;
  customer: {
    id: string;
    legalName: string;
    tradeName: string | null;
  };
  impersonating: boolean;
};

export async function requirePortalCustomer(impersonateId?: string): Promise<PortalCustomerContext> {
  const session = await requireSession();

  if (session.role === "client") {
    const found = await getCustomerForClientUser(session.orgId, session.userId);
    if (!found) redirect("/login");
    return {
      session,
      customer: {
        id: found.customerId,
        legalName: found.legalName,
        tradeName: found.tradeName,
      },
      impersonating: false,
    };
  }

  if (!impersonateId) redirect("/app");

  const customer = await getCustomerForOrg(session.orgId, impersonateId);
  if (!customer || customer.deletedAt) redirect("/app");

  return {
    session,
    customer: {
      id: customer.id,
      legalName: customer.legalName,
      tradeName: customer.tradeName,
    },
    impersonating: true,
  };
}
