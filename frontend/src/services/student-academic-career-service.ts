import { z } from 'zod';
import { apiRequest } from './api-client';
import {
  AcademicCareerOptionResponseSchema,
  CreateStudentAcademicCareerRequestSchema,
  StudentAcademicCareerResponseSchema,
  UpdateStudentAcademicCareerRequestSchema,
  type AcademicCareerOptionResponse,
  type CreateStudentAcademicCareerRequest,
  type StudentAcademicCareerResponse,
  type UpdateStudentAcademicCareerRequest,
} from './schemas/student-academic-career-schemas';

const StudentAcademicCareerResponseListSchema = z.array(StudentAcademicCareerResponseSchema);
const AcademicCareerOptionResponseListSchema = z.array(AcademicCareerOptionResponseSchema);

export async function getStudentAcademicCareers(
  studentId: number,
  signal?: AbortSignal
): Promise<StudentAcademicCareerResponse[]> {
  return apiRequest({
    path: `/api/students/${studentId}/academic-careers`,
    parser: StudentAcademicCareerResponseListSchema,
    fallbackMessage: 'Failed to fetch student academic careers.',
    signal,
  });
}

export async function createStudentAcademicCareer(
  studentId: number,
  request: CreateStudentAcademicCareerRequest
): Promise<StudentAcademicCareerResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/academic-careers`,
    parser: StudentAcademicCareerResponseSchema,
    fallbackMessage: 'Failed to create student academic career.',
    method: 'POST',
    body: CreateStudentAcademicCareerRequestSchema.parse(request),
  });
}

export async function updateStudentAcademicCareer(
  studentId: number,
  careerId: number,
  request: UpdateStudentAcademicCareerRequest
): Promise<StudentAcademicCareerResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/academic-careers/${careerId}`,
    parser: StudentAcademicCareerResponseSchema,
    fallbackMessage: 'Failed to update student academic career.',
    method: 'PATCH',
    body: UpdateStudentAcademicCareerRequestSchema.parse(request),
  });
}

export async function getAcademicCareerOptions(
  signal?: AbortSignal
): Promise<AcademicCareerOptionResponse[]> {
  return apiRequest({
    path: '/api/academic-careers/options',
    parser: AcademicCareerOptionResponseListSchema,
    fallbackMessage: 'Failed to fetch academic career options.',
    signal,
  });
}
