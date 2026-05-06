import { useState } from 'react';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import {
  initialCourseSectionSearchValues,
  type CourseSectionSearchValues,
} from './courses/CourseSectionsWorkspace';

type CourseSectionAction = 'add' | 'view';

export function useAcademicTermCourseSections() {
  const [courseOfferingsRefreshKey, setCourseOfferingsRefreshKey] = useState(0);
  const [selectedCourseOffering, setSelectedCourseOffering] =
    useState<AcademicYearCourseOfferingSearchResultResponse | null>(null);
  const [selectedCourseOfferings, setSelectedCourseOfferings] =
    useState<ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse> | undefined>(undefined);
  const [courseSectionAction, setCourseSectionAction] = useState<CourseSectionAction>('view');
  const [courseSectionSearchValues, setCourseSectionSearchValues] =
    useState<CourseSectionSearchValues>(initialCourseSectionSearchValues);

  function handleCourseOfferingsChanged() {
    setCourseOfferingsRefreshKey((current) => current + 1);
    setSelectedCourseOffering(null);
    setSelectedCourseOfferings(undefined);
    setCourseSectionAction('view');
    setCourseSectionSearchValues(initialCourseSectionSearchValues);
  }

  function handleViewSections(offering: AcademicYearCourseOfferingSearchResultResponse) {
    setSelectedCourseOffering(offering);
    setSelectedCourseOfferings(undefined);
    setCourseSectionAction('view');
  }

  function handleViewSearchSections(
    offerings: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>
  ) {
    setSelectedCourseOffering(null);
    setSelectedCourseOfferings(offerings);
    setCourseSectionAction('view');
  }

  function handleAddSection() {
    setCourseSectionAction('add');
  }

  function handleCancelAddSection() {
    setCourseSectionAction('view');
  }

  return {
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
  };
}
