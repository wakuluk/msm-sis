import { useState, type ReactNode } from 'react';
import { Alert, Button, Grid, Group } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import {
  importAcademicYearCourseOfferings,
  syncAcademicYearCourseOfferings,
} from '@/services/admin-courses-service';
import type {
  ImportAcademicYearCourseOfferingsResponse,
  SyncAcademicYearCourseOfferingsResponse,
} from '@/services/schemas/admin-courses-schemas';
import { AddAcademicYearOfferingModal } from './AddAcademicYearOfferingModal';
import { getErrorMessage, type CourseTermOption } from './academicYearCoursesShared';

type ImportOfferingsState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: ImportAcademicYearCourseOfferingsResponse };

type SyncOfferingsState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string }
  | { status: 'success'; response: SyncAcademicYearCourseOfferingsResponse };

type AcademicYearCoursesActionsSectionProps = {
  academicYearId: number;
  hasValidAcademicYearId: boolean;
  canManageCourses: boolean;
  termOptions: ReadonlyArray<CourseTermOption>;
  onCoursesChanged: () => void;
  children?: ReactNode;
};

export function AcademicYearCoursesActionsSection({
  academicYearId,
  hasValidAcademicYearId,
  canManageCourses,
  termOptions,
  onCoursesChanged,
  children,
}: AcademicYearCoursesActionsSectionProps) {
  const [isAddOfferingModalOpen, setIsAddOfferingModalOpen] = useState(false);
  const [importOfferingsState, setImportOfferingsState] = useState<ImportOfferingsState>({
    status: 'idle',
  });
  const [syncOfferingsState, setSyncOfferingsState] = useState<SyncOfferingsState>({
    status: 'idle',
  });

  async function handleImportCurrentCourseVersions() {
    if (!hasValidAcademicYearId) {
      setImportOfferingsState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    setImportOfferingsState({ status: 'saving' });

    try {
      const response = await importAcademicYearCourseOfferings({
        academicYearId,
      });

      setImportOfferingsState({ status: 'success', response });
      onCoursesChanged();
    } catch (error) {
      setImportOfferingsState({
        status: 'error',
        message: getErrorMessage(
          error,
          'Failed to import current course versions into this academic year.'
        ),
      });
    }
  }

  async function handleSyncCurrentCourseVersions() {
    if (!hasValidAcademicYearId) {
      setSyncOfferingsState({
        status: 'error',
        message: 'Academic year ID is missing or invalid.',
      });
      return;
    }

    setSyncOfferingsState({ status: 'saving' });

    try {
      const response = await syncAcademicYearCourseOfferings({
        academicYearId,
      });

      setSyncOfferingsState({ status: 'success', response });
      onCoursesChanged();
    } catch (error) {
      setSyncOfferingsState({
        status: 'error',
        message: getErrorMessage(
          error,
          'Failed to sync course offerings to current course versions.'
        ),
      });
    }
  }

  return (
    <>
      <RecordPageSection
        title="Course Actions"
        description="Add offerings to this academic year, synchronize version changes, and review the year-wide course list."
        action={
          <Group gap="sm" wrap="wrap" justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                void handleSyncCurrentCourseVersions();
              }}
              loading={syncOfferingsState.status === 'saving'}
              disabled={!hasValidAcademicYearId || !canManageCourses}
            >
              Sync current versions
            </Button>
            <Button
              variant="default"
              onClick={() => {
                void handleImportCurrentCourseVersions();
              }}
              loading={importOfferingsState.status === 'saving'}
              disabled={!hasValidAcademicYearId || !canManageCourses}
            >
              Add all current versions
            </Button>
            <Button
              variant="light"
              onClick={() => {
                setIsAddOfferingModalOpen(true);
              }}
              disabled={!canManageCourses || termOptions.length === 0}
            >
              Add offering
            </Button>
            <Button
              variant="default"
              onClick={onCoursesChanged}
              disabled={!hasValidAcademicYearId || !canManageCourses}
            >
              Refresh courses
            </Button>
          </Group>
        }
      >
        {syncOfferingsState.status === 'error' ? (
          <Grid.Col span={12}>
            <Alert color="red" title="Unable to sync current course versions">
              {syncOfferingsState.message}
            </Alert>
          </Grid.Col>
        ) : null}

        {syncOfferingsState.status === 'success' ? (
          <Grid.Col span={12}>
            <Alert color="teal" title="Course offerings synced to current versions">
              Scanned {syncOfferingsState.response.scannedCourseOfferingCount} offerings. Updated{' '}
              {syncOfferingsState.response.updatedCourseOfferingCount}, already current{' '}
              {syncOfferingsState.response.alreadyCurrentCourseOfferingCount}, skipped{' '}
              {syncOfferingsState.response.skippedMissingCurrentCourseVersionCount} with no
              current course version, and skipped{' '}
              {syncOfferingsState.response.skippedDuplicateCurrentOfferingCount} because a current
              offering already existed for that course in this academic year.
            </Alert>
          </Grid.Col>
        ) : null}

        {importOfferingsState.status === 'error' ? (
          <Grid.Col span={12}>
            <Alert color="red" title="Unable to import current course versions">
              {importOfferingsState.message}
            </Alert>
          </Grid.Col>
        ) : null}

        {importOfferingsState.status === 'success' ? (
          <Grid.Col span={12}>
            <Alert color="teal" title="Current course versions imported">
              Created {importOfferingsState.response.createdCourseOfferingCount} offerings from{' '}
              {importOfferingsState.response.eligibleCurrentCourseVersionCount} eligible current
              course versions. Skipped{' '}
              {importOfferingsState.response.skippedExistingCourseOfferingCount} existing offerings
              already in this academic year.
            </Alert>
          </Grid.Col>
        ) : null}

        {children}
      </RecordPageSection>

      <AddAcademicYearOfferingModal
        opened={isAddOfferingModalOpen}
        onClose={() => {
          setIsAddOfferingModalOpen(false);
        }}
        academicYearId={academicYearId}
        hasValidAcademicYearId={hasValidAcademicYearId}
        termOptions={termOptions}
        onCreated={onCoursesChanged}
      />
    </>
  );
}
