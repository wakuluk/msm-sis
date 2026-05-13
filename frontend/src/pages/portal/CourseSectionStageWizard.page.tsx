import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Grid, Group, Stack } from '@mantine/core';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CourseSectionStageWizard } from '@/components/academic-year/courses/CourseSectionStageWizard';
import {
  getErrorMessage,
  mapCourseSectionStagingResultToPreview,
  mapReferenceOptionsToCodeSelectOptions,
} from '@/components/academic-year/courses/courseSectionsWorkspaceUtils';
import type {
  CourseSectionPreview,
  SelectOption,
} from '@/components/academic-year/courses/courseSectionsWorkspaceTypes';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { getCourseSectionStageSections } from '@/services/course-service';
import { getCourseSectionReferenceOptions } from '@/services/reference-service';

type StagingListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; sections: CourseSectionPreview[] };

type ReferenceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; sectionStatusOptions: SelectOption[] };

export function CourseSectionStageWizardPage() {
  const { subTermId } = useParams<{ subTermId: string }>();
  const navigate = useNavigate();
  const parsedSubTermId = Number(subTermId);
  const hasValidSubTermId = Number.isInteger(parsedSubTermId) && parsedSubTermId > 0;
  const subTermPath = `/academics/academic-sub-term/${subTermId ?? ''}`;
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: subTermId ? subTermPath : '/academics/academic-years/search',
  });
  const [stagingListState, setStagingListState] = useState<StagingListState>({ status: 'idle' });
  const [referenceState, setReferenceState] = useState<ReferenceState>({ status: 'loading' });
  const sections = stagingListState.status === 'success' ? stagingListState.sections : [];
  const sectionStatusOptions = useMemo(
    () => (referenceState.status === 'success' ? referenceState.sectionStatusOptions : []),
    [referenceState]
  );
  const pageDescription = hasValidSubTermId
    ? 'Review sections in a selected stage before moving them forward.'
    : 'Choose a sub term before staging course sections.';

  const loadStagingSections = useCallback(
    async (signal?: AbortSignal) => {
      if (!hasValidSubTermId) {
        setStagingListState({ status: 'error', message: 'Academic sub term id is invalid.' });
        return;
      }

      setStagingListState({ status: 'loading' });
      const response = await getCourseSectionStageSections({
        subTermId: parsedSubTermId,
        signal,
      });

      if (signal?.aborted) {
        return;
      }

      setStagingListState({
        status: 'success',
        sections: response.results.map(mapCourseSectionStagingResultToPreview),
      });
    },
    [hasValidSubTermId, parsedSubTermId]
  );

  useEffect(() => {
    let cancelled = false;

    setReferenceState({ status: 'loading' });
    void getCourseSectionReferenceOptions()
      .then((response) => {
        if (!cancelled) {
          setReferenceState({
            status: 'success',
            sectionStatusOptions: mapReferenceOptionsToCodeSelectOptions(
              response.courseSectionStatuses
            ),
          });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReferenceState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load course section reference options.'),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    void loadStagingSections(abortController.signal).catch((error: unknown) => {
      if (!abortController.signal.aborted) {
        setStagingListState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load staged course sections.'),
        });
      }
    });

    return () => {
      abortController.abort();
    };
  }, [loadStagingSections]);

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title="Stage Course Sections"
      description={pageDescription}
      badge={
        <Group gap="sm">
          <Badge variant="light" color="blue">
            Sub term {subTermId ?? '-'}
          </Badge>
        </Group>
      }
    >
      <Stack gap={0}>
        {referenceState.status === 'error' ? (
          <RecordPageSection
            title="Reference Data"
            description="Course section status options could not be loaded."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to load reference options">
                {referenceState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        {stagingListState.status === 'error' ? (
          <RecordPageSection
            title="Course Sections"
            description="The staging list could not be loaded."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to load staging list">
                {stagingListState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <CourseSectionStageWizard
          hasActiveScope={
            hasValidSubTermId &&
            stagingListState.status === 'success' &&
            referenceState.status === 'success'
          }
          onRefreshSections={() => loadStagingSections()}
          onStageMoveComplete={() => navigate(subTermPath)}
          sectionStatusOptions={sectionStatusOptions}
          sections={sections}
          subTermId={hasValidSubTermId ? parsedSubTermId : null}
          subTermLabel={subTermId ? `sub term ${subTermId}` : 'the selected sub term'}
        />

        <RecordPageFooter description="Return to the sub term detail page.">
          {subTermId ? (
            <Button component={Link} to={subTermPath} variant="default">
              View sub term
            </Button>
          ) : null}
          <Button onClick={handleBack}>Back</Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
