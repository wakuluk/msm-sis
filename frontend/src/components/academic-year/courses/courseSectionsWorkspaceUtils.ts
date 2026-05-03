// Data mapping and draft helpers for the section workspace.
// Converts section API responses into UI previews and updates meeting schedule/search/draft structures.
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import type {
  CourseSectionDetailResponse,
  CourseSectionListResultResponse,
} from '@/services/schemas/course-schemas';
import type { CatalogReferenceOption } from '@/services/schemas/reference-schemas';
import {
  initialCourseSectionDraft,
  initialMeetingSchedule,
  type CourseSectionDraft,
  type CourseSectionPreview,
  type CourseSectionSearchValues,
  type MeetingDaySchedule,
  type SelectOption,
} from './courseSectionsWorkspaceTypes';
export { getErrorMessage } from '@/utils/errors';

const meetingDayKeysByNumber = new Map<number, string>([
  [1, 'MONDAY'],
  [2, 'TUESDAY'],
  [3, 'WEDNESDAY'],
  [4, 'THURSDAY'],
  [5, 'FRIDAY'],
]);
const meetingDayLabelsByNumber = new Map<number, string>([
  [1, 'Mon'],
  [2, 'Tue'],
  [3, 'Wed'],
  [4, 'Thu'],
  [5, 'Fri'],
  [6, 'Sat'],
  [7, 'Sun'],
]);

function containsIgnoreCase(value: string, filter: string): boolean {
  const normalizedFilter = filter.trim().toLowerCase();

  if (!normalizedFilter) {
    return true;
  }

  return value.toLowerCase().includes(normalizedFilter);
}

export function filterSections(
  sections: ReadonlyArray<CourseSectionPreview>,
  searchValues: CourseSectionSearchValues
): CourseSectionPreview[] {
  return sections.filter((section) => {
    if (!containsIgnoreCase(section.courseCode, searchValues.courseCode)) {
      return false;
    }

    if (!containsIgnoreCase(section.sectionCode, searchValues.sectionCode)) {
      return false;
    }

    if (!containsIgnoreCase(section.instructor, searchValues.instructor)) {
      return false;
    }

    if (!containsIgnoreCase(section.meetingPattern, searchValues.meetingPattern)) {
      return false;
    }

    if (!containsIgnoreCase(section.room, searchValues.room)) {
      return false;
    }

    return !searchValues.status || section.statusCode === searchValues.status;
  });
}

export function mapReferenceOptionsToCodeSelectOptions(
  options: ReadonlyArray<CatalogReferenceOption>
): SelectOption[] {
  return options.map((option) => ({
    value: option.code,
    label: option.name,
  }));
}

export function getOptionName(
  options: ReadonlyArray<CatalogReferenceOption>,
  code: string | null | undefined
): string | null {
  if (!code) {
    return null;
  }

  return options.find((option) => option.code === code)?.name ?? null;
}

export function normalizeTimeInput(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase().replace(/\s+/g, '');

  if (!normalizedValue) {
    return null;
  }

  const match = /^(\d{1,2})(?::?(\d{2}))?(am|pm)?$/.exec(normalizedValue);

  if (!match) {
    return value;
  }

  const [, hourPart, minutePart = '00', meridiem] = match;
  let hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return value;
  }

  if (meridiem) {
    if (hour < 1 || hour > 12) {
      return value;
    }

    if (meridiem === 'am') {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }
  } else if (hour > 23) {
    return value;
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatTimeInputValue(value: string | null): string {
  if (value === null) {
    return '';
  }

  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return value;
  }

  const [, hourPart, minutePart] = match;
  const hour = Number(hourPart);
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const meridiem = hour < 12 ? 'AM' : 'PM';

  return `${displayHour}:${minutePart} ${meridiem}`;
}

function formatCreditLabel(credits: number): string {
  const formattedCredits = Number.isInteger(credits) ? String(credits) : credits.toFixed(1);

  return `${formattedCredits} ${credits === 1 ? 'credit' : 'credits'}`;
}

