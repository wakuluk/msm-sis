import type { ReactNode } from 'react';
import { Alert, Grid, Stack, Table, Text } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { AcademicYearCoursesSummaryResponse } from '@/services/schemas/academic-years-schemas';
import { displayValue } from './academicYearDisplay';

type AcademicYearCoursesSummarySectionProps = {
  summary: AcademicYearCoursesSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  action?: ReactNode;
};

export function AcademicYearCoursesSummarySection({
  summary,
  isLoading,
  error,
  action,
}: AcademicYearCoursesSummarySectionProps) {
  return (
    <RecordPageSection
      title="Courses Summary"
      description="Year-level course totals derived from this academic year’s terms and their sub terms."
      action={action}
    >
      {summary ? (
        <>
          <ReadOnlyField
            label="Terms"
            value={displayValue(summary.termCount)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Sub terms"
            value={displayValue(summary.subTermCount)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Course offerings"
            value={displayValue(summary.courseOfferingCount)}
            span={{ base: 12, md: 4 }}
          />
          <Grid.Col span={12}>
            {summary.terms.length === 0 ? (
              <Alert color="gray" title="No course summary yet">
                This academic year does not have terms with course activity yet.
              </Alert>
            ) : (
              <Table.ScrollContainer minWidth={720}>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Term</Table.Th>
                      <Table.Th>Sub Terms</Table.Th>
                      <Table.Th>Course Offerings</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {summary.terms.map((term) => (
                      <Table.Tr key={term.termId}>
                        <Table.Td>
                          <Stack gap={2}>
                            <Text fw={600}>{term.name}</Text>
                            <Text size="sm" c="dimmed">
                              {term.code}
                            </Text>
                            {term.subTerms.length > 0 ? (
                              <Text size="xs" c="dimmed">
                                {term.subTerms
                                  .map((subTerm) => `${subTerm.code}: ${subTerm.courseOfferingCount}`)
                                  .join(' • ')}
                              </Text>
                            ) : null}
                          </Stack>
                        </Table.Td>
                        <Table.Td>{term.subTermCount}</Table.Td>
                        <Table.Td>{term.courseOfferingCount}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Grid.Col>
        </>
      ) : error ? (
        <Grid.Col span={12}>
          <Alert color="red" title="Unable to load course summary">
            {error}
          </Alert>
        </Grid.Col>
      ) : isLoading ? (
        <Grid.Col span={12}>
          <Alert color="blue" title="Loading course summary">
            Fetching academic year course summary.
          </Alert>
        </Grid.Col>
      ) : null}
    </RecordPageSection>
  );
}
