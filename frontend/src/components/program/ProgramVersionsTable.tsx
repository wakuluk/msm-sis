import { Alert, Badge, Grid, Table } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import type { ProgramVersionDetailResponse } from '@/services/schemas/program-schemas';
import { formatClassYearRange } from './programVersionFormatters';

export function ProgramVersionsTable({
  currentVersionId,
  onSelectVersion,
  selectedVersionId,
  versions,
}: {
  currentVersionId: number | null;
  onSelectVersion: (versionId: number) => void;
  selectedVersionId: number | null;
  versions: ProgramVersionDetailResponse[];
}) {
  return (
    <RecordPageSection
      title="Program Versions"
      description="Version history for this program."
    >
      <Grid.Col span={12}>
        {versions.length === 0 ? (
          <Alert color="gray" title="No versions found">
            This program does not have any versions yet.
          </Alert>
        ) : (
          <Table.ScrollContainer minWidth={760}>
            <Table withTableBorder withColumnBorders striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Version</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Class Years</Table.Th>
                  <Table.Th>Requirements</Table.Th>
                  <Table.Th>Current</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {versions.map((version) => {
                  const isSelected = version.programVersionId === selectedVersionId;
                  const isCurrent = version.programVersionId === currentVersionId;

                  return (
                    <Table.Tr
                      key={version.programVersionId}
                      role="button"
                      tabIndex={0}
                      aria-selected={isSelected}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
                      }}
                      onClick={() => {
                        onSelectVersion(version.programVersionId);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectVersion(version.programVersionId);
                        }
                      }}
                    >
                      <Table.Td>Version {version.versionNumber}</Table.Td>
                      <Table.Td>
                        <Badge variant="light" color={version.published ? 'green' : 'gray'}>
                          {version.published ? 'Published' : 'Draft'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{formatClassYearRange(version)}</Table.Td>
                      <Table.Td>{version.requirements.length}</Table.Td>
                      <Table.Td>{isCurrent ? 'Yes' : '—'}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Grid.Col>
    </RecordPageSection>
  );
}
