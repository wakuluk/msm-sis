import type { ReactNode } from 'react';
import { Alert, Button, Group, Modal, Stack } from '@mantine/core';

type FormModalShellProps = {
  children: ReactNode;
  isSaving: boolean;
  opened: boolean;
  size?: string;
  submitLabel: string;
  submissionError: string | null;
  submissionErrorTitle: string;
  title: string;
  validationMessage: string | null;
  validationTitle: string;
  onClose: () => void;
  onSubmit: () => void;
};

export function FormModalShell({
  children,
  isSaving,
  opened,
  size = '80rem',
  submitLabel,
  submissionError,
  submissionErrorTitle,
  title,
  validationMessage,
  validationTitle,
  onClose,
  onSubmit,
}: FormModalShellProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size={size}
      centered
      closeOnClickOutside={!isSaving}
      closeOnEscape={!isSaving}
    >
      <Stack gap="lg">
        {validationMessage ? (
          <Alert color="red" title={validationTitle}>
            {validationMessage}
          </Alert>
        ) : null}

        {submissionError ? (
          <Alert color="red" title={submissionErrorTitle}>
            {submissionError}
          </Alert>
        ) : null}

        {children}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={isSaving}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
