import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Stack,
} from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import {
  RequirementEditModal,
  type RequirementEditState,
} from '@/components/requirements/RequirementEditModal';
import {
  RequirementCourseRulesTable,
  RequirementCoursesTable,
} from '@/components/requirements/RequirementRulesTables';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { getRequirementDetail, patchRequirement } from '@/services/requirement-service';
import type {
  PatchRequirementRequest,
  RequirementDetailResponse,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { displayValue } from '@/utils/form-values';
import { formatRequirementType } from '@/utils/requirement-formatters';

type RequirementDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; requirement: RequirementDetailResponse };

export function RequirementDetailPage() {
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/requirements',
  });
  const { requirementId } = useParams<{ requirementId: string }>();
  const parsedRequirementId = Number(requirementId);
  const hasValidRequirementId =
    Number.isInteger(parsedRequirementId) && parsedRequirementId > 0;
  const [pageState, setPageState] = useState<RequirementDetailPageState>({
    status: 'loading',
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editState, setEditState] = useState<RequirementEditState>({ status: 'idle' });

  useEffect(() => {
    if (!hasValidRequirementId) {
      setPageState({
        status: 'error',
        message: 'Requirement ID is missing or invalid.',
      });
      return;
    }

    const abortController = new AbortController();
    setPageState({ status: 'loading' });
    setIsEditModalOpen(false);
    setEditState({ status: 'idle' });

    getRequirementDetail({
      requirementId: parsedRequirementId,
      signal: abortController.signal,
    })
      .then((requirement) => {
        setPageState({ status: 'success', requirement });
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setPageState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load requirement detail.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasValidRequirementId, parsedRequirementId]);

  if (pageState.status === 'loading') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Academic Administration"
        title="Requirement Detail"
        description="Loading requirement detail."
        badge={<Badge variant="light" color="gray" size="lg">Admin only</Badge>}
      >
        <RecordPageSection title="Requirement" description="The requirement detail is loading.">
          <Grid.Col span={12}>
            <Alert color="blue" title="Loading requirement">
              Fetching requirement {requirementId ?? 'unknown'}.
            </Alert>
          </Grid.Col>
        </RecordPageSection>
      </RecordPageShell>
    );
  }

  if (pageState.status === 'error') {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Academic Administration"
        title="Requirement Detail"
        description="Requirement detail could not be loaded."
        badge={<Badge variant="light" color="red" size="lg">Load failed</Badge>}
      >
        <Stack gap={0}>
          <RecordPageSection title="Requirement" description="Review the error below.">
            <Grid.Col span={12}>
              <Alert color="red" title="Unable to load requirement">
                {pageState.message}
              </Alert>
            </Grid.Col>
          </RecordPageSection>
          <RecordPageFooter description="Return to the requirement library.">
            <Button onClick={handleBack} variant="default">Back</Button>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    );
  }

  const { requirement } = pageState;
  const showsRequirementMinimumCredits = requirement.requirementType === 'TOTAL_ELECTIVE_CREDITS';
  const showsRequirementMinimumCourses = requirement.requirementType === 'SPECIFIC_COURSES';
  const showsCourseMatchMode = requirement.requirementType === 'SPECIFIC_COURSES';

  async function handleSaveRequirement(request: PatchRequirementRequest) {
    if (editState.status === 'saving') {
      return;
    }

    try {
      setEditState({ status: 'saving' });
      await patchRequirement({
        requirementId: requirement.requirementId,
        request,
      });
      const updatedRequirement = await getRequirementDetail({
        requirementId: requirement.requirementId,
      });
      setPageState({ status: 'success', requirement: updatedRequirement });
      setEditState({ status: 'idle' });
      setIsEditModalOpen(false);
    } catch (error) {
      setEditState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update requirement.'),
      });
    }
  }

  return (
    <>
      <RequirementEditModal
        editState={editState}
        opened={isEditModalOpen}
        requirement={requirement}
        onSave={handleSaveRequirement}
        onClose={() => {
          if (editState.status === 'saving') {
            return;
          }

          setEditState({ status: 'idle' });
          setIsEditModalOpen(false);
        }}
      />
      <RecordPageShell
        size="xl"
        eyebrow="Academic Administration"
        title={requirement.name}
        description="Review reusable requirement details and rules."
        badge={<Badge variant="light" size="lg">{formatRequirementType(requirement.requirementType)}</Badge>}
      >
        <Stack gap={0}>
        <RecordPageSection
          title="Requirement"
          description="Reusable requirement information."
          action={
            <Group gap="xs">
              <Button
                onClick={() => {
                  setEditState({ status: 'idle' });
                  setIsEditModalOpen(true);
                }}
              >
                Edit
              </Button>
            </Group>
          }
        >
          <ReadOnlyField label="Code" value={displayValue(requirement.code)} />
          <ReadOnlyField label="Name" value={displayValue(requirement.name)} />
          <ReadOnlyField
            label="Type"
            value={formatRequirementType(requirement.requirementType)}
          />
          <ReadOnlyField label="Minimum Grade" value={displayValue(requirement.minimumGrade)} />
          {showsRequirementMinimumCredits ? (
            <ReadOnlyField
              label="Minimum Credits"
              value={displayValue(requirement.minimumCredits)}
            />
          ) : null}
          {showsRequirementMinimumCourses ? (
            <ReadOnlyField
              label="Minimum Courses"
              value={displayValue(requirement.minimumCourses)}
            />
          ) : null}
          {showsCourseMatchMode ? (
            <ReadOnlyField
              label="Course Match Mode"
              value={displayValue(requirement.courseMatchMode)}
            />
          ) : null}
          <ReadOnlyField label="Requirement ID" value={displayValue(requirement.requirementId)} />
          <ReadOnlyField
            label="Description"
            value={displayValue(requirement.description)}
            span={12}
          />
        </RecordPageSection>

        <RequirementCoursesTable courses={requirement.requirementCourses} />
        <RequirementCourseRulesTable rules={requirement.requirementCourseRules} />

        <RecordPageFooter description="Requirement detail navigation.">
          <Button component={Link} to="/academics/requirements" variant="default">
            Requirement Library
          </Button>
          <Button onClick={handleBack} variant="default">
            Back
          </Button>
        </RecordPageFooter>
      </Stack>
      </RecordPageShell>
    </>
  );
}
