import { Badge, Grid, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';

type TranscriptGrade = {
  type: 'FINAL' | 'MIDTERM';
  mark: string;
  qualityPoints: number | null;
  earnsCredit: boolean;
  countsInGpa: boolean;
};

type TranscriptCourse = {
  id: string;
  term: string;
  academicYear: string;
  source: 'LOCAL' | 'TRANSFER';
  subjectCode: string;
  courseNumber: string;
  title: string;
  status: 'Completed' | 'Registered' | 'Transferred' | 'Withdrawn';
  gradingBasis: 'Graded' | 'Pass/Fail' | 'Transfer';
  creditsAttempted: number;
  creditsEarned: number | null;
  includeInGpa: boolean;
  grades: TranscriptGrade[];
};

type TranscriptTerm = {
  id: string;
  label: string;
  academicYear: string;
  courses: TranscriptCourse[];
};

type TranscriptTotals = ReturnType<typeof calculateTermTotals>;

type StudentAcademicsPlaceholderPageProps = {
  title: string;
  description: string;
  sectionTitle: string;
  sectionDescription: string;
};

const cumulativeSummaryColumnWidths = ['18%', '18%', '17%', '17%', '18%', '12%'] as const;
const transcriptTermColumnWidths = [
  '10%',
  '25%',
  '8%',
  '8%',
  '15%',
  '13%',
  '11%',
  '12%',
  '8%',
] as const;

function StudentAcademicsPlaceholderPage({
  title,
  description,
  sectionTitle,
  sectionDescription,
}: StudentAcademicsPlaceholderPageProps) {
  return (
    <RecordPageShell
      eyebrow="Student Academics"
      title={title}
      description={description}
      badge={
        <Badge variant="light" color="gray" size="lg">
          Placeholder
        </Badge>
      }
    >
      <RecordPageSection title={sectionTitle} description={sectionDescription}>
        <Text size="sm" c="dimmed">
          This page is ready for the academic record experience.
        </Text>
      </RecordPageSection>
    </RecordPageShell>
  );
}

const transcriptTerms: TranscriptTerm[] = [
  {
    id: 'spring-2028',
    label: 'Spring 2028',
    academicYear: 'AY-2027-2028',
    courses: [
      {
        id: 'meh-310-spring',
        term: 'Spring 2028',
        academicYear: 'AY-2027-2028',
        source: 'LOCAL',
        subjectCode: 'MEH',
        courseNumber: '310',
        title: 'Middle-earth Histories',
        status: 'Registered',
        gradingBasis: 'Graded',
        creditsAttempted: 3,
        creditsEarned: null,
        includeInGpa: true,
        grades: [
          {
            type: 'MIDTERM',
            mark: 'A-',
            qualityPoints: 3.7,
            earnsCredit: true,
            countsInGpa: true,
          },
        ],
      },
    ],
  },
  {
    id: 'fall-2027',
    label: 'Fall 2027',
    academicYear: 'AY-2027-2028',
    courses: [
      {
        id: 'meh-310-fall',
        term: 'Fall 2027',
        academicYear: 'AY-2027-2028',
        source: 'LOCAL',
        subjectCode: 'MEH',
        courseNumber: '310',
        title: 'Middle-earth Histories',
        status: 'Completed',
        gradingBasis: 'Graded',
        creditsAttempted: 3,
        creditsEarned: 3,
        includeInGpa: true,
        grades: [
          {
            type: 'MIDTERM',
            mark: 'B+',
            qualityPoints: 3.3,
            earnsCredit: true,
            countsInGpa: true,
          },
          {
            type: 'FINAL',
            mark: 'A-',
            qualityPoints: 3.7,
            earnsCredit: true,
            countsInGpa: true,
          },
        ],
      },
      {
        id: 'meh-310-withdrawn',
        term: 'Fall 2027',
        academicYear: 'AY-2027-2028',
        source: 'LOCAL',
        subjectCode: 'MEH',
        courseNumber: '310',
        title: 'Middle-earth Histories',
        status: 'Withdrawn',
        gradingBasis: 'Graded',
        creditsAttempted: 3,
        creditsEarned: 0,
        includeInGpa: true,
        grades: [
          {
            type: 'MIDTERM',
            mark: 'W',
            qualityPoints: null,
            earnsCredit: false,
            countsInGpa: false,
          },
        ],
      },
    ],
  },
  {
    id: 'summer-2027-transfer',
    label: 'Summer 2027 Transfer Credit',
    academicYear: 'Transfer',
    courses: [
      {
        id: 'transfer-bio-150',
        term: 'Summer 2027',
        academicYear: 'Transfer',
        source: 'TRANSFER',
        subjectCode: 'BIO',
        courseNumber: '150',
        title: 'Principles of Biology',
        status: 'Transferred',
        gradingBasis: 'Transfer',
        creditsAttempted: 4,
        creditsEarned: 4,
        includeInGpa: false,
        grades: [
          {
            type: 'FINAL',
            mark: 'TR',
            qualityPoints: null,
            earnsCredit: true,
            countsInGpa: false,
          },
        ],
      },
    ],
  },
  {
    id: 'spring-2027',
    label: 'Spring 2027',
    academicYear: 'AY-2026-2027',
    courses: [
      {
        id: 'tolk-101',
        term: 'Spring 2027',
        academicYear: 'AY-2026-2027',
        source: 'LOCAL',
        subjectCode: 'TOLK',
        courseNumber: '101',
        title: 'Foundations of Tolkien Studies',
        status: 'Completed',
        gradingBasis: 'Graded',
        creditsAttempted: 3,
        creditsEarned: 3,
        includeInGpa: true,
        grades: [
          {
            type: 'MIDTERM',
            mark: 'A',
            qualityPoints: 4,
            earnsCredit: true,
            countsInGpa: true,
          },
          {
            type: 'FINAL',
            mark: 'A',
            qualityPoints: 4,
            earnsCredit: true,
            countsInGpa: true,
          },
        ],
      },
      {
        id: 'tolk-101-pass-fail',
        term: 'Spring 2027',
        academicYear: 'AY-2026-2027',
        source: 'LOCAL',
        subjectCode: 'TOLK',
        courseNumber: '101',
        title: 'Foundations of Tolkien Studies',
        status: 'Completed',
        gradingBasis: 'Pass/Fail',
        creditsAttempted: 3,
        creditsEarned: 3,
        includeInGpa: false,
        grades: [
          {
            type: 'FINAL',
            mark: 'P',
            qualityPoints: null,
            earnsCredit: true,
            countsInGpa: false,
          },
        ],
      },
    ],
  },
  {
    id: 'fall-2026-transfer',
    label: 'Fall 2026 Transfer Credit',
    academicYear: 'Transfer',
    courses: [
      {
        id: 'transfer-wrt-101',
        term: 'Fall 2026',
        academicYear: 'Transfer',
        source: 'TRANSFER',
        subjectCode: 'WRT',
        courseNumber: '101',
        title: 'College Writing',
        status: 'Transferred',
        gradingBasis: 'Transfer',
        creditsAttempted: 3,
        creditsEarned: 3,
        includeInGpa: false,
        grades: [
          {
            type: 'FINAL',
            mark: 'TR',
            qualityPoints: null,
            earnsCredit: true,
            countsInGpa: false,
          },
        ],
      },
      {
        id: 'transfer-math-120',
        term: 'Fall 2026',
        academicYear: 'Transfer',
        source: 'TRANSFER',
        subjectCode: 'MATH',
        courseNumber: '120',
        title: 'College Algebra',
        status: 'Transferred',
        gradingBasis: 'Transfer',
        creditsAttempted: 3,
        creditsEarned: 3,
        includeInGpa: false,
        grades: [
          {
            type: 'FINAL',
            mark: 'TR',
            qualityPoints: null,
            earnsCredit: true,
            countsInGpa: false,
          },
        ],
      },
    ],
  },
  {
    id: 'spring-2026-transfer',
    label: 'Spring 2026 Transfer Credit',
    academicYear: 'Transfer',
    courses: [
      {
        id: 'transfer-hist-110',
        term: 'Spring 2026',
        academicYear: 'Transfer',
        source: 'TRANSFER',
        subjectCode: 'HIST',
        courseNumber: '110',
        title: 'World History',
        status: 'Transferred',
        gradingBasis: 'Transfer',
        creditsAttempted: 3,
        creditsEarned: 3,
        includeInGpa: false,
        grades: [
          {
            type: 'FINAL',
            mark: 'TR',
            qualityPoints: null,
            earnsCredit: true,
            countsInGpa: false,
          },
        ],
      },
    ],
  },
];

function formatCredits(value: number | null) {
  return value === null ? '—' : value.toFixed(2);
}

function getTranscriptGrade(course: TranscriptCourse) {
  return (
    course.grades.find((grade) => grade.type === 'FINAL') ??
    course.grades.find((grade) => grade.type === 'MIDTERM') ??
    null
  );
}

function calculateTermTotals(courses: TranscriptCourse[]) {
  const gpaCourses = courses.filter((course) => {
    const grade = getTranscriptGrade(course);

    return course.includeInGpa && grade?.countsInGpa && grade.qualityPoints !== null;
  });
  const attemptedCredits = courses.reduce((total, course) => total + course.creditsAttempted, 0);
  const earnedCredits = courses.reduce((total, course) => total + (course.creditsEarned ?? 0), 0);
  const gpaCredits = gpaCourses.reduce((total, course) => total + course.creditsAttempted, 0);
  const qualityPoints = gpaCourses.reduce((total, course) => {
    const grade = getTranscriptGrade(course);

    return total + (grade?.qualityPoints ?? 0) * course.creditsAttempted;
  }, 0);

  return {
    attemptedCredits,
    earnedCredits,
    gpaCredits,
    qualityPoints,
    gpa: gpaCredits > 0 ? qualityPoints / gpaCredits : null,
  };
}

function TranscriptMetric({ label, value }: { label: string; value: string }) {
  return (
    <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
      <TextInput label={label} value={value} readOnly />
    </Grid.Col>
  );
}

function formatGpa(value: number | null) {
  return value === null ? '0.0000' : value.toFixed(4);
}

function sumTranscriptTotals(left: TranscriptTotals, right: TranscriptTotals): TranscriptTotals {
  const gpaCredits = left.gpaCredits + right.gpaCredits;
  const qualityPoints = left.qualityPoints + right.qualityPoints;

  return {
    attemptedCredits: left.attemptedCredits + right.attemptedCredits,
    earnedCredits: left.earnedCredits + right.earnedCredits,
    gpaCredits,
    qualityPoints,
    gpa: gpaCredits > 0 ? qualityPoints / gpaCredits : null,
  };
}

function CumulativeSummaryTable({ courses }: { courses: TranscriptCourse[] }) {
  const transferTotals = calculateTermTotals(
    courses.filter((course) => course.source === 'TRANSFER')
  );
  const localTotals = calculateTermTotals(courses.filter((course) => course.source === 'LOCAL'));
  const careerTotals = sumTranscriptTotals(transferTotals, localTotals);
  const rows = [
    { label: 'Transfer', totals: transferTotals },
    { label: 'Local', totals: localTotals },
  ];
  const careerRows = [{ label: 'Career', totals: careerTotals }];
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

function getCourseQualityPoints(course: TranscriptCourse) {
  const grade = getTranscriptGrade(course);

  return grade?.qualityPoints !== null && grade?.qualityPoints !== undefined
    ? grade.qualityPoints * course.creditsAttempted
    : null;
}

function hasDisplayedMidtermGrade(term: TranscriptTerm) {
  return term.courses.some((course) => getTranscriptGrade(course)?.type === 'MIDTERM');
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

function TranscriptTermTable({
  careerTotals,
  term,
}: {
  careerTotals: TranscriptTotals;
  term: TranscriptTerm;
}) {
  const totals = calculateTermTotals(term.courses);

  return (
    <Grid.Col span={12}>
      <Stack gap="sm">
        <Group gap="xs" align="center">
          <Text fw={700}>{term.label}</Text>
          {hasDisplayedMidtermGrade(term) ? (
            <Badge variant="outline" color="yellow" size="sm">
              Midterm
            </Badge>
          ) : null}
        </Group>

        <Table.ScrollContainer minWidth={1040}>
          <Table
            withTableBorder
            withColumnBorders
            striped
            highlightOnHover
            style={{ tableLayout: 'fixed' }}
          >
            <colgroup>
              {transcriptTermColumnWidths.map((width, index) => (
                <col key={`${width}-${index}`} style={{ width }} />
              ))}
            </colgroup>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Course</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Grade</Table.Th>
                <Table.Th>Repeat</Table.Th>
                <Table.Th>Attempted Credits</Table.Th>
                <Table.Th>Earned Credits</Table.Th>
                <Table.Th>GPA Credits</Table.Th>
                <Table.Th>Quality Points</Table.Th>
                <Table.Th>GPA</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {term.courses.map((course) => {
                const grade = getTranscriptGrade(course);

                return (
                  <Table.Tr key={course.id}>
                    <Table.Td>
                      {course.subjectCode} {course.courseNumber}
                    </Table.Td>
                    <Table.Td>{course.title}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={grade?.type === 'FINAL' ? 'green' : 'yellow'}>
                        {grade?.mark ?? '—'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>-</Table.Td>
                    <Table.Td>{formatCredits(course.creditsAttempted)}</Table.Td>
                    <Table.Td>{formatCredits(course.creditsEarned)}</Table.Td>
                    <Table.Td>
                      {course.includeInGpa && grade?.countsInGpa
                        ? formatCredits(course.creditsAttempted)
                        : '0.00'}
                    </Table.Td>
                    <Table.Td>
                      {getCourseQualityPoints(course) !== null
                        ? formatCredits(getCourseQualityPoints(course))
                        : '0.00'}
                    </Table.Td>
                    <Table.Td />
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
            <Table.Tfoot>
              <TranscriptTotalsRow label="Term Totals:" totals={totals} withSeparator />
              <TranscriptTotalsRow label="Career Totals:" totals={careerTotals} />
            </Table.Tfoot>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </Grid.Col>
  );
}

function StudentTranscriptMockPage() {
  const allCourses = transcriptTerms.flatMap((term) => term.courses);
  const totals = calculateTermTotals(allCourses);

  return (
    <RecordPageShell
      eyebrow="Student Academics"
      title="Transcript"
      description="Mock transcript layout based on enrollment, section grade, grade mark, and academic term tables."
      badge={
        <Badge variant="light" color="blue" size="lg">
          Mock
        </Badge>
      }
    >
      <RecordPageSection
        title="Student Record"
        description="Student and transcript status details that would come from the profile and academic record services."
      >
        <TranscriptMetric label="Student" value="Ori Erebor" />
        <TranscriptMetric label="Student ID" value="SEC-2029" />
        <TranscriptMetric label="Program" value="Undergraduate" />
        <TranscriptMetric label="Transcript Type" value="Unofficial" />
      </RecordPageSection>

      <RecordPageSection
        title="Cumulative Summary"
        description="Final grades are preferred for completed enrollments. Midterm grades display only when no final grade exists."
      >
        <CumulativeSummaryTable courses={allCourses} />
      </RecordPageSection>

      <RecordPageSection title="Academic History">
        {transcriptTerms.map((term) => (
          <TranscriptTermTable key={term.id} careerTotals={totals} term={term} />
        ))}
      </RecordPageSection>
    </RecordPageShell>
  );
}

export function StudentTranscriptPage() {
  return <StudentTranscriptMockPage />;
}

export function StudentCourseHistoryPage() {
  return (
    <StudentAcademicsPlaceholderPage
      title="Course History"
      description="Review completed, in-progress, and transferred coursework."
      sectionTitle="Course History"
      sectionDescription="Course attempts and outcomes will appear here."
    />
  );
}

export function StudentDegreeTrackerPage() {
  return (
    <StudentAcademicsPlaceholderPage
      title="Degree Tracker"
      description="Track degree progress against program requirements."
      sectionTitle="Degree Progress"
      sectionDescription="Program requirements and completion progress will appear here."
    />
  );
}
