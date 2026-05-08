import { Alert, Badge, Button, Grid, Group, Stack } from '@mantine/core';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AcademicYearCoursesSummarySection } from '@/components/academic-year/AcademicYearCoursesSummarySection';
import { AcademicYearInfoSection } from '@/components/academic-year/AcademicYearInfoSection';
import { displayValue } from '@/components/academic-year/academicYearDisplay';
import { AcademicYearTermsSection } from '@/components/academic-year/AcademicYearTermsSection';
import {
  isConditionalAcademicYearStatus,
  useAcademicYearDetail,
} from '@/components/academic-year/useAcademicYearDetail';
import { WorkflowStatusStepperSection } from '@/components/status/WorkflowStatusStepperSection';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import {
  type AcademicYearCreateResponse,
} from '@/services/schemas/academic-years-schemas';

type AcademicYearDetailLocationState = {
  academicYear?: AcademicYearCreateResponse;
  creationNotice?: string;
};

export function AcademicYearDetailPage() {
  const { academicYearId } = useParams<{ academicYearId: string }>();
  const location = useLocation();
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/academic-years/search',
  });
  const { academicYear, creationNotice } =
    (location.state as AcademicYearDetailLocationState | null) ?? {};
  const parsedAcademicYearId = Number(academicYearId);
  const hasValidAcademicYearId = Number.isInteger(parsedAcademicYearId) && parsedAcademicYearId > 0;
  const initialAcademicYear =
    academicYear && academicYear.academicYearId === parsedAcademicYearId ? academicYear : null;
  const {
    academicYearStatuses,
    academicYearStatusesError,
    academicYearStatusesLoading,
    addTermRow,
    addTermsError,
    addTermsForm,
    addTermsInProgress,
    addTermsSucceeded,
    beginEdit,
    canSaveChanges,
    cancelAddingTerms,
    cancelEdit,
    coursesSummaryState,
    currentAcademicYearStatusCode,
    detailState,
    form,
    hasPendingMutation,
    hasTermGroups,
    isAddingTerms,
    isEditing,
    removeTermRow,
    saveAcademicYear,
    saveError,
    saveInProgress,
    saveNewTerms,
    saveSucceeded,
    shiftStatus,
    sortedLegacyTerms,
    sortedTermGroups,
    startAddingTerms,
    statusShiftError,
    statusShiftInProgress,
    statusShiftSucceeded,
  } = useAcademicYearDetail({ academicYearId, initialAcademicYear });

  if (detailState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Academic Year Detail"
        description="Loading academic year detail."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Year"
            description="The academic year detail is loading."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading academic year">
                Fetching academic year {academicYearId ?? 'unknown'}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page or create a new academic year.">
            <Button onClick={handleBack} variant="default">
              Back
            </Button>
            <Button component={Link} to="/academics/academic-years/create">
              Create academic year
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  if (detailState.status === 'error') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Academic Year Detail"
        description="Academic year detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Year"
            description="The detail page could not load this academic year."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Academic year detail unavailable">
                {detailState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page or create a new academic year.">
            <Button onClick={handleBack} variant="default">
              Back
            </Button>
            <Button component={Link} to="/academics/academic-years/create">
              Create academic year
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const detail = detailState.academicYear;

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={detail.name}
      description=""
      badge={
        <Group gap="sm">
          <Badge variant="light" color={detail.active ? 'green' : 'gray'}>
            {detail.active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="light" color={detail.isPublished ? 'blue' : 'gray'}>
            {detail.isPublished ? 'Published' : 'Unpublished'}
          </Badge>
        </Group>
      }
    >
      <Stack gap={0}>
        {creationNotice ? (
          <RecordPageSection
            title="Creation Notice"
            description="The academic year record was created, but follow-up setup needs attention."
          >
            <Grid.Col span={12}>
              <Alert color="yellow" title="Academic year created with follow-up issue">
                {creationNotice}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        {saveError ? (
          <RecordPageSection
            title="Save Status"
            description="Resolve the current validation or API error before trying again."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to save academic year changes">
                {saveError}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <WorkflowStatusStepperSection
          title="Academic Year Status"
          description="This tracker shows the configured academic year workflow steps."
          statuses={academicYearStatuses}
          currentStatusCode={currentAcademicYearStatusCode}
          isLoading={academicYearStatusesLoading}
          loadError={academicYearStatusesError}
          shiftError={statusShiftError}
          shiftSucceeded={statusShiftSucceeded}
          isShifting={statusShiftInProgress}
          disableShiftControls={isEditing || isAddingTerms}
          isConditionalStatus={isConditionalAcademicYearStatus}
          emptyTitle="No academic year statuses configured"
          emptyMessage="Add academic year statuses before using the status tracker."
          invisibleTitle="No visible academic year statuses"
          invisibleMessage="No academic year statuses are available for this record."
          missingCurrentStatusMessage="Current academic year status is not available on the detail response yet."
          onStepDown={() => {
            void shiftStatus('DOWN');
          }}
          onStepUp={() => {
            void shiftStatus('UP');
          }}
        />

        <AcademicYearInfoSection
          addTermsInProgress={addTermsInProgress}
          canSaveChanges={canSaveChanges}
          detail={detail}
          form={form}
          hasPendingMutation={hasPendingMutation}
          isEditing={isEditing}
          saveInProgress={saveInProgress}
          saveSucceeded={saveSucceeded}
          onCancelEdit={cancelEdit}
          onEdit={beginEdit}
          onSave={() => {
            void saveAcademicYear();
          }}
        />

        <AcademicYearCoursesSummarySection
          summary={coursesSummaryState.status === 'success' ? coursesSummaryState.summary : null}
          isLoading={coursesSummaryState.status === 'loading'}
          error={coursesSummaryState.status === 'error' ? coursesSummaryState.message : null}
          action={
            <Button
              component={Link}
              to={`/academics/academic-years/${detail.academicYearId}/courses`}
              variant="light"
            >
              Manage courses
            </Button>
          }
        />

        <AcademicYearTermsSection
          academicYearId={detail.academicYearId}
          hasTermGroups={hasTermGroups}
          sortedTermGroups={sortedTermGroups}
          sortedLegacyTerms={sortedLegacyTerms}
          isEditing={isEditing}
          isAddingTerms={isAddingTerms}
          addTermsInProgress={addTermsInProgress}
          addTermsError={addTermsError}
          addTermsSucceeded={addTermsSucceeded}
          addTermsForm={addTermsForm}
          saveInProgress={saveInProgress}
          onStartAddingTerms={startAddingTerms}
          onAddTermRow={addTermRow}
          onRemoveTermRow={removeTermRow}
          onCancelAddingTerms={cancelAddingTerms}
          onSaveNewTerms={() => {
            void saveNewTerms();
          }}
        />
      </Stack>
    </RecordPageShell>
  );
}
