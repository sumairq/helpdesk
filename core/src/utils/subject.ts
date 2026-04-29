export function stripSubjectPrefixes(subject: string): string {
  return subject.replace(/^(re|fwd|fw):\s*/gi, "").trim();
}
