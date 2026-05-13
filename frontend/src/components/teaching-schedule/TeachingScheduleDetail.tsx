import { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventContentArg, EventInput } from '@fullcalendar/core';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import {
  Autocomplete,
  Badge,
  Box,
  Grid,
  Group,
  MultiSelect,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import type {
  TeachingScheduleDetail,
  TeachingScheduleMeeting,
  TeachingScheduleSubTerm,
} from './teachingSchedule.types';
import classes from './TeachingScheduleDetail.module.css';

type TeachingScheduleDetailProps = {
  detail: TeachingScheduleDetail;
  mode?: 'admin' | 'staff';
};

type TeachingSectionTableSortBy =
  | 'courseCode'
  | 'enrolled'
  | 'location'
  | 'meetingDays'
  | 'modality'
  | 'status'
  | 'subTerm';

type TeachingSectionSummary = {
  courseCode: string;
  courseTitle: string;
  enrolled: number;
  location: string;
  meetings: TeachingScheduleMeeting[];
  modality: string;
  sectionCode: string;
  sectionId?: number;
  softCapacity: number;
  statusCode: string;
  statusName: string;
  subTermName: string;
};

function formatTimeRange(startDateTime: string | Date | null | undefined, endDateTime: string | Date | null | undefined) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const startTime = startDateTime ? formatter.format(new Date(startDateTime)) : '';
  const endTime = endDateTime ? formatter.format(new Date(endDateTime)) : '';

  if (!startTime || !endTime) {
    return startTime || endTime;
  }

  return `${startTime} - ${endTime}`;
}

function overlapsDateRange(
  rangeStart: string,
  rangeEnd: string,
  candidateStart: string,
  candidateEnd: string
) {
  return candidateStart <= rangeEnd && candidateEnd >= rangeStart;
}

function getVisibleSubTerms(term: TeachingScheduleDetail['terms'][number]): TeachingScheduleSubTerm[] {
  return term.subTerms.filter((subTerm) =>
    overlapsDateRange(term.startDate, term.endDate, subTerm.startDate, subTerm.endDate)
  );
}

function getSubTermSelectionValue(subTerm: TeachingScheduleSubTerm) {
  return String(subTerm.id);
}

function getMeetingSubTermSelectionValue(meeting: TeachingScheduleMeeting) {
  return meeting.subTermId === undefined ? meeting.subTermCode : String(meeting.subTermId);
}

function subTermsOverlap(firstSubTerm: TeachingScheduleSubTerm, secondSubTerm: TeachingScheduleSubTerm) {
  return overlapsDateRange(
    firstSubTerm.startDate,
    firstSubTerm.endDate,
    secondSubTerm.startDate,
    secondSubTerm.endDate
  );
}

function getCompatibleSubTermCodes(
  subTerms: TeachingScheduleSubTerm[],
  selectedSubTermCodes: string[]
) {
  if (selectedSubTermCodes.length === 0) {
    return new Set(subTerms.map(getSubTermSelectionValue));
  }

  const selectedSubTerms = subTerms.filter((subTerm) =>
    selectedSubTermCodes.includes(getSubTermSelectionValue(subTerm))
  );

  return new Set(
    subTerms
      .filter((candidateSubTerm) =>
        selectedSubTerms.every((selectedSubTerm) =>
          subTermsOverlap(candidateSubTerm, selectedSubTerm)
        )
      )
      .map(getSubTermSelectionValue)
  );
}

function filterCompatibleSubTermSelection(
  subTerms: TeachingScheduleSubTerm[],
  selectedSubTermCodes: string[]
) {
  return selectedSubTermCodes.reduce<string[]>((nextSelection, subTermCode) => {
    const candidateSubTerm = subTerms.find(
      (subTerm) => getSubTermSelectionValue(subTerm) === subTermCode
    );

    if (!candidateSubTerm) {
      return nextSelection;
    }

    const canAddCandidate = nextSelection
      .map((selectedSubTermCode) =>
        subTerms.find((subTerm) => getSubTermSelectionValue(subTerm) === selectedSubTermCode)
      )
      .filter((subTerm): subTerm is TeachingScheduleSubTerm => Boolean(subTerm))
      .every((selectedSubTerm) => subTermsOverlap(candidateSubTerm, selectedSubTerm));

    return canAddCandidate ? [...nextSelection, subTermCode] : nextSelection;
  }, []);
}

