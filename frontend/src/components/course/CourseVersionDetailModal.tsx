import { Alert, Button, Grid, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { CourseVersionDetailResponse } from '@/services/schemas/course-schemas';
import { displayValue } from '@/utils/form-values';

type MakeCourseVersionCurrentState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

function displayTimestamp(value: string | null | undefined): string {
  return displayValue(value);
}

export function CourseVersionDetailModal({
  opened,
  onClose,
  courseVersion,
  makeCurrentState,
  onMakeCurrent,
}: {
  opened: boolean;
  onClose: () => void;
  courseVersion: CourseVersionDetailResponse | null;
  makeCurrentState: MakeCourseVersionCurrentState;
  onMakeCurrent: (courseVersion: CourseVersionDetailResponse) => Promise<void>;
}) {
  if (!courseVersion) {
    return null;
  }

  const isSaving = makeCurrentState.status === 'saving';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Version ${courseVersion.versionNumber} Details`}
      centered
      size="lg"
      closeOnClickOutside={!isSaving}
      closeOnEscape={!isSaving}
    >
      <Stack gap="md">
        {makeCurrentState.status === 'error' ? (
          <Alert color="red" title="Unable to make version current">
            {makeCurrentState.message}
          </Alert>
        ) : null}

        <Grid gap="md">
          <ReadOnlyField
            label="Course Version ID"
            value={displayValue(courseVersion.courseVersionId)}
          />
          <ReadOnlyField label="Course Code" value={displayValue(courseVersion.courseCode)} />
          <ReadOnlyField label="Version Number" value={displayValue(courseVersion.versionNumber)} />
          <ReadOnlyField label="Subject" value={displayValue(courseVersion.subjectCode)} />
          <ReadOnlyField label="Course Number" value={displayValue(courseVersion.courseNumber)} />
          <ReadOnlyField label="Current" value={courseVersion.current ? 'Yes' : 'No'} />
          <ReadOnlyField
            label="Variable Credit"
            value={courseVersion.variableCredit ? 'Yes' : 'No'}
          />
          <ReadOnlyField label="Min Credits" value={displayValue(courseVersion.minCredits)} />
          <ReadOnlyField label="Max Credits" value={displayValue(courseVersion.maxCredits)} />
          <ReadOnlyField label="Created At" value={displayTimestamp(courseVersion.createdAt)} />
          <ReadOnlyField label="Updated At" value={displayTimestamp(courseVersion.updatedAt)} />
          <Grid.Col span={12}>
            <TextInput label="Title" value={courseVersion.title} readOnly />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Catalog Description"
              value={courseVersion.catalogDescription ?? ''}
              placeholder="—"
              minRows={4}
              readOnly
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end">
          {!courseVersion.current ? (
            <Button onClick={() => void onMakeCurrent(courseVersion)} loading={isSaving}>
              Make Current
            </Button>
          ) : null}
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
