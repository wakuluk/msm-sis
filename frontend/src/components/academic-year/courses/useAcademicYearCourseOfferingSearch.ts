import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { SearchResultsStatus } from '@/components/search/SearchResultsPanel';
import { searchAcademicYearCourseOfferings } from '@/services/admin-courses-service';
import { getCourseSearchReferenceOptions } from '@/services/reference-service';
import type {
  AcademicYearCourseOfferingSearchResponse,
  AcademicYearCourseOfferingSearchResultResponse,
} from '@/services/schemas/admin-courses-schemas';
import type { CourseSearchReferenceOptionsResponse } from '@/services/schemas/reference-schemas';
import {
  initialCourseSectionSearchValues,
  type CourseSectionSearchValues,
} from './CourseSectionsWorkspace';
import { getErrorMessage } from './academicYearCoursesShared';

export type YearOfferingSearchSortBy =
  | 'schoolName'
  | 'departmentName'
  | 'subjectCode'
  | 'courseCode'
  | 'title';

export type YearOfferingSearchSortDirection = 'asc' | 'desc';
export type YearOfferingResultsView = 'standard' | 'system';

export type YearOfferingSearchFormValues = {
  subTermId: string | null;
  schoolId: string | null;
  departmentId: string | null;
  subjectId: string | null;
  courseCode: string;
  title: string;
};

export type YearOfferingReferenceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; options: CourseSearchReferenceOptionsResponse };

export type YearOfferingSearchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: AcademicYearCourseOfferingSearchResponse };

type UseAcademicYearCourseOfferingSearchParams = {
  academicYearId: number;
  hasValidAcademicYearId: boolean;
  initialSubTermId?: string | null;
  lockSubTermFilter: boolean;
  onSectionSearchValuesChange?: (values: CourseSectionSearchValues) => void;
  reloadKey: number;
};

function buildInitialYearOfferingSearchFormValues(
  initialSubTermId: string | null = null
): YearOfferingSearchFormValues {
  return {
    subTermId: initialSubTermId,
    schoolId: null,
    departmentId: null,
    subjectId: null,
    courseCode: '',
    title: '',
  };
}

export const yearOfferingsPageSize = 25;
const emptyAcademicYearOfferingResults: AcademicYearCourseOfferingSearchResultResponse[] = [];
export const yearOfferingResultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: YearOfferingResultsView }>;

function getYearOfferingResultsSummary(state: YearOfferingSearchState): string {
  if (state.status === 'loading') {
    return 'Loading academic year offerings...';
  }

  if (state.status === 'error') {
    return 'Academic year offering search failed.';
  }

  if (state.response.totalElements === 0 || state.response.results.length === 0) {
    return 'No course offerings matched the current filters.';
  }

  const start = state.response.page * state.response.size + 1;
  const end = state.response.page * state.response.size + state.response.results.length;

  return `Showing ${start}-${end} of ${state.response.totalElements} offerings`;
}

