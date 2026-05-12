import { type ReactNode, type SetStateAction, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Grid,
  Group,
  Pagination,
  Paper,
  Select,
  Stack,
  Stepper,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import {
  getCourseSectionDetail,
  moveCourseSectionsToNextStage,
  patchCourseSection,
} from '@/services/course-service';
import type {
  CourseSectionStageTransitionIssueResponse,
  CourseSectionStageTransitionResponse,
} from '@/services/schemas/course-schemas';
import type { StaffReferenceOptionResponse } from '@/services/schemas/staff-schemas';
import { searchStaff } from '@/services/staff-service';
import {
  buildPatchSectionRequest,
  buildStaffSelectOptions,
} from './courseSectionRequestBuilders';
import { CourseSectionDetailOverviewSection } from './CourseSectionDetailOverviewSection';
import { CourseSectionDetailSetupSection } from './CourseSectionDetailSetupSection';
import { CourseSectionsFilters } from './CourseSectionsFilters';
import {
  buildDraftFromSection,
  filterSections,
  getErrorMessage,
  getPrimaryInstructorSearchValue,
  mapCourseSectionDetailToPreview,
  toCourseSectionMutationErrorState,
} from './courseSectionsWorkspaceUtils';
import type {
  CourseSectionDraft,
  CourseSectionMutationState,
  CourseSectionPreview,
  CourseSectionSearchValues,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';
import { initialCourseSectionSearchValues } from './courseSectionsWorkspaceTypes';

type CourseSectionStageWizardProps = {
  hasActiveScope: boolean;
  initialExcludedSectionIds?: ReadonlyArray<number>;
  onRefreshSections?: () => Promise<void> | void;
  onStageMoveComplete?: (response: CourseSectionStageTransitionResponse) => void;
  sectionStatusOptions: SelectOption[];
  sections: CourseSectionPreview[];
  subTermId: number | null;
  subTermLabel: string;
};

type WizardSection = CourseSectionPreview & {
  wizardInstructor: string;
  wizardMeetingPattern: string;
  wizardRoom: string;
  wizardSectionCode: string;
  wizardStatusCode: string;
  wizardStatusName: string;
};

type StageTableProps = {
  emptyMessage: string;
  excludedSectionIds: ReadonlySet<number>;
  sections: WizardSection[];
  selectedSectionId: number | null;
  tableKey: string;
  onSectionSelected: (sectionId: number) => void;
  onSetSectionsIncluded: (sectionIds: ReadonlyArray<number>, included: boolean) => void;
  onToggleSection: (sectionId: number, included: boolean) => void;
};

type StageReviewTableProps = StageTableProps & {
  statusLabel: string;
};

type SelectedSectionDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; section: CourseSectionPreview; subTermId: number | null };

type StaffSearchState =
  | { status: 'idle'; results: StaffReferenceOptionResponse[] }
  | { status: 'loading'; results: StaffReferenceOptionResponse[] }
  | { status: 'success'; results: StaffReferenceOptionResponse[] }
  | { status: 'error'; results: StaffReferenceOptionResponse[]; message: string };

type StageMoveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string; issues: CourseSectionStageTransitionIssueResponse[] };

const stageOrder = ['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED'];
const emptyStatuses = new Set(['', 'tbd', 'none', 'unassigned']);
const pageSizeOptions = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '25', label: '25' },
];
const instructorRoleOptions: SelectOption[] = [
  { value: 'PRIMARY_INSTRUCTOR', label: 'Primary Instructor' },
  { value: 'CO_INSTRUCTOR', label: 'Co-Instructor' },
  { value: 'TEACHING_ASSISTANT', label: 'Teaching Assistant' },
  { value: 'GRADER', label: 'Grader' },
  { value: 'OBSERVER', label: 'Observer' },
];

