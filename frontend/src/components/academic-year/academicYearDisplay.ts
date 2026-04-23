import type { AcademicYearCreateResponse } from '@/services/schemas/academic-years-schemas';

export function displayValue(value: boolean | number | string | null | undefined): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

export function displayDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
}

export function formatDateForFormValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function normalizeDateInputValue(value: string | Date | null): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return formatDateForFormValue(value);
}

export function parseDateInputValue(value: string): Date | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!dateMatch) {
    return null;
  }

  const [, yearPart, monthPart, dayPart] = dateMatch;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function compareAcademicTerms(
  left: Pick<AcademicYearCreateResponse['subTerms'][number], 'code' | 'sortOrder' | 'subTermId'>,
  right: Pick<AcademicYearCreateResponse['subTerms'][number], 'code' | 'sortOrder' | 'subTermId'>
): number {
  return (
    left.sortOrder - right.sortOrder ||
    left.code.localeCompare(right.code) ||
    left.subTermId - right.subTermId
  );
}

export function compareAcademicTermGroups(
  left: Pick<AcademicYearCreateResponse['terms'][number], 'code' | 'startDate' | 'termId'>,
  right: Pick<AcademicYearCreateResponse['terms'][number], 'code' | 'startDate' | 'termId'>
): number {
  return (
    left.startDate.localeCompare(right.startDate) ||
    left.code.localeCompare(right.code) ||
    left.termId - right.termId
  );
}
