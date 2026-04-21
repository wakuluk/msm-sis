import {
  AcademicDepartmentPatchRequestSchema,
  CreateAcademicSubjectRequestSchema,
  type AcademicDepartmentDetailFormValues,
  type AcademicDepartmentPatchRequest,
  type AcademicDepartmentResponse,
  type CreateAcademicSubjectRequest,
} from '../schemas/academic-department-schemas';

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

function normalizeAcademicDepartmentDetailFormValues(values: AcademicDepartmentDetailFormValues) {
  return {
    code: validateMaxLength(
      trimRequiredString(values.code, 'Academic department code'),
      20,
      'Academic department code'
    ),
    name: validateMaxLength(
      trimRequiredString(values.name, 'Academic department name'),
      255,
      'Academic department name'
    ),
    active: values.active,
  };
}

export function mapAcademicDepartmentDetailToFormValues(
  detail: AcademicDepartmentResponse
): AcademicDepartmentDetailFormValues {
  return {
    code: detail.code,
    name: detail.name,
    active: detail.active,
  };
}

export function hasAcademicDepartmentDetailChanges(
  detail: AcademicDepartmentResponse,
  values: AcademicDepartmentDetailFormValues
): boolean {
  const originalValues = mapAcademicDepartmentDetailToFormValues(detail);

  return (
    normalizeComparableString(originalValues.code) !== normalizeComparableString(values.code) ||
    normalizeComparableString(originalValues.name) !== normalizeComparableString(values.name) ||
    originalValues.active !== values.active
  );
}

export function buildPatchAcademicDepartmentRequest(
  detail: AcademicDepartmentResponse,
  values: AcademicDepartmentDetailFormValues
): AcademicDepartmentPatchRequest {
  const originalNormalized = normalizeAcademicDepartmentDetailFormValues(
    mapAcademicDepartmentDetailToFormValues(detail)
  );
  const currentNormalized = normalizeAcademicDepartmentDetailFormValues(values);
  const request: AcademicDepartmentPatchRequest = {};

  if (originalNormalized.code !== currentNormalized.code) {
    request.code = currentNormalized.code;
  }

  if (originalNormalized.name !== currentNormalized.name) {
    request.name = currentNormalized.name;
  }

  if (originalNormalized.active !== currentNormalized.active) {
    request.active = currentNormalized.active;
  }

  return AcademicDepartmentPatchRequestSchema.parse(request);
}

export function buildCreateAcademicSubjectRequest(
  values: CreateAcademicSubjectRequest
): CreateAcademicSubjectRequest {
  return CreateAcademicSubjectRequestSchema.parse({
    code: validateMaxLength(
      trimRequiredString(values.code, 'Academic subject code'),
      20,
      'Academic subject code'
    ),
    name: validateMaxLength(
      trimRequiredString(values.name, 'Academic subject name'),
      255,
      'Academic subject name'
    ),
  });
}
