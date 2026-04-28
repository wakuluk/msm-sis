// Type definitions for the course-section student workspace.
// Centralizes list/detail/event/mutation state unions plus sortable enrollment table settings.
import type {
  CourseSectionStudentEnrollmentEventResponse,
  CourseSectionStudentResponse,
} from '@/services/schemas/course-schemas';

export type StudentListState =
  | { status: 'idle'; students: CourseSectionStudentResponse[] }
  | { status: 'loading'; students: CourseSectionStudentResponse[] }
  | { status: 'success'; students: CourseSectionStudentResponse[] }
  | { status: 'error'; students: CourseSectionStudentResponse[]; message: string };

export type SelectedEnrollmentDetailState =
  | { status: 'idle'; student: CourseSectionStudentResponse | null }
  | { status: 'loading'; student: CourseSectionStudentResponse | null }
  | { status: 'success'; student: CourseSectionStudentResponse }
  | { status: 'error'; student: CourseSectionStudentResponse | null; message: string };

export type StudentMutationState =
  | { status: 'idle' }
  | { status: 'adding' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

export type EnrollmentEventListState =
  | { status: 'idle'; events: CourseSectionStudentEnrollmentEventResponse[] }
  | { status: 'loading'; events: CourseSectionStudentEnrollmentEventResponse[] }
  | { status: 'success'; events: CourseSectionStudentEnrollmentEventResponse[] }
  | { status: 'error'; events: CourseSectionStudentEnrollmentEventResponse[]; message: string };

export type StudentSortBy =
  | 'student'
  | 'studentId'
  | 'status'
  | 'credits'
  | 'grading'
  | 'registered';

export type StudentSortDirection = 'asc' | 'desc';

export type SortableStudentColumn = {
  label: string;
  sortBy: StudentSortBy;
};

export type EditEnrollmentValues = {
  statusCode: string | null;
  gradingBasisCode: string | null;
  creditsAttempted: number | null;
  includeInGpa: boolean;
  capacityOverride: boolean;
  manualAddReason?: string | null;
  reason?: string | null;
};