export function buildCreditOptions(
  offering: AcademicYearCourseOfferingSearchResultResponse | null
): SelectOption[] {
  if (offering?.minCredits === null || offering?.minCredits === undefined) {
    return [];
  }

  const minCredits = offering.minCredits;
  const maxCredits = offering.maxCredits ?? minCredits;

  if (!offering.variableCredit || minCredits === maxCredits) {
    return [
      {
        value: String(minCredits),
        label: formatCreditLabel(minCredits),
      },
    ];
  }

  const options: SelectOption[] = [];

  for (let credits = minCredits; credits <= maxCredits; credits += 0.5) {
    const roundedCredits = Math.round(credits * 10) / 10;
    options.push({
      value: String(roundedCredits),
      label: formatCreditLabel(roundedCredits),
    });
  }

  return options;
}

export function updateMeetingSchedule(
  currentSchedule: Record<string, MeetingDaySchedule>,
  day: string,
  patch: Partial<MeetingDaySchedule>
): Record<string, MeetingDaySchedule> {
  return {
    ...currentSchedule,
    [day]: {
      ...currentSchedule[day],
      ...patch,
    },
  };
}

export function updateSelectedMeetingTimes(
  currentSchedule: Record<string, MeetingDaySchedule>,
  patch: Pick<Partial<MeetingDaySchedule>, 'startTime' | 'endTime'>
): Record<string, MeetingDaySchedule> {
  return Object.fromEntries(
    Object.entries(currentSchedule).map(([day, schedule]) => [
      day,
      schedule.enabled ? { ...schedule, ...patch } : schedule,
    ])
  ) as Record<string, MeetingDaySchedule>;
}

export function buildDraftFromSection(section: CourseSectionPreview): CourseSectionDraft {
  return {
    ...initialCourseSectionDraft,
    sectionCode: section.sectionLetter,
    honors: section.honors,
    teacherAssignment: section.instructor === 'Unassigned' ? '' : section.instructor,
    teacherStaffId: section.primaryStaffId,
    academicDivision: section.academicDivisionCode,
    deliveryMode: section.deliveryModeCode,
    gradingBasis: section.gradingBasisCode,
    meetingSchedule: buildMeetingScheduleFromSection(section),
    room: section.room === 'TBD' ? '' : section.room,
    capacity: String(section.capacity),
    hardCapacity: section.hardCapacity === null ? '' : String(section.hardCapacity),
    credits: section.credits === null ? null : String(section.credits),
    status: section.statusCode,
    waitlistAllowed: section.waitlistAllowed,
  };
}

export function mapCourseSectionResultToPreview(
  section: CourseSectionListResultResponse,
  offering: AcademicYearCourseOfferingSearchResultResponse | null
): CourseSectionPreview {
  return {
    courseOfferingId: section.courseOfferingId ?? offering?.courseOfferingId ?? 0,
    courseCode: offering?.courseCode ?? 'Course',
    courseTitle: offering?.title ?? section.title ?? 'Title unavailable',
    sectionId: section.sectionId,
    sectionCode: section.displaySectionCode || section.sectionLetter || 'Section',
    sectionLetter: section.sectionLetter ?? '',
    honors: section.honors,
    statusCode: section.statusCode ?? 'DRAFT',
    statusName: section.statusName ?? section.statusCode ?? 'Draft',
    academicDivisionCode: section.academicDivisionCode,
    deliveryModeCode: section.deliveryModeCode,
    gradingBasisCode: section.gradingBasisCode,
    primaryStaffId: section.instructors.find((instructor) => instructor.primary)?.staffId ?? null,
    instructor: section.instructorSummary ?? section.primaryInstructorName ?? 'Unassigned',
    meetingPattern: section.meetingSummary ?? 'TBD',
    room: section.roomSummary ?? 'TBD',
    credits: section.credits,
    capacity: section.capacity ?? 0,
    hardCapacity: section.hardCapacity,
    enrolled: section.enrollmentSummary.enrolledCount,
    waitlistAllowed: section.waitlistAllowed,
    meetings: section.meetings.map((meeting) => ({
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
    })),
  };
}

