import {
  AcademicYearPatchRequestSchema,
  AcademicYearCreateRequestSchema,
  AcademicYearPostSubTermsRequestSchema,
  type AcademicSubTermResponse,
  type AcademicTermCreateRequest,
  type AcademicTermFormValues,
  type AcademicYearCreateFormValues,
  type AcademicYearCreateResponse,
  type AcademicYearCreateRequest,
  type AcademicYearCreateSubTermRequest,
  type AcademicYearDetailFormValues,
  type AcademicYearPatchRequest,
  type AcademicYearSubTermFormValues,
} from '../schemas/academic-years-schemas';

type NormalizedAcademicYearTerm = {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
};

type NormalizedAcademicYearDetail = {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
};

type NormalizedAcademicTerm = {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  terms: NormalizedAcademicYearTerm[];
};

export type AcademicTermCreatePlan = Omit<AcademicTermCreateRequest, 'subTermIds'> & {
  subTermCodes: string[];
};

export type AcademicYearCreateSubmissionPlan = {
  academicYearRequest: AcademicYearCreateRequest;
  terms: AcademicTermCreatePlan[];
};

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

function normalizeAcademicYearTermFormValue(
  term: AcademicYearSubTermFormValues,
  fieldLabelPrefix: string
): NormalizedAcademicYearTerm {
  const code = validateMaxLength(
    trimRequiredString(term.code, `${fieldLabelPrefix} code`),
    20,
    `${fieldLabelPrefix} code`
  );
  const name = validateMaxLength(
    trimRequiredString(term.name, `${fieldLabelPrefix} name`),
    100,
    `${fieldLabelPrefix} name`
  );
  const startDate = trimRequiredIsoDate(term.startDate, `${fieldLabelPrefix} start date`);
  const endDate = trimRequiredIsoDate(term.endDate, `${fieldLabelPrefix} end date`);
  const sortOrder = parseRequiredWholeNumber(term.sortOrder, `${fieldLabelPrefix} sort order`);

  validateDateRange(startDate, endDate, fieldLabelPrefix);

  return {
    code,
    name,
    startDate,
    endDate,
    sortOrder,
  };
}

function validateAcademicYearTermCollection(
  terms: NormalizedAcademicYearTerm[],
  academicYearStartDate: string,
  academicYearEndDate: string
) {
  const termCodes = new Set<string>();
  const sortOrders = new Set<number>();

  terms.forEach((term, index) => {
    if (term.startDate < academicYearStartDate || term.endDate > academicYearEndDate) {
      throw new Error(`Sub term ${index + 1} dates must fall within the academic year date range.`);
    }

    if (!termCodes.add(term.code)) {
      throw new Error('Sub term code must be unique within an academic year.');
    }

    if (!sortOrders.add(term.sortOrder)) {
      throw new Error('Sub term sort order must be unique within an academic year.');
    }
  });
}

function normalizeAcademicTermFormValue(
  term: AcademicTermFormValues,
  index: number
): NormalizedAcademicTerm {
  const fieldLabelPrefix = `Term ${index + 1}`;
  const code = validateMaxLength(
    trimRequiredString(term.code, `${fieldLabelPrefix} code`),
    20,
    `${fieldLabelPrefix} code`
  );
  const name = validateMaxLength(
    trimRequiredString(term.name, `${fieldLabelPrefix} name`),
    100,
    `${fieldLabelPrefix} name`
  );
  const startDate = trimRequiredIsoDate(term.startDate, `${fieldLabelPrefix} start date`);
  const endDate = trimRequiredIsoDate(term.endDate, `${fieldLabelPrefix} end date`);

  validateDateRange(startDate, endDate, fieldLabelPrefix);

  const terms = term.terms.map((subTerm, termIndex) =>
    normalizeAcademicYearTermFormValue(subTerm, `${fieldLabelPrefix} sub term ${termIndex + 1}`)
  );

  terms.forEach((term, termIndex) => {
    if (term.startDate < startDate || term.endDate > endDate) {
      throw new Error(
        `Term ${index + 1} sub term ${termIndex + 1} dates must fall within the term date range.`
      );
    }
  });

  return {
    code,
    name,
    startDate,
    endDate,
    terms,
  };
}

function normalizeAcademicYearDetailFormValues(
  values: AcademicYearDetailFormValues
): NormalizedAcademicYearDetail {
  const code = validateMaxLength(
    trimRequiredString(values.code, 'Academic year code'),
    20,
    'Academic year code'
  );
  const name = validateMaxLength(
    trimRequiredString(values.name, 'Academic year name'),
    100,
    'Academic year name'
  );
  const startDate = trimRequiredIsoDate(values.startDate, 'Academic year start date');
  const endDate = trimRequiredIsoDate(values.endDate, 'Academic year end date');
  validateDateRange(startDate, endDate, 'Academic year');

  return {
    code,
    name,
    startDate,
    endDate,
  };
}

