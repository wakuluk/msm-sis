import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { SearchResultsTableRowProps } from '@/components/search/SearchResultsTable';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useLocation, useParams } from 'react-router-dom';
import { CreateCourseVersionModal } from '@/components/course/CreateCourseVersionModal';
import { CourseVersionDetailModal } from '@/components/course/CourseVersionDetailModal';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import {
  createCourseVersion,
  getCourseVersionsByCourseId,
  makeCourseVersionCurrent,
} from '@/services/course-service';
import type {
  CreateCourseVersionRequest,
  CourseVersionDetailResponse,
  CourseVersionSearchResponse,
  CourseVersionSearchSortBy,
  CourseVersionSearchSortDirection,
} from '@/services/schemas/course-schemas';
import { getErrorMessage } from '@/utils/errors';
import { displayValue } from '@/utils/form-values';

type CourseDetailPageLocationState = {
  source?: 'department' | 'search';
  departmentId?: number;
};

type CourseDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: CourseVersionSearchResponse };

type CreateCourseVersionState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type MakeCourseVersionCurrentState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

function displayCredits(courseVersion: CourseVersionDetailResponse): string {
  if (courseVersion.variableCredit) {
    return `${courseVersion.minCredits}-${courseVersion.maxCredits}`;
  }

  return String(courseVersion.minCredits);
}

const courseVersionColumns: ColumnDef<CourseVersionDetailResponse>[] = [
  {
    accessorKey: 'versionNumber',
    header: 'Version',
    size: 120,
    meta: { sortBy: 'versionNumber' satisfies CourseVersionSearchSortBy },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    size: 520,
    cell: ({ row }) => (
      <Stack gap={2}>
        <Text size="sm">{displayValue(row.original.title)}</Text>
        {row.original.catalogDescription ? (
          <Text size="xs" c="dimmed">
            {row.original.catalogDescription}
          </Text>
        ) : null}
      </Stack>
    ),
    meta: { sortBy: 'title' satisfies CourseVersionSearchSortBy },
  },
  {
    id: 'credits',
    header: 'Credits',
    size: 140,
    cell: ({ row }) => displayCredits(row.original),
    meta: { sortBy: 'credits' satisfies CourseVersionSearchSortBy },
  },
  {
    accessorKey: 'current',
    header: 'Current',
    size: 140,
    cell: ({ row }) => (
      <Group gap="xs">
        <Badge size="sm" variant="light" color={row.original.current ? 'green' : 'gray'}>
          {row.original.current ? 'Current' : 'Historical'}
        </Badge>
      </Group>
    ),
    meta: { sortBy: 'current' satisfies CourseVersionSearchSortBy },
  },
];

