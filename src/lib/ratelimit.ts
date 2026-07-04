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
