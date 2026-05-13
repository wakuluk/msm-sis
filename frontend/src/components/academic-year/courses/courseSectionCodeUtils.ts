export function normalizeCourseSectionCode(value: string) {
  return value.trim().toUpperCase();
}

export function ensureHonorsSectionCode(value: string) {
  const normalized = normalizeCourseSectionCode(value);

  if (!normalized) {
    return '';
  }

  return normalized.endsWith('H') ? normalized : `${normalized}H`;
}

export function removeHonorsSectionSuffix(value: string) {
  const normalized = normalizeCourseSectionCode(value);

  return normalized.endsWith('H') ? normalized.slice(0, -1) : normalized;
}
