// Grade detail modal for reviewing current grades, grade history, and posting new grades.
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  UnstyledButton,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type {
  CourseSectionStudentGradeResponse,
  CourseSectionStudentResponse,
  PostCourseSectionStudentGradeRequest,
} from '@/services/schemas/course-schemas';
import { formatStudentDateTime } from './courseSectionStudentUtils';
import type { SelectOption } from './courseSectionsWorkspaceTypes';

type SortDirection = 'asc' | 'desc';
type GradeHistorySortBy =
  | 'type'
  | 'currentGrade'
  | 'previousGrade'
  | 'changedBy'
  | 'postedAt'
  | 'reason';

function gradeLabel(grade: CourseSectionStudentGradeResponse | null) {
  if (!grade) {
    return 'Not posted';
  }

  return grade.gradeMarkCode ?? grade.gradeMarkName ?? 'Not set';
}

function GradeSummary({
  grade,
  label,
}: {
  grade: CourseSectionStudentGradeResponse | null;
  label: string;
}) {
  const hasGrade = grade !== null;

  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" fw={700} tt="uppercase">
        {label}
      </Text>
      <Group gap="xs" wrap="wrap">
        <Badge variant="light" color={hasGrade ? 'blue' : 'gray'}>
          {gradeLabel(grade)}
        </Badge>
        {grade?.postedAt ? (
          <Text size="xs" c="dimmed">
            {formatStudentDateTime(grade.postedAt)}
          </Text>
        ) : null}
      </Group>
    </Stack>
  );
}

const GRADEABLE_ENROLLMENT_STATUS_CODES = new Set(['REGISTERED', 'IN_PROGRESS', 'COMPLETED']);
const GRADEABLE_SECTION_STATUS_CODES = new Set(['IN_PROGRESS', 'COMPLETED']);

function getCurrentGradeForType(
  student: CourseSectionStudentResponse,
  gradeTypeCode: string | null
) {
  if (!gradeTypeCode) {
    return null;
  }

  if (gradeTypeCode.toUpperCase() === 'MIDTERM') {
    return student.currentMidtermGrade;
  }

  if (gradeTypeCode.toUpperCase() === 'FINAL') {
    return student.currentFinalGrade;
  }

  return (
    student.grades.find(
      (grade) => grade.current && grade.gradeTypeCode?.toUpperCase() === gradeTypeCode.toUpperCase()
    ) ?? null
  );
}

function buildChangeNote(grade: CourseSectionStudentGradeResponse) {
  if (grade.changeReason) {
    return grade.changeReason;
  }

  return grade.changedFromGradeId ? 'No reason recorded' : 'Initial grade';
}

function previousGradeLabel(grade: CourseSectionStudentGradeResponse) {
  return grade.previousGradeMarkCode ?? grade.previousGradeMarkName ?? '-';
}

function getPostedAtTime(grade: CourseSectionStudentGradeResponse) {
  return grade.postedAt ? new Date(grade.postedAt).getTime() : Number.NEGATIVE_INFINITY;
}

