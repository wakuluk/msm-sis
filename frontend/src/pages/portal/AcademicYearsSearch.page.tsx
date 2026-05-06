import { useEffect, useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import {
  defaultAcademicYearSearchSize,
  defaultAcademicYearSortBy,
  defaultAcademicYearSortDirection,
  parseAcademicYearSearchSize,
  parseAcademicYearSortBy,
  parseAcademicYearSortDirection,
  type AcademicYearSearchSize,
} from '@/services/academic-year-search-config';
import { getAcademicYearStatuses, searchAcademicYears } from '@/services/academic-year-service';
import {
  initialAcademicYearSearchFilters,
  type AcademicYearSearchFilters,
  type AcademicYearSortBy,
  type AcademicYearSortDirection,
} from '@/services/schemas/academic-years-schemas';
import { AcademicYearSearchFormPanel } from '@/components/academic-year/AcademicYearSearchFormPanel';
import {
  AcademicYearSearchResultsPanel,
  type AcademicYearResultsView,
  type AcademicYearSearchResultsState,
} from '@/components/academic-year/AcademicYearSearchResultsPanel';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { getErrorMessage } from '@/utils/errors';

export function AcademicYearsSearchPage() {
  const navigate = useNavigate();
  const form = useForm<AcademicYearSearchFilters>({
    initialValues: initialAcademicYearSearchFilters,
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState<AcademicYearSearchSize>(defaultAcademicYearSearchSize);
  const [sortBy, setSortBy] = useState<AcademicYearSortBy>(defaultAcademicYearSortBy);
  const [sortDirection, setSortDirection] = useState<AcademicYearSortDirection>(
    defaultAcademicYearSortDirection
  );
  const [resultsView, setResultsView] = useState<AcademicYearResultsView>('standard');
  const [academicYearStatusOptions, setAcademicYearStatusOptions] = useState<
    ReadonlyArray<StringOption>
  >([]);
  const [academicYearStatusOptionsLoading, setAcademicYearStatusOptionsLoading] = useState(true);
  const [academicYearStatusOptionsError, setAcademicYearStatusOptionsError] = useState<
    string | null
  >(null);
  const [submittedFilters, setSubmittedFilters] = useState<AcademicYearSearchFilters | null>(null);
  const [searchResultsState, setSearchResultsState] = useState<AcademicYearSearchResultsState>({
    status: 'idle',
  });

  useEffect(() => {
    const abortController = new AbortController();
    setAcademicYearStatusOptionsLoading(true);
    setAcademicYearStatusOptionsError(null);

    getAcademicYearStatuses({ signal: abortController.signal })
      .then((response) => {
        setAcademicYearStatusOptions(
          response.map((status) => ({
            value: status.code,
            label: status.name,
          }))
        );
        setAcademicYearStatusOptionsLoading(false);
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAcademicYearStatusOptions([]);
        setAcademicYearStatusOptionsError(
          getErrorMessage(error, 'Failed to load academic year statuses.')
        );
        setAcademicYearStatusOptionsLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (!submittedFilters) {
      return;
    }

    const abortController = new AbortController();
    setSearchResultsState({ status: 'loading' });

    searchAcademicYears({
      filters: submittedFilters,
      page,
      size,
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        setSearchResultsState(
          response.length === 0
            ? { status: 'empty', response }
            : { status: 'success', response }
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSearchResultsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to search academic years.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [submittedFilters, page, size, sortBy, sortDirection]);

  function handleToggleSort(nextSortBy: AcademicYearSortBy) {
    setPage(0);

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
    setPage(0);
    setSize(defaultAcademicYearSearchSize);
    setSortBy(defaultAcademicYearSortBy);
    setSortDirection(defaultAcademicYearSortDirection);
    setResultsView('standard');
    setSubmittedFilters(null);
    setSearchResultsState({ status: 'idle' });
  }

  function handleOpenAcademicYearDetail(academicYearId: number) {
    navigate(`/academics/academic-years/${academicYearId}`);
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <AcademicYearSearchFormPanel
          form={form}
          size={size}
          sortBy={sortBy}
          sortDirection={sortDirection}
          yearStatusOptions={academicYearStatusOptions}
          yearStatusOptionsLoading={academicYearStatusOptionsLoading}
          yearStatusOptionsError={academicYearStatusOptionsError}
          isSubmitting={searchResultsState.status === 'loading'}
          onSubmit={(values) => {
            setPage(0);
            setSubmittedFilters({ ...values });
          }}
          onClear={handleClear}
          onSizeChange={(value) => {
            setPage(0);
            setSize(parseAcademicYearSearchSize(value));
          }}
          onSortByChange={(value) => {
            setPage(0);
            setSortBy(parseAcademicYearSortBy(value));
          }}
          onSortDirectionChange={(value) => {
            setPage(0);
            setSortDirection(parseAcademicYearSortDirection(value));
          }}
        />

        <AcademicYearSearchResultsPanel
          resultsState={searchResultsState}
          page={page}
          size={size}
          sortBy={sortBy}
          sortDirection={sortDirection}
          resultsView={resultsView}
          canPaginate={
            submittedFilters !== null &&
            (searchResultsState.status === 'success' || searchResultsState.status === 'empty')
          }
          onToggleSort={handleToggleSort}
          onViewChange={setResultsView}
          onOpenAcademicYear={handleOpenAcademicYearDetail}
          onPageChange={setPage}
        />
      </Stack>
    </Container>
  );
}
