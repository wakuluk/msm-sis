// Conversion helpers for course-section mutations and staff options.
// Turns UI draft state into create/patch API payloads and keeps selected instructors visible in combobox data.
import type {
  CreateCourseSectionRequest,
  PatchCourseSectionRequest,
} from '@/services/schemas/course-schemas';
import type { StaffReferenceOptionResponse } from '@/services/schemas/staff-schemas';
import type { CourseSectionDraft, StaffSelectOption } from './courseSectionsWorkspaceTypes';

const meetingDayNumbersByKey = new Map<string, number>([
  ['MONDAY', 1],
  ['TUESDAY', 2],
  ['WEDNESDAY', 3],
  ['THURSDAY', 4],
  ['FRIDAY', 5],
]);

export function buildPatchSectionRequest(
  draft: CourseSectionDraft,
  subTermId: number
): PatchCourseSectionRequest | string {
  return buildCreateSectionRequest(draft, subTermId);
}

export function buildCreateSectionRequest(
  draft: CourseSectionDraft,
  subTermId: number
): CreateCourseSectionRequest | string {
  const sectionLetter = draft.sectionCode.trim();
  const credits = draft.credits === null ? Number.NaN : Number(draft.credits);
  const capacity = Number(draft.capacity);

  if (!sectionLetter) {
    return 'Section is required.';
  }

  if (!draft.deliveryMode) {
    return 'Delivery mode is required.';
  }

  if (!draft.gradingBasis) {
    return 'Grading basis is required.';
  }

  if (!Number.isFinite(credits) || credits < 0) {
    return 'Credits are required.';
  }

  if (!Number.isInteger(capacity) || capacity < 0) {
    return 'Capacity must be zero or greater.';
  }

  return {
    subTermId,
    sectionLetter,
    title: null,
    honors: draft.honors,
    lab: draft.lab,
    statusCode: draft.status,
    academicDivisionCode: draft.academicDivision,
    deliveryModeCode: draft.deliveryMode,
    gradingBasisCode: draft.gradingBasis,
    credits,
    capacity,
    waitlistAllowed: draft.waitlistAllowed,
    startDate: null,
    endDate: null,
    linkedGroupCode: null,
    notes: null,
    instructors:
      draft.teacherStaffId === null
        ? null
        : [
            {
              staffId: draft.teacherStaffId,
              roleCode: 'PRIMARY',
              primary: true,
              assignmentStartDate: null,
              assignmentEndDate: null,
            },
          ],
    meetings: buildCreateMeetingRequests(draft),
  };
}

export function buildStaffSelectOptions(
  staffResults: ReadonlyArray<StaffReferenceOptionResponse>,
  draft: CourseSectionDraft
): StaffSelectOption[] {
  const options = staffResults.map((staff) => ({
    value: String(staff.staffId),
    label: buildStaffOptionLabel(staff),
    email: staff.email,
  }));

  if (
    draft.teacherStaffId !== null &&
    draft.teacherAssignment &&
    !options.some((option) => option.value === String(draft.teacherStaffId))
  ) {
    return [
      {
        value: String(draft.teacherStaffId),
        label: draft.teacherAssignment,
        email: null,
      },
      ...options,
    ];
  }

  return options;
}

function buildCreateMeetingRequests(
  draft: CourseSectionDraft
): CreateCourseSectionRequest['meetings'] {
  const room = draft.deliveryMode === 'ONLINE' ? null : draft.room.trim() || null;
  const meetings = Object.entries(draft.meetingSchedule)
    .filter(([, schedule]) => schedule.enabled)
    .map(([day, schedule], index) => ({
      meetingTypeCode: draft.lab ? 'LAB' : 'CLASS',
      dayOfWeek: meetingDayNumbersByKey.get(day) ?? null,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      building: null,
      room,
      startDate: null,
      endDate: null,
      sequenceNumber: index + 1,
    }));

  return meetings.length === 0 ? null : meetings;
}

function buildStaffOptionLabel(staff: StaffReferenceOptionResponse): string {
  const displayName =
    staff.displayName?.trim() || `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim();

  return displayName || staff.email || `Staff ${staff.staffId}`;
}
