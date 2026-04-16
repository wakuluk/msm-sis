import { useEffect, useState, type ComponentProps } from 'react';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Alert, Badge, Button, Grid, Group, Stack, Text, TextInput } from '@mantine/core';
import { Link, useLocation, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import { WorkflowStatusStepperSection } from '@/components/status/WorkflowStatusStepperSection';
import {
  getAcademicTermById,
  getAcademicTermCourseOfferings,
  getAcademicTermStatuses,
  patchAcademicTerm,
  shiftAcademicTermStatus,
} from '@/services/academic-years-service';
import {
  buildPatchAcademicTermRequest,
  hasAcademicTermDetailChanges,
  mapAcademicTermDetailToFormValues,
} from '@/services/mappers/academic-term-mappers';
import type {
  CourseOfferingSearchResultResponse,
  CourseOfferingSearchResultsList,
  CourseOfferingSearchSortBy,
  CourseOfferingSortDirection,
} from '@/services/schemas/catalog-schemas';
import type {
  AcademicTermDetailFormValues,
  AcademicTermResponse,
  AcademicTermStatusShiftDirection,
  AcademicTermStatusesResponse,
} from '@/services/schemas/academic-years-schemas';
import { initialAcademicTermDetailFormValues } from '@/services/schemas/academic-years-schemas';

type AcademicTermDetailLocationState = {
  academicYearId?: number;
};

type AcademicTermDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; academicTerm: AcademicTermResponse };

type AcademicTermStatusShiftState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicTermDetailSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicTermCourseOfferingsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; courseOfferings: CourseOfferingSearchResultsList };

const emptyCourseOfferingResults: CourseOfferingSearchResultResponse[] = [];

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

function displayDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
}

