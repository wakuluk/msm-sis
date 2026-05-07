import { useEffect, useMemo, useState } from 'react';
import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import {
  CreateProgramModal,
  type ProgramCatalogOption,
  type ProgramDepartmentOption,
} from '@/components/program/CreateProgramModal';
import {
  ProgramSearchFormPanel,
  type ProgramSearchFilters,
} from '@/components/program/ProgramSearchFormPanel';
import {
  ProgramSearchResultsPanel,
  type ProgramSearchResultsState,
  type ProgramSearchResultsView,
} from '@/components/program/ProgramSearchResultsPanel';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { getProgramReferenceOptions } from '@/services/reference-service';
import { searchPrograms, type SearchProgramsRequest } from '@/services/program-service';
import type {
  CreateProgramResponse,
  ProgramSearchResponse,
  ProgramSearchSortBy,
  ProgramSearchSortDirection,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type ReferenceOptionsState =
  | { status: 'idle' | 'loading' }
  | {
      status: 'success';
      programTypeOptions: ProgramCatalogOption[];
      degreeTypeOptions: ProgramCatalogOption[];
      schoolOptions: ProgramCatalogOption[];
      departmentOptions: ProgramDepartmentOption[];
    }
  | { status: 'error'; message: string };

type ProgramSearchSize = '25' | '50' | '100';

type ProgramSearchExperienceProps = {
  canCreateProgram?: boolean;
  loadPrograms?: (request: SearchProgramsRequest) => Promise<ProgramSearchResponse>;
  title?: string;
};

const initialProgramSearchFilters: ProgramSearchFilters = {
  programTypeId: '',
  degreeTypeId: '',
  schoolId: '',
  departmentId: '',
  code: '',
  name: '',
};

const sizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<ProgramSearchSize>>;

const sortByOptions = [
  { value: 'programTypeName', label: 'Program type' },
  { value: 'degreeTypeName', label: 'Degree type' },
  { value: 'schoolName', label: 'School' },
  { value: 'departmentName', label: 'Department' },
  { value: 'code', label: 'Code' },
  { value: 'name', label: 'Name' },
] satisfies ReadonlyArray<StringOption<ProgramSearchSortBy>>;

const sortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<ProgramSearchSortDirection>>;

function mapCodeNameOption(option: { code: string; id: number; name: string }) {
  return {
    code: option.code,
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

export function ProgramSearchExperience({
  canCreateProgram = true,
  loadPrograms = searchPrograms,
  title = 'Program Search',
}: ProgramSearchExperienceProps) {
  const navigate = useNavigate();
  const form = useForm<ProgramSearchFilters>({
    initialValues: initialProgramSearchFilters,
  });
  const [referenceOptionsState, setReferenceOptionsState] = useState<ReferenceOptionsState>({
    status: 'idle',
  });
  const [resultsState, setResultsState] = useState<ProgramSearchResultsState>({ status: 'idle' });
  const [submittedFilters, setSubmittedFilters] = useState<ProgramSearchFilters>(
    initialProgramSearchFilters
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<ProgramSearchSortBy>('code');
  const [sortDirection, setSortDirection] = useState<ProgramSearchSortDirection>('asc');
  const [size, setSize] = useState<ProgramSearchSize>('25');
  const [page, setPage] = useState(0);
  const [resultsView, setResultsView] = useState<ProgramSearchResultsView>('standard');
  const [isCreateProgramModalOpen, setIsCreateProgramModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setReferenceOptionsState({ status: 'loading' });

    getProgramReferenceOptions()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setReferenceOptionsState({
          status: 'success',
          programTypeOptions: response.programTypes.map(mapCodeNameOption),
          degreeTypeOptions: response.degreeTypes.map(mapCodeNameOption),
          schoolOptions: response.schools.map(mapCodeNameOption),
          departmentOptions: response.departments.map((department) => ({
            value: String(department.id),
            label: `${department.name} (${department.code})`,
            schoolId: department.schoolId,
          })),
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setReferenceOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load program reference options.'),
        });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    loadPrograms({
      programTypeId: parseOptionalId(submittedFilters.programTypeId),
      degreeTypeId: parseOptionalId(submittedFilters.degreeTypeId),
      schoolId: parseOptionalId(submittedFilters.schoolId),
      departmentId: parseOptionalId(submittedFilters.departmentId),
      code: submittedFilters.code,
      name: submittedFilters.name,
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
          message: getErrorMessage(error, 'Failed to search programs.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, loadPrograms, page, size, sortBy, sortDirection, submittedFilters]);

  const referenceOptionsLoading =
    referenceOptionsState.status === 'idle' || referenceOptionsState.status === 'loading';
  const referenceOptionsError =
    referenceOptionsState.status === 'error' ? referenceOptionsState.message : null;
  const programTypeOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.programTypeOptions : [];
  const degreeTypeOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.degreeTypeOptions : [];
  const schoolOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.schoolOptions : [];
  const departmentOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.departmentOptions : [];

  const visibleDepartmentOptions = useMemo(() => {
    if (form.values.schoolId.trim() === '') {
      return departmentOptions;
    }

    return departmentOptions.filter((option) => option.schoolId === Number(form.values.schoolId));
  }, [departmentOptions, form.values.schoolId]);

  function handleToggleSort(nextSortBy: ProgramSearchSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
    setPage(0);
  }

  function handleClear() {
    form.reset();
    setSubmittedFilters(initialProgramSearchFilters);
    setHasSearched(false);
    setSortBy('code');
    setSortDirection('asc');
    setPage(0);
    setResultsState({ status: 'idle' });
  }

  function handleProgramCreated(response: CreateProgramResponse) {
    setIsCreateProgramModalOpen(false);
    void navigate(`/academics/programs/${response.programId}`);
  }

  return (
    <>
      {canCreateProgram ? (
        <CreateProgramModal
          opened={isCreateProgramModalOpen}
          onClose={() => {
            setIsCreateProgramModalOpen(false);
          }}
          onCreated={handleProgramCreated}
          programTypeOptions={programTypeOptions}
          degreeTypeOptions={degreeTypeOptions}
          schoolOptions={schoolOptions}
          departmentOptions={departmentOptions}
          referenceOptionsLoading={referenceOptionsLoading}
          referenceOptionsError={referenceOptionsError}
        />
      ) : null}
      <Stack gap="lg">
        <ProgramSearchFormPanel
          canCreateProgram={canCreateProgram}
          form={form}
          title={title}
          programTypeOptions={programTypeOptions}
          degreeTypeOptions={degreeTypeOptions}
          schoolOptions={schoolOptions}
          departmentOptions={departmentOptions}
          visibleDepartmentOptions={visibleDepartmentOptions}
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
          onCreateProgram={() => {
            setIsCreateProgramModalOpen(true);
          }}
          onSizeChange={(value) => {
            if (!value) {
              return;
            }

            setSize(value as ProgramSearchSize);
            setPage(0);
          }}
          onSortByChange={(value) => {
            if (!value) {
              return;
            }

            setSortBy(value as ProgramSearchSortBy);
            setPage(0);
          }}
          onSortDirectionChange={(value) => {
            if (!value) {
              return;
            }

            setSortDirection(value as ProgramSearchSortDirection);
            setPage(0);
          }}
        />

        <ProgramSearchResultsPanel
          resultsState={resultsState}
          sortBy={sortBy}
          sortDirection={sortDirection}
          resultsView={resultsView}
          onToggleSort={handleToggleSort}
          onViewChange={setResultsView}
          onPageChange={setPage}
        />
      </Stack>
    </>
  );
}
