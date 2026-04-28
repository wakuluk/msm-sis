import { useEffect, useMemo, useState } from 'react';
import { Button, Grid, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import {
  createCourseSection,
  getCourseSectionsForOffering,
  patchCourseSection,
} from '@/services/course-service';
import { getCourseSectionReferenceOptions } from '@/services/reference-service';
import type { AcademicYearCourseOfferingSearchResultResponse } from '@/services/schemas/admin-courses-schemas';
import type { StaffReferenceOptionResponse } from '@/services/schemas/staff-schemas';
import { searchStaff } from '@/services/staff-service';
import {
  buildCreateSectionRequest,
  buildPatchSectionRequest,
  buildStaffSelectOptions,
} from './courseSectionRequestBuilders';
import { CourseSectionModal } from './CourseSectionModal';
import { CourseSectionsTablePanel } from './CourseSectionsTablePanel';
import {
  buildCreditOptions,
  buildDraftFromSection,
  filterSections,
  getErrorMessage,
  getOptionName,
  mapCourseSectionDetailToPreview,
  mapCourseSectionResultToPreview,
  mapReferenceOptionsToCodeSelectOptions,
} from './courseSectionsWorkspaceUtils';
import {
  initialCourseSectionDraft,
  initialCourseSectionSearchValues,
  type CourseSectionDraft,
  type CourseSectionPreview,
  type CourseSectionSearchValues,
  type SectionReferenceState,
} from './courseSectionsWorkspaceTypes';

export { initialCourseSectionSearchValues };
export type { CourseSectionSearchValues };

type CourseSectionsWorkspaceProps = {
  activeAction: 'add' | 'view';
  selectedOffering: AcademicYearCourseOfferingSearchResultResponse | null;
  selectedOfferings?: ReadonlyArray<AcademicYearCourseOfferingSearchResultResponse>;
  searchValues: CourseSectionSearchValues;
  subTermId: number;
  subTermLabel: string;
  onAddSection: () => void;
  onCancelAdd: () => void;
  onSearchValuesChange: (values: CourseSectionSearchValues) => void;
};

type CourseSectionListState =
  | { status: 'idle'; sections: CourseSectionPreview[] }
  | { status: 'loading'; sections: CourseSectionPreview[] }
  | { status: 'success'; sections: CourseSectionPreview[] }
  | { status: 'error'; sections: CourseSectionPreview[]; message: string };

type CourseSectionDetailState =
  | { status: 'idle' }
  | { status: 'loading'; sectionId: number }
  | { status: 'error'; message: string };

type CourseSectionMutationState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type StaffSearchState =
  | { status: 'idle'; results: StaffReferenceOptionResponse[] }
  | { status: 'loading'; results: StaffReferenceOptionResponse[] }
  | { status: 'success'; results: StaffReferenceOptionResponse[] }
  | { status: 'error'; results: StaffReferenceOptionResponse[]; message: string };

const courseSectionsPageSize = 10;

export function CourseSectionsWorkspace({
  activeAction,
  selectedOffering,
  selectedOfferings,
  searchValues,
  subTermId,
  subTermLabel,
  onAddSection,
  onCancelAdd,
  onSearchValuesChange,
}: CourseSectionsWorkspaceProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [referenceState, setReferenceState] = useState<SectionReferenceState>({
    status: 'loading',
  });
  const [courseSectionDraft, setCourseSectionDraft] = useState<CourseSectionDraft>(initialCourseSectionDraft);
  const [selectedSection, setSelectedSection] = useState<CourseSectionPreview | null>(null);
  const [sectionListState, setSectionListState] = useState<CourseSectionListState>({
    status: 'idle',
    sections: [],
  });
  const [sectionDetailState] = useState<CourseSectionDetailState>({
    status: 'idle',
  });
  const [sectionMutationState, setSectionMutationState] = useState<CourseSectionMutationState>({
    status: 'idle',
  });
  const [staffSearchState, setStaffSearchState] = useState<StaffSearchState>({
    status: 'idle',
    results: [],
  });
  const [staffSearchValue, setStaffSearchValue] = useState('');
  const [sectionListReloadKey, setSectionListReloadKey] = useState(0);
  const [detailEditing, setDetailEditing] = useState(false);
  const [duplicateOffering, setDuplicateOffering] =
    useState<AcademicYearCourseOfferingSearchResultResponse | null>(null);
  const isSearchScope = selectedOfferings !== undefined;
  const activeOfferings = useMemo(
    () =>
      selectedOfferings ??
      (selectedOffering ? [selectedOffering] : []),
    [selectedOffering, selectedOfferings]
  );
  const activeOfferingIds = useMemo(
    () => activeOfferings.map((offering) => offering.courseOfferingId).join(','),
    [activeOfferings]
  );
  const allSections = sectionListState.sections;
  const filteredSections = useMemo(
    () => filterSections(allSections, searchValues),
    [allSections, searchValues]
  );
  const totalPages = Math.max(1, Math.ceil(filteredSections.length / courseSectionsPageSize));
  const pagedSections = useMemo(
    () =>
      filteredSections.slice(
        page * courseSectionsPageSize,
        page * courseSectionsPageSize + courseSectionsPageSize
      ),
    [filteredSections, page]
  );
  const hasActiveScope = activeOfferings.length > 0;
  const workspaceDescription = isSearchScope
    ? 'Review sections for all course offerings in the current offering search results.'
    : 'Manage sections for the selected course offering in this sub term.';
  const sectionModalMode = selectedSection ? 'detail' : 'create';
  const selectedSectionOffering = selectedSection
    ? activeOfferings.find((offering) => offering.courseOfferingId === selectedSection.courseOfferingId) ?? null
    : null;
  const sectionModalOffering = selectedSectionOffering ?? duplicateOffering ?? selectedOffering;
  const sectionModalOpened = Boolean(
    selectedSection ||
      duplicateOffering ||
      (selectedOffering && !isSearchScope && activeAction === 'add')
  );
  const sectionPreviewBase = courseSectionDraft.sectionCode.trim() || 'New';
  const sectionPreview = `${sectionPreviewBase}${courseSectionDraft.honors ? 'H' : ''}`;
  const referenceOptions = referenceState.status === 'success' ? referenceState.response : null;
  const sectionStatusOptions = useMemo(
    () => mapReferenceOptionsToCodeSelectOptions(referenceOptions?.courseSectionStatuses ?? []),
    [referenceOptions]
  );
  const academicDivisionOptions = useMemo(
    () => mapReferenceOptionsToCodeSelectOptions(referenceOptions?.academicDivisions ?? []),
    [referenceOptions]
  );
  const deliveryModeOptions = useMemo(
    () => mapReferenceOptionsToCodeSelectOptions(referenceOptions?.deliveryModes ?? []),
    [referenceOptions]
  );
  const gradingBasisOptions = useMemo(
    () => mapReferenceOptionsToCodeSelectOptions(referenceOptions?.gradingBases ?? []),
    [referenceOptions]
  );
  const creditOptions = useMemo(
    () => buildCreditOptions(sectionModalOffering),
    [sectionModalOffering]
  );
  const selectedStatusName =
    selectedSection?.statusName ??
    getOptionName(referenceOptions?.courseSectionStatuses ?? [], courseSectionDraft.status);
  const referencesAreLoading = referenceState.status === 'loading';
  const sectionsAreLoading = sectionListState.status === 'loading';
  const staffOptions = useMemo(
    () => buildStaffSelectOptions(staffSearchState.results, courseSectionDraft),
    [courseSectionDraft, staffSearchState.results]
  );

  useEffect(() => {
    let cancelled = false;

    setReferenceState({ status: 'loading' });
    void getCourseSectionReferenceOptions()
      .then((response) => {
        if (!cancelled) {
          setReferenceState({ status: 'success', response });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReferenceState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load course section reference options.'),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeOfferings.length === 0) {
      setSectionListState({ status: 'idle', sections: [] });
      return;
    }

    const abortController = new AbortController();
    const offeringsById = new Map(
      activeOfferings.map((offering) => [offering.courseOfferingId, offering])
    );

    setSectionListState((current) => ({
      status: 'loading',
      sections: current.sections,
    }));

    Promise.all(
      activeOfferings.map((offering) =>
        getCourseSectionsForOffering({
          courseOfferingId: offering.courseOfferingId,
          subTermId,
          size: 100,
          signal: abortController.signal,
        })
      )
    )
      .then((responses) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSectionListState({
          status: 'success',
          sections: responses.flatMap((response) =>
            response.results.map((section) =>
              mapCourseSectionResultToPreview(
                section,
                offeringsById.get(section.courseOfferingId ?? 0) ?? null
              )
            )
          ),
        });
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setSectionListState({
          status: 'error',
          sections: [],
          message: getErrorMessage(error, 'Failed to load course sections.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [activeOfferingIds, sectionListReloadKey, subTermId]);

  useEffect(() => {
    setPage(0);
  }, [activeOfferings, searchValues]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const nextCreditOptions = buildCreditOptions(selectedOffering);
    setCourseSectionDraft({
      ...initialCourseSectionDraft,
      credits: nextCreditOptions[0]?.value ?? null,
    });
    setStaffSearchValue('');
  }, [selectedOffering]);

  useEffect(() => {
    if (staffSearchValue.trim().length < 2) {
      setStaffSearchState({ status: 'idle', results: [] });
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setStaffSearchState((current) => ({
        status: 'loading',
        results: current.results,
      }));

      void searchStaff({
        search: staffSearchValue,
        size: 10,
        signal: abortController.signal,
      })
        .then((response) => {
          if (!abortController.signal.aborted) {
            setStaffSearchState({ status: 'success', results: response.results });
          }
        })
        .catch((error: unknown) => {
          if (!abortController.signal.aborted) {
            setStaffSearchState({
              status: 'error',
              results: [],
              message: getErrorMessage(error, 'Failed to search staff.'),
            });
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [staffSearchValue]);

  function closeSectionModal() {
    if (selectedSection) {
      setSelectedSection(null);
      setDetailEditing(false);
      return;
    }

    setSectionMutationState({ status: 'idle' });
    setDuplicateOffering(null);
    onCancelAdd();
  }

  function handleSectionSelected(section: CourseSectionPreview) {
    navigate(`/academics/course-sections/${section.sectionId}`);
  }

  async function handleCreateSection() {
    const createOffering = sectionModalOffering;

    if (!createOffering || sectionMutationState.status === 'saving') {
      return;
    }

    const createRequest = buildCreateSectionRequest(courseSectionDraft, subTermId);

    if (typeof createRequest === 'string') {
      setSectionMutationState({ status: 'error', message: createRequest });
      return;
    }

    try {
      setSectionMutationState({ status: 'saving' });
      await createCourseSection({
        courseOfferingId: createOffering.courseOfferingId,
        request: createRequest,
      });
      setSectionMutationState({ status: 'idle' });
      setDuplicateOffering(null);
      setSectionListReloadKey((current) => current + 1);
      onCancelAdd();
    } catch (error: unknown) {
      setSectionMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create course section.'),
      });
    }
  }

  async function handleSaveSection() {
    if (!selectedSection || sectionMutationState.status === 'saving') {
      return;
    }

    const patchRequest = buildPatchSectionRequest(courseSectionDraft, subTermId);

    if (typeof patchRequest === 'string') {
      setSectionMutationState({ status: 'error', message: patchRequest });
      return;
    }

    try {
      setSectionMutationState({ status: 'saving' });
      const response = await patchCourseSection({
        sectionId: selectedSection.sectionId,
        request: patchRequest,
      });
      const updatedSection = mapCourseSectionDetailToPreview(response);
      const nextCreditOptions = buildCreditOptions(sectionModalOffering);

      setSelectedSection(updatedSection);
      setCourseSectionDraft({
        ...buildDraftFromSection(updatedSection),
        credits:
          updatedSection.credits === null
            ? nextCreditOptions[0]?.value ?? null
            : String(updatedSection.credits),
      });
      setStaffSearchValue(updatedSection.instructor === 'Unassigned' ? '' : updatedSection.instructor);
      setDetailEditing(false);
      setSectionMutationState({ status: 'idle' });
      setSectionListReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setSectionMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update course section.'),
      });
    }
  }

  async function handleCancelSection() {
    if (!selectedSection || sectionMutationState.status === 'saving') {
      return;
    }

    try {
      setSectionMutationState({ status: 'saving' });
      const response = await patchCourseSection({
        sectionId: selectedSection.sectionId,
        request: {
          statusCode: 'CANCELLED',
        },
      });
      const updatedSection = mapCourseSectionDetailToPreview(response);
      const nextCreditOptions = buildCreditOptions(sectionModalOffering);

      setSelectedSection(updatedSection);
      setCourseSectionDraft({
        ...buildDraftFromSection(updatedSection),
        credits:
          updatedSection.credits === null
            ? nextCreditOptions[0]?.value ?? null
            : String(updatedSection.credits),
      });
      setStaffSearchValue(updatedSection.instructor === 'Unassigned' ? '' : updatedSection.instructor);
      setDetailEditing(false);
      setSectionMutationState({ status: 'idle' });
      setSectionListReloadKey((current) => current + 1);
    } catch (error: unknown) {
      setSectionMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to cancel course section.'),
      });
    }
  }

  function handleDuplicateSection() {
    if (!selectedSection) {
      return;
    }

    const sectionOffering =
      activeOfferings.find((offering) => offering.courseOfferingId === selectedSection.courseOfferingId) ??
      selectedSectionOffering;
    const nextCreditOptions = buildCreditOptions(sectionOffering);

    setCourseSectionDraft({
      ...buildDraftFromSection(selectedSection),
      sectionCode: '',
      credits:
        selectedSection.credits === null
          ? nextCreditOptions[0]?.value ?? null
          : String(selectedSection.credits),
    });
    setStaffSearchValue(selectedSection.instructor === 'Unassigned' ? '' : selectedSection.instructor);
    setDuplicateOffering(sectionOffering);
    setSelectedSection(null);
    setDetailEditing(false);
    setSectionMutationState({ status: 'idle' });
  }

  return (
    <>
      <RecordPageSection
        title="Course Sections"
        description={workspaceDescription}
        action={
          <Group gap="sm" wrap="wrap" justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                onSearchValuesChange(initialCourseSectionSearchValues);
              }}
              disabled={!hasActiveScope}
            >
              Clear section filters
            </Button>
            <Button variant="light" onClick={onAddSection} disabled={!selectedOffering || isSearchScope}>
              Add section
            </Button>
          </Group>
        }
      >
        <Grid.Col span={12}>
          <CourseSectionsTablePanel
            activeOfferingCount={activeOfferings.length}
            allSectionCount={allSections.length}
            filteredSections={filteredSections}
            hasActiveScope={hasActiveScope}
            isSearchScope={isSearchScope}
            page={page}
            pagedSections={pagedSections}
            referencesAreLoading={referencesAreLoading}
            referenceState={referenceState}
            searchValues={searchValues}
            sectionDetailState={sectionDetailState}
            sectionListState={sectionListState}
            sectionStatusOptions={sectionStatusOptions}
            sectionsAreLoading={sectionsAreLoading}
            selectedOffering={selectedOffering}
            subTermLabel={subTermLabel}
            totalPages={totalPages}
            onPageChange={setPage}
            onSearchValuesChange={onSearchValuesChange}
            onSectionSelected={handleSectionSelected}
          />
        </Grid.Col>
      </RecordPageSection>

      <CourseSectionModal
        opened={sectionModalOpened}
        mode={sectionModalMode}
        offering={sectionModalOffering}
        selectedSection={selectedSection}
        draft={courseSectionDraft}
        setDraft={setCourseSectionDraft}
        detailEditing={detailEditing}
        setDetailEditing={setDetailEditing}
        subTermLabel={subTermLabel}
        sectionPreview={sectionPreview}
        selectedStatusName={selectedStatusName}
        sectionStatusOptions={sectionStatusOptions}
        academicDivisionOptions={academicDivisionOptions}
        gradingBasisOptions={gradingBasisOptions}
        deliveryModeOptions={deliveryModeOptions}
        creditOptions={creditOptions}
        referencesAreLoading={referencesAreLoading}
        staffOptions={staffOptions}
        staffSearchValue={staffSearchValue}
        staffLoading={staffSearchState.status === 'loading'}
        mutationError={sectionMutationState.status === 'error' ? sectionMutationState.message : null}
        mutating={sectionMutationState.status === 'saving'}
        onStaffSearchChange={setStaffSearchValue}
        onClose={closeSectionModal}
        onCancelEdit={() => {
          if (selectedSection) {
            setCourseSectionDraft({
              ...buildDraftFromSection(selectedSection),
              credits:
                selectedSection.credits === null
                  ? creditOptions[0]?.value ?? null
                  : String(selectedSection.credits),
            });
          }
          setDetailEditing(false);
        }}
        onCreate={handleCreateSection}
        onSave={handleSaveSection}
        onCancelSection={handleCancelSection}
        onDuplicate={handleDuplicateSection}
      />
    </>
  );
}
