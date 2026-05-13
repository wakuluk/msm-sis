import type {
  InstructorScheduleReferenceOptionsResponse,
  InstructorScheduleSearchResponse,
  InstructorScheduleSearchResultResponse,
  InstructorScheduleSubTermOptionResponse,
  InstructorScheduleTermOptionResponse,
} from '@/services/schemas/instructor-schedule-schemas';
import type {
  TeachingScheduleDetail,
  TeachingScheduleMeeting,
  TeachingScheduleSubTerm,
  TeachingScheduleTerm,
} from './teachingSchedule.types';

const DEFAULT_WEEK_START = '2026-09-14';
const EVENT_COLORS = ['#1c7ed6', '#f08c00', '#2f9e44', '#7048e8', '#d6336c', '#0c8599'];

type TermReferenceLookup = {
  termsById: Map<number, InstructorScheduleTermOptionResponse>;
  subTermsById: Map<number, InstructorScheduleSubTermOptionResponse>;
};

function toDisplayValue(value: string | null | undefined, fallback = '-') {
  return value?.trim() || fallback;
}

function buildTermReferenceLookup(
  referenceOptions?: InstructorScheduleReferenceOptionsResponse
): TermReferenceLookup {
  const termsById = new Map<number, InstructorScheduleTermOptionResponse>();
  const subTermsById = new Map<number, InstructorScheduleSubTermOptionResponse>();

  referenceOptions?.academicYears.forEach((academicYear) => {
    academicYear.terms.forEach((term) => {
      termsById.set(term.id, term);

      term.subTerms.forEach((subTerm) => {
        subTermsById.set(subTerm.id, subTerm);
      });
    });
  });

  return { termsById, subTermsById };
}

