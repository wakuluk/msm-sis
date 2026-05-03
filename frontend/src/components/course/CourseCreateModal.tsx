import { Alert, Button, Divider, Group, Modal, Stack, Text } from '@mantine/core';
import type { StringOption } from '@/components/search/SearchQueryControls';
import type { CourseVersionDetailResponse } from '@/services/schemas/course-schemas';
import { CourseAssociatedLabSection } from './CourseAssociatedLabSection';
import { CourseIdentitySection } from './CourseIdentitySection';
import { CourseInitialVersionSection } from './CourseInitialVersionSection';
import { CourseRulesSection } from './CourseRulesSection';
import { useCourseCreateForm } from './useCourseCreateForm';

type CourseCreateModalProps = {
  departmentOptions: ReadonlyArray<{ schoolId: number } & StringOption>;
  initialDepartmentId?: number | null;
  initialSchoolId?: number | null;
  referenceOptionsError: string | null;
  referenceOptionsLoading: boolean;
  opened: boolean;
  schoolOptions: ReadonlyArray<StringOption>;
  subjectOptions: ReadonlyArray<{ departmentId: number } & StringOption>;
  onClose: () => void;
  onCreated?: (courseVersion: CourseVersionDetailResponse) => void;
};

export function CourseCreateModal({
  departmentOptions,
  initialDepartmentId = null,
  initialSchoolId = null,
  referenceOptionsError,
  referenceOptionsLoading,
  opened,
  schoolOptions,
  subjectOptions,
  onClose,
  onCreated,
}: CourseCreateModalProps) {
  const {
    departmentId,
    formValues,
    handleDepartmentChange,
    handleSchoolChange,
    handleSubmit,
    isSubmitting,
    schoolId,
    setFormValues,
    setSubjectId,
    subjectId,
    submitState,
    validationMessage,
  } = useCourseCreateForm({
    initialDepartmentId,
    initialSchoolId,
    opened,
    onClose,
    onCreated,
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create Course"
      size="72rem"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <Stack gap="lg">
          {validationMessage ? (
            <Alert color="red" title="Invalid course">
              {validationMessage}
            </Alert>
          ) : null}

          {submitState.status === 'error' ? (
            <Alert color="red" title="Unable to create course">
              {submitState.message}
            </Alert>
          ) : null}

          <CourseIdentitySection
            departmentId={departmentId}
            departmentOptions={departmentOptions}
            formValues={formValues}
            isSubmitting={isSubmitting}
            referenceOptionsError={referenceOptionsError}
            referenceOptionsLoading={referenceOptionsLoading}
            schoolId={schoolId}
            schoolOptions={schoolOptions}
            subjectId={subjectId}
            subjectOptions={subjectOptions}
            onDepartmentChange={handleDepartmentChange}
            onFormValuesChange={setFormValues}
            onSchoolChange={handleSchoolChange}
            onSubjectChange={setSubjectId}
          />

          <Divider />

          <CourseInitialVersionSection
            formValues={formValues}
            isSubmitting={isSubmitting}
            onFormValuesChange={setFormValues}
          />

          <Divider />

          <CourseAssociatedLabSection
            formValues={formValues}
            isSubmitting={isSubmitting}
            onFormValuesChange={setFormValues}
          />

          <Divider />

          <CourseRulesSection
            isSubmitting={isSubmitting}
            requisites={formValues.requisites}
            onRequisitesChange={(requisites) => {
              setFormValues((current) => ({
                ...current,
                requisites:
                  typeof requisites === 'function'
                    ? requisites(current.requisites)
                    : requisites,
              }));
            }}
          />

          <Group justify="space-between" align="center" gap="md">
            <Text size="sm" c="dimmed">
              The final save flow should create the course, create its initial version, and open
              course detail.
            </Text>
            <Group gap="sm">
              <Button type="button" variant="default" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Create course
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
