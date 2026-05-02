import { TextInput } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { FormModalShell } from '@/components/modals/FormModalShell';
import type { CreateAcademicSubjectRequest } from '@/services/schemas/academic-department-schemas';

export function CreateAcademicSubjectModal({
  createError,
  form,
  isSaving,
  opened,
  onClose,
  onSubmit,
}: {
  createError: string | null;
  form: UseFormReturnType<CreateAcademicSubjectRequest>;
  isSaving: boolean;
  opened: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <FormModalShell
      opened={opened}
      onClose={onClose}
      title="Add academic subject"
      size="lg"
      isSaving={isSaving}
      validationMessage={null}
      validationTitle="Invalid academic subject"
      submissionError={createError}
      submissionErrorTitle="Unable to create academic subject"
      submitLabel="Add subject"
      onSubmit={onSubmit}
    >
      <TextInput
        withAsterisk
        label="Code"
        maxLength={20}
        {...form.getInputProps('code')}
      />
      <TextInput
        withAsterisk
        label="Name"
        maxLength={255}
        {...form.getInputProps('name')}
      />
    </FormModalShell>
  );
}
