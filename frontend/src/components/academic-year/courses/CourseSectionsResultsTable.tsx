// Clickable course section result rows.
import { Badge, Table, Text } from '@mantine/core';
import type { CourseSectionPreview } from './courseSectionsWorkspaceTypes';

type CourseSectionsResultsTableProps = {
  isSearchScope: boolean;
  sections: CourseSectionPreview[];
  onSectionSelected: (section: CourseSectionPreview) => void;
};

export function CourseSectionsResultsTable({
  isSearchScope,
  sections,
  onSectionSelected,
}: CourseSectionsResultsTableProps) {
  return (
    <Table.ScrollContainer minWidth={920}>
      <Table withTableBorder withColumnBorders striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {isSearchScope ? <Table.Th>Course</Table.Th> : null}
            <Table.Th>Section</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Assignments</Table.Th>
            <Table.Th>Meeting Pattern</Table.Th>
            <Table.Th>Room</Table.Th>
            <Table.Th>Seats</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sections.map((section) => (
            <Table.Tr
              key={section.sectionId}
              tabIndex={0}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                onSectionSelected(section);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSectionSelected(section);
                }
              }}
            >
              {isSearchScope ? (
                <Table.Td>
                  <Text size="sm" fw={600}>
                    {section.courseCode}
                  </Text>
                </Table.Td>
              ) : null}
              <Table.Td>{section.sectionCode}</Table.Td>
              <Table.Td>
                <Badge
                  variant="light"
                  color={section.statusCode === 'DRAFT' ? 'gray' : 'green'}
                >
                  {section.statusName}
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
  );
}
