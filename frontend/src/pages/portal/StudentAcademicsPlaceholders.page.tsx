import { useEffect, useState } from 'react';
import { Alert, Badge, Group, Loader, Text } from '@mantine/core';
import { useParams } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { StudentProgramsExperience } from '@/components/student-programs/StudentProgramsExperience';
import { StudentTranscriptView } from '@/components/student/StudentTranscriptView';
import { getStudentTranscript, getStudentTranscriptById } from '@/services/student-service';
import type { StudentTranscriptResponse } from '@/services/schemas/student-schemas';

type TranscriptPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; transcript: StudentTranscriptResponse };

type StudentAcademicsPlaceholderPageProps = {
  title: string;
  description: string;
  sectionTitle: string;
  sectionDescription: string;
};

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

function StudentTranscriptLoadedPage({ transcript }: { transcript: StudentTranscriptResponse }) {
  return (
    <RecordPageShell
      eyebrow="Student Academics"
      title="Transcript"
      description="Transcript layout based on enrollment, section grade, grade mark, transfer credit, and academic term tables."
      badge={
        <Badge variant="light" color="green" size="lg">
          Live Data
        </Badge>
      }
    >
      <StudentTranscriptView transcript={transcript} />
    </RecordPageShell>
  );
}

function StudentTranscriptRoutePage({ studentId }: { studentId?: number }) {
  const [pageState, setPageState] = useState<TranscriptPageState>({ status: 'loading' });

  useEffect(() => {
    const abortController = new AbortController();

    async function loadTranscript() {
      try {
        const transcript =
          studentId === undefined
            ? await getStudentTranscript(abortController.signal)
            : await getStudentTranscriptById(studentId, abortController.signal);
        setPageState({ status: 'success', transcript });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to fetch student transcript.',
        });
      }
    }

    void loadTranscript();

    return () => {
      abortController.abort();
    };
  }, [studentId]);

  if (pageState.status === 'loading') {
    return (
      <RecordPageShell
        eyebrow="Student Academics"
        title="Transcript"
        description="Loading transcript."
      >
        <RecordPageSection title="Transcript">
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading transcript data.
            </Text>
          </Group>
        </RecordPageSection>
      </RecordPageShell>
    );
  }

  if (pageState.status === 'error') {
    return (
      <RecordPageShell
        eyebrow="Student Academics"
        title="Transcript"
        description="Transcript unavailable."
      >
        <RecordPageSection title="Transcript">
          <Alert color="red" variant="light">
            {pageState.message}
          </Alert>
        </RecordPageSection>
      </RecordPageShell>
    );
  }

  return <StudentTranscriptLoadedPage transcript={pageState.transcript} />;
}

export function StudentTranscriptPage() {
  return <StudentTranscriptRoutePage />;
}

export function StudentAdminTranscriptPage() {
  const { studentId: studentIdParam } = useParams();
  const parsedStudentId = Number(studentIdParam);

  if (!studentIdParam || !Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
    return (
      <RecordPageShell
        eyebrow="Student Academics"
        title="Transcript"
        description="Transcript unavailable."
      >
        <RecordPageSection title="Transcript">
          <Alert color="red" variant="light">
            Invalid student ID.
          </Alert>
        </RecordPageSection>
      </RecordPageShell>
    );
  }

  return <StudentTranscriptRoutePage studentId={parsedStudentId} />;
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

export function StudentProgramsPage() {
  return <StudentProgramsExperience />;
}
