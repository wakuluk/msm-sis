import { Alert, Badge, Button, Grid, Group, Stack } from '@mantine/core';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AcademicYearCourseOfferingSearchSection } from '@/components/academic-year/courses/AcademicYearCourseOfferingSearchSection';
import { AcademicYearCoursesActionsSection } from '@/components/academic-year/courses/AcademicYearCoursesActionsSection';
import { AcademicTermInfoSection } from '@/components/academic-year/AcademicTermInfoSection';
import { useAcademicTermCourseSections } from '@/components/academic-year/useAcademicTermCourseSections';
import {
  isConditionalAcademicTermStatus,
  useAcademicTermDetail,
} from '@/components/academic-year/useAcademicTermDetail';
import { CourseSectionsWorkspace } from '@/components/academic-year/courses/CourseSectionsWorkspace';
import type { CourseTermOption } from '@/components/academic-year/courses/academicYearCoursesShared';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { WorkflowStatusStepperSection } from '@/components/status/WorkflowStatusStepperSection';
import { displayValue } from '@/utils/form-values';

type AcademicTermDetailLocationState = {
  academicYearId?: number;
};

export function AcademicTermDetailPage() {
  const { subTermId } = useParams<{ subTermId: string }>();
  const location = useLocation();
  const locationState = (location.state as AcademicTermDetailLocationState | null) ?? null;
  const fallbackAcademicYearId =
    typeof locationState?.academicYearId === 'number' && locationState.academicYearId > 0
      ? locationState.academicYearId
      : null;
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: fallbackAcademicYearId
      ? `/academics/academic-years/${fallbackAcademicYearId}`
      : '/academics/academic-years/search',
  });
  const {
    academicTermStatuses,
    academicTermStatusesError,
    academicTermStatusesLoading,
    beginEdit,
    canSaveChanges,
    cancelEdit,
    detailState,
    form,
    hasPendingMutation,
    isEditing,
    saveAcademicTerm,
    saveError,
    saveInProgress,
    saveSucceeded,
    shiftStatus,
    statusShiftError,
    statusShiftInProgress,
    statusShiftSucceeded,
  } = useAcademicTermDetail(subTermId);
  const {
    courseOfferingsRefreshKey,
    courseSectionAction,
    courseSectionSearchValues,
    handleAddSection,
    handleCancelAddSection,
    handleCourseOfferingsChanged,
    handleViewSearchSections,
    handleViewSections,
    selectedCourseOffering,
    selectedCourseOfferings,
    setCourseSectionSearchValues,
  } = useAcademicTermCourseSections();

  if (detailState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Sub Term Detail"
        description="Loading sub term detail."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Sub Term"
            description="The sub term detail is loading."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading sub term">
                Fetching sub term {subTermId ?? 'unknown'}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page.">
            {fallbackAcademicYearId ? (
              <Button
                component={Link}
                to={`/academics/academic-years/${fallbackAcademicYearId}`}
                variant="default"
              >
                View academic year
              </Button>
            ) : null}
            <Button onClick={handleBack}>
              Back
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
        title="Sub Term Detail"
        description="Sub term detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Sub Term"
            description="The detail page could not load this sub term."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Sub term detail unavailable">
                {detailState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page.">
            {fallbackAcademicYearId ? (
              <Button
                component={Link}
                to={`/academics/academic-years/${fallbackAcademicYearId}`}
                variant="default"
              >
                View academic year
              </Button>
            ) : null}
            <Button onClick={handleBack}>
              Back
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const detail = detailState.academicTerm;
  const academicYearPath = `/academics/academic-years/${detail.academicYearId}`;
  const subTermCourseOptions: ReadonlyArray<CourseTermOption> = [
    {
      value: String(detail.subTermId),
      label: `${detail.name} (${detail.code})`,
    },
  ];
  const initialCourseOfferingSubTermIds: ReadonlyArray<string> = [String(detail.subTermId)];
  const subTermLabel = `${detail.name} (${detail.code})`;

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={detail.name}
      description="Review the sub term configuration, workflow status, and parent academic year."
      badge={
        <Group gap="sm">
          <Badge variant="light" color={detail.active ? 'green' : 'gray'}>
            {detail.active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="light" color="blue">
            {displayValue(detail.subTermStatusName ?? detail.subTermStatusCode)}
          </Badge>
        </Group>
      }
    >
      <Stack gap={0}>
        {saveError ? (
          <RecordPageSection
            title="Save Status"
            description="Resolve the current validation or API error before trying again."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to save sub term changes">
                {saveError}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <WorkflowStatusStepperSection
          title="Sub Term Status"
          description="This tracker shows the configured sub term workflow steps."
          statuses={academicTermStatuses}
          currentStatusCode={detail.subTermStatusCode}
          isLoading={academicTermStatusesLoading}
          loadError={academicTermStatusesError}
          shiftError={statusShiftError}
          shiftSucceeded={statusShiftSucceeded}
          isShifting={statusShiftInProgress}
          disableShiftControls={isEditing}
          isConditionalStatus={isConditionalAcademicTermStatus}
          emptyTitle="No sub term statuses configured"
          emptyMessage="Add sub term statuses before using the status tracker."
          invisibleTitle="No visible sub term statuses"
          invisibleMessage="No sub term statuses are available for this record."
          missingCurrentStatusMessage="Current sub term status is not available on the detail response."
          onStepDown={() => {
            void shiftStatus('DOWN');
          }}
          onStepUp={() => {
            void shiftStatus('UP');
          }}
        />

        <AcademicTermInfoSection
          academicYearPath={academicYearPath}
          canSaveChanges={canSaveChanges}
          detail={detail}
          form={form}
          hasPendingMutation={hasPendingMutation}
          isEditing={isEditing}
          saveInProgress={saveInProgress}
          saveSucceeded={saveSucceeded}
          statusShiftInProgress={statusShiftInProgress}
          onCancelEdit={cancelEdit}
          onEdit={beginEdit}
          onSave={() => {
            void saveAcademicTerm();
          }}
        />

        <AcademicYearCoursesActionsSection
          academicYearId={detail.academicYearId}
          hasValidAcademicYearId={detail.academicYearId > 0}
          canManageCourses={!isEditing}
          termOptions={subTermCourseOptions}
          initialSubTermIds={initialCourseOfferingSubTermIds}
          onCoursesChanged={handleCourseOfferingsChanged}
        >
          <AcademicYearCourseOfferingSearchSection
            academicYearId={detail.academicYearId}
            hasValidAcademicYearId={detail.academicYearId > 0}
            termOptions={subTermCourseOptions}
            reloadKey={courseOfferingsRefreshKey}
            initialSubTermId={String(detail.subTermId)}
            lockSubTermFilter
            onOfferingSelected={handleViewSections}
            onViewSearchSections={handleViewSearchSections}
            sectionSearchValues={courseSectionSearchValues}
            onSectionSearchValuesChange={setCourseSectionSearchValues}
          />
        </AcademicYearCoursesActionsSection>

        <CourseSectionsWorkspace
          activeAction={courseSectionAction}
          selectedOffering={selectedCourseOffering}
          selectedOfferings={selectedCourseOfferings}
          searchValues={courseSectionSearchValues}
          subTermId={detail.subTermId}
          subTermLabel={subTermLabel}
          onAddSection={handleAddSection}
          onCancelAdd={handleCancelAddSection}
          onSearchValuesChange={setCourseSectionSearchValues}
        />

        <RecordPageFooter description="Return to the previous page.">
          <Button component={Link} to={academicYearPath} variant="default">
            View academic year
          </Button>
          <Button onClick={handleBack}>
            Back
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
