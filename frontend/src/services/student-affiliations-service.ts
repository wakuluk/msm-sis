import { apiRequest } from './api-client';
import {
  AddStudentAthleteRequestSchema,
  PatchStudentAthleteRequestSchema,
  StudentAffiliationSummaryResponseSchema,
  UpdateStudentHonorsRequestSchema,
  type AddStudentAthleteRequest,
  type PatchStudentAthleteRequest,
  type StudentAffiliationSummaryResponse,
  type UpdateStudentHonorsRequest,
} from './schemas/student-affiliation-schemas';

export type GetStudentAffiliationsServiceRequest = {
  studentId: number;
  signal?: AbortSignal;
};

export type UpdateStudentHonorsServiceRequest = {
  studentId: number;
  request: UpdateStudentHonorsRequest;
  signal?: AbortSignal;
};

export type AddStudentAthleteServiceRequest = {
  studentId: number;
  request: AddStudentAthleteRequest;
  signal?: AbortSignal;
};

export type PatchStudentAthleteServiceRequest = {
  studentAthleteId: number;
  studentId: number;
  request: PatchStudentAthleteRequest;
  signal?: AbortSignal;
};

export async function getStudentAffiliations({
  studentId,
  signal,
}: GetStudentAffiliationsServiceRequest): Promise<StudentAffiliationSummaryResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/affiliations`,
    parser: StudentAffiliationSummaryResponseSchema,
    fallbackMessage: 'Failed to load student affiliations.',
    signal,
  });
}

export async function updateStudentHonors({
  studentId,
  request,
  signal,
}: UpdateStudentHonorsServiceRequest): Promise<StudentAffiliationSummaryResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/affiliations/honors`,
    method: 'PUT',
    body: UpdateStudentHonorsRequestSchema.parse(request),
    parser: StudentAffiliationSummaryResponseSchema,
    fallbackMessage: 'Failed to update honors status.',
    signal,
  });
}

export async function addStudentAthlete({
  studentId,
  request,
  signal,
}: AddStudentAthleteServiceRequest): Promise<StudentAffiliationSummaryResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/affiliations/athletes`,
    method: 'POST',
    body: AddStudentAthleteRequestSchema.parse(request),
    parser: StudentAffiliationSummaryResponseSchema,
    fallbackMessage: 'Failed to add athlete status.',
    signal,
  });
}

export async function patchStudentAthlete({
  studentId,
  studentAthleteId,
  request,
  signal,
}: PatchStudentAthleteServiceRequest): Promise<StudentAffiliationSummaryResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/affiliations/athletes/${studentAthleteId}`,
    method: 'PATCH',
    body: PatchStudentAthleteRequestSchema.parse(request),
    parser: StudentAffiliationSummaryResponseSchema,
    fallbackMessage: 'Failed to update athlete status.',
    signal,
  });
}
