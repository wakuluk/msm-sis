// Loads, filters, and pages course sections for the selected offering scope.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourseSectionsForOffering } from '@/services/course-service';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import {
  filterSections,
  getErrorMessage,
  mapCourseSectionResultToPreview,
} from './courseSectionsWorkspaceUtils';
import {
  initialCourseSectionSearchValues,
  type CourseSectionPreview,
  type CourseSectionSearchValues,
} from './courseSectionsWorkspaceTypes';

type CourseSectionListState =
  | { status: 'idle'; sections: CourseSectionPreview[] }
  | { status: 'loading'; sections: CourseSectionPreview[] }
  | { status: 'success'; sections: CourseSectionPreview[] }
  | { status: 'error'; sections: CourseSectionPreview[]; message: string };

type UseCourseSectionListParams = {
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
  searchValues: CourseSectionSearchValues;
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  selectedOfferings?: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>;
  subTermId: number;
};

const courseSectionsPageSize = 10;

export function useCourseSectionList({
  onSearchValuesChange,
  searchValues,
  selectedOffering,
  selectedOfferings,
  subTermId,
}: UseCourseSectionListParams) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [sectionListState, setSectionListState] = useState<CourseSectionListState>({
    status: 'idle',
    sections: [],
  });
  const [sectionListReloadKey, setSectionListReloadKey] = useState(0);
  const isSearchScope = selectedOfferings !== undefined;
  const activeOfferings = useMemo(
    () => selectedOfferings ?? (selectedOffering ? [selectedOffering] : []),
    [selectedOffering, selectedOfferings]
  );
  const allSections = sectionListState.sections;
  const filteredSections = useMemo(
    () => filterSections(allSections, searchValues),
    [allSections, searchValues]
  );
  const totalPages = Math.max(1, Math.ceil(filteredSections.length / courseSectionsPageSize));
  const pagedSections = useMemo(
    () =>
      filteredSections.slice(
        page * courseSectionsPageSize,
        page * courseSectionsPageSize + courseSectionsPageSize
      ),
    [filteredSections, page]
  );
  const hasActiveScope = activeOfferings.length > 0;
  const workspaceDescription = isSearchScope
    ? 'Review sections for all course offerings in the current offering search results.'
    : 'Manage sections for the selected course offering in this sub term.';
  const sectionsAreLoading = sectionListState.status === 'loading';

  useEffect(() => {
    if (activeOfferings.length === 0) {
      setSectionListState({ status: 'idle', sections: [] });
      return;
    }

    const abortController = new AbortController();
    const offeringsById = new Map(
      activeOfferings.map((offering) => [offering.courseOfferingId, offering])
    );

    setSectionListState((current) => ({
      status: 'loading',
      sections: current.sections,
    }));

    Promise.all(
      activeOfferings.map((offering) =>
        getCourseSectionsForOffering({
          courseOfferingId: offering.courseOfferingId,
          subTermId,
          size: 100,
          signal: abortController.signal,
        })
      )
    )
      .then((responses) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSectionListState({
          status: 'success',
          sections: responses.flatMap((response) =>
            response.results.map((section) =>
              mapCourseSectionResultToPreview(
                section,
                offeringsById.get(section.courseOfferingId ?? 0) ?? null
              )
            )
          ),
        });
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSectionListState({
          status: 'error',
          sections: [],
          message: getErrorMessage(error, 'Failed to load course sections.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [activeOfferings, sectionListReloadKey, subTermId]);

  useEffect(() => {
    setPage(0);
  }, [activeOfferings, searchValues]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  function clearSectionFilters() {
    onSearchValuesChange(initialCourseSectionSearchValues);
  }

  function handleSectionSelected(section: CourseSectionPreview) {
    navigate(`/academics/course-sections/${section.sectionId}`);
  }

  function reloadSectionList() {
    setSectionListReloadKey((current) => current + 1);
  }

  return {
    activeOfferings,
    allSections,
    clearSectionFilters,
    filteredSections,
    handleSectionSelected,
    hasActiveScope,
    isSearchScope,
    pagedSections,
    page,
    reloadSectionList,
    sectionListState,
    sectionsAreLoading,
    setPage,
    totalPages,
    workspaceDescription,
  };
}
