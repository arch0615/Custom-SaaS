import "dotenv/config";
import { eq } from "drizzle-orm";

import { db, pool } from "../src/db/client";
import { users } from "../src/db/schema/auth";
import { organizations, orgMembers } from "../src/db/schema/organizations";
import { hashPassword } from "../src/lib/auth/password";
import { slugify } from "../src/lib/auth/slug";

/**
 * Bootstrap a broker_admin in a fresh prod database.
 *
 * Usage:
 *   pnpm tsx scripts/seed-admin.ts --org "Acme Despachantes" --email admin@acme.com --name "Maria" [--password <pw>]
 *
 * If --password is omitted, a random one is printed once to stdout.
 * Re-running with the same email keeps the user and updates the membership.
 */

type Args = { org?: string; email?: string; name?: string; password?: string };

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--org") out.org = value;
    else if (flag === "--email") out.email = value?.toLowerCase().trim();
    else if (flag === "--name") out.name = value;
    else if (flag === "--password") out.password = value;
  }
  return out;
}

function randomPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "org";
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${i}`;
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);
    if (!existing) return candidate;
  }
  return `${root}-${Date.now()}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.org || !args.email || !args.name) {
    console.error(
      "Usage: pnpm tsx scripts/seed-admin.ts --org <Org Name> --email <email> --name <Full Name> [--password <pw>]",
    );
    process.exit(2);
  }

  const password = args.password ?? randomPassword();
  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, args.email!))
      .limit(1);

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      await tx
        .update(users)
        .set({ name: args.name, passwordHash })
        .where(eq(users.id, userId));
    } else {
      const [u] = await tx
        .insert(users)
        .values({ email: args.email!, name: args.name!, passwordHash })
        .returning({ id: users.id });
      userId = u.id;
    }

    let orgId: string;
    const [existingMembership] = await tx
      .select({ orgId: orgMembers.orgId })
      .from(orgMembers)
      .where(eq(orgMembers.userId, userId))
      .limit(1);

    if (existingMembership) {
      orgId = existingMembership.orgId;
      await tx
        .update(organizations)
        .set({ name: args.org! })
        .where(eq(organizations.id, orgId));
      await tx
        .update(orgMembers)
        .set({ role: "broker_admin" })
        .where(eq(orgMembers.userId, userId));
    } else {
      const slug = await uniqueSlug(args.org!);
      const [o] = await tx
        .insert(organizations)
        .values({ name: args.org!, slug })
        .returning({ id: organizations.id });
      orgId = o.id;
      await tx.insert(orgMembers).values({
        orgId,
        userId,
        role: "broker_admin",
      });
    }

    console.log("\n✓ Admin seeded:");
    console.log(`  organization: ${args.org} (id ${orgId})`);
    console.log(`  user:         ${args.name} <${args.email}>`);
    if (!args.password) {
      console.log(`  password:     ${password}   ← copy this, it will not be shown again`);
    } else {
      console.log("  password:     (as provided)");
    }
    console.log("\n  Log in at the public app URL.\n");
  });
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
    process.exit(1);
  });
