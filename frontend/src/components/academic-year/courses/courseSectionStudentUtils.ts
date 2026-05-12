// Display and table helpers for section student enrollment data.
// Owns student status colors, date/credit formatting, search matching, event descriptions, and sorting logic.
import type {
  CourseSectionStudentEnrollmentEventResponse,
  CourseSectionStudentResponse,
} from '@/services/schemas/course-schemas';
import type { SortableStudentColumn, StudentSortBy } from './courseSectionStudentTypes';

export const sortableStudentColumns: SortableStudentColumn[] = [
  { label: 'Student', sortBy: 'student' },
  { label: 'ID', sortBy: 'studentId' },
  { label: 'Status', sortBy: 'status' },
  { label: 'Waitlist offer', sortBy: 'waitlistOffer' },
  { label: 'Credits', sortBy: 'credits' },
  { label: 'Grading', sortBy: 'grading' },
  { label: 'Final grade', sortBy: 'finalGrade' },
  { label: 'Registered', sortBy: 'registered' },
];

export function studentStatusColor(statusCode: string | null) {
  switch (statusCode) {
    case 'REGISTERED':
      return 'green';
    case 'WAITLISTED':
      return 'yellow';
    case 'DROPPED':
    case 'WITHDRAWN':
    case 'CANCELLED':
      return 'red';
    default:
      return 'gray';
  }
}

export function waitlistOfferStatusColor(status: string | null | undefined) {
  switch (status) {
    case 'OFFERED':
      return 'blue';
    case 'ACCEPTED':
      return 'green';
    case 'EXPIRED':
      return 'red';
    case 'CANCELLED':
      return 'gray';
    default:
      return 'gray';
  }
}

export function formatWaitlistOfferStatus(status: string | null | undefined) {
  if (!status) {
    return 'No offer';
  }

  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatStudentDate(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatStudentDateTime(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

export function formatCredits(value: number | null) {
  return value === null ? 'Not set' : value.toFixed(1);
}

export function getCurrentFinalGradeLabel(student: CourseSectionStudentResponse) {
  if (!student.currentFinalGrade) {
    return 'Not posted';
  }

  return (
    student.currentFinalGrade.gradeMarkCode ?? student.currentFinalGrade.gradeMarkName ?? 'Not set'
  );
}

export function formatBoolean(value: boolean) {
  return value ? 'Yes' : 'No';
}

export function formatEventType(value: string | null) {
  if (!value) {
    return 'Event';
  }

  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatStatusTransition(event: CourseSectionStudentEnrollmentEventResponse) {
  if (!event.fromStatusName && !event.toStatusName) {
    return 'Not set';
  }

  if (!event.fromStatusName) {
    return event.toStatusName ?? 'Not set';
  }

  if (!event.toStatusName || event.fromStatusName === event.toStatusName) {
    return event.fromStatusName;
  }

  return `${event.fromStatusName} to ${event.toStatusName}`;
}

export function studentMatchesSearch(student: CourseSectionStudentResponse, searchValue: string) {
  const normalizedSearch = searchValue.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    student.studentDisplayName,
    student.email,
    student.studentId === null ? null : String(student.studentId),
    student.statusName,
    student.gradingBasisName,
    getCurrentFinalGradeLabel(student),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalizedSearch));
}

function compareNullableString(left: string | null | undefined, right: string | null | undefined) {
  const leftValue = left?.trim() || '';
  const rightValue = right?.trim() || '';

  return leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
}

function compareNullableNumber(left: number | null | undefined, right: number | null | undefined) {
  if (left === null || left === undefined) {
    return right === null || right === undefined ? 0 : 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  return left - right;
}

function getRegisteredSortValue(student: CourseSectionStudentResponse) {
  return student.registeredAt ?? student.enrollmentDate;
}

export function compareStudentsByColumn(
  left: CourseSectionStudentResponse,
  right: CourseSectionStudentResponse,
  sortBy: StudentSortBy
) {
  switch (sortBy) {
    case 'student':
      return compareNullableString(left.studentDisplayName, right.studentDisplayName);
    case 'studentId':
      return compareNullableNumber(left.studentId, right.studentId);
    case 'status':
      return compareNullableString(
        left.statusName ?? left.statusCode,
        right.statusName ?? right.statusCode
      );
    case 'waitlistOffer':
      return compareNullableString(
        left.waitlistOffer?.expiresAt ?? left.waitlistOffer?.status ?? null,
        right.waitlistOffer?.expiresAt ?? right.waitlistOffer?.status ?? null
      );
    case 'credits':
      return compareNullableNumber(left.creditsAttempted, right.creditsAttempted);
    case 'grading':
      return compareNullableString(
        left.gradingBasisName ?? left.gradingBasisCode,
        right.gradingBasisName ?? right.gradingBasisCode
      );
    case 'finalGrade':
      return compareNullableString(
        getCurrentFinalGradeLabel(left),
        getCurrentFinalGradeLabel(right)
      );
    case 'registered':
      return compareNullableString(getRegisteredSortValue(left), getRegisteredSortValue(right));
  }
}
