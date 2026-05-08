import type { UseFormReturnType } from '@mantine/form';
import { Button, Grid, Group, Switch, Text, TextInput } from '@mantine/core';
import { Link } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type {
  AcademicDepartmentDetailFormValues,
  AcademicDepartmentResponse,
} from '@/services/schemas/academic-department-schemas';
import { displayValue } from '@/utils/form-values';

type AcademicDepartmentInfoSectionProps = {
  canSaveChanges: boolean;
  department: AcademicDepartmentResponse;
  form: UseFormReturnType<AcademicDepartmentDetailFormValues>;
  isEditing: boolean;
  onCancelEdit: () => void;
  onEdit: () => void;
  onSave: () => void;
  saveInProgress: boolean;
  saveSucceeded: boolean;
};

export function AcademicDepartmentInfoSection({
  canSaveChanges,
  department,
  form,
  isEditing,
  onCancelEdit,
  onEdit,
  onSave,
  saveInProgress,
  saveSucceeded,
}: AcademicDepartmentInfoSectionProps) {
  return (
    <RecordPageSection
      title="Academic Department"
      action={
        isEditing ? (
          <Group gap="sm" wrap="wrap" justify="flex-end">
            <Button onClick={onCancelEdit} variant="default" disabled={saveInProgress}>
              Cancel
            </Button>
            <Button onClick={onSave} loading={saveInProgress} disabled={!canSaveChanges}>
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
            <Button onClick={onEdit} variant="light">
              Edit details
            </Button>
          </Group>
        )
      }
    >
      <ReadOnlyField
        label="Academic department ID"
        value={displayValue(department.departmentId)}
        span={{ base: 12, md: 4 }}
      />
      {isEditing ? (
        <>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput withAsterisk label="Code" maxLength={20} {...form.getInputProps('code')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput withAsterisk label="Name" maxLength={255} {...form.getInputProps('name')} />
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
            value={displayValue(department.code)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Name"
            value={displayValue(department.name)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Active"
            value={displayValue(department.active)}
            span={{ base: 12, md: 4 }}
          />
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              label="Academic School"
              value={department.schoolName ?? ''}
              placeholder={department.schoolName ? undefined : '—'}
              readOnly
            />
          </Grid.Col>
          {department.schoolId ? (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Button
                component={Link}
                to={`/academics/schools/${department.schoolId}`}
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
  );
}
