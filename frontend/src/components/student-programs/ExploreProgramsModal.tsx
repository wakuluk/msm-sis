import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Group, Modal, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { explorePrograms } from '@/services/program-service';
import { getProgramReferenceOptions } from '@/services/reference-service';
import type {
  ProgramSearchResultResponse,
  ProgramSearchSortBy,
  ProgramSearchSortDirection,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';
import { ExploreProgramResults } from './ExploreProgramResults';
import { ExploreProgramSearchForm } from './ExploreProgramSearchForm';
import { ExploreProgramSelectionSummary } from './ExploreProgramSelectionSummary';
import {
  mapExploreCatalogOption,
  mapExploreDepartmentOption,
} from './explore-programs.helpers';
import type {
  ProgramExploreFilters,
  ProgramExploreReferenceState,
  ProgramExploreResultsState,
  ProgramExploreSize,
} from './explore-programs.types';

type ExploreProgramsModalProps = {
  onAddProgramToPreview: (program: ProgramSearchResultResponse) => Promise<void>;
  opened: boolean;
  onClose: () => void;
};

const initialProgramExploreFilters: ProgramExploreFilters = {
  programTypeId: '',
  degreeTypeId: '',
  schoolId: '',
  departmentId: '',
  code: '',
  name: '',
};

const exploreSizeOptions = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
] satisfies ReadonlyArray<StringOption<ProgramExploreSize>>;

const exploreSortByOptions = [
  { value: 'programTypeName', label: 'Program type' },
  { value: 'degreeTypeName', label: 'Degree type' },
  { value: 'schoolName', label: 'School' },
  { value: 'departmentName', label: 'Department' },
  { value: 'code', label: 'Code' },
  { value: 'name', label: 'Name' },
] satisfies ReadonlyArray<StringOption<ProgramSearchSortBy>>;

const exploreSortDirectionOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
] satisfies ReadonlyArray<StringOption<ProgramSearchSortDirection>>;

type AddProgramState =
  | { status: 'idle' }
  | { status: 'adding' }
  | { status: 'error'; message: string };

export function ExploreProgramsModal({
  onAddProgramToPreview,
  opened,
  onClose,
}: ExploreProgramsModalProps) {
  const form = useForm<ProgramExploreFilters>({
    initialValues: initialProgramExploreFilters,
  });
  const [referenceState, setReferenceState] = useState<ProgramExploreReferenceState>({
    status: 'idle',
  });
  const [resultsState, setResultsState] = useState<ProgramExploreResultsState>({ status: 'idle' });
  const [submittedFilters, setSubmittedFilters] = useState<ProgramExploreFilters>(
    initialProgramExploreFilters
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<ProgramSearchSortBy>('name');
  const [sortDirection, setSortDirection] = useState<ProgramSearchSortDirection>('asc');
  const [size, setSize] = useState<ProgramExploreSize>('10');
  const [page, setPage] = useState(0);
  const [selectedProgram, setSelectedProgram] = useState<ProgramSearchResultResponse | null>(null);
  const [addProgramState, setAddProgramState] = useState<AddProgramState>({ status: 'idle' });

  useEffect(() => {
    if (!opened) {
      return;
    }

    let isCancelled = false;
    setReferenceState({ status: 'loading' });

    getProgramReferenceOptions()
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setReferenceState({
          status: 'success',
          programTypeOptions: response.programTypes
            .filter((option) => option.code !== 'CORE')
            .map(mapExploreCatalogOption),
          degreeTypeOptions: response.degreeTypes.map(mapExploreCatalogOption),
          schoolOptions: response.schools.map(mapExploreCatalogOption),
          departmentOptions: response.departments.map(mapExploreDepartmentOption),
        });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setReferenceState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load program reference options.'),
        });
      });

    return () => {
      isCancelled = true;
    };
  }, [opened]);

  useEffect(() => {
    if (!opened || !hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    explorePrograms({
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
          message: getErrorMessage(error, 'Failed to explore programs.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, opened, page, size, sortBy, sortDirection, submittedFilters]);

  const referenceOptionsLoading =
    referenceState.status === 'idle' || referenceState.status === 'loading';
  const referenceOptionsError = referenceState.status === 'error' ? referenceState.message : null;
  const programTypeOptions =
    referenceState.status === 'success' ? referenceState.programTypeOptions : [];
  const degreeTypeOptions =
    referenceState.status === 'success' ? referenceState.degreeTypeOptions : [];
  const schoolOptions = referenceState.status === 'success' ? referenceState.schoolOptions : [];
  const departmentOptions =
    referenceState.status === 'success' ? referenceState.departmentOptions : [];
  const visibleDepartmentOptions = useMemo(() => {
    if (form.values.schoolId.trim() === '') {
      return departmentOptions;
    }

    return departmentOptions.filter((option) => option.schoolId === Number(form.values.schoolId));
  }, [departmentOptions, form.values.schoolId]);

  function handleSearch(values: ProgramExploreFilters) {
    setSubmittedFilters({ ...values });
    setSelectedProgram(null);
    setAddProgramState({ status: 'idle' });
    setHasSearched(true);
    setPage(0);
  }

  function handleClear() {
    form.reset();
    setSubmittedFilters(initialProgramExploreFilters);
    setHasSearched(false);
    setPage(0);
    setSortBy('name');
    setSortDirection('asc');
    setSelectedProgram(null);
    setAddProgramState({ status: 'idle' });
    setResultsState({ status: 'idle' });
  }

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

  async function handleAddProgramToPreview() {
    if (!selectedProgram) {
      return;
    }

    setAddProgramState({ status: 'adding' });

    try {
      await onAddProgramToPreview(selectedProgram);
      setAddProgramState({ status: 'idle' });
      setSelectedProgram(null);
      onClose();
    } catch (error) {
      setAddProgramState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to add program to your preview.'),
      });
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Explore Programs" size="90rem" centered>
      <Stack gap="lg">
        <ExploreProgramSearchForm
          degreeTypeOptions={degreeTypeOptions}
          departmentOptions={departmentOptions}
          form={form}
          isSubmitting={resultsState.status === 'loading'}
          onClear={handleClear}
          onSearch={handleSearch}
          onSizeChange={(value) => {
            if (!value) {
              return;
            }

            setSize(value as ProgramExploreSize);
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
          programTypeOptions={programTypeOptions}
          referenceOptionsError={referenceOptionsError}
          referenceOptionsLoading={referenceOptionsLoading}
          schoolOptions={schoolOptions}
          size={size}
          sizeOptions={exploreSizeOptions}
          sortBy={sortBy}
          sortByOptions={exploreSortByOptions}
          sortDirection={sortDirection}
          sortDirectionOptions={exploreSortDirectionOptions}
          visibleDepartmentOptions={visibleDepartmentOptions}
        />

        <ExploreProgramResults
          onPageChange={setPage}
          onSelectProgram={setSelectedProgram}
          onToggleSort={handleToggleSort}
          resultsState={resultsState}
          selectedProgram={selectedProgram}
          sortBy={sortBy}
          sortDirection={sortDirection}
        />

        <ExploreProgramSelectionSummary
          selectedProgram={selectedProgram}
        />

        {addProgramState.status === 'error' ? (
          <Alert color="red" title="Unable to add program">
            {addProgramState.message}
          </Alert>
        ) : null}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={!selectedProgram}
            loading={addProgramState.status === 'adding'}
            onClick={() => {
              void handleAddProgramToPreview();
            }}
          >
            Add to My Programs
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
