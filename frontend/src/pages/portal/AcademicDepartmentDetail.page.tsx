import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Stack,
} from '@mantine/core';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AcademicDepartmentInfoSection } from '@/components/academic-department/AcademicDepartmentInfoSection';
import { AcademicDepartmentSubjectCoursesTable } from '@/components/academic-department/AcademicDepartmentSubjectCoursesTable';
import { AcademicDepartmentSubjectsSection } from '@/components/academic-department/AcademicDepartmentSubjectsSection';
import { CreateAcademicSubjectModal } from '@/components/academic-department/CreateAcademicSubjectModal';
import { CourseCreateModal } from '@/components/course/CourseCreateModal';
import { useCourseCreateReferenceOptions } from '@/components/course/useCourseCreateReferenceOptions';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { useAcademicDepartmentDetail } from '@/components/academic-department/useAcademicDepartmentDetail';
import type { AcademicDepartmentSubjectResponse } from '@/services/schemas/academic-department-schemas';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';

type AcademicDepartmentDetailLocationState = {
  source?: 'school' | 'search';
  schoolId?: number;
};

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
  const courseCreateReferenceOptions = useCourseCreateReferenceOptions();
  const {
    beginEdit,
    canSaveChanges,
    cancelEdit,
    closeCreateSubjectModal,
    createSubject,
    createSubjectError,
    createSubjectForm,
    createSubjectInProgress,
    expandedSubjectIds,
    form,
    isCreateCourseModalOpen,
    isCreateSubjectOpen,
    isEditing,
    pageState,
    parsedDepartmentId,
    retrySubjectCourses,
    saveDepartment,
    saveError,
    saveInProgress,
    saveSucceeded,
    setIsCreateCourseModalOpen,
    subjectCoursesBySubjectId,
    subjectSortBy,
    subjectSortDirection,
    toggleSubjectExpansion,
    toggleSubjectSort,
    openCreateSubjectModal,
  } = useAcademicDepartmentDetail(departmentId);

  function renderSubjectCourses(subject: AcademicDepartmentSubjectResponse) {
    const courseState = subjectCoursesBySubjectId[subject.subjectId] ?? { status: 'idle' };

    return (
      <AcademicDepartmentSubjectCoursesTable
        courseState={courseState}
        subjectCode={subject.code}
        onCourseClick={(course) => {
          navigate(`/academics/courses/${course.courseId}`, {
            state: {
              source: 'department',
              departmentId: parsedDepartmentId,
            },
          });
        }}
        onRetry={() => {
          retrySubjectCourses(subject.subjectId);
        }}
      />
    );
  }

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
          void createSubject(detail);
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

        <AcademicDepartmentInfoSection
          canSaveChanges={canSaveChanges}
          department={detail}
          form={form}
          isEditing={isEditing}
          saveInProgress={saveInProgress}
          saveSucceeded={saveSucceeded}
          onCancelEdit={() => {
            cancelEdit(detail);
          }}
          onEdit={() => {
            beginEdit(detail);
          }}
          onSave={() => {
            void saveDepartment(detail);
          }}
        />

        <AcademicDepartmentSubjectsSection
          actionsDisabled={isEditing || saveInProgress}
          expandedSubjectIds={expandedSubjectIds}
          subjects={detail.subjects}
          sortBy={subjectSortBy}
          sortDirection={subjectSortDirection}
          onAddSubjectClick={openCreateSubjectModal}
          onCreateCourseClick={() => {
            setIsCreateCourseModalOpen(true);
          }}
          onToggleSort={toggleSubjectSort}
          onToggleSubjectExpansion={toggleSubjectExpansion}
          renderSubjectCourses={renderSubjectCourses}
        />

        <RecordPageFooter>
          <Button onClick={handleBack}>
            Back
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
