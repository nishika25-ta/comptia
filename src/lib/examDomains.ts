/** Canonical display order for SY0-701 objective domains (matches CompTIA outline grouping). */
export const SY0_701_DOMAIN_ORDER = [
  "General Security Concepts",
  "Risk Management",
  "Risk Management and Privacy",
  "Security Architecture",
  "Security Controls",
  "Security Operations",
  "Security Program Management and Oversight",
  "Threats, Vulnerabilities, and Mitigations",
] as const;

const ORDER_SET = new Set<string>(SY0_701_DOMAIN_ORDER);

export function sortExamDomains(categories: string[]): string[] {
  const known = SY0_701_DOMAIN_ORDER.filter((d) => categories.includes(d));
  const extras = categories
    .filter((c) => !ORDER_SET.has(c))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...extras];
}
