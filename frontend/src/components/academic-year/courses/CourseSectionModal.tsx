// Modal container for creating, viewing, editing, and duplicating course sections.
// Composes the section field groups, selected-offering context, mutation state, and footer actions.
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { Alert, Badge, Group, Modal, Stack, Text } from '@mantine/core';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import type {
  CourseSectionDraft,
  CourseSectionPreview,
  SelectOption,
  StaffSelectOption,
} from './courseSectionsWorkspaceTypes';
import { CourseSectionAcademicFields } from './CourseSectionAcademicFields';
import { CourseSectionIdentityFields } from './CourseSectionIdentityFields';
import { CourseSectionModalFooter } from './CourseSectionModalFooter';
import { CourseSectionRegistrationFields } from './CourseSectionRegistrationFields';
import { CourseSectionScheduleFields } from './CourseSectionScheduleFields';
import { CourseSectionStudentsPanel } from './CourseSectionStudentsPanel';

type CourseSectionModalProps = {
  opened: boolean;
  mode: 'create' | 'detail';
  offering: AcademicYearCourseOfferingSearchResultResponse | null;
  selectedSection: CourseSectionPreview | null;
  draft: CourseSectionDraft;
  setDraft: Dispatch<SetStateAction<CourseSectionDraft>>;
  detailEditing: boolean;
  setDetailEditing: (value: boolean) => void;
  subTermLabel: string;
  sectionPreview: string;
  selectedStatusName: string | null;
  sectionStatusOptions: SelectOption[];
  academicDivisionOptions: SelectOption[];
  sectionGradingBasisOptions: SelectOption[];
  enrollmentGradingBasisOptions: SelectOption[];
  deliveryModeOptions: SelectOption[];
  creditOptions: SelectOption[];
  staffOptions: StaffSelectOption[];
  staffSearchValue: string;
  staffLoading: boolean;
  referencesAreLoading: boolean;
  mutationError: string | null;
  mutating: boolean;
  onStaffSearchChange: (value: string) => void;
  onClose: () => void;
  onCancelEdit: () => void;
  onCreate: () => void;
  onSave: () => void;
  onCancelSection: () => void;
  onDuplicate: () => void;
};

