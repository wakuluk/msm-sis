import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Grid, Group, Stack } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { useAccessTokenData } from '@/auth/auth-store';
import { CourseSectionDetailOverviewSection } from '@/components/academic-year/courses/CourseSectionDetailOverviewSection';
import { CourseSectionDetailSetupSection } from '@/components/academic-year/courses/CourseSectionDetailSetupSection';
import { CourseSectionDetailStudentsSection } from '@/components/academic-year/courses/CourseSectionDetailStudentsSection';
import {
  buildDraftFromSection,
  getErrorMessage,
  getPrimaryInstructorSearchValue,
  mapCourseSectionDetailToPreview,
  mapReferenceOptionsToCodeSelectOptions,
  toCourseSectionMutationErrorState,
} from '@/components/academic-year/courses/courseSectionsWorkspaceUtils';
import {
  buildPatchSectionRequest,
  buildStaffSelectOptions,
} from '@/components/academic-year/courses/courseSectionRequestBuilders';
import {
  initialCourseSectionDraft,
  type CourseSectionDraft,
  type CourseSectionMutationState,
  type CourseSectionPreview,
  type SelectOption,
} from '@/components/academic-year/courses/courseSectionsWorkspaceTypes';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { PORTAL_ROLES, hasPortalRole } from '@/portal/PortalRoles';
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
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: CourseSectionReferenceOptionsResponse };

type StaffSearchState =
  | { status: 'idle'; results: StaffReferenceOptionResponse[] }
  | { status: 'loading'; results: StaffReferenceOptionResponse[] }
  | { status: 'success'; results: StaffReferenceOptionResponse[] }
  | { status: 'error'; results: StaffReferenceOptionResponse[]; message: string };

function buildSingleCreditOption(section: CourseSectionPreview | null): SelectOption[] {
  if (!section || section.credits === null) {
    return [];
  }

  return [{ value: String(section.credits), label: String(section.credits) }];
}

function buildReadOnlyOption(value: string | null, label: string | null): SelectOption[] {
  if (!value) {
    return [];
  }

  return [{ value, label: label ?? value }];
}

function buildReadOnlyInstructorRoleOptions(section: CourseSectionPreview | null): SelectOption[] {
  if (!section) {
    return [];
  }

  return Array.from(
    new Map(
      section.instructors
        .filter((instructor) => instructor.roleCode)
        .map((instructor) => [
          instructor.roleCode as string,
          {
            value: instructor.roleCode as string,
            label: instructor.roleName ?? instructor.roleCode ?? 'Role',
          },
        ])
    ).values()
  );
}

function mapGradeMarksToSelectOptions(
  gradeMarks: CourseSectionReferenceOptionsResponse['gradeMarks']
): SelectOption[] {
  return gradeMarks.map((gradeMark) => ({
    value: gradeMark.code,
    label: gradeMark.code === gradeMark.name ? gradeMark.code : `${gradeMark.code} - ${gradeMark.name}`,
  }));
}