export function CourseSectionStageWizard({
  hasActiveScope,
  initialExcludedSectionIds = [],
  onRefreshSections,
  onStageMoveComplete,
  sectionStatusOptions,
  sections,
  subTermId,
  subTermLabel,
}: CourseSectionStageWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [sourceStatus, setSourceStatus] = useState<string | null>(null);
  const [excludedSectionIds, setExcludedSectionIds] = useState<Set<number>>(
    () => new Set(initialExcludedSectionIds)
  );
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [sectionOverrides, setSectionOverrides] = useState<Record<number, CourseSectionPreview>>(
    {}
  );
  const [selectedSectionDetailState, setSelectedSectionDetailState] =
    useState<SelectedSectionDetailState>({ status: 'idle' });
  const [selectedDraft, setSelectedDraft] = useState<CourseSectionDraft | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [selectedSectionMutationState, setSelectedSectionMutationState] =
    useState<CourseSectionMutationState>({
      status: 'idle',
    });
  const [staffSearchState, setStaffSearchState] = useState<StaffSearchState>({
    status: 'idle',
    results: [],
  });
  const [tableSearchValues, setTableSearchValues] = useState<CourseSectionSearchValues>(
    initialCourseSectionSearchValues
  );
  const [staffSearchValue, setStaffSearchValue] = useState('');
  const [stageMoveState, setStageMoveState] = useState<StageMoveState>({ status: 'idle' });
  const [detailSaveMessage, setDetailSaveMessage] = useState<string | null>(null);
  const statusLabelByCode = useMemo(
    () => new Map(sectionStatusOptions.map((option) => [option.value, option.label])),
    [sectionStatusOptions]
  );
  const baseSections = useMemo(
    () => sections.map((section) => sectionOverrides[section.sectionId] ?? section),
    [sectionOverrides, sections]
  );
  const stageStatusOptions = useMemo(
    () => buildStageStatusOptions(sectionStatusOptions, baseSections),
    [baseSections, sectionStatusOptions]
  );
  const targetStatus = sourceStatus ? getNextStageCode(sourceStatus) : null;
  const targetStatusLabel = targetStatus
    ? (statusLabelByCode.get(targetStatus) ?? targetStatus)
    : null;
  const sourceStatusLabel = sourceStatus
    ? (statusLabelByCode.get(sourceStatus) ?? sourceStatus)
    : null;
  const wizardSections = useMemo(
    () => baseSections.map((section) => applyWizardDisplay(section, statusLabelByCode)),
    [baseSections, statusLabelByCode]
  );
  const stageSections = useMemo(
    () =>
      sourceStatus
        ? wizardSections.filter((section) => section.wizardStatusCode === sourceStatus)
        : [],
    [sourceStatus, wizardSections]
  );
  const missingTimeSections = useMemo(
    () => stageSections.filter((section) => !hasMeetingTime(section)),
    [stageSections]
  );
  const missingInstructorSections = useMemo(
    () => stageSections.filter((section) => !hasInstructor(section)),
    [stageSections]
  );
  const includedSections = useMemo(
    () => stageSections.filter((section) => !excludedSectionIds.has(section.sectionId)),
    [excludedSectionIds, stageSections]
  );
  const excludedSections = useMemo(
    () => stageSections.filter((section) => excludedSectionIds.has(section.sectionId)),
    [excludedSectionIds, stageSections]
  );
  const selectedSection =
    selectedSectionDetailState.status === 'success'
      ? selectedSectionDetailState.section
      : (stageSections.find((section) => section.sectionId === selectedSectionId) ?? null);
  const activeStepSections = getStepSections({
    activeStep,
    missingInstructorSections,
    missingTimeSections,
    stageSections,
  });
  const filteredActiveStepSections = useMemo(
    () => filterSections(activeStepSections, tableSearchValues),
    [activeStepSections, tableSearchValues]
  );
  const filteredStageSections = useMemo(
    () => filterSections(stageSections, tableSearchValues),
    [stageSections, tableSearchValues]
  );
  const filteredMissingTimeSections = useMemo(
    () => filterSections(missingTimeSections, tableSearchValues),
    [missingTimeSections, tableSearchValues]
  );
  const filteredMissingInstructorSections = useMemo(
    () => filterSections(missingInstructorSections, tableSearchValues),
    [missingInstructorSections, tableSearchValues]
  );
  const filteredIncludedSections = useMemo(
    () => filterSections(includedSections, tableSearchValues),
    [includedSections, tableSearchValues]
  );
  const filteredExcludedSections = useMemo(
    () => filterSections(excludedSections, tableSearchValues),
    [excludedSections, tableSearchValues]
  );
  const activeStepTotalCount =
    activeStep === 3 ? includedSections.length + excludedSections.length : activeStepSections.length;
  const activeStepFilteredCount =
    activeStep === 3
      ? filteredIncludedSections.length + filteredExcludedSections.length
      : filteredActiveStepSections.length;
  const academicDivisionOptions = useMemo(
    () =>
      buildCodeOptions(baseSections, 'academicDivisionCode', 'academicDivisionName', [
        { value: 'UG', label: 'Undergraduate' },
        { value: 'GR', label: 'Graduate' },
      ]),
    [baseSections]
  );
  const deliveryModeOptions = useMemo(
    () =>
      buildCodeOptions(baseSections, 'deliveryModeCode', 'deliveryModeName', [
        { value: 'IN_PERSON', label: 'In person' },
        { value: 'ONLINE', label: 'Online' },
        { value: 'HYBRID', label: 'Hybrid' },
      ]),
    [baseSections]
  );
  const gradingBasisOptions = useMemo(
    () =>
      buildCodeOptions(baseSections, 'gradingBasisCode', 'gradingBasisName', [
        { value: 'GRADED', label: 'Graded' },
        { value: 'PASS_FAIL', label: 'Pass/Fail' },
      ]),
    [baseSections]
  );
  const creditOptions = useMemo(() => buildCreditOptions(baseSections), [baseSections]);
  const staffOptions = useMemo(() => buildStaffOptions(baseSections), [baseSections]);
  const selectedStaffOptions = useMemo(
    () => (selectedDraft ? buildStaffSelectOptions(staffSearchState.results, selectedDraft) : []),
    [selectedDraft, staffSearchState.results]
  );
  const selectedDetailMutating = selectedSectionMutationState.status === 'saving';
  const stageMoveSaving = stageMoveState.status === 'saving';

  useEffect(() => {
    if (sourceStatus && stageStatusOptions.some((option) => option.value === sourceStatus)) {
      return;
    }

    setSourceStatus(stageStatusOptions[0]?.value ?? null);
  }, [sourceStatus, stageStatusOptions]);

  useEffect(() => {
    if (!selectedSectionId) {
      setSelectedSectionDetailState({ status: 'idle' });
      return;
    }

    if (!stageSections.some((section) => section.sectionId === selectedSectionId)) {
      setSelectedSectionId(null);
    }
  }, [selectedSectionId, stageSections]);

  useEffect(() => {
    if (!selectedSectionId) {
      setSelectedSectionDetailState({ status: 'idle' });
      setSelectedDraft(null);
      setDetailEditing(false);
      setSelectedSectionMutationState({ status: 'idle' });
      return;
    }

    const abortController = new AbortController();

    setSelectedSectionDetailState({ status: 'loading' });
    setSelectedDraft(null);
    setDetailEditing(false);
    setDetailSaveMessage(null);
    setSelectedSectionMutationState({ status: 'idle' });

    void getCourseSectionDetail({
      sectionId: selectedSectionId,
      signal: abortController.signal,
    })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        const preview = mapCourseSectionDetailToPreview(response);
        const nextDraft = buildDraftFromSection(preview);

        setSectionOverrides((current) => ({
          ...current,
          [preview.sectionId]: preview,
        }));
        setSelectedSectionDetailState({
          status: 'success',
          section: preview,
          subTermId: response.subTermId,
        });
        setSelectedDraft(nextDraft);
        setStaffSearchValue(getPrimaryInstructorSearchValue(nextDraft));
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
          setSelectedSectionDetailState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load course section.'),
          });
        }
      });

    return () => {
      abortController.abort();
    };
  }, [selectedSectionId]);

  useEffect(() => {
    if (!detailEditing || staffSearchValue.trim().length < 2) {
      setStaffSearchState({ status: 'idle', results: [] });
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setStaffSearchState((current) => ({
        status: 'loading',
        results: current.results,
      }));

      void searchStaff({
        search: staffSearchValue,
        size: 10,
        signal: abortController.signal,
      })
        .then((response) => {
          if (!abortController.signal.aborted) {
            setStaffSearchState({ status: 'success', results: response.results });
          }
        })
        .catch((error: unknown) => {
          if (!abortController.signal.aborted) {
            setStaffSearchState({
              status: 'error',
              results: [],
              message: getErrorMessage(error, 'Failed to search staff.'),
            });
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [detailEditing, staffSearchValue]);

  function toggleSection(sectionId: number, included: boolean) {
    setStageMoveState({ status: 'idle' });
    setExcludedSectionIds((current) => {
      const next = new Set(current);

      if (included) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }

      return next;
    });
  }

  function setSectionsIncluded(sectionIds: ReadonlyArray<number>, included: boolean) {
    setStageMoveState({ status: 'idle' });
    setExcludedSectionIds((current) => {
      const next = new Set(current);

      sectionIds.forEach((sectionId) => {
        if (included) {
          next.delete(sectionId);
        } else {
          next.add(sectionId);
        }
      });

      return next;
    });
  }

  async function handleSaveSelectedSection() {
    if (
      selectedSectionDetailState.status !== 'success' ||
      !selectedDraft ||
      selectedDetailMutating
    ) {
      return;
    }

    if (selectedSectionDetailState.subTermId === null) {
      setSelectedSectionMutationState({
        status: 'error',
        message: 'Course section sub term is required before saving.',
      });
      return;
    }

    const patchRequest = buildPatchSectionRequest(selectedDraft, selectedSectionDetailState.subTermId);

    if (typeof patchRequest === 'string') {
      setSelectedSectionMutationState({ status: 'error', message: patchRequest });
      return;
    }

    try {
      setSelectedSectionMutationState({ status: 'saving' });
      const response = await patchCourseSection({
        sectionId: selectedSectionDetailState.section.sectionId,
        request: patchRequest,
      });
      const updatedSection = mapCourseSectionDetailToPreview(response);
      const nextDraft = buildDraftFromSection(updatedSection);

      setSectionOverrides((current) => ({
        ...current,
        [updatedSection.sectionId]: updatedSection,
      }));
      setSelectedSectionDetailState({
        status: 'success',
        section: updatedSection,
        subTermId: response.subTermId,
      });
      setSelectedDraft(nextDraft);
      setStaffSearchValue(getPrimaryInstructorSearchValue(nextDraft));
      setDetailEditing(false);
      setSelectedSectionMutationState({ status: 'idle' });
      setDetailSaveMessage(`${updatedSection.sectionCode} was updated.`);
      await onRefreshSections?.();
    } catch (error: unknown) {
      setSelectedSectionMutationState(
        toCourseSectionMutationErrorState(error, 'Failed to update course section.')
      );
    }
  }

  function handleCancelSelectedEdit() {
    if (!selectedSection) {
      return;
    }

    setSelectedDraft(buildDraftFromSection(selectedSection));
    setDetailEditing(false);
    setSelectedSectionMutationState({ status: 'idle' });
  }

  function handleCancelSelectedSection() {
    if (!selectedDraft) {
      return;
    }

    setSelectedDraft((current) => (current ? { ...current, status: 'CANCELLED' } : current));
    setDetailEditing(true);
  }

  async function handleMoveSections() {
    if (
      stageMoveSaving ||
      subTermId === null ||
      sourceStatus === null ||
      targetStatus === null ||
      includedSections.length === 0
    ) {
      return;
    }

    try {
      setStageMoveState({ status: 'saving' });
      const response = await moveCourseSectionsToNextStage({
        request: {
          subTermId,
          sourceStatusCode: sourceStatus,
          targetStatusCode: targetStatus,
          sectionIds: includedSections.map((section) => section.sectionId),
        },
      });

      if (response.blockingIssueCount > 0) {
        setStageMoveState({
          status: 'error',
          message: 'Some sections could not be moved.',
          issues: response.blockingIssues,
        });
        return;
      }

      setStageMoveState({ status: 'idle' });
      if (onStageMoveComplete) {
        onStageMoveComplete(response);
      } else {
        await onRefreshSections?.();
      }
    } catch (error: unknown) {
      setStageMoveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to move course sections.'),
        issues: [],
      });
    }
  }

  function updateSelectedDraft(update: SetStateAction<CourseSectionDraft>) {
    setSelectedDraft((current) => {
      if (!current) {
        return current;
      }

      return typeof update === 'function' ? update(current) : update;
    });
  }

  return (
    <Stack gap={0}>
      <RecordPageSection
        title="Stage Sections"
        description={`Review ${subTermLabel} sections before moving them into the next workflow stage.`}
        action={
          <Group gap="sm" wrap="wrap" justify="flex-end">
            <Select
              label="Current stage"
              data={stageStatusOptions}
              value={sourceStatus}
              w={220}
              disabled={!hasActiveScope || stageStatusOptions.length === 0 || activeStep > 0}
              onChange={(value) => {
                setSourceStatus(value);
                setActiveStep(0);
                setSelectedSectionId(null);
                setStageMoveState({ status: 'idle' });
              }}
            />
            <Button
              variant="default"
              disabled={!hasCourseSectionSearchValues(tableSearchValues)}
              onClick={() => setTableSearchValues(initialCourseSectionSearchValues)}
            >
              Clear table filters
            </Button>
          </Group>
        }
      >
        <Grid.Col span={12}>
          <Stack gap="lg">
            {!hasActiveScope ? (
              <Alert color="gray" title="No course sections loaded">
                Select an offering or view sections from the course offering search before using the
                staging wizard.
              </Alert>
            ) : null}

            {hasActiveScope && stageStatusOptions.length === 0 ? (
              <Alert color="gray" title="No stageable sections">
                The loaded sections do not have a workflow stage that can move forward.
              </Alert>
            ) : null}

            {hasActiveScope && stageStatusOptions.length > 0 ? (
              <>
                <StageWizardHeader
                  includedCount={includedSections.length}
                  sourceStatusLabel={sourceStatusLabel ?? 'Selected stage'}
                  targetStatusLabel={targetStatusLabel ?? 'Next stage'}
                  totalCount={stageSections.length}
                />

                <StageWizardSearch
                  filteredCount={activeStepFilteredCount}
                  hasActiveScope={hasActiveScope}
                  searchValues={tableSearchValues}
                  sectionStatusOptions={sectionStatusOptions}
                  totalCount={activeStepTotalCount}
                  onSearchValuesChange={setTableSearchValues}
                />

                <Stepper active={activeStep} onStepClick={setActiveStep}>
                  <Stepper.Step label="Sections" description="Review stage">
                    <Stack gap="md" mt="lg">
                      <StageSectionTable
                        emptyMessage="No sections are in the selected stage."
                        excludedSectionIds={excludedSectionIds}
                        sections={filteredStageSections}
                        selectedSectionId={selectedSectionId}
                        tableKey="sections"
                        onSectionSelected={setSelectedSectionId}
                        onSetSectionsIncluded={setSectionsIncluded}
                        onToggleSection={toggleSection}
                      />
                    </Stack>
                  </Stepper.Step>

                  <Stepper.Step label="Missing time" description="Review only">
                    <Stack gap="md" mt="lg">
                      <StageSectionTable
                        emptyMessage="Every selected section has a meeting time."
                        excludedSectionIds={excludedSectionIds}
                        sections={filteredMissingTimeSections}
                        selectedSectionId={selectedSectionId}
                        tableKey="missing-time"
                        onSectionSelected={setSelectedSectionId}
                        onSetSectionsIncluded={setSectionsIncluded}
                        onToggleSection={toggleSection}
                      />
                    </Stack>
                  </Stepper.Step>

                  <Stepper.Step label="Missing instructor" description="Review only">
                    <Stack gap="md" mt="lg">
                      <StageSectionTable
                        emptyMessage="Every selected section has an instructor assignment."
                        excludedSectionIds={excludedSectionIds}
                        sections={filteredMissingInstructorSections}
                        selectedSectionId={selectedSectionId}
                        tableKey="missing-instructor"
                        onSectionSelected={setSelectedSectionId}
                        onSetSectionsIncluded={setSectionsIncluded}
                        onToggleSection={toggleSection}
                      />
                    </Stack>
                  </Stepper.Step>

                  <Stepper.Step label="Move review" description="Confirm">
                    <Stack gap="md" mt="lg">
                      <StageWizardFinalReview
                        excludedSectionIds={excludedSectionIds}
                        excludedSections={filteredExcludedSections}
                        includedSections={filteredIncludedSections}
                        selectedSectionId={selectedSectionId}
                        targetStatusLabel={targetStatusLabel ?? 'Next stage'}
                        onSectionSelected={setSelectedSectionId}
                        onSetSectionsIncluded={setSectionsIncluded}
                        onToggleSection={toggleSection}
                      />
                    </Stack>
                  </Stepper.Step>
                </Stepper>

                <Group justify="space-between" wrap="wrap">
                  <Button
                    variant="default"
                    disabled={activeStep === 0}
                    onClick={() => {
                      setActiveStep((current) => Math.max(0, current - 1));
                      setStageMoveState({ status: 'idle' });
                    }}
                  >
                    Back
                  </Button>
                  <Group gap="sm" wrap="wrap">
                    <Text size="sm" c="dimmed">
                      {excludedSections.length} excluded
                    </Text>
                    {activeStep < 3 ? (
                      <Button
                        rightSection={<IconArrowRight size={16} />}
                        onClick={() => {
                          setActiveStep((current) => Math.min(3, current + 1));
                          setStageMoveState({ status: 'idle' });
                        }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        loading={stageMoveSaving}
                        disabled={
                          includedSections.length === 0 ||
                          targetStatus === null ||
                          subTermId === null
                        }
                        onClick={() => void handleMoveSections()}
                      >
                        Move selected to {targetStatusLabel ?? 'next stage'}
                      </Button>
                    )}
                  </Group>
                </Group>

                {stageMoveState.status === 'error' ? (
                  <StageMoveErrorAlert
                    issues={stageMoveState.issues}
                    message={stageMoveState.message}
                  />
                ) : null}
              </>
            ) : null}
          </Stack>
        </Grid.Col>
      </RecordPageSection>

      {selectedSection && selectedDraft ? (
        <>
          <CourseSectionDetailOverviewSection section={selectedSection} />
          <CourseSectionDetailSetupSection
            academicDivisionOptions={academicDivisionOptions}
            canManage
            creditOptions={creditOptions}
            deliveryModeOptions={deliveryModeOptions}
            detailEditing={detailEditing}
            draft={selectedDraft}
            mutationState={selectedSectionMutationState}
            mutating={selectedDetailMutating}
            referencesAreLoading={false}
            section={selectedSection}
            sectionGradingBasisOptions={gradingBasisOptions}
            sectionInstructorRoleOptions={instructorRoleOptions}
            sectionStatusOptions={sectionStatusOptions}
            setDraft={updateSelectedDraft}
            staffLoading={staffSearchState.status === 'loading'}
            staffOptions={selectedStaffOptions.length > 0 ? selectedStaffOptions : staffOptions}
            staffSearchValue={staffSearchValue}
            onCancelEdit={handleCancelSelectedEdit}
            onCancelSection={handleCancelSelectedSection}
            onSaveSection={handleSaveSelectedSection}
            onStaffSearchChange={setStaffSearchValue}
            onStartEdit={() => {
              setDetailEditing(true);
              setDetailSaveMessage(null);
              setSelectedSectionMutationState({ status: 'idle' });
            }}
          />
          {detailSaveMessage ? (
            <RecordPageSection title="Section Save" description="Saved through the course section API.">
              <Grid.Col span={12}>
                <Alert color="blue" title="Section updated">
                  {detailSaveMessage}
                </Alert>
              </Grid.Col>
            </RecordPageSection>
          ) : null}
        </>
      ) : null}

      {selectedSectionDetailState.status === 'loading' ? (
        <RecordPageSection title="Section Details" description="Loading the selected course section.">
          <Grid.Col span={12}>
            <Alert color="blue" title="Loading section detail">
              Loading the selected section before editing.
            </Alert>
          </Grid.Col>
        </RecordPageSection>
      ) : null}

      {selectedSectionDetailState.status === 'error' ? (
        <RecordPageSection title="Section Details" description="The selected course section could not be loaded.">
          <Grid.Col span={12}>
            <Alert color="red" title="Unable to load section">
              {selectedSectionDetailState.message}
            </Alert>
          </Grid.Col>
        </RecordPageSection>
      ) : null}
    </Stack>
  );
}

function StageMoveErrorAlert({
  issues,
  message,
}: {
  issues: ReadonlyArray<CourseSectionStageTransitionIssueResponse>;
  message: string;
}) {
  return (
    <Alert color="red" title="Unable to move sections">
      <Stack gap="xs">
        <Text>{message}</Text>
        {issues.length > 0 ? (
          <Stack gap={4}>
            {issues.map((issue, index) => (
              <Text key={`${issue.sectionId ?? 'general'}-${issue.issueCode}-${index}`} size="sm">
                {issue.sectionCode ? `${issue.sectionCode}: ` : ''}
                {issue.message}
              </Text>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Alert>
  );
}

function StageWizardHeader({
  includedCount,
  sourceStatusLabel,
  targetStatusLabel,
  totalCount,
}: {
  includedCount: number;
  sourceStatusLabel: string;
  targetStatusLabel: string;
  totalCount: number;
}) {
  return (
    <Group justify="space-between" align="flex-end" wrap="wrap">
      <Stack gap={2}>
        <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
          {sourceStatusLabel} to {targetStatusLabel}
        </Text>
        <Title order={4}>
          {includedCount} of {totalCount} sections selected
        </Title>
      </Stack>
      <Badge variant="light" color={includedCount === totalCount ? 'green' : 'yellow'} size="lg">
        {totalCount - includedCount} excluded
      </Badge>
    </Group>
  );
}

function StageWizardSearch({
  filteredCount,
  hasActiveScope,
  searchValues,
  sectionStatusOptions,
  totalCount,
  onSearchValuesChange,
}: {
  filteredCount: number;
  hasActiveScope: boolean;
  searchValues: CourseSectionSearchValues;
  sectionStatusOptions: SelectOption[];
  totalCount: number;
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
}) {
  const hasSearch = hasCourseSectionSearchValues(searchValues);

  return (
    <Stack gap="sm">
      <CourseSectionsFilters
        hasActiveScope={hasActiveScope}
        isSearchScope
        referencesAreLoading={false}
        searchValues={searchValues}
        sectionStatusOptions={sectionStatusOptions}
        onSearchValuesChange={onSearchValuesChange}
      />
      <Group justify="flex-end" gap="sm" wrap="wrap">
        <Text size="sm" c="dimmed">
          {hasSearch ? `${filteredCount} of ${totalCount} matching` : `${totalCount} sections`}
        </Text>
        <Button
          variant="default"
          disabled={!hasSearch}
          onClick={() => onSearchValuesChange(initialCourseSectionSearchValues)}
        >
          Clear search
        </Button>
      </Group>
    </Stack>
  );
}

function StageTableFrame({
  children,
  excludedSectionIds,
  sections,
}: {
  children: ReactNode;
  excludedSectionIds: ReadonlySet<number>;
  sections: ReadonlyArray<WizardSection>;
}) {
  const selectedCount = sections.filter(
    (section) => !excludedSectionIds.has(section.sectionId)
  ).length;

  return (
    <Paper p={0} withBorder radius="md" shadow="none" style={{ overflow: 'hidden' }}>
      <Group justify="space-between" gap="sm" wrap="wrap" px="md" py="sm">
        <Text size="sm" c="dimmed">
          {selectedCount} of {sections.length} selected
        </Text>
      </Group>
      {children}
    </Paper>
  );
}

function StageSectionTable({
  emptyMessage,
  excludedSectionIds,
  sections,
  selectedSectionId,
  tableKey,
  onSectionSelected,
  onSetSectionsIncluded,
  onToggleSection,
}: StageTableProps) {
  const { page, pageSize, pagedSections, setPage, setPageSize, totalPages } =
    usePaginatedSections(sections);
  const visibleSectionIds = pagedSections.map((section) => section.sectionId);
  const visibleSelectedSectionIds = visibleSectionIds.filter(
    (sectionId) => !excludedSectionIds.has(sectionId)
  );
  const allVisibleSelected =
    visibleSectionIds.length > 0 && visibleSelectedSectionIds.length === visibleSectionIds.length;
  const someVisibleSelected = visibleSelectedSectionIds.length > 0 && !allVisibleSelected;

  if (sections.length === 0) {
    return (
      <Alert color="gray" title="Nothing to review">
        {emptyMessage}
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <StageTableFrame
        excludedSectionIds={excludedSectionIds}
        sections={sections}
      >
        <Table.ScrollContainer minWidth={960}>
          <Table horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Checkbox
                    aria-label="Select all visible sections"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={(event) => {
                      onSetSectionsIncluded(visibleSectionIds, event.currentTarget.checked);
                    }}
                  />
                </Table.Th>
                <Table.Th>Course</Table.Th>
                <Table.Th>Section</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Assignments</Table.Th>
                <Table.Th>Meeting Pattern</Table.Th>
                <Table.Th>Room</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pagedSections.map((section) => (
                <StageSectionRow
                  key={`${tableKey}-${section.sectionId}`}
                  excludedSectionIds={excludedSectionIds}
                  section={section}
                  selected={section.sectionId === selectedSectionId}
                  onSectionSelected={onSectionSelected}
                  onToggleSection={onToggleSection}
                />
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </StageTableFrame>

      <StageTablePagination
        page={page}
        pageSize={pageSize}
        totalCount={sections.length}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Stack>
  );
}

function StageWizardFinalReview({
  excludedSectionIds,
  excludedSections,
  includedSections,
  selectedSectionId,
  targetStatusLabel,
  onSectionSelected,
  onSetSectionsIncluded,
  onToggleSection,
}: {
  excludedSectionIds: ReadonlySet<number>;
  excludedSections: WizardSection[];
  includedSections: WizardSection[];
  selectedSectionId: number | null;
  targetStatusLabel: string;
  onSectionSelected: (sectionId: number) => void;
  onSetSectionsIncluded: (sectionIds: ReadonlyArray<number>, included: boolean) => void;
  onToggleSection: (sectionId: number, included: boolean) => void;
}) {
  return (
    <Stack gap="lg">
      <Stack gap="sm">
        <Group justify="space-between" wrap="wrap">
          <Title order={4}>Moving to {targetStatusLabel}</Title>
          <Badge variant="light" color="green">
            {includedSections.length} selected
          </Badge>
        </Group>
        <StageReviewTable
          emptyMessage="No sections are selected to move."
          excludedSectionIds={excludedSectionIds}
          sections={includedSections}
          selectedSectionId={selectedSectionId}
          statusLabel={targetStatusLabel}
          tableKey="included"
          onSectionSelected={onSectionSelected}
          onSetSectionsIncluded={onSetSectionsIncluded}
          onToggleSection={onToggleSection}
        />
      </Stack>

      <Stack gap="sm">
        <Group justify="space-between" wrap="wrap">
          <Title order={4}>Excluded</Title>
          <Badge variant="light" color="yellow">
            {excludedSections.length} excluded
          </Badge>
        </Group>
        <StageReviewTable
          emptyMessage="No sections are excluded."
          excludedSectionIds={excludedSectionIds}
          sections={excludedSections}
          selectedSectionId={selectedSectionId}
          statusLabel="Excluded"
          tableKey="excluded"
          onSectionSelected={onSectionSelected}
          onSetSectionsIncluded={onSetSectionsIncluded}
          onToggleSection={onToggleSection}
        />
      </Stack>
    </Stack>
  );
}

function StageReviewTable({
  emptyMessage,
  excludedSectionIds,
  sections,
  selectedSectionId,
  statusLabel,
  tableKey,
  onSectionSelected,
  onSetSectionsIncluded,
  onToggleSection,
}: StageReviewTableProps) {
  const { page, pageSize, pagedSections, setPage, setPageSize, totalPages } =
    usePaginatedSections(sections);
  const visibleSectionIds = pagedSections.map((section) => section.sectionId);
  const visibleSelectedSectionIds = visibleSectionIds.filter(
    (sectionId) => !excludedSectionIds.has(sectionId)
  );
  const allVisibleSelected =
    visibleSectionIds.length > 0 && visibleSelectedSectionIds.length === visibleSectionIds.length;
  const someVisibleSelected = visibleSelectedSectionIds.length > 0 && !allVisibleSelected;

  if (sections.length === 0) {
    return (
      <Alert color="gray" title="No sections">
        {emptyMessage}
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <StageTableFrame
        excludedSectionIds={excludedSectionIds}
        sections={sections}
      >
        <Table.ScrollContainer minWidth={820}>
          <Table horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Checkbox
                    aria-label="Select all visible review sections"
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    onChange={(event) => {
                      onSetSectionsIncluded(visibleSectionIds, event.currentTarget.checked);
                    }}
                  />
                </Table.Th>
                <Table.Th>Course</Table.Th>
                <Table.Th>Section</Table.Th>
                <Table.Th>Assignments</Table.Th>
                <Table.Th>Meeting Pattern</Table.Th>
                <Table.Th>Review</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pagedSections.map((section) => {
                const included = !excludedSectionIds.has(section.sectionId);
                const selected = section.sectionId === selectedSectionId;

                return (
                  <Table.Tr
                    key={`${tableKey}-${section.sectionId}`}
                    role="button"
                    tabIndex={0}
                    aria-selected={selected}
                    style={{
                      background: selected ? 'var(--mantine-color-blue-0)' : undefined,
                      cursor: 'pointer',
                    }}
                    onClick={() => onSectionSelected(section.sectionId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSectionSelected(section.sectionId);
                      }
                    }}
                  >
                    <Table.Td>
                      <Checkbox
                        aria-label={`Move ${section.sectionCode}`}
                        checked={included}
                        onChange={(event) => {
                          event.stopPropagation();
                          onToggleSection(section.sectionId, event.currentTarget.checked);
                        }}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text fw={700}>{section.courseCode}</Text>
                        <Text size="sm" c="dimmed">
                          {section.courseTitle}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>{section.wizardSectionCode}</Table.Td>
                    <Table.Td>{section.wizardInstructor}</Table.Td>
                    <Table.Td>{section.wizardMeetingPattern}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={statusLabel === 'Excluded' ? 'yellow' : 'green'}>
                        {statusLabel}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </StageTableFrame>

      <StageTablePagination
        page={page}
        pageSize={pageSize}
        totalCount={sections.length}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </Stack>
  );
}

function StageSectionRow({
  excludedSectionIds,
  section,
  selected,
  onSectionSelected,
  onToggleSection,
}: {
  excludedSectionIds: ReadonlySet<number>;
  section: WizardSection;
  selected: boolean;
  onSectionSelected: (sectionId: number) => void;
  onToggleSection: (sectionId: number, included: boolean) => void;
}) {
  const included = !excludedSectionIds.has(section.sectionId);

  return (
    <Table.Tr
      role="button"
      tabIndex={0}
      aria-selected={selected}
      style={{
        background: selected ? 'var(--mantine-color-blue-0)' : undefined,
        cursor: 'pointer',
      }}
      onClick={() => onSectionSelected(section.sectionId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSectionSelected(section.sectionId);
        }
      }}
    >
      <Table.Td>
        <Checkbox
          aria-label={`Move ${section.sectionCode}`}
          checked={included}
          onChange={(event) => {
            event.stopPropagation();
            onToggleSection(section.sectionId, event.currentTarget.checked);
          }}
          onClick={(event) => event.stopPropagation()}
        />
      </Table.Td>
      <Table.Td>
        <Stack gap={0}>
          <Text fw={700}>{section.courseCode}</Text>
          <Text size="sm" c="dimmed">
            {section.courseTitle}
          </Text>
        </Stack>
      </Table.Td>
      <Table.Td>{section.wizardSectionCode}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={section.wizardStatusCode === 'DRAFT' ? 'gray' : 'blue'}>
          {section.wizardStatusName}
        </Badge>
      </Table.Td>
      <Table.Td>{section.wizardInstructor}</Table.Td>
      <Table.Td>{section.wizardMeetingPattern}</Table.Td>
      <Table.Td>{section.wizardRoom}</Table.Td>
    </Table.Tr>
  );
}

function StageTablePagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: string;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: string) => void;
}) {
  return (
    <Group justify="space-between" wrap="wrap">
      <Text size="sm" c="dimmed">
        Showing {totalCount === 0 ? 0 : (page - 1) * Number(pageSize) + 1}-
        {Math.min(page * Number(pageSize), totalCount)} of {totalCount} sections
      </Text>
      <Group gap="sm" wrap="wrap">
        <Select
          label="Page size"
          data={pageSizeOptions}
          value={pageSize}
          w={110}
          onChange={(value) => onPageSizeChange(value ?? '5')}
        />
        <Pagination total={totalPages} value={page} onChange={onPageChange} />
      </Group>
    </Group>
  );
}

function usePaginatedSections(sections: WizardSection[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('5');
  const numericPageSize = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(sections.length / numericPageSize));
  const pagedSections = useMemo(
    () => sections.slice((page - 1) * numericPageSize, page * numericPageSize),
    [numericPageSize, page, sections]
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize, sections]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return { page, pageSize, pagedSections, setPage, setPageSize, totalPages };
}

function buildStageStatusOptions(
  statusOptions: ReadonlyArray<SelectOption>,
  sections: ReadonlyArray<CourseSectionPreview>
): SelectOption[] {
  const statusCodesInSections = new Set(sections.map((section) => section.statusCode));
  const optionsFromReferences = statusOptions.filter(
    (option) => statusCodesInSections.has(option.value) && Boolean(getNextStageCode(option.value))
  );

  if (optionsFromReferences.length > 0) {
    return optionsFromReferences;
  }

  return Array.from(statusCodesInSections)
    .filter((code) => Boolean(getNextStageCode(code)))
    .map((code) => ({ value: code, label: code }));
}

function applyWizardDisplay(
  section: CourseSectionPreview,
  statusLabelByCode: ReadonlyMap<string, string>
): WizardSection {
  return {
    ...section,
    wizardInstructor: section.instructor,
    wizardMeetingPattern: section.meetingPattern,
    wizardRoom: section.room,
    wizardSectionCode: section.sectionCode,
    wizardStatusCode: section.statusCode,
    wizardStatusName: statusLabelByCode.get(section.statusCode) ?? section.statusName,
  };
}

function hasCourseSectionSearchValues(searchValues: CourseSectionSearchValues): boolean {
  return Boolean(
    searchValues.courseCode.trim() ||
      searchValues.sectionCode.trim() ||
      searchValues.instructor.trim() ||
      searchValues.meetingPattern.trim() ||
      searchValues.room.trim() ||
      searchValues.status
  );
}

function buildCreditOptions(sections: ReadonlyArray<CourseSectionPreview>): SelectOption[] {
  const credits = new Set(['1', '2', '3', '4']);

  sections.forEach((section) => {
    if (section.credits !== null) {
      credits.add(String(section.credits));
    }
  });

  return Array.from(credits)
    .sort((left, right) => Number(left) - Number(right))
    .map((credit) => ({ value: credit, label: `${credit} ${credit === '1' ? 'credit' : 'credits'}` }));
}

function buildCodeOptions(
  sections: ReadonlyArray<CourseSectionPreview>,
  codeKey: 'academicDivisionCode' | 'deliveryModeCode' | 'gradingBasisCode',
  nameKey: 'academicDivisionName' | 'deliveryModeName' | 'gradingBasisName',
  fallbackOptions: ReadonlyArray<SelectOption>
): SelectOption[] {
  const options = new Map(fallbackOptions.map((option) => [option.value, option.label]));

  sections.forEach((section) => {
    const code = section[codeKey];
    const name = section[nameKey];

    if (code) {
      options.set(code, name ?? code);
    }
  });

  return Array.from(options, ([value, label]) => ({ value, label }));
}

function buildStaffOptions(sections: ReadonlyArray<CourseSectionPreview>): StaffSelectOption[] {
  const options = new Map<number, StaffSelectOption>();

  sections.forEach((section) => {
    section.instructors.forEach((instructor) => {
      if (instructor.staffId === null) {
        return;
      }

      options.set(instructor.staffId, {
        value: String(instructor.staffId),
        label: instructor.label,
        email: instructor.email,
      });
    });
  });

  [
    { value: '31', label: 'Elrond Peredhel', email: 'elrond@rivendell.me' },
    { value: '34', label: 'Bilbo Baggins', email: 'bilbo@shire.me' },
    { value: '37', label: 'Maria Chen', email: 'maria.chen@msm.edu' },
  ].forEach((option) => options.set(Number(option.value), option));

  return Array.from(options.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function getNextStageCode(statusCode: string): string | null {
  const statusIndex = stageOrder.indexOf(statusCode);

  if (statusIndex < 0 || statusIndex >= stageOrder.length - 1) {
    return null;
  }

  return stageOrder[statusIndex + 1];
}

function hasMeetingTime(section: WizardSection): boolean {
  const hasMeetingRows = section.meetings.some(
    (meeting) => Boolean(meeting.dayOfWeek) && Boolean(meeting.startTime) && Boolean(meeting.endTime)
  );

  if (hasMeetingRows) {
    return true;
  }

  return !emptyStatuses.has(section.wizardMeetingPattern.trim().toLowerCase());
}

function hasInstructor(section: WizardSection): boolean {
  const hasInstructorRows = section.instructors.some((instructor) => instructor.staffId !== null);

  if (hasInstructorRows) {
    return true;
  }

  return !emptyStatuses.has(section.wizardInstructor.trim().toLowerCase());
}

function getStepSections({
  activeStep,
  missingInstructorSections,
  missingTimeSections,
  stageSections,
}: {
  activeStep: number;
  missingInstructorSections: WizardSection[];
  missingTimeSections: WizardSection[];
  stageSections: WizardSection[];
}): WizardSection[] {
  if (activeStep === 1) {
    return missingTimeSections;
  }

  if (activeStep === 2) {
    return missingInstructorSections;
  }

  return stageSections;
}
