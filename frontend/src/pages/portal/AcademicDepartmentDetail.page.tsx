import { useEffect, useState, type ComponentProps } from 'react';
import { useForm } from '@mantine/form';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Alert, Badge, Button, Grid, Group, Stack, Switch, Text, TextInput } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { SearchResultsStateNotice } from '@/components/search/SearchResultsStateNotice';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import {
  getAcademicDepartmentById,
  patchAcademicDepartment,
} from '@/services/academic-department-service';
import {
  buildPatchAcademicDepartmentRequest,
  hasAcademicDepartmentDetailChanges,
  mapAcademicDepartmentDetailToFormValues,
} from '@/services/mappers/academic-department-mappers';
import type {
  AcademicDepartmentDetailFormValues,
  AcademicDepartmentResponse,
  AcademicDepartmentSubjectResponse,
  AcademicDepartmentSortBy,
  AcademicDepartmentSortDirection,
} from '@/services/schemas/academic-department-schemas';
import { initialAcademicDepartmentDetailFormValues } from '@/services/schemas/academic-department-schemas';

type AcademicDepartmentDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; department: AcademicDepartmentResponse };

type AcademicDepartmentDetailSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

const emptyAcademicDepartmentSubjects: AcademicDepartmentSubjectResponse[] = [];

const academicDepartmentSubjectColumns: ColumnDef<AcademicDepartmentSubjectResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 180,
    meta: { sortBy: 'code' satisfies AcademicDepartmentSortBy },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 360,
    meta: { sortBy: 'name' satisfies AcademicDepartmentSortBy },
  },
  {
    accessorKey: 'active',
    header: 'Active',
    size: 120,
    cell: ({ row }) => (row.original.active ? 'Yes' : 'No'),
    meta: { sortBy: 'active' satisfies AcademicDepartmentSortBy },
  },
];

function displayValue(value: boolean | number | string | null | undefined): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
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

export function AcademicDepartmentDetailPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const parsedDepartmentId = Number(departmentId);
  const hasValidDepartmentId = Number.isInteger(parsedDepartmentId) && parsedDepartmentId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [pageState, setPageState] = useState<AcademicDepartmentDetailPageState>({
    status: 'loading',
  });
  const [saveState, setSaveState] = useState<AcademicDepartmentDetailSaveState>({
    status: 'idle',
  });
  const [subjectSortBy, setSubjectSortBy] = useState<AcademicDepartmentSortBy>('code');
  const [subjectSortDirection, setSubjectSortDirection] =
    useState<AcademicDepartmentSortDirection>('asc');
  const form = useForm<AcademicDepartmentDetailFormValues>({
    initialValues: initialAcademicDepartmentDetailFormValues,
  });

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
    if (!hasValidDepartmentId) {
      setPageState({
        status: 'error',
        message: 'Academic department ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    const shouldSyncForm =
      pageState.status !== 'success' || pageState.department.departmentId !== parsedDepartmentId;

    if (shouldSyncForm) {
      setPageState({ status: 'loading' });
    }

    getAcademicDepartmentById({
      departmentId: parsedDepartmentId,
      sortBy: subjectSortBy,
      sortDirection: subjectSortDirection,
      signal: abortController.signal,
    })
      .then((department) => {
        if (shouldSyncForm) {
          form.setValues(mapAcademicDepartmentDetailToFormValues(department));
          setIsEditing(false);
          setSaveState({ status: 'idle' });
        }
        setPageState({ status: 'success', department });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic department detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidDepartmentId, parsedDepartmentId, subjectSortBy, subjectSortDirection]);

  async function handleSaveEdit(detail: AcademicDepartmentResponse) {
    if (saveState.status === 'saving') {
      return;
    }

    try {
      const request = buildPatchAcademicDepartmentRequest(detail, form.values);

      if (Object.keys(request).length === 0) {
        setSaveState({ status: 'idle' });
        setIsEditing(false);
        return;
      }

      setSaveState({ status: 'saving' });
      await patchAcademicDepartment({
        departmentId: detail.departmentId,
        request,
      });
      const refreshedDepartment = await getAcademicDepartmentById({
        departmentId: detail.departmentId,
        sortBy: subjectSortBy,
        sortDirection: subjectSortDirection,
      });
      form.setValues(mapAcademicDepartmentDetailToFormValues(refreshedDepartment));
      setPageState({ status: 'success', department: refreshedDepartment });
      setSaveState({ status: 'success' });
      setIsEditing(false);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save academic department detail.'),
      });
    }
  }

  function handleToggleSubjectSort(nextSortBy: AcademicDepartmentSortBy) {
    if (nextSortBy === subjectSortBy) {
      setSubjectSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSubjectSortBy(nextSortBy);
    setSubjectSortDirection('asc');
  }

  const subjectsTableData =
    pageState.status === 'success' ? pageState.department.subjects : emptyAcademicDepartmentSubjects;
  const academicDepartmentSubjectsTable = useReactTable({
    columns: academicDepartmentSubjectColumns,
    data: subjectsTableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.subjectId),
  });

  if (pageState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Academic Department Detail"
        description="Loading academic department detail."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Department"
            description="The academic department detail is loading."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading academic department">
                Fetching academic department {departmentId ?? 'unknown'}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to academic departments to select a different record.">
            <Button component={Link} to="/academics/departments">
              Back to departments
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  if (pageState.status === 'error') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Academic Department Detail"
        description="Academic department detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Department"
            description="The detail page could not load this academic department."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Academic department detail unavailable">
                {pageState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the academic department list.">
            <Button component={Link} to="/academics/departments">
              Back to departments
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const detail = pageState.department;
  const saveInProgress = saveState.status === 'saving';
  const saveError = saveState.status === 'error' ? saveState.message : null;
  const saveSucceeded = saveState.status === 'success';
  const canSaveChanges = hasAcademicDepartmentDetailChanges(detail, form.values);

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={detail.name}
      description="Review the academic department configuration."
      badge={
        <Group gap="sm">
          <Badge variant="light" color={detail.active ? 'green' : 'gray'}>
            {detail.active ? 'Active' : 'Inactive'}
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
              <Alert color="red" title="Unable to save academic department changes">
                {saveError}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <RecordPageSection
          title="Academic Department"
          description="These fields reflect the current academic department detail."
          action={
            isEditing ? (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                <Button
                  onClick={() => {
                    form.setValues(mapAcademicDepartmentDetailToFormValues(detail));
                    setSaveState({ status: 'idle' });
                    setIsEditing(false);
                  }}
                  variant="default"
                  disabled={saveInProgress}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    void handleSaveEdit(detail);
                  }}
                  loading={saveInProgress}
                  disabled={!canSaveChanges}
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
                    form.setValues(mapAcademicDepartmentDetailToFormValues(detail));
                    setSaveState({ status: 'idle' });
                    setIsEditing(true);
                  }}
                  variant="light"
                >
                  Edit details
                </Button>
              </Group>
            )
          }
        >
          <ReadOnlyField
            label="Academic department ID"
            value={displayValue(detail.departmentId)}
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
                  maxLength={255}
                  {...form.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Switch
                  label="Active"
                  checked={form.values.active}
                  onChange={(event) => {
                    form.setFieldValue('active', event.currentTarget.checked);
                  }}
                  mt={30}
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
                label="Active"
                value={displayValue(detail.active)}
                span={{ base: 12, md: 4 }}
              />
            </>
          )}
        </RecordPageSection>

        <RecordPageSection
          title="Academic Subjects"
          description="These subjects are currently associated with this department."
        >
          <Grid.Col span={12}>
            {detail.subjects.length === 0 ? (
              <SearchResultsStateNotice
                status="empty"
                idleTitle=""
                idleMessage=""
                loadingMessage=""
                emptyTitle="No subjects found"
                emptyMessage="Add academic subjects to this department before using this section."
              />
            ) : (
              <SearchResultsTable
                table={academicDepartmentSubjectsTable}
                sortBy={subjectSortBy}
                sortDirection={subjectSortDirection}
                onToggleSort={handleToggleSubjectSort}
              />
            )}
          </Grid.Col>
        </RecordPageSection>

        <RecordPageFooter description="Return to the academic department list.">
          <Button component={Link} to="/academics/departments">
            Back to departments
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
