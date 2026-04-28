// Footer controls for the course-section modal.
// Switches actions based on create/detail mode, edit state, selected section, and mutation state.
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
    <Group
      justify="flex-end"
      gap="sm"
      wrap="wrap"
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
        marginInline: 'calc(var(--mantine-spacing-md) * -1)',
        marginBottom: 'calc(var(--mantine-spacing-md) * -1)',
        padding: 'var(--mantine-spacing-md)',
        borderTop: '1px solid var(--portal-ui-surface-border-color)',
        backgroundColor: 'var(--mantine-color-body)',
      }}
    >
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
