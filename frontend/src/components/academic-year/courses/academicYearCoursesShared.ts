// Shared academic-year course helpers.
// Defines term option shape plus common error handling, term option building, and term sorting utilities.
import type { AcademicYearCoursesSummaryResponse } from '@/services/schemas/admin-courses-schemas';
import type { AcademicTermResponse } from '@/services/schemas/academic-years-schemas';

export type CourseTermOption = {
  value: string;
  label: string;
};

function compareSummaryTermGroups(
  left: AcademicYearCoursesSummaryResponse['terms'][number],
  right: AcademicYearCoursesSummaryResponse['terms'][number]
): number {
  return left.code.localeCompare(right.code) || left.termId - right.termId;
}

function compareSummaryTerms(
  left: AcademicYearCoursesSummaryResponse['terms'][number]['subTerms'][number],
  right: AcademicYearCoursesSummaryResponse['terms'][number]['subTerms'][number]
): number {
  return left.code.localeCompare(right.code) || left.subTermId - right.subTermId;
}

export function sortAcademicYearCoursesTermGroups(
  terms: ReadonlyArray<AcademicYearCoursesSummaryResponse['terms'][number]>
) {
  return [...terms].sort(compareSummaryTermGroups).map((term) => ({
    ...term,
    subTerms: [...term.subTerms].sort(compareSummaryTerms),
  }));
}

export function buildAcademicYearCoursesTermOptions(
  terms: ReadonlyArray<AcademicYearCoursesSummaryResponse['terms'][number]>
): CourseTermOption[] {
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
