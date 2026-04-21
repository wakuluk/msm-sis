import type { ReactNode } from 'react';
import { Alert, Grid, Stack, Table, Text } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { AcademicYearCatalogSummaryResponse } from '@/services/schemas/academic-years-schemas';
import { displayValue } from './academicYearDisplay';

type AcademicYearCatalogSummarySectionProps = {
  summary: AcademicYearCatalogSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  action?: ReactNode;
};

export function AcademicYearCatalogSummarySection({
  summary,
  isLoading,
  error,
  action,
}: AcademicYearCatalogSummarySectionProps) {
  return (
    <RecordPageSection
      title="Catalog Summary"
      description="Year-level catalog totals derived from this academic year’s term groups and their terms."
      action={action}
    >
      {summary ? (
        <>
          <ReadOnlyField
            label="Term groups"
            value={displayValue(summary.termGroupCount)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Terms"
            value={displayValue(summary.termCount)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Course offerings"
            value={displayValue(summary.courseOfferingCount)}
            span={{ base: 12, md: 4 }}
          />
          <Grid.Col span={12}>
            {summary.termGroups.length === 0 ? (
              <Alert color="gray" title="No catalog summary yet">
                This academic year does not have term groups with catalog activity yet.
              </Alert>
            ) : (
              <Table.ScrollContainer minWidth={720}>
                <Table striped highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Term Group</Table.Th>
                      <Table.Th>Terms</Table.Th>
                      <Table.Th>Course Offerings</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {summary.termGroups.map((termGroup) => (
                      <Table.Tr key={termGroup.termGroupId}>
                        <Table.Td>
                          <Stack gap={2}>
                            <Text fw={600}>{termGroup.name}</Text>
                            <Text size="sm" c="dimmed">
                              {termGroup.code}
                            </Text>
                            {termGroup.terms.length > 0 ? (
                              <Text size="xs" c="dimmed">
                                {termGroup.terms
                                  .map((term) => `${term.code}: ${term.courseOfferingCount}`)
                                  .join(' • ')}
                              </Text>
                            ) : null}
                          </Stack>
                        </Table.Td>
                        <Table.Td>{termGroup.termCount}</Table.Td>
                        <Table.Td>{termGroup.courseOfferingCount}</Table.Td>
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
          <Alert color="red" title="Unable to load catalog summary">
            {error}
          </Alert>
        </Grid.Col>
      ) : isLoading ? (
        <Grid.Col span={12}>
          <Alert color="blue" title="Loading catalog summary">
            Fetching academic year catalog summary.
          </Alert>
        </Grid.Col>
      ) : null}
    </RecordPageSection>
  );
}
