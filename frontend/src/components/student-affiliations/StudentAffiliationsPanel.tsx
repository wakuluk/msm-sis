import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Badge, Button, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import createClasses from '@/components/create/RecordPageLayout.module.css';
import classes from '@/pages/portal/StudentDetail.module.css';
import {
  addStudentAthlete,
  getStudentAffiliations,
  patchStudentAthlete,
  updateStudentHonors,
} from '@/services/student-affiliations-service';
import type {
  StudentAffiliationSummaryResponse,
  StudentAthleteStatusResponse,
  StudentHonorsStatusResponse,
} from '@/services/schemas/student-affiliation-schemas';
import { getErrorMessage } from '@/utils/errors';
import {
  StudentAthleteStatusModal,
  type StudentAthleteStatusFormValues,
} from './StudentAthleteStatusModal';
import {
  StudentHonorsStatusModal,
  type StudentHonorsStatusFormValues,
} from './StudentHonorsStatusModal';

type StudentAffiliationsPanelProps = {
  canManage: boolean;
  studentId: number;
};

type DetailSectionProps = {
  action?: ReactNode;
  children: ReactNode;
  title: string;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate);
}

function DetailSection({ action, children, title }: DetailSectionProps) {
  return (
    <section className={createClasses.section}>
      <div className={createClasses.sectionHeader}>
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Title order={3} className={`${createClasses.sectionTitle} ${classes.sectionTitle}`}>
            {title}
          </Title>
          {action}
        </Group>
      </div>
      {children}
    </section>
  );
}

function getHonorsStatusLabel(honors: StudentHonorsStatusResponse | null) {
  if (!honors) {
    return 'Not in honors';
  }

  return honors.active ? 'In honors' : 'Inactive honors';
}

function getHonorsStatusColor(honors: StudentHonorsStatusResponse | null) {
  if (!honors) {
    return 'gray';
  }

  return honors.active ? 'green' : 'yellow';
}

function getEmptyAffiliations(studentId: number): StudentAffiliationSummaryResponse {
  return {
    studentId,
    honors: null,
    athletics: [],
  };
}

