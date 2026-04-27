import { Button, Group } from '@mantine/core';
import type { CourseSectionPreview } from './courseSectionsWorkspaceTypes';

type CourseSectionModalFooterProps = {
  mutating: boolean;
  detailEditing: boolean;
  mode: 'create' | 'detail';
  selectedSection: CourseSectionPreview | null;
  onCancelEdit: () => void;
  onCancelSection: () => void;
  onClose: () => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onSave: () => void;
  onStartEdit: () => void;
};

export function CourseSectionModalFooter({
  mutating,
  detailEditing,
  mode,
  selectedSection,
  onCancelEdit,
  onCancelSection,
  onClose,
  onCreate,
  onDuplicate,
  onSave,
  onStartEdit,
}: CourseSectionModalFooterProps) {
  return (
    <Group justify="flex-end" gap="sm" wrap="wrap">
      {mode === 'detail' ? (
        detailEditing ? (
          <>
            <Button variant="default" onClick={onCancelEdit}>
              Cancel edit
            </Button>
            <Button loading={mutating} onClick={onSave}>
              Save changes
            </Button>
          </>
        ) : (
          <>
            <Button variant="default" onClick={onStartEdit}>
              Edit
            </Button>
            <Button variant="default" onClick={onDuplicate}>
              Duplicate
            </Button>
            <Button
              variant="default"
              loading={mutating}
              disabled={selectedSection?.statusCode === 'CANCELLED'}
              onClick={onCancelSection}
            >
              Cancel section
            </Button>
          </>
        )
      ) : (
        <>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={mutating} onClick={onCreate}>
            Create section
          </Button>
        </>
      )}
    </Group>
  );
}