export function mapCourseSectionDetailToPreview(
  section: CourseSectionDetailResponse
): CourseSectionPreview {
  return {
    courseOfferingId: section.courseOfferingId ?? 0,
    courseCode: section.courseCode ?? 'Course',
    courseTitle: section.courseTitle ?? section.title ?? 'Title unavailable',
    sectionId: section.sectionId,
    sectionCode: section.displaySectionCode || section.sectionLetter || 'Section',
    sectionLetter: section.sectionLetter ?? '',
    honors: section.honors,
    statusCode: section.statusCode ?? 'DRAFT',
    statusName: section.statusName ?? section.statusCode ?? 'Draft',
    academicDivisionCode: section.academicDivisionCode,
    deliveryModeCode: section.deliveryModeCode,
    gradingBasisCode: section.gradingBasisCode,
    primaryStaffId: section.instructors.find((instructor) => instructor.primary)?.staffId ?? null,
    instructor: buildInstructorSummary(section),
    meetingPattern: buildMeetingSummary(section),
    room: buildRoomSummary(section),
    credits: section.credits,
    capacity: section.capacity ?? 0,
    hardCapacity: section.hardCapacity,
    enrolled: section.enrollmentSummary.enrolledCount,
    waitlistAllowed: section.waitlistAllowed,
    meetings: section.meetings.map((meeting) => ({
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
    })),
  };
}

function buildInstructorSummary(section: CourseSectionDetailResponse): string {
  const instructorNames = section.instructors
    .map(
      (instructor) =>
        `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.trim() || instructor.email
    )
    .filter((name): name is string => Boolean(name));

  return instructorNames.length === 0 ? 'Unassigned' : instructorNames.join(', ');
}

function buildMeetingSummary(section: CourseSectionDetailResponse): string {
  const summary = section.meetings
    .map((meeting) => {
      const day = formatMeetingDay(meeting.dayOfWeek);
      const startTime = formatTimeInputValue(meeting.startTime);
      const endTime = formatTimeInputValue(meeting.endTime);
      const timeRange = startTime && endTime ? `${startTime}-${endTime}` : startTime || endTime;

      return [day, timeRange].filter(Boolean).join(' ');
    })
    .filter(Boolean)
    .join('; ');

  return summary || 'TBD';
}

function buildRoomSummary(section: CourseSectionDetailResponse): string {
  const summary = section.meetings
    .map((meeting) => [meeting.building, meeting.room].filter(Boolean).join(' ').trim())
    .filter(Boolean)
    .filter((room, index, rooms) => rooms.indexOf(room) === index)
    .join(', ');

  return summary || 'TBD';
}

function buildMeetingScheduleFromSection(
  section: CourseSectionPreview
): Record<string, MeetingDaySchedule> {
  const schedule = Object.fromEntries(
    Object.entries(initialMeetingSchedule).map(([day, value]) => [day, { ...value }])
  ) as Record<string, MeetingDaySchedule>;

  section.meetings.forEach((meeting) => {
    const dayKey = getMeetingDayKey(meeting.dayOfWeek);

    if (!dayKey) {
      return;
    }

    schedule[dayKey] = {
      enabled: true,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
    };
  });

  return schedule;
}

function getMeetingDayKey(dayOfWeek: number | null): string | null {
  return dayOfWeek === null ? null : (meetingDayKeysByNumber.get(dayOfWeek) ?? null);
}

function formatMeetingDay(dayOfWeek: number | null): string | null {
  return dayOfWeek === null ? null : (meetingDayLabelsByNumber.get(dayOfWeek) ?? null);
}
