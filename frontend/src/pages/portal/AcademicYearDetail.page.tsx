import { useEffect, useState, type ComponentProps } from 'react';
import { Alert, Badge, Button, Grid, Group, Stack, Table, TextInput } from '@mantine/core';
import { Link, useLocation, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { getAcademicYearById } from '@/services/academic-years-service';
import type { AcademicYearCreateResponse } from '@/services/schemas/academic-years-schemas';

type AcademicYearDetailLocationState = {
  academicYear?: AcademicYearCreateResponse;
};

type AcademicYearDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; academicYear: AcademicYearCreateResponse };

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
  const [detailState, setDetailState] = useState<AcademicYearDetailPageState>(() => {
    if (academicYear && academicYear.academicYearId === parsedAcademicYearId) {
      return { status: 'success', academicYear };
    }

    return { status: 'loading' };
  });

  useEffect(() => {
    if (academicYear && academicYear.academicYearId === parsedAcademicYearId) {
      setDetailState({ status: 'success', academicYear });
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
  }, [academicYear, hasValidAcademicYearId, parsedAcademicYearId]);

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
  const sortedTerms = [...detail.terms].sort((left, right) => left.sortOrder - right.sortOrder);

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={detail.name}
      description="Academic year detail loaded from the backend."
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
        <RecordPageSection
          title="Academic Year"
          description="Core academic year fields returned by the create endpoint."
        >
          <ReadOnlyField
            label="Academic year ID"
            value={displayValue(detail.academicYearId)}
            span={{ base: 12, md: 4 }}
          />
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
          description="Terms returned in the same create response, ordered by sort order."
        >
          <Grid.Col span={12}>
            {sortedTerms.length === 0 ? (
              <Alert color="gray" title="No terms on this academic year">
                This academic year was created without nested academic terms.
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
                        <Table.Td>{term.code}</Table.Td>
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
          </Grid.Col>
        </RecordPageSection>

        <RecordPageFooter description="Academic year detail can now be opened from create flow or search results.">
          <Button component={Link} to="/academics/academic-years/search" variant="default">
            Back to search
          </Button>
          <Button component={Link} to="/academics/academic-years/create">
            Create another academic year
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
