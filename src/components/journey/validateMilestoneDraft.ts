/**
 * validateMilestoneDraft — Pure, dependency-free validator that flags
 * logically inconsistent dates *before* they are committed to the
 * journey history. Used by `JourneyMissingMilestones` to surface inline
 * warnings (and optionally block saves) so the timeline never ends up
 * in an impossible state.
 *
 * Rules implemented (each emits a stable `code` so the UI can show a
 * localized message and tests can assert behavior):
 *   • future            — date is in the future when it must be past
 *                         (birth date, fertility/pregnancy start)
 *   • beforeBirth       — postpartum.startedAt occurs before birthDate
 *   • afterDueDate      — pregnancy.startedAt is after the due date
 *   • beforePregnancy   — postpartum.birthDate is before pregnancy start
 *   • dueDateTooOld     — pregnancy.dueDate is far in the past while the
 *                         stage is still "pregnant" (>14d past = likely typo)
 *   • timezoneDrift     — a YYYY-MM-DD input would shift one calendar day
 *                         when interpreted in the user's local timezone
 *                         vs the UTC-noon normalization we persist
 *
 * The returned `severity` is "error" when saving the value would create
 * an impossible state, and "warning" for soft hints that are still
 * permitted (e.g. timezone drift).
 */
import type { JourneyHistory, JourneyStage } from "@/hooks/useUserProfile";

export type MilestoneId =
  | "fertility.startedAt"
  | "pregnancy.dueDate"
  | "pregnancy.startedAt"
  | "postpartum.birthDate"
  | "postpartum.startedAt";

export type WarningCode =
  | "future"
  | "beforeBirth"
  | "afterDueDate"
  | "beforePregnancy"
  | "dueDateTooOld"
  | "timezoneDrift";

export interface MilestoneWarning {
  code: WarningCode;
  severity: "error" | "warning";
  /** Optional ISO reference date the rule compared against. */
  reference?: string;
}

const MS_PER_DAY = 86_400_000;

const parseDateOnly = (value: string): Date | null => {
  if (!value) return null;
  // Date-only inputs are normalized to noon UTC (matches save logic).
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00.000Z`
    : value;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export interface ValidateInput {
  id: MilestoneId;
  value: string;
  history: JourneyHistory;
  /** Optional override (defaults to `new Date()`); kept for tests. */
  now?: Date;
  stage?: JourneyStage;
}

export const validateMilestoneDraft = (
  input: ValidateInput,
): MilestoneWarning[] => {
  const { id, value, history } = input;
  const out: MilestoneWarning[] = [];
  const date = parseDateOnly(value);
  if (!date) return out;

  const now = input.now ?? new Date();
  const todayUTCNoon = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12),
  );

  const dueDate = parseDateOnly(history.pregnancy?.dueDate ?? "");
  const pregStart = parseDateOnly(history.pregnancy?.startedAt ?? "");
  const birthDate = parseDateOnly(history.postpartum?.birthDate ?? "");

  // 1) Future-date guards (all start dates + birth date must be past/today).
  if (id !== "pregnancy.dueDate" && date.getTime() > todayUTCNoon.getTime()) {
    out.push({ code: "future", severity: "error", reference: todayUTCNoon.toISOString() });
  }

  // 2) postpartum.startedAt must not precede the recorded birthDate.
  if (id === "postpartum.startedAt" && birthDate && date.getTime() < birthDate.getTime() - MS_PER_DAY / 2) {
    out.push({ code: "beforeBirth", severity: "error", reference: birthDate.toISOString() });
  }

  // 3) postpartum.birthDate must not precede a recorded pregnancy.startedAt.
  if (id === "postpartum.birthDate" && pregStart && date.getTime() < pregStart.getTime() - MS_PER_DAY / 2) {
    out.push({ code: "beforePregnancy", severity: "error", reference: pregStart.toISOString() });
  }

  // 4) pregnancy.startedAt must not be after the due date.
  if (id === "pregnancy.startedAt" && dueDate && date.getTime() > dueDate.getTime() + MS_PER_DAY / 2) {
    out.push({ code: "afterDueDate", severity: "error", reference: dueDate.toISOString() });
  }

  // 5) Soft hint: a pregnancy due date already weeks in the past while
  // the stage is still pregnant usually means the user moved on.
  if (id === "pregnancy.dueDate") {
    const diffDays = (todayUTCNoon.getTime() - date.getTime()) / MS_PER_DAY;
    if (diffDays > 14 && (input.stage ?? "pregnant") === "pregnant") {
      out.push({ code: "dueDateTooOld", severity: "warning", reference: todayUTCNoon.toISOString() });
    }
  }

  // 6) Timezone-drift hint: only meaningful for raw YYYY-MM-DD inputs.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const localInterpretation = new Date(`${value}T00:00:00`);
    if (!sameLocalDay(localInterpretation, date)) {
      out.push({ code: "timezoneDrift", severity: "warning" });
    }
  }

  return out;
};

/** Convenience: true when at least one error-level warning is present. */
export const hasBlockingError = (warnings: MilestoneWarning[]) =>
  warnings.some((w) => w.severity === "error");
