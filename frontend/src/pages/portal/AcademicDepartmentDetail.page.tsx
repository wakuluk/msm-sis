import { useEffect, useRef, useState } from 'react';
import { useForm } from '@mantine/form';
import { type ColumnDef, getCoreRowModel, type Row, useReactTable } from '@tanstack/react-table';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CreateAcademicSubjectModal } from '@/components/academic-department/CreateAcademicSubjectModal';
import { CourseCreateModal } from '@/components/course/CourseCreateModal';
import { useCourseCreateReferenceOptions } from '@/components/course/useCourseCreateReferenceOptions';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import { SearchResultsStateNotice } from '@/components/search/SearchResultsStateNotice';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import {
  createAcademicSubject,
  getAcademicDepartmentById,
  getAcademicDepartmentSubjectCourses,
  patchAcademicDepartment,
} from '@/services/academic-department-service';
import {
  buildCreateAcademicSubjectRequest,
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
  CourseResponse,
  CreateAcademicSubjectRequest,
} from '@/services/schemas/academic-department-schemas';
import {
  initialAcademicDepartmentDetailFormValues,
  initialCreateAcademicSubjectRequest,
} from '@/services/schemas/academic-department-schemas';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { getErrorMessage } from '@/utils/errors';
import { displayValue } from '@/utils/form-values';
import classes from './AcademicDepartmentDetail.module.css';

type AcademicDepartmentDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; department: AcademicDepartmentResponse };

type AcademicDepartmentDetailSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

type AcademicDepartmentCreateSubjectState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type SubjectCoursesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; courses: CourseResponse[] };

type AcademicDepartmentDetailLocationState = {
  source?: 'school' | 'search';
  schoolId?: number;
};

const emptyAcademicDepartmentSubjects: AcademicDepartmentSubjectResponse[] = [];

