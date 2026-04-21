import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import type {
  CatalogResultsView,
  CatalogSearchResultsState,
  CourseOfferingDetailState,
} from '@/components/catalog/CatalogSearchResultsSection';
import {
  filterAcademicSubjectsByDepartment,
  filterAcademicTermsByAcademicYear,
  hasCourseOfferingSearchValues,
  mapCatalogAcademicYearOptionsToSelectOptions,
  mapCatalogReferenceOptionsToSelectOptions,
  mapAcademicSubjectOptionsToSelectOptions,
  mapAcademicTermOptionsToSelectOptions,
} from '@/services/catalog-search-helpers';
import {
  getAdvancedCatalogSearchReferenceOptions,
  getPublicCatalogSearchReferenceOptions,
} from '@/services/catalog-reference-service';
import {
  getAdvancedCourseOfferingById,
  getPublicCourseOfferingById,
  searchAdvancedCourseOfferings,
  searchPublicCourseOfferings,
} from '@/services/catalog-service';
import {
  defaultCourseOfferingSearchSize,
  defaultCourseOfferingSortBy,
  defaultCourseOfferingSortDirection,
  type CourseOfferingSearchSize,
} from '@/services/course-offering-search-config';
import {
  initialCourseOfferingSearchFilters,
  type CourseOfferingSearchFilters,
  type CourseOfferingSearchResultResponse,
  type CourseOfferingSearchSortBy,
  type CourseOfferingSortDirection,
} from '@/services/schemas/catalog-schemas';
import type { CatalogSearchReferenceOptionsResponse } from '@/services/schemas/reference-schemas';

export type CatalogSearchVariant = 'public' | 'advanced';

type CatalogReferenceOptionsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: CatalogSearchReferenceOptionsResponse };

type SelectOption = {
  value: string;
  label: string;
};

const emptyCourseOfferingResults: CourseOfferingSearchResultResponse[] = [];
const standardResultsColumnVisibility = {
  offeringStatusName: false,
  subjectCode: false,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to load catalog search options.';
}

type UseCatalogSearchPageOptions = {
  variant: CatalogSearchVariant;
};

type AppliedAdvancedFilters = {
  offeringStatusCodes: string[];
  termStatusCodes: string[];
  includeInactive: boolean;
  isPublished?: boolean;
};