function getMeetingDayLabel(startDateTime: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(startDateTime));
}

function getSectionStatusColor(statusCode: string) {
  if (statusCode === 'DRAFT') {
    return 'gray';
  }

  if (statusCode === 'PLANNED') {
    return 'yellow';
  }

  if (statusCode === 'IN_PROGRESS') {
    return 'blue';
  }

  if (statusCode === 'CANCELLED' || statusCode === 'CANCELED') {
    return 'red';
  }

  return 'green';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateRange(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);

  return date.toISOString().slice(0, 10);
}

function getWeekStartForDate(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  const dayOfWeek = date.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  date.setDate(date.getDate() - daysSinceMonday);

  return date.toISOString().slice(0, 10);
}

function getWeekStartForTerm(term: TeachingScheduleDetail['terms'][number] | undefined, fallback: string) {
  return term ? getWeekStartForDate(term.startDate) : fallback;
}

function toPatternDateTime(weekStart: string, dayOfWeek: number, time: string) {
  return `${addDays(weekStart, dayOfWeek - 1)}T${time}`;
}

function getMeetingStart(meeting: TeachingScheduleMeeting, weekStart: string) {
  return meeting.dayOfWeek !== undefined && meeting.startTime
    ? toPatternDateTime(weekStart, meeting.dayOfWeek, meeting.startTime)
    : meeting.start;
}

function getMeetingEnd(meeting: TeachingScheduleMeeting, weekStart: string) {
  return meeting.dayOfWeek !== undefined && meeting.endTime
    ? toPatternDateTime(weekStart, meeting.dayOfWeek, meeting.endTime)
    : meeting.end;
}

function mapMeetingsToEvents(meetings: TeachingScheduleMeeting[], weekStart: string): EventInput[] {
  return meetings.map((meeting) => ({
    id: meeting.id,
    title: `${meeting.courseCode}-${meeting.sectionCode}`,
    start: getMeetingStart(meeting, weekStart),
    end: getMeetingEnd(meeting, weekStart),
    backgroundColor: meeting.color,
    borderColor: meeting.color,
    extendedProps: { meeting },
  }));
}

function renderEventContent(eventInfo: EventContentArg) {
  const meeting = eventInfo.event.extendedProps.meeting as TeachingScheduleMeeting | undefined;
  const timeRange =
    formatTimeRange(eventInfo.event.start, eventInfo.event.end) || eventInfo.timeText;

  return (
    <div className={classes.eventContent}>
      <span className={classes.eventTitle}>{eventInfo.event.title}</span>
      <span className={classes.eventTime}>{timeRange}</span>
      {meeting?.location ? <span className={classes.eventMeta}>{meeting.location}</span> : null}
    </div>
  );
}

function renderDayHeader(headerInfo: { date: Date }) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(headerInfo.date);
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" fw={800} tt="uppercase">
        {label}
      </Text>
      <Text fw={800}>{value}</Text>
    </Stack>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={2} className={classes.summaryMetric}>
      <Text size="xs" c="dimmed" fw={800} tt="uppercase">
        {label}
      </Text>
      <Text fw={900} className={classes.summaryMetricValue}>
        {value}
      </Text>
    </Stack>
  );
}

function getSectionCount(meetings: TeachingScheduleMeeting[]) {
  return new Set(meetings.map(getSectionSummaryKey)).size;
}

function getSectionSummaryKey(meeting: TeachingScheduleMeeting) {
  return meeting.sectionId === undefined
    ? `${meeting.courseCode}-${meeting.sectionCode}`
    : String(meeting.sectionId);
}

