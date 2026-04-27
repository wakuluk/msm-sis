import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  Grid,
  Group,
  Modal,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { SearchPaginationFooter } from '@/components/search/SearchPaginationFooter';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';

type CourseSectionPreview = {
  courseOfferingId: number;
  courseCode: string;
  courseTitle: string;
  sectionId: number;
  sectionCode: string;
  status: 'Draft' | 'Open' | 'Closed';
  instructor: string;
  meetingPattern: string;
  room: string;
  capacity: number;
  enrolled: number;
};

export type CourseSectionSearchValues = {
  courseCode: string;
  sectionCode: string;
  instructor: string;
  meetingPattern: string;
  room: string;
  status: string | null;
};

type CourseSectionsWorkspaceProps = {
  activeAction: 'add' | 'view';
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  selectedOfferings?: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>;
  searchValues: CourseSectionSearchValues;
  subTermLabel: string;
  onAddSection: () => void;
  onCancelAdd: () => void;
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
};

type MeetingDaySchedule = {
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
};

type AddSectionDraft = {
  sectionCode: string;
  honors: boolean;
  lab: boolean;
  teacherAssignment: string;
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

function CourseSectionModalHeader({
  badges,
  courseCode,
  title,
}: {
  badges: ReactNode;
  courseCode: string;
  title: string;
}) {
  return (
    <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
      <Stack gap={2}>
        <Text fw={700}>{courseCode}</Text>
        <Text size="sm" c="dimmed">
          {title}
        </Text>
      </Stack>
      <Group gap="xs" wrap="wrap">
        {badges}
      </Group>
    </Group>
  );
}

export const initialCourseSectionSearchValues: CourseSectionSearchValues = {
  courseCode: '',
  sectionCode: '',
  instructor: '',
  meetingPattern: '',
  room: '',
  status: null,
};

const sectionStatusOptions = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Open', label: 'Open' },
  { value: 'Closed', label: 'Closed' },
];
const academicDivisionOptions = [
  { value: 'UNDERGRADUATE', label: 'Undergraduate' },
  { value: 'GRADUATE', label: 'Graduate' },
];
const deliveryModeOptions = [
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Hybrid' },
];
const gradingBasisOptions = [
  { value: 'LETTER', label: 'Letter grade' },
  { value: 'PASS_FAIL', label: 'Pass/Fail' },
  { value: 'AUDIT', label: 'Audit' },
];
const meetingDayOptions = [
  { value: 'MONDAY', label: 'Mon' },
  { value: 'TUESDAY', label: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wed' },
  { value: 'THURSDAY', label: 'Thu' },
  { value: 'FRIDAY', label: 'Fri' },
];
const meetingTimeValues = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
];
const initialMeetingSchedule = Object.fromEntries(
  meetingDayOptions.map((day) => [
    day.value,
    {
      enabled: false,
      startTime: null,
      endTime: null,
    },
  ])
) as Record<string, MeetingDaySchedule>;
const initialAddSectionDraft: AddSectionDraft = {
  sectionCode: '',
  honors: false,
  lab: false,
  teacherAssignment: '',
  academicDivision: null,
  deliveryMode: null,
  gradingBasis: null,
  sameMeetingTime: false,
  meetingSchedule: initialMeetingSchedule,
  room: '',
  capacity: '',
  credits: null,
  status: 'Draft',
  waitlistAllowed: false,
};