export function CourseSectionDetailPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const tokenData = useAccessTokenData();
  const canManageCourseSection = hasPortalRole(tokenData?.roles, PORTAL_ROLES.ADMIN);
  const parsedSectionId = Number(sectionId);
  const hasValidSectionId = Number.isInteger(parsedSectionId) && parsedSectionId > 0;
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/academic-years/search',
  });
  const [pageState, setPageState] = useState<CourseSectionDetailPageState>({ status: 'loading' });
  const [referenceState, setReferenceState] = useState<ReferenceState>({ status: 'idle' });
  const [sectionSubTermId, setSectionSubTermId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CourseSectionDraft>(initialCourseSectionDraft);
  const [detailEditing, setDetailEditing] = useState(false);
  const [sectionMutationState, setSectionMutationState] = useState<CourseSectionMutationState>({
    status: 'idle',
  });
  const [staffSearchState, setStaffSearchState] = useState<StaffSearchState>({
    status: 'idle',
    results: [],
  });
  const [staffSearchValue, setStaffSearchValue] = useState('');

  const section = pageState.status === 'success' ? pageState.section : null;
  const referenceOptions = referenceState.status === 'success' ? referenceState.response : null;
  const sectionStatusOptions = useMemo(() => {
    const options = mapReferenceOptionsToCodeSelectOptions(
      referenceOptions?.courseSectionStatuses ?? []
    );

    return options.length > 0
      ? options
      : buildReadOnlyOption(section?.statusCode ?? null, section?.statusName ?? null);
  }, [referenceOptions, section]);
  const academicDivisionOptions = useMemo(
    () => {
      const options = mapReferenceOptionsToCodeSelectOptions(
        referenceOptions?.academicDivisions ?? []
      );

      return options.length > 0
        ? options
        : buildReadOnlyOption(
            section?.academicDivisionCode ?? null,
            section?.academicDivisionName ?? null
          );
    },
    [referenceOptions, section]
  );
  const deliveryModeOptions = useMemo(
    () => {
      const options = mapReferenceOptionsToCodeSelectOptions(referenceOptions?.deliveryModes ?? []);

      return options.length > 0
        ? options
        : buildReadOnlyOption(section?.deliveryModeCode ?? null, section?.deliveryModeName ?? null);
    },
    [referenceOptions, section]
  );
  const sectionGradingBasisOptions = useMemo(
    () => {
      const options = mapReferenceOptionsToCodeSelectOptions(
        (referenceOptions?.gradingBases ?? []).filter(
          (gradingBasis) => gradingBasis.allowedForCourseSections
        )
      );

      return options.length > 0
        ? options
        : buildReadOnlyOption(section?.gradingBasisCode ?? null, section?.gradingBasisName ?? null);
    },
    [referenceOptions, section]
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
  const gradeMarkOptions = useMemo(
    () => mapGradeMarksToSelectOptions(referenceOptions?.gradeMarks ?? []),
    [referenceOptions]
  );
  const gradeTypeOptions = useMemo(
    () =>
      mapReferenceOptionsToCodeSelectOptions(referenceOptions?.studentSectionGradeTypes ?? []),
    [referenceOptions]
  );
  const sectionInstructorRoleOptions = useMemo(
    () => {
      const options = mapReferenceOptionsToCodeSelectOptions(
        referenceOptions?.sectionInstructorRoles ?? []
      );

      return options.length > 0 ? options : buildReadOnlyInstructorRoleOptions(section);
    },
    [referenceOptions, section]
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
  const referencesAreLoading = canManageCourseSection && referenceState.status === 'loading';
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
        const nextDraft = buildDraftFromSection(preview);
        setDraft(nextDraft);
        setStaffSearchValue(getPrimaryInstructorSearchValue(nextDraft));
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
    if (!canManageCourseSection || !detailEditing || staffSearchValue.trim().length < 2) {
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
  }, [canManageCourseSection, detailEditing, staffSearchValue]);

  function handleCancelEdit() {
    if (section) {
      const nextDraft = buildDraftFromSection(section);
      setDraft(nextDraft);
      setStaffSearchValue(getPrimaryInstructorSearchValue(nextDraft));
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
      const nextDraft = buildDraftFromSection(updatedSection);
      setDraft(nextDraft);
      setStaffSearchValue(getPrimaryInstructorSearchValue(nextDraft));
      setDetailEditing(false);
      setSectionMutationState({ status: 'idle' });
    } catch (error: unknown) {
      setSectionMutationState(
        toCourseSectionMutationErrorState(error, 'Failed to update course section.')
      );
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
      const nextDraft = buildDraftFromSection(updatedSection);
      setDraft(nextDraft);
      setStaffSearchValue(getPrimaryInstructorSearchValue(nextDraft));
      setDetailEditing(false);
      setSectionMutationState({ status: 'idle' });
    } catch (error: unknown) {
      setSectionMutationState(
        toCourseSectionMutationErrorState(error, 'Failed to cancel course section.')
      );
    }
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Course Section"
      title={pageTitle}
      description={
        canManageCourseSection
          ? 'Manage section details, roster, registration state, and student enrollment work.'
          : 'Review read-only section details, schedule, and instructor assignments.'
      }
      badge={
        <Group gap="sm" wrap="wrap">
          <Badge variant="light" size="lg" color={canManageCourseSection ? 'gray' : 'blue'}>
            {canManageCourseSection ? 'Admin' : 'Read only'}
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

        {canManageCourseSection && referenceState.status === 'error' ? (
          <RecordPageSection title="Reference Data" description="Some course section options could not be loaded.">
            <Alert color="red" title="Unable to load reference data">
              {referenceState.message}
            </Alert>
          </RecordPageSection>
        ) : null}

        {section ? (
          <>
            <CourseSectionDetailOverviewSection section={section} />

            <CourseSectionDetailSetupSection
              academicDivisionOptions={academicDivisionOptions}
              canManage={canManageCourseSection}
              creditOptions={creditOptions}
              deliveryModeOptions={deliveryModeOptions}
              detailEditing={canManageCourseSection && detailEditing}
              draft={draft}
              mutationState={sectionMutationState}
              mutating={mutating}
              referencesAreLoading={referencesAreLoading}
              section={section}
              sectionGradingBasisOptions={sectionGradingBasisOptions}
              sectionInstructorRoleOptions={sectionInstructorRoleOptions}
              sectionStatusOptions={sectionStatusOptions}
              setDraft={setDraft}
              staffLoading={staffSearchState.status === 'loading'}
              staffOptions={staffOptions}
              staffSearchValue={staffSearchValue}
              onCancelEdit={handleCancelEdit}
              onCancelSection={handleCancelSection}
              onSaveSection={handleSaveSection}
              onStaffSearchChange={setStaffSearchValue}
              onStartEdit={() => {
                setDetailEditing(true);
                setSectionMutationState({ status: 'idle' });
              }}
            />

            <CourseSectionDetailStudentsSection
              canManage={canManageCourseSection}
              enrollmentGradingBasisOptions={enrollmentGradingBasisOptions}
              enrollmentStatusOptions={enrollmentStatusOptions}
              gradeMarkOptions={gradeMarkOptions}
              gradeTypeOptions={gradeTypeOptions}
              section={section}
            />
          </>
        ) : null}

        <RecordPageFooter description="Return to the previous schedule or course workspace.">
          <Button variant="default" onClick={handleBack}>
            Back
          </Button>
          {canManageCourseSection ? (
            <Button component={Link} to="/academics/academic-years/search" variant="light">
              Academic years
            </Button>
          ) : null}
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
