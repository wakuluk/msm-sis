import { useState } from 'react';
import { Badge, Button, Group, Stack } from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { AcademicYearCatalogActionsSection } from '@/components/academic-year/catalog/AcademicYearCatalogActionsSection';
import { AcademicYearOfferingSearchSection } from '@/components/academic-year/catalog/AcademicYearOfferingSearchSection';
import { useAcademicYearCatalogSummary } from '@/components/academic-year/catalog/useAcademicYearCatalogSummary';
import { useAcademicYearTermGroups } from '@/components/academic-year/catalog/useAcademicYearTermGroups';
import { AcademicYearTermGroupsSection } from '@/components/academic-year/AcademicYearTermGroupsSection';
import { displayValue } from '@/components/academic-year/academicYearDisplay';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';

export function AcademicYearCatalogPage() {
  const { academicYearId } = useParams<{ academicYearId: string }>();
  const parsedAcademicYearId = Number(academicYearId);
  const hasValidAcademicYearId = Number.isInteger(parsedAcademicYearId) && parsedAcademicYearId > 0;
  const fallbackPath = hasValidAcademicYearId
    ? `/academics/academic-years/${parsedAcademicYearId}`
    : '/academics/academic-years/search';
  const { handleBack } = usePortalBackNavigation({
    fallbackPath,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const {
    state: summaryState,
    summary,
    termOptions,
  } = useAcademicYearCatalogSummary({
    academicYearId: parsedAcademicYearId,
    hasValidAcademicYearId,
    refreshKey,
  });
  const { state: termGroupsState, termGroups } = useAcademicYearTermGroups({
    academicYearId: parsedAcademicYearId,
    hasValidAcademicYearId,
  });

  const pageTitle = summary ? `${summary.academicYearName} Catalog` : 'Manage Catalog';
  const pageDescription = summary
    ? 'Manage year-scoped course offerings and review the terms and sub terms for this academic year.'
    : 'Academic year catalog management will be built here next.';

  function handleCatalogChanged() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title={pageTitle}
      description={pageDescription}
      badge={
        <Group gap="sm">
          <Badge variant="light" size="lg" color="gray">
            Admin only
          </Badge>
          {summaryState.status === 'success' ? (
            <Badge variant="light" size="lg" color="green">
              Live
            </Badge>
          ) : summaryState.status === 'error' ? (
            <Badge variant="light" size="lg" color="red">
              Load failed
            </Badge>
          ) : (
            <Badge variant="light" size="lg" color="blue">
              Loading
            </Badge>
          )}
        </Group>
      }
    >
      <Stack gap={0}>
        <RecordPageSection
          title="Catalog Workspace"
          description="This workspace is scoped to one academic year and its terms and sub terms."
        >
          <ReadOnlyField
            label="Academic year ID"
            value={displayValue(summary?.academicYearId ?? academicYearId)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Academic year code"
            value={displayValue(summary?.academicYearCode)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Academic year name"
            value={displayValue(summary?.academicYearName)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Terms"
            value={displayValue(summary?.termGroupCount)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Sub terms"
            value={displayValue(summary?.termCount)}
            span={{ base: 12, md: 4 }}
          />
          <ReadOnlyField
            label="Course offerings"
            value={displayValue(summary?.courseOfferingCount)}
            span={{ base: 12, md: 4 }}
          />
        </RecordPageSection>

        <AcademicYearCatalogActionsSection
          academicYearId={parsedAcademicYearId}
          hasValidAcademicYearId={hasValidAcademicYearId}
          canManageCatalog={summaryState.status === 'success'}
          termOptions={termOptions}
          onCatalogChanged={handleCatalogChanged}
        >
          <AcademicYearOfferingSearchSection
            academicYearId={parsedAcademicYearId}
            hasValidAcademicYearId={hasValidAcademicYearId}
            termOptions={termOptions}
            reloadKey={refreshKey}
          />
        </AcademicYearCatalogActionsSection>

        <AcademicYearTermGroupsSection
          academicYearId={parsedAcademicYearId}
          termGroups={termGroups}
          isLoading={termGroupsState.status === 'loading'}
          error={termGroupsState.status === 'error' ? termGroupsState.message : null}
        />

        <RecordPageFooter description="Return to the previous page or the academic year detail page.">
          <Button onClick={handleBack} variant="default">
            Back
          </Button>
          <Button component={Link} to={fallbackPath}>
            View academic year
          </Button>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
