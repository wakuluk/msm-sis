import { useEffect, useState } from 'react';
import { Alert, Button, Grid, Group, Modal, Stack, Switch } from '@mantine/core';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { StudentHonorsStatusResponse } from '@/services/schemas/student-affiliation-schemas';

export type StudentHonorsStatusFormValues = {
  active: boolean;
};

type StudentHonorsStatusModalProps = {
  error?: string | null;
  honors: StudentHonorsStatusResponse | null;
  opened: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: StudentHonorsStatusFormValues) => void;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

export function StudentHonorsStatusModal({
  error = null,
  honors,
  opened,
  saving = false,
  onClose,
  onSave,
}: StudentHonorsStatusModalProps) {
  const [active, setActive] = useState(honors?.active ?? true);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setActive(honors?.active ?? true);
  }, [honors, opened]);

  return (
    <Modal opened={opened} onClose={onClose} title="Manage Honors Status" size="md" centered>
      <Stack gap="md">
        <Switch
          label="Honors student"
          checked={active}
          onChange={(event) => {
            setActive(event.currentTarget.checked);
          }}
        />

        {error ? (
          <Alert color="red" title="Unable to save honors status">
            {error}
          </Alert>
        ) : null}

        {honors ? (
          <Grid>
            <ReadOnlyField label="Last Updated" value={formatDateTime(honors.updatedAt)} />
            <ReadOnlyField label="Updated By" value={honors.updatedBy ?? '-'} />
          </Grid>
        ) : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave({ active });
            }}
            loading={saving}
          >
            Save Honors Status
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
