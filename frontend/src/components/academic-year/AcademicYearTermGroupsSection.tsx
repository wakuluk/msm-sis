import { Alert, Grid, Group, Paper, Stack, Table, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import type { AcademicTermGroupResponse } from '@/services/schemas/academic-years-schemas';
import { displayDate, displayValue } from './academicYearDisplay';

type AcademicYearTermGroupsSectionProps = {
  academicYearId: number;
  termGroups: AcademicTermGroupResponse[];
  isLoading?: boolean;
  error?: string | null;
};

export function AcademicYearTermGroupsSection({
  academicYearId,
  termGroups,
  isLoading = false,
  error = null,
}: AcademicYearTermGroupsSectionProps) {
  return (
    <RecordPageSection title="Academic Term Groups">
      <Grid.Col span={12}>
        <Stack gap="md">
          {error ? (
            <Alert color="red" title="Unable to load academic term groups">
              {error}
            </Alert>
          ) : null}

          {!error && isLoading ? (
            <Alert color="blue" title="Loading academic term groups">
              Fetching academic term groups and their terms.
            </Alert>
          ) : null}

          {!error && !isLoading && termGroups.length === 0 ? (
            <Alert color="gray" title="No academic term groups">
              This academic year does not have any academic term groups yet.
            </Alert>
          ) : null}

          {!error && !isLoading
            ? termGroups.map((termGroup) => (
                <Paper key={termGroup.termGroupId} withBorder p="md" radius="sm">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start" wrap="wrap">
                      <Stack gap={4}>
                        <Text fw={600}>
                          <Link
                            to={`/academics/academic-term-group/${termGroup.termGroupId}`}
                            state={{ academicYearId }}
                          >
                            {termGroup.name}
                          </Link>
                        </Text>
                      </Stack>
                      <BadgeCount
                        count={termGroup.academicTerms.length}
                        singular="term"
                        plural="terms"
                      />
                    </Group>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                          Start date
                        </Text>
                        <Text>{displayDate(termGroup.startDate)}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                          End date
                        </Text>
                        <Text>{displayDate(termGroup.endDate)}</Text>
                      </Grid.Col>
                    </Grid>

                    {termGroup.academicTerms.length === 0 ? (
                      <Alert color="gray" title="No terms in this group">
                        This term group has not been assigned any academic terms yet.
                      </Alert>
                    ) : (
                      <Table.ScrollContainer minWidth={760}>
                        <Table withTableBorder withColumnBorders striped highlightOnHover>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Sort order</Table.Th>
                              <Table.Th>Code</Table.Th>
                              <Table.Th>Name</Table.Th>
                              <Table.Th>Start date</Table.Th>
                              <Table.Th>End date</Table.Th>
                              <Table.Th>Course Offerings</Table.Th>
                              <Table.Th>Status</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {termGroup.academicTerms.map((term) => (
                              <Table.Tr key={term.termId}>
                                <Table.Td>{term.sortOrder}</Table.Td>
                                <Table.Td>
                                  <Link
                                    to={`/academics/academic-term/${term.termId}`}
                                    state={{ academicYearId }}
                                  >
                                    {term.code}
                                  </Link>
                                </Table.Td>
                                <Table.Td>{term.name}</Table.Td>
                                <Table.Td>{displayDate(term.startDate)}</Table.Td>
                                <Table.Td>{displayDate(term.endDate)}</Table.Td>
                                <Table.Td>{displayValue(term.courseOfferingCount)}</Table.Td>
                                <Table.Td>
                                  {displayValue(term.termStatusName ?? term.termStatusCode)}
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      </Table.ScrollContainer>
                    )}
                  </Stack>
                </Paper>
              ))
            : null}
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}

function BadgeCount({
  count,
  singular,
  plural,
}: {
  count: number;
  singular: string;
  plural: string;
}) {
  return (
    <Text size="sm" c="blue" fw={600}>
      {count} {count === 1 ? singular : plural}
    </Text>
  );
}
