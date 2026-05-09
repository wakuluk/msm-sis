import { useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventContentArg, EventInput } from '@fullcalendar/core';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
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
import {
  teachingScheduleMock,
  type TeachingScheduleDetail,
  type TeachingScheduleMeeting,
  type TeachingScheduleSubTerm,
} from './teachingSchedule.mock';
import classes from './TeachingScheduleDetail.module.css';

type TeachingScheduleDetailProps = {
  detail?: TeachingScheduleDetail;
  mode?: 'admin' | 'staff';
};

type TeachingSectionTableSortBy =
  | 'courseCode'
  | 'enrolled'
  | 'location'
  | 'meetingDays'
  | 'modality'
  | 'subTerm';

type TeachingSectionSummary = {
  courseCode: string;
  courseTitle: string;
  enrolled: number;
  location: string;
  meetings: TeachingScheduleMeeting[];
  modality: string;
  sectionCode: string;
  softCapacity: number;
  subTermName: string;
};

function formatTimeRange(startDateTime: string, endDateTime: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${formatter.format(new Date(startDateTime))} - ${formatter.format(new Date(endDateTime))}`;
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
    return new Set(subTerms.map((subTerm) => subTerm.code));
  }

  const selectedSubTerms = subTerms.filter((subTerm) => selectedSubTermCodes.includes(subTerm.code));

  return new Set(
    subTerms
      .filter((candidateSubTerm) =>
        selectedSubTerms.every((selectedSubTerm) =>
          subTermsOverlap(candidateSubTerm, selectedSubTerm)
        )
      )
      .map((subTerm) => subTerm.code)
  );
}

function filterCompatibleSubTermSelection(
  subTerms: TeachingScheduleSubTerm[],
  selectedSubTermCodes: string[]
) {
  return selectedSubTermCodes.reduce<string[]>((nextSelection, subTermCode) => {
    const candidateSubTerm = subTerms.find((subTerm) => subTerm.code === subTermCode);

    if (!candidateSubTerm) {
      return nextSelection;
    }

    const canAddCandidate = nextSelection
      .map((selectedSubTermCode) => subTerms.find((subTerm) => subTerm.code === selectedSubTermCode))
      .filter((subTerm): subTerm is TeachingScheduleSubTerm => Boolean(subTerm))
      .every((selectedSubTerm) => subTermsOverlap(candidateSubTerm, selectedSubTerm));

    return canAddCandidate ? [...nextSelection, subTermCode] : nextSelection;
  }, []);
}

function getMeetingDayLabel(startDateTime: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(startDateTime));
}

function mapMeetingsToEvents(meetings: TeachingScheduleMeeting[]): EventInput[] {
  return meetings.map((meeting) => ({
    id: meeting.id,
    title: `${meeting.courseCode}-${meeting.sectionCode}`,
    start: meeting.start,
    end: meeting.end,
    backgroundColor: meeting.color,
    borderColor: meeting.color,
    extendedProps: { meeting },
  }));
}

function renderEventContent(eventInfo: EventContentArg) {
  const meeting = eventInfo.event.extendedProps.meeting as TeachingScheduleMeeting | undefined;

  return (
    <div className={classes.eventContent}>
      <span className={classes.eventTitle}>{eventInfo.event.title}</span>
      <span className={classes.eventMeta}>{meeting?.location ?? eventInfo.timeText}</span>
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
  return new Set(meetings.map((meeting) => `${meeting.courseCode}-${meeting.sectionCode}`)).size;
}

function getTeachingSections(meetings: TeachingScheduleMeeting[]) {
  return Array.from(
    new Map(
      meetings.map((meeting) => [
        `${meeting.courseCode}-${meeting.sectionCode}`,
        {
          courseCode: meeting.courseCode,
          courseTitle: meeting.courseTitle,
          sectionCode: meeting.sectionCode,
          subTermName: meeting.subTermName,
          modality: meeting.modality,
          location: meeting.location,
          enrolled: meeting.enrolled,
          softCapacity: meeting.softCapacity,
          meetings: meetings.filter(
            (sectionMeeting) =>
              sectionMeeting.courseCode === meeting.courseCode &&
              sectionMeeting.sectionCode === meeting.sectionCode
          ),
        },
      ])
    ).values()
  );
}

function getSectionSearchText(section: TeachingSectionSummary) {
  return [
    section.courseCode,
    section.courseTitle,
    section.sectionCode,
    section.subTermName,
    section.modality,
    section.location,
    ...section.meetings.map((meeting) => getMeetingDayLabel(meeting.start)),
  ]
    .join(' ')
    .toLowerCase();
}

function getMeetingDays(section: TeachingSectionSummary) {
  return section.meetings.map((meeting) => getMeetingDayLabel(meeting.start)).join(', ');
}

function compareText(firstValue: string, secondValue: string) {
  return firstValue.localeCompare(secondValue, undefined, { sensitivity: 'base' });
}

function sortTeachingSections(
  sections: TeachingSectionSummary[],
  sortBy: TeachingSectionTableSortBy,
  sortDirection: 'asc' | 'desc'
) {
  const sortedSections = [...sections].sort((firstSection, secondSection) => {
    if (sortBy === 'enrolled') {
      return firstSection.enrolled - secondSection.enrolled;
    }

    if (sortBy === 'location') {
      return compareText(firstSection.location, secondSection.location);
    }

    if (sortBy === 'meetingDays') {
      return compareText(getMeetingDays(firstSection), getMeetingDays(secondSection));
    }

    if (sortBy === 'modality') {
      return compareText(firstSection.modality, secondSection.modality);
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

function buildTeachingSectionColumns(): ColumnDef<TeachingSectionSummary>[] {
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
              {getMeetingDayLabel(meeting.start)} {formatTimeRange(meeting.start, meeting.end)}
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

function TeachingSectionTable({ meetings }: { meetings: TeachingScheduleMeeting[] }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<TeachingSectionTableSortBy>('courseCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const sections = useMemo(() => getTeachingSections(meetings), [meetings]);
  const filteredSections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const visibleSections =
      normalizedSearch.length === 0
        ? sections
        : sections.filter((section) => getSectionSearchText(section).includes(normalizedSearch));

    return sortTeachingSections(visibleSections, sortBy, sortDirection);
  }, [search, sections, sortBy, sortDirection]);
  const table = useReactTable({
    columns: buildTeachingSectionColumns(),
    data: filteredSections,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => `${row.courseCode}-${row.sectionCode}`,
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
        getRowProps={(row) => ({
          onClick: () => {},
          role: 'button',
          tabIndex: 0,
          'aria-label': `Open ${row.original.courseCode} section ${row.original.sectionCode}`,
        })}
      />
    </Stack>
  );
}

export function TeachingScheduleDetail({
  detail = teachingScheduleMock,
  mode = 'staff',
}: TeachingScheduleDetailProps) {
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
    return initialTerm ? getVisibleSubTerms(initialTerm).map((subTerm) => subTerm.code) : [];
  });

  useEffect(() => {
    const nextTerm =
      detail.terms
        .filter((term) => term.academicYearName === selectedAcademicYearName)
        .find((term) => term.id === detail.selectedTermId) ??
      detail.terms.find((term) => term.academicYearName === selectedAcademicYearName);

    setSelectedTermId(nextTerm ? String(nextTerm.id) : '');
    setSelectedSubTermCodes(nextTerm ? getVisibleSubTerms(nextTerm).map((subTerm) => subTerm.code) : []);
  }, [detail.terms, detail.selectedTermId, selectedAcademicYearName]);

  const selectedTerm =
    availableTerms.find((term) => term.id === Number(selectedTermId)) ?? availableTerms[0];
  const overlappingSubTerms = selectedTerm ? getVisibleSubTerms(selectedTerm) : [];
  const overlappingSubTermCodes = new Set(overlappingSubTerms.map((subTerm) => subTerm.code));
  const compatibleSubTermCodes = getCompatibleSubTermCodes(
    overlappingSubTerms,
    selectedSubTermCodes.filter((subTermCode) => overlappingSubTermCodes.has(subTermCode))
  );
  const effectiveSelectedSubTermCodes = filterCompatibleSubTermSelection(
    overlappingSubTerms,
    selectedSubTermCodes
  );
  const visibleSubTermCodes = new Set(effectiveSelectedSubTermCodes);
  const visibleMeetings = detail.meetings.filter((meeting) =>
    visibleSubTermCodes.has(meeting.subTermCode)
  );
  const visibleSectionCount = getSectionCount(visibleMeetings);
  const calendarEvents = useMemo(() => mapMeetingsToEvents(visibleMeetings), [visibleMeetings]);
  const termOptions = availableTerms.map((term) => ({
    value: String(term.id),
    label: term.name,
  }));
  const subTermOptions = overlappingSubTerms.map((subTerm) => {
    const selected = effectiveSelectedSubTermCodes.includes(subTerm.code);

    return {
      value: subTerm.code,
      label: `${subTerm.name} (${subTerm.code})`,
      disabled: !selected && !compatibleSubTermCodes.has(subTerm.code),
    };
  });

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
                    nextTerm ? getVisibleSubTerms(nextTerm).map((subTerm) => subTerm.code) : []
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
          </Grid>
        </Grid.Col>
        <Grid.Col span={12}>
          <Box className={classes.calendarShell}>
            <Box className={classes.calendar}>
              <FullCalendar
                plugins={[timeGridPlugin]}
                initialView="timeGridWeek"
                initialDate={detail.weekStart}
                events={calendarEvents}
                eventContent={renderEventContent}
                dayHeaderContent={renderDayHeader}
                editable={false}
                selectable={false}
                allDaySlot={false}
                weekends={false}
                height="auto"
                slotMinTime="07:00:00"
                slotMaxTime="18:00:00"
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
          <TeachingSectionTable meetings={visibleMeetings} />
        </Grid.Col>
      </RecordPageSection>
    </Stack>
  );
}
