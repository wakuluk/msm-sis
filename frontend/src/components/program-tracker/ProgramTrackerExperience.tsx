import { type ReactNode, useEffect, useState } from 'react';
import { DndContext, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { Alert, Button, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import type { CourseVersionDetailResponse } from '@/services/schemas/course-schemas';
import type {
  ReplaceAcademicPlanPlaceholderCourseRequest,
  StudentAcademicPlanResponse,
  StudentProgramsResponse,
} from '@/services/schemas/student-program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { AddCourseToPlannerModal } from './AddCourseToPlannerModal';
import { CourseVersionDetailModal } from './CourseVersionDetailModal';
import { ProgramRequirementsSection } from './ProgramRequirementsSection';
import { ReplacePlannerPlaceholderCourseModal } from './ReplacePlannerPlaceholderCourseModal';
import { SemesterPlannerSection } from './SemesterPlannerSection';
import { useProgramPlanner, type ProgramTrackerPlannerActions } from './useProgramPlanner';
import { useProgramTrackerCourseDetails } from './useProgramTrackerCourseDetails';
import type { ProgramTrackerProgram } from './program-tracker.types';

type ProgramTrackerPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success' };

export type ProgramTrackerExperienceActions = ProgramTrackerPlannerActions & {
  loadCourseVersion: (request: {
    courseId: number;
    signal?: AbortSignal;
  }) => Promise<CourseVersionDetailResponse>;
  replacePlaceholder?: (request: {
    request: ReplaceAcademicPlanPlaceholderCourseRequest;
    signal?: AbortSignal;
    studentAcademicPlanCourseId: number;
  }) => Promise<StudentAcademicPlanResponse>;
  removeProgram?: (request: {
    signal?: AbortSignal;
    studentProgramId: number;
  }) => Promise<StudentProgramsResponse>;
  requestProgram?: (request: {
    signal?: AbortSignal;
    studentProgramId: number;
  }) => Promise<StudentProgramsResponse>;
};

export type ProgramTrackerExperienceCopy = {
  badge?: ReactNode;
  description: string;
  errorTitle: string;
  eyebrow: string;
  loadingDescription: string;
  loadingMessage: string;
  title: string;
};

export function ProgramTrackerExperience({
  actions,
  copy,
  programTrackerResponse,
}: {
  actions: ProgramTrackerExperienceActions;
  copy: ProgramTrackerExperienceCopy;
  programTrackerResponse?: StudentProgramsResponse | null;
}) {
  const [pageState, setPageState] = useState<ProgramTrackerPageState>({ status: 'loading' });
  const [expandedProgramCodes, setExpandedProgramCodes] = useState<Set<string>>(() => new Set());
  const [programRemoveError, setProgramRemoveError] = useState<string | null>(null);
  const [removingStudentProgramId, setRemovingStudentProgramId] = useState<number | null>(null);
  const [programRequestError, setProgramRequestError] = useState<string | null>(null);
  const [programRequestToConfirm, setProgramRequestToConfirm] =
    useState<ProgramTrackerProgram | null>(null);
  const [requestingStudentProgramId, setRequestingStudentProgramId] = useState<number | null>(null);
  const [showPlannerSubterms, setShowPlannerSubterms] = useState(false);
  const {
    addPlannerYear,
    addSelectedCourseToPlanner,
    closeAddCourseToPlannerModal,
    closeReplacePlaceholderCourseModal,
    expandedPlannerYearLabels,
    handlePlannerDragEnd,
    initializeProgramTracker,
    openAddCourseToPlannerModal,
    placeholderCourseToReplace,
    placeholderReplaceStatus,
    plannerCourseSelection,
    plannerSaveError,
    plannerSaveStatus,
    plannerTermOptions,
    plannerYears,
    plannerYearsReversed,
    programPreviews,
    removeCourseSelectionFromPlanner,
    removePlannerCourse,
    removePlannerYear,
    replacePlaceholderCourse,
    savePlanner,
    selectedPlannerBucketCode,
    selectedPlannerTermCode,
    setSelectedPlannerBucketCode,
    setPlaceholderCourseToReplace,
    setPlannerYearsReversed,
    setSelectedPlannerTermCode,
    showSubtermPlanner,
    togglePlannerYear,
  } = useProgramPlanner({ actions });
  const {
    closeCourseVersionModal,
    courseVersionModalState,
    openCourseVersionModal,
  } = useProgramTrackerCourseDetails({ actions });

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProgramTracker() {
      try {
        const response = await actions.loadPrograms({ signal: abortController.signal });
        const programs = initializeProgramTracker(response);

        setExpandedProgramCodes(new Set(programs.map((program) => program.code)));
        setPageState({ status: 'success' });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load program tracker.',
        });
      }
    }

    void loadProgramTracker();

    return () => {
      abortController.abort();
    };
  }, [actions]);

  useEffect(() => {
    if (!programTrackerResponse) {
      return;
    }

    const programs = initializeProgramTracker(programTrackerResponse);
    setExpandedProgramCodes(new Set(programs.map((program) => program.code)));
    setPageState({ status: 'success' });
  }, [programTrackerResponse]);

  useEffect(() => {
    if (!showSubtermPlanner) {
      setShowPlannerSubterms(false);
    }
  }, [showSubtermPlanner]);

  useEffect(() => {
    if (!showPlannerSubterms) {
      setSelectedPlannerBucketCode('FULL_TERM');
    }
  }, [setSelectedPlannerBucketCode, showPlannerSubterms]);

  function toggleProgram(programCode: string) {
    setExpandedProgramCodes((current) => {
      const next = new Set(current);

      if (next.has(programCode)) {
        next.delete(programCode);
      } else {
        next.add(programCode);
      }

      return next;
    });
  }

  async function removeProgramFromTracker(studentProgramId: number) {
    if (!actions.removeProgram) {
      return;
    }

    setProgramRemoveError(null);
    setRemovingStudentProgramId(studentProgramId);

    try {
      const response = await actions.removeProgram({ studentProgramId });
      const programs = initializeProgramTracker(response);
      setExpandedProgramCodes(new Set(programs.map((program) => program.code)));
    } catch (error) {
      setProgramRemoveError(getErrorMessage(error, 'Failed to remove program.'));
    } finally {
      setRemovingStudentProgramId(null);
    }
  }

  async function requestProgramFromTracker(program: ProgramTrackerProgram) {
    if (!actions.requestProgram) {
      return;
    }

    const studentProgramId = program.studentProgramId;
    if (studentProgramId === undefined) {
      setProgramRequestError('Program preview is missing its student program id.');
      return;
    }

    setProgramRequestError(null);
    setRequestingStudentProgramId(studentProgramId);

    try {
      const response = await actions.requestProgram({ studentProgramId });
      const programs = initializeProgramTracker(response);
      setExpandedProgramCodes(new Set(programs.map((program) => program.code)));
      setProgramRequestToConfirm(null);
    } catch (error) {
      setProgramRequestError(getErrorMessage(error, 'Failed to request program.'));
    } finally {
      setRequestingStudentProgramId(null);
    }
  }

  if (pageState.status === 'loading') {
    return (
      <RecordPageShell
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.loadingDescription}
      >
        <RecordPageSection title="Current Programs">
          <Group gap="sm">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              {copy.loadingMessage}
            </Text>
          </Group>
        </RecordPageSection>
      </RecordPageShell>
    );
  }

  if (pageState.status === 'error') {
    return (
      <RecordPageShell
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <RecordPageSection title="Current Programs">
          <Alert color="red" title={copy.errorTitle}>
            {pageState.message}
          </Alert>
        </RecordPageSection>
      </RecordPageShell>
    );
  }

  return (
    <RecordPageShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      badge={copy.badge}
    >
      <AddCourseToPlannerModal
        opened={plannerCourseSelection !== null}
        onClose={closeAddCourseToPlannerModal}
        onBucketChange={setSelectedPlannerBucketCode}
        onSave={addSelectedCourseToPlanner}
        onTermChange={setSelectedPlannerTermCode}
        plannerCourseSelection={plannerCourseSelection}
        plannerTermOptions={plannerTermOptions}
        selectedPlannerBucketCode={selectedPlannerBucketCode}
        selectedPlannerTermCode={selectedPlannerTermCode}
        showSubterms={showPlannerSubterms}
      />
      <CourseVersionDetailModal
        state={courseVersionModalState}
        onClose={closeCourseVersionModal}
      />
      <ReplacePlannerPlaceholderCourseModal
        course={placeholderCourseToReplace}
        opened={placeholderCourseToReplace !== null}
        replacing={placeholderReplaceStatus === 'replacing'}
        onClose={closeReplacePlaceholderCourseModal}
        onReplace={(course) => {
          void replacePlaceholderCourse(course);
        }}
      />
      <ProgramRequestConfirmationModal
        program={programRequestToConfirm}
        requestError={programRequestError}
        requesting={
          programRequestToConfirm?.studentProgramId !== undefined
            && requestingStudentProgramId === programRequestToConfirm.studentProgramId
        }
        onClose={() => {
          if (requestingStudentProgramId === null) {
            setProgramRequestToConfirm(null);
          }
        }}
        onConfirm={() => {
          if (programRequestToConfirm) {
            void requestProgramFromTracker(programRequestToConfirm);
          }
        }}
      />

      <DndContext
        collisionDetection={(args) => {
          const pointerCollisions = pointerWithin(args);
          return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
        }}
        onDragEnd={handlePlannerDragEnd}
      >
        <ProgramRequirementsSection
          expandedProgramCodes={expandedProgramCodes}
          programRemoveError={programRemoveError}
          programRequestError={programRequestError}
          programs={programPreviews}
          removingStudentProgramId={removingStudentProgramId}
          requestingStudentProgramId={requestingStudentProgramId}
          onAddCourseToPlanner={openAddCourseToPlannerModal}
          onOpenCourseDetails={(courseId, courseCode) => {
            void openCourseVersionModal(courseId, courseCode);
          }}
          onRemoveProgram={
            actions.removeProgram
              ? (studentProgramId) => {
                  void removeProgramFromTracker(studentProgramId);
                }
              : undefined
          }
          onRequestProgram={
            actions.requestProgram
              ? (studentProgramId) => {
                  const program = programPreviews.find(
                    (programPreview) => programPreview.studentProgramId === studentProgramId
                  );

                  if (program) {
                    setProgramRequestError(null);
                    setProgramRequestToConfirm(program);
                  }
                }
              : undefined
          }
          onRemoveCourseFromPlanner={removeCourseSelectionFromPlanner}
          onToggleProgram={toggleProgram}
        />

        <SemesterPlannerSection
          expandedPlannerYearLabels={expandedPlannerYearLabels}
          plannerSaveStatus={plannerSaveStatus}
          plannerYears={plannerYears}
          plannerYearsReversed={plannerYearsReversed}
          saveError={plannerSaveError}
          onAddYear={addPlannerYear}
          onOpenCourseDetails={(courseId, courseCode) => {
            void openCourseVersionModal(courseId, courseCode);
          }}
          onReplacePlaceholderCourse={setPlaceholderCourseToReplace}
          onRemoveCourse={removePlannerCourse}
          onRemoveYear={removePlannerYear}
          onSave={savePlanner}
          onToggleSubterms={() => {
            setShowPlannerSubterms((current) => !current);
          }}
          onToggleReverseYears={() => {
            setPlannerYearsReversed((current) => !current);
          }}
          onToggleYear={togglePlannerYear}
          showSubtermToggle={showSubtermPlanner}
          showSubterms={showPlannerSubterms}
        />
      </DndContext>
    </RecordPageShell>
  );
}

function ProgramRequestConfirmationModal({
  program,
  requestError,
  requesting,
  onClose,
  onConfirm,
}: {
  program: ProgramTrackerProgram | null;
  requestError: string | null;
  requesting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal opened={program !== null} onClose={onClose} title="Request program" centered size="lg">
      <Stack gap="md">
        <Text>
          You are about to submit a request for{' '}
          <Text component="span" fw={700}>
            {program?.name ?? 'this program'}
          </Text>
          .
        </Text>
        <Alert color="yellow" title="Before you submit">
          This sends your program request to academic review. Your department and the academic
          administration may review your plan and may assign a different published program version
          before final approval.
        </Alert>
        <Text size="sm" c="dimmed">
          You can keep exploring requirements before submitting. Once submitted, the request will
          appear as pending on this program.
        </Text>
        {requestError ? <Alert color="red">{requestError}</Alert> : null}
        <Group justify="flex-end">
          <Button disabled={requesting} variant="default" onClick={onClose}>
            Keep exploring
          </Button>
          <Button loading={requesting} onClick={onConfirm}>
            Submit request
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
