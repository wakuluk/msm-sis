import { useEffect, useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { AcademicSchoolsSearchFormPanel } from '@/components/academic-school/AcademicSchoolsSearchFormPanel';
import {
  AcademicSchoolsSearchResultsPanel,
  type AcademicSchoolResultsView,
  type AcademicSchoolSearchSortBy,
  type AcademicSchoolSearchSortDirection,
  type AcademicSchoolsPageState,
} from '@/components/academic-school/AcademicSchoolsSearchResultsPanel';
import {
  getAcademicSchoolDepartmentReferenceOptions,
  mapCodeNameReferenceOptionsToSelectOptions,
} from '@/services/reference-service';
import { searchAcademicSchools } from '@/services/academic-school-service';
import type { AcademicSchoolSearchFilters } from '@/services/schemas/academic-school-schemas';
import { initialAcademicSchoolSearchFilters } from '@/services/schemas/academic-school-schemas';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

export function AcademicSchoolsPage() {
  const form = useForm<AcademicSchoolSearchFilters>({
    initialValues: initialAcademicSchoolSearchFilters,
  });
  const [pageState, setPageState] = useState<AcademicSchoolsPageState>({ status: 'loading' });
  const [sortBy, setSortBy] = useState<AcademicSchoolSearchSortBy>('schoolName');
  const [sortDirection, setSortDirection] = useState<AcademicSchoolSearchSortDirection>('asc');
  const [resultsView, setResultsView] = useState<AcademicSchoolResultsView>('standard');
  const [submittedFilters, setSubmittedFilters] = useState<AcademicSchoolSearchFilters>(
    initialAcademicSchoolSearchFilters
  );
  const [schoolOptions, setSchoolOptions] = useState<ReadonlyArray<StringOption>>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    ReadonlyArray<{ schoolId: number } & StringOption>
  >([]);
  const [referenceOptionsLoading, setReferenceOptionsLoading] = useState(true);
  const [referenceOptionsError, setReferenceOptionsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setReferenceOptionsLoading(true);
    setReferenceOptionsError(null);

    getAcademicSchoolDepartmentReferenceOptions()
      .then((response) => {
        if (!mounted) {
          return;
        }

        setSchoolOptions(mapCodeNameReferenceOptionsToSelectOptions(response.schools));
        setDepartmentOptions(
          response.departments.map((department) => ({
            schoolId: department.schoolId,
            value: String(department.id),
            label: `${department.name} (${department.code})`,
          }))
        );
        setReferenceOptionsLoading(false);
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }

        setSchoolOptions([]);
        setDepartmentOptions([]);
        setReferenceOptionsError(
          error instanceof Error ? error.message : 'Failed to load academic school filters.'
        );
        setReferenceOptionsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    setPageState({ status: 'loading' });

    const schoolId = parseOptionalId(submittedFilters.schoolId);
    const departmentId = parseOptionalId(submittedFilters.departmentId);

    searchAcademicSchools({
      schoolId,
      departmentId,
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((results) => {
        setPageState(
          results.length === 0 ? { status: 'empty', results } : { status: 'success', results }
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic schools.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [submittedFilters, sortBy, sortDirection]);

  function handleToggleSort(nextSortBy: AcademicSchoolSearchSortBy) {
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
    setSubmittedFilters(initialAcademicSchoolSearchFilters);
  }

  const visibleDepartmentOptions =
    form.values.schoolId.trim() === ''
      ? departmentOptions
      : departmentOptions.filter(
          (option) => option.schoolId === Number(form.values.schoolId)
        );

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <AcademicSchoolsSearchFormPanel
          form={form}
          schoolOptions={schoolOptions}
          departmentOptions={departmentOptions}
          visibleDepartmentOptions={visibleDepartmentOptions}
          referenceOptionsLoading={referenceOptionsLoading}
          referenceOptionsError={referenceOptionsError}
          isSubmitting={pageState.status === 'loading'}
          onSubmit={(values) => {
            setSubmittedFilters({ ...values });
          }}
          onClear={handleClear}
        />

        <AcademicSchoolsSearchResultsPanel
          pageState={pageState}
          sortBy={sortBy}
          sortDirection={sortDirection}
          resultsView={resultsView}
          onToggleSort={handleToggleSort}
          onViewChange={setResultsView}
        />
      </Stack>
    </Container>
  );
}
