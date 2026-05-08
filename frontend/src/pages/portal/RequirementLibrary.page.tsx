import { useEffect, useState } from 'react';
import { Container, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { CreateRequirementModal } from '@/components/requirements/CreateRequirementModal';
import {
  RequirementLibraryFormPanel,
  type RequirementSearchFilters,
} from '@/components/requirements/RequirementLibraryFormPanel';
import {
  RequirementLibraryResultsPanel,
  type RequirementResultsView,
  type RequirementSearchResultsState,
} from '@/components/requirements/RequirementLibraryResultsPanel';
import type { StringOption } from '@/components/search/SearchQueryControls';
import { searchRequirements } from '@/services/requirement-service';
import type { RequirementSearchResultResponse } from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';

type RequirementSearchSize = '25' | '50' | '100';

const initialRequirementSearchFilters: RequirementSearchFilters = {
  code: '',
  name: '',
  requirementType: '',
};
const sizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<RequirementSearchSize>>;

export function RequirementLibraryPage() {
  const navigate = useNavigate();
  const form = useForm<RequirementSearchFilters>({
    initialValues: initialRequirementSearchFilters,
  });
  const [resultsState, setResultsState] = useState<RequirementSearchResultsState>({
    status: 'idle',
  });
  const [submittedFilters, setSubmittedFilters] = useState<RequirementSearchFilters>(
    initialRequirementSearchFilters
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [size, setSize] = useState<RequirementSearchSize>('25');
  const [page, setPage] = useState(0);
  const [resultsView, setResultsView] = useState<RequirementResultsView>('standard');
  const [isCreateRequirementModalOpen, setIsCreateRequirementModalOpen] = useState(false);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    searchRequirements({
      code: submittedFilters.code,
      name: submittedFilters.name,
      requirementType: submittedFilters.requirementType || undefined,
      page,
      size: Number(size),
      signal: abortController.signal,
    })
      .then((response) => {
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
          message: getErrorMessage(error, 'Failed to search requirements.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, size, submittedFilters]);

  function handleClear() {
    form.reset();
    setSubmittedFilters(initialRequirementSearchFilters);
    setHasSearched(false);
    setPage(0);
    setResultsState({ status: 'idle' });
  }

  function handleRequirementCreated(requirement: RequirementSearchResultResponse) {
    setIsCreateRequirementModalOpen(false);
    void navigate(`/academics/requirements/${requirement.requirementId}`);
  }

  return (
    <Container size="xl" py="xl">
      <CreateRequirementModal
        opened={isCreateRequirementModalOpen}
        onCreated={handleRequirementCreated}
        onClose={() => {
          setIsCreateRequirementModalOpen(false);
        }}
      />
      <Stack gap="lg">
        <RequirementLibraryFormPanel
          form={form}
          size={size}
          sizeOptions={sizeOptions}
          isSubmitting={resultsState.status === 'loading'}
          onSubmit={(values) => {
            setSubmittedFilters({ ...values });
            setHasSearched(true);
            setPage(0);
          }}
          onClear={handleClear}
          onCreateRequirement={() => {
            setIsCreateRequirementModalOpen(true);
          }}
          onSizeChange={(value) => {
            if (!value) {
              return;
            }

            setSize(value as RequirementSearchSize);
            setPage(0);
          }}
        />

        <RequirementLibraryResultsPanel
          resultsState={resultsState}
          resultsView={resultsView}
          onViewChange={setResultsView}
          onPageChange={setPage}
        />
      </Stack>
    </Container>
  );
}
