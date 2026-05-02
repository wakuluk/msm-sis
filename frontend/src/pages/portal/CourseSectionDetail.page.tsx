import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Grid, Group, Stack } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { CourseSectionAcademicFields } from '@/components/academic-year/courses/CourseSectionAcademicFields';
import { CourseSectionIdentityFields } from '@/components/academic-year/courses/CourseSectionIdentityFields';
import { CourseSectionRegistrationFields } from '@/components/academic-year/courses/CourseSectionRegistrationFields';
import { CourseSectionScheduleFields } from '@/components/academic-year/courses/CourseSectionScheduleFields';
import { CourseSectionStudentsPanel } from '@/components/academic-year/courses/CourseSectionStudentsPanel';
import {
  buildDraftFromSection,
  getErrorMessage,
  mapCourseSectionDetailToPreview,
  mapReferenceOptionsToCodeSelectOptions,
} from '@/components/academic-year/courses/courseSectionsWorkspaceUtils';
import {
  buildPatchSectionRequest,
  buildStaffSelectOptions,
} from '@/components/academic-year/courses/courseSectionRequestBuilders';
import {
  initialCourseSectionDraft,
  type CourseSectionDraft,
  type CourseSectionPreview,
  type SelectOption,
} from '@/components/academic-year/courses/courseSectionsWorkspaceTypes';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { getCourseSectionDetail, patchCourseSection } from '@/services/course-service';
import { getCourseSectionReferenceOptions } from '@/services/reference-service';
import type { CourseSectionReferenceOptionsResponse } from '@/services/schemas/reference-schemas';
import type { StaffReferenceOptionResponse } from '@/services/schemas/staff-schemas';
import { searchStaff } from '@/services/staff-service';

type CourseSectionDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; section: CourseSectionPreview };

type ReferenceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: CourseSectionReferenceOptionsResponse };

type StaffSearchState =
  | { status: 'idle'; results: StaffReferenceOptionResponse[] }
  | { status: 'loading'; results: StaffReferenceOptionResponse[] }
  | { status: 'success'; results: StaffReferenceOptionResponse[] }
  | { status: 'error'; results: StaffReferenceOptionResponse[]; message: string };

type SectionMutationState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