export function AcademicDepartmentDetailPage() {
  const navigate = useNavigate();
  const { departmentId } = useParams<{ departmentId: string }>();
  const location = useLocation();
  const locationState = (location.state as AcademicDepartmentDetailLocationState | null) ?? null;
  const navigationSource =
    locationState?.source === 'school' || locationState?.source === 'search'
      ? locationState.source
      : null;
  const fallbackSchoolId =
    typeof locationState?.schoolId === 'number' && locationState.schoolId > 0
      ? locationState.schoolId
      : null;
  const backPath =
    navigationSource === 'school' && fallbackSchoolId
      ? `/academics/schools/${fallbackSchoolId}`
      : '/academics/schools';
  const { handleBack } = usePortalBackNavigation({ fallbackPath: backPath });
  const parsedDepartmentId = Number(departmentId);
  const hasValidDepartmentId = Number.isInteger(parsedDepartmentId) && parsedDepartmentId > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [pageState, setPageState] = useState<AcademicDepartmentDetailPageState>({
    status: 'loading',
  });
  const [saveState, setSaveState] = useState<AcademicDepartmentDetailSaveState>({
    status: 'idle',
  });
  const [createSubjectState, setCreateSubjectState] =
    useState<AcademicDepartmentCreateSubjectState>({
      status: 'idle',
    });
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<number[]>([]);
  const [subjectCoursesBySubjectId, setSubjectCoursesBySubjectId] = useState<
    Record<number, SubjectCoursesState>
  >({});
  const [subjectSortBy, setSubjectSortBy] = useState<AcademicDepartmentSortBy>('code');
  const [subjectSortDirection, setSubjectSortDirection] =
    useState<AcademicDepartmentSortDirection>('asc');
  const subjectCourseAbortControllersRef = useRef<Record<number, AbortController>>({});
  const form = useForm<AcademicDepartmentDetailFormValues>({
    initialValues: initialAcademicDepartmentDetailFormValues,
  });
  const createSubjectForm = useForm<CreateAcademicSubjectRequest>({
    initialValues: initialCreateAcademicSubjectRequest,
  });
  const courseCreateReferenceOptions = useCourseCreateReferenceOptions();

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
    return () => {
      Object.values(subjectCourseAbortControllersRef.current).forEach((abortController) => {
        abortController.abort();
      });
    };
  }, []);

  useEffect(() => {
    Object.values(subjectCourseAbortControllersRef.current).forEach((abortController) => {
      abortController.abort();
    });
    subjectCourseAbortControllersRef.current = {};
    setExpandedSubjectIds([]);
    setSubjectCoursesBySubjectId({});
  }, [parsedDepartmentId]);

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

  function closeCreateSubjectModal() {
    setIsCreateSubjectOpen(false);
    setCreateSubjectState({ status: 'idle' });
    createSubjectForm.reset();
  }

  async function handleCreateSubject(detail: AcademicDepartmentResponse) {
    if (createSubjectState.status === 'saving') {
      return;
    }

    try {
      const request = buildCreateAcademicSubjectRequest(createSubjectForm.values);

      setCreateSubjectState({ status: 'saving' });
      await createAcademicSubject({
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
      closeCreateSubjectModal();
    } catch (error) {
      setCreateSubjectState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create academic subject.'),
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

  function isSubjectExpanded(subjectId: number): boolean {
    return expandedSubjectIds.includes(subjectId);
  }

  async function loadSubjectCourses(subjectId: number) {
    if (!hasValidDepartmentId) {
      return;
    }

    const existingState = subjectCoursesBySubjectId[subjectId];
    if (existingState?.status === 'loading' || existingState?.status === 'success') {
      return;
    }

    subjectCourseAbortControllersRef.current[subjectId]?.abort();
    const abortController = new AbortController();
    subjectCourseAbortControllersRef.current[subjectId] = abortController;

    setSubjectCoursesBySubjectId((current) => ({
      ...current,
      [subjectId]: { status: 'loading' },
    }));

    try {
      const courses = await getAcademicDepartmentSubjectCourses({
        departmentId: parsedDepartmentId,
        subjectId,
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      setSubjectCoursesBySubjectId((current) => ({
        ...current,
        [subjectId]: { status: 'success', courses },
      }));
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      setSubjectCoursesBySubjectId((current) => ({
        ...current,
        [subjectId]: {
          status: 'error',
          message: getErrorMessage(error, 'Failed to load subject courses.'),
        },
      }));
    } finally {
      if (subjectCourseAbortControllersRef.current[subjectId] === abortController) {
        delete subjectCourseAbortControllersRef.current[subjectId];
      }
    }
  }

  function handleToggleSubjectExpansion(subjectId: number) {
    if (isSubjectExpanded(subjectId)) {
      setExpandedSubjectIds((current) => current.filter((currentSubjectId) => currentSubjectId !== subjectId));
      return;
    }

    setExpandedSubjectIds((current) => [...current, subjectId]);
    const existingState = subjectCoursesBySubjectId[subjectId];
    if (existingState?.status !== 'success' && existingState?.status !== 'loading') {
      void loadSubjectCourses(subjectId);
    }
  }

  function renderSubjectCourses(subject: AcademicDepartmentSubjectResponse) {
    const courseState = subjectCoursesBySubjectId[subject.subjectId] ?? { status: 'idle' };

    if (courseState.status === 'loading' || courseState.status === 'idle') {
      return (
        <SearchResultsStateNotice
          status="loading"
          idleTitle=""
          idleMessage=""
          loadingMessage={`Loading courses for ${subject.code}.`}
          emptyTitle=""
          emptyMessage=""
        />
      );
    }

    if (courseState.status === 'error') {
      return (
        <Stack gap="sm">
          <SearchResultsStateNotice
            status="error"
            idleTitle=""
            idleMessage=""
            loadingMessage=""
            errorTitle="Unable to load subject courses"
            errorMessage={courseState.message}
            emptyTitle=""
            emptyMessage=""
          />
          <Group justify="flex-end">
            <Button
              size="xs"
              variant="light"
              onClick={() => {
                setSubjectCoursesBySubjectId((current) => ({
                  ...current,
                  [subject.subjectId]: { status: 'idle' },
                }));
                void loadSubjectCourses(subject.subjectId);
              }}
            >
              Retry
            </Button>
          </Group>
        </Stack>
      );
    }

    if (courseState.courses.length === 0) {
      return (
        <SearchResultsStateNotice
          status="empty"
          idleTitle=""
          idleMessage=""
          loadingMessage=""
          emptyTitle="No courses found"
          emptyMessage="Create courses for this subject before using this section."
        />
      );
    }

    return (
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Course Number</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>Active</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {courseState.courses.map((course) => (
            <Table.Tr
              key={course.courseId}
              style={{ cursor: 'pointer' }}
              onClick={() =>
                navigate(`/academics/courses/${course.courseId}`, {
                  state: {
                    source: 'department',
                    departmentId: parsedDepartmentId,
                  },
                })
              }
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                  return;
                }

                event.preventDefault();
                navigate(`/academics/courses/${course.courseId}`, {
                  state: {
                    source: 'department',
                    departmentId: parsedDepartmentId,
                  },
                });
              }}
              tabIndex={0}
            >
              <Table.Td>{displayValue(course.courseNumber)}</Table.Td>
              <Table.Td>{displayValue(course.currentVersionTitle)}</Table.Td>
              <Table.Td>
                <Badge size="sm" variant="light" color={course.active ? 'green' : 'gray'}>
                  {course.active ? 'Active' : 'Inactive'}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  }

  const academicDepartmentSubjectColumns: ColumnDef<AcademicDepartmentSubjectResponse>[] = [
    {
      id: 'expand',
      header: '',
      size: 56,
      cell: ({ row }) => (isSubjectExpanded(row.original.subjectId) ? '▾' : '▸'),
    },
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

          <RecordPageFooter description="Return to the previous page.">
            <Button onClick={handleBack}>
              Back
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
  const createSubjectError =
    createSubjectState.status === 'error' ? createSubjectState.message : null;
  const createSubjectInProgress = createSubjectState.status === 'saving';
  const canSaveChanges = hasAcademicDepartmentDetailChanges(detail, form.values);

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={detail.name}
      badge={
        <Group gap="sm">
          <Badge variant="light" color={detail.active ? 'green' : 'gray'}>
            {detail.active ? 'Active' : 'Inactive'}
          </Badge>
        </Group>
      }
    >
      <CreateAcademicSubjectModal
        opened={isCreateSubjectOpen}
        onClose={closeCreateSubjectModal}
        createError={createSubjectError}
        form={createSubjectForm}
        isSaving={createSubjectInProgress}
        onSubmit={() => {
          void handleCreateSubject(detail);
        }}
      />
      <CourseCreateModal
        {...courseCreateReferenceOptions}
        initialDepartmentId={detail.departmentId}
        initialSchoolId={detail.schoolId}
        opened={isCreateCourseModalOpen}
        onClose={() => {
          setIsCreateCourseModalOpen(false);
        }}
        onCreated={(courseVersion) => {
          if (courseVersion.courseId !== null) {
            navigate(`/academics/courses/${courseVersion.courseId}`, {
              state: {
                source: 'department',
                departmentId: detail.departmentId,
              },
            });
          }
        }}
      />
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
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="Academic School"
                  value={detail.schoolName ?? ''}
                  placeholder={detail.schoolName ? undefined : '—'}
                  readOnly
                />
              </Grid.Col>
              {detail.schoolId ? (
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Button
                    component={Link}
                    to={`/academics/schools/${detail.schoolId}`}
                    variant="light"
                    mt={30}
                  >
                    View school
                  </Button>
                </Grid.Col>
              ) : null}
            </>
          )}
        </RecordPageSection>

        <RecordPageSection
          title="Academic Subjects"
          action={
            <Group gap="sm" wrap="wrap" justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  createSubjectForm.reset();
                  setCreateSubjectState({ status: 'idle' });
                  setIsCreateSubjectOpen(true);
                }}
                disabled={isEditing || saveInProgress}
              >
                Add subject
              </Button>
              <Button
                onClick={() => {
                  setIsCreateCourseModalOpen(true);
                }}
                disabled={isEditing || saveInProgress}
              >
                Create course
              </Button>
            </Group>
          }
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
                getRowProps={(row: Row<AcademicDepartmentSubjectResponse>) => ({
                  'aria-expanded': isSubjectExpanded(row.original.subjectId),
                  className: isSubjectExpanded(row.original.subjectId)
                    ? classes.subjectExpandedRow
                    : undefined,
                  onClick: () => {
                    handleToggleSubjectExpansion(row.original.subjectId);
                  },
                  onKeyDown: (event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') {
                      return;
                    }

                    event.preventDefault();
                    handleToggleSubjectExpansion(row.original.subjectId);
                  },
                  role: 'button',
                  tabIndex: 0,
                })}
                renderExpandedRow={(row: Row<AcademicDepartmentSubjectResponse>) => {
                  if (!isSubjectExpanded(row.original.subjectId)) {
                    return null;
                  }

                  return (
                    <Table.Tr key={`${row.id}-expanded`} className={classes.expandedCoursesRow}>
                      <Table.Td
                        colSpan={row.getVisibleCells().length}
                        className={classes.expandedCoursesCell}
                      >
                        <Stack gap="sm" py="sm" className={classes.expandedCoursesContent}>
                          {renderSubjectCourses(row.original)}
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  );
                }}
              />
            )}
          </Grid.Col>
        </RecordPageSection>

        <RecordPageFooter>
          <Button onClick={handleBack}>
            Back
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
