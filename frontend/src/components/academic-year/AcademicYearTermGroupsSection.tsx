import { Alert, Grid, Group, Paper, Stack, Table, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import type { AcademicTermResponse } from '@/services/schemas/academic-years-schemas';
import { displayDate, displayValue } from './academicYearDisplay';

type AcademicYearTermGroupsSectionProps = {
  academicYearId: number;
  termGroups: AcademicTermResponse[];
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
    <RecordPageSection title="Terms">
      <Grid.Col span={12}>
        <Stack gap="md">
          {error ? (
            <Alert color="red" title="Unable to load terms">
              {error}
            </Alert>
          ) : null}

          {!error && isLoading ? (
            <Alert color="blue" title="Loading terms">
              Fetching terms and their sub terms.
            </Alert>
          ) : null}

          {!error && !isLoading && termGroups.length === 0 ? (
            <Alert color="gray" title="No terms">
              This academic year does not have any terms yet.
            </Alert>
          ) : null}

          {!error && !isLoading
            ? termGroups.map((term) => (
                <Paper key={term.termId} withBorder p="md" radius="sm">
                  <Stack gap="md">
                    <Group justify="space-between" align="flex-start" wrap="wrap">
                      <Stack gap={4}>
                        <Text fw={600}>
                          <Link
                            to={`/academics/academic-terms/${term.termId}`}
                            state={{ academicYearId }}
                          >
                            {term.name}
                          </Link>
                        </Text>
                      </Stack>
                      <BadgeCount
                        count={term.subTerms.length}
                        singular="sub term"
                        plural="sub terms"
                      />
                    </Group>

                    <Grid>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                          Start date
                        </Text>
                        <Text>{displayDate(term.startDate)}</Text>
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                          End date
                        </Text>
                        <Text>{displayDate(term.endDate)}</Text>
                      </Grid.Col>
                    </Grid>

                    {term.subTerms.length === 0 ? (
                      <Alert color="gray" title="No sub terms in this term">
                        This term does not have any sub terms assigned yet.
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
                            {term.subTerms.map((subTerm) => (
                              <Table.Tr key={subTerm.subTermId}>
                                <Table.Td>{subTerm.sortOrder}</Table.Td>
                                <Table.Td>
                                  <Link
                                    to={`/academics/academic-sub-term/${subTerm.subTermId}`}
                                    state={{ academicYearId }}
                                  >
                                    {subTerm.code}
                                  </Link>
                                </Table.Td>
                                <Table.Td>{subTerm.name}</Table.Td>
                                <Table.Td>{displayDate(subTerm.startDate)}</Table.Td>
                                <Table.Td>{displayDate(subTerm.endDate)}</Table.Td>
                                <Table.Td>{displayValue(subTerm.courseOfferingCount)}</Table.Td>
                                <Table.Td>
                                  {displayValue(
                                    subTerm.subTermStatusName ?? subTerm.subTermStatusCode
                                  )}
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