const readableDisabledInputStyles = {
  input: {
    backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
};
const readableDisabledSwitchStyles = {
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
  description: {
    opacity: 1,
  },
  track: {
    opacity: 1,
  },
};
const readableDisabledCheckboxStyles = {
  input: {
    opacity: 1,
  },
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
};

function buildSingleCreditOption(section: CourseSectionPreview | null): SelectOption[] {
  if (!section || section.credits === null) {
    return [];
  }

  return [{ value: String(section.credits), label: String(section.credits) }];
}

export function CourseSectionDetailPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const parsedSectionId = Number(sectionId);
  const hasValidSectionId = Number.isInteger(parsedSectionId) && parsedSectionId > 0;
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/academic-years/search',
  });
  const [pageState, setPageState] = useState<CourseSectionDetailPageState>({ status: 'loading' });
  const [referenceState, setReferenceState] = useState<ReferenceState>({ status: 'loading' });
  const [sectionSubTermId, setSectionSubTermId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CourseSectionDraft>(initialCourseSectionDraft);
  const [detailEditing, setDetailEditing] = useState(false);
  const [sectionMutationState, setSectionMutationState] = useState<SectionMutationState>({
    status: 'idle',
  });
  const [staffSearchState, setStaffSearchState] = useState<StaffSearchState>({
    status: 'idle',
    results: [],
  });
  const [staffSearchValue, setStaffSearchValue] = useState('');

  const section = pageState.status === 'success' ? pageState.section : null;
  const referenceOptions = referenceState.status === 'success' ? referenceState.response : null;
  const sectionStatusOptions = useMemo(
    () => mapReferenceOptionsToCodeSelectOptions(referenceOptions?.courseSectionStatuses ?? []),
    [referenceOptions]
  );
  const academicDivisionOptions = useMemo(
    () => mapReferenceOptionsToCodeSelectOptions(referenceOptions?.academicDivisions ?? []),
    [referenceOptions]
  );
  const deliveryModeOptions = useMemo(
    () => mapReferenceOptionsToCodeSelectOptions(referenceOptions?.deliveryModes ?? []),
    [referenceOptions]
  );
  const sectionGradingBasisOptions = useMemo(
    () =>
      mapReferenceOptionsToCodeSelectOptions(
        (referenceOptions?.gradingBases ?? []).filter(
          (gradingBasis) => gradingBasis.allowedForCourseSections
        )
      ),
    [referenceOptions]
  );
  const enrollmentGradingBasisOptions = useMemo(
    () =>
      mapReferenceOptionsToCodeSelectOptions(
        (referenceOptions?.gradingBases ?? []).filter(
          (gradingBasis) => gradingBasis.allowedForStudentEnrollments
        )
      ),
    [referenceOptions]
  );
  const enrollmentStatusOptions = useMemo(
    () =>
      mapReferenceOptionsToCodeSelectOptions(
        referenceOptions?.studentSectionEnrollmentStatuses ?? []
      ),
    [referenceOptions]
  );
  const creditOptions = useMemo(() => buildSingleCreditOption(section), [section]);
  const staffOptions = useMemo(
    () => buildStaffSelectOptions(staffSearchState.results, draft),
    [draft, staffSearchState.results]
  );
  const referencesAreLoading = referenceState.status === 'loading';
  const fieldsDisabled = !detailEditing;
  const readOnlyInputStyles = fieldsDisabled ? readableDisabledInputStyles : undefined;
  const readOnlySwitchStyles = fieldsDisabled ? readableDisabledSwitchStyles : undefined;
  const readOnlyCheckboxStyles = fieldsDisabled ? readableDisabledCheckboxStyles : undefined;
  const mutating = sectionMutationState.status === 'saving';
  const pageTitle = section
    ? `${section.courseCode} Section ${section.sectionCode}`
    : 'Course Section';

  useEffect(() => {
    if (!hasValidSectionId) {
      setPageState({ status: 'error', message: 'Course section id is invalid.' });
      return;
    }

    const abortController = new AbortController();
    setPageState({ status: 'loading' });

    void getCourseSectionDetail({
      sectionId: parsedSectionId,
      signal: abortController.signal,
    })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        const preview = mapCourseSectionDetailToPreview(response);
        setPageState({ status: 'success', section: preview });
        setSectionSubTermId(response.subTermId);
        setDraft(buildDraftFromSection(preview));
        setStaffSearchValue(preview.instructor === 'Unassigned' ? '' : preview.instructor);
        setDetailEditing(false);
        setSectionMutationState({ status: 'idle' });
      })
      .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
          setPageState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load course section.'),
          });
        }
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidSectionId, parsedSectionId]);

  useEffect(() => {
    let cancelled = false;
    setReferenceState({ status: 'loading' });

    void getCourseSectionReferenceOptions()
      .then((response) => {
        if (!cancelled) {
          setReferenceState({ status: 'success', response });
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

  function handleCancelEdit() {
    if (section) {
      setDraft(buildDraftFromSection(section));
      setStaffSearchValue(section.instructor === 'Unassigned' ? '' : section.instructor);
    }

    setDetailEditing(false);
    setSectionMutationState({ status: 'idle' });
  }

  async function handleSaveSection() {
    if (!section || sectionSubTermId === null || mutating) {
      return;
    }

    const patchRequest = buildPatchSectionRequest(draft, sectionSubTermId);

    if (typeof patchRequest === 'string') {
      setSectionMutationState({ status: 'error', message: patchRequest });
      return;
    }

    try {
      setSectionMutationState({ status: 'saving' });
      const response = await patchCourseSection({
        sectionId: section.sectionId,
        request: patchRequest,
      });
      const updatedSection = mapCourseSectionDetailToPreview(response);

      setPageState({ status: 'success', section: updatedSection });
      setSectionSubTermId(response.subTermId);
      setDraft(buildDraftFromSection(updatedSection));
      setStaffSearchValue(
        updatedSection.instructor === 'Unassigned' ? '' : updatedSection.instructor
      );
      setDetailEditing(false);
      setSectionMutationState({ status: 'idle' });
    } catch (error: unknown) {
      setSectionMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update course section.'),
      });
    }
  }

  async function handleCancelSection() {
    if (!section || mutating) {
      return;
    }

    try {
      setSectionMutationState({ status: 'saving' });
      const response = await patchCourseSection({
        sectionId: section.sectionId,
        request: {
          statusCode: 'CANCELLED',
        },
      });
      const updatedSection = mapCourseSectionDetailToPreview(response);

      setPageState({ status: 'success', section: updatedSection });
      setSectionSubTermId(response.subTermId);
      setDraft(buildDraftFromSection(updatedSection));
      setStaffSearchValue(
        updatedSection.instructor === 'Unassigned' ? '' : updatedSection.instructor
      );
      setDetailEditing(false);
      setSectionMutationState({ status: 'idle' });
    } catch (error: unknown) {
      setSectionMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to cancel course section.'),
      });
    }
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Course Section"
      title={pageTitle}
      description="Manage section details, roster, registration state, and student enrollment work."
      badge={
        <Group gap="sm" wrap="wrap">
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
          {section ? (
            <Badge variant="light" size="lg" color={section.statusCode === 'DRAFT' ? 'gray' : 'green'}>
              {section.statusName}
            </Badge>
          ) : null}
        </Group>
      }
    >
      <Stack gap={0}>
        {pageState.status === 'error' ? (
          <RecordPageSection title="Course Section" description="The course section could not be loaded.">
            <Alert color="red" title="Unable to load course section">
              {pageState.message}
            </Alert>
          </RecordPageSection>
        ) : null}

        {referenceState.status === 'error' ? (
          <RecordPageSection title="Reference Data" description="Some course section options could not be loaded.">
            <Alert color="red" title="Unable to load reference data">
              {referenceState.message}
            </Alert>
          </RecordPageSection>
        ) : null}

        {section ? (
          <>
            <RecordPageSection
              title="Section Overview"
              description="This page is scoped to one course section."
            >
              <ReadOnlyField label="Course" value={section.courseCode} span={{ base: 12, md: 3 }} />
              <ReadOnlyField label="Title" value={section.courseTitle} span={{ base: 12, md: 6 }} />
              <ReadOnlyField label="Instructor" value={section.instructor} span={{ base: 12, md: 3 }} />
            </RecordPageSection>

            <RecordPageSection
              title="Section Details"
              description="Review and update the section setup."
              action={
                <Group gap="sm" wrap="wrap" justify="flex-end">
                  {detailEditing ? (
                    <>
                      <Button variant="default" onClick={handleCancelEdit}>
                        Cancel edit
                      </Button>
                      <Button loading={mutating} onClick={handleSaveSection}>
                        Save changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="default"
                        onClick={() => {
                          setDetailEditing(true);
                          setSectionMutationState({ status: 'idle' });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="default"
                        loading={mutating}
                        disabled={section.statusCode === 'CANCELLED'}
                        onClick={handleCancelSection}
                      >
                        Cancel section
                      </Button>
                    </>
                  )}
                </Group>
              }
            >
              <Grid.Col span={12}>
                <Stack gap="lg">
                  <CourseSectionIdentityFields
                    draft={draft}
                    fieldsDisabled={fieldsDisabled}
                    readOnlyInputStyles={readOnlyInputStyles}
                    readOnlySwitchStyles={readOnlySwitchStyles}
                    referencesAreLoading={referencesAreLoading}
                    sectionStatusOptions={sectionStatusOptions}
                    setDraft={setDraft}
                  />
                  <CourseSectionAcademicFields
                    academicDivisionOptions={academicDivisionOptions}
                    creditOptions={creditOptions}
                    draft={draft}
                    fieldsDisabled={fieldsDisabled}
                    gradingBasisOptions={sectionGradingBasisOptions}
                    readOnlyInputStyles={readOnlyInputStyles}
                    referencesAreLoading={referencesAreLoading}
                    staffLoading={staffSearchState.status === 'loading'}
                    staffOptions={staffOptions}
                    staffSearchValue={staffSearchValue}
                    setDraft={setDraft}
                    onStaffSearchChange={setStaffSearchValue}
                  />
                  <CourseSectionScheduleFields
                    deliveryModeOptions={deliveryModeOptions}
                    draft={draft}
                    fieldsDisabled={fieldsDisabled}
                    readOnlyCheckboxStyles={readOnlyCheckboxStyles}
                    readOnlyInputStyles={readOnlyInputStyles}
                    readOnlySwitchStyles={readOnlySwitchStyles}
                    referencesAreLoading={referencesAreLoading}
                    setDraft={setDraft}
                  />
                  <CourseSectionRegistrationFields
                    draft={draft}
                    fieldsDisabled={fieldsDisabled}
                    readOnlySwitchStyles={readOnlySwitchStyles}
                    setDraft={setDraft}
                  />
                  {sectionMutationState.status === 'error' ? (
                    <Alert color="red" title="Unable to update course section">
                      {sectionMutationState.message}
                    </Alert>
                  ) : null}
                </Stack>
              </Grid.Col>
            </RecordPageSection>

            <RecordPageSection
              title="Students"
              description="Manage students enrolled or waitlisted in this course section."
            >
              <Grid.Col span={12}>
                <CourseSectionStudentsPanel
                  selectedSection={section}
                  gradingBasisOptions={enrollmentGradingBasisOptions}
                  enrollmentStatusOptions={enrollmentStatusOptions}
                />
              </Grid.Col>
            </RecordPageSection>
          </>
        ) : null}

        <RecordPageFooter description="Return to the previous course or term workspace.">
          <Button variant="default" onClick={handleBack}>
            Back
          </Button>
          <Button component={Link} to="/academics/academic-years/search" variant="light">
            Academic years
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
