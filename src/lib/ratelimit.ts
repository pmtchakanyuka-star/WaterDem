/**
 * In-memory login rate limiter. Two independent locks per attempt:
 *   - nickname + IP  (fast lock for a single source)
 *   - nickname alone (guards against IP rotation / X-Forwarded-For spoofing)
 * After MAX_FAILURES on either key, that key locks for LOCK_MS. The
 * nickname-global key uses a higher threshold so honest users sharing a NAT
 * aren't punished for a stranger's typos, while still capping total online
 * guessing against one account. Single-instance only — fine for the MVP.
 */

const MAX_FAILURES_IP = 5;
const MAX_FAILURES_NICK = 15;
const LOCK_MS = 60_000;
const WINDOW_MS = 10 * 60_000;

type Entry = { failures: number; firstFailureAt: number; lockedUntil: number };

const attempts = new Map<string, Entry>();

function prune(now: number) {
  if (attempts.size < 2000) return;
  for (const [k, e] of attempts) {
    if (now - e.firstFailureAt > WINDOW_MS && e.lockedUntil < now) {
      attempts.delete(k);
    }
  }
}

function lockSecondsFor(key: string, now: number): number {
  const e = attempts.get(key);
  if (!e) return 0;
  const remaining = e.lockedUntil - now;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

function bump(key: string, max: number, now: number) {
  const e = attempts.get(key);
  if (!e || now - e.firstFailureAt > WINDOW_MS) {
    attempts.set(key, { failures: 1, firstFailureAt: now, lockedUntil: 0 });
    return;
  }
  e.failures += 1;
  if (e.failures >= max) {
    e.lockedUntil = now + LOCK_MS;
    e.failures = 0;
    e.firstFailureAt = now;
  }
}

const ipKey = (nickname: string, ip: string) =>
  `ip:${nickname.toLowerCase()}:${ip}`;
const nickKey = (nickname: string) => `nick:${nickname.toLowerCase()}`;

/** Seconds remaining on whichever lock (ip-scoped or nickname-scoped) is longest. */
export function lockedForSeconds(nickname: string, ip: string): number {
  const now = Date.now();
  return Math.max(
    lockSecondsFor(ipKey(nickname, ip), now),
    lockSecondsFor(nickKey(nickname), now),
  );
}

export function recordFailure(nickname: string, ip: string): void {
  const now = Date.now();
  prune(now);
  bump(ipKey(nickname, ip), MAX_FAILURES_IP, now);
  bump(nickKey(nickname), MAX_FAILURES_NICK, now);
}

export function recordSuccess(nickname: string, ip: string): void {
  attempts.delete(ipKey(nickname, ip));
  attempts.delete(nickKey(nickname));
}

// --- AI usage limiter: cap expensive OpenAI calls per user + per IP ---------
// A rolling window per key. AI routes (identify/advice/replan) each require a
// session, but nothing stopped a signed-in user from looping a route and
// running up the OpenAI bill — this caps that. Single-instance (per serverless
// instance) like the others; good enough for the current scale, back with a
// shared store (Postgres/Upstash) before high traffic.
const AI_MAX = 30; // requests
const AI_WINDOW_MS = 5 * 60_000; // per 5 minutes, per key
const aiHits = new Map<string, number[]>();

/**
 * Returns true if this AI request is allowed. Counts against both a per-user
 * and a per-IP budget so neither a single account nor a single source can run
 * the bill up. Call once per AI request; it records the hit.
 */
export function aiRateOk(userId: string, ip: string): boolean {
  const now = Date.now();
  if (aiHits.size > 5000) {
    for (const [k, arr] of aiHits) {
      if (arr.every((t) => t <= now - AI_WINDOW_MS)) aiHits.delete(k);
    }
  }
  // Evaluate both; record on both only if both pass (avoid one-sided burn).
  const cutoff = now - AI_WINDOW_MS;
  const uKey = `ai:u:${userId}`;
  const ipK = `ai:ip:${ip}`;
  const uHits = (aiHits.get(uKey) ?? []).filter((t) => t > cutoff);
  const ipHits = (aiHits.get(ipK) ?? []).filter((t) => t > cutoff);
  if (uHits.length >= AI_MAX || ipHits.length >= AI_MAX) {
    aiHits.set(uKey, uHits);
    aiHits.set(ipK, ipHits);
    return false;
  }
  uHits.push(now);
  ipHits.push(now);
  aiHits.set(uKey, uHits);
  aiHits.set(ipK, ipHits);
  return true;
}

// --- Signup limiter: cap account creation per IP to curb spam ---------------
const SIGNUP_MAX = 8;
const SIGNUP_WINDOW_MS = 10 * 60_000;
const signups = new Map<string, { count: number; firstAt: number }>();

/** Seconds to wait before this IP may sign up again, or 0 if allowed. */
export function signupLockedForSeconds(ip: string): number {
  const now = Date.now();
  const e = signups.get(ip);
  if (!e || now - e.firstAt > SIGNUP_WINDOW_MS) return 0;
  if (e.count < SIGNUP_MAX) return 0;
  return Math.ceil((e.firstAt + SIGNUP_WINDOW_MS - now) / 1000);
}

export function recordSignup(ip: string): void {
  const now = Date.now();
  if (signups.size > 5000) {
    for (const [k, e] of signups) {
      if (now - e.firstAt > SIGNUP_WINDOW_MS) signups.delete(k);
    }
  }
  const e = signups.get(ip);
  if (!e || now - e.firstAt > SIGNUP_WINDOW_MS) {
    signups.set(ip, { count: 1, firstAt: now });
  } else {
    e.count += 1;
  }
}
