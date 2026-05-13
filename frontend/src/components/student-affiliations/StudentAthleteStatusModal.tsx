import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Grid, Group, Modal, Select, Stack, Switch } from '@mantine/core';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import { getAthleticSports } from '@/services/athletics-service';
import type { AthleticSportResponse } from '@/services/schemas/athletics-schemas';
import type { StudentAthleteStatusResponse } from '@/services/schemas/student-affiliation-schemas';

export type StudentAthleteStatusFormValues = {
  active: boolean;
  athleticSportCode: string;
  athleticSportId: number;
  athleticSportName: string;
};

type StudentAthleteStatusModalProps = {
  athleteStatus: StudentAthleteStatusResponse | null;
  error?: string | null;
  opened: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: StudentAthleteStatusFormValues) => void;
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

export function StudentAthleteStatusModal({
  athleteStatus,
  error = null,
  opened,
  saving = false,
  onClose,
  onSave,
}: StudentAthleteStatusModalProps) {
  const [sportId, setSportId] = useState(
    athleteStatus?.athleticSportId ? String(athleteStatus.athleticSportId) : ''
  );
  const [active, setActive] = useState(athleteStatus?.active ?? true);
  const [sports, setSports] = useState<AthleticSportResponse[]>([]);
  const [sportsError, setSportsError] = useState<string | null>(null);
  const [sportsLoading, setSportsLoading] = useState(false);
  const sportOptions = useMemo(
    () =>
      sports
        .filter((sport) => sport.active)
        .map((sport) => ({
          value: String(sport.athleticSportId),
          label: `${sport.name} (${sport.code})`,
        })),
    [sports]
  );
  const selectedSport = sports.find((sport) => String(sport.athleticSportId) === sportId);
  const canSave = Boolean(selectedSport);

  useEffect(() => {
    if (!opened) {
      return;
    }

    setSportId(athleteStatus?.athleticSportId ? String(athleteStatus.athleticSportId) : '');
    setActive(athleteStatus?.active ?? true);
  }, [athleteStatus, opened]);

  useEffect(() => {
    if (!opened) {
      return undefined;
    }

    const abortController = new AbortController();
    setSportsLoading(true);
    setSportsError(null);

    getAthleticSports({ signal: abortController.signal })
      .then((response) => {
        setSports(response.sports);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSportsError(error instanceof Error ? error.message : 'Failed to load athletic sports.');
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setSportsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [opened]);

  function handleSave() {
    const parsedSportId = Number(sportId);

    if (!canSave || !Number.isInteger(parsedSportId) || !selectedSport) {
      return;
    }

    onSave({
      active,
      athleticSportCode: selectedSport.code,
      athleticSportId: parsedSportId,
      athleticSportName: selectedSport.name,
    });
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Manage Athlete Status" size="lg" centered>
      <Stack gap="md">
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Select
              label="Sport"
              data={sportOptions}
              disabled={sportsLoading}
              value={sportId}
              onChange={(value) => {
                setSportId(value ?? '');
              }}
              placeholder={sportsLoading ? 'Loading sports...' : 'Select sport'}
              searchable
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Switch
              label="Active athlete"
              checked={active}
              mt="xl"
              onChange={(event) => {
                setActive(event.currentTarget.checked);
              }}
            />
          </Grid.Col>
        </Grid>

        {sportsError ? (
          <Alert color="red" title="Unable to load sports">
            {sportsError}
          </Alert>
        ) : null}

        {error ? (
          <Alert color="red" title="Unable to save athlete status">
            {error}
          </Alert>
        ) : null}

        {athleteStatus ? (
          <Grid>
            <ReadOnlyField label="Last Updated" value={formatDateTime(athleteStatus.updatedAt)} />
            <ReadOnlyField label="Updated By" value={athleteStatus.updatedBy ?? '-'} />
          </Grid>
        ) : null}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave} loading={saving}>
            Save Athlete Status
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
