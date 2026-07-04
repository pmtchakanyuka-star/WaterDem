import postgres from "postgres";

/**
 * Direct Postgres connection to Supabase (transaction pooler, port 6543).
 * RLS is the primary permission layer: every query runs inside a transaction
 * that sets `app.current_user_id`, which the policies read via
 * current_app_user(). Tables use FORCE ROW LEVEL SECURITY so even the owner
 * role is subject to the policies.
 */

declare global {
  // Reuse the pool across Next.js dev HMR reloads.
  var __waterdem_sql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("postgres")) {
    throw new Error("DATABASE_URL is not set — see .env.local");
  }
  return postgres(url, {
    // Transaction-mode pooling (PgBouncer) — no prepared statements.
    prepare: false,
    max: 5,
    idle_timeout: 30,
    connect_timeout: 15,
  });
}

// Lazy: don't touch DATABASE_URL at import time so `next build` (which
// evaluates route modules without env secrets) doesn't crash.
function getSql(): ReturnType<typeof postgres> {
  if (!globalThis.__waterdem_sql) {
    globalThis.__waterdem_sql = createClient();
  }
  return globalThis.__waterdem_sql;
}

export type Tx = postgres.TransactionSql<Record<string, unknown>>;

/**
 * Run `fn` in a transaction with the RLS identity set. Pass null for
 * anonymous access (public garden viewing) — policies then only match
 * public rows.
 */
export async function withUser<T>(
  userId: string | null,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return getSql().begin(async (tx) => {
    await tx`select set_config('app.current_user_id', ${userId ?? ""}, true)`;
    return fn(tx);
  }) as Promise<T>;
}