export function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const locationState = (location.state as CourseDetailPageLocationState | null) ?? null;
  const parsedCourseId = Number(courseId);
  const hasValidCourseId = Number.isInteger(parsedCourseId) && parsedCourseId > 0;
  const [pageState, setPageState] = useState<CourseDetailPageState>({
    status: 'loading',
  });
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [sortBy, setSortBy] = useState<CourseVersionSearchSortBy>('versionNumber');
  const [sortDirection, setSortDirection] = useState<CourseVersionSearchSortDirection>('desc');
  const [isCreateVersionModalOpen, setIsCreateVersionModalOpen] = useState(false);
  const [selectedCourseVersion, setSelectedCourseVersion] =
    useState<CourseVersionDetailResponse | null>(null);
  const [createVersionState, setCreateVersionState] = useState<CreateCourseVersionState>({
    status: 'idle',
  });
  const [makeCurrentState, setMakeCurrentState] = useState<MakeCourseVersionCurrentState>({
    status: 'idle',
  });
  const [reloadKey, setReloadKey] = useState(0);
  const fallbackDepartmentId =
    typeof locationState?.departmentId === 'number' && locationState.departmentId > 0
      ? locationState.departmentId
      : null;
  const backPath =
    locationState?.source === 'department' && fallbackDepartmentId
      ? `/academics/departments/${fallbackDepartmentId}`
      : locationState?.source === 'search'
        ? '/academics/courses/search'
        : '/academics/schools';
  const { handleBack } = usePortalBackNavigation({ fallbackPath: backPath });
  const response = pageState.status === 'success' ? pageState.response : null;
  const courseVersions = response?.results ?? [];
  const pageTitle = response?.courseCode || `Course ${parsedCourseId}`;
  const courseVersionCount = response?.totalElements ?? 0;
  const courseVersionsTable = useReactTable({
    columns: courseVersionColumns,
    data: courseVersions,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.courseVersionId),
  });

  useEffect(() => {
    if (!hasValidCourseId) {
      return;
    }

    const abortController = new AbortController();
    setPageState({ status: 'loading' });

    getCourseVersionsByCourseId({
      courseId: parsedCourseId,
      page,
      size,
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        setPageState({ status: 'success', response });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load course versions.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidCourseId, page, parsedCourseId, reloadKey, size, sortBy, sortDirection]);

  if (!hasValidCourseId) {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title="Course Detail"
        description="Course detail could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="red">
            Invalid course
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Course"
            description="Review the error below and return to the previous page."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to load course detail">
                Course ID is missing or invalid.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous academic page.">
            <Button onClick={handleBack}>
              Back
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  if (pageState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Workflow"
        title={`Course ${parsedCourseId}`}
        description="Loading course versions."
        badge={
          <Badge variant="light" size="lg" color="gray">
            Loading
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Course Versions"
            description="The course version list is loading."
          >
            <Grid.Col span={12}>
              <Alert color="blue" title="Loading course versions">
                Fetching course versions for course {parsedCourseId}.
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous academic page.">
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
        title={`Course ${parsedCourseId}`}
        description="Course versions could not be loaded."
        badge={
          <Badge variant="light" size="lg" color="red">
            Load failed
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Course Versions"
            description="Review the error below and return to the previous page."
          >
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to load course versions">
                {pageState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Return to the previous academic page.">
            <Button onClick={handleBack}>
              Back
            </Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  function handleToggleSort(nextSortBy: CourseVersionSearchSortBy) {
    if (nextSortBy === sortBy) {
      setSortDirection((currentSortDirection) =>
        currentSortDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection(nextSortBy === 'versionNumber' ? 'desc' : 'asc');
    setPage(0);
  }

  function closeCreateVersionModal() {
    if (createVersionState.status === 'saving') {
      return;
    }

    setIsCreateVersionModalOpen(false);
    setCreateVersionState({ status: 'idle' });
  }

  function closeCourseVersionDetailModal() {
    if (makeCurrentState.status === 'saving') {
      return;
    }

    setMakeCurrentState({ status: 'idle' });
    setSelectedCourseVersion(null);
  }

  function openCourseVersionDetailModal(courseVersion: CourseVersionDetailResponse) {
    setMakeCurrentState({ status: 'idle' });
    setSelectedCourseVersion(courseVersion);
  }

  function getCourseVersionRowProps(
    courseVersion: CourseVersionDetailResponse
  ): SearchResultsTableRowProps {
    return {
      role: 'button',
      tabIndex: 0,
      onClick: () => {
        openCourseVersionDetailModal(courseVersion);
      },
      onKeyDown: (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        openCourseVersionDetailModal(courseVersion);
      },
    };
  }

  async function handleCreateCourseVersion(request: CreateCourseVersionRequest) {
    if (!hasValidCourseId || createVersionState.status === 'saving') {
      return;
    }

    try {
      setCreateVersionState({ status: 'saving' });
      await createCourseVersion({
        courseId: parsedCourseId,
        request,
      });
      setCreateVersionState({ status: 'idle' });
      setIsCreateVersionModalOpen(false);
      setSortBy('versionNumber');
      setSortDirection('desc');
      setPage(0);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setCreateVersionState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create course version.'),
      });
    }
  }

  async function handleMakeCourseVersionCurrent(courseVersion: CourseVersionDetailResponse) {
    if (makeCurrentState.status === 'saving') {
      return;
    }

    try {
      setMakeCurrentState({ status: 'saving' });
      const updatedCourseVersion = await makeCourseVersionCurrent({
        courseVersionId: courseVersion.courseVersionId,
      });
      setSelectedCourseVersion(updatedCourseVersion);
      setMakeCurrentState({ status: 'idle' });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setMakeCurrentState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to make course version current.'),
      });
    }
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={pageTitle}
      description="Temporary course detail page with course versions loaded from the API."
      badge={
        <Badge variant="light" size="lg">
          Temporary page
        </Badge>
      }
    >
      <CreateCourseVersionModal
        opened={isCreateVersionModalOpen}
        onClose={closeCreateVersionModal}
        createState={createVersionState}
        onCreate={handleCreateCourseVersion}
        courseId={parsedCourseId}
        courseCode={response?.courseCode ?? null}
      />
      <CourseVersionDetailModal
        opened={selectedCourseVersion !== null}
        onClose={closeCourseVersionDetailModal}
        courseVersion={selectedCourseVersion}
        makeCurrentState={makeCurrentState}
        onMakeCurrent={handleMakeCourseVersionCurrent}
      />

      <Stack gap={0}>
        <RecordPageSection
          title="Course"
          description="This temporary route now displays the course versions returned by the API."
        >
          <ReadOnlyField
            label="Course ID"
            value={displayValue(response?.courseId ?? parsedCourseId)}
          />
          <ReadOnlyField label="Course Code" value={displayValue(response?.courseCode)} />
          <ReadOnlyField
            label="Subject"
            value={displayValue(response?.subjectCode)}
          />
          <ReadOnlyField
            label="Course Number"
            value={displayValue(response?.courseNumber)}
          />
          <ReadOnlyField
            label="Version count"
            value={displayValue(courseVersionCount)}
          />
          <ReadOnlyField label="Source department" value={displayValue(fallbackDepartmentId)} />
        </RecordPageSection>

        <RecordPageSection
          title="Course Versions"
          description="Versions currently returned by the backend for this course."
        >
          <Grid.Col span={12}>
            <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap">
                <Text size="sm">
                  {courseVersions.length === 0
                    ? 'This course does not have any versions yet.'
                    : `Showing ${courseVersions.length} of ${response?.totalElements ?? 0} course versions`}
                </Text>
                <Button
                  size="xs"
                  onClick={() => {
                    setCreateVersionState({ status: 'idle' });
                    setIsCreateVersionModalOpen(true);
                  }}
                >
                  New version
                </Button>
              </Group>

              {courseVersions.length === 0 ? (
                <Alert color="gray" title="No course versions found">
                  This course does not have any versions yet.
                </Alert>
              ) : (
                <Stack gap="md">
                  <Group justify="flex-end" align="center" wrap="wrap">
                    <Group gap="sm">
                      <Button
                        size="xs"
                        variant="light"
                        disabled={(response?.page ?? 0) <= 0}
                        onClick={() => {
                          setPage((currentPage) => Math.max(0, currentPage - 1));
                        }}
                      >
                        Previous
                      </Button>
                      <Text size="sm">
                        Page {(response?.page ?? 0) + 1} of {Math.max(response?.totalPages ?? 0, 1)}
                      </Text>
                      <Button
                        size="xs"
                        variant="light"
                        disabled={(response?.page ?? 0) + 1 >= (response?.totalPages ?? 0)}
                        onClick={() => {
                          setPage((currentPage) => currentPage + 1);
                        }}
                      >
                        Next
                      </Button>
                    </Group>
                  </Group>

                  <SearchResultsTable
                    table={courseVersionsTable}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onToggleSort={handleToggleSort}
                    getRowProps={(row) => getCourseVersionRowProps(row.original)}
                  />
                </Stack>
              )}
            </Stack>
          </Grid.Col>
        </RecordPageSection>

        <RecordPageFooter description="Return to the previous academic page.">
          <Button onClick={handleBack}>
            Back
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
