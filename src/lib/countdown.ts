/**
 * Watering countdown math — the app's signature UI element runs on these
 * pure functions. All times in ms since epoch.
 */

export type WaterStatus = "ok" | "soon" | "overdue";

export type Countdown = {
  status: WaterStatus;
  /** 0..1 — how much of the watering interval remains (0 = due/overdue). */
  remainingRatio: number;
  /** Whole days until due (negative = days overdue). */
  daysLeft: number;
  /** Short human label, e.g. "3d left", "due today", "2d overdue". */
  label: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeCountdown(
  lastWatered: string | null,
  waterFreqDays: number,
  weatherFactor = 1,
  now = Date.now(),
): Countdown {
  const intervalMs = Math.max(1, waterFreqDays) * weatherFactor * DAY_MS;

  // Never watered -> due now: prompts the first watering to start the cycle.
  const last = lastWatered ? new Date(lastWatered).getTime() : now - intervalMs;
  const dueAt = last + intervalMs;
  const remainingMs = dueAt - now;
  const remainingRatio = Math.max(0, Math.min(1, remainingMs / intervalMs));

  const daysLeft = Math.ceil(remainingMs / DAY_MS);

  let status: WaterStatus;
  if (remainingMs <= 0) status = "overdue";
  else if (remainingRatio <= 1 / 3) status = "soon";
  else status = "ok";

  let label: string;
  if (remainingMs <= 0) {
    const over = Math.floor(-remainingMs / DAY_MS);
    label = over < 1 ? "due today" : `${over}d overdue`;
  } else if (daysLeft <= 0) {
    label = "due today";
  } else {
    label = `${daysLeft}d left`;
  }

  return { status, remainingRatio, daysLeft, label };
}
