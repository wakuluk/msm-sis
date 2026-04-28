// Shared type and initial-state definitions for the section workspace.
// Describes section previews, editable draft state, search filters, reference loading state, and select options.
import type { CourseSectionReferenceOptionsResponse } from '@/services/schemas/reference-schemas';

export type CourseSectionPreview = {
  courseOfferingId: number;
  courseCode: string;
  courseTitle: string;
  sectionId: number;
  sectionCode: string;
  sectionLetter: string;
  honors: boolean;
  lab: boolean;
  statusCode: string;
  statusName: string;
  academicDivisionCode: string | null;
  deliveryModeCode: string | null;
  gradingBasisCode: string | null;
  primaryStaffId: number | null;
  instructor: string;
  meetingPattern: string;
  room: string;
  credits: number | null;
  capacity: number;
  enrolled: number;
  waitlistAllowed: boolean;
  meetings: ReadonlyArray<{
    dayOfWeek: number | null;
    startTime: string | null;
    endTime: string | null;
  }>;
};

export type CourseSectionSearchValues = {
  courseCode: string;
  sectionCode: string;
  instructor: string;
  meetingPattern: string;
  room: string;
  status: string | null;
};

export type MeetingDaySchedule = {
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
};

export type CourseSectionDraft = {
  sectionCode: string;
  honors: boolean;
  lab: boolean;
  teacherAssignment: string;
  teacherStaffId: number | null;
  academicDivision: string | null;
  deliveryMode: string | null;
  gradingBasis: string | null;
  sameMeetingTime: boolean;
  meetingSchedule: Record<string, MeetingDaySchedule>;
  room: string;
  capacity: string;
  credits: string | null;
  status: string | null;
  waitlistAllowed: boolean;
};

export type SectionReferenceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: CourseSectionReferenceOptionsResponse };

export type SelectOption = {
  value: string;
  label: string;
};

export type StaffSelectOption = {
  value: string;
  label: string;
  email: string | null;
};

export const initialCourseSectionSearchValues: CourseSectionSearchValues = {
  courseCode: '',
  sectionCode: '',
  instructor: '',
  meetingPattern: '',
  room: '',
  status: null,
};

export const meetingDayOptions = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
];

export const initialMeetingSchedule = Object.fromEntries(
  meetingDayOptions.map((day) => [
    day.value,
    {
      enabled: false,
      startTime: null,
      endTime: null,
    },
  ])
) as Record<string, MeetingDaySchedule>;

export const initialCourseSectionDraft: CourseSectionDraft = {
  sectionCode: '',
  honors: false,
  lab: false,
  teacherAssignment: '',
  teacherStaffId: null,
  academicDivision: null,
  deliveryMode: null,
  gradingBasis: null,
  sameMeetingTime: false,
  meetingSchedule: initialMeetingSchedule,
  room: '',
  capacity: '',
  credits: null,
  status: 'DRAFT',
  waitlistAllowed: false,
};
