/**
 * Mirrors examTitle()/paperTitle() in the Web app's lib/examPapers.ts:
 * "Mathematics", "Mathematics — Mid-term", "Scholarship Paper — Part 1 — Model 3".
 */
export function examTitle(exam: { subject: string; name?: string | null; part?: number | null }): string {
  return [exam.subject, exam.part ? `Part ${exam.part}` : null, exam.name || null].filter(Boolean).join(" — ")
}

/** The paper as a whole, without the part. */
export function paperTitle(exam: { subject: string; name?: string | null }): string {
  return examTitle({ subject: exam.subject, name: exam.name })
}
