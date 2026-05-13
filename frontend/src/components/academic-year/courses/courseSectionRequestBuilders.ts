// Conversion helpers for course-section mutations and staff options.
// Turns UI draft state into create/patch API payloads and keeps selected instructors visible in combobox data.
import type {
  CreateCourseSectionInstructorRequest,
  CreateCourseSectionRequest,
  PatchCourseSectionRequest,
} from '@/services/schemas/course-schemas';
import type { StaffReferenceOptionResponse } from '@/services/schemas/staff-schemas';
import type { CourseSectionDraft, StaffSelectOption } from './courseSectionsWorkspaceTypes';
import { normalizeCourseSectionCode } from './courseSectionCodeUtils';

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
  const sectionLetter = normalizeCourseSectionCode(draft.sectionCode);
  const credits = draft.credits === null ? Number.NaN : Number(draft.credits);
  const capacity = Number(draft.capacity);
  const hardCapacity = draft.hardCapacity.trim() === '' ? null : Number(draft.hardCapacity);

  if (!sectionLetter) {
    return 'Section is required.';
  }
  if (draft.honors && !sectionLetter.endsWith('H')) {
    return 'Honors section codes must end in H.';
  }
  if (!draft.honors && sectionLetter.includes('H')) {
    return 'Non-honors section codes cannot contain H.';
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
  if (hardCapacity !== null && (!Number.isInteger(hardCapacity) || hardCapacity < 0)) {
    return 'Hard capacity must be zero or greater.';
  }
  if (hardCapacity !== null && hardCapacity < capacity) {
    return 'Hard capacity must be greater than or equal to capacity.';
  }

  const instructors = buildInstructorRequests(draft);

  if (typeof instructors === 'string') {
    return instructors;
  }

  return {
    subTermId,
    sectionLetter,
    title: null,
    honors: draft.honors,
    statusCode: draft.status,
    academicDivisionCode: draft.academicDivision,
    deliveryModeCode: draft.deliveryMode,
    gradingBasisCode: draft.gradingBasis,
    credits,
    capacity,
    hardCapacity,
    waitlistAllowed: draft.waitlistAllowed,
    startDate: null,
    endDate: null,
    linkedGroupCode: null,
    notes: null,
    instructors,
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
  const selectedOptions = draft.instructors
    .filter((instructor) => instructor.staffId !== null && instructor.label)
    .map((instructor) => ({
      value: String(instructor.staffId),
      label: instructor.label,
      email: instructor.email,
    }))
    .filter(
      (option, index, selected) =>
        selected.findIndex((selectedOption) => selectedOption.value === option.value) === index &&
        !options.some((existingOption) => existingOption.value === option.value)
    );

  return [...selectedOptions, ...options];
}

function buildInstructorRequests(
  draft: CourseSectionDraft
): CreateCourseSectionRequest['instructors'] | string {
  const instructors: CreateCourseSectionInstructorRequest[] = [];
  const instructorStaffIds = new Set<number>();

  for (const instructor of draft.instructors) {
    const roleCode = instructor.roleCode?.trim() || null;

    if (instructor.staffId === null) {
      continue;
    }

    if (!roleCode) {
      return 'Select a role for each instructor assignment.';
    }

    if (instructorStaffIds.has(instructor.staffId)) {
      return 'An instructor can only be assigned once to a course section.';
    }

    instructorStaffIds.add(instructor.staffId);
    instructors.push({
      staffId: instructor.staffId,
      roleCode,
      canViewGrades: instructor.canManageGrades ? true : instructor.canViewGrades,
      canManageGrades: instructor.canManageGrades,
    });
  }

  return instructors.length === 0 ? null : instructors;
}

function buildCreateMeetingRequests(
  draft: CourseSectionDraft
): CreateCourseSectionRequest['meetings'] {
  const room = draft.deliveryMode === 'ONLINE' ? null : draft.room.trim() || null;
  const meetings = Object.entries(draft.meetingSchedule)
    .filter(([, schedule]) => schedule.enabled)
    .map(([day, schedule], index) => ({
      meetingTypeCode: 'CLASS',
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
