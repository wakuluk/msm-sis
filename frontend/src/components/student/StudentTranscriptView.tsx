import { Badge, Grid, Group, Stack, Table, Text, TextInput, Tooltip } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import type {
  StudentTranscriptCourseResponse,
  StudentTranscriptResponse,
  StudentTranscriptSummaryResponse,
  StudentTranscriptTermResponse,
} from '@/services/schemas/student-schemas';

type TranscriptTotals = StudentTranscriptSummaryResponse;

const cumulativeSummaryColumnWidths = ['18%', '18%', '17%', '17%', '18%', '12%'] as const;
const transcriptTermColumnWidths = [
  '8%',
  '20%',
  '6%',
  '7%',
  '14.5%',
  '11.5%',
  '9.5%',
  '11.5%',
  '7%',
] as const;

function formatCredits(value: number | null) {
  return value === null ? '—' : value.toFixed(2);
}

function formatGpa(value: number | null) {
  return value === null ? '0.0000' : value.toFixed(4);
}

function TranscriptMetric({ label, value }: { label: string; value: string }) {
  return (
    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
      <TextInput label={label} value={value} readOnly />
    </Grid.Col>
  );
}

function CumulativeSummaryTable({
  summary,
}: {
  summary: StudentTranscriptResponse['cumulativeSummary'];
}) {
  const rows = [
    { label: 'Transfer', totals: summary.transfer },
    { label: 'Local', totals: summary.local },
  ];
  const careerRows = [{ label: 'Career', totals: summary.career }];
  const renderSummaryTable = (summaryRows: typeof rows) => (
    <Table.ScrollContainer minWidth={760}>
      <Table withTableBorder withColumnBorders striped style={{ tableLayout: 'fixed' }}>
        <colgroup>
          {cumulativeSummaryColumnWidths.map((width, index) => (
            <col key={`${width}-${index}`} style={{ width }} />
          ))}
        </colgroup>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Type</Table.Th>
            <Table.Th>Attempted Credits</Table.Th>
            <Table.Th>Earned Credits</Table.Th>
            <Table.Th>GPA Credits</Table.Th>
            <Table.Th>Quality Points</Table.Th>
            <Table.Th>GPA</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {summaryRows.map((row) => (
            <Table.Tr key={row.label}>
              <Table.Td fw={700}>{row.label}</Table.Td>
              <Table.Td>{formatCredits(row.totals.attemptedCredits)}</Table.Td>
              <Table.Td>{formatCredits(row.totals.earnedCredits)}</Table.Td>
              <Table.Td>{formatCredits(row.totals.gpaCredits)}</Table.Td>
              <Table.Td>{formatCredits(row.totals.qualityPoints)}</Table.Td>
              <Table.Td>{formatGpa(row.totals.gpa)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );

  return (
    <Grid.Col span={12}>
      <Stack gap="md">
        <Stack gap="xs">
          <Text fw={700}>Transfer and Local Credits</Text>
          {renderSummaryTable(rows)}
        </Stack>
        <Stack gap="xs">
          <Text fw={700}>Career Totals</Text>
          {renderSummaryTable(careerRows)}
        </Stack>
      </Stack>
    </Grid.Col>
  );
}

function getGradeBadgeColor(course: StudentTranscriptCourseResponse) {
  if (course.gradeTypeCode === 'MIDTERM') {
    return 'yellow';
  }

  if (course.source === 'TRANSFER') {
    return 'blue';
  }

  return 'green';
}

function getRepeatMarker(course: StudentTranscriptCourseResponse) {
  if (course.repeatCode === 'REPEATED') {
    return {
      color: 'blue',
      label: 'R',
      title: 'Repeated',
    };
  }

  if (course.repeatCode === 'REPLACED') {
    return {
      color: 'gray',
      label: '*',
      title: 'Excluded from GPA',
    };
  }

  return null;
}

function TranscriptTotalsRow({
  label,
  totals,
  withSeparator = false,
}: {
  label: string;
  totals: TranscriptTotals;
  withSeparator?: boolean;
}) {
  const cellStyle = withSeparator
    ? { borderTop: '2px solid var(--portal-ui-surface-border-color)' }
    : undefined;

  return (
    <Table.Tr>
      <Table.Td style={cellStyle} />
      <Table.Td fw={700} style={cellStyle}>
        {label}
      </Table.Td>
      <Table.Td style={cellStyle} />
      <Table.Td style={cellStyle} />
      <Table.Td fw={700} style={cellStyle}>
        {formatCredits(totals.attemptedCredits)}
      </Table.Td>
      <Table.Td fw={700} style={cellStyle}>
        {formatCredits(totals.earnedCredits)}
      </Table.Td>
      <Table.Td fw={700} style={cellStyle}>
        {formatCredits(totals.gpaCredits)}
      </Table.Td>
      <Table.Td fw={700} style={cellStyle}>
        {formatCredits(totals.qualityPoints)}
      </Table.Td>
      <Table.Td fw={700} style={cellStyle}>
        {formatGpa(totals.gpa)}
      </Table.Td>
    </Table.Tr>
  );
}

function TranscriptTermTable({ term }: { term: StudentTranscriptTermResponse }) {
  const headerCellStyle = { whiteSpace: 'nowrap' } as const;

  return (
    <Grid.Col span={12}>
      <Stack gap="sm">
        <Group gap="xs" align="center">
          <Text fw={700}>{term.label}</Text>
          {term.midterm ? (
            <Badge variant="outline" color="yellow" size="sm">
              Midterm
            </Badge>
          ) : null}
        </Group>

        <Table
          withTableBorder
          withColumnBorders
          striped
          highlightOnHover
          style={{ tableLayout: 'fixed', width: '100%', fontSize: 'var(--mantine-font-size-sm)' }}
        >
          <colgroup>
            {transcriptTermColumnWidths.map((width, index) => (
              <col key={`${width}-${index}`} style={{ width }} />
            ))}
          </colgroup>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={headerCellStyle}>Course</Table.Th>
              <Table.Th style={headerCellStyle}>Title</Table.Th>
              <Table.Th style={headerCellStyle}>Grade</Table.Th>
              <Table.Th style={headerCellStyle}>Repeat</Table.Th>
              <Table.Th style={headerCellStyle}>Attempted Credits</Table.Th>
              <Table.Th style={headerCellStyle}>Earned Credits</Table.Th>
              <Table.Th style={headerCellStyle}>GPA Credits</Table.Th>
              <Table.Th style={headerCellStyle}>Quality Points</Table.Th>
              <Table.Th style={headerCellStyle}>GPA</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {term.courses.map((course) =>
              (() => {
                const repeatMarker = getRepeatMarker(course);

                return (
                  <Table.Tr key={`${course.source}-${course.recordId}`}>
                    <Table.Td>{course.courseCode}</Table.Td>
                    <Table.Td>{course.title ?? '—'}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={getGradeBadgeColor(course)}>
                        {course.gradeCode ?? '—'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {repeatMarker ? (
                        <Tooltip label={repeatMarker.title}>
                          <Badge
                            variant="light"
                            color={repeatMarker.color}
                            aria-label={repeatMarker.title}
                          >
                            {repeatMarker.label}
                          </Badge>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </Table.Td>
                    <Table.Td>{formatCredits(course.attemptedCredits)}</Table.Td>
                    <Table.Td>{formatCredits(course.earnedCredits)}</Table.Td>
                    <Table.Td>{formatCredits(course.gpaCredits)}</Table.Td>
                    <Table.Td>{formatCredits(course.qualityPoints)}</Table.Td>
                    <Table.Td />
                  </Table.Tr>
                );
              })()
            )}
          </Table.Tbody>
          <Table.Tfoot>
            <TranscriptTotalsRow label="Term Totals:" totals={term.termSummary} withSeparator />
            <TranscriptTotalsRow label="Career Totals:" totals={term.careerSummary} />
          </Table.Tfoot>
        </Table>
      </Stack>
    </Grid.Col>
  );
}

export function StudentTranscriptView({ transcript }: { transcript: StudentTranscriptResponse }) {
  return (
    <>
      <RecordPageSection title="Student Record">
        <TranscriptMetric label="Student" value={transcript.studentName || '—'} />
        <TranscriptMetric
          label="Student ID"
          value={transcript.studentNumber ?? String(transcript.studentId)}
        />
      </RecordPageSection>

      <RecordPageSection
        title="Cumulative Summary"
        description="Final grades are preferred for completed enrollments. Midterm grades display only when no final grade exists."
      >
        <CumulativeSummaryTable summary={transcript.cumulativeSummary} />
      </RecordPageSection>

      <RecordPageSection title="Academic History">
        {transcript.terms.map((term) => (
          <TranscriptTermTable key={`${term.source}-${term.label}-${term.sortDate}`} term={term} />
        ))}
      </RecordPageSection>
    </>
  );
}