function validateAcademicYearTermCollectionForCreate(
  terms: NormalizedAcademicTerm[],
  academicYearStartDate: string,
  academicYearEndDate: string
) {
  const groupCodes = new Set<string>();

  terms.forEach((term, index) => {
    if (term.startDate < academicYearStartDate || term.endDate > academicYearEndDate) {
      throw new Error(`Term ${index + 1} dates must fall within the academic year date range.`);
    }

    if (!groupCodes.add(term.code)) {
      throw new Error('Term code must be unique within an academic year.');
    }
  });
}

function compareAcademicTerms(left: AcademicSubTermResponse, right: AcademicSubTermResponse): number {
  return (
    left.sortOrder - right.sortOrder ||
    left.code.localeCompare(right.code) ||
    left.subTermId - right.subTermId
  );
}

export function getAcademicYearResponseSubTerms(
  detail: AcademicYearCreateResponse
): AcademicSubTermResponse[] {
  const termsById = new Map<number, AcademicSubTermResponse>();

  detail.subTerms.forEach((subTerm) => {
    termsById.set(subTerm.subTermId, subTerm);
  });

  detail.terms.forEach((term) => {
    term.subTerms.forEach((subTerm) => {
      if (!termsById.has(subTerm.subTermId)) {
        termsById.set(subTerm.subTermId, subTerm);
      }
    });
  });

  return [...termsById.values()].sort(compareAcademicTerms);
}

export function mapAcademicYearDetailToFormValues(
  detail: AcademicYearCreateResponse
): AcademicYearDetailFormValues {
  return {
    code: toFormString(detail.code),
    name: toFormString(detail.name),
    startDate: toFormString(detail.startDate),
    endDate: toFormString(detail.endDate),
  };
}

export function hasAcademicYearDetailChanges(
  detail: AcademicYearCreateResponse,
  values: AcademicYearDetailFormValues
): boolean {
  const originalValues = mapAcademicYearDetailToFormValues(detail);

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

export function buildPatchAcademicYearRequest(
  detail: AcademicYearCreateResponse,
  values: AcademicYearDetailFormValues
): AcademicYearPatchRequest {
  const originalNormalized = normalizeAcademicYearDetailFormValues(
    mapAcademicYearDetailToFormValues(detail)
  );
  const currentNormalized = normalizeAcademicYearDetailFormValues(values);
  const request: AcademicYearPatchRequest = {};

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

  return AcademicYearPatchRequestSchema.parse(request);
}

export function buildCreateAcademicYearSubmissionPlan(
  values: AcademicYearCreateFormValues
): AcademicYearCreateSubmissionPlan {
  const normalizedAcademicYear = normalizeAcademicYearDetailFormValues(values);
  const normalizedTerms = values.terms.map((term, index) =>
    normalizeAcademicTermFormValue(term, index)
  );
  const flattenedTerms = normalizedTerms.flatMap((term) => term.terms);

  validateAcademicYearTermCollectionForCreate(
    normalizedTerms,
    normalizedAcademicYear.startDate,
    normalizedAcademicYear.endDate
  );
  validateAcademicYearTermCollection(
    flattenedTerms,
    normalizedAcademicYear.startDate,
    normalizedAcademicYear.endDate
  );

  return {
    academicYearRequest: AcademicYearCreateRequestSchema.parse({
      ...normalizedAcademicYear,
      subTerms: flattenedTerms,
    }),
    terms: normalizedTerms.map((term) => ({
      code: term.code,
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      subTermCodes: term.terms.map((subTerm) => subTerm.code),
    })),
  };
}

export function buildPostAcademicYearTermsRequest(
  detail: AcademicYearCreateResponse,
  values: AcademicYearSubTermFormValues[]
): AcademicYearCreateSubTermRequest[] {
  if (values.length === 0) {
    throw new Error('Add at least one sub term before saving.');
  }

  const academicYearStartDate = trimRequiredIsoDate(detail.startDate, 'Academic year start date');
  const academicYearEndDate = trimRequiredIsoDate(detail.endDate, 'Academic year end date');
  const newTerms = values.map((term, index) =>
    normalizeAcademicYearTermFormValue(term, `Sub term ${index + 1}`)
  );
  const existingTerms = getAcademicYearResponseSubTerms(detail);
  const existingTermCodes = new Set(
    existingTerms.map((term) => normalizeComparableString(term.code))
  );
  const existingSortOrders = new Set(existingTerms.map((term) => term.sortOrder));

  validateAcademicYearTermCollection(newTerms, academicYearStartDate, academicYearEndDate);

  newTerms.forEach((term) => {
    if (existingTermCodes.has(term.code)) {
      throw new Error('Sub term code must be unique within an academic year.');
    }

    if (existingSortOrders.has(term.sortOrder)) {
      throw new Error('Sub term sort order must be unique within an academic year.');
    }
  });

  return AcademicYearPostSubTermsRequestSchema.parse(newTerms);
}
