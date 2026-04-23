import {
  AcademicSubTermPatchRequestSchema,
  type AcademicSubTermDetailFormValues,
  type AcademicSubTermPatchRequest,
  type AcademicSubTermResponse,
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

function parseRequiredWholeNumber(value: string, fieldLabel: string): number {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldLabel} is required.`);
  }

  if (!/^\d+$/.test(trimmedValue)) {
    throw new Error(`${fieldLabel} must be a whole number.`);
  }

  return Number(trimmedValue);
}

function validateDateRange(startDate: string, endDate: string, fieldLabel: string) {
  if (startDate > endDate) {
    throw new Error(`${fieldLabel} start date must be on or before the end date.`);
  }
}

function normalizeAcademicTermDetailFormValues(values: AcademicSubTermDetailFormValues) {
  const code = validateMaxLength(
    trimRequiredString(values.code, 'Sub term code'),
    20,
    'Sub term code'
  );
  const name = validateMaxLength(
    trimRequiredString(values.name, 'Sub term name'),
    100,
    'Sub term name'
  );
  const startDate = trimRequiredIsoDate(values.startDate, 'Sub term start date');
  const endDate = trimRequiredIsoDate(values.endDate, 'Sub term end date');
  const sortOrder = parseRequiredWholeNumber(values.sortOrder, 'Sub term sort order');

  validateDateRange(startDate, endDate, 'Sub term');

  return {
    code,
    name,
    startDate,
    endDate,
    sortOrder,
  };
}

export function mapAcademicTermDetailToFormValues(
  detail: AcademicSubTermResponse
): AcademicSubTermDetailFormValues {
  return {
    code: toFormString(detail.code),
    name: toFormString(detail.name),
    startDate: toFormString(detail.startDate),
    endDate: toFormString(detail.endDate),
    sortOrder: toFormString(detail.sortOrder),
  };
}

export function hasAcademicTermDetailChanges(
  detail: AcademicSubTermResponse,
  values: AcademicSubTermDetailFormValues
): boolean {
  const originalValues = mapAcademicTermDetailToFormValues(detail);

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
    normalizeComparableString(originalValues.endDate) !==
    normalizeComparableString(values.endDate)
  ) {
    return true;
  }

  if (
    normalizeComparableString(originalValues.sortOrder) !==
    normalizeComparableString(values.sortOrder)
  ) {
    return true;
  }

  return false;
}

export function buildPatchAcademicTermRequest(
  detail: AcademicSubTermResponse,
  values: AcademicSubTermDetailFormValues
): AcademicSubTermPatchRequest {
  const originalNormalized = normalizeAcademicTermDetailFormValues(
    mapAcademicTermDetailToFormValues(detail)
  );
  const currentNormalized = normalizeAcademicTermDetailFormValues(values);
  const request: AcademicSubTermPatchRequest = {};

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

  if (originalNormalized.sortOrder !== currentNormalized.sortOrder) {
    request.sortOrder = currentNormalized.sortOrder;
  }

  return AcademicSubTermPatchRequestSchema.parse(request);
}
