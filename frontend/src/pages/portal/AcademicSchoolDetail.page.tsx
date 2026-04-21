import { useEffect, useState, type ComponentProps } from 'react';
import { Alert, Badge, Button, Grid, Stack, Table, TextInput } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { getAcademicSchoolById } from '@/services/academic-school-service';
import type { AcademicSchoolResponse } from '@/services/schemas/academic-school-schemas';

type AcademicSchoolDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; school: AcademicSchoolResponse };

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

function compareDepartments(
  left: AcademicSchoolResponse['departments'][number],
  right: AcademicSchoolResponse['departments'][number]
): number {
  return left.name.localeCompare(right.name) || left.code.localeCompare(right.code);
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

export function AcademicSchoolDetailPage() {
  const navigate = useNavigate();
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/schools',
  });
  const { schoolId } = useParams<{ schoolId: string }>();
  const parsedSchoolId = Number(schoolId);
  const hasValidSchoolId = Number.isInteger(parsedSchoolId) && parsedSchoolId > 0;
  const [pageState, setPageState] = useState<AcademicSchoolDetailPageState>({
    status: 'loading',
  });

  useEffect(() => {
    if (!hasValidSchoolId) {
      setPageState({
        status: 'error',
        message: 'Academic school ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setPageState({ status: 'loading' });

    getAcademicSchoolById({
      schoolId: parsedSchoolId,
      signal: abortController.signal,
    })
      .then((school) => {
        setPageState({ status: 'success', school });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load academic school detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidSchoolId, parsedSchoolId]);

  if (pageState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Academic School Detail"
        description="Loading academic school detail."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic School"
            description="The academic school detail is loading."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading academic school">
                Fetching academic school {schoolId ?? 'unknown'}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page.">
            <Button onClick={handleBack}>
              Back
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
        title="Academic School Detail"
        description="Academic school detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="red">
            Load failed
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Academic School"
            description="Review the error below and return to the school list."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to load academic school">
                {pageState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous page.">
            <Button onClick={handleBack}>
              Back
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const { school } = pageState;
  const departments = [...school.departments].sort(compareDepartments);

  function handleOpenAcademicDepartmentDetail(departmentId: number) {
    navigate(`/academics/departments/${departmentId}`, {
      state: { source: 'school', schoolId: school.schoolId },
    });
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={school.name}
      description="Review this academic school and the departments assigned to it."
      badge={
        <Badge variant="light" size="lg" color={school.active ? 'green' : 'gray'}>
          {school.active ? 'Active' : 'Inactive'}
        </Badge>
      }
    >
      <Stack gap={0}>
        <RecordPageSection
          title="Academic School"
          description="Core academic school information."
        >
          <ReadOnlyField label="Code" value={displayValue(school.code)} />
          <ReadOnlyField label="Name" value={displayValue(school.name)} />
          <ReadOnlyField label="Active" value={displayValue(school.active)} />
          <ReadOnlyField
            label="Department count"
            value={displayValue(departments.length)}
            span={{ base: 12, md: 6 }}
          />
        </RecordPageSection>

        <RecordPageSection
          title="Departments"
          description="Departments currently assigned to this academic school."
        >
          <Grid.Col span={12}>
            {departments.length === 0 ? (
              <Alert color="gray" title="No departments in this school">
                This academic school does not have any departments assigned yet.
              </Alert>
            ) : (
              <Table.ScrollContainer minWidth={720}>
                <Table withTableBorder withColumnBorders striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Active</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {departments.map((department) => (
                      <Table.Tr
                        key={department.departmentId}
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          handleOpenAcademicDepartmentDetail(department.departmentId);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleOpenAcademicDepartmentDetail(department.departmentId);
                          }
                        }}
                      >
                        <Table.Td>{department.code}</Table.Td>
                        <Table.Td>{department.name}</Table.Td>
                        <Table.Td>{department.active ? 'Yes' : 'No'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Grid.Col>
        </RecordPageSection>

        <RecordPageFooter description="Return to the previous page.">
          <Button onClick={handleBack} variant="default">
            Back
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
