import { useEffect, useState } from 'react';
import { Alert, Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { createTuitionCode } from '@/services/billing-service';
import type { TuitionCodeDetailResponse } from '@/services/schemas/billing-schemas';

type TuitionCodeCreateModalProps = {
  opened: boolean;
  onClose: () => void;
  onCreate: (tuitionCode: TuitionCodeDetailResponse) => void;
};

type TuitionCodeFormValues = {
  code: string;
  name: string;
};

const initialValues: TuitionCodeFormValues = {
  code: '',
  name: '',
};

function normalizeTuitionCodeInput(value: string) {
  return value.replace(/\s+/g, '_').toUpperCase();
}

export function TuitionCodeCreateModal({ opened, onClose, onCreate }: TuitionCodeCreateModalProps) {
  const form = useForm<TuitionCodeFormValues>({
    initialValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!opened) {
      form.setValues(initialValues);
      form.clearErrors();
      setIsSubmitting(false);
    }
  }, [opened]);

  async function handleSubmit(values: TuitionCodeFormValues) {
    const trimmedCode = normalizeTuitionCodeInput(values.code.trim());
    const trimmedName = values.name.trim();

    if (!trimmedCode) {
      form.setFieldError('code', 'Code is required.');
      return;
    }

    if (!trimmedName) {
      form.setFieldError('name', 'Name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const tuitionCode = await createTuitionCode({
        request: {
          code: trimmedCode,
          name: trimmedName,
        },
      });
      onCreate(tuitionCode);
    } catch (error) {
      form.setFieldError(
        'code',
        error instanceof Error ? error.message : 'Failed to create tuition code.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Create Tuition Code" size="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert color="gray" variant="light">
            Spaces become underscores. Other special characters are not allowed.
          </Alert>
          <TextInput
            label="Code"
            placeholder="FULL"
            maxLength={32}
            {...form.getInputProps('code')}
            onChange={(event) => {
              form.setFieldValue('code', normalizeTuitionCodeInput(event.currentTarget.value));
            }}
          />
          <TextInput label="Name" placeholder="Full Tuition" {...form.getInputProps('name')} />
          <Group justify="flex-end" gap="sm">
            <Button type="button" variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create code
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
