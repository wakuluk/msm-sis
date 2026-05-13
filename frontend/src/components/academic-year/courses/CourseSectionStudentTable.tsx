// Sortable enrollment table for students in a course section.
// Emits selected enrollment ids so the parent panel can load detail and history data.
import { Badge, Box, ScrollArea, Select, Table, Text, UnstyledButton } from '@mantine/core';
import type {
  CourseSectionStudentGradeResponse,
  CourseSectionStudentResponse,
} from '@/services/schemas/course-schemas';
import classes from './CourseSectionStudentsPanel.module.css';
import type {
  SortableStudentColumn,
  StudentSortBy,
  StudentSortDirection,
} from './courseSectionStudentTypes';
import type { SelectOption } from './courseSectionsWorkspaceTypes';
import {
  formatCredits,
  formatStudentDate,
  formatStudentDateTime,
  formatWaitlistOfferStatus,
  sortableStudentColumns,
  studentStatusColor,
  waitlistOfferStatusColor,
} from './courseSectionStudentUtils';
import tableClasses from '@/components/search/SearchResultsTable.module.css';

function SortableStudentHeader({
  column,
  sortBy,
  sortDirection,
  onToggleSort,
}: {
  column: SortableStudentColumn;
  sortBy: StudentSortBy;
  sortDirection: StudentSortDirection;
  onToggleSort: (sortBy: StudentSortBy) => void;
}) {
  const isActive = sortBy === column.sortBy;

  return (
    <UnstyledButton
      className={tableClasses.sortButton}
      onClick={() => {
        onToggleSort(column.sortBy);
      }}
    >
      <span>{column.label}</span>
      <span
        className={
          isActive
            ? `${tableClasses.sortDirection} ${tableClasses.sortDirectionActive}`
            : tableClasses.sortDirection
        }
      >
        {isActive ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </UnstyledButton>
  );
}

type InitialGradeTypeCode = 'MIDTERM' | 'FINAL';

function PostedGradeBadge({ label }: { label: string }) {
  return (
    <Badge variant="light" color="gray">
      {label}
    </Badge>
  );
}

function EmptyGradeText({ label }: { label: string }) {
  return (
    <Text size="sm" c="dimmed">
      {label}
    </Text>
  );
}

function InitialGradeCell({
  grade,
  gradeTypeCode,
  gradeMarkOptions,
  canEditGrades,
  stubGradeMarkCode,
  onStubGradeChange,
}: {
  grade: CourseSectionStudentGradeResponse | null;
  gradeTypeCode: InitialGradeTypeCode;
  gradeMarkOptions: SelectOption[];
  canEditGrades: boolean;
  stubGradeMarkCode: string | null;
  onStubGradeChange: (gradeTypeCode: InitialGradeTypeCode, gradeMarkCode: string | null) => void;
}) {
  const gradeLabel = grade?.gradeMarkCode ?? grade?.gradeMarkName ?? 'Not set';
  const selectGradeMarkOptions =
    stubGradeMarkCode && !gradeMarkOptions.some((option) => option.value === stubGradeMarkCode)
      ? [{ value: stubGradeMarkCode, label: stubGradeMarkCode }, ...gradeMarkOptions]
      : gradeMarkOptions;

  if (grade) {
    return <PostedGradeBadge label={gradeLabel} />;
  }

  if (!canEditGrades || gradeMarkOptions.length === 0) {
    return <EmptyGradeText label="Not posted" />;
  }

  return (
    <Box
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <Select
        aria-label={`${gradeTypeCode === 'MIDTERM' ? 'Midterm' : 'Final'} grade`}
        placeholder="Not posted"
        size="xs"
        data={selectGradeMarkOptions}
        value={stubGradeMarkCode}
        comboboxProps={{ withinPortal: true }}
        clearable
        searchable
        w={140}
        onChange={(value) => {
          onStubGradeChange(gradeTypeCode, value);
        }}
      />
    </Box>
  );
}

type CourseSectionStudentTableProps = {
  students: CourseSectionStudentResponse[];
  loading: boolean;
  selectedEnrollmentId: number | null;
  sortBy: StudentSortBy;
  sortDirection: StudentSortDirection;
  canEditGrades: boolean;
  gradeMarkOptions: SelectOption[];
  stubInitialGrades: Record<string, string | null>;
  onToggleSort: (sortBy: StudentSortBy) => void;
  onSelectEnrollment: (enrollmentId: number) => void;
  onStubInitialGradeChange: (
    enrollmentId: number,
    gradeTypeCode: InitialGradeTypeCode,
    gradeMarkCode: string | null
  ) => void;
};

export function CourseSectionStudentTable({
  students,
  loading,
  selectedEnrollmentId,
  sortBy,
  sortDirection,
  canEditGrades,
  gradeMarkOptions,
  stubInitialGrades,
  onToggleSort,
  onSelectEnrollment,
  onStubInitialGradeChange,
}: CourseSectionStudentTableProps) {
  return (
    <Table.ScrollContainer minWidth={1220} w="100%">
      <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
        <Table
          withTableBorder
          withColumnBorders
          striped
          highlightOnHover
          stickyHeader
          style={{ width: '100%' }}
        >
          <Table.Thead>
            <Table.Tr>
              {sortableStudentColumns.map((column) => (
                <Table.Th key={column.sortBy}>
                  <SortableStudentHeader
                    column={column}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onToggleSort={onToggleSort}
                  />
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {students.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={sortableStudentColumns.length}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    {loading ? 'Loading students...' : 'No students found.'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : null}

            {students.map((student) => (
              <Table.Tr
                key={student.enrollmentId}
                className={`${tableClasses.clickableRow} ${
                  selectedEnrollmentId === student.enrollmentId ? classes.selectedRow : ''
                }`}
                tabIndex={0}
                onClick={() => {
                  onSelectEnrollment(student.enrollmentId);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectEnrollment(student.enrollmentId);
                  }
                }}
              >
                <Table.Td>
                  <Text size="sm" fw={600}>
                    {student.studentDisplayName ?? 'Student unavailable'}
                  </Text>
                  {student.email ? (
                    <Text size="xs" c="dimmed">
                      {student.email}
                    </Text>
                  ) : null}
                </Table.Td>
                <Table.Td>{student.studentId ?? 'Not set'}</Table.Td>
                <Table.Td>
                  <Badge variant="light" color={studentStatusColor(student.statusCode)}>
                    {student.statusName ?? 'Unknown'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {student.waitlistOffer ? (
                    <>
                      <Badge
                        variant="light"
                        color={waitlistOfferStatusColor(student.waitlistOffer.status)}
                      >
                        {formatWaitlistOfferStatus(student.waitlistOffer.status)}
                      </Badge>
                      <Text size="xs" c="dimmed" mt={4}>
                        Expires {formatStudentDateTime(student.waitlistOffer.expiresAt)}
                      </Text>
                    </>
                  ) : (
                    <Text size="sm" c="dimmed">
                      No offer
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{formatCredits(student.creditsAttempted)}</Table.Td>
                <Table.Td>{student.gradingBasisName ?? 'Not set'}</Table.Td>
                <Table.Td>
                  <InitialGradeCell
                    grade={student.currentMidtermGrade}
                    gradeTypeCode="MIDTERM"
                    gradeMarkOptions={gradeMarkOptions}
                    canEditGrades={canEditGrades}
                    stubGradeMarkCode={stubInitialGrades[`${student.enrollmentId}:MIDTERM`] ?? null}
                    onStubGradeChange={(gradeTypeCode, gradeMarkCode) => {
                      onStubInitialGradeChange(student.enrollmentId, gradeTypeCode, gradeMarkCode);
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <InitialGradeCell
                    grade={student.currentFinalGrade}
                    gradeTypeCode="FINAL"
                    gradeMarkOptions={gradeMarkOptions}
                    canEditGrades={canEditGrades}
                    stubGradeMarkCode={stubInitialGrades[`${student.enrollmentId}:FINAL`] ?? null}
                    onStubGradeChange={(gradeTypeCode, gradeMarkCode) => {
                      onStubInitialGradeChange(student.enrollmentId, gradeTypeCode, gradeMarkCode);
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  {formatStudentDate(student.registeredAt ?? student.enrollmentDate)}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea.Autosize>
    </Table.ScrollContainer>
  );
}
