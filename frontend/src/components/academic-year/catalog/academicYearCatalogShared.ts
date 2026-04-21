import type { AcademicYearCatalogSummaryResponse } from '@/services/schemas/admin-catalog-schemas';
import type { AcademicTermGroupResponse } from '@/services/schemas/academic-years-schemas';

export type CatalogTermOption = {
  value: string;
  label: string;
};

function compareSummaryTermGroups(
  left: AcademicYearCatalogSummaryResponse['termGroups'][number],
  right: AcademicYearCatalogSummaryResponse['termGroups'][number]
): number {
  return left.code.localeCompare(right.code) || left.termGroupId - right.termGroupId;
}

function compareSummaryTerms(
  left: AcademicYearCatalogSummaryResponse['termGroups'][number]['terms'][number],
  right: AcademicYearCatalogSummaryResponse['termGroups'][number]['terms'][number]
): number {
  return left.code.localeCompare(right.code) || left.termId - right.termId;
}

export function sortAcademicYearCatalogTermGroups(
  termGroups: ReadonlyArray<AcademicYearCatalogSummaryResponse['termGroups'][number]>
) {
  return [...termGroups]
    .sort(compareSummaryTermGroups)
    .map((termGroup) => ({
      ...termGroup,
      terms: [...termGroup.terms].sort(compareSummaryTerms),
    }));
}

export function buildAcademicYearCatalogTermOptions(
  termGroups: ReadonlyArray<AcademicYearCatalogSummaryResponse['termGroups'][number]>
): CatalogTermOption[] {
  return termGroups.flatMap((termGroup) =>
    termGroup.terms.map((term) => ({
      value: String(term.termId),
      label: `${term.name} (${term.code}) · ${termGroup.name}`,
    }))
  );
}

export function sortAcademicYearTermGroups(
  termGroups: ReadonlyArray<AcademicTermGroupResponse>
): AcademicTermGroupResponse[] {
  return [...termGroups]
    .sort(
      (left, right) =>
        left.startDate.localeCompare(right.startDate) ||
        left.code.localeCompare(right.code) ||
        left.termGroupId - right.termGroupId
    )
    .map((termGroup) => ({
      ...termGroup,
      academicTerms: [...termGroup.academicTerms].sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.code.localeCompare(right.code) ||
          left.termId - right.termId
      ),
    }));
}

export function normalizeNotes(notes: string): string | null {
  const trimmedNotes = notes.trim();
  return trimmedNotes ? trimmedNotes : null;
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}
