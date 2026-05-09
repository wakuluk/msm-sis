// Loads course-section reference data and exposes select-ready option lists.
import { useEffect, useMemo, useState } from 'react';
import { getCourseSectionReferenceOptions } from '@/services/reference-service';
import {
  getErrorMessage,
  getOptionName,
  mapReferenceOptionsToCodeSelectOptions,
} from './courseSectionsWorkspaceUtils';
import type { SectionReferenceState } from './courseSectionsWorkspaceTypes';

type UseCourseSectionReferencesParams = {
  selectedStatusCode: string | null | undefined;
  selectedStatusName: string | null | undefined;
};

export function useCourseSectionReferences({
  selectedStatusCode,
  selectedStatusName,
}: UseCourseSectionReferencesParams) {
  const [referenceState, setReferenceState] = useState<SectionReferenceState>({
    status: 'loading',
  });
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
  const sectionInstructorRoleOptions = useMemo(
    () => mapReferenceOptionsToCodeSelectOptions(referenceOptions?.sectionInstructorRoles ?? []),
    [referenceOptions]
  );
  const resolvedSelectedStatusName =
    selectedStatusName ??
    getOptionName(referenceOptions?.courseSectionStatuses ?? [], selectedStatusCode);
  const referencesAreLoading = referenceState.status === 'loading';

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

  return {
    academicDivisionOptions,
    deliveryModeOptions,
    enrollmentGradingBasisOptions,
    referenceState,
    referencesAreLoading,
    sectionGradingBasisOptions,
    sectionInstructorRoleOptions,
    sectionStatusOptions,
    selectedStatusName: resolvedSelectedStatusName,
  };
}
