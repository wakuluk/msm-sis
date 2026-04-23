import {
  AcademicTermPatchRequestSchema,
  type AcademicTermDetailFormValues,
  type AcademicTermPatchRequest,
  type AcademicTermResponse,
} from '../schemas/academic-years-schemas';

function toFormString(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function normalizeComparableString(value: string): string {
  return value.trim();
}

function trimRequiredString(value: string, fieldLabel: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldLabel} is required.`);
  }

  return trimmedValue;
}

function validateMaxLength(value: string, maxLength: number, fieldLabel: string): string {
  if (value.length > maxLength) {
    throw new Error(`${fieldLabel} must be ${maxLength} characters or fewer.`);
  }

  return value;
}

function trimRequiredIsoDate(value: string, fieldLabel: string): string {
  const trimmedValue = trimRequiredString(value, fieldLabel);
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!dateMatch) {
    throw new Error(`${fieldLabel} must be in YYYY-MM-DD format.`);
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
    throw new Error(`${fieldLabel} must be a valid calendar date.`);
  }

  return trimmedValue;
}

function validateDateRange(startDate: string, endDate: string, fieldLabel: string) {
  if (startDate > endDate) {
    throw new Error(`${fieldLabel} start date must be on or before the end date.`);
  }
}

function normalizeAcademicTermGroupDetailFormValues(values: AcademicTermDetailFormValues) {
  const code = validateMaxLength(
    trimRequiredString(values.code, 'Term code'),
    20,
    'Term code'
  );
  const name = validateMaxLength(
    trimRequiredString(values.name, 'Term name'),
    100,
    'Term name'
  );
  const startDate = trimRequiredIsoDate(values.startDate, 'Term start date');
  const endDate = trimRequiredIsoDate(values.endDate, 'Term end date');

  validateDateRange(startDate, endDate, 'Term');

  return {
    code,
    name,
    startDate,
    endDate,
  };
}

export function mapAcademicTermGroupDetailToFormValues(
  detail: AcademicTermResponse
): AcademicTermDetailFormValues {
  return {
    code: toFormString(detail.code),
    name: toFormString(detail.name),
    startDate: toFormString(detail.startDate),
    endDate: toFormString(detail.endDate),
  };
}

export function hasAcademicTermGroupDetailChanges(
  detail: AcademicTermResponse,
  values: AcademicTermDetailFormValues
): boolean {
  const originalValues = mapAcademicTermGroupDetailToFormValues(detail);

  if (normalizeComparableString(originalValues.code) !== normalizeComparableString(values.code)) {
    return true;
  }

  if (normalizeComparableString(originalValues.name) !== normalizeComparableString(values.name)) {
    return true;
  }

  if (
    normalizeComparableString(originalValues.startDate) !==
    normalizeComparableString(values.startDate)
  ) {
    return true;
  }

  if (
    normalizeComparableString(originalValues.endDate) !== normalizeComparableString(values.endDate)
  ) {
    return true;
  }

  return false;
}

export function buildPatchAcademicTermGroupRequest(
  detail: AcademicTermResponse,
  values: AcademicTermDetailFormValues
): AcademicTermPatchRequest {
  const originalNormalized = normalizeAcademicTermGroupDetailFormValues(
    mapAcademicTermGroupDetailToFormValues(detail)
  );
  const currentNormalized = normalizeAcademicTermGroupDetailFormValues(values);
  const request: AcademicTermPatchRequest = {};

  if (originalNormalized.code !== currentNormalized.code) {
    request.code = currentNormalized.code;
  }

  if (originalNormalized.name !== currentNormalized.name) {
    request.name = currentNormalized.name;
  }

  if (originalNormalized.startDate !== currentNormalized.startDate) {
    request.startDate = currentNormalized.startDate;
  }

  if (originalNormalized.endDate !== currentNormalized.endDate) {
    request.endDate = currentNormalized.endDate;
  }

  return AcademicTermPatchRequestSchema.parse(request);
}