function buildAcademicYearOfferingColumns(): ColumnDef<AcademicYearCourseOfferingSearchResultResponse>[] {
  return [
    {
      accessorKey: 'schoolName',
      header: 'School',
      size: 220,
      cell: ({ row }) => row.original.schoolName ?? '—',
      meta: { sortBy: 'schoolName' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'departmentName',
      header: 'Department',
      size: 220,
      cell: ({ row }) => row.original.departmentName ?? '—',
      meta: { sortBy: 'departmentName' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'subjectCode',
      header: 'Subject',
      size: 140,
      cell: ({ row }) => row.original.subjectCode ?? '—',
      meta: { sortBy: 'subjectCode' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'courseCode',
      header: 'Course',
      size: 180,
      cell: ({ row }) => row.original.courseCode ?? '—',
      meta: { sortBy: 'courseCode' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 320,
      cell: ({ row }) => row.original.title ?? '—',
      meta: { sortBy: 'title' satisfies YearOfferingSearchSortBy },
    },
    {
      accessorKey: 'subTerms',
      header: 'Terms',
      size: 220,
      cell: ({ row }) =>
        row.original.subTerms.length > 0
          ? row.original.subTerms.map((subTerm) => subTerm.code).join(', ')
          : 'N/A',
    },
  ];
}

export function useAcademicYearCourseOfferingSearch({
  academicYearId,
  hasValidAcademicYearId,
  initialSubTermId = null,
  lockSubTermFilter,
  onSectionSearchValuesChange,
  reloadKey,
}: UseAcademicYearCourseOfferingSearchParams) {
  const initialSearchValues = useMemo(
    () => buildInitialYearOfferingSearchFormValues(initialSubTermId),
    [initialSubTermId]
  );
  const [referenceState, setReferenceState] = useState<YearOfferingReferenceState>({
    status: 'loading',
  });
  const [searchValues, setSearchValues] =
    useState<YearOfferingSearchFormValues>(initialSearchValues);
  const [submittedSearchValues, setSubmittedSearchValues] =
    useState<YearOfferingSearchFormValues>(initialSearchValues);
  const [sortBy, setSortBy] = useState<YearOfferingSearchSortBy>('courseCode');
  const [sortDirection, setSortDirection] = useState<YearOfferingSearchSortDirection>('asc');
  const [resultsView, setResultsView] = useState<YearOfferingResultsView>('standard');
  const [page, setPage] = useState(0);
  const [searchState, setSearchState] = useState<YearOfferingSearchState>({ status: 'loading' });

  useEffect(() => {
    setPage(0);
    setSearchValues(initialSearchValues);
    setSubmittedSearchValues(initialSearchValues);
  }, [initialSearchValues]);

  useEffect(() => {
    let cancelled = false;
    setReferenceState({ status: 'loading' });

    getCourseSearchReferenceOptions()
      .then((options) => {
        if (cancelled) {
          return;
        }

        setReferenceState({ status: 'success', options });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setReferenceState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load course offering search filters.'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasValidAcademicYearId) {
      setSearchState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setSearchState({ status: 'loading' });

    searchAcademicYearCourseOfferings({
      academicYearId,
      subTermId: submittedSearchValues.subTermId
        ? Number(submittedSearchValues.subTermId)
        : undefined,
      schoolId: submittedSearchValues.schoolId ? Number(submittedSearchValues.schoolId) : undefined,
      departmentId: submittedSearchValues.departmentId
        ? Number(submittedSearchValues.departmentId)
        : undefined,
      subjectId: submittedSearchValues.subjectId
        ? Number(submittedSearchValues.subjectId)
        : undefined,
      courseCode: submittedSearchValues.courseCode,
      title: submittedSearchValues.title,
      page,
      size: yearOfferingsPageSize,
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSearchState({ status: 'success', response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSearchState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to search academic year course offerings.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [
    academicYearId,
    hasValidAcademicYearId,
    page,
    reloadKey,
    sortBy,
    sortDirection,
    submittedSearchValues,
  ]);

  const referenceOptions = referenceState.status === 'success' ? referenceState.options : null;
  const schoolOptions = useMemo(
    () =>
      (referenceOptions?.schools ?? []).map((school) => ({
        value: String(school.id),
        label: `${school.name} (${school.code})`,
      })),
    [referenceOptions]
  );
  const departmentOptions = useMemo(
    () =>
      (referenceOptions?.departments ?? [])
        .filter(
          (department) =>
            !searchValues.schoolId || String(department.schoolId) === searchValues.schoolId
        )
        .map((department) => ({
          value: String(department.id),
          label: `${department.name} (${department.code})`,
        })),
    [referenceOptions, searchValues.schoolId]
  );
  const subjectOptions = useMemo(
    () =>
      (referenceOptions?.subjects ?? [])
        .filter(
          (subject) =>
            !searchValues.departmentId || String(subject.departmentId) === searchValues.departmentId
        )
        .map((subject) => ({
          value: String(subject.id),
          label: `${subject.name} (${subject.code})`,
        })),
    [referenceOptions, searchValues.departmentId]
  );
  const columns = useMemo(() => buildAcademicYearOfferingColumns(), []);
  const tableData =
    searchState.status === 'success'
      ? searchState.response.results
      : emptyAcademicYearOfferingResults;
  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.courseOfferingId),
    state: {
      columnVisibility: {
        subjectCode: resultsView === 'system',
        subTerms: !lockSubTermFilter,
      },
    },
  });
  const resultsPanelStatus: SearchResultsStatus =
    searchState.status === 'success' && searchState.response.results.length === 0
      ? 'empty'
      : searchState.status;

  function handleSchoolChange(value: string | null) {
    setSearchValues((current) => ({
      ...current,
      schoolId: value,
      departmentId: null,
      subjectId: null,
    }));
  }

  function handleDepartmentChange(value: string | null) {
    setSearchValues((current) => ({
      ...current,
      departmentId: value,
      subjectId: null,
    }));
  }

  function handleSubjectChange(value: string | null) {
    setSearchValues((current) => ({
      ...current,
      subjectId: value,
    }));
  }

  function handleSearch() {
    setPage(0);
    setSubmittedSearchValues({ ...searchValues });
  }

  function handleClearSearch() {
    setPage(0);
    setSearchValues(initialSearchValues);
    setSubmittedSearchValues(initialSearchValues);
    onSectionSearchValuesChange?.(initialCourseSectionSearchValues);
  }

  function handleToggleSort(nextSortBy: YearOfferingSearchSortBy) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(nextSortBy);
      setSortDirection('asc');
    }

    setPage(0);
  }

  return {
    departmentOptions,
    handleClearSearch,
    handleDepartmentChange,
    handleSchoolChange,
    handleSearch,
    handleSubjectChange,
    handleToggleSort,
    referenceState,
    resultsPanelStatus,
    resultsSummary: getYearOfferingResultsSummary(searchState),
    resultsView,
    schoolOptions,
    searchState,
    searchValues,
    setPage,
    setResultsView,
    setSearchValues,
    sortBy,
    sortDirection,
    subjectOptions,
    table,
    tableData,
  };
}
