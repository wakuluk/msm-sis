// Multi-row instructor assignment editor for course sections.
// Lets staff assign instructors, teaching assistants, graders, and observers to a section.
import type { Dispatch, SetStateAction } from 'react';
import {
  ActionIcon,
  Alert,
  Button,
  Checkbox,
  Divider,
  Grid,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  type SelectProps,
  type TextInputProps,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import type {
  CourseSectionDraft,
  CourseSectionInstructorDraft,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';
import { StaffCombobox } from './StaffCombobox';

type CourseSectionInstructorAssignmentsProps = {
  draft: CourseSectionDraft;
  fieldsDisabled: boolean;
  roleOptions: SelectOption[];
  staffLoading: boolean;
  staffOptions: StaffSelectOption[];
  staffSearchValue: string;
  styles?: TextInputProps['styles'];
  selectStyles?: SelectProps['styles'];
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
  onStaffSearchChange: (value: string) => void;
};

export function CourseSectionInstructorAssignments({
  draft,
  fieldsDisabled,
  roleOptions,
  staffLoading,
  staffOptions,
  staffSearchValue,
  styles,
  selectStyles,
  setDraft,
  onStaffSearchChange,
}: CourseSectionInstructorAssignmentsProps) {
  const instructors =
    draft.instructors.length === 0 && !fieldsDisabled ? [buildBlankInstructor()] : draft.instructors;
  const warnings = fieldsDisabled ? [] : buildAssignmentWarnings(instructors);

  function updateInstructor(index: number, patch: Partial<CourseSectionInstructorDraft>) {
    setDraft((current) => {
      const currentInstructors =
        current.instructors.length === 0 ? [buildBlankInstructor()] : current.instructors;

      return {
        ...current,
        instructors: currentInstructors.map((instructor, instructorIndex) =>
          instructorIndex === index ? { ...instructor, ...patch } : instructor
        ),
      };
    });
  }

  function addInstructor() {
    setDraft((current) => ({
      ...current,
      instructors: [
        ...(current.instructors.length === 0
          ? [buildBlankInstructor()]
          : current.instructors),
        buildBlankInstructor(getDefaultAdditionalRole(roleOptions)),
      ],
    }));
  }

  function removeInstructor(index: number) {
    setDraft((current) => ({
      ...current,
      instructors: current.instructors.filter((_, instructorIndex) => instructorIndex !== index),
    }));
  }

  return (
    <Stack gap="sm">
      <Divider label="Instructor assignments" labelPosition="left" />
      {warnings.length > 0 ? (
        <Alert color="yellow" title="Review instructor assignments">
          <Stack gap={4}>
            {warnings.map((warning) => (
              <Text key={warning} size="sm">
                {warning}
              </Text>
            ))}
          </Stack>
        </Alert>
      ) : null}

      {instructors.map((instructor, index) => (
        <Grid
          key={instructor.sectionInstructorId ?? `draft-${index}`}
          align="flex-start"
          py="sm"
          style={{
            borderBottom:
              index === instructors.length - 1 ? undefined : '1px solid var(--mantine-color-gray-2)',
          }}
        >
            <Grid.Col span={{ base: 12, md: 4 }}>
              <StaffCombobox
                label={index === 0 ? 'Instructor assignment' : 'Additional assignment'}
                placeholder="Search staff"
                options={staffOptions}
                value={instructor.label}
                selectedStaffId={instructor.staffId}
                disabled={fieldsDisabled}
                loading={staffLoading && staffSearchValue === instructor.label}
                styles={styles}
                onSearchChange={(value) => {
                  onStaffSearchChange(value);
                  updateInstructor(index, {
                    staffId: null,
                    label: value,
                    email: null,
                  });
                }}
                onSelect={(staffId, label) => {
                  onStaffSearchChange(label);
                  updateInstructor(index, {
                    staffId,
                    label,
                    email: null,
                  });
                }}
                onClear={() => {
                  onStaffSearchChange('');
                  updateInstructor(index, {
                    staffId: null,
                    label: '',
                    email: null,
                  });
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Role"
                placeholder="Select role"
                data={roleOptions}
                value={instructor.roleCode}
                disabled={fieldsDisabled}
                styles={selectStyles}
                onChange={(value) => {
                  const selectedRole = roleOptions.find((option) => option.value === value);
                  updateInstructor(index, {
                    roleCode: value ?? null,
                    roleName: selectedRole?.label ?? null,
                    ...getGradePermissionDefaults(value),
                  });
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap={6}>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Grade access
                </Text>
                <Group gap="xs" align="center">
                  <Checkbox
                    label="View"
                    checked={instructor.canViewGrades}
                    disabled={fieldsDisabled}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      updateInstructor(index, {
                        canViewGrades: checked,
                        canManageGrades: checked ? instructor.canManageGrades : false,
                      });
                    }}
                  />
                  <Checkbox
                    label="Manage"
                    checked={instructor.canManageGrades}
                    disabled={fieldsDisabled}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      updateInstructor(index, {
                        canManageGrades: checked,
                        canViewGrades: checked ? true : instructor.canViewGrades,
                      });
                    }}
                  />
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 1 }}>
              <Group justify="flex-end" pt={{ base: 0, md: 24 }}>
                <Tooltip label="Remove assignment">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label="Remove instructor assignment"
                    disabled={fieldsDisabled}
                    onClick={() => {
                      removeInstructor(index);
                    }}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
        </Grid>
      ))}

      {!fieldsDisabled ? (
        <Group justify="flex-start">
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addInstructor}>
            Add assignment
          </Button>
        </Group>
      ) : null}
    </Stack>
  );
}

