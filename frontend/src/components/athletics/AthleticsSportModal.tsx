import { useEffect, useState } from 'react';
import { Alert, Button, Grid, Group, Modal, Stack, Switch, TextInput } from '@mantine/core';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { AthleticSportResponse } from '@/services/schemas/athletics-schemas';

export type AthleticsSportFormValues = {
  active: boolean;
  code: string;
  name: string;
};

type AthleticsSportModalProps = {
  error?: string | null;
  opened: boolean;
  saving?: boolean;
  sport: AthleticSportResponse | null;
  onClose: () => void;
  onSave: (values: AthleticsSportFormValues) => void;
};

const emptyFormValues: AthleticsSportFormValues = {
  active: true,
  code: '',
  name: '',
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

function getInitialValues(sport: AthleticSportResponse | null): AthleticsSportFormValues {
  if (!sport) {
    return emptyFormValues;
  }

  return {
    active: sport.active,
    code: sport.code,
    name: sport.name,
  };
}

export function AthleticsSportModal({
  error = null,
  opened,
  saving = false,
  sport,
  onClose,
  onSave,
}: AthleticsSportModalProps) {
  const [formValues, setFormValues] = useState<AthleticsSportFormValues>(() =>
    getInitialValues(sport)
  );
  const isEditing = Boolean(sport);
  const canSave = formValues.code.trim().length > 0 && formValues.name.trim().length > 0;

  useEffect(() => {
    if (!opened) {
      return;
    }

    setFormValues(getInitialValues(sport));
  }, [opened, sport]);

  function handleSave() {
    if (!canSave) {
      return;
    }

    onSave({
      ...formValues,
      code: formValues.code.trim().toUpperCase(),
      name: formValues.name.trim(),
    });
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Manage Sport' : 'Create Sport'}
      size="lg"
      centered
    >
      <Stack gap="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <TextInput
              label="Sport Code"
              value={formValues.code}
              onChange={(event) => {
                const code = event.currentTarget.value;
                setFormValues((currentValues) => ({
                  ...currentValues,
                  code,
                }));
              }}
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 7 }}>
            <TextInput
              label="Sport Name"
              value={formValues.name}
              onChange={(event) => {
                const name = event.currentTarget.value;
                setFormValues((currentValues) => ({
                  ...currentValues,
                  name,
                }));
              }}
              required
            />
          </Grid.Col>
        </Grid>

        <Switch
          label="Active"
          checked={formValues.active}
          onChange={(event) => {
            const active = event.currentTarget.checked;
            setFormValues((currentValues) => ({
              ...currentValues,
              active,
            }));
          }}
        />

        {error ? (
          <Alert color="red" title="Unable to save sport">
            {error}
          </Alert>
        ) : null}

        {sport ? (
          <Grid>
            <ReadOnlyField label="Last Updated" value={formatDateTime(sport.updatedAt)} />
            <ReadOnlyField label="Updated By" value={sport.updatedBy ?? '-'} />
          </Grid>
        ) : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave} loading={saving}>
            {isEditing ? 'Save Sport' : 'Create Sport'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
