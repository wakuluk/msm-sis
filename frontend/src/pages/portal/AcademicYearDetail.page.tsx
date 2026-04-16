import { useEffect, useState, type ComponentProps } from 'react';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { Link, useLocation, useParams } from 'react-router-dom';
import { WorkflowStatusStepperSection } from '@/components/status/WorkflowStatusStepperSection';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import {
  getAcademicYearById,
  getAcademicYearStatuses,
  patchAcademicYear,
  postAcademicYearTerms,
  shiftAcademicYearStatus,
} from '@/services/academic-years-service';
import {
  buildPostAcademicYearTermsRequest,
  buildPatchAcademicYearRequest,
  hasAcademicYearDetailChanges,
  mapAcademicYearDetailToFormValues,
} from '@/services/mappers/academic-year-mappers';
import {
  initialAcademicYearAddTermsFormValues,
  initialAcademicYearDetailFormValues,
  initialAcademicYearTermFormValues,
  type AcademicYearAddTermsFormValues,
  type AcademicYearCreateResponse,
  type AcademicYearDetailFormValues,
  type AcademicYearStatusShiftDirection,
  type AcademicYearStatusesResponse,
} from '@/services/schemas/academic-years-schemas';

type AcademicYearDetailLocationState = {
  academicYear?: AcademicYearCreateResponse;
};

type AcademicYearDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; academicYear: AcademicYearCreateResponse };

type AcademicYearDetailSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicYearAddTermsState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicYearStatusShiftState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

function displayValue(value: boolean | number | string | null | undefined): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

function displayDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function getAcademicYearStatusCode(detail: AcademicYearCreateResponse): string | null {
  return (
    detail.yearStatusCode?.trim() ??
    detail.academicYearStatusCode?.trim() ??
    detail.statusCode?.trim() ??
    null
  );
}

function isConditionalAcademicYearStatus(code: string | null | undefined): boolean {
  const normalizedCode = code?.trim().toUpperCase() ?? null;

  return normalizedCode === 'CANCELLED';
}

function formatDateForFormValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeDateInputValue(value: string | Date | null): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return formatDateForFormValue(value);
}

function parseDateInputValue(value: string): Date | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!dateMatch) {
    return null;
  }

  const [, yearPart, monthPart, dayPart] = dateMatch;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function ReadOnlyField({
  label,
  value,
  span = { base: 12, md: 6 },
}: {
  label: string;
  value: string;
  span?: ComponentProps<typeof Grid.Col>['span'];
}) {
  const isEmptyValue = value === '—';

  return (
    <Grid.Col span={span}>
      <TextInput
        label={label}
        value={isEmptyValue ? '' : value}
        placeholder={isEmptyValue ? '—' : undefined}
        readOnly
      />
    </Grid.Col>
  );
}

