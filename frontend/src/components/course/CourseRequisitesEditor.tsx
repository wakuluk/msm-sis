import { Alert, Button, Group, Stack } from '@mantine/core';
import { useState } from 'react';
import type { CourseSearchResultResponse } from '@/services/schemas/course-search-schemas';
import type {
  CourseVersionRequisiteMinimumGrade,
  CourseVersionRequisiteType,
} from '@/services/schemas/course-schemas';
import {
  courseSearchResultToDraft,
  createEmptyRequisiteCourse,
  createEmptyRequisiteGroup,
  type CourseRequisiteGroupDraft,
} from './courseRequisiteDrafts';
import { CourseRequisiteGroupEditor } from './CourseRequisiteGroupEditor';

type CourseRequisitesEditorProps = {
  groups: CourseRequisiteGroupDraft[];
  departmentOptions: ReadonlyArray<{ value: string; label: string }>;
  error: string | null;
  disabled?: boolean;
  onChange: React.Dispatch<React.SetStateAction<CourseRequisiteGroupDraft[]>>;
};

export function CourseRequisitesEditor({
  groups,
  departmentOptions,
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

  function changeDepartment(groupId: number, courseDraftId: number, departmentId: string | null) {
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
                      minimumGrade: null,
                    }
                  : course
              ),
            }
          : group
      )
    );
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

  function changeCourse(
    groupId: number,
    courseDraftId: number,
    selectedCourse: CourseSearchResultResponse | null
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
                      ...(selectedCourse
                        ? courseSearchResultToDraft(selectedCourse)
                        : {
                            courseId: '',
                            courseCode: '',
                            courseTitle: '',
                            minimumGrade: null,
                            lab: false,
                          }),
                    }
                  : course
              ),
            }
          : group
      )
    );
  }

  function changeMinimumGrade(
    groupId: number,
    courseDraftId: number,
    minimumGrade: CourseVersionRequisiteMinimumGrade | null
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
                course.id === courseDraftId ? { ...course, minimumGrade } : course
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
              departmentOptions={departmentOptions}
              disabled={disabled}
              error={error}
              group={group}
              groupIndex={groupIndex}
              labOnly={labOnlyGroupIds.has(group.id)}
              onAddCourse={addCourse}
              onChangeCourse={changeCourse}
              onChangeDepartment={changeDepartment}
              onChangeMinimumGrade={changeMinimumGrade}
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