function getTeachingSections(meetings: TeachingScheduleMeeting[]) {
  return Array.from(
    new Map(
      meetings.map((meeting) => [
        getSectionSummaryKey(meeting),
        {
          courseCode: meeting.courseCode,
          courseTitle: meeting.courseTitle,
          sectionCode: meeting.sectionCode,
          sectionId: meeting.sectionId,
          subTermName: meeting.subTermName,
          modality: meeting.modality,
          location: meeting.location,
          enrolled: meeting.enrolled,
          softCapacity: meeting.softCapacity,
          statusCode: meeting.statusCode,
          statusName: meeting.statusName,
          meetings: meetings.filter(
            (sectionMeeting) =>
              getSectionSummaryKey(sectionMeeting) === getSectionSummaryKey(meeting)
          ),
        },
      ])
    ).values()
  );
}

function getSectionSearchText(section: TeachingSectionSummary, weekStart: string) {
  return [
    section.courseCode,
    section.courseTitle,
    section.sectionCode,
    section.subTermName,
    section.modality,
    section.statusName,
    section.statusCode,
    section.location,
    ...section.meetings.map((meeting) => getMeetingDayLabel(getMeetingStart(meeting, weekStart))),
  ]
    .join(' ')
    .toLowerCase();
}

function getMeetingDays(section: TeachingSectionSummary, weekStart: string) {
  return section.meetings
    .map((meeting) => getMeetingDayLabel(getMeetingStart(meeting, weekStart)))
    .join(', ');
}

function compareText(firstValue: string, secondValue: string) {
  return firstValue.localeCompare(secondValue, undefined, { sensitivity: 'base' });
}

function sortTeachingSections(
  sections: TeachingSectionSummary[],
  sortBy: TeachingSectionTableSortBy,
  sortDirection: 'asc' | 'desc',
  weekStart: string
) {
  const sortedSections = [...sections].sort((firstSection, secondSection) => {
    if (sortBy === 'enrolled') {
      return firstSection.enrolled - secondSection.enrolled;
    }

    if (sortBy === 'location') {
      return compareText(firstSection.location, secondSection.location);
    }

    if (sortBy === 'meetingDays') {
      return compareText(
        getMeetingDays(firstSection, weekStart),
        getMeetingDays(secondSection, weekStart)
      );
    }

    if (sortBy === 'modality') {
      return compareText(firstSection.modality, secondSection.modality);
    }

    if (sortBy === 'status') {
      return compareText(firstSection.statusName, secondSection.statusName);
    }

    if (sortBy === 'subTerm') {
      return compareText(firstSection.subTermName, secondSection.subTermName);
    }

    return compareText(
      `${firstSection.courseCode}-${firstSection.sectionCode}`,
      `${secondSection.courseCode}-${secondSection.sectionCode}`
    );
  });

  return sortDirection === 'asc' ? sortedSections : sortedSections.reverse();
}

