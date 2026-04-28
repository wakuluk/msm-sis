// Sortable enrollment table for students in a course section.
// Emits selected enrollment ids so the parent panel can load detail and history data.
import { Badge, ScrollArea, Table, Text, UnstyledButton } from '@mantine/core';
import type { CourseSectionStudentResponse } from '@/services/schemas/course-schemas';
import classes from './CourseSectionStudentsPanel.module.css';
import type {
  SortableStudentColumn,
  StudentSortBy,
  StudentSortDirection,
} from './courseSectionStudentTypes';
import {
  formatCredits,
  formatStudentDate,
  sortableStudentColumns,
  studentStatusColor,
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

type CourseSectionStudentTableProps = {
  students: CourseSectionStudentResponse[];
  loading: boolean;
  selectedEnrollmentId: number | null;
  sortBy: StudentSortBy;
  sortDirection: StudentSortDirection;
  onToggleSort: (sortBy: StudentSortBy) => void;
  onSelectEnrollment: (enrollmentId: number) => void;
};

export function CourseSectionStudentTable({
  students,
  loading,
  selectedEnrollmentId,
  sortBy,
  sortDirection,
  onToggleSort,
  onSelectEnrollment,
}: CourseSectionStudentTableProps) {
  return (
    <Table.ScrollContainer minWidth={960} w="100%">
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
                <Table.Td colSpan={6}>
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
                <Table.Td>{formatCredits(student.creditsAttempted)}</Table.Td>
                <Table.Td>{student.gradingBasisName ?? 'Not set'}</Table.Td>
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
