import { Alert, Button, Group, Stack } from '@mantine/core';
import { useState } from 'react';
import type { CourseVersionRequisiteType } from '@/services/schemas/course-schemas';
import type { CourseReferenceOption } from '@/services/schemas/reference-schemas';
import {
  courseReferenceToDraft,
  createEmptyRequisiteCourse,
  createEmptyRequisiteGroup,
  type CourseRequisiteGroupDraft,
} from './courseRequisiteDrafts';
import { CourseRequisiteGroupEditor } from './CourseRequisiteGroupEditor';

type CourseRequisitesEditorProps = {
  groups: CourseRequisiteGroupDraft[];
  departmentOptions: Array<{ value: string; label: string }>;
  courses: CourseReferenceOption[];
  loading: boolean;
  error: string | null;
  disabled?: boolean;
  onChange: React.Dispatch<React.SetStateAction<CourseRequisiteGroupDraft[]>>;
};

export function CourseRequisitesEditor({
  groups,
  departmentOptions,
  courses,
  loading,
  error,
  disabled = false,
  onChange,
}: CourseRequisitesEditorProps) {
  const [labOnlyGroupIds, setLabOnlyGroupIds] = useState<Set<number>>(new Set());

  function addGroup(requisiteType: CourseVersionRequisiteType) {
    onChange((current) => [...current, createEmptyRequisiteGroup(requisiteType)]);
  }

  function removeGroup(groupId: number) {
    if (groupId < 0) {
      return;
    }

    onChange((current) => current.filter((group) => group.id !== groupId));
    setLabOnlyGroupIds((current) => {
      const next = new Set(current);
      next.delete(groupId);
      return next;
    });
  }

  function updateGroup(
    groupId: number,
    patch: Partial<Omit<CourseRequisiteGroupDraft, 'id' | 'courses'>>
  ) {
    if (groupId < 0) {
      return;
    }

    onChange((current) =>
      current.map((group) => (group.id === groupId ? { ...group, ...patch } : group))
    );
  }

  function changeDepartment(
    groupId: number,
    courseDraftId: number,
    departmentId: string | null
  ) {
    if (groupId < 0 || courseDraftId < 0) {
      return;
    }

    onChange((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              courses: group.courses.map((course) =>
                course.id === courseDraftId
                  ? {
                      ...course,
                      departmentId: departmentId ?? '',
                      courseId: '',
                      courseCode: '',
                      courseTitle: '',
                    }
                  : course
              ),
            }
          : group
      )
    );
  }

  function getCourseOptionsForRow(
    group: CourseRequisiteGroupDraft,
    courseDraft: { departmentId: number | string }
  ) {
    const departmentId = Number(courseDraft.departmentId);

    return courses
      .filter((course) => !courseDraft.departmentId || course.departmentId === departmentId)
      .filter((course) => group.requisiteType !== 'COREQUISITE' || !labOnlyGroupIds.has(group.id) || course.lab)
      .map((course) => ({
        value: String(course.courseId),
        label: course.lab ? `${course.courseCode} (Lab)` : course.courseCode,
      }));
  }

  function addCourse(groupId: number) {
    if (groupId < 0) {
      return;
    }

    onChange((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, courses: [...group.courses, createEmptyRequisiteCourse()] }
          : group
      )
    );
  }

  function removeCourse(groupId: number, courseDraftId: number) {
    if (groupId < 0 || courseDraftId < 0) {
      return;
    }

    onChange((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, courses: group.courses.filter((course) => course.id !== courseDraftId) }
          : group
      )
    );
  }

  function changeCourse(groupId: number, courseDraftId: number, courseId: string | null) {
    if (groupId < 0 || courseDraftId < 0) {
      return;
    }

    const selectedCourse = courseId
      ? courses.find((course) => String(course.courseId) === courseId)
      : null;

    onChange((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              courses: group.courses.map((course) =>
                course.id === courseDraftId
                  ? {
                      ...course,
                      ...(selectedCourse
                        ? courseReferenceToDraft(selectedCourse)
                        : { courseId: '', courseCode: '', courseTitle: '' }),
                    }
                  : course
              ),
            }
          : group
      )
    );
  }

  function toggleLabOnly(groupId: number, checked: boolean) {
    setLabOnlyGroupIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }

      return next;
    });
  }

  return (
    <Stack gap="md">
      <Group justify="flex-end" gap="xs">
        <Button
          size="xs"
          variant="default"
          disabled={disabled}
          onClick={() => addGroup('PREREQUISITE')}
        >
          Add prerequisite
        </Button>
        <Button
          size="xs"
          variant="default"
          disabled={disabled}
          onClick={() => addGroup('COREQUISITE')}
        >
          Add corequisite
        </Button>
      </Group>

      {groups.length === 0 ? (
        <Alert color="gray" title="No requisites added">
          This course version can be created without prerequisites or corequisites.
        </Alert>
      ) : (
        <Stack gap="lg">
          {groups.map((group, groupIndex) => (
            <CourseRequisiteGroupEditor
              key={group.id}
              courseOptionsForRow={getCourseOptionsForRow}
              courses={courses}
              departmentOptions={departmentOptions}
              disabled={disabled}
              error={error}
              group={group}
              groupIndex={groupIndex}
              labOnly={labOnlyGroupIds.has(group.id)}
              loading={loading}
              onAddCourse={addCourse}
              onChangeCourse={changeCourse}
              onChangeDepartment={changeDepartment}
              onRemoveCourse={removeCourse}
              onRemoveGroup={removeGroup}
              onToggleLabOnly={toggleLabOnly}
              onUpdateGroup={updateGroup}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
