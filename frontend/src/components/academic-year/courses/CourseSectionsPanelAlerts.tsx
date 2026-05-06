// Alert and empty-state messages for the course sections table panel.
import { Alert } from '@mantine/core';
import type { SectionReferenceState } from './courseSectionsWorkspaceTypes';

type CourseSectionListErrorState = { status: 'error'; message: string } | { status: string };
type CourseSectionDetailErrorState = { status: 'error'; message: string } | { status: string };

type CourseSectionsPanelAlertsProps = {
  filteredSectionCount: number;
  hasActiveScope: boolean;
  referenceState: SectionReferenceState;
  sectionDetailState: CourseSectionDetailErrorState;
  sectionListState: CourseSectionListErrorState;
  sectionsAreLoading: boolean;
};

export function CourseSectionsPanelAlerts({
  filteredSectionCount,
  hasActiveScope,
  referenceState,
  sectionDetailState,
  sectionListState,
  sectionsAreLoading,
}: CourseSectionsPanelAlertsProps) {
  return (
    <>
      {referenceState.status === 'error' ? (
        <Alert color="red" title="Unable to load section reference options">
          {referenceState.message}
        </Alert>
      ) : null}

      {isErrorState(sectionListState) ? (
        <Alert color="red" title="Unable to load course sections">
          {sectionListState.message}
        </Alert>
      ) : null}

      {isErrorState(sectionDetailState) ? (
        <Alert color="red" title="Unable to load course section detail">
          {sectionDetailState.message}
        </Alert>
      ) : null}

      {hasActiveScope && sectionsAreLoading && filteredSectionCount === 0 ? (
        <Alert color="blue" title="Loading course sections">
          Loading sections for the selected course offering scope.
        </Alert>
      ) : null}

      {hasActiveScope && !sectionsAreLoading && filteredSectionCount === 0 ? (
        <Alert color="gray" title="No sections match these filters">
          Adjust the section filters to see more sections for this scope.
        </Alert>
      ) : null}
    </>
  );
}

function isErrorState(
  state: CourseSectionListErrorState | CourseSectionDetailErrorState
): state is { status: 'error'; message: string } {
  return state.status === 'error';
}
