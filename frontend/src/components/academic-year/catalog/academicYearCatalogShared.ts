import type { AcademicYearCatalogSummaryResponse } from '@/services/schemas/admin-catalog-schemas';
import type { AcademicTermResponse } from '@/services/schemas/academic-years-schemas';

export type CatalogTermOption = {
  value: string;
  label: string;
};

function compareSummaryTermGroups(
  left: AcademicYearCatalogSummaryResponse['terms'][number],
  right: AcademicYearCatalogSummaryResponse['terms'][number]
): number {
  return left.code.localeCompare(right.code) || left.termId - right.termId;
}

function compareSummaryTerms(
  left: AcademicYearCatalogSummaryResponse['terms'][number]['subTerms'][number],
  right: AcademicYearCatalogSummaryResponse['terms'][number]['subTerms'][number]
): number {
  return left.code.localeCompare(right.code) || left.subTermId - right.subTermId;
}

export function sortAcademicYearCatalogTermGroups(
  terms: ReadonlyArray<AcademicYearCatalogSummaryResponse['terms'][number]>
) {
  return [...terms]
    .sort(compareSummaryTermGroups)
    .map((term) => ({
      ...term,
      subTerms: [...term.subTerms].sort(compareSummaryTerms),
    }));
}

export function buildAcademicYearCatalogTermOptions(
  terms: ReadonlyArray<AcademicYearCatalogSummaryResponse['terms'][number]>
): CatalogTermOption[] {
  return terms.flatMap((term) =>
    term.subTerms.map((subTerm) => ({
      value: String(subTerm.subTermId),
      label: `${subTerm.name} (${subTerm.code}) · ${term.name}`,
    }))
  );
}

export function sortAcademicYearTermGroups(
  termGroups: ReadonlyArray<AcademicTermResponse>
): AcademicTermResponse[] {
  return [...termGroups]
    .sort(
      (left, right) =>
        left.startDate.localeCompare(right.startDate) ||
        left.code.localeCompare(right.code) ||
        left.termId - right.termId
    )
    .map((term) => ({
      ...term,
      subTerms: [...term.subTerms].sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.code.localeCompare(right.code) ||
          left.subTermId - right.subTermId
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