const sectionStatuses = ['Open', 'Open', 'Draft', 'Closed'] as const;
const sectionInstructors = ['Jane Smith', 'Alan Reed', 'Unassigned', 'Maria Chen'] as const;
const sectionMeetingPatterns = [
  'Mon/Wed 9:00-10:15',
  'Tue/Thu 11:00-12:15',
  'TBD',
  'Fri 13:00-15:30',
] as const;
const sectionRooms = ['RH 204', 'RH 110', 'TBD', 'LH 012'] as const;
const courseSectionsPageSize = 10;
const readableDisabledInputStyles = {
  input: {
    backgroundColor: 'var(--mantine-color-gray-0)',
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
};
const readableDisabledSwitchStyles = {
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
  description: {
    opacity: 1,
  },
  track: {
    opacity: 1,
  },
};
const readableDisabledCheckboxStyles = {
  input: {
    opacity: 1,
  },
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
};

function containsIgnoreCase(value: string, filter: string): boolean {
  const normalizedFilter = filter.trim().toLowerCase();

  if (!normalizedFilter) {
    return true;
  }

  return value.toLowerCase().includes(normalizedFilter);
}

function buildSectionPreviews(
  offering: AcademicYearCourseOfferingSearchResultResponse
): CourseSectionPreview[] {
  const seed = offering.courseOfferingId % 7;

  return [0, 1, 2, 3].map((index) => ({
    courseOfferingId: offering.courseOfferingId,
    courseCode: offering.courseCode ?? 'Course',
    courseTitle: offering.title ?? 'Title unavailable',
    sectionId: offering.courseOfferingId * 10 + index + 1,
    sectionCode: String(index + 1).padStart(2, '0'),
    status: sectionStatuses[index],
    instructor: sectionInstructors[index],
    meetingPattern: sectionMeetingPatterns[index],
    room: sectionRooms[index],
    capacity: 24 + ((seed + index) % 3) * 4,
    enrolled: index === 2 ? 0 : Math.min(24 + ((seed + index) % 3) * 4, 13 + seed + index * 5),
  }));
}

function filterSections(
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

    return !searchValues.status || section.status === searchValues.status;
  });
}

function formatTimeLabel(time: string): string {
  const [hourPart, minutePart] = time.split(':');
  const hour = Number(hourPart);
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const meridiem = hour < 12 ? 'AM' : 'PM';

  return `${displayHour}:${minutePart} ${meridiem}`;
}

const meetingTimeOptions = meetingTimeValues.map((time) => ({
  value: time,
  label: formatTimeLabel(time),
}));

function formatCreditLabel(credits: number): string {
  const formattedCredits = Number.isInteger(credits) ? String(credits) : credits.toFixed(1);

  return `${formattedCredits} ${credits === 1 ? 'credit' : 'credits'}`;
}

function buildCreditOptions(
  offering: AcademicYearCourseOfferingSearchResultResponse | null
): Array<{ value: string; label: string }> {
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

  const options: Array<{ value: string; label: string }> = [];

  for (let credits = minCredits; credits <= maxCredits; credits += 0.5) {
    const roundedCredits = Math.round(credits * 10) / 10;
    options.push({
      value: String(roundedCredits),
      label: formatCreditLabel(roundedCredits),
    });
  }

  return options;
}