function buildAssignmentWarnings(instructors: CourseSectionInstructorDraft[]): string[] {
  const warnings = new Set<string>();
  const instructorStaffIds = new Set<number>();
  const hasSelectedStaff = instructors.some((instructor) => instructor.staffId !== null);
  const hasPrimaryInstructor = instructors.some(
    (instructor) => instructor.staffId !== null && instructor.roleCode === 'PRIMARY_INSTRUCTOR'
  );

  if (hasSelectedStaff && !hasPrimaryInstructor) {
    warnings.add('No primary instructor is selected.');
  }

  instructors.forEach((instructor) => {
    if (instructor.staffId === null) {
      return;
    }

    if (!instructor.roleCode) {
      warnings.add('One assignment is missing a role.');
    }

    if (instructorStaffIds.has(instructor.staffId)) {
      warnings.add('One staff member is assigned more than once.');
    }
    instructorStaffIds.add(instructor.staffId);
  });

  return [...warnings];
}

function getGradePermissionDefaults(
  roleCode: string | null
): Pick<CourseSectionInstructorDraft, 'canViewGrades' | 'canManageGrades'> {
  switch (roleCode) {
    case 'PRIMARY_INSTRUCTOR':
    case 'CO_INSTRUCTOR':
    case 'GRADER':
      return { canViewGrades: true, canManageGrades: true };
    case 'TEACHING_ASSISTANT':
      return { canViewGrades: true, canManageGrades: false };
    default:
      return { canViewGrades: false, canManageGrades: false };
  }
}

function getDefaultAdditionalRole(roleOptions: SelectOption[]): Pick<
  CourseSectionInstructorDraft,
  'roleCode' | 'roleName'
> {
  const preferredRole =
    roleOptions.find((option) => option.value === 'TEACHING_ASSISTANT') ??
    roleOptions.find((option) => option.value !== 'PRIMARY_INSTRUCTOR') ??
    null;

  return {
    roleCode: preferredRole?.value ?? null,
    roleName: preferredRole?.label ?? null,
  };
}

function buildBlankInstructor(
  role: Pick<CourseSectionInstructorDraft, 'roleCode' | 'roleName'> = {
    roleCode: 'PRIMARY_INSTRUCTOR',
    roleName: 'Primary Instructor',
  }
): CourseSectionInstructorDraft {
  const gradePermissions = getGradePermissionDefaults(role.roleCode);

  return {
    sectionInstructorId: null,
    staffId: null,
    label: '',
    email: null,
    roleCode: role.roleCode,
    roleName: role.roleName,
    canViewGrades: gradePermissions.canViewGrades,
    canManageGrades: gradePermissions.canManageGrades,
  };
}
