import {
  StudentCreateRequestSchema,
  type StudentCreateFormValues,
  type StudentCreateRequest,
  StudentPatchRequestSchema,
  type StudentDetailFormValues,
  type StudentDetailResponse,
  type StudentPatchRequest,
} from '../schemas/student-schemas';

type StudentPatchFieldConfig<K extends keyof StudentPatchRequest> = {
  key: K;
  normalize: (values: StudentDetailFormValues) => StudentPatchRequest[K];
};

function toFormString(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export function mapStudentDetailToFormValues(
  detail: StudentDetailResponse
): StudentDetailFormValues {
  return {
    lastName: toFormString(detail.lastName),
    firstName: toFormString(detail.firstName),
    middleName: toFormString(detail.middleName),
    nameSuffix: toFormString(detail.nameSuffix),
    genderId: toFormString(detail.genderId),
    ethnicityId: toFormString(detail.ethnicityId),
    classStandingId: toFormString(detail.classStandingId),
    preferredName: toFormString(detail.preferredName),
    dateOfBirth: toFormString(detail.dateOfBirth),
    estimatedGradDate: toFormString(detail.estimatedGradDate),
    altId: toFormString(detail.altId),
    email: toFormString(detail.email),
    phone: toFormString(detail.phone),
    disabled: detail.disabled,
    addressLine1: toFormString(detail.addressLine1),
    addressLine2: toFormString(detail.addressLine2),
    city: toFormString(detail.city),
    stateRegion: toFormString(detail.stateRegion),
    postalCode: toFormString(detail.postalCode),
    countryCode: toFormString(detail.countryCode),
    addressType: toFormString(detail.addressType),
  };
}

function toNullableTrimmedString(value: string): string | null {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function toNullableWholeNumber(value: string, fieldLabel: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (!/^\d+$/.test(trimmedValue)) {
    throw new Error(`${fieldLabel} must be a whole number.`);
  }

  return Number(trimmedValue);
}

function toNullableIsoDate(value: string, fieldLabel: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!match) {
    throw new Error(`${fieldLabel} must use YYYY-MM-DD format.`);
  }

  const [, yearString, monthString, dayString] = match;
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    throw new Error(`${fieldLabel} must be a valid date.`);
  }

  return trimmedValue;
}

function defineStudentPatchField<K extends keyof StudentPatchRequest>(
  config: StudentPatchFieldConfig<K>
): StudentPatchFieldConfig<K> {
  return config;
}

const studentPatchFieldConfigs = [
  defineStudentPatchField({
    key: 'lastName',
    normalize: (values) => toNullableTrimmedString(values.lastName),
  }),
  defineStudentPatchField({
    key: 'firstName',
    normalize: (values) => toNullableTrimmedString(values.firstName),
  }),
  defineStudentPatchField({
    key: 'middleName',
    normalize: (values) => toNullableTrimmedString(values.middleName),
  }),
  defineStudentPatchField({
    key: 'nameSuffix',
    normalize: (values) => toNullableTrimmedString(values.nameSuffix),
  }),
  defineStudentPatchField({
    key: 'genderId',
    normalize: (values) => toNullableWholeNumber(values.genderId, 'Gender'),
  }),
  defineStudentPatchField({
    key: 'ethnicityId',
    normalize: (values) => toNullableWholeNumber(values.ethnicityId, 'Ethnicity'),
  }),
  defineStudentPatchField({
    key: 'classStandingId',
    normalize: (values) => toNullableWholeNumber(values.classStandingId, 'Class standing'),
  }),
  defineStudentPatchField({
    key: 'preferredName',
    normalize: (values) => toNullableTrimmedString(values.preferredName),
  }),
  defineStudentPatchField({
    key: 'dateOfBirth',
    normalize: (values) => toNullableIsoDate(values.dateOfBirth, 'Date of birth'),
  }),
  defineStudentPatchField({
    key: 'estimatedGradDate',
    normalize: (values) => toNullableIsoDate(values.estimatedGradDate, 'Estimated grad date'),
  }),
  defineStudentPatchField({
    key: 'altId',
    normalize: (values) => toNullableTrimmedString(values.altId),
  }),
  defineStudentPatchField({
    key: 'email',
    normalize: (values) => toNullableTrimmedString(values.email),
  }),
  defineStudentPatchField({
    key: 'phone',
    normalize: (values) => toNullableTrimmedString(values.phone),
  }),
  defineStudentPatchField({
    key: 'disabled',
    normalize: (values) => values.disabled,
  }),
  defineStudentPatchField({
    key: 'addressLine1',
    normalize: (values) => toNullableTrimmedString(values.addressLine1),
  }),
  defineStudentPatchField({
    key: 'addressLine2',
    normalize: (values) => toNullableTrimmedString(values.addressLine2),
  }),
  defineStudentPatchField({
    key: 'city',
    normalize: (values) => toNullableTrimmedString(values.city),
  }),
  defineStudentPatchField({
    key: 'stateRegion',
    normalize: (values) => toNullableTrimmedString(values.stateRegion),
  }),
  defineStudentPatchField({
    key: 'postalCode',
    normalize: (values) => toNullableTrimmedString(values.postalCode),
  }),
  defineStudentPatchField({
    key: 'countryCode',
    normalize: (values) => toNullableTrimmedString(values.countryCode),
  }),
  defineStudentPatchField({
    key: 'addressType',
    normalize: (values) => toNullableTrimmedString(values.addressType),
  }),
] as const;

