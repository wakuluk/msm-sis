import { useEffect, useState, type ComponentProps } from 'react';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { Alert, Badge, Button, Grid, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { Link, useLocation, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import {
  getAcademicTermById,
  patchAcademicTerm,
} from '@/services/academic-term-group-service';
import {
  buildPatchAcademicTermGroupRequest,
  hasAcademicTermGroupDetailChanges,
  mapAcademicTermGroupDetailToFormValues,
} from '@/services/mappers/academic-term-group-mappers';
import {
  initialAcademicTermDetailFormValues,
  type AcademicTermDetailFormValues,
  type AcademicTermResponse,
} from '@/services/schemas/academic-years-schemas';

type AcademicTermGroupDetailLocationState = {
  academicYearId?: number;
};

type AcademicTermGroupDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; academicTermGroup: AcademicTermResponse };

type AcademicTermGroupDetailSaveState =
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

function compareAcademicTerms(
  left: AcademicTermResponse['subTerms'][number],
  right: AcademicTermResponse['subTerms'][number]
): number {
  return (
    left.sortOrder - right.sortOrder ||
    left.code.localeCompare(right.code) ||
    left.subTermId - right.subTermId
  );
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

export function AcademicTermGroupDetailPage() {
  const { termId } = useParams<{ termId: string }>();
  const location = useLocation();
  const locationState = (location.state as AcademicTermGroupDetailLocationState | null) ?? null;
  const fallbackAcademicYearId =
    typeof locationState?.academicYearId === 'number' && locationState.academicYearId > 0
      ? locationState.academicYearId
      : null;
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: fallbackAcademicYearId
      ? `/academics/academic-years/${fallbackAcademicYearId}`
      : '/academics/academic-years/search',
  });
  const parsedTermId = Number(termId);
  const hasValidTermId = Number.isInteger(parsedTermId) && parsedTermId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [detailState, setDetailState] = useState<AcademicTermGroupDetailPageState>({
    status: 'loading',
  });
  const [saveState, setSaveState] = useState<AcademicTermGroupDetailSaveState>({ status: 'idle' });
  const form = useForm<AcademicTermDetailFormValues>({
    initialValues: initialAcademicTermDetailFormValues,
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
    if (!hasValidTermId) {
      setDetailState({
        status: 'error',
        message: 'Term ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setDetailState({ status: 'loading' });

    getAcademicTermById({
      academicTermId: parsedTermId,
      signal: abortController.signal,
    })
      .then((response) => {
        form.setValues(mapAcademicTermGroupDetailToFormValues(response));
        setIsEditing(false);
        setSaveState({ status: 'idle' });
        setDetailState({ status: 'success', academicTermGroup: response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setDetailState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load term detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidTermId, parsedTermId]);

  async function handleSaveEdit(detail: AcademicTermResponse) {
    if (saveState.status === 'saving') {
      return;
    }

    try {
      const request = buildPatchAcademicTermGroupRequest(detail, form.values);

      if (Object.keys(request).length === 0) {
        setSaveState({ status: 'idle' });
        setIsEditing(false);
        return;
      }

      setSaveState({ status: 'saving' });
      const updatedAcademicTermGroup = await patchAcademicTerm({
        academicTermId: detail.termId,
        request,
      });
      form.setValues(mapAcademicTermGroupDetailToFormValues(updatedAcademicTermGroup));
      setDetailState({ status: 'success', academicTermGroup: updatedAcademicTermGroup });
      setSaveState({ status: 'success' });
      setIsEditing(false);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save term detail.'),
      });
    }
  }

  if (detailState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Term Detail"
        description="Loading term detail."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Term"
            description="The term detail is loading."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading term">
                Fetching term {termId ?? 'unknown'}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page.">
            {fallbackAcademicYearId ? (
              <Button
                component={Link}
                to={`/academics/academic-years/${fallbackAcademicYearId}`}
                variant="default"
              >
                View academic year
              </Button>
            ) : null}
            <Button onClick={handleBack}>
              Back
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
        title="Term Detail"
        description="Term detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Term"
            description="The detail page could not load this term."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Term detail unavailable">
                {detailState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page.">
            {fallbackAcademicYearId ? (
              <Button
                component={Link}
                to={`/academics/academic-years/${fallbackAcademicYearId}`}
                variant="default"
              >
                View academic year
              </Button>
            ) : null}
            <Button onClick={handleBack}>
              Back
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const detail = detailState.academicTermGroup;
  const academicYearPath = `/academics/academic-years/${detail.academicYearId}`;
  const sortedTerms = [...detail.subTerms].sort(compareAcademicTerms);
  const saveInProgress = saveState.status === 'saving';
  const saveError = saveState.status === 'error' ? saveState.message : null;
  const saveSucceeded = saveState.status === 'success';
  const canSaveChanges = hasAcademicTermGroupDetailChanges(detail, form.values);

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={detail.name}
      description="Review the term configuration and the sub terms assigned to it."
      badge={
        <Group gap="sm">
          <Badge variant="light" color="blue">
            {sortedTerms.length} {sortedTerms.length === 1 ? 'sub term' : 'sub terms'}
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
              <Alert color="red" title="Unable to save term changes">
                {saveError}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <RecordPageSection
          title="Term"
          description="These fields reflect the current term detail."
          action={
            isEditing ? (
              <Group gap="sm" wrap="wrap" justify="flex-end">
                <Button
                  onClick={() => {
                    form.setValues(mapAcademicTermGroupDetailToFormValues(detail));
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
                    form.setValues(mapAcademicTermGroupDetailToFormValues(detail));
                    setSaveState({ status: 'idle' });
                    setIsEditing(true);
                  }}
                  variant="light"
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
            label="Term ID"
            value={displayValue(detail.termId)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Academic year ID"
            value={displayValue(detail.academicYearId)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Assigned sub terms"
            value={displayValue(sortedTerms.length)}
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
              <Grid.Col span={{ base: 12, md: 8 }}>
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
                span={{ base: 12, md: 8 }}
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
        </RecordPageSection>

        <RecordPageSection
          title="Sub Terms"
          description="These sub terms are currently assigned to this term."
        >
          <Grid.Col span={12}>
            <Stack gap="md">
              {sortedTerms.length === 0 ? (
                <Alert color="gray" title="No sub terms in this term">
                  This term does not have any sub terms assigned yet.
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
                      {sortedTerms.map((subTerm) => (
                        <Table.Tr key={subTerm.subTermId}>
                          <Table.Td>{subTerm.sortOrder}</Table.Td>
                          <Table.Td>
                            <Link
                              to={`/academics/academic-sub-term/${subTerm.subTermId}`}
                              state={{ academicYearId: detail.academicYearId }}
                            >
                              {subTerm.code}
                            </Link>
                          </Table.Td>
                          <Table.Td>{subTerm.name}</Table.Td>
                          <Table.Td>{displayDate(subTerm.startDate)}</Table.Td>
                          <Table.Td>{displayDate(subTerm.endDate)}</Table.Td>
                          <Table.Td>
                            {displayValue(
                              subTerm.subTermStatusName ?? subTerm.subTermStatusCode
                            )}
                          </Table.Td>
                          <Table.Td>{displayValue(subTerm.active)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Stack>
          </Grid.Col>
        </RecordPageSection>

        <RecordPageFooter description="Return to the previous page.">
          <Button component={Link} to={academicYearPath} variant="default">
            View academic year
          </Button>
          <Button onClick={handleBack}>
            Back
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
