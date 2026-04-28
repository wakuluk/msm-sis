import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import type { CourseSectionStudentResponse } from '@/services/schemas/course-schemas';
import type { EditEnrollmentValues } from './courseSectionStudentTypes';
import { studentStatusColor } from './courseSectionStudentUtils';
import type { SelectOption } from './courseSectionsWorkspaceTypes';

type CourseSectionEditEnrollmentModalProps = {
  opened: boolean;
  student: CourseSectionStudentResponse | null;
  gradingBasisOptions: SelectOption[];
  enrollmentStatusOptions: SelectOption[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (values: EditEnrollmentValues) => void;
};

export function CourseSectionEditEnrollmentModal({
  opened,
  student,
  gradingBasisOptions,
  enrollmentStatusOptions,
  saving,
  error,
  onClose,
  onSave,
}: CourseSectionEditEnrollmentModalProps) {
  const [statusCode, setStatusCode] = useState<string | null>(null);
  const [gradingBasisCode, setGradingBasisCode] = useState<string | null>(null);
  const [creditsAttempted, setCreditsAttempted] = useState<number | string>('');
  const [includeInGpa, setIncludeInGpa] = useState(true);
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [manualAddReason, setManualAddReason] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!opened || !student) {
      return;
    }

    setStatusCode(student.statusCode);
    setGradingBasisCode(student.gradingBasisCode);
    setCreditsAttempted(student.creditsAttempted ?? '');
    setIncludeInGpa(student.includeInGpa);
    setCapacityOverride(student.capacityOverride);
    setManualAddReason(student.manualAddReason ?? '');
    setReason('');
  }, [opened, student]);

  const statusChanged = student ? statusCode !== student.statusCode : false;
  const showManualAddReason = capacityOverride;
  const showChangeReason = statusChanged;
  const missingManualAddReason = showManualAddReason && manualAddReason.trim().length === 0;
  const missingChangeReason = showChangeReason && reason.trim().length === 0;
  const canSave = !missingManualAddReason && !missingChangeReason;

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Enrollment" size="48rem" centered>
      {student ? (
        <Stack gap="md">
          <Stack gap={4}>
            <Text fw={700}>{student.studentDisplayName ?? 'Student unavailable'}</Text>
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" color="blue">
                Student ID {student.studentId ?? 'Not set'}
              </Badge>
              <Badge variant="light" color={studentStatusColor(student.statusCode)}>
                {student.statusName ?? 'Unknown'}
              </Badge>
            </Group>
          </Stack>

          {error ? (
            <Alert color="red" title="Unable to update enrollment">
              {error}
            </Alert>
          ) : null}

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Status"
                placeholder="Select status"
                data={enrollmentStatusOptions}
                value={statusCode}
                onChange={setStatusCode}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Grading basis"
                placeholder="Select grading"
                data={gradingBasisOptions}
                value={gradingBasisCode}
                onChange={setGradingBasisCode}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Credits attempted"
                min={0}
                decimalScale={2}
                value={creditsAttempted}
                onChange={setCreditsAttempted}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Stack gap="xs" mt={{ base: 0, sm: 26 }}>
                <Checkbox
                  label="Include in GPA"
                  checked={includeInGpa}
                  onChange={(event) => {
                    setIncludeInGpa(event.currentTarget.checked);
                  }}
                />
                <Checkbox
                  label="Capacity override"
                  checked={capacityOverride}
                  onChange={(event) => {
                    setCapacityOverride(event.currentTarget.checked);
                  }}
                />
              </Stack>
            </Grid.Col>
            {showManualAddReason ? (
              <Grid.Col span={12}>
                <Textarea
                  label="Manual add reason"
                  description="Required when capacity override is enabled."
                  autosize
                  minRows={2}
                  value={manualAddReason}
                  error={missingManualAddReason ? 'Manual add reason is required.' : null}
                  onChange={(event) => {
                    setManualAddReason(event.currentTarget.value);
                  }}
                />
              </Grid.Col>
            ) : null}
            {showChangeReason ? (
              <Grid.Col span={12}>
                <Textarea
                  label="Status change reason"
                  description="Required when changing enrollment status."
                  autosize
                  minRows={2}
                  value={reason}
                  error={missingChangeReason ? 'Status change reason is required.' : null}
                  onChange={(event) => {
                    setReason(event.currentTarget.value);
                  }}
                />
              </Grid.Col>
            ) : null}
          </Grid>

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              loading={saving}
              disabled={!canSave}
              onClick={() => {
                onSave({
                  statusCode,
                  gradingBasisCode,
                  creditsAttempted:
                    typeof creditsAttempted === 'number'
                      ? creditsAttempted
                      : Number(creditsAttempted) || null,
                  includeInGpa,
                  capacityOverride,
                  ...(showManualAddReason ? { manualAddReason: manualAddReason.trim() || null } : {}),
                  ...(showChangeReason ? { reason: reason.trim() || null } : {}),
                });
              }}
            >
              Save enrollment
            </Button>
          </Group>
        </Stack>
      ) : null}
    </Modal>
  );
}