function buildTeachingSectionColumns(weekStart: string): ColumnDef<TeachingSectionSummary>[] {
  return [
    {
      id: 'courseCode',
      header: 'Section',
      size: 230,
      cell: ({ row }) => (
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={900}>{row.original.courseCode}</Text>
            <Text c="dimmed">Section {row.original.sectionCode}</Text>
          </Group>
          <Text size="sm" c="dimmed">
            {row.original.courseTitle}
          </Text>
        </Stack>
      ),
      meta: { sortBy: 'courseCode' satisfies TeachingSectionTableSortBy },
    },
    {
      id: 'status',
      header: 'Status',
      size: 130,
      cell: ({ row }) => (
        <Badge color={getSectionStatusColor(row.original.statusCode)} variant="light">
          {row.original.statusName}
        </Badge>
      ),
      meta: { sortBy: 'status' satisfies TeachingSectionTableSortBy },
    },
    {
      id: 'subTerm',
      header: 'Subterm',
      size: 140,
      cell: ({ row }) => (
        <Badge color="blue" variant="light">
          {row.original.subTermName}
        </Badge>
      ),
      meta: { sortBy: 'subTerm' satisfies TeachingSectionTableSortBy },
    },
    {
      id: 'modality',
      header: 'Type',
      size: 150,
      cell: ({ row }) => <Badge variant="outline">{row.original.modality}</Badge>,
      meta: { sortBy: 'modality' satisfies TeachingSectionTableSortBy },
    },
    {
      id: 'meetingDays',
      header: 'Meetings',
      size: 250,
      cell: ({ row }) => (
        <Stack gap={2}>
          {row.original.meetings.map((meeting) => (
            <Text key={meeting.id} size="sm">
              {getMeetingDayLabel(getMeetingStart(meeting, weekStart))}{' '}
              {formatTimeRange(getMeetingStart(meeting, weekStart), getMeetingEnd(meeting, weekStart))}
            </Text>
          ))}
        </Stack>
      ),
      meta: { sortBy: 'meetingDays' satisfies TeachingSectionTableSortBy },
    },
    {
      id: 'location',
      header: 'Location',
      size: 190,
      cell: ({ row }) => row.original.location,
      meta: { sortBy: 'location' satisfies TeachingSectionTableSortBy },
    },
    {
      id: 'enrolled',
      header: 'Enrollment',
      size: 150,
      cell: ({ row }) => (
        <Text size="sm" fw={700}>
          {row.original.enrolled}/{row.original.softCapacity} enrolled
        </Text>
      ),
      meta: { sortBy: 'enrolled' satisfies TeachingSectionTableSortBy },
    },
  ];
}

function TeachingSectionTable({
  meetings,
  weekStart,
}: {
  meetings: TeachingScheduleMeeting[];
  weekStart: string;
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<TeachingSectionTableSortBy>('courseCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const sections = useMemo(() => getTeachingSections(meetings), [meetings]);
  const filteredSections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const visibleSections =
      normalizedSearch.length === 0
        ? sections
        : sections.filter((section) =>
            getSectionSearchText(section, weekStart).includes(normalizedSearch)
          );

    return sortTeachingSections(visibleSections, sortBy, sortDirection, weekStart);
  }, [search, sections, sortBy, sortDirection, weekStart]);
  const table = useReactTable({
    columns: buildTeachingSectionColumns(weekStart),
    data: filteredSections,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.sectionId?.toString() ?? `${row.courseCode}-${row.sectionCode}`,
  });

  function handleToggleSort(nextSortBy: TeachingSectionTableSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <TextInput
          label="Search sections"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          placeholder="Course, section, subterm, location"
          w={{ base: '100%', sm: 360 }}
        />
        <Text size="sm" c="dimmed">
          Showing {filteredSections.length} of {sections.length} sections
        </Text>
      </Group>
      <SearchResultsTable
        table={table}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onToggleSort={handleToggleSort}
        getRowProps={(row) => {
          const detailPath =
            row.original.sectionId === undefined
              ? null
              : `/academics/course-sections/${row.original.sectionId}`;

          return {
            onClick: () => {
              if (detailPath) {
                navigate(detailPath);
              }
            },
            onKeyDown: (event) => {
              if (!detailPath || (event.key !== 'Enter' && event.key !== ' ')) {
                return;
              }

              event.preventDefault();
              navigate(detailPath);
            },
            role: detailPath ? 'button' : undefined,
            tabIndex: detailPath ? 0 : undefined,
            'aria-label': detailPath
              ? `Open ${row.original.courseCode} section ${row.original.sectionCode}`
              : undefined,
          };
        }}
      />
    </Stack>
  );
}

