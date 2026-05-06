import { useEffect, useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import {
  CourseSearchFormPanel,
  type CourseSearchFilters,
} from '@/components/course/CourseSearchFormPanel';
import {
  CourseSearchResultsPanel,
  type CourseSearchResultsState,
  type CourseSearchResultsView,
} from '@/components/course/CourseSearchResultsPanel';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { searchCourses } from '@/services/course-service';
import { CourseCreateModal } from '@/components/course/CourseCreateModal';
import { useCourseCreateReferenceOptions } from '@/components/course/useCourseCreateReferenceOptions';
import type {
  CourseSearchSortBy,
  CourseSearchSortDirection,
} from '@/services/schemas/course-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type CourseSearchSize = '25' | '50' | '100';

const initialCourseSearchFilters: CourseSearchFilters = {
  schoolId: '',
  departmentId: '',
  subjectId: '',
  courseNumber: '',
  courseCode: '',
  title: '',
  currentVersionOnly: false,
  includeInactive: false,
};

const sizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<CourseSearchSize>>;
const sortByOptions = [
  { value: 'schoolName', label: 'School' },
  { value: 'departmentName', label: 'Department' },
  { value: 'subjectCode', label: 'Subject' },
  { value: 'courseNumber', label: 'Course number' },
  { value: 'courseCode', label: 'Course code' },
  { value: 'title', label: 'Title' },
  { value: 'active', label: 'Active' },
] satisfies ReadonlyArray<StringOption<CourseSearchSortBy>>;
const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<CourseSearchSortDirection>>;

export function CourseSearchPage() {
  const navigate = useNavigate();
  const form = useForm<CourseSearchFilters>({
    initialValues: initialCourseSearchFilters,
  });
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [resultsState, setResultsState] = useState<CourseSearchResultsState>({ status: 'idle' });
  const [submittedFilters, setSubmittedFilters] = useState<CourseSearchFilters>(
    initialCourseSearchFilters
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<CourseSearchSortBy>('courseNumber');
  const [sortDirection, setSortDirection] = useState<CourseSearchSortDirection>('asc');
  const [size, setSize] = useState<CourseSearchSize>('25');
  const [page, setPage] = useState(0);
  const [resultsView, setResultsView] = useState<CourseSearchResultsView>('standard');
  const courseCreateReferenceOptions = useCourseCreateReferenceOptions();
  const {
    schoolOptions,
    departmentOptions,
    subjectOptions,
    referenceOptionsError,
    referenceOptionsLoading,
  } = courseCreateReferenceOptions;

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    searchCourses({
      schoolId: parseOptionalId(submittedFilters.schoolId),
      departmentId: parseOptionalId(submittedFilters.departmentId),
      subjectId: parseOptionalId(submittedFilters.subjectId),
      courseNumber: submittedFilters.courseNumber,
      courseCode: submittedFilters.courseCode,
      title: submittedFilters.title,
      currentVersionOnly: submittedFilters.currentVersionOnly,
      includeInactive: submittedFilters.includeInactive,
      page,
      size: Number(size),
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setResultsState(
          response.results.length === 0
            ? { status: 'empty', response }
            : { status: 'success', response }
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setResultsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to search courses.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, size, sortBy, sortDirection, submittedFilters]);

  function handleToggleSort(nextSortBy: CourseSearchSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function handleClear() {
    form.reset();
    setSubmittedFilters(initialCourseSearchFilters);
    setHasSearched(false);
    setPage(0);
    setResultsState({ status: 'idle' });
  }

  const visibleDepartmentOptions =
    form.values.schoolId.trim() === ''
      ? departmentOptions
      : departmentOptions.filter((option) => option.schoolId === Number(form.values.schoolId));
  const visibleSubjectOptions =
    form.values.departmentId.trim() === ''
      ? subjectOptions
      : subjectOptions.filter((option) => option.departmentId === Number(form.values.departmentId));

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <CourseSearchFormPanel
          form={form}
          schoolOptions={schoolOptions}
          departmentOptions={departmentOptions}
          subjectOptions={subjectOptions}
          visibleDepartmentOptions={visibleDepartmentOptions}
          visibleSubjectOptions={visibleSubjectOptions}
          referenceOptionsLoading={referenceOptionsLoading}
          referenceOptionsError={referenceOptionsError}
          size={size}
          sortBy={sortBy}
          sortDirection={sortDirection}
          sizeOptions={sizeOptions}
          sortByOptions={sortByOptions}
          sortDirectionOptions={sortDirectionOptions}
          isSubmitting={resultsState.status === 'loading'}
          onSubmit={(values) => {
            setSubmittedFilters({ ...values });
            setHasSearched(true);
            setPage(0);
          }}
          onClear={handleClear}
          onCreateCourse={() => {
            setIsCreateCourseModalOpen(true);
          }}
          onSizeChange={(value) => {
            if (!value) {
              return;
            }

            setSize(value as CourseSearchSize);
            setPage(0);
          }}
          onSortByChange={(value) => {
            if (!value) {
              return;
            }

            setSortBy(value as CourseSearchSortBy);
            setPage(0);
          }}
          onSortDirectionChange={(value) => {
            if (!value) {
              return;
            }

            setSortDirection(value as CourseSearchSortDirection);
            setPage(0);
          }}
        />

        <CourseSearchResultsPanel
          resultsState={resultsState}
          sortBy={sortBy}
          sortDirection={sortDirection}
          resultsView={resultsView}
          onToggleSort={handleToggleSort}
          onViewChange={setResultsView}
          onPageChange={setPage}
        />
        <CourseCreateModal
          {...courseCreateReferenceOptions}
          opened={isCreateCourseModalOpen}
          onClose={() => {
            setIsCreateCourseModalOpen(false);
          }}
          onCreated={(courseVersion) => {
            if (courseVersion.courseId !== null) {
              navigate(`/academics/courses/${courseVersion.courseId}`);
            }
          }}
        />
      </Stack>
    </Container>
  );
}