function compareNullableString(left: string | null | undefined, right: string | null | undefined) {
  return (left?.trim() || '').localeCompare(right?.trim() || '', undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function compareGradeHistory(
  left: CourseSectionStudentGradeResponse,
  right: CourseSectionStudentGradeResponse,
  sortBy: GradeHistorySortBy,
  sortDirection: SortDirection
) {
  const modifier = sortDirection === 'asc' ? 1 : -1;
  let result = 0;

  switch (sortBy) {
    case 'type':
      result = compareNullableString(
        left.gradeTypeName ?? left.gradeTypeCode,
        right.gradeTypeName ?? right.gradeTypeCode
      );
      break;
    case 'currentGrade':
      result = compareNullableString(gradeLabel(left), gradeLabel(right));
      break;
    case 'previousGrade':
      result = compareNullableString(previousGradeLabel(left), previousGradeLabel(right));
      break;
    case 'changedBy':
      result = compareNullableString(left.postedByEmail, right.postedByEmail);
      break;
    case 'postedAt':
      result = getPostedAtTime(left) - getPostedAtTime(right);
      break;
    case 'reason':
      result = compareNullableString(buildChangeNote(left), buildChangeNote(right));
      break;
  }

  return result * modifier;
}

function SortableGradeHeader({
  activeSortBy,
  label,
  onToggleSort,
  sortBy,
  sortDirection,
}: {
  activeSortBy: GradeHistorySortBy;
  label: string;
  onToggleSort: (sortBy: GradeHistorySortBy) => void;
  sortBy: GradeHistorySortBy;
  sortDirection: SortDirection;
}) {
  const active = activeSortBy === sortBy;

  return (
    <UnstyledButton
      fw={700}
      onClick={() => {
        onToggleSort(sortBy);
      }}
    >
      <Group gap={6} wrap="nowrap">
        <span>{label}</span>
        <Text component="span" size="sm" c={active ? 'blue' : 'dimmed'}>
          {active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </Text>
      </Group>
    </UnstyledButton>
  );
}

type CourseSectionGradeDetailsModalProps = {
  error: string | null;
  gradeMarkOptions: SelectOption[];
  gradeTypeOptions: SelectOption[];
  opened: boolean;
  posting: boolean;
  sectionStatusCode: string | null;
  student: CourseSectionStudentResponse;
  onClose: () => void;
  onSubmit: (values: PostCourseSectionStudentGradeRequest) => Promise<boolean>;
};

export function CourseSectionGradeDetailsModal({
  error,
  gradeMarkOptions,
  gradeTypeOptions,
  opened,
  posting,
  sectionStatusCode,
  student,
  onClose,
  onSubmit,
}: CourseSectionGradeDetailsModalProps) {
  const [gradeTypeCode, setGradeTypeCode] = useState<string | null>(null);
  const [gradeMarkCode, setGradeMarkCode] = useState<string | null>(null);
  const [historySortBy, setHistorySortBy] = useState<GradeHistorySortBy>('postedAt');
  const [historySortDirection, setHistorySortDirection] = useState<SortDirection>('desc');
  const [reason, setReason] = useState('');
  const gradeOptionsAreAvailable = gradeTypeOptions.length > 0 && gradeMarkOptions.length > 0;
  const gradeableEnrollmentStatus = GRADEABLE_ENROLLMENT_STATUS_CODES.has(
    student.statusCode?.toUpperCase() ?? ''
  );
  const gradeableSectionStatus = GRADEABLE_SECTION_STATUS_CODES.has(
    sectionStatusCode?.toUpperCase() ?? ''
  );
  const gradeableStatus = gradeableEnrollmentStatus && gradeableSectionStatus;
  const canPostGrades = gradeableStatus && gradeOptionsAreAvailable;
  const currentGradeForType = useMemo(
    () => getCurrentGradeForType(student, gradeTypeCode),
    [gradeTypeCode, student]
  );
  const changingExistingGrade = Boolean(
    currentGradeForType &&
      gradeMarkCode &&
      currentGradeForType.gradeMarkCode &&
      currentGradeForType.gradeMarkCode !== gradeMarkCode
  );
  const reasonIsMissing = changingExistingGrade && reason.trim().length === 0;
  const submitDisabled =
    !canPostGrades ||
    !gradeTypeCode ||
    !gradeMarkCode ||
    reasonIsMissing ||
    posting;
  const sortedGradeHistory = useMemo(
    () =>
      [...student.grades].sort((left, right) =>
        compareGradeHistory(left, right, historySortBy, historySortDirection)
      ),
    [historySortBy, historySortDirection, student.grades]
  );

  function handleToggleHistorySort(nextSortBy: GradeHistorySortBy) {
    if (nextSortBy === historySortBy) {
      setHistorySortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setHistorySortBy(nextSortBy);
    setHistorySortDirection(nextSortBy === 'postedAt' ? 'desc' : 'asc');
  }

  useEffect(() => {
    if (gradeTypeOptions.length === 0) {
      setGradeTypeCode(null);
      return;
    }

    setGradeTypeCode((current) =>
      current && gradeTypeOptions.some((option) => option.value === current)
        ? current
        : gradeTypeOptions[0].value
    );
  }, [gradeTypeOptions]);

  useEffect(() => {
    if (gradeMarkOptions.length === 0) {
      setGradeMarkCode(null);
      return;
    }

    setGradeMarkCode((current) =>
      current && gradeMarkOptions.some((option) => option.value === current)
        ? current
        : gradeMarkOptions[0].value
    );
  }, [gradeMarkOptions]);

  async function handleSubmit() {
    if (submitDisabled || !gradeTypeCode || !gradeMarkCode) {
      return;
    }

    const saved = await onSubmit({
      gradeTypeCode,
      gradeMarkCode,
      reason: reason.trim() ? reason.trim() : null,
    });

    if (saved) {
      setReason('');
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Grade Details" size="64rem" centered>
      <Stack gap="md">
        <Stack gap={2}>
          <Text fw={700}>{student.studentDisplayName ?? 'Student unavailable'}</Text>
          <Group gap="xs" wrap="wrap">
            <Badge variant="light" color="blue">
              Student ID {student.studentId ?? 'Not set'}
            </Badge>
            {student.email ? (
              <Text size="sm" c="dimmed">
                {student.email}
              </Text>
            ) : null}
          </Group>
        </Stack>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <GradeSummary label="Midterm grade" grade={student.currentMidtermGrade} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <GradeSummary label="Final grade" grade={student.currentFinalGrade} />
          </Grid.Col>
        </Grid>

        <Divider label="Grade entry" labelPosition="left" />
        {!gradeableSectionStatus ? (
          <Alert color="yellow" variant="light">
            Grades can only be posted when the section is in progress or completed.
          </Alert>
        ) : null}
        {!gradeableEnrollmentStatus ? (
          <Alert color="yellow" variant="light">
            Grades can only be posted for registered or completed enrollments.
          </Alert>
        ) : null}
        {gradeableStatus ? (
          <>
            {!gradeOptionsAreAvailable ? (
              <Alert color="yellow" variant="light">
                Grade options are still loading or unavailable.
              </Alert>
            ) : null}
            {error ? (
              <Alert color="red" variant="light" title="Unable to post grade">
                {error}
              </Alert>
            ) : null}
            <Grid align="flex-end">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Grade type"
                  data={gradeTypeOptions}
                  disabled={gradeTypeOptions.length === 0}
                  value={gradeTypeCode}
                  onChange={setGradeTypeCode}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Grade"
                  data={gradeMarkOptions}
                  disabled={gradeMarkOptions.length === 0}
                  value={gradeMarkCode}
                  onChange={setGradeMarkCode}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Button
                  fullWidth
                  disabled={submitDisabled}
                  leftSection={<IconPlus size={16} />}
                  loading={posting}
                  onClick={() => {
                    void handleSubmit();
                  }}
                >
                  Add grade
                </Button>
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Change reason"
                  description={
                    changingExistingGrade
                      ? 'Required when changing an existing midterm or final grade.'
                      : undefined
                  }
                  error={reasonIsMissing ? 'A reason is required to change this grade.' : null}
                  minRows={3}
                  required={changingExistingGrade}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.currentTarget.value);
                  }}
                />
              </Grid.Col>
            </Grid>
          </>
        ) : null}

        <Divider label="Grade history" labelPosition="left" />
        <Table.ScrollContainer minWidth={720}>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <SortableGradeHeader
                    activeSortBy={historySortBy}
                    label="Type"
                    sortBy="type"
                    sortDirection={historySortDirection}
                    onToggleSort={handleToggleHistorySort}
                  />
                </Table.Th>
                <Table.Th>
                  <SortableGradeHeader
                    activeSortBy={historySortBy}
                    label="Current grade"
                    sortBy="currentGrade"
                    sortDirection={historySortDirection}
                    onToggleSort={handleToggleHistorySort}
                  />
                </Table.Th>
                <Table.Th>
                  <SortableGradeHeader
                    activeSortBy={historySortBy}
                    label="Previous grade"
                    sortBy="previousGrade"
                    sortDirection={historySortDirection}
                    onToggleSort={handleToggleHistorySort}
                  />
                </Table.Th>
                <Table.Th>
                  <SortableGradeHeader
                    activeSortBy={historySortBy}
                    label="Changed by"
                    sortBy="changedBy"
                    sortDirection={historySortDirection}
                    onToggleSort={handleToggleHistorySort}
                  />
                </Table.Th>
                <Table.Th>
                  <SortableGradeHeader
                    activeSortBy={historySortBy}
                    label="Posted/changed"
                    sortBy="postedAt"
                    sortDirection={historySortDirection}
                    onToggleSort={handleToggleHistorySort}
                  />
                </Table.Th>
                <Table.Th>
                  <SortableGradeHeader
                    activeSortBy={historySortBy}
                    label="Reason"
                    sortBy="reason"
                    sortDirection={historySortDirection}
                    onToggleSort={handleToggleHistorySort}
                  />
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {student.grades.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text size="sm" c="dimmed" ta="center" py="sm">
                      No grades posted.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
              {sortedGradeHistory.map((grade) => (
                <Table.Tr key={grade.gradeId}>
                  <Table.Td>{grade.gradeTypeName ?? grade.gradeTypeCode ?? 'Unknown'}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={grade.current ? 'blue' : 'gray'}>
                      {gradeLabel(grade)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{previousGradeLabel(grade)}</Table.Td>
                  <Table.Td>{grade.postedByEmail ?? 'Not set'}</Table.Td>
                  <Table.Td>{formatStudentDateTime(grade.postedAt)}</Table.Td>
                  <Table.Td>{buildChangeNote(grade)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Modal>
  );
}