const readableDisabledInputStyles = {
  input: {
    backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
};
const readableDisabledSwitchStyles = {
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
  description: {
    opacity: 1,
  },
  track: {
    opacity: 1,
  },
};
const readableDisabledCheckboxStyles = {
  input: {
    opacity: 1,
  },
  label: {
    color: 'var(--mantine-color-text)',
    opacity: 1,
  },
};

function CourseSectionModalHeader({
  badges,
  courseCode,
  title,
}: {
  badges: ReactNode;
  courseCode: string;
  title: string;
}) {
  return (
    <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
      <Stack gap={2}>
        <Text fw={700}>{courseCode}</Text>
        <Text size="sm" c="dimmed">
          {title}
        </Text>
      </Stack>
      <Group gap="xs" wrap="wrap">
        {badges}
      </Group>
    </Group>
  );
}

export function CourseSectionModal({
  opened,
  mode,
  offering,
  selectedSection,
  draft,
  setDraft,
  detailEditing,
  setDetailEditing,
  subTermLabel,
  sectionPreview,
  selectedStatusName,
  sectionStatusOptions,
  academicDivisionOptions,
  sectionGradingBasisOptions,
  enrollmentGradingBasisOptions,
  deliveryModeOptions,
  creditOptions,
  staffOptions,
  staffSearchValue,
  staffLoading,
  referencesAreLoading,
  mutationError,
  mutating,
  onStaffSearchChange,
  onClose,
  onCancelEdit,
  onCreate,
  onSave,
  onCancelSection,
  onDuplicate,
}: CourseSectionModalProps) {
  const fieldsDisabled = mode === 'detail' && !detailEditing;
  const readOnlyInputStyles = fieldsDisabled ? readableDisabledInputStyles : undefined;
  const readOnlySwitchStyles = fieldsDisabled ? readableDisabledSwitchStyles : undefined;
  const readOnlyCheckboxStyles = fieldsDisabled ? readableDisabledCheckboxStyles : undefined;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={mode === 'detail' ? 'Course Section' : 'Add Course Section'}
      size="96rem"
      centered
    >
      {offering || selectedSection ? (
        <Stack gap="md">
          <CourseSectionModalHeader
            courseCode={
              selectedSection
                ? `${selectedSection.courseCode} Section ${selectedSection.sectionCode}`
                : (offering?.courseCode ?? 'Course offering')
            }
            title={selectedSection?.courseTitle ?? offering?.title ?? 'Title unavailable'}
            badges={
              <>
                <Badge variant="light" color="blue">
                  {subTermLabel}
                </Badge>
                {selectedSection ? (
                  <Badge
                    variant="light"
                    color={selectedSection.statusCode === 'DRAFT' ? 'gray' : 'green'}
                  >
                    {selectedStatusName ?? selectedSection.statusName}
                  </Badge>
                ) : (
                  <Badge variant="light" color="green">
                    Section {sectionPreview}
                  </Badge>
                )}
              </>
            }
          />

          <Stack gap="lg">
            <CourseSectionIdentityFields
              draft={draft}
              fieldsDisabled={fieldsDisabled}
              readOnlyInputStyles={readOnlyInputStyles}
              readOnlySwitchStyles={readOnlySwitchStyles}
              referencesAreLoading={referencesAreLoading}
              sectionStatusOptions={sectionStatusOptions}
              setDraft={setDraft}
            />

            <CourseSectionAcademicFields
              academicDivisionOptions={academicDivisionOptions}
              creditOptions={creditOptions}
              draft={draft}
              fieldsDisabled={fieldsDisabled}
              gradingBasisOptions={sectionGradingBasisOptions}
              readOnlyInputStyles={readOnlyInputStyles}
              referencesAreLoading={referencesAreLoading}
              staffLoading={staffLoading}
              staffOptions={staffOptions}
              staffSearchValue={staffSearchValue}
              setDraft={setDraft}
              onStaffSearchChange={onStaffSearchChange}
            />

            <CourseSectionScheduleFields
              deliveryModeOptions={deliveryModeOptions}
              draft={draft}
              fieldsDisabled={fieldsDisabled}
              readOnlyCheckboxStyles={readOnlyCheckboxStyles}
              readOnlyInputStyles={readOnlyInputStyles}
              readOnlySwitchStyles={readOnlySwitchStyles}
              referencesAreLoading={referencesAreLoading}
              setDraft={setDraft}
            />

            <CourseSectionRegistrationFields
              draft={draft}
              fieldsDisabled={fieldsDisabled}
              readOnlySwitchStyles={readOnlySwitchStyles}
              setDraft={setDraft}
            />

            {mode === 'detail' && selectedSection ? (
              <CourseSectionStudentsPanel
                selectedSection={selectedSection}
                gradingBasisOptions={enrollmentGradingBasisOptions}
              />
            ) : null}

            {mutationError ? (
              <Alert
                color="red"
                title={
                  mode === 'detail'
                    ? 'Unable to update course section'
                    : 'Unable to create course section'
                }
              >
                {mutationError}
              </Alert>
            ) : null}
          </Stack>

          <CourseSectionModalFooter
            mutating={mutating}
            detailEditing={detailEditing}
            mode={mode}
            selectedSection={selectedSection}
            onCancelEdit={onCancelEdit}
            onCancelSection={onCancelSection}
            onClose={onClose}
            onCreate={onCreate}
            onDuplicate={onDuplicate}
            onSave={onSave}
            onStartEdit={() => {
              setDetailEditing(true);
            }}
          />
        </Stack>
      ) : null}
    </Modal>
  );
}
