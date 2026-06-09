import "dotenv/config";
import { db, pool } from "../src/db/client";
import { listCustomersForClientUser } from "../src/lib/data/customers";
import { listProcessesForOrg } from "../src/lib/data/processes";

const ORG_ID = "37be8f2a-fc31-49b6-be1a-0358d8b5b202";
const USER_ID = "8415df67-4aa8-4f69-8700-3a1446befb9e";

async function main() {
  void db;
  const customers = await listCustomersForClientUser(ORG_ID, USER_ID);
  console.log("Customers vinculados:", customers.length);
  for (const c of customers) console.log(`  - ${c.legalName} (CNPJ ${c.cnpj})`);

  const procs = await listProcessesForOrg(ORG_ID, { customerIds: customers.map((c) => c.customerId) });
  console.log(`\nProcessos visíveis: ${procs.length}`);
  for (const p of procs) {
    console.log(`  - ${p.reference}  | ${p.customerName.slice(0, 30)}  | ${p.stage}`);
  }
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    pool.end();
    process.exit(1);
  });