export function useCatalogSearchPage({ variant }: UseCatalogSearchPageOptions) {
  const loadReferenceOptions =
    variant === 'advanced'
      ? getAdvancedCatalogSearchReferenceOptions
      : getPublicCatalogSearchReferenceOptions;
  const runCourseOfferingSearch =
    variant === 'advanced' ? searchAdvancedCourseOfferings : searchPublicCourseOfferings;
  const loadCourseOfferingDetail =
    variant === 'advanced' ? getAdvancedCourseOfferingById : getPublicCourseOfferingById;

  const form = useForm<CourseOfferingSearchFilters>({
    initialValues: initialCourseOfferingSearchFilters,
  });
  const [referenceOptionsState, setReferenceOptionsState] = useState<CatalogReferenceOptionsState>({
    status: 'loading',
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState<CourseOfferingSearchSize>(defaultCourseOfferingSearchSize);
  const [sortBy, setSortBy] = useState<CourseOfferingSearchSortBy>(defaultCourseOfferingSortBy);
  const [sortDirection, setSortDirection] = useState<CourseOfferingSortDirection>(
    defaultCourseOfferingSortDirection
  );
  const [appliedFilters, setAppliedFilters] = useState<CourseOfferingSearchFilters | null>(null);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] =
    useState<AppliedAdvancedFilters | null>(null);
  const [searchResultsState, setSearchResultsState] = useState<CatalogSearchResultsState>({
    status: 'idle',
  });
  const [selectedOfferingStatusCodes, setSelectedOfferingStatusCodes] = useState<string[]>([]);
  const [selectedTermStatusCodes, setSelectedTermStatusCodes] = useState<string[]>([]);
  const [includeInactive, setIncludeInactive] = useState(variant === 'advanced');
  const [publishedOnly, setPublishedOnly] = useState(variant === 'advanced');
  const [resultsView, setResultsView] = useState<CatalogResultsView>('standard');
  const [expandedCourseOfferingId, setExpandedCourseOfferingId] = useState<number | null>(null);
  const [detailStateByCourseOfferingId, setDetailStateByCourseOfferingId] = useState<
    Record<number, CourseOfferingDetailState>
  >({});

  useEffect(() => {
    let isMounted = true;

    void loadReferenceOptions()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setReferenceOptionsState({
          status: 'success',
          response,
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setReferenceOptionsState({
          status: 'error',
          message: getErrorMessage(error),
        });
      });

    return () => {
      isMounted = false;
    };
  }, [loadReferenceOptions]);

  useEffect(() => {
    if (!appliedFilters) {
      setSearchResultsState({ status: 'idle' });
      return;
    }

    const abortController = new AbortController();
    setSearchResultsState({ status: 'loading' });

    void (async () => {
      try {
        const response = await runCourseOfferingSearch({
          filters: appliedFilters,
          offeringStatusCodes:
            variant === 'advanced' ? appliedAdvancedFilters?.offeringStatusCodes : undefined,
          termStatusCodes:
            variant === 'advanced' ? appliedAdvancedFilters?.termStatusCodes : undefined,
          includeInactive:
            variant === 'advanced' ? appliedAdvancedFilters?.includeInactive : undefined,
          isPublished: variant === 'advanced' ? appliedAdvancedFilters?.isPublished : undefined,
          page,
          size,
          sortBy,
          sortDirection,
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          return;
        }

        setSearchResultsState(
          response.results.length === 0
            ? { status: 'empty', response }
            : { status: 'success', response }
        );
      } catch (error: unknown) {
        if (abortController.signal.aborted) {
          return;
        }

        setSearchResultsState({
          status: 'error',
          message: getErrorMessage(error),
        });
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [
    appliedAdvancedFilters,
    appliedFilters,
    page,
    runCourseOfferingSearch,
    size,
    sortBy,
    sortDirection,
    variant,
  ]);

  useEffect(() => {
    if (referenceOptionsState.status !== 'success') {
      return;
    }

    const matchingTermStillAvailable = referenceOptionsState.response.terms.some(
      (term) =>
        term.code === form.values.termCode &&
        (!form.values.academicYearCode || term.academicYearCode === form.values.academicYearCode)
    );

    if (form.values.termCode && !matchingTermStillAvailable) {
      form.setFieldValue('termCode', null);
    }

    const matchingSubjectStillAvailable = referenceOptionsState.response.subjects.some(
      (subject) =>
        subject.code === form.values.subjectCode &&
        (!form.values.departmentCode || subject.departmentCode === form.values.departmentCode)
    );

    if (form.values.subjectCode && !matchingSubjectStillAvailable) {
      form.setFieldValue('subjectCode', null);
    }
  }, [
    form,
    form.values.academicYearCode,
    form.values.departmentCode,
    form.values.subjectCode,
    form.values.termCode,
    referenceOptionsState,
  ]);

  const hasLoadedReferenceOptions = referenceOptionsState.status === 'success';
  const isLoadingReferenceOptions = referenceOptionsState.status === 'loading';
  const hasSearchValues =
    hasCourseOfferingSearchValues(form.values) ||
    selectedOfferingStatusCodes.length > 0 ||
    selectedTermStatusCodes.length > 0 ||
    (variant === 'advanced' && (includeInactive !== true || publishedOnly !== true));
  const isSearching = searchResultsState.status === 'loading';

  const academicYearOptions: SelectOption[] = hasLoadedReferenceOptions
    ? mapCatalogAcademicYearOptionsToSelectOptions(referenceOptionsState.response.academicYears)
    : [];

  const departmentOptions: SelectOption[] = hasLoadedReferenceOptions
    ? mapCatalogReferenceOptionsToSelectOptions(referenceOptionsState.response.departments)
    : [];

  const termOptions: SelectOption[] = hasLoadedReferenceOptions
    ? mapAcademicTermOptionsToSelectOptions(
        filterAcademicTermsByAcademicYear(
          referenceOptionsState.response.terms,
          form.values.academicYearCode
        )
      )
    : [];

  const subjectOptions: SelectOption[] = hasLoadedReferenceOptions
    ? mapAcademicSubjectOptionsToSelectOptions(
          filterAcademicSubjectsByDepartment(
          referenceOptionsState.response.subjects,
          form.values.departmentCode
        )
      )
    : [];

  const offeringStatusOptions: SelectOption[] = hasLoadedReferenceOptions
    ? mapCatalogReferenceOptionsToSelectOptions(referenceOptionsState.response.offeringStatuses)
    : [];

  const termStatusOptions: SelectOption[] = hasLoadedReferenceOptions
    ? mapCatalogReferenceOptionsToSelectOptions(referenceOptionsState.response.termStatuses)
    : [];

  const tableData =
    searchResultsState.status === 'success'
      ? searchResultsState.response.results
      : emptyCourseOfferingResults;

  async function toggleExpandedCourseOffering(courseOfferingId: number) {
    if (expandedCourseOfferingId === courseOfferingId) {
      setExpandedCourseOfferingId(null);
      return;
    }

    setExpandedCourseOfferingId(courseOfferingId);

    const existingDetailState = detailStateByCourseOfferingId[courseOfferingId];

    if (existingDetailState?.status === 'loading' || existingDetailState?.status === 'success') {
      return;
    }

    setDetailStateByCourseOfferingId((currentState) => ({
      ...currentState,
      [courseOfferingId]: { status: 'loading' },
    }));

    try {
      const detail = await loadCourseOfferingDetail(courseOfferingId);

      setDetailStateByCourseOfferingId((currentState) => ({
        ...currentState,
        [courseOfferingId]: { status: 'success', detail },
      }));
    } catch (error: unknown) {
      setDetailStateByCourseOfferingId((currentState) => ({
        ...currentState,
        [courseOfferingId]: {
          status: 'error',
          message: getErrorMessage(error),
        },
      }));
    }
  }

  function handlePageSizeChange(nextSize: CourseOfferingSearchSize) {
    setPage(0);
    setSize(nextSize);
  }

  function handleSortByChange(nextSortBy: CourseOfferingSearchSortBy) {
    setPage(0);
    setSortBy(nextSortBy);
  }

  function handleSortDirectionChange(nextSortDirection: CourseOfferingSortDirection) {
    setPage(0);
    setSortDirection(nextSortDirection);
  }

  function handleClear() {
    form.reset();
    setPage(0);
    setSize(defaultCourseOfferingSearchSize);
    setSortBy(defaultCourseOfferingSortBy);
    setSortDirection(defaultCourseOfferingSortDirection);
    setSelectedOfferingStatusCodes([]);
    setSelectedTermStatusCodes([]);
    setIncludeInactive(variant === 'advanced');
    setPublishedOnly(variant === 'advanced');
    setAppliedFilters(null);
    setAppliedAdvancedFilters(null);
  }

  function handleSubmit(values: CourseOfferingSearchFilters) {
    setPage(0);
    setAppliedFilters({ ...values });
    setAppliedAdvancedFilters(
      variant === 'advanced'
        ? {
            offeringStatusCodes: [...selectedOfferingStatusCodes],
            termStatusCodes: [...selectedTermStatusCodes],
            includeInactive,
            isPublished: publishedOnly ? true : undefined,
          }
        : null
    );
  }

  function toggleColumnSort(nextSortBy: CourseOfferingSearchSortBy) {
    setPage(0);
    setSortDirection((currentDirection) =>
      sortBy === nextSortBy && currentDirection === 'asc' ? 'desc' : 'asc'
    );
    setSortBy(nextSortBy);
  }

  return {
    form,
    academicYearOptions,
    termOptions,
    departmentOptions,
    subjectOptions,
    offeringStatusOptions,
    termStatusOptions,
    hasLoadedReferenceOptions,
    isLoadingReferenceOptions,
    hasSearchValues,
    isSearching,
    size,
    sortBy,
    sortDirection,
    selectedOfferingStatusCodes,
    selectedTermStatusCodes,
    includeInactive,
    publishedOnly,
    searchResultsState,
    resultsView,
    expandedCourseOfferingId,
    detailStateByCourseOfferingId,
    tableData,
    tableColumnVisibility: resultsView === 'standard' ? standardResultsColumnVisibility : {},
    referenceOptionsErrorMessage:
      referenceOptionsState.status === 'error' ? referenceOptionsState.message : null,
    searchResultsIdle: searchResultsState.status === 'idle',
    setResultsView,
    setSelectedOfferingStatusCodes,
    setSelectedTermStatusCodes,
    setIncludeInactive,
    setPublishedOnly,
    toggleExpandedCourseOffering,
    handlePageSizeChange,
    handleSortByChange,
    handleSortDirectionChange,
    handleClear,
    handleSubmit,
    toggleColumnSort,
    handlePageChange: setPage,
  };
}