export function StudentAffiliationsPanel({ canManage, studentId }: StudentAffiliationsPanelProps) {
  const [affiliations, setAffiliations] = useState<StudentAffiliationSummaryResponse>(() =>
    getEmptyAffiliations(studentId)
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [honorsModalOpened, setHonorsModalOpened] = useState(false);
  const [honorsSaveError, setHonorsSaveError] = useState<string | null>(null);
  const [honorsSaving, setHonorsSaving] = useState(false);
  const [athleteModalOpened, setAthleteModalOpened] = useState(false);
  const [athleteSaveError, setAthleteSaveError] = useState<string | null>(null);
  const [athleteSaving, setAthleteSaving] = useState(false);
  const [selectedAthleteStatus, setSelectedAthleteStatus] =
    useState<StudentAthleteStatusResponse | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    setIsLoading(true);
    setLoadError(null);
    setAffiliations(getEmptyAffiliations(studentId));

    getStudentAffiliations({ studentId, signal: abortController.signal })
      .then((response) => {
        setAffiliations(response);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setLoadError(getErrorMessage(error, 'Failed to load student affiliations.'));
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [studentId]);

  async function handleSaveHonors(values: StudentHonorsStatusFormValues) {
    setHonorsSaving(true);
    setHonorsSaveError(null);

    try {
      const updatedAffiliations = await updateStudentHonors({
        studentId,
        request: {
          active: values.active,
        },
      });

      setAffiliations(updatedAffiliations);
      setHonorsModalOpened(false);
    } catch (error) {
      setHonorsSaveError(getErrorMessage(error, 'Failed to update honors status.'));
    } finally {
      setHonorsSaving(false);
    }
  }

  function handleOpenAthleteModal(athleteStatus: StudentAthleteStatusResponse | null) {
    setSelectedAthleteStatus(athleteStatus);
    setAthleteSaveError(null);
    setAthleteModalOpened(true);
  }

  function handleCloseAthleteModal() {
    setSelectedAthleteStatus(null);
    setAthleteSaveError(null);
    setAthleteModalOpened(false);
  }

  async function handleSaveAthleteStatus(values: StudentAthleteStatusFormValues) {
    setAthleteSaving(true);
    setAthleteSaveError(null);

    try {
      const updatedAffiliations = selectedAthleteStatus
        ? await patchStudentAthlete({
            studentId,
            studentAthleteId: selectedAthleteStatus.studentAthleteId,
            request: {
              active: values.active,
              athleticSportId: values.athleticSportId,
            },
          })
        : await addStudentAthlete({
            studentId,
            request: {
              active: values.active,
              athleticSportId: values.athleticSportId,
            },
          });

      setAffiliations(updatedAffiliations);
      handleCloseAthleteModal();
    } catch (error) {
      setAthleteSaveError(getErrorMessage(error, 'Failed to update athlete status.'));
    } finally {
      setAthleteSaving(false);
    }
  }

  return (
    <Stack gap={0}>
      {loadError ? (
        <Alert color="red" title="Unable to load affiliations">
          {loadError}
        </Alert>
      ) : null}

      {isLoading ? (
        <Group gap="sm" px="md" py="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading affiliations.
          </Text>
        </Group>
      ) : null}

      <DetailSection
        title="Honors"
        action={
          canManage ? (
            <Button
              variant="light"
              disabled={isLoading}
              onClick={() => {
                setHonorsSaveError(null);
                setHonorsModalOpened(true);
              }}
            >
              {affiliations.honors ? 'Manage Honors' : 'Add Honors'}
            </Button>
          ) : null
        }
      >
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Status</Table.Th>
              <Table.Th>Last Updated</Table.Th>
              <Table.Th>Updated By</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>
                <Badge
                  variant="light"
                  color={getHonorsStatusColor(affiliations.honors)}
                  w="fit-content"
                >
                  {getHonorsStatusLabel(affiliations.honors)}
                </Badge>
              </Table.Td>
              <Table.Td>{formatDateTime(affiliations.honors?.updatedAt)}</Table.Td>
              <Table.Td>{affiliations.honors?.updatedBy ?? '-'}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </DetailSection>

      <DetailSection
        title="Athletics"
        action={
          canManage ? (
            <Button
              variant="light"
              disabled={isLoading}
              onClick={() => {
                handleOpenAthleteModal(null);
              }}
            >
              Add Athlete Status
            </Button>
          ) : null
        }
      >
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Sport</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Last Updated</Table.Th>
              <Table.Th>Updated By</Table.Th>
              {canManage ? <Table.Th>Actions</Table.Th> : null}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {affiliations.athletics.length > 0 ? (
              affiliations.athletics.map((status) => (
                <Table.Tr key={status.studentAthleteId}>
                  <Table.Td>
                    <Stack gap={0}>
                      <Text fw={600}>{status.athleticSportName}</Text>
                      <Text size="sm" c="dimmed">
                        {status.athleticSportCode}
                      </Text>
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={status.active ? 'green' : 'gray'}>
                      {status.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDateTime(status.updatedAt)}</Table.Td>
                  <Table.Td>{status.updatedBy ?? '-'}</Table.Td>
                  {canManage ? (
                    <Table.Td>
                      <Button
                        variant="subtle"
                        onClick={() => {
                          handleOpenAthleteModal(status);
                        }}
                      >
                        Manage
                      </Button>
                    </Table.Td>
                  ) : null}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td>
                  <Badge variant="light" color="gray">
                    Not an athlete
                  </Badge>
                </Table.Td>
                <Table.Td>-</Table.Td>
                <Table.Td>-</Table.Td>
                <Table.Td>-</Table.Td>
                {canManage ? <Table.Td>-</Table.Td> : null}
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </DetailSection>

      <StudentHonorsStatusModal
        error={honorsSaveError}
        honors={affiliations.honors}
        opened={honorsModalOpened}
        saving={honorsSaving}
        onClose={() => {
          setHonorsSaveError(null);
          setHonorsModalOpened(false);
        }}
        onSave={handleSaveHonors}
      />
      <StudentAthleteStatusModal
        athleteStatus={selectedAthleteStatus}
        error={athleteSaveError}
        opened={athleteModalOpened}
        saving={athleteSaving}
        onClose={handleCloseAthleteModal}
        onSave={handleSaveAthleteStatus}
      />
    </Stack>
  );
}