export function AcademicYearDetailPage() {
  const { academicYearId } = useParams<{ academicYearId: string }>();
  const location = useLocation();
  const { academicYear } = (location.state as AcademicYearDetailLocationState | null) ?? {};
  const parsedAcademicYearId = Number(academicYearId);
  const hasValidAcademicYearId = Number.isInteger(parsedAcademicYearId) && parsedAcademicYearId > 0;
  const initialAcademicYear =
    academicYear && academicYear.academicYearId === parsedAcademicYearId ? academicYear : null;
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTerms, setIsAddingTerms] = useState(false);
  const [saveState, setSaveState] = useState<AcademicYearDetailSaveState>({ status: 'idle' });
  const [addTermsState, setAddTermsState] = useState<AcademicYearAddTermsState>({ status: 'idle' });
  const [statusShiftState, setStatusShiftState] = useState<AcademicYearStatusShiftState>({
    status: 'idle',
  });
  const [academicYearStatuses, setAcademicYearStatuses] = useState<AcademicYearStatusesResponse>(
    []
  );
  const [academicYearStatusesLoading, setAcademicYearStatusesLoading] = useState(true);
  const [academicYearStatusesError, setAcademicYearStatusesError] = useState<string | null>(null);
  const form = useForm<AcademicYearDetailFormValues>({
    initialValues: initialAcademicYear
      ? mapAcademicYearDetailToFormValues(initialAcademicYear)
      : initialAcademicYearDetailFormValues,
  });
  const addTermsForm = useForm<AcademicYearAddTermsFormValues>({
    initialValues: initialAcademicYearAddTermsFormValues,
  });
  const [detailState, setDetailState] = useState<AcademicYearDetailPageState>(() => {
    if (initialAcademicYear) {
      return { status: 'success', academicYear: initialAcademicYear };
    }

    return { status: 'loading' };
  });

  useEffect(() => {
    const abortController = new AbortController();
    setAcademicYearStatusesLoading(true);
    setAcademicYearStatusesError(null);

    getAcademicYearStatuses({ signal: abortController.signal })
      .then((response) => {
        setAcademicYearStatuses([...response].sort((left, right) => left.order - right.order));
        setAcademicYearStatusesLoading(false);
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAcademicYearStatuses([]);
        setAcademicYearStatusesError(
          getErrorMessage(error, 'Failed to load academic year statuses.')
        );
        setAcademicYearStatusesLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    if (initialAcademicYear) {
      form.setValues(mapAcademicYearDetailToFormValues(initialAcademicYear));
      setIsEditing(false);
      setIsAddingTerms(false);
      setSaveState({ status: 'idle' });
      setStatusShiftState({ status: 'idle' });
      addTermsForm.setValues(initialAcademicYearAddTermsFormValues);
      setAddTermsState({ status: 'idle' });
      setDetailState({ status: 'success', academicYear: initialAcademicYear });
      return;
    }

    if (!hasValidAcademicYearId) {
      setDetailState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setDetailState({ status: 'loading' });

    getAcademicYearById({
      academicYearId: parsedAcademicYearId,
      signal: abortController.signal,
    })
      .then((response) => {
        form.setValues(mapAcademicYearDetailToFormValues(response));
        setIsEditing(false);
        setIsAddingTerms(false);
        setSaveState({ status: 'idle' });
        setStatusShiftState({ status: 'idle' });
        addTermsForm.setValues(initialAcademicYearAddTermsFormValues);
        setAddTermsState({ status: 'idle' });
        setDetailState({ status: 'success', academicYear: response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setDetailState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic year detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidAcademicYearId, initialAcademicYear, parsedAcademicYearId]);

  useEffect(() => {
    if (saveState.status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveState((current) => (current.status === 'success' ? { status: 'idle' } : current));
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveState.status]);

  useEffect(() => {
    if (statusShiftState.status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatusShiftState((current) =>
        current.status === 'success' ? { status: 'idle' } : current
      );
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [statusShiftState.status]);

  useEffect(() => {
    if (addTermsState.status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAddTermsState((current) => (current.status === 'success' ? { status: 'idle' } : current));
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [addTermsState.status]);

  if (detailState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Academic Year Detail"
        description="Loading academic year detail."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Year"
            description="The academic year detail is loading."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading academic year">
                Fetching academic year {academicYearId ?? 'unknown'}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Use academic year search to locate the record again, or return to create to add another one.">
            <Button component={Link} to="/academics/academic-years/search" variant="default">
              Back to search
            </Button>
            <Button component={Link} to="/academics/academic-years/create">
              Create academic year
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  if (detailState.status === 'error') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Academic Year Detail"
        description="Academic year detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Year"
            description="The detail page could not load this academic year."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Academic year detail unavailable">
                {detailState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to academic year search or create a new academic year.">
            <Button component={Link} to="/academics/academic-years/search" variant="default">
              Back to search
            </Button>
            <Button component={Link} to="/academics/academic-years/create">
              Create academic year
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const detail = detailState.academicYear;
  const saveInProgress = saveState.status === 'saving';
  const saveError = saveState.status === 'error' ? saveState.message : null;
  const saveSucceeded = saveState.status === 'success';
  const statusShiftInProgress = statusShiftState.status === 'saving';
  const statusShiftError = statusShiftState.status === 'error' ? statusShiftState.message : null;
  const statusShiftSucceeded = statusShiftState.status === 'success';
  const addTermsInProgress = addTermsState.status === 'saving';
  const addTermsError = addTermsState.status === 'error' ? addTermsState.message : null;
  const addTermsSucceeded = addTermsState.status === 'success';
  const hasPendingMutation = saveInProgress || statusShiftInProgress || addTermsInProgress;
  const canSaveChanges = hasAcademicYearDetailChanges(detail, form.values);
  const sortedTerms = [...detail.terms].sort((left, right) => left.sortOrder - right.sortOrder);
  const currentAcademicYearStatusCode = getAcademicYearStatusCode(detail);

  function renderAddTermsActions() {
    return (
      <Group gap="sm" wrap="wrap" justify="flex-end">
        <Button
          type="button"
          variant="light"
          onClick={handleAddTermRow}
          disabled={addTermsInProgress}
        >
          Add row
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={handleCancelAddingTerms}
          disabled={addTermsInProgress}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => {
            void handleSaveNewTerms();
          }}
          loading={addTermsInProgress}
          disabled={addTermsForm.values.terms.length === 0}
        >
          Save terms
        </Button>
      </Group>
    );
  }

  async function handleSaveEdit() {
    if (saveInProgress) {
      return;
    }

    try {
      const request = buildPatchAcademicYearRequest(detail, form.values);

      if (Object.keys(request).length === 0) {
        setSaveState({ status: 'idle' });
        setIsEditing(false);
        return;
      }

      setSaveState({ status: 'saving' });
      const updatedAcademicYear = await patchAcademicYear({
        academicYearId: detail.academicYearId,
        request,
      });
      form.setValues(mapAcademicYearDetailToFormValues(updatedAcademicYear));
      setDetailState({ status: 'success', academicYear: updatedAcademicYear });
      setSaveState({ status: 'success' });
      setIsEditing(false);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save academic year detail.'),
      });
    }
  }

  async function handleShiftStatus(direction: AcademicYearStatusShiftDirection) {
    if (statusShiftInProgress) {
      return;
    }

    try {
      setStatusShiftState({ status: 'saving' });
      const updatedAcademicYear = await shiftAcademicYearStatus({
        academicYearId: detail.academicYearId,
        direction,
      });
      form.setValues(mapAcademicYearDetailToFormValues(updatedAcademicYear));
      setDetailState({ status: 'success', academicYear: updatedAcademicYear });
      setStatusShiftState({ status: 'success' });
    } catch (error) {
      setStatusShiftState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to shift academic year status.'),
      });
    }
  }

  function handleStartAddingTerms() {
    setSaveState({ status: 'idle' });
    setAddTermsState({ status: 'idle' });
    addTermsForm.setValues({
      terms: [{ ...initialAcademicYearTermFormValues }],
    });
    setIsAddingTerms(true);
  }

  function handleCancelAddingTerms() {
    addTermsForm.setValues(initialAcademicYearAddTermsFormValues);
    setAddTermsState({ status: 'idle' });
    setIsAddingTerms(false);
  }

  function handleAddTermRow() {
    addTermsForm.insertListItem('terms', { ...initialAcademicYearTermFormValues });
  }

  function handleRemoveTermRow(index: number) {
    addTermsForm.removeListItem('terms', index);
  }

  async function handleSaveNewTerms() {
    if (addTermsInProgress) {
      return;
    }

    try {
      const request = buildPostAcademicYearTermsRequest(detail, addTermsForm.values.terms);

      setAddTermsState({ status: 'saving' });
      const updatedAcademicYear = await postAcademicYearTerms({
        academicYearId: detail.academicYearId,
        request,
      });
      form.setValues(mapAcademicYearDetailToFormValues(updatedAcademicYear));
      addTermsForm.setValues(initialAcademicYearAddTermsFormValues);
      setDetailState({ status: 'success', academicYear: updatedAcademicYear });
      setAddTermsState({ status: 'success' });
      setIsAddingTerms(false);
    } catch (error) {
      setAddTermsState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to add academic year terms.'),
      });
    }
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={detail.name}
      description=""
      badge={
        <Group gap="sm">
          <Badge variant="light" color={detail.active ? 'green' : 'gray'}>
            {detail.active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="light" color={detail.isPublished ? 'blue' : 'gray'}>
            {detail.isPublished ? 'Published' : 'Unpublished'}
          </Badge>
        </Group>
      }
    >
      <Stack gap={0}>
        {saveError ? (
          <RecordPageSection
            title="Save Status"
            description="Resolve the current validation or API error before trying again."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to save academic year changes">
                {saveError}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <WorkflowStatusStepperSection
          title="Academic Year Status"
          description="This tracker shows the configured academic year workflow steps."
          statuses={academicYearStatuses}
          currentStatusCode={currentAcademicYearStatusCode}
          isLoading={academicYearStatusesLoading}
          loadError={academicYearStatusesError}
          shiftError={statusShiftError}
          shiftSucceeded={statusShiftSucceeded}
          isShifting={statusShiftInProgress}
          disableShiftControls={isEditing || isAddingTerms}
          isConditionalStatus={isConditionalAcademicYearStatus}
          emptyTitle="No academic year statuses configured"
          emptyMessage="Add academic year statuses before using the status tracker."
          invisibleTitle="No visible academic year statuses"
          invisibleMessage="No academic year statuses are available for this record."
          missingCurrentStatusMessage="Current academic year status is not available on the detail response yet."
          onStepDown={() => {
            void handleShiftStatus('DOWN');
          }}
          onStepUp={() => {
            void handleShiftStatus('UP');
          }}
        />

        <RecordPageSection
          title="Academic Year"
          action={
            isEditing ? (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                <Button
                  onClick={() => {
                    form.setValues(mapAcademicYearDetailToFormValues(detail));
                    setSaveState({ status: 'idle' });
                    setIsEditing(false);
                  }}
                  variant="default"
                  disabled={hasPendingMutation}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    void handleSaveEdit();
                  }}
                  loading={saveInProgress}
                  disabled={!canSaveChanges || addTermsInProgress}
                >
                  Save changes
                </Button>
              </Group>
            ) : (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                {saveSucceeded ? (
                  <Text size="sm" c="teal">
                    Changes saved.
                  </Text>
                ) : null}
                <Button
                  onClick={() => {
                    handleCancelAddingTerms();
                    setSaveState({ status: 'idle' });
                    setIsEditing(true);
                  }}
                  variant="light"
                  disabled={addTermsInProgress}
                >
                  Edit details
                </Button>
              </Group>
            )
          }
        >
          <ReadOnlyField
            label="Academic year ID"
            value={displayValue(detail.academicYearId)}
            span={{ base: 12, md: 4 }}
          />
          {isEditing ? (
            <>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  withAsterisk
                  label="Code"
                  maxLength={20}
                  {...form.getInputProps('code')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  withAsterisk
                  label="Name"
                  maxLength={100}
                  {...form.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateInput
                  withAsterisk
                  value={parseDateInputValue(form.values.startDate)}
                  onChange={(value) => {
                    form.setFieldValue('startDate', normalizeDateInputValue(value));
                  }}
                  valueFormat="YYYY-MM-DD"
                  label="Start date"
                  placeholder="YYYY-MM-DD"
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateInput
                  withAsterisk
                  value={parseDateInputValue(form.values.endDate)}
                  onChange={(value) => {
                    form.setFieldValue('endDate', normalizeDateInputValue(value));
                  }}
                  valueFormat="YYYY-MM-DD"
                  label="End date"
                  placeholder="YYYY-MM-DD"
                  clearable
                />
              </Grid.Col>
            </>
          ) : (
            <>
              <ReadOnlyField
                label="Code"
                value={displayValue(detail.code)}
                span={{ base: 12, md: 4 }}
              />
              <ReadOnlyField
                label="Name"
                value={displayValue(detail.name)}
                span={{ base: 12, md: 4 }}
              />
              <ReadOnlyField
                label="Start date"
                value={displayDate(detail.startDate)}
                span={{ base: 12, md: 3 }}
              />
              <ReadOnlyField
                label="End date"
                value={displayDate(detail.endDate)}
                span={{ base: 12, md: 3 }}
              />
            </>
          )}
          <ReadOnlyField
            label="Active"
            value={displayValue(detail.active)}
            span={{ base: 12, md: 3 }}
          />
          <ReadOnlyField
            label="Published"
            value={displayValue(detail.isPublished)}
            span={{ base: 12, md: 3 }}
          />
        </RecordPageSection>

        <RecordPageSection
          title="Academic Terms"
          action={
            isEditing ? null : isAddingTerms ? (
              renderAddTermsActions()
            ) : (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                {addTermsSucceeded ? (
                  <Text size="sm" c="teal">
                    Terms added.
                  </Text>
                ) : null}
                <Button
                  type="button"
                  variant="light"
                  onClick={handleStartAddingTerms}
                  disabled={saveInProgress}
                >
                  Add terms
                </Button>
              </Group>
            )
          }
        >
          <Grid.Col span={12}>
            <Stack gap="md">
              {addTermsError ? (
                <Alert color="red" title="Unable to add academic terms">
                  {addTermsError}
                </Alert>
              ) : null}

              {sortedTerms.length === 0 ? (
                <Alert color="gray" title="No terms on this academic year">
                  {isAddingTerms
                    ? 'This academic year does not have any terms yet. Use the rows below to add the first ones.'
                    : 'This academic year was created without nested academic terms.'}
                </Alert>
              ) : (
                <Table.ScrollContainer minWidth={760}>
                  <Table withTableBorder withColumnBorders striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Sort order</Table.Th>
                        <Table.Th>Code</Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Start date</Table.Th>
                        <Table.Th>End date</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Active</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {sortedTerms.map((term) => (
                        <Table.Tr key={term.termId}>
                          <Table.Td>{term.sortOrder}</Table.Td>
                          <Table.Td>
                            <Link
                              to={`/academics/academic-term/${term.termId}`}
                              state={{ academicYearId: detail.academicYearId }}
                            >
                              {term.code}
                            </Link>
                          </Table.Td>
                          <Table.Td>{term.name}</Table.Td>
                          <Table.Td>{displayDate(term.startDate)}</Table.Td>
                          <Table.Td>{displayDate(term.endDate)}</Table.Td>
                          <Table.Td>
                            {displayValue(term.termStatusName ?? term.termStatusCode)}
                          </Table.Td>
                          <Table.Td>{displayValue(term.active)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}

              {isAddingTerms ? (
                <>
                  {addTermsForm.values.terms.length === 0 ? (
                    <Alert color="gray" title="No new term rows">
                      Add a row before saving new academic terms.
                    </Alert>
                  ) : null}

                  {addTermsForm.values.terms.map((term, index) => (
                    <Paper key={`new-term-${index}`} withBorder p="md" radius="sm">
                      <Stack gap="md">
                        <Group justify="space-between" align="center" wrap="wrap">
                          <Text fw={600}>New term {index + 1}</Text>
                          <Button
                            type="button"
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              handleRemoveTermRow(index);
                            }}
                            disabled={addTermsInProgress}
                          >
                            Remove
                          </Button>
                        </Group>

                        <Grid gap="md">
                          <Grid.Col span={{ base: 12, md: 4 }}>
                            <TextInput
                              withAsterisk
                              label="Code"
                              placeholder="FALL-2026"
                              maxLength={20}
                              {...addTermsForm.getInputProps(`terms.${index}.code`)}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 8 }}>
                            <TextInput
                              withAsterisk
                              label="Name"
                              placeholder="Fall 2026"
                              maxLength={100}
                              {...addTermsForm.getInputProps(`terms.${index}.name`)}
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 4 }}>
                            <DateInput
                              withAsterisk
                              value={parseDateInputValue(term.startDate)}
                              onChange={(value) => {
                                addTermsForm.setFieldValue(
                                  `terms.${index}.startDate`,
                                  normalizeDateInputValue(value)
                                );
                              }}
                              valueFormat="YYYY-MM-DD"
                              label="Start date"
                              placeholder="YYYY-MM-DD"
                              clearable
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 4 }}>
                            <DateInput
                              withAsterisk
                              value={parseDateInputValue(term.endDate)}
                              onChange={(value) => {
                                addTermsForm.setFieldValue(
                                  `terms.${index}.endDate`,
                                  normalizeDateInputValue(value)
                                );
                              }}
                              valueFormat="YYYY-MM-DD"
                              label="End date"
                              placeholder="YYYY-MM-DD"
                              clearable
                            />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 4 }}>
                            <TextInput
                              withAsterisk
                              label="Sort order"
                              placeholder="202630"
                              inputMode="numeric"
                              {...addTermsForm.getInputProps(`terms.${index}.sortOrder`)}
                            />
                          </Grid.Col>
                        </Grid>
                      </Stack>
                    </Paper>
                  ))}

                  {renderAddTermsActions()}
                </>
              ) : null}
            </Stack>
          </Grid.Col>
        </RecordPageSection>
      </Stack>
    </RecordPageShell>
  );
}
