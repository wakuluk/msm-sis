import { apiRequest } from './api-client';
import {
  AcademicYearCatalogSummaryResponseSchema,
  AcademicYearCourseOfferingSearchResponseSchema,
  AdminCourseOfferingDetailResponseSchema,
  CreateAcademicYearCourseOfferingRequestSchema,
  ImportAcademicYearCourseOfferingsResponseSchema,
  PatchCourseOfferingRequestSchema,
  SyncAcademicYearCourseOfferingsResponseSchema,
  type AcademicYearCatalogSummaryResponse,
  type AcademicYearCourseOfferingSearchResponse,
  type AdminCourseOfferingDetailResponse,
  type CreateAcademicYearCourseOfferingRequest,
  type ImportAcademicYearCourseOfferingsResponse,
  type PatchCourseOfferingRequest,
  type SyncAcademicYearCourseOfferingsResponse,
} from './schemas/admin-catalog-schemas';

export type GetAcademicYearCatalogSummaryRequest = {
  academicYearId: number;
  signal?: AbortSignal;
};

export type SearchAcademicYearCourseOfferingsRequest = {
  academicYearId: number;
  termId?: number;
  schoolId?: number;
  departmentId?: number;
  subjectId?: number;
  courseCode?: string;
  title?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
  signal?: AbortSignal;
};

export type CreateAcademicYearCourseOfferingArgs = {
  academicYearId: number;
  request: CreateAcademicYearCourseOfferingRequest;
  signal?: AbortSignal;
};

export type ImportAcademicYearCourseOfferingsArgs = {
  academicYearId: number;
  signal?: AbortSignal;
};

export type SyncAcademicYearCourseOfferingsArgs = {
  academicYearId: number;
  signal?: AbortSignal;
};

export type GetAdminCourseOfferingByIdRequest = {
  courseOfferingId: number;
  signal?: AbortSignal;
};

export type PatchCourseOfferingArgs = {
  courseOfferingId: number;
  request: PatchCourseOfferingRequest;
  signal?: AbortSignal;
};

export async function getAcademicYearCatalogSummary({
  academicYearId,
  signal,
}: GetAcademicYearCatalogSummaryRequest): Promise<AcademicYearCatalogSummaryResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/catalog/summary`,
    parser: AcademicYearCatalogSummaryResponseSchema,
    fallbackMessage: 'Failed to load academic year catalog summary.',
    signal,
  });
}

export async function searchAcademicYearCourseOfferings({
  academicYearId,
  termId,
  schoolId,
  departmentId,
  subjectId,
  courseCode,
  title,
  page = 0,
  size = 25,
  sortBy = 'courseCode',
  sortDirection = 'asc',
  signal,
}: SearchAcademicYearCourseOfferingsRequest): Promise<AcademicYearCourseOfferingSearchResponse> {
  const queryParams = new URLSearchParams();

  if (termId !== undefined) {
    queryParams.set('termId', String(termId));
  }

  if (schoolId !== undefined) {
    queryParams.set('schoolId', String(schoolId));
  }

  if (departmentId !== undefined) {
    queryParams.set('departmentId', String(departmentId));
  }

  if (subjectId !== undefined) {
    queryParams.set('subjectId', String(subjectId));
  }

  if (courseCode && courseCode.trim()) {
    queryParams.set('courseCode', courseCode.trim());
  }

  if (title && title.trim()) {
    queryParams.set('title', title.trim());
  }

  queryParams.set('page', String(page));
  queryParams.set('size', String(size));
  queryParams.set('sortBy', sortBy);
  queryParams.set('sortDirection', sortDirection);

  return apiRequest({
    path: `/api/academic-year/${academicYearId}/course-offerings/search?${queryParams.toString()}`,
    parser: AcademicYearCourseOfferingSearchResponseSchema,
    fallbackMessage: 'Failed to search academic year course offerings.',
    signal,
  });
}

export async function createAcademicYearCourseOffering({
  academicYearId,
  request,
  signal,
}: CreateAcademicYearCourseOfferingArgs): Promise<AdminCourseOfferingDetailResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/course-offerings`,
    method: 'POST',
    body: CreateAcademicYearCourseOfferingRequestSchema.parse(request),
    parser: AdminCourseOfferingDetailResponseSchema,
    fallbackMessage: 'Failed to create course offering.',
    signal,
  });
}

export async function importAcademicYearCourseOfferings({
  academicYearId,
  signal,
}: ImportAcademicYearCourseOfferingsArgs): Promise<ImportAcademicYearCourseOfferingsResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/course-offerings/import-current-course-versions`,
    method: 'POST',
    parser: ImportAcademicYearCourseOfferingsResponseSchema,
    fallbackMessage: 'Failed to import current course versions into the catalog.',
    signal,
  });
}

export async function syncAcademicYearCourseOfferings({
  academicYearId,
  signal,
}: SyncAcademicYearCourseOfferingsArgs): Promise<SyncAcademicYearCourseOfferingsResponse> {
  return apiRequest({
    path: `/api/academic-year/${academicYearId}/course-offerings/sync-current-course-versions`,
    method: 'POST',
    parser: SyncAcademicYearCourseOfferingsResponseSchema,
    fallbackMessage: 'Failed to sync course offerings to current course versions.',
    signal,
  });
}

export async function getAdminCourseOfferingById({
  courseOfferingId,
  signal,
}: GetAdminCourseOfferingByIdRequest): Promise<AdminCourseOfferingDetailResponse> {
  return apiRequest({
    path: `/api/course-offerings/details-advanced/${courseOfferingId}`,
    parser: AdminCourseOfferingDetailResponseSchema,
    fallbackMessage: 'Failed to load course offering detail.',
    signal,
  });
}

export async function patchCourseOffering({
  courseOfferingId,
  request,
  signal,
}: PatchCourseOfferingArgs): Promise<AdminCourseOfferingDetailResponse> {
  return apiRequest({
    path: `/api/course-offerings/${courseOfferingId}`,
    method: 'PATCH',
    body: PatchCourseOfferingRequestSchema.parse(request),
    parser: AdminCourseOfferingDetailResponseSchema,
    fallbackMessage: 'Failed to update course offering.',
    signal,
  });
}