function formatCredits(minCredits: number, maxCredits: number, variableCredit: boolean): string {
  if (variableCredit && minCredits !== maxCredits) {
    return `${minCredits.toFixed(2)}-${maxCredits.toFixed(2)}`;
  }

  return minCredits.toFixed(2);
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

const courseOfferingResultsColumns: ColumnDef<CourseOfferingSearchResultResponse>[] = [
  {
    accessorKey: 'courseCode',
    header: 'Course',
    size: 126,
    meta: { sortBy: 'courseCode' satisfies CourseOfferingSearchSortBy },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    size: 320,
    meta: { sortBy: 'title' satisfies CourseOfferingSearchSortBy },
  },
  {
    accessorKey: 'subjectCode',
    header: 'Subject',
    size: 116,
    meta: { sortBy: 'subjectCode' satisfies CourseOfferingSearchSortBy },
  },
  {
    id: 'credits',
    header: 'Credits',
    size: 112,
    cell: ({ row }) =>
      formatCredits(row.original.minCredits, row.original.maxCredits, row.original.variableCredit),
    meta: { sortBy: 'minCredits' satisfies CourseOfferingSearchSortBy },
  },
  {
    accessorKey: 'offeringStatusName',
    header: 'Status',
    size: 180,
    meta: { sortBy: 'offeringStatusCode' satisfies CourseOfferingSearchSortBy },
  },
];

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function isConditionalAcademicTermStatus(code: string | null | undefined): boolean {
  const normalizedCode = code?.trim().toUpperCase() ?? null;

  return normalizedCode === 'CANCELLED';
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

export function AcademicTermDetailPage() {
  const { academicTermId } = useParams<{ academicTermId: string }>();
  const location = useLocation();
  const locationState = (location.state as AcademicTermDetailLocationState | null) ?? null;
  const fallbackAcademicYearId =
    typeof locationState?.academicYearId === 'number' && locationState.academicYearId > 0
      ? locationState.academicYearId
      : null;
  const parsedAcademicTermId = Number(academicTermId);
  const hasValidAcademicTermId = Number.isInteger(parsedAcademicTermId) && parsedAcademicTermId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [detailState, setDetailState] = useState<AcademicTermDetailPageState>({ status: 'loading' });
  const [saveState, setSaveState] = useState<AcademicTermDetailSaveState>({ status: 'idle' });
  const [statusShiftState, setStatusShiftState] = useState<AcademicTermStatusShiftState>({
    status: 'idle',
  });
  const [courseOfferingsSortBy, setCourseOfferingsSortBy] =
    useState<CourseOfferingSearchSortBy>('courseCode');
  const [courseOfferingsSortDirection, setCourseOfferingsSortDirection] =
    useState<CourseOfferingSortDirection>('asc');
  const [courseOfferingsState, setCourseOfferingsState] = useState<AcademicTermCourseOfferingsState>(
    { status: 'loading' }
  );
  const [academicTermStatuses, setAcademicTermStatuses] = useState<AcademicTermStatusesResponse>([]);
  const [academicTermStatusesLoading, setAcademicTermStatusesLoading] = useState(true);
  const [academicTermStatusesError, setAcademicTermStatusesError] = useState<string | null>(null);
  const form = useForm<AcademicTermDetailFormValues>({
    initialValues: initialAcademicTermDetailFormValues,
  });

  useEffect(() => {
    const abortController = new AbortController();
    setAcademicTermStatusesLoading(true);
    setAcademicTermStatusesError(null);

    getAcademicTermStatuses({ signal: abortController.signal })
      .then((response) => {
        setAcademicTermStatuses([...response].sort((left, right) => left.order - right.order));
        setAcademicTermStatusesLoading(false);
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAcademicTermStatuses([]);
        setAcademicTermStatusesError(getErrorMessage(error, 'Failed to load academic term statuses.'));
        setAcademicTermStatusesLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, []);

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
    if (!hasValidAcademicTermId) {
      setDetailState({
        status: 'error',
        message: 'Academic term ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setDetailState({ status: 'loading' });

    getAcademicTermById({
      academicTermId: parsedAcademicTermId,
      signal: abortController.signal,
    })
      .then((response) => {
        form.setValues(mapAcademicTermDetailToFormValues(response));
        setIsEditing(false);
        setSaveState({ status: 'idle' });
        setStatusShiftState({ status: 'idle' });
        setDetailState({ status: 'success', academicTerm: response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setDetailState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic term detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidAcademicTermId, parsedAcademicTermId]);

  useEffect(() => {
    if (!hasValidAcademicTermId) {
      setCourseOfferingsState({
        status: 'error',
        message: 'Academic term ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setCourseOfferingsState({ status: 'loading' });

    getAcademicTermCourseOfferings({
      academicTermId: parsedAcademicTermId,
      sortBy: courseOfferingsSortBy,
      sortDirection: courseOfferingsSortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        setCourseOfferingsState({ status: 'success', courseOfferings: response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setCourseOfferingsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load course offerings for this term.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [
    courseOfferingsSortBy,
    courseOfferingsSortDirection,
    hasValidAcademicTermId,
    parsedAcademicTermId,
  ]);

  async function handleShiftStatus(direction: AcademicTermStatusShiftDirection) {
    if (statusShiftState.status === 'saving' || detailState.status !== 'success') {
      return;
    }

    try {
      setStatusShiftState({ status: 'saving' });
      const updatedAcademicTerm = await shiftAcademicTermStatus({
        academicTermId: detailState.academicTerm.termId,
        direction,
      });
      form.setValues(mapAcademicTermDetailToFormValues(updatedAcademicTerm));
      setDetailState({ status: 'success', academicTerm: updatedAcademicTerm });
      setStatusShiftState({ status: 'success' });
    } catch (error) {
      setStatusShiftState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to shift academic term status.'),
      });
    }
  }

  function handleToggleCourseOfferingsSort(nextSortBy: CourseOfferingSearchSortBy) {
    if (nextSortBy === courseOfferingsSortBy) {
      setCourseOfferingsSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setCourseOfferingsSortBy(nextSortBy);
    setCourseOfferingsSortDirection('asc');
  }

  async function handleSaveEdit(detail: AcademicTermResponse) {
    if (saveState.status === 'saving') {
      return;
    }

    try {
      const request = buildPatchAcademicTermRequest(detail, form.values);

      if (Object.keys(request).length === 0) {
        setSaveState({ status: 'idle' });
        setIsEditing(false);
        return;
      }

      setSaveState({ status: 'saving' });
      const updatedAcademicTerm = await patchAcademicTerm({
        academicTermId: detail.termId,
        request,
      });
      form.setValues(mapAcademicTermDetailToFormValues(updatedAcademicTerm));
      setDetailState({ status: 'success', academicTerm: updatedAcademicTerm });
      setSaveState({ status: 'success' });
      setIsEditing(false);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save academic term detail.'),
      });
    }
  }

  const courseOfferingsTableData =
    courseOfferingsState.status === 'success'
      ? courseOfferingsState.courseOfferings
      : emptyCourseOfferingResults;
  const courseOfferingsTable = useReactTable({
    columns: courseOfferingResultsColumns,
    data: courseOfferingsTableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.courseOfferingId),
  });

  if (detailState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Academic Term Detail"
        description="Loading academic term detail."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Term"
            description="The academic term detail is loading."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading academic term">
                Fetching academic term {academicTermId ?? 'unknown'}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the parent academic year or back to academic year search.">
            {fallbackAcademicYearId ? (
              <Button
                component={Link}
                to={`/academics/academic-years/${fallbackAcademicYearId}`}
                variant="default"
              >
                Back to academic year
              </Button>
            ) : null}
            <Button component={Link} to="/academics/academic-years/search">
              Back to search
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
        title="Academic Term Detail"
        description="Academic term detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Term"
            description="The detail page could not load this academic term."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Academic term detail unavailable">
                {detailState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the parent academic year or back to academic year search.">
            {fallbackAcademicYearId ? (
              <Button
                component={Link}
                to={`/academics/academic-years/${fallbackAcademicYearId}`}
                variant="default"
              >
                Back to academic year
              </Button>
            ) : null}
            <Button component={Link} to="/academics/academic-years/search">
              Back to search
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const detail = detailState.academicTerm;
  const academicYearPath = `/academics/academic-years/${detail.academicYearId}`;
  const saveInProgress = saveState.status === 'saving';
  const saveError = saveState.status === 'error' ? saveState.message : null;
  const saveSucceeded = saveState.status === 'success';
  const statusShiftInProgress = statusShiftState.status === 'saving';
  const statusShiftError = statusShiftState.status === 'error' ? statusShiftState.message : null;
  const statusShiftSucceeded = statusShiftState.status === 'success';
  const hasPendingMutation = saveInProgress || statusShiftInProgress;
  const canSaveChanges = hasAcademicTermDetailChanges(detail, form.values);

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={detail.name}
      description="Review the academic term configuration, workflow status, and parent academic year."
      badge={
        <Group gap="sm">
          <Badge variant="light" color={detail.active ? 'green' : 'gray'}>
            {detail.active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="light" color="blue">
            {displayValue(detail.termStatusName ?? detail.termStatusCode)}
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
              <Alert color="red" title="Unable to save academic term changes">
                {saveError}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <WorkflowStatusStepperSection
          title="Academic Term Status"
          description="This tracker shows the configured academic term workflow steps."
          statuses={academicTermStatuses}
          currentStatusCode={detail.termStatusCode}
          isLoading={academicTermStatusesLoading}
          loadError={academicTermStatusesError}
          shiftError={statusShiftError}
          shiftSucceeded={statusShiftSucceeded}
          isShifting={statusShiftInProgress}
          disableShiftControls={isEditing}
          isConditionalStatus={isConditionalAcademicTermStatus}
          emptyTitle="No academic term statuses configured"
          emptyMessage="Add academic term statuses before using the status tracker."
          invisibleTitle="No visible academic term statuses"
          invisibleMessage="No academic term statuses are available for this record."
          missingCurrentStatusMessage="Current academic term status is not available on the detail response."
          onStepDown={() => {
            void handleShiftStatus('DOWN');
          }}
          onStepUp={() => {
            void handleShiftStatus('UP');
          }}
        />

        <RecordPageSection
          title="Academic Term"
          description="These fields reflect the current academic term detail."
          action={
            isEditing ? (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                <Button
                  onClick={() => {
                    form.setValues(mapAcademicTermDetailToFormValues(detail));
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
                    void handleSaveEdit(detail);
                  }}
                  loading={saveInProgress}
                  disabled={!canSaveChanges || statusShiftInProgress}
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
                    form.setValues(mapAcademicTermDetailToFormValues(detail));
                    setSaveState({ status: 'idle' });
                    setIsEditing(true);
                  }}
                  variant="light"
                  disabled={statusShiftInProgress}
                >
                  Edit details
                </Button>
                <Button component={Link} to={academicYearPath} variant="default">
                  View academic year
                </Button>
              </Group>
            )
          }
        >
          <ReadOnlyField
            label="Academic term ID"
            value={displayValue(detail.termId)}
            span={{ base: 12, md: 4 }}
          />
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
              <Grid.Col span={{ base: 12, md: 5 }}>
                <TextInput
                  withAsterisk
                  label="Name"
                  maxLength={100}
                  {...form.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  withAsterisk
                  label="Sort order"
                  inputMode="numeric"
                  {...form.getInputProps('sortOrder')}
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
                span={{ base: 12, md: 5 }}
              />
              <ReadOnlyField
                label="Sort order"
                value={displayValue(detail.sortOrder)}
                span={{ base: 12, md: 3 }}
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
            label="Current status"
            value={displayValue(detail.termStatusName ?? detail.termStatusCode)}
            span={{ base: 12, md: 3 }}
          />
          <ReadOnlyField
            label="Active"
            value={displayValue(detail.active)}
            span={{ base: 12, md: 3 }}
          />
          <ReadOnlyField
            label="Updated by"
            value={displayValue(detail.updatedBy)}
            span={{ base: 12, md: 3 }}
          />
          <ReadOnlyField
            label="Last updated"
            value={displayDateTime(detail.lastUpdated)}
            span={{ base: 12, md: 4 }}
          />
        </RecordPageSection>

        <RecordPageSection
          title="Course Offerings"
          description="These course offerings are scheduled within this academic term."
        >
          <Grid.Col span={12}>
            <Stack gap="md">
              {courseOfferingsState.status === 'loading' ? (
                <Text size="sm" c="dimmed">
                  Loading course offerings for this academic term.
                </Text>
              ) : courseOfferingsState.status === 'error' ? (
                <Alert color="red" title="Unable to load course offerings">
                  {courseOfferingsState.message}
                </Alert>
              ) : courseOfferingsState.courseOfferings.length === 0 ? (
                <Alert color="gray" title="No course offerings on this term">
                  No course offerings are currently associated with this academic term.
                </Alert>
              ) : (
                <SearchResultsTable
                  table={courseOfferingsTable}
                  sortBy={courseOfferingsSortBy}
                  sortDirection={courseOfferingsSortDirection}
                  onToggleSort={handleToggleCourseOfferingsSort}
                />
              )}
            </Stack>
          </Grid.Col>
        </RecordPageSection>

        <RecordPageFooter description="Return to the parent academic year or back to academic year search.">
          <Button component={Link} to={academicYearPath} variant="default">
            Back to academic year
          </Button>
          <Button component={Link} to="/academics/academic-years/search">
            Back to search
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