function getCourseColor(sectionId: number | null, fallbackIndex: number) {
  if (sectionId === null) {
    return EVENT_COLORS[fallbackIndex % EVENT_COLORS.length];
  }

  return EVENT_COLORS[Math.abs(sectionId) % EVENT_COLORS.length];
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function toMeetingDateTime(weekStart: string, dayOfWeek: number, time: string) {
  return `${addDays(weekStart, dayOfWeek - 1)}T${time}`;
}

function buildLocation({
  building,
  room,
}: {
  building: string | null;
  room: string | null;
}) {
  const location = [building, room].filter(Boolean).join(' ').trim();

  return location || 'Location TBD';
}

function mapRowMeetingToTeachingMeeting({
  color,
  meeting,
  row,
  rowIndex,
  weekStart,
}: {
  color: string;
  meeting: InstructorScheduleSearchResultResponse['meetings'][number];
  row: InstructorScheduleSearchResultResponse;
  rowIndex: number;
  weekStart: string;
}): TeachingScheduleMeeting | null {
  if (meeting.dayOfWeek === null || meeting.startTime === null || meeting.endTime === null) {
    return null;
  }

  const location = buildLocation({
    building: meeting.building,
    room: meeting.room,
  });

  return {
    id: `${row.sectionInstructorId}-${meeting.sectionMeetingId}`,
    courseCode: toDisplayValue(row.courseCode, 'Course'),
    courseTitle: toDisplayValue(row.courseTitle ?? row.sectionTitle, 'Untitled section'),
    sectionCode: toDisplayValue(row.displaySectionCode ?? row.sectionLetter, 'Section'),
    sectionId: row.sectionId ?? undefined,
    subTermCode: toDisplayValue(row.subTermCode, 'SUBTERM'),
    subTermId: row.subTermId ?? undefined,
    subTermName: toDisplayValue(row.subTermName, 'Subterm'),
    termId: row.termId ?? undefined,
    dayOfWeek: meeting.dayOfWeek,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    start: toMeetingDateTime(weekStart, meeting.dayOfWeek, meeting.startTime),
    end: toMeetingDateTime(weekStart, meeting.dayOfWeek, meeting.endTime),
    location,
    building: meeting.building ?? location,
    modality: toDisplayValue(row.deliveryModeName, 'Delivery TBD'),
    enrolled: 0,
    softCapacity: 0,
    hardCapacity: 0,
    statusCode: toDisplayValue(row.statusCode, 'UNKNOWN'),
    statusName: toDisplayValue(row.statusName, 'Status unavailable'),
    color: color || EVENT_COLORS[rowIndex % EVENT_COLORS.length],
  };
}

function buildReferenceTermsForRows(
  rows: InstructorScheduleSearchResultResponse[],
  referenceLookup: TermReferenceLookup
) {
  const rowTermIds = new Set(
    rows
      .map((row) => row.termId)
      .filter((termId): termId is number => termId !== null)
  );

  return Array.from(rowTermIds)
    .map((termId) => referenceLookup.termsById.get(termId))
    .filter((term): term is InstructorScheduleTermOptionResponse => Boolean(term));
}

function mapReferenceSubTerm(subTerm: InstructorScheduleSubTermOptionResponse): TeachingScheduleSubTerm {
  return {
    id: subTerm.id,
    code: subTerm.code,
    name: subTerm.name,
    startDate: subTerm.startDate,
    endDate: subTerm.endDate,
  };
}

function mapReferenceTerm(
  term: InstructorScheduleTermOptionResponse,
  academicYearName: string
): TeachingScheduleTerm {
  return {
    id: term.id,
    code: term.code,
    name: term.name,
    startDate: term.startDate,
    endDate: term.endDate,
    academicYearName,
    subTerms: term.subTerms.map(mapReferenceSubTerm),
  };
}

function buildFallbackTerms(rows: InstructorScheduleSearchResultResponse[]): TeachingScheduleTerm[] {
  const termsById = new Map<number, TeachingScheduleTerm>();

  rows.forEach((row, index) => {
    if (row.termId === null || row.subTermId === null) {
      return;
    }

    const term = termsById.get(row.termId) ?? {
      id: row.termId,
      code: toDisplayValue(row.termCode, `TERM-${index + 1}`),
      name: toDisplayValue(row.termName, 'Term'),
      startDate: DEFAULT_WEEK_START,
      endDate: DEFAULT_WEEK_START,
      academicYearName: toDisplayValue(row.academicYearName, 'Academic Year'),
      subTerms: [],
    };

    if (!term.subTerms.some((subTerm) => subTerm.id === row.subTermId)) {
      term.subTerms.push({
        id: row.subTermId,
        code: toDisplayValue(row.subTermCode, `SUBTERM-${index + 1}`),
        name: toDisplayValue(row.subTermName, 'Subterm'),
        startDate: DEFAULT_WEEK_START,
        endDate: DEFAULT_WEEK_START,
      });
    }

    termsById.set(row.termId, term);
  });

  return Array.from(termsById.values());
}

function buildTerms(
  rows: InstructorScheduleSearchResultResponse[],
  referenceOptions?: InstructorScheduleReferenceOptionsResponse
) {
  const referenceLookup = buildTermReferenceLookup(referenceOptions);
  const referenceTerms = buildReferenceTermsForRows(rows, referenceLookup).map((term) =>
    mapReferenceTerm(
      term,
      rows.find((row) => row.termId === term.id)?.academicYearName ??
        referenceOptions?.academicYears.find((academicYear) =>
          academicYear.terms.some((academicYearTerm) => academicYearTerm.id === term.id)
        )?.name ??
        'Academic Year'
    )
  );

  return referenceTerms.length > 0 ? referenceTerms : buildFallbackTerms(rows);
}

function getWeekStart(terms: TeachingScheduleTerm[]) {
  const firstTermStart = terms
    .map((term) => term.startDate)
    .filter(Boolean)
    .sort()[0];

  if (!firstTermStart) {
    return DEFAULT_WEEK_START;
  }

  const date = new Date(`${firstTermStart}T00:00:00`);
  const dayOfWeek = date.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  date.setDate(date.getDate() - daysSinceMonday);

  return date.toISOString().slice(0, 10);
}

function getPrimaryRow(rows: InstructorScheduleSearchResultResponse[]) {
  return rows.find((row) => row.primary) ?? rows[0] ?? null;
}

export function mapInstructorScheduleResponseToTeachingScheduleDetail(
  response: InstructorScheduleSearchResponse,
  referenceOptions?: InstructorScheduleReferenceOptionsResponse
): TeachingScheduleDetail {
  const rows = response.results;
  const primaryRow = getPrimaryRow(rows);
  const terms = buildTerms(rows, referenceOptions);
  const weekStart = getWeekStart(terms);
  const meetings = rows.flatMap((row, rowIndex) => {
    const color = getCourseColor(row.sectionId, rowIndex);

    return row.meetings
      .map((meeting) =>
        mapRowMeetingToTeachingMeeting({
          color,
          meeting,
          row,
          rowIndex,
          weekStart,
        })
      )
      .filter((meeting): meeting is TeachingScheduleMeeting => Boolean(meeting));
  });
  const academicYears = Array.from(
    new Set(terms.map((term) => term.academicYearName).filter(Boolean))
  );

  return {
    academicYears,
    generatedAt: new Date().toISOString(),
    instructor: {
      id: primaryRow?.staffId ?? primaryRow?.instructorUserId ?? 0,
      name: toDisplayValue(primaryRow?.instructorName, 'Instructor'),
      email: toDisplayValue(primaryRow?.instructorEmail, ''),
      title: toDisplayValue(primaryRow?.roleName, 'Instructor'),
      school: toDisplayValue(primaryRow?.schoolName, ''),
      department: toDisplayValue(primaryRow?.departmentName, ''),
    },
    selectedAcademicYearName: terms[0]?.academicYearName ?? '',
    selectedTermId: terms[0]?.id ?? 0,
    terms,
    weekStart,
    meetings,
  };
}