function fieldHasChanged<K extends keyof StudentPatchRequest>(
  config: StudentPatchFieldConfig<K>,
  originalValues: StudentDetailFormValues,
  currentValues: StudentDetailFormValues
): boolean {
  return config.normalize(originalValues) !== config.normalize(currentValues);
}

function appendChangedField<K extends keyof StudentPatchRequest>(
  request: StudentPatchRequest,
  config: StudentPatchFieldConfig<K>,
  originalValues: StudentDetailFormValues,
  currentValues: StudentDetailFormValues
) {
  const originalValue = config.normalize(originalValues);
  const currentValue = config.normalize(currentValues);

  if (originalValue !== currentValue) {
    request[config.key] = currentValue;
  }
}

export function hasStudentDetailChanges(
  detail: StudentDetailResponse,
  values: StudentDetailFormValues
): boolean {
  const originalValues = mapStudentDetailToFormValues(detail);

  return studentPatchFieldConfigs.some((config) => fieldHasChanged(config, originalValues, values));
}

export function buildPatchStudentRequest(
  detail: StudentDetailResponse,
  values: StudentDetailFormValues
): StudentPatchRequest {
  const originalValues = mapStudentDetailToFormValues(detail);
  const request: StudentPatchRequest = {};

  studentPatchFieldConfigs.forEach((config) => {
    appendChangedField(request, config, originalValues, values);
  });

  return StudentPatchRequestSchema.parse(request);
}

export function buildCreateStudentRequest(values: StudentCreateFormValues): StudentCreateRequest {
  return StudentCreateRequestSchema.parse({
    lastName: toNullableTrimmedString(values.lastName),
    firstName: toNullableTrimmedString(values.firstName),
    middleName: toNullableTrimmedString(values.middleName),
    nameSuffix: toNullableTrimmedString(values.nameSuffix),
    genderId: toNullableWholeNumber(values.genderId, 'Gender'),
    ethnicityId: toNullableWholeNumber(values.ethnicityId, 'Ethnicity'),
    classStandingId: toNullableWholeNumber(values.classStandingId, 'Class standing'),
    preferredName: toNullableTrimmedString(values.preferredName),
    dateOfBirth: toNullableIsoDate(values.dateOfBirth, 'Date of birth'),
    estimatedGradDate: toNullableIsoDate(values.estimatedGradDate, 'Estimated grad date'),
    altId: toNullableTrimmedString(values.altId),
    email: toNullableTrimmedString(values.email),
    phone: toNullableTrimmedString(values.phone),
    addressLine1: toNullableTrimmedString(values.addressLine1),
    addressLine2: toNullableTrimmedString(values.addressLine2),
    city: toNullableTrimmedString(values.city),
    stateRegion: toNullableTrimmedString(values.stateRegion),
    postalCode: toNullableTrimmedString(values.postalCode),
    countryCode: toNullableTrimmedString(values.countryCode),
    addressType: toNullableTrimmedString(values.addressType),
  });
}
