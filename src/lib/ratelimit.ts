/**
 * In-memory login rate limiter: after 5 failed attempts for the same
 * nickname+IP pair, lock that pair for 60 seconds. Mandatory hardening for
 * the simple credential model (brief §5). Single-instance only — fine for
 * the MVP deployment shape.
 */

const MAX_FAILURES = 5;
const LOCK_MS = 60_000;
const WINDOW_MS = 10 * 60_000;

type Entry = { failures: number; firstFailureAt: number; lockedUntil: number };

const attempts = new Map<string, Entry>();

function key(nickname: string, ip: string): string {
  return `${nickname.toLowerCase()}:${ip}`;
}

function prune(now: number) {
  if (attempts.size < 1000) return;
  for (const [k, e] of attempts) {
    if (now - e.firstFailureAt > WINDOW_MS && e.lockedUntil < now) {
      attempts.delete(k);
    }
  }
}

/** Seconds remaining on the lock, or 0 if not locked. */
export function lockedForSeconds(nickname: string, ip: string): number {
  const e = attempts.get(key(nickname, ip));
  if (!e) return 0;
  const remaining = e.lockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function recordFailure(nickname: string, ip: string): void {
  const now = Date.now();
  prune(now);
  const k = key(nickname, ip);
  const e = attempts.get(k);
  if (!e || now - e.firstFailureAt > WINDOW_MS) {
    attempts.set(k, { failures: 1, firstFailureAt: now, lockedUntil: 0 });
    return;
  }
  e.failures += 1;
  if (e.failures >= MAX_FAILURES) {
    e.lockedUntil = now + LOCK_MS;
    e.failures = 0;
    e.firstFailureAt = now;
  }
}

export function recordSuccess(nickname: string, ip: string): void {
  attempts.delete(key(nickname, ip));
}