export function TeachingScheduleDetail({
  detail,
  mode = 'staff',
}: TeachingScheduleDetailProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const calendarShellRef = useRef<HTMLDivElement | null>(null);
  const [selectedAcademicYearName, setSelectedAcademicYearName] = useState(
    detail.selectedAcademicYearName
  );
  const availableTerms = detail.terms.filter(
    (term) => term.academicYearName === selectedAcademicYearName
  );
  const initialTerm =
    availableTerms.find((term) => term.id === detail.selectedTermId) ?? availableTerms[0];
  const [selectedTermId, setSelectedTermId] = useState(initialTerm ? String(initialTerm.id) : '');
  const [selectedSubTermCodes, setSelectedSubTermCodes] = useState<string[]>(() => {
    return initialTerm ? getVisibleSubTerms(initialTerm).map(getSubTermSelectionValue) : [];
  });

  useEffect(() => {
    const nextTerm =
      detail.terms
        .filter((term) => term.academicYearName === selectedAcademicYearName)
        .find((term) => term.id === detail.selectedTermId) ??
      detail.terms.find((term) => term.academicYearName === selectedAcademicYearName);

    setSelectedTermId(nextTerm ? String(nextTerm.id) : '');
    setSelectedSubTermCodes(nextTerm ? getVisibleSubTerms(nextTerm).map(getSubTermSelectionValue) : []);
  }, [detail.terms, detail.selectedTermId, selectedAcademicYearName]);

  const selectedTerm =
    availableTerms.find((term) => term.id === Number(selectedTermId)) ?? availableTerms[0];
  const calendarWeekStart = getWeekStartForTerm(selectedTerm, detail.weekStart);
  const overlappingSubTerms = selectedTerm ? getVisibleSubTerms(selectedTerm) : [];
  const overlappingSubTermCodes = new Set(overlappingSubTerms.map(getSubTermSelectionValue));
  const compatibleSubTermCodes = getCompatibleSubTermCodes(
    overlappingSubTerms,
    selectedSubTermCodes.filter((subTermCode) => overlappingSubTermCodes.has(subTermCode))
  );
  const effectiveSelectedSubTermCodes = filterCompatibleSubTermSelection(
    overlappingSubTerms,
    selectedSubTermCodes
  );
  const visibleSubTermCodes = new Set(effectiveSelectedSubTermCodes);
  const visibleMeetings = detail.meetings.filter((meeting) => {
    if (meeting.termId !== undefined && selectedTerm && meeting.termId !== selectedTerm.id) {
      return false;
    }

    return visibleSubTermCodes.has(getMeetingSubTermSelectionValue(meeting));
  });
  const visibleSectionCount = getSectionCount(visibleMeetings);
  const calendarEvents = useMemo(
    () => mapMeetingsToEvents(visibleMeetings, calendarWeekStart),
    [calendarWeekStart, visibleMeetings]
  );

  useEffect(() => {
    const calendarShell = calendarShellRef.current;
    const calendar = calendarRef.current;

    if (!calendarShell || !calendar) {
      return undefined;
    }

    const updateCalendarSize = () => {
      window.requestAnimationFrame(() => {
        calendar.getApi().updateSize();
      });
    };

    updateCalendarSize();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateCalendarSize);

      return () => window.removeEventListener('resize', updateCalendarSize);
    }

    const resizeObserver = new ResizeObserver(updateCalendarSize);
    resizeObserver.observe(calendarShell);

    return () => resizeObserver.disconnect();
  }, [calendarEvents, calendarWeekStart]);
  const termOptions = availableTerms.map((term) => ({
    value: String(term.id),
    label: term.name,
  }));
  const subTermOptions = overlappingSubTerms.map((subTerm) => {
    const value = getSubTermSelectionValue(subTerm);
    const selected = effectiveSelectedSubTermCodes.includes(value);

    return {
      value,
      label: `${subTerm.name} (${subTerm.code})`,
      disabled: !selected && !compatibleSubTermCodes.has(value),
    };
  });
  const selectedSubTerms = overlappingSubTerms.filter((subTerm) =>
    effectiveSelectedSubTermCodes.includes(getSubTermSelectionValue(subTerm))
  );

  return (
    <Stack gap="lg">
      <RecordPageSection
        title={mode === 'admin' ? 'Instructor Schedule Detail' : 'My Instructor Schedule'}
        description={
          mode === 'admin'
            ? 'Read-only weekly teaching pattern for reviewing an instructor assignment by term.'
            : 'Read-only weekly pattern of your assigned course sections for the selected term.'
        }
      >
        <Grid.Col span={12}>
          <div className={classes.summaryPanel}>
            <div className={classes.identitySummary}>
              <SummaryField label="Instructor" value={detail.instructor.name} />
              <SummaryField label="School" value={detail.instructor.school} />
              <SummaryField label="Department" value={detail.instructor.department} />
            </div>
            <div className={classes.workloadSummary}>
              <SummaryMetric label="Sections" value={String(visibleSectionCount)} />
              <SummaryMetric label="Weekly meetings" value={String(visibleMeetings.length)} />
            </div>
          </div>
        </Grid.Col>
      </RecordPageSection>

      <RecordPageSection
        title="Weekly Pattern"
        description="This is a recurring teaching pattern, not a dated calendar. Overlapping meetings stack in the same time slot."
      >
        <Grid.Col span={12}>
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Autocomplete
                label="Academic Year"
                data={detail.academicYears}
                value={selectedAcademicYearName}
                onChange={setSelectedAcademicYearName}
                onBlur={() => {
                  if (!detail.academicYears.includes(selectedAcademicYearName)) {
                    setSelectedAcademicYearName(detail.selectedAcademicYearName);
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label="Term"
                data={termOptions}
                value={selectedTermId}
                onChange={(value) => {
                  if (!value) {
                    return;
                  }

                  setSelectedTermId(value);

                  const nextTerm = availableTerms.find((term) => term.id === Number(value));
                  setSelectedSubTermCodes(
                    nextTerm ? getVisibleSubTerms(nextTerm).map(getSubTermSelectionValue) : []
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <MultiSelect
                label="Subterms"
                data={subTermOptions}
                value={effectiveSelectedSubTermCodes}
                onChange={(values) => {
                  setSelectedSubTermCodes(filterCompatibleSubTermSelection(overlappingSubTerms, values));
                }}
                placeholder="Select subterms"
                clearable
              />
            </Grid.Col>
            {selectedSubTerms.length > 0 ? (
              <Grid.Col span={12}>
                <div className={classes.subTermDateSummary}>
                  {selectedSubTerms.map((subTerm) => (
                    <div key={subTerm.id} className={classes.subTermDateItem}>
                      <Text fw={700}>{subTerm.name}</Text>
                      <Text size="sm" c="dimmed">
                        {formatDateRange(subTerm.startDate, subTerm.endDate)}
                      </Text>
                    </div>
                  ))}
                </div>
              </Grid.Col>
            ) : null}
          </Grid>
        </Grid.Col>
        <Grid.Col span={12}>
          <Box ref={calendarShellRef} className={classes.calendarShell}>
            <Box className={classes.calendar}>
              <FullCalendar
                ref={calendarRef}
                key={calendarWeekStart}
                plugins={[timeGridPlugin]}
                initialView="timeGridWeek"
                initialDate={calendarWeekStart}
                events={calendarEvents}
                eventContent={renderEventContent}
                dayHeaderContent={renderDayHeader}
                editable={false}
                selectable={false}
                allDaySlot={false}
                weekends={false}
                height="46rem"
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                scrollTime="08:00:00"
                scrollTimeReset={false}
                nowIndicator={false}
                headerToolbar={false}
              />
            </Box>
          </Box>
        </Grid.Col>
      </RecordPageSection>

      <RecordPageSection
        title="Teaching Sections"
        description="Sections included in the selected term and overlapping subterms."
      >
        <Grid.Col span={12}>
          <TeachingSectionTable meetings={visibleMeetings} weekStart={calendarWeekStart} />
        </Grid.Col>
      </RecordPageSection>
    </Stack>
  );
}