function updateMeetingSchedule(
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

function updateSelectedMeetingTimes(
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

function buildDraftFromSection(section: CourseSectionPreview): AddSectionDraft {
  return {
    ...initialAddSectionDraft,
    sectionCode: section.sectionCode,
    teacherAssignment: section.instructor === 'Unassigned' ? '' : section.instructor,
    room: section.room === 'TBD' ? '' : section.room,
    capacity: String(section.capacity),
    status: section.status,
  };
}

export function CourseSectionsWorkspace({
  activeAction,
  selectedOffering,
  selectedOfferings,
  searchValues,
  subTermLabel,
  onAddSection,
  onCancelAdd,
  onSearchValuesChange,
}: CourseSectionsWorkspaceProps) {
  const [page, setPage] = useState(0);
  const [addSectionDraft, setAddSectionDraft] = useState<AddSectionDraft>(initialAddSectionDraft);
  const [selectedSection, setSelectedSection] = useState<CourseSectionPreview | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const isSearchScope = selectedOfferings !== undefined;
  const activeOfferings = useMemo(
    () =>
      selectedOfferings ??
      (selectedOffering ? [selectedOffering] : []),
    [selectedOffering, selectedOfferings]
  );
  const allSections = useMemo(
    () => activeOfferings.flatMap((offering) => buildSectionPreviews(offering)),
    [activeOfferings]
  );
  const filteredSections = useMemo(
    () => filterSections(allSections, searchValues),
    [allSections, searchValues]
  );
  const totalPages = Math.max(1, Math.ceil(filteredSections.length / courseSectionsPageSize));
  const pagedSections = useMemo(
    () =>
      filteredSections.slice(
        page * courseSectionsPageSize,
        page * courseSectionsPageSize + courseSectionsPageSize
      ),
    [filteredSections, page]
  );
  const hasActiveScope = activeOfferings.length > 0;
  const workspaceDescription = isSearchScope
    ? 'Review sections for all course offerings in the current offering search results.'
    : 'Manage sections for the selected course offering in this sub term.';
  const sectionModalMode = selectedSection ? 'detail' : 'create';
  const sectionFieldsDisabled = sectionModalMode === 'detail' && !detailEditing;
  const selectedSectionOffering = selectedSection
    ? activeOfferings.find((offering) => offering.courseOfferingId === selectedSection.courseOfferingId) ?? null
    : null;
  const sectionModalOffering = selectedSectionOffering ?? selectedOffering;
  const sectionModalOpened = Boolean(
    selectedSection || (selectedOffering && !isSearchScope && activeAction === 'add')
  );
  const sectionPreviewBase = addSectionDraft.sectionCode.trim() || 'New';
  const sectionPreview = `${sectionPreviewBase}${addSectionDraft.honors ? 'H' : ''}`;
  const roomDisabled = addSectionDraft.deliveryMode === 'ONLINE';
  const readOnlyInputStyles = sectionFieldsDisabled ? readableDisabledInputStyles : undefined;
  const readOnlySwitchStyles = sectionFieldsDisabled ? readableDisabledSwitchStyles : undefined;
  const readOnlyCheckboxStyles = sectionFieldsDisabled ? readableDisabledCheckboxStyles : undefined;
  const creditOptions = useMemo(
    () => buildCreditOptions(sectionModalOffering),
    [sectionModalOffering]
  );

  useEffect(() => {
    setPage(0);
  }, [activeOfferings, searchValues]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const nextCreditOptions = buildCreditOptions(selectedOffering);
    setAddSectionDraft({
      ...initialAddSectionDraft,
      credits: nextCreditOptions[0]?.value ?? null,
    });
  }, [selectedOffering]);

  function closeSectionModal() {
    if (selectedSection) {
      setSelectedSection(null);
      setDetailEditing(false);
      return;
    }

    onCancelAdd();
  }

  function handleSectionSelected(section: CourseSectionPreview) {
    const sectionOffering =
      activeOfferings.find((offering) => offering.courseOfferingId === section.courseOfferingId) ??
      null;
    const nextCreditOptions = buildCreditOptions(sectionOffering);

    setAddSectionDraft({
      ...buildDraftFromSection(section),
      credits: nextCreditOptions[0]?.value ?? null,
    });
    setSelectedSection(section);
    setDetailEditing(false);
  }

  return (
    <>
      <RecordPageSection
        title="Course Sections"
        description={workspaceDescription}
        action={
          <Group gap="sm" wrap="wrap" justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                onSearchValuesChange(initialCourseSectionSearchValues);
              }}
              disabled={!hasActiveScope}
            >
              Clear section filters
            </Button>
            <Button variant="light" onClick={onAddSection} disabled={!selectedOffering || isSearchScope}>
              Add section
            </Button>
          </Group>
        }
      >
        <Grid.Col span={12}>
          <Stack gap="md">
          {isSearchScope && hasActiveScope ? (
            <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
              <Stack gap={2}>
                <Text fw={700}>Current offering search</Text>
                <Text size="sm" c="dimmed">
                  Showing sections for the course offerings currently visible in the search results.
                </Text>
              </Stack>
              <Group gap="xs" wrap="wrap">
                <Badge variant="light" color="blue">
                  {subTermLabel}
                </Badge>
                <Badge variant="light" color="gray">
                  {activeOfferings.length} offerings
                </Badge>
                <Badge variant="light" color="green">
                  {allSections.length} sections
                </Badge>
              </Group>
            </Group>
          ) : selectedOffering ? (
            <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
              <Stack gap={2}>
                <Text fw={700}>{selectedOffering.courseCode ?? 'Course offering'}</Text>
                <Text size="sm" c="dimmed">
                  {selectedOffering.title ?? 'Title unavailable'}
                </Text>
              </Stack>
              <Group gap="xs" wrap="wrap">
                <Badge variant="light" color="blue">
                  {subTermLabel}
                </Badge>
                <Badge variant="light" color="green">
                  {allSections.length} sections
                </Badge>
              </Group>
            </Group>
          ) : (
            <Alert color="gray" title="Select a course offering">
              Choose a course offering above, or use View offering sections to review the current search results.
            </Alert>
          )}

          <Grid>
            {isSearchScope ? (
              <Grid.Col span={{ base: 12, md: 2 }}>
                <TextInput
                  label="Course"
                  placeholder="MUS 101"
                  value={searchValues.courseCode}
                  onChange={(event) => {
                    onSearchValuesChange({
                      ...searchValues,
                      courseCode: event.currentTarget.value,
                    });
                  }}
                  disabled={!hasActiveScope}
                />
              </Grid.Col>
            ) : null}
            <Grid.Col span={{ base: 12, md: 2 }}>
              <TextInput
                label="Section"
                placeholder="01"
                value={searchValues.sectionCode}
                onChange={(event) => {
                  onSearchValuesChange({
                    ...searchValues,
                    sectionCode: event.currentTarget.value,
                  });
                }}
                disabled={!hasActiveScope}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: isSearchScope ? 2 : 3 }}>
              <TextInput
                label="Instructor"
                placeholder="Filter by instructor"
                value={searchValues.instructor}
                onChange={(event) => {
                  onSearchValuesChange({
                    ...searchValues,
                    instructor: event.currentTarget.value,
                  });
                }}
                disabled={!hasActiveScope}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: isSearchScope ? 2 : 3 }}>
              <TextInput
                label="Meeting Pattern"
                placeholder="Filter by meeting pattern"
                value={searchValues.meetingPattern}
                onChange={(event) => {
                  onSearchValuesChange({
                    ...searchValues,
                    meetingPattern: event.currentTarget.value,
                  });
                }}
                disabled={!hasActiveScope}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <TextInput
                label="Room"
                placeholder="Room"
                value={searchValues.room}
                onChange={(event) => {
                  onSearchValuesChange({
                    ...searchValues,
                    room: event.currentTarget.value,
                  });
                }}
                disabled={!hasActiveScope}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Select
                label="Status"
                placeholder="Any status"
                data={sectionStatusOptions}
                value={searchValues.status}
                onChange={(value) => {
                  onSearchValuesChange({
                    ...searchValues,
                    status: value,
                  });
                }}
                clearable
                disabled={!hasActiveScope}
              />
            </Grid.Col>
          </Grid>

          {hasActiveScope && filteredSections.length === 0 ? (
            <Alert color="gray" title="No sections match these filters">
              Adjust the section filters to see more sections for this scope.
            </Alert>
          ) : null}

          {hasActiveScope && filteredSections.length > 0 ? (
            <Table.ScrollContainer minWidth={920}>
              <Table withTableBorder withColumnBorders striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    {isSearchScope ? <Table.Th>Course</Table.Th> : null}
                    <Table.Th>Section</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Instructor</Table.Th>
                    <Table.Th>Meeting Pattern</Table.Th>
                    <Table.Th>Room</Table.Th>
                    <Table.Th>Seats</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pagedSections.map((section) => (
                    <Table.Tr
                      key={section.sectionId}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        handleSectionSelected(section);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleSectionSelected(section);
                        }
                      }}
                    >
                      {isSearchScope ? (
                        <Table.Td>
                          <Stack gap={0}>
                            <Text size="sm" fw={600}>
                              {section.courseCode}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {section.courseTitle}
                            </Text>
                          </Stack>
                        </Table.Td>
                      ) : null}
                      <Table.Td>{section.sectionCode}</Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={section.status === 'Draft' ? 'gray' : 'green'}
                        >
                          {section.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{section.instructor}</Table.Td>
                      <Table.Td>{section.meetingPattern}</Table.Td>
                      <Table.Td>{section.room}</Table.Td>
                      <Table.Td>
                        {section.enrolled}/{section.capacity}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          ) : null}

          {hasActiveScope && filteredSections.length > 0 ? (
            <Group justify="space-between" align="center" gap="sm" wrap="wrap">
              <Text size="sm" c="dimmed">
                Showing {page * courseSectionsPageSize + 1}-
                {Math.min(page * courseSectionsPageSize + pagedSections.length, filteredSections.length)} of{' '}
                {filteredSections.length} sections
              </Text>
              <SearchPaginationFooter
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </Group>
          ) : null}
          </Stack>
        </Grid.Col>
      </RecordPageSection>

      <Modal
        opened={sectionModalOpened}
        onClose={closeSectionModal}
        title={sectionModalMode === 'detail' ? 'Course Section' : 'Add Course Section'}
        size="96rem"
        centered
      >
        {sectionModalOffering || selectedSection ? (
          <Stack gap="md">
            <CourseSectionModalHeader
              courseCode={
                selectedSection
                  ? `${selectedSection.courseCode} Section ${selectedSection.sectionCode}`
                  : sectionModalOffering?.courseCode ?? 'Course offering'
              }
              title={selectedSection?.courseTitle ?? sectionModalOffering?.title ?? 'Title unavailable'}
              badges={
                <>
                  <Badge variant="light" color="blue">
                    {subTermLabel}
                  </Badge>
                  {selectedSection ? (
                    <Badge
                      variant="light"
                      color={selectedSection.status === 'Draft' ? 'gray' : 'green'}
                    >
                      {selectedSection.status}
                    </Badge>
                  ) : (
                    <Badge variant="light" color="green">
                      Section {sectionPreview}
                    </Badge>
                  )}
                </>
              }
            />

            <Stack gap="lg">
              <Stack gap="sm">
                <Divider label="Section identity" labelPosition="left" />
                <Grid align="flex-start">
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <TextInput
                      label="Section"
                      placeholder="04"
                      value={addSectionDraft.sectionCode}
                      readOnly={sectionFieldsDisabled}
                      styles={readOnlyInputStyles}
                      onChange={(event) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          sectionCode: event.currentTarget.value,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <Switch
                      label="Honors"
                      checked={addSectionDraft.honors}
                      disabled={sectionFieldsDisabled}
                      styles={readOnlySwitchStyles}
                      mt="lg"
                      onChange={(event) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          honors: event.currentTarget.checked,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <Switch
                      label="Lab"
                      checked={addSectionDraft.lab}
                      disabled={sectionFieldsDisabled}
                      styles={readOnlySwitchStyles}
                      mt="lg"
                      onChange={(event) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          lab: event.currentTarget.checked,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      label="Status"
                      placeholder="Status"
                      data={sectionStatusOptions}
                      value={addSectionDraft.status}
                      disabled={sectionFieldsDisabled}
                      styles={readOnlyInputStyles}
                      onChange={(value) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          status: value,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <TextInput
                      label="Capacity"
                      placeholder="24"
                      inputMode="numeric"
                      value={addSectionDraft.capacity}
                      readOnly={sectionFieldsDisabled}
                      styles={readOnlyInputStyles}
                      onChange={(event) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          capacity: event.currentTarget.value,
                        }));
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>

              <Stack gap="sm">
                <Divider label="Academic setup" labelPosition="left" />
                <Grid>
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput
                      label="Teacher assignment"
                      placeholder="Assign teacher"
                      value={addSectionDraft.teacherAssignment}
                      readOnly={sectionFieldsDisabled}
                      styles={readOnlyInputStyles}
                      onChange={(event) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          teacherAssignment: event.currentTarget.value,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      label="Academic division"
                      placeholder="Select division"
                      data={academicDivisionOptions}
                      value={addSectionDraft.academicDivision}
                      disabled={sectionFieldsDisabled}
                      styles={readOnlyInputStyles}
                      onChange={(value) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          academicDivision: value,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <Select
                      label="Grading basis"
                      placeholder="Select grading"
                      data={gradingBasisOptions}
                      value={addSectionDraft.gradingBasis}
                      disabled={sectionFieldsDisabled}
                      styles={readOnlyInputStyles}
                      onChange={(value) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          gradingBasis: value,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <Select
                      label="Credits"
                      placeholder={creditOptions.length > 0 ? 'Credits' : 'Unavailable'}
                      data={creditOptions}
                      value={addSectionDraft.credits}
                      disabled={sectionFieldsDisabled || creditOptions.length === 0}
                      styles={readOnlyInputStyles}
                      onChange={(value) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          credits: value,
                        }));
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Stack>

              <Stack gap="sm">
                <Divider label="Schedule and location" labelPosition="left" />
                <Grid>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      label="Delivery mode"
                      placeholder="Select delivery"
                      data={deliveryModeOptions}
                      value={addSectionDraft.deliveryMode}
                      disabled={sectionFieldsDisabled}
                      styles={readOnlyInputStyles}
                      onChange={(value) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          deliveryMode: value,
                          room: value === 'ONLINE' ? '' : current.room,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <TextInput
                      label="Room/location"
                      placeholder={roomDisabled ? 'Online' : 'Room'}
                      value={addSectionDraft.room}
                      readOnly={sectionFieldsDisabled}
                      disabled={roomDisabled}
                      styles={readOnlyInputStyles}
                      onChange={(event) => {
                        setAddSectionDraft((current) => ({
                          ...current,
                          room: event.currentTarget.value,
                        }));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Stack gap="sm">
                      <Group justify="space-between" align="center" gap="sm" wrap="wrap">
                        <Text size="sm" fw={500}>
                          Meeting schedule
                        </Text>
                        <Switch
                          label="Same time for selected days"
                          checked={addSectionDraft.sameMeetingTime}
                          disabled={sectionFieldsDisabled}
                          styles={readOnlySwitchStyles}
                          onChange={(event) => {
                            setAddSectionDraft((current) => {
                              const sameMeetingTime = event.currentTarget.checked;
                              const firstSelectedSchedule = Object.values(
                                current.meetingSchedule
                              ).find(
                                (schedule) =>
                                  schedule.enabled &&
                                  (schedule.startTime !== null || schedule.endTime !== null)
                              );

                              return {
                                ...current,
                                sameMeetingTime,
                                meetingSchedule:
                                  sameMeetingTime && firstSelectedSchedule
                                    ? updateSelectedMeetingTimes(current.meetingSchedule, {
                                        startTime: firstSelectedSchedule.startTime,
                                        endTime: firstSelectedSchedule.endTime,
                                      })
                                    : current.meetingSchedule,
                              };
                            });
                          }}
                        />
                      </Group>
                      <Stack gap="xs">
                        {meetingDayOptions.map((day) => (
                          <div key={day.value}>
                            <Grid align="flex-end">
                              <Grid.Col span={{ base: 12, md: 3 }}>
                                <Checkbox
                                  label={day.label}
                                  checked={addSectionDraft.meetingSchedule[day.value].enabled}
                                  disabled={sectionFieldsDisabled}
                                  styles={readOnlyCheckboxStyles}
                                  onChange={(event) => {
                                    setAddSectionDraft((current) => {
                                      const enabled = event.currentTarget.checked;
                                      const firstSelectedSchedule = Object.values(
                                        current.meetingSchedule
                                      ).find(
                                        (schedule) =>
                                          schedule.enabled &&
                                          (schedule.startTime !== null ||
                                            schedule.endTime !== null)
                                      );

                                      return {
                                        ...current,
                                        meetingSchedule: updateMeetingSchedule(
                                          current.meetingSchedule,
                                          day.value,
                                          {
                                            enabled,
                                            startTime:
                                              enabled && current.sameMeetingTime
                                                ? firstSelectedSchedule?.startTime ?? null
                                                : current.meetingSchedule[day.value].startTime,
                                            endTime:
                                              enabled && current.sameMeetingTime
                                                ? firstSelectedSchedule?.endTime ?? null
                                                : current.meetingSchedule[day.value].endTime,
                                          }
                                        ),
                                      };
                                    });
                                  }}
                                />
                              </Grid.Col>
                              <Grid.Col span={{ base: 6, md: 3 }}>
                                <Select
                                  label="Start"
                                  placeholder="Start"
                                  data={meetingTimeOptions}
                                  value={addSectionDraft.meetingSchedule[day.value].startTime}
                                  disabled={
                                    sectionFieldsDisabled ||
                                    !addSectionDraft.meetingSchedule[day.value].enabled
                                  }
                                  styles={readOnlyInputStyles}
                                  onChange={(value) => {
                                    setAddSectionDraft((current) => ({
                                      ...current,
                                      meetingSchedule: current.sameMeetingTime
                                        ? updateSelectedMeetingTimes(current.meetingSchedule, {
                                            startTime: value,
                                          })
                                        : updateMeetingSchedule(
                                            current.meetingSchedule,
                                            day.value,
                                            {
                                              startTime: value,
                                            }
                                          ),
                                    }));
                                  }}
                                />
                              </Grid.Col>
                              <Grid.Col span={{ base: 6, md: 3 }}>
                                <Select
                                  label="End"
                                  placeholder="End"
                                  data={meetingTimeOptions}
                                  value={addSectionDraft.meetingSchedule[day.value].endTime}
                                  disabled={
                                    sectionFieldsDisabled ||
                                    !addSectionDraft.meetingSchedule[day.value].enabled
                                  }
                                  styles={readOnlyInputStyles}
                                  onChange={(value) => {
                                    setAddSectionDraft((current) => ({
                                      ...current,
                                      meetingSchedule: current.sameMeetingTime
                                        ? updateSelectedMeetingTimes(current.meetingSchedule, {
                                            endTime: value,
                                          })
                                        : updateMeetingSchedule(
                                            current.meetingSchedule,
                                            day.value,
                                            {
                                              endTime: value,
                                            }
                                          ),
                                    }));
                                  }}
                                />
                              </Grid.Col>
                            </Grid>
                          </div>
                        ))}
                      </Stack>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>

              <Stack gap="sm">
                <Divider label="Registration" labelPosition="left" />
                <Switch
                  label="Waitlist allowed"
                  description="Allows students to waitlist when the section reaches capacity."
                  checked={addSectionDraft.waitlistAllowed}
                  disabled={sectionFieldsDisabled}
                  styles={readOnlySwitchStyles}
                  onChange={(event) => {
                    setAddSectionDraft((current) => ({
                      ...current,
                      waitlistAllowed: event.currentTarget.checked,
                    }));
                  }}
                />
              </Stack>
            </Stack>

            <Group justify="flex-end" gap="sm" wrap="wrap">
              {sectionModalMode === 'detail' ? (
                <>
                  {detailEditing ? (
                    <>
                      <Button
                        variant="default"
                        onClick={() => {
                          if (selectedSection) {
                            setAddSectionDraft({
                              ...buildDraftFromSection(selectedSection),
                              credits: creditOptions[0]?.value ?? null,
                            });
                          }
                          setDetailEditing(false);
                        }}
                      >
                        Cancel edit
                      </Button>
                      <Button>Save changes</Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="default"
                        onClick={() => {
                          setDetailEditing(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="default">Duplicate</Button>
                      <Button variant="default">Cancel section</Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Button variant="default" onClick={closeSectionModal}>
                    Cancel
                  </Button>
                  <Button>Create section</Button>
                </>
              )}
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </>
  );
}
