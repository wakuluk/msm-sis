import { apiRequest } from './api-client';
import {
  StudentScheduleResponseSchema,
  type StudentScheduleResponse,
} from './schemas/student-schedule-schemas';

export type GetMyStudentScheduleRequest = {
  termId?: number | null;
  signal?: AbortSignal;
};

export type GetStudentScheduleRequest = {
  studentId: number;
  termId?: number | null;
  signal?: AbortSignal;
};

function buildScheduleQueryString(termId: number | null | undefined) {
  const queryParams = new URLSearchParams();

  if (termId !== null && termId !== undefined) {
    queryParams.set('termId', String(termId));
  }

  const queryString = queryParams.toString();

  return queryString ? `?${queryString}` : '';
}

export function getMyStudentSchedule({
  termId,
  signal,
}: GetMyStudentScheduleRequest = {}): Promise<StudentScheduleResponse> {
  return apiRequest({
    path: `/api/me/schedule${buildScheduleQueryString(termId)}`,
    parser: StudentScheduleResponseSchema,
    fallbackMessage: 'Failed to load your schedule.',
    signal,
  });
}

export function getStudentSchedule({
  studentId,
  termId,
  signal,
}: GetStudentScheduleRequest): Promise<StudentScheduleResponse> {
  return apiRequest({
    path: `/api/students/${studentId}/schedule${buildScheduleQueryString(termId)}`,
    parser: StudentScheduleResponseSchema,
    fallbackMessage: 'Failed to load student schedule.',
    signal,
  });
}
