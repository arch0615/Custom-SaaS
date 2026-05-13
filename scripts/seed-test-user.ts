import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db/client";
import { users } from "../src/db/schema/auth";
import { organizations, orgMembers } from "../src/db/schema/organizations";
import { hashPassword } from "../src/lib/auth/password";
import { slugify } from "../src/lib/auth/slug";

async function main() {
  const email = "test@example.com";
  const password = "testpass123";

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`User ${email} already exists; skipping.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name: "Test Org", slug: slugify("test-org") })
      .returning({ id: organizations.id });

    const [user] = await tx
      .insert(users)
      .values({ name: "Test User", email, passwordHash })
      .returning({ id: users.id });

    await tx.insert(orgMembers).values({
      orgId: org.id,
      userId: user.id,
      role: "broker_admin",
    });

    console.log(`Created user ${email} (id=${user.id}) in org ${org.id}`);
  });
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    pool.end();
    process.exit(1);
  });
