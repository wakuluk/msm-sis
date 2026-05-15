import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Badge,
  Button,
  Checkbox,
  FileInput,
  Grid,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDownload, IconFileTypePdf, IconTrash } from '@tabler/icons-react';
import { useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import { WorkflowStatusStepperSection } from '@/components/status/WorkflowStatusStepperSection';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import { searchCourses } from '@/services/course-service';
import { searchRequirements } from '@/services/requirement-service';
import type { CourseSearchResultResponse } from '@/services/schemas/course-schemas';
import type { RequirementSearchResultResponse } from '@/services/schemas/program-schemas';
import type { TransferRequestPolicyEvaluationResponse } from '@/services/schemas/transfer-request-policy-evaluation-schemas';
import type {
  TransferRequestAttachmentResponse,
  TransferCourseEquivalencyDetailResponse,
  TransferCourseEquivalencySummaryResponse,
  TransferRequestCourseResponse,
  TransferInstitutionOptionResponse,
  TransferRequestMappingComparisonResponse,
  TransferRequestOutcomeResponse,
  TransferRequestPolicyWaiverResponse,
  TransferRequestResponse,
} from '@/services/schemas/transfer-request-schemas';
import { getTransferRequestPolicyEvaluation } from '@/services/transfer-request-policy-evaluation-service';
import {
  approveAdminTransferRequest,
  createAdminTransferRequestOutcome,
  createAdminTransferRequestOutcomesFromEquivalency,
  deleteAdminTransferRequestOutcome,
  deleteAdminTransferRequestWaiver,
  downloadAdminTransferRequestTranscript,
  getAdminTransferRequest,
  getAdminTransferRequestMappingComparison,
  getAdminTransferRequestTranscript,
  getTransferCourseEquivalency,
  listAdminTransferRequestCourses,
  listAdminTransferRequestOutcomes,
  listAdminTransferRequestWaivers,
  listTransferCourseEquivalencies,
  listTransferInstitutions,
  updateAdminTransferRequestMatchedInstitution,
  updateAdminTransferRequestOutcome,
  updateAdminTransferRequestWorkflow,
  uploadAdminTransferRequestTranscript,
  upsertAdminTransferRequestPrimaryCourse,
  upsertAdminTransferRequestWaiver,
} from '@/services/transfer-request-service';
import { getErrorMessage } from '@/utils/errors';
import { displayValue } from '@/utils/form-values';

type RequestStatus =
  | 'SUBMITTED'
  | 'WAITING_FOR_MORE_INFO'
  | 'REGISTRAR_REVIEW'
  | 'APPROVED'
  | 'DENIED'
  | 'CANCELLED';

type CourseFormValues = {
  attemptedCredits: number | string;
  earnedCredits: number | string;
  externalCourseDescription: string;
  externalCourseNumber: string;
  externalCourseTitle: string;
  externalSubjectCode: string;
  externalTerm: string;
  grade: string;
  reason: string;
  requestedCredits: number | string;
  studentNotes: string;
};

type AddOutcomeFormValues = {
  acceptedCredits: number | string;
  localCourseId: string;
  localCourseLabel: string;
  notes: string;
  outcomeType: string;
  requirementId: string;
};

const transferRequestStatuses = [
  { code: 'SUBMITTED', name: 'Submitted', order: 1 },
  { code: 'WAITING_FOR_MORE_INFO', name: 'Waiting for more info', order: 2 },
  { code: 'REGISTRAR_REVIEW', name: 'Registrar review', order: 3 },
  { code: 'APPROVED', name: 'Approved', order: 4 },
  { code: 'DENIED', name: 'Denied', order: 5 },
  { code: 'CANCELLED', name: 'Cancelled', order: 6 },
];

const editableWorkflowStatuses: RequestStatus[] = [
  'SUBMITTED',
  'WAITING_FOR_MORE_INFO',
  'REGISTRAR_REVIEW',
  'APPROVED',
];

const statusOptions = transferRequestStatuses.map((status) => ({
  value: status.code,
  label: status.name,
}));

const gradeOptions = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'P'].map((grade) => ({
  value: grade,
  label: grade,
}));

const outcomeTypeOptions = [
  { value: 'COURSE_SUBSTITUTION', label: 'Course substitution' },
  { value: 'REQUIREMENT_WAIVER', label: 'Requirement waiver' },
];

type StubInstitutionCourseTemplate = {
  acceptedCredits: number;
  externalCourse: string;
  externalTitle: string;
  id: string;
  lastApproved: string;
  requirement: string;
  searchText: string;
  suggestedOutcomes: Array<{
    acceptedCredits: number | null;
    localCourseCode: string | null;
    notes: string;
    outcomeType: string;
    requirementCode: string | null;
    requirementName: string | null;
  }>;
};

const stubInstitutionCourseTemplates: StubInstitutionCourseTemplate[] = [
  {
    acceptedCredits: 3,
    externalCourse: 'LIT 240',
    externalTitle: 'Myth and Language',
    id: 'lit-240',
    lastApproved: '2026-03-12',
    requirement: 'REQ-TOLK-CHOOSE-2',
    searchText: 'lit 240 myth and language tolk 240 req-tolk-choose-2',
    suggestedOutcomes: [
      {
        acceptedCredits: 3,
        localCourseCode: 'TOLK 240',
        notes: 'Suggested from saved institution equivalency history.',
        outcomeType: 'COURSE_SUBSTITUTION',
        requirementCode: 'REQ-TOLK-CHOOSE-2',
        requirementName: 'Choose two Tolkien studies courses',
      },
    ],
  },
  {
    acceptedCredits: 3,
    externalCourse: 'HIST 110',
    externalTitle: 'World History',
    id: 'hist-110',
    lastApproved: '2025-11-08',
    requirement: 'Free elective',
    searchText: 'hist 110 world history free elective transfer credit',
    suggestedOutcomes: [
      {
        acceptedCredits: 3,
        localCourseCode: null,
        notes: 'Transfer credit only; no local course substitution suggested.',
        outcomeType: 'TRANSFER_CREDIT',
        requirementCode: null,
        requirementName: null,
      },
    ],
  },
  {
    acceptedCredits: 4,
    externalCourse: 'BIO 151',
    externalTitle: 'Anatomy and Physiology I',
    id: 'bio-151',
    lastApproved: '2026-01-19',
    requirement: 'REQ-HUM-ELECTIVE-9',
    searchText: 'bio 151 anatomy physiology hum elective requirement waiver',
    suggestedOutcomes: [
      {
        acceptedCredits: 4,
        localCourseCode: null,
        notes: 'Suggested requirement waiver based on prior registrar decision.',
        outcomeType: 'REQUIREMENT_WAIVER',
        requirementCode: 'REQ-HUM-ELECTIVE-9',
        requirementName: 'Complete 9 credits in humanities electives',
      },
    ],
  },
];

const defaultCourseValues: CourseFormValues = {
  attemptedCredits: '',
  earnedCredits: '',
  externalCourseDescription: '',
  externalCourseNumber: '',
  externalCourseTitle: '',
  externalSubjectCode: '',
  externalTerm: '',
  grade: '',
  reason: '',
  requestedCredits: '',
  studentNotes: '',
};

const defaultOutcomeValues: AddOutcomeFormValues = {
  acceptedCredits: '',
  localCourseId: '',
  localCourseLabel: '',
  notes: '',
  outcomeType: 'COURSE_SUBSTITUTION',
  requirementId: '',
};

function trimmedOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function numberOrNull(value: number | string) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isSubstitutionOutcome(outcome: { outcomeType: string }) {
  return outcome.outcomeType !== 'TRANSFER_CREDIT';
}

function formatStatus(status: string | null | undefined) {
  if (!status) {
    return 'Unknown';
  }

  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function statusColor(status: string | null | undefined) {
  switch (status) {
    case 'APPROVED':
      return 'green';
    case 'DENIED':
    case 'CANCELLED':
      return 'red';
    case 'WAITING_FOR_MORE_INFO':
      return 'yellow';
    case 'REGISTRAR_REVIEW':
      return 'blue';
    case 'SUBMITTED':
      return 'gray';
    default:
      return 'gray';
  }
}

function isTerminalStatus(code: string | null | undefined) {
  return code === 'DENIED' || code === 'CANCELLED';
}

function formatCourse(course: TransferRequestCourseResponse | null | undefined) {
  if (!course) {
    return 'Course details pending';
  }

  return [course.externalSubjectCode, course.externalCourseNumber, course.externalCourseTitle]
    .filter(Boolean)
    .join(' ');
}

function policyCheckColor(status: string) {
  switch (status) {
    case 'PASSED':
      return 'green';
    case 'WAIVED':
      return 'yellow';
    case 'FAILED':
      return 'red';
    default:
      return 'gray';
  }
}

function courseOptionLabel(course: CourseSearchResultResponse) {
  return [course.courseCode, course.currentVersionTitle].filter(Boolean).join(' ');
}

function triggerPdfDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function PolicyDisplay({
  label,
  value,
}: {
  label: string;
  value: number | string | null | undefined;
}) {
  return (
    <Grid.Col span={{ base: 12, md: 4 }}>
      <Stack gap={2}>
        <Text size="xs" fw={700} c="dimmed">
          {label}
        </Text>
        <Text size="sm">{displayValue(value)}</Text>
      </Stack>
    </Grid.Col>
  );
}

export function AdminTransferRequestDetailPage() {
  const { transferRequestId } = useParams<{ transferRequestId: string }>();
  const parsedTransferRequestId = Number(transferRequestId);
  const hasValidRequestId =
    Number.isInteger(parsedTransferRequestId) && parsedTransferRequestId > 0;
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/transfer-requests',
  });

  const [request, setRequest] = useState<TransferRequestResponse | null>(null);
  const [courses, setCourses] = useState<TransferRequestCourseResponse[]>([]);
  const [transcript, setTranscript] = useState<TransferRequestAttachmentResponse | null>(null);
  const [outcomes, setOutcomes] = useState<TransferRequestOutcomeResponse[]>([]);
  const [waivers, setWaivers] = useState<TransferRequestPolicyWaiverResponse[]>([]);
  const [policyEvaluation, setPolicyEvaluation] =
    useState<TransferRequestPolicyEvaluationResponse | null>(null);
  const [mappingComparison, setMappingComparison] =
    useState<TransferRequestMappingComparisonResponse | null>(null);
  const [mappingComparisonError, setMappingComparisonError] = useState('');
  const [courseOptions, setCourseOptions] = useState<CourseSearchResultResponse[]>([]);
  const [requirementOptions, setRequirementOptions] = useState<RequirementSearchResultResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingRequest, setIsEditingRequest] = useState(false);
  const [approveInstitutionModalOpen, setApproveInstitutionModalOpen] = useState(false);
  const [institutionMatchModalOpen, setInstitutionMatchModalOpen] = useState(false);
  const [institutionOptions, setInstitutionOptions] = useState<TransferInstitutionOptionResponse[]>(
    []
  );
  const [institutionOptionsError, setInstitutionOptionsError] = useState('');
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [institutionSortBy, setInstitutionSortBy] = useState<
    'code' | 'institutionLevel' | 'name'
  >('name');
  const [institutionSortDirection, setInstitutionSortDirection] = useState<'asc' | 'desc'>('asc');
  const [matchedInstitution, setMatchedInstitution] =
    useState<TransferInstitutionOptionResponse | null>(null);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [prepopulateModalOpen, setPrepopulateModalOpen] = useState(false);
  const [prepopulateSearch, setPrepopulateSearch] = useState('');
  const [prepopulateSortBy, setPrepopulateSortBy] = useState<
    'externalCourseTitle' | 'externalCredits' | 'externalCourse' | 'updatedAt'
  >('externalCourse');
  const [prepopulateSortDirection, setPrepopulateSortDirection] = useState<'asc' | 'desc'>('asc');
  const [courseEquivalencies, setCourseEquivalencies] = useState<
    TransferCourseEquivalencySummaryResponse[]
  >([]);
  const [courseEquivalencyDetail, setCourseEquivalencyDetail] =
    useState<TransferCourseEquivalencyDetailResponse | null>(null);
  const [courseEquivalenciesError, setCourseEquivalenciesError] = useState('');
  const [isLoadingCourseEquivalencies, setIsLoadingCourseEquivalencies] = useState(false);
  const [approvalScenarioOverride, setApprovalScenarioOverride] = useState<
    'matched' | 'unmatched' | null
  >(null);
  const [selectedCourseEquivalencyId, setSelectedCourseEquivalencyId] = useState('');
  const [saveInstitutionOnApproval, setSaveInstitutionOnApproval] = useState(true);
  const [saveSubstitutionsOnApproval, setSaveSubstitutionsOnApproval] = useState(true);
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<TransferRequestOutcomeResponse | null>(null);

  const courseForm = useForm<CourseFormValues>({
    initialValues: defaultCourseValues,
    validate: {
      externalCourseTitle: (value) =>
        value.trim().length === 0 ? 'External course title is required.' : null,
    },
  });
  const outcomeForm = useForm<AddOutcomeFormValues>({
    initialValues: defaultOutcomeValues,
    validate: {
      localCourseLabel: (value, values) =>
        values.outcomeType === 'COURSE_SUBSTITUTION' && value.trim().length === 0
          ? 'Local course is required.'
          : null,
      requirementId: (value, values) =>
        values.outcomeType === 'REQUIREMENT_WAIVER' && value.trim().length === 0
          ? 'Requirement is required.'
          : null,
    },
  });
  const courseFormRef = useRef(courseForm);

  courseFormRef.current = courseForm;

  const primaryCourse = courses[0] ?? request?.primaryCourse ?? null;
  const currentWorkflowStepIndex = editableWorkflowStatuses.indexOf(
    (request?.status ?? 'SUBMITTED') as RequestStatus
  );
  const courseAutocompleteData = courseOptions.map(courseOptionLabel);
  const selectedLocalCourse = courseOptions.find(
    (course) => courseOptionLabel(course) === outcomeForm.values.localCourseLabel
  );
  const linkedInstitutionName =
    matchedInstitution?.name ?? request?.institution.transferInstitutionName ?? null;
  const linkedInstitutionId =
    matchedInstitution?.transferInstitutionId ?? request?.institution.transferInstitutionId ?? null;
  const linkedInstitutionAddress = {
    addressLine1:
      matchedInstitution?.addressLine1 ?? request?.institution.transferInstitutionAddressLine1 ?? null,
    addressLine2:
      matchedInstitution?.addressLine2 ?? request?.institution.transferInstitutionAddressLine2 ?? null,
    city: matchedInstitution?.city ?? request?.institution.transferInstitutionCity ?? null,
    stateRegion:
      matchedInstitution?.stateRegion ?? request?.institution.transferInstitutionStateRegion ?? null,
    postalCode:
      matchedInstitution?.postalCode ?? request?.institution.transferInstitutionPostalCode ?? null,
    countryCode:
      matchedInstitution?.countryCode ?? request?.institution.transferInstitutionCountryCode ?? null,
    website: matchedInstitution?.website ?? request?.institution.transferInstitutionWebsite ?? null,
  };
  const hasLinkedInstitution =
    Boolean(request?.institution.transferInstitutionId) || matchedInstitution !== null;
  const approvalScenarioIsMatched =
    approvalScenarioOverride === 'matched' ||
    (approvalScenarioOverride === null && hasLinkedInstitution);
  const approvalScenarioInstitutionName =
    approvalScenarioIsMatched && linkedInstitutionName ? linkedInstitutionName : 'Selected institution';
  const sortedInstitutionOptions = [...institutionOptions].sort((left, right) => {
    const comparison = String(left[institutionSortBy] ?? '').localeCompare(
      String(right[institutionSortBy] ?? '')
    );

    return institutionSortDirection === 'asc' ? comparison : -comparison;
  });
  const selectedInstitution =
    sortedInstitutionOptions.find(
      (institution) => String(institution.transferInstitutionId) === selectedInstitutionId
    ) ??
    institutionOptions.find(
      (institution) => String(institution.transferInstitutionId) === selectedInstitutionId
    ) ??
    null;
  const displayedOutcomes = outcomes.filter(isSubstitutionOutcome);
  const previousMappingPreview = (mappingComparison?.previousOutcomes ?? []).filter(
    isSubstitutionOutcome
  );
  const proposedMappingPreview = (mappingComparison?.proposedOutcomes ?? displayedOutcomes).filter(
    isSubstitutionOutcome
  );
  const sortedCourseEquivalencies = [...courseEquivalencies].sort((left, right) => {
    const leftValue =
      prepopulateSortBy === 'externalCourse'
        ? `${left.externalSubjectCode} ${left.externalCourseNumber}`
        : left[prepopulateSortBy];
    const rightValue =
      prepopulateSortBy === 'externalCourse'
        ? `${right.externalSubjectCode} ${right.externalCourseNumber}`
        : right[prepopulateSortBy];
    const comparison =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));

    return prepopulateSortDirection === 'asc' ? comparison : -comparison;
  });
  const selectedCourseEquivalency =
    courseEquivalencies.find(
      (equivalency) => String(equivalency.transferCourseEquivalencyId) === selectedCourseEquivalencyId
    ) ??
    sortedCourseEquivalencies[0] ??
    null;
  const selectedCourseEquivalencyOutcomes =
    courseEquivalencyDetail?.outcomes.filter(isSubstitutionOutcome) ?? [];
  const requirementSelectOptions = requirementOptions.map((requirement) => ({
    value: String(requirement.requirementId),
    label: `${requirement.code} ${requirement.name}`,
  }));
  const waiverTypes = useMemo(
    () => new Set(waivers.map((waiver) => waiver.policyCheckType)),
    [waivers]
  );

  const hydrateForms = useCallback(
    (nextRequest: TransferRequestResponse, nextCourses: TransferRequestCourseResponse[]) => {
      const course = nextCourses[0] ?? nextRequest.primaryCourse;

      courseFormRef.current.setValues({
        attemptedCredits: course?.attemptedCredits ?? '',
        earnedCredits: course?.earnedCredits ?? '',
        externalCourseDescription: course?.externalCourseDescription ?? '',
        externalCourseNumber: course?.externalCourseNumber ?? '',
        externalCourseTitle: course?.externalCourseTitle ?? '',
        externalSubjectCode: course?.externalSubjectCode ?? '',
        externalTerm: course?.externalTerm ?? '',
        grade: course?.grade ?? '',
        reason: course?.reason ?? '',
        requestedCredits: course?.requestedCredits ?? '',
        studentNotes: course?.studentNotes ?? '',
      });
    },
    []
  );

  const loadDetail = useCallback(async () => {
    if (!hasValidRequestId) {
      setLoadError('Transfer request id is invalid.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');
    setActionError('');

    try {
      const [nextRequest, nextCourses, nextPolicyEvaluation, nextWaivers] = await Promise.all([
        getAdminTransferRequest({ transferRequestId: parsedTransferRequestId }),
        listAdminTransferRequestCourses({ transferRequestId: parsedTransferRequestId }),
        getTransferRequestPolicyEvaluation({ transferRequestId: parsedTransferRequestId }),
        listAdminTransferRequestWaivers({ transferRequestId: parsedTransferRequestId }),
      ]);

      let nextTranscript: TransferRequestAttachmentResponse | null = null;
      try {
        nextTranscript = await getAdminTransferRequestTranscript({
          transferRequestId: parsedTransferRequestId,
        });
      } catch {
        nextTranscript = null;
      }

      const nextPrimaryCourse = nextCourses[0] ?? nextRequest.primaryCourse;
      const nextOutcomes = nextPrimaryCourse
        ? await listAdminTransferRequestOutcomes({
            transferRequestCourseId: nextPrimaryCourse.transferRequestCourseId,
          })
        : [];

      setRequest(nextRequest);
      setCourses(nextCourses);
      setPolicyEvaluation(nextPolicyEvaluation);
      setWaivers(nextWaivers);
      setTranscript(nextTranscript);
      setOutcomes(nextOutcomes);
      hydrateForms(nextRequest, nextCourses);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Failed to load transfer request detail.'));
    } finally {
      setIsLoading(false);
    }
  }, [hasValidRequestId, hydrateForms, parsedTransferRequestId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    async function loadModalOptions() {
      if (!substitutionModalOpen) {
        return;
      }

      try {
        const [courseResponse, requirementResponse] = await Promise.all([
          searchCourses({ size: 20, currentVersionOnly: true }),
          searchRequirements({ size: 50 }),
        ]);
        setCourseOptions(courseResponse.results);
        setRequirementOptions(requirementResponse.results);
      } catch (error) {
        setActionError(getErrorMessage(error, 'Failed to load substitution options.'));
      }
    }

    void loadModalOptions();
  }, [substitutionModalOpen]);

  useEffect(() => {
    if (!institutionMatchModalOpen) {
      return;
    }

    let cancelled = false;

    async function loadInstitutionOptions() {
      setInstitutionOptionsError('');

      try {
        const institutions = await listTransferInstitutions({ search: institutionSearch });

        if (!cancelled) {
          setInstitutionOptions(institutions);
        }
      } catch (error) {
        if (!cancelled) {
          setInstitutionOptionsError(
            getErrorMessage(error, 'Failed to load saved institutions.')
          );
        }
      }
    }

    void loadInstitutionOptions();

    return () => {
      cancelled = true;
    };
  }, [institutionMatchModalOpen, institutionSearch]);

  useEffect(() => {
    if (!prepopulateModalOpen || !linkedInstitutionId) {
      setCourseEquivalencies([]);
      setCourseEquivalencyDetail(null);
      return;
    }

    let cancelled = false;
    const transferInstitutionId = linkedInstitutionId;

    async function loadCourseEquivalencies() {
      setIsLoadingCourseEquivalencies(true);
      setCourseEquivalenciesError('');

      try {
        const equivalencies = await listTransferCourseEquivalencies({
          search: prepopulateSearch,
          transferInstitutionId,
        });

        if (!cancelled) {
          setCourseEquivalencies(equivalencies);
          setSelectedCourseEquivalencyId((current) => {
            if (
              current &&
              equivalencies.some(
                (equivalency) => String(equivalency.transferCourseEquivalencyId) === current
              )
            ) {
              return current;
            }

            return equivalencies[0]?.transferCourseEquivalencyId
              ? String(equivalencies[0].transferCourseEquivalencyId)
              : '';
          });
        }
      } catch (error) {
        if (!cancelled) {
          setCourseEquivalenciesError(
            getErrorMessage(error, 'Failed to load saved course equivalencies.')
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCourseEquivalencies(false);
        }
      }
    }

    void loadCourseEquivalencies();

    return () => {
      cancelled = true;
    };
  }, [linkedInstitutionId, prepopulateModalOpen, prepopulateSearch]);

  useEffect(() => {
    if (!prepopulateModalOpen || !selectedCourseEquivalency) {
      setCourseEquivalencyDetail(null);
      return;
    }

    let cancelled = false;

    async function loadCourseEquivalencyDetail() {
      try {
        const detail = await getTransferCourseEquivalency({
          transferCourseEquivalencyId: selectedCourseEquivalency.transferCourseEquivalencyId,
        });

        if (!cancelled) {
          setCourseEquivalencyDetail(detail);
        }
      } catch (error) {
        if (!cancelled) {
          setCourseEquivalenciesError(
            getErrorMessage(error, 'Failed to load saved course equivalency detail.')
          );
        }
      }
    }

    void loadCourseEquivalencyDetail();

    return () => {
      cancelled = true;
    };
  }, [prepopulateModalOpen, selectedCourseEquivalency]);

  useEffect(() => {
    if (!approveInstitutionModalOpen || !request || !approvalScenarioIsMatched) {
      setMappingComparison(null);
      setMappingComparisonError('');
      return;
    }

    let cancelled = false;
    const transferRequestId = request.transferRequestId;

    async function loadMappingComparison() {
      setMappingComparisonError('');

      try {
        const comparison = await getAdminTransferRequestMappingComparison({
          transferRequestId,
        });

        if (!cancelled) {
          setMappingComparison(comparison);
        }
      } catch (error) {
        if (!cancelled) {
          setMappingComparisonError(
            getErrorMessage(error, 'Failed to load transfer mapping comparison.')
          );
        }
      }
    }

    void loadMappingComparison();

    return () => {
      cancelled = true;
    };
  }, [approvalScenarioIsMatched, approveInstitutionModalOpen, request]);

  async function handleStatusChange(nextStatus: RequestStatus) {
    if (!request) {
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      const updatedRequest = await updateAdminTransferRequestWorkflow({
        transferRequestId: request.transferRequestId,
        request: {
          status: nextStatus,
          decisionNotes: request.decisionNotes,
        },
      });
      setRequest(updatedRequest);
      setActionMessage('Status updated.');
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to update status.'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleApproveClick() {
    setApprovalScenarioOverride(null);
    setSaveInstitutionOnApproval(!hasLinkedInstitution);
    setSaveSubstitutionsOnApproval(displayedOutcomes.length > 0);
    setApproveInstitutionModalOpen(true);
  }

  async function handleApproveRequest() {
    if (!request) {
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      const updatedRequest = await approveAdminTransferRequest({
        transferRequestId: request.transferRequestId,
        request: {
          decisionNotes: request.decisionNotes,
          saveInstitution: !approvalScenarioIsMatched && saveInstitutionOnApproval,
          saveOrUpdateInstitutionMapping: saveSubstitutionsOnApproval,
        },
      });
      setRequest(updatedRequest);
      setApproveInstitutionModalOpen(false);
      setApprovalScenarioOverride(null);
      setActionMessage('Transfer request approved and posted.');
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to approve transfer request.'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenInstitutionMatchModal() {
    setSelectedInstitutionId(
      matchedInstitution?.transferInstitutionId
        ? String(matchedInstitution.transferInstitutionId)
        : request?.institution.transferInstitutionId
          ? String(request.institution.transferInstitutionId)
          : ''
    );
    setInstitutionSearch(request?.institution.oneOffInstitutionName ?? '');
    setInstitutionMatchModalOpen(true);
  }

  function handleInstitutionSort(sortBy: 'code' | 'institutionLevel' | 'name') {
    if (institutionSortBy === sortBy) {
      setInstitutionSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setInstitutionSortBy(sortBy);
    setInstitutionSortDirection('asc');
  }

  function formatInstitutionSortLabel(sortBy: 'code' | 'institutionLevel' | 'name') {
    if (institutionSortBy !== sortBy) {
      return '';
    }

    return institutionSortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  async function handleUseInstitutionMatch() {
    const institution = selectedInstitution;

    if (!institution || !request) {
      setActionError('Choose an institution to link.');
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      const updatedRequest = await updateAdminTransferRequestMatchedInstitution({
        transferRequestId: request.transferRequestId,
        request: {
          transferInstitutionId: institution.transferInstitutionId,
        },
      });

      setMatchedInstitution(institution);
      setRequest(updatedRequest);
      setInstitutionMatchModalOpen(false);
      setActionMessage('Institution match saved.');
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to save institution match.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClearInstitutionMatch() {
    if (!request) {
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      const updatedRequest = await updateAdminTransferRequestMatchedInstitution({
        transferRequestId: request.transferRequestId,
        request: {
          transferInstitutionId: null,
        },
      });

      setMatchedInstitution(null);
      setRequest(updatedRequest);
      setActionMessage('Institution match cleared.');
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to clear institution match.'));
    } finally {
      setIsSaving(false);
    }
  }

  function handlePrepopulateSort(
    sortBy: 'externalCourseTitle' | 'externalCredits' | 'externalCourse' | 'updatedAt'
  ) {
    if (prepopulateSortBy === sortBy) {
      setPrepopulateSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setPrepopulateSortBy(sortBy);
    setPrepopulateSortDirection('asc');
  }

  function formatPrepopulateSortLabel(
    sortBy: 'externalCourseTitle' | 'externalCredits' | 'externalCourse' | 'updatedAt'
  ) {
    if (prepopulateSortBy !== sortBy) {
      return '';
    }

    return prepopulateSortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  async function handleAddSelectedEquivalency() {
    if (!primaryCourse || !selectedCourseEquivalency) {
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      await createAdminTransferRequestOutcomesFromEquivalency({
        transferRequestCourseId: primaryCourse.transferRequestCourseId,
        transferCourseEquivalencyId: selectedCourseEquivalency.transferCourseEquivalencyId,
      });
      setPrepopulateModalOpen(false);
      setActionMessage(
        `${selectedCourseEquivalency.externalSubjectCode} ${selectedCourseEquivalency.externalCourseNumber} outcomes added from saved institution mapping.`
      );
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to add outcomes from saved equivalency.'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleStepDown() {
    if (currentWorkflowStepIndex <= 0) {
      return;
    }

    void handleStatusChange(editableWorkflowStatuses[currentWorkflowStepIndex - 1]);
  }

  function handleStepUp() {
    if (
      currentWorkflowStepIndex < 0 ||
      currentWorkflowStepIndex >= editableWorkflowStatuses.length - 1
    ) {
      return;
    }

    const nextStatus = editableWorkflowStatuses[currentWorkflowStepIndex + 1];
    if (nextStatus === 'APPROVED') {
      handleApproveClick();
      return;
    }

    void handleStatusChange(nextStatus);
  }

  async function handleSaveCourse(values: CourseFormValues) {
    if (!request) {
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      await upsertAdminTransferRequestPrimaryCourse({
        transferRequestId: request.transferRequestId,
        request: {
          externalSubjectCode: trimmedOrNull(values.externalSubjectCode),
          externalCourseNumber: trimmedOrNull(values.externalCourseNumber),
          externalCourseTitle: values.externalCourseTitle,
          externalCourseDescription: trimmedOrNull(values.externalCourseDescription),
          externalTerm: trimmedOrNull(values.externalTerm),
          requestedCredits: numberOrNull(values.requestedCredits),
          attemptedCredits: numberOrNull(values.attemptedCredits),
          earnedCredits: numberOrNull(values.earnedCredits),
          grade: trimmedOrNull(values.grade),
          reason: trimmedOrNull(values.reason),
          studentNotes: trimmedOrNull(values.studentNotes),
        },
      });
      setActionMessage('Course details updated.');
      setIsEditingRequest(false);
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to update course details.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleWaiver(policyCheckType: string, checked: boolean) {
    if (!request) {
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      if (checked) {
        await upsertAdminTransferRequestWaiver({
          transferRequestId: request.transferRequestId,
          request: {
            policyCheckType,
            reason: 'Waived during transfer request review.',
          },
        });
      } else {
        await deleteAdminTransferRequestWaiver({
          transferRequestId: request.transferRequestId,
          policyCheckType,
        });
      }

      setActionMessage('Policy waiver updated.');
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to update waiver.'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleOpenSubstitutionModal() {
    setEditingOutcome(null);
    outcomeForm.setValues({
      ...defaultOutcomeValues,
      acceptedCredits: primaryCourse?.requestedCredits ?? '',
    });
    outcomeForm.clearErrors();
    setSubstitutionModalOpen(true);
  }

  function handleOpenEditOutcomeModal(outcome: TransferRequestOutcomeResponse) {
    setEditingOutcome(outcome);
    outcomeForm.setValues({
      acceptedCredits: outcome.acceptedCredits ?? '',
      localCourseId: outcome.localCourseId === null ? '' : String(outcome.localCourseId),
      localCourseLabel: outcome.localCourseCode ?? '',
      notes: outcome.notes ?? '',
      outcomeType: outcome.outcomeType,
      requirementId: outcome.requirementId === null ? '' : String(outcome.requirementId),
    });
    outcomeForm.clearErrors();
    setSubstitutionModalOpen(true);
  }

  async function handleAddOutcome(values: AddOutcomeFormValues) {
    if (!primaryCourse) {
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      const requestBody = {
        outcomeType: values.outcomeType,
        localCourseId:
          values.outcomeType === 'COURSE_SUBSTITUTION'
            ? (selectedLocalCourse?.courseId ?? numberOrNull(values.localCourseId))
            : null,
        requirementId:
          values.outcomeType === 'REQUIREMENT_WAIVER' && values.requirementId
            ? Number(values.requirementId)
            : null,
        acceptedCredits:
          values.outcomeType === 'REQUIREMENT_WAIVER' ? null : numberOrNull(values.acceptedCredits),
        notes: trimmedOrNull(values.notes),
      };

      if (editingOutcome) {
        await updateAdminTransferRequestOutcome({
          transferRequestOutcomeId: editingOutcome.transferRequestOutcomeId,
          request: requestBody,
        });
      } else {
        await createAdminTransferRequestOutcome({
          transferRequestCourseId: primaryCourse.transferRequestCourseId,
          request: requestBody,
        });
      }
      setSubstitutionModalOpen(false);
      setEditingOutcome(null);
      setActionMessage(editingOutcome ? 'Outcome updated.' : 'Outcome added.');
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to save outcome.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteOutcome(outcome: TransferRequestOutcomeResponse) {
    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      await deleteAdminTransferRequestOutcome({
        transferRequestOutcomeId: outcome.transferRequestOutcomeId,
      });
      setActionMessage('Outcome removed.');
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to remove outcome.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadTranscript() {
    if (!request || !transcript) {
      return;
    }

    setActionError('');

    try {
      const blob = await downloadAdminTransferRequestTranscript({
        transferRequestId: request.transferRequestId,
      });
      triggerPdfDownload(blob, transcript.originalFileName);
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to download transcript PDF.'));
    }
  }

  async function handleUploadTranscript(file: File | null) {
    if (!request || !file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      setActionError('Transcript must be a PDF file.');
      return;
    }

    setIsSaving(true);
    setActionError('');
    setActionMessage('');

    try {
      const uploadedTranscript = await uploadAdminTransferRequestTranscript({
        transferRequestId: request.transferRequestId,
        file,
      });
      setTranscript(uploadedTranscript);
      setActionMessage('Transcript PDF uploaded.');
      await loadDetail();
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to upload transcript PDF.'));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Academic Administration"
        title="Transfer Request"
        description="Loading transfer request detail."
      >
        <Group p="xl" gap="sm">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">
            Loading transfer request.
          </Text>
        </Group>
      </RecordPageShell>
    );
  }

  if (loadError || !request) {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Academic Administration"
        title="Transfer Request"
        description="Review transcript evidence, institution details, policy checks, and proposed substitutions."
      >
        <Stack p="xl">
          <Alert color="red" variant="light">
            {loadError || 'Transfer request was not found.'}
          </Alert>
          <Group>
            <Button variant="default" onClick={handleBack}>
              Back to requests
            </Button>
          </Group>
        </Stack>
      </RecordPageShell>
    );
  }

  return (
    <>
      <Modal
        opened={substitutionModalOpen}
        onClose={() => {
          setSubstitutionModalOpen(false);
          setEditingOutcome(null);
        }}
        title={editingOutcome ? 'Edit substitution' : 'Add substitution'}
        size="xl"
        centered
      >
        <form onSubmit={outcomeForm.onSubmit(handleAddOutcome)}>
          <Stack gap="md">
            <TextInput label="External course" value={formatCourse(primaryCourse)} readOnly />
            <Select
              label="Outcome"
              data={outcomeTypeOptions}
              allowDeselect={false}
              required
              {...outcomeForm.getInputProps('outcomeType')}
            />
            <Autocomplete
              label="Local course"
              placeholder="Search by course code"
              data={courseAutocompleteData}
              limit={20}
              disabled={outcomeForm.values.outcomeType !== 'COURSE_SUBSTITUTION'}
              required={outcomeForm.values.outcomeType === 'COURSE_SUBSTITUTION'}
              {...outcomeForm.getInputProps('localCourseLabel')}
            />
            <Select
              label="Requirement"
              placeholder="Select requirement"
              data={requirementSelectOptions}
              searchable
              clearable
              disabled={outcomeForm.values.outcomeType !== 'REQUIREMENT_WAIVER'}
              required={outcomeForm.values.outcomeType === 'REQUIREMENT_WAIVER'}
              {...outcomeForm.getInputProps('requirementId')}
            />
            <NumberInput
              label="Accepted credits"
              min={0}
              decimalScale={2}
              fixedDecimalScale
              disabled={outcomeForm.values.outcomeType === 'REQUIREMENT_WAIVER'}
              {...outcomeForm.getInputProps('acceptedCredits')}
            />
            <Textarea
              label="Notes"
              placeholder="Internal note for this substitution or waiver."
              minRows={3}
              autosize
              {...outcomeForm.getInputProps('notes')}
            />
            <Group justify="flex-end">
              <Button
                type="button"
                variant="default"
                onClick={() => {
                  setSubstitutionModalOpen(false);
                  setEditingOutcome(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSaving}>
                {editingOutcome ? 'Save substitution' : 'Add substitution'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={institutionMatchModalOpen}
        onClose={() => {
          setInstitutionMatchModalOpen(false);
        }}
        title="Choose existing institution"
        size="xl"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Search institutions"
            placeholder="Search by institution name"
            value={institutionSearch}
            onChange={(event) => {
              setInstitutionSearch(event.currentTarget.value);
            }}
          />
          {institutionOptionsError ? (
            <Alert color="red" variant="light">
              {institutionOptionsError}
            </Alert>
          ) : null}
          <Table.ScrollContainer minWidth={760}>
            <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => {
                        handleInstitutionSort('name');
                      }}
                    >
                      Institution{formatInstitutionSortLabel('name')}
                    </Button>
                  </Table.Th>
                  <Table.Th>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => {
                        handleInstitutionSort('code');
                      }}
                    >
                      Code{formatInstitutionSortLabel('code')}
                    </Button>
                  </Table.Th>
                  <Table.Th>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => {
                        handleInstitutionSort('institutionLevel');
                      }}
                    >
                      Type{formatInstitutionSortLabel('institutionLevel')}
                    </Button>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortedInstitutionOptions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text size="sm" c="dimmed">
                        No saved institutions match that search.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  sortedInstitutionOptions.map((institution) => (
                    <Table.Tr
                      key={institution.transferInstitutionId}
                      bg={
                        String(institution.transferInstitutionId) === selectedInstitutionId
                          ? 'blue.0'
                          : undefined
                      }
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedInstitutionId(String(institution.transferInstitutionId));
                      }}
                    >
                      <Table.Td>{institution.name}</Table.Td>
                      <Table.Td>{institution.code}</Table.Td>
                      <Table.Td>{formatStatus(institution.institutionLevel)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Paper withBorder radius="sm" p="md">
            {selectedInstitution ? (
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Text fw={700}>{selectedInstitution.name}</Text>
                    <Text size="sm" c="dimmed">
                      {selectedInstitution.code} · {formatStatus(selectedInstitution.institutionLevel)}
                    </Text>
                  </Stack>
                  <Badge variant="light">Saved institution</Badge>
                </Group>
                <Table.ScrollContainer minWidth={620}>
                  <Table horizontalSpacing="md" verticalSpacing="sm">
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Th>Student entered</Table.Th>
                        <Table.Td>{displayValue(request.institution.oneOffInstitutionName)}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Th>Saved match</Table.Th>
                        <Table.Td>{selectedInstitution.name}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Th>Saved type</Table.Th>
                        <Table.Td>{formatStatus(selectedInstitution.institutionLevel)}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Th>Saved website</Table.Th>
                        <Table.Td>{displayValue(selectedInstitution.website)}</Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Th>Saved address</Table.Th>
                        <Table.Td>
                          {[
                            selectedInstitution.addressLine1,
                            selectedInstitution.addressLine2,
                            selectedInstitution.city,
                            selectedInstitution.stateRegion,
                            selectedInstitution.postalCode,
                            selectedInstitution.countryCode,
                          ]
                            .filter(Boolean)
                            .join(', ') || '-'}
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                Select an institution to preview the match.
              </Text>
            )}
          </Paper>
          <Alert color="blue" variant="light">
            Saving this match preserves what the student entered and stores the saved institution
            separately for admin review.
          </Alert>
          <Group justify="flex-end">
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setInstitutionMatchModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              loading={isSaving}
              onClick={() => {
                void handleUseInstitutionMatch();
              }}
            >
              Use institution
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={prepopulateModalOpen}
        onClose={() => {
          setPrepopulateModalOpen(false);
        }}
        title="Prepopulate substitutions"
        size="xl"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Search saved institution course equivalencies. Select a course to preview the
            substitutions that would be added to this transfer request.
          </Text>
          {!linkedInstitutionId ? (
            <Alert color="yellow" variant="light">
              Match this request to a saved institution before prepopulating substitutions.
            </Alert>
          ) : null}
          {courseEquivalenciesError ? (
            <Alert color="red" variant="light">
              {courseEquivalenciesError}
            </Alert>
          ) : null}
          <TextInput
            label="Search courses"
            placeholder="Search by external course, title, requirement, or local course"
            value={prepopulateSearch}
            onChange={(event) => {
              setPrepopulateSearch(event.currentTarget.value);
            }}
          />
          <Table.ScrollContainer minWidth={820}>
            <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => {
                        handlePrepopulateSort('externalCourse');
                      }}
                    >
                      Course{formatPrepopulateSortLabel('externalCourse')}
                    </Button>
                  </Table.Th>
                  <Table.Th>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => {
                        handlePrepopulateSort('externalCourseTitle');
                      }}
                    >
                      Title{formatPrepopulateSortLabel('externalCourseTitle')}
                    </Button>
                  </Table.Th>
                  <Table.Th>Requirement</Table.Th>
                  <Table.Th>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => {
                        handlePrepopulateSort('externalCredits');
                      }}
                    >
                      Credits{formatPrepopulateSortLabel('externalCredits')}
                    </Button>
                  </Table.Th>
                  <Table.Th>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => {
                        handlePrepopulateSort('updatedAt');
                      }}
                    >
                      Updated{formatPrepopulateSortLabel('updatedAt')}
                    </Button>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {isLoadingCourseEquivalencies ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Group gap="xs">
                        <Loader size="xs" />
                        <Text size="sm" c="dimmed">
                          Loading saved institution courses...
                        </Text>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ) : sortedCourseEquivalencies.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed">
                        No saved institution courses match that search.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  sortedCourseEquivalencies.map((equivalency) => (
                    <Table.Tr
                      key={equivalency.transferCourseEquivalencyId}
                      bg={
                        selectedCourseEquivalency?.transferCourseEquivalencyId ===
                        equivalency.transferCourseEquivalencyId
                          ? 'blue.0'
                          : undefined
                      }
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedCourseEquivalencyId(String(equivalency.transferCourseEquivalencyId));
                      }}
                    >
                      <Table.Td>
                        {equivalency.externalSubjectCode} {equivalency.externalCourseNumber}
                      </Table.Td>
                      <Table.Td>{displayValue(equivalency.externalCourseTitle)}</Table.Td>
                      <Table.Td>{displayValue(equivalency.notes)}</Table.Td>
                      <Table.Td>{displayValue(equivalency.externalCredits)}</Table.Td>
                      <Table.Td>{displayValue(equivalency.updatedAt)}</Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Paper withBorder radius="sm" p="md">
            {courseEquivalencyDetail ? (
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Text fw={700}>
                      {courseEquivalencyDetail.externalSubjectCode}{' '}
                      {courseEquivalencyDetail.externalCourseNumber}{' '}
                      {courseEquivalencyDetail.externalCourseTitle}
                    </Text>
                    <Text size="sm" c="dimmed">
                      These substitutions would be added to the current transfer request.
                    </Text>
                  </Stack>
                  <Badge variant="light">
                    {displayValue(courseEquivalencyDetail.externalCredits)} credits
                  </Badge>
                </Group>
                {courseEquivalencyDetail.externalCourseDescription ? (
                  <Text size="sm">{courseEquivalencyDetail.externalCourseDescription}</Text>
                ) : null}
                <Table.ScrollContainer minWidth={640}>
                  <Table horizontalSpacing="md" verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Outcome</Table.Th>
                        <Table.Th>MSMU Course / Credit</Table.Th>
                        <Table.Th>Requirement</Table.Th>
                        <Table.Th>Credits</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedCourseEquivalencyOutcomes.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={4}>
                            <Text size="sm" c="dimmed">
                              This saved course has no substitutions or requirement waivers to add yet.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        selectedCourseEquivalencyOutcomes.map((suggestion) => (
                          <Table.Tr key={suggestion.transferCourseEquivalencyOutcomeId}>
                            <Table.Td>{formatStatus(suggestion.outcomeType)}</Table.Td>
                            <Table.Td>
                              {suggestion.localCourseCode ??
                                (suggestion.outcomeType === 'REQUIREMENT_WAIVER'
                                  ? 'No course credit awarded'
                                  : 'Transfer credit')}
                            </Table.Td>
                            <Table.Td>
                              {[suggestion.requirementCode, suggestion.requirementName]
                                .filter(Boolean)
                                .join(' ')}
                            </Table.Td>
                            <Table.Td>{displayValue(suggestion.acceptedCredits)}</Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                Select a course to preview substitutions.
              </Text>
            )}
          </Paper>
          <Group justify="flex-end">
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setPrepopulateModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              loading={isSaving}
              onClick={() => {
                void handleAddSelectedEquivalency();
              }}
              disabled={!courseEquivalencyDetail || selectedCourseEquivalencyOutcomes.length === 0}
            >
              Add substitutions
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={approveInstitutionModalOpen}
        onClose={() => {
          setApproveInstitutionModalOpen(false);
          setApprovalScenarioOverride(null);
        }}
        title={
          approvalScenarioIsMatched
            ? 'Approve and update institution mapping'
            : 'Approve unmatched institution'
        }
        size="90%"
        centered
      >
        <Stack gap="md">
          <Alert color={approvalScenarioIsMatched ? 'blue' : 'yellow'} variant="light">
            {approvalScenarioIsMatched
              ? `This request is linked to ${approvalScenarioInstitutionName}. Choose whether the approved substitutions should update that institution's saved mapping for future requests.`
              : 'This request is not linked to a saved institution. Choose whether to save the institution and approved substitutions for future requests.'}
          </Alert>
          {!approvalScenarioIsMatched ? (
            <Checkbox
              label="Save this institution after approval"
              checked={saveInstitutionOnApproval}
              onChange={(event) => {
                const checked = event.currentTarget.checked;
                setSaveInstitutionOnApproval(checked);
                if (!checked) {
                  setSaveSubstitutionsOnApproval(false);
                }
              }}
            />
          ) : (
            <Stack gap={2}>
              <Text size="xs" fw={700} c="dimmed">
                Saved institution
              </Text>
              <Text size="sm">{displayValue(approvalScenarioInstitutionName)}</Text>
            </Stack>
          )}
          <Checkbox
            label={
              approvalScenarioIsMatched
                ? 'Update saved institution substitution mapping'
                : 'Save approved substitutions as institution templates'
            }
            checked={saveSubstitutionsOnApproval}
            disabled={
              displayedOutcomes.length === 0 ||
              (!approvalScenarioIsMatched && !saveInstitutionOnApproval)
            }
            onChange={(event) => {
              setSaveSubstitutionsOnApproval(event.currentTarget.checked);
            }}
          />
          {approvalScenarioIsMatched ? (
            <Stack gap="md">
              {mappingComparisonError ? (
                <Alert color="red" variant="light">
                  {mappingComparisonError}
                </Alert>
              ) : null}
              <Paper withBorder radius="sm" p="md">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={700}>Previous mapping</Text>
                    <Badge variant="light" color="gray">
                      Saved
                    </Badge>
                  </Group>
                  <Table.ScrollContainer minWidth={900}>
                    <Table horizontalSpacing="md" verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Transfer course</Table.Th>
                          <Table.Th>Outcome</Table.Th>
                          <Table.Th>MSMU Course / Credit</Table.Th>
                          <Table.Th>Requirement</Table.Th>
                          <Table.Th>Credits</Table.Th>
                        </Table.Tr>
	                      </Table.Thead>
	                      <Table.Tbody>
                        {previousMappingPreview.length === 0 ? (
                          <Table.Tr>
                            <Table.Td>{formatCourse(primaryCourse)}</Table.Td>
                            <Table.Td colSpan={4}>
                              <Text size="sm" c="dimmed">
                                No active saved mapping exists for this transfer course.
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
	                        previousMappingPreview.map((mapping, index) => (
	                          <Table.Tr key={`previous-${mapping.outcomeType}-${index}`}>
                            <Table.Td>{formatCourse(primaryCourse)}</Table.Td>
                            <Table.Td>{formatStatus(mapping.outcomeType)}</Table.Td>
                            <Table.Td>
                              {mapping.localCourseCode ??
                                (mapping.outcomeType === 'REQUIREMENT_WAIVER'
                                  ? 'No course credit awarded'
                                  : 'Transfer credit')}
                            </Table.Td>
                            <Table.Td>
                              {[mapping.requirementCode, mapping.requirementName]
                                .filter(Boolean)
                                .join(' ')}
                            </Table.Td>
                            <Table.Td>{displayValue(mapping.acceptedCredits)}</Table.Td>
	                          </Table.Tr>
	                        ))
                        )}
	                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Paper>
              <Paper withBorder radius="sm" p="md">
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={700}>Potential update</Text>
                    <Badge variant="light" color="blue">
                      This request
                    </Badge>
                  </Group>
                  <Table.ScrollContainer minWidth={900}>
                    <Table horizontalSpacing="md" verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Transfer course</Table.Th>
                          <Table.Th>Outcome</Table.Th>
                          <Table.Th>MSMU Course / Credit</Table.Th>
                          <Table.Th>Requirement</Table.Th>
                          <Table.Th>Credits</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
	                        {proposedMappingPreview.length === 0 ? (
                          <Table.Tr>
                            <Table.Td>{formatCourse(primaryCourse)}</Table.Td>
                            <Table.Td colSpan={4}>
                              <Text size="sm" c="dimmed">
                                No substitutions have been added to this request yet.
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
	                          proposedMappingPreview.map((outcome, index) => (
	                            <Table.Tr key={`potential-${outcome.outcomeType}-${index}`}>
                              <Table.Td>{formatCourse(primaryCourse)}</Table.Td>
                              <Table.Td>{formatStatus(outcome.outcomeType)}</Table.Td>
                              <Table.Td>
                                {outcome.localCourseCode ??
                                  (outcome.outcomeType === 'REQUIREMENT_WAIVER'
                                    ? 'No course credit awarded'
                                    : 'Transfer credit')}
                              </Table.Td>
                              <Table.Td>
                                {[outcome.requirementCode, outcome.requirementName]
                                  .filter(Boolean)
                                  .join(' ')}
                              </Table.Td>
                              <Table.Td>{displayValue(outcome.acceptedCredits)}</Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Paper>
            </Stack>
          ) : null}
          <Text size="sm" c="dimmed">
            {displayedOutcomes.length === 0
              ? 'No substitutions have been added to this request yet.'
              : `${displayedOutcomes.length} substitution outcome${
                  displayedOutcomes.length === 1 ? '' : 's'
                } will be considered for the saved mapping.`}
          </Text>
          <Group justify="flex-end">
            <Button
              type="button"
              variant="default"
              onClick={() => {
                setApproveInstitutionModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              color="green"
              loading={isSaving}
              onClick={() => {
                void handleApproveRequest();
              }}
            >
              Approve request
            </Button>
          </Group>
        </Stack>
      </Modal>

      <RecordPageShell
        size="xl"
        eyebrow="Academic Administration"
        title={`Transfer Request #${request.transferRequestId}`}
        description="Review transcript evidence, institution details, policy checks, and proposed substitutions."
        badge={
          <Badge color={statusColor(request.status)} size="lg" variant="light">
            {formatStatus(request.status)}
          </Badge>
        }
      >
        <Stack gap={0}>
          {actionError ? (
            <Alert color="red" variant="light" mx="xl" mt="xl">
              {actionError}
            </Alert>
          ) : null}
          {actionMessage ? (
            <Alert color="green" variant="light" mx="xl" mt="xl">
              {actionMessage}
            </Alert>
          ) : null}

          <WorkflowStatusStepperSection
            title="Status"
            description="Track this request from intake through registrar review and final decision."
            statuses={transferRequestStatuses}
            currentStatusCode={request.status}
            isConditionalStatus={isTerminalStatus}
            disableShiftControls={currentWorkflowStepIndex < 0 || isSaving || isEditingRequest}
            onStepDown={handleStepDown}
            onStepUp={handleStepUp}
          />

          <RecordPageSection
            title="Request"
            description="Workflow status and intake order for this request."
            action={
              <Button onClick={handleBack} variant="default">
                Back
              </Button>
            }
          >
            <ReadOnlyField label="Request ID" value={displayValue(request.transferRequestId)} />
            <ReadOnlyField
              label="Submitted"
              value={displayValue(request.submittedAt?.slice(0, 10))}
            />
            <ReadOnlyField label="Decision by" value={displayValue(request.decidedByEmail)} />
            <ReadOnlyField label="Decision at" value={displayValue(request.decidedAt)} />
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Status"
                data={statusOptions}
                value={request.status}
                onChange={(value) => {
                  if (value) {
                    if (value === 'APPROVED') {
                      handleApproveClick();
                      return;
                    }

                    void handleStatusChange(value as RequestStatus);
                  }
                }}
                allowDeselect={false}
                disabled={isSaving || isEditingRequest}
              />
            </Grid.Col>
            {!isTerminalStatus(request.status) ? (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Group align="flex-end" h="100%" gap="sm">
                  <Button
                    color="green"
                    loading={isSaving}
                    disabled={isEditingRequest}
                    onClick={handleApproveClick}
                  >
                    Approve
                  </Button>
                  <Button
                    color="red"
                    variant="light"
                    loading={isSaving}
                    disabled={isEditingRequest}
                    onClick={() => {
                      void handleStatusChange('DENIED');
                    }}
                  >
                    Deny
                  </Button>
                </Group>
              </Grid.Col>
            ) : null}
          </RecordPageSection>

          <RecordPageSection
            title="Student"
            description="Student context attached to the transfer request."
          >
            <ReadOnlyField label="Student name" value={displayValue(request.studentName)} />
            <ReadOnlyField
              label="Student ID"
              value={displayValue(request.studentNumber ?? request.studentId)}
            />
            <ReadOnlyField label="Email" value={displayValue(request.studentEmail)} />
            <ReadOnlyField label="Class" value={displayValue(request.classOf)} />
            <ReadOnlyField
              label="Division"
              value={displayValue(request.divisionNames.join(', '))}
            />
            <ReadOnlyField label="Reason" value={displayValue(primaryCourse?.reason)} />
          </RecordPageSection>

          <RecordPageSection
            title="Institution"
            description="Review what the student entered, then match it to a saved institution when one exists."
            action={
              <Group gap="sm">
                {isEditingRequest ? (
                  <>
                    <Button
                      type="button"
                      variant="default"
                      disabled={isSaving}
                      onClick={() => {
                        hydrateForms(request, courses);
                        setIsEditingRequest(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      form="transfer-request-course-form"
                      variant="light"
                      loading={isSaving}
                    >
                      Save request
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="light"
                    onClick={() => {
                      setIsEditingRequest(true);
                    }}
                  >
                    Edit request
                  </Button>
                )}
                {matchedInstitution || request.institution.transferInstitutionId ? (
                  <Button
                    variant="default"
                    loading={isSaving}
                    disabled={!isEditingRequest}
                    onClick={() => {
                      void handleClearInstitutionMatch();
                    }}
                  >
                    Clear match
                  </Button>
                ) : null}
                <Button
                  variant="light"
                  disabled={!isEditingRequest}
                  onClick={handleOpenInstitutionMatchModal}
                >
                  Choose existing institution
                </Button>
              </Group>
            }
          >
            <ReadOnlyField
              label="Student-entered institution"
              value={displayValue(request.institution.oneOffInstitutionName)}
            />
            <ReadOnlyField
              label="Student-entered website"
              value={displayValue(request.institution.oneOffInstitutionWebsite)}
            />
            <ReadOnlyField
              label="Matched institution"
              value={displayValue(linkedInstitutionName)}
              span={12}
            />
            {hasLinkedInstitution ? (
              <>
                <ReadOnlyField
                  label="Matched website"
                  value={displayValue(linkedInstitutionAddress.website)}
                  span={12}
                />
                <ReadOnlyField
                  label="Matched address line 1"
                  value={displayValue(linkedInstitutionAddress.addressLine1)}
                  span={12}
                />
                <ReadOnlyField
                  label="Matched address line 2"
                  value={displayValue(linkedInstitutionAddress.addressLine2)}
                  span={12}
                />
                <ReadOnlyField
                  label="Matched city"
                  value={displayValue(linkedInstitutionAddress.city)}
                />
                <ReadOnlyField
                  label="Matched state / region"
                  value={displayValue(linkedInstitutionAddress.stateRegion)}
                />
                <ReadOnlyField
                  label="Matched postal code"
                  value={displayValue(linkedInstitutionAddress.postalCode)}
                />
                <ReadOnlyField
                  label="Matched country"
                  value={displayValue(linkedInstitutionAddress.countryCode)}
                />
              </>
            ) : null}
            <ReadOnlyField
              label="Student-entered address line 1"
              value={displayValue(request.institution.oneOffInstitutionAddressLine1)}
              span={12}
            />
            <ReadOnlyField
              label="Student-entered address line 2"
              value={displayValue(request.institution.oneOffInstitutionAddressLine2)}
              span={12}
            />
            <ReadOnlyField
              label="Student-entered city"
              value={displayValue(request.institution.oneOffInstitutionCity)}
            />
            <ReadOnlyField
              label="Student-entered state / region"
              value={displayValue(request.institution.oneOffInstitutionStateRegion)}
            />
            <ReadOnlyField
              label="Student-entered postal code"
              value={displayValue(request.institution.oneOffInstitutionPostalCode)}
            />
            <ReadOnlyField
              label="Student-entered country"
              value={displayValue(request.institution.oneOffInstitutionCountryCode)}
            />
          </RecordPageSection>

          <RecordPageSection
            title="Transcript PDF"
            description="Transcript storage keeps a retrievable file reference for later download."
          >
            <Grid.Col span={12}>
              <Paper withBorder radius="sm" p="md">
                {transcript ? (
                  <Group justify="space-between" align="center" gap="md" wrap="wrap">
                    <Group gap="sm">
                      <IconFileTypePdf size={28} />
                      <Stack gap={2}>
                        <Text fw={700}>{transcript.originalFileName}</Text>
                        <Text size="sm" c="dimmed">
                          Uploaded {transcript.uploadedAt} by {transcript.uploadedByEmail}
                        </Text>
                      </Stack>
                    </Group>
                    <Button
                      leftSection={<IconDownload size={16} />}
                      variant="light"
                      onClick={() => {
                        void handleDownloadTranscript();
                      }}
                    >
                      Download transcript
                    </Button>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">
                    No transcript PDF is attached yet.
                  </Text>
                )}
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <FileInput
                label={transcript ? 'Replace transcript PDF' : 'Upload transcript PDF'}
                placeholder="Choose PDF"
                accept="application/pdf"
                clearable
                disabled={isSaving}
                onChange={(file) => {
                  void handleUploadTranscript(file);
                }}
              />
            </Grid.Col>
          </RecordPageSection>

          <RecordPageSection
            title="Policy Checks"
            description="Global thresholds are configured in Transfer Credit Policy settings. Waivers are scoped to this student request."
          >
            {policyEvaluation ? (
              <>
                <PolicyDisplay
                  label="Policy effective dates"
                  value={`${policyEvaluation.policyEffectiveStartDate} to ${
                    policyEvaluation.policyEffectiveEndDate ?? 'open-ended'
                  }`}
                />
                <PolicyDisplay
                  label="Four-year rule threshold"
                  value={`${policyEvaluation.fourYearInstitutionCreditThreshold} credits`}
                />
                <PolicyDisplay
                  label="Minimum transferable grade"
                  value={policyEvaluation.minimumTransferGrade}
                />
                <PolicyDisplay
                  label="Student transfer credits after approved"
                  value={`${policyEvaluation.studentTransferCreditsAfterApproved} credits`}
                />
                {policyEvaluation.checks.map((check) => (
                  <Grid.Col key={check.checkType} span={12}>
                    <Alert
                      color={policyCheckColor(check.status)}
                      variant="light"
                      title={check.label}
                    >
                      <Group gap="xs" mb={4}>
                        <Badge color={policyCheckColor(check.status)} variant="light">
                          {check.status.toLowerCase()}
                        </Badge>
                        {check.waivable && check.status !== 'PASSED' ? (
                          <Checkbox
                            label="Waive"
                            checked={waiverTypes.has(check.checkType)}
                            disabled={isSaving}
                            onChange={(event) => {
                              void handleToggleWaiver(check.checkType, event.currentTarget.checked);
                            }}
                          />
                        ) : null}
                      </Group>
                      {check.message}
                    </Alert>
                  </Grid.Col>
                ))}
              </>
            ) : (
              <Grid.Col span={12}>
                <Alert color="yellow" variant="light">
                  Policy checks are unavailable for this request.
                </Alert>
              </Grid.Col>
            )}
          </RecordPageSection>

          <form id="transfer-request-course-form" onSubmit={courseForm.onSubmit(handleSaveCourse)}>
            <RecordPageSection
              title="Course Details"
              description="External course details from the student request."
            >
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Subject code"
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('externalSubjectCode')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Course number"
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('externalCourseNumber')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Course title"
                  required
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('externalCourseTitle')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Credits from transferring school"
                  min={0}
                  decimalScale={2}
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('requestedCredits')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Transcript attempted credits"
                  min={0}
                  decimalScale={2}
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('attemptedCredits')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Transcript earned credits"
                  min={0}
                  decimalScale={2}
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('earnedCredits')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Grade"
                  data={gradeOptions}
                  clearable
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('grade')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Term"
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('externalTerm')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Reason"
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('reason')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Course description"
                  description="Pulled from the request form; editable during review."
                  minRows={5}
                  autosize
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('externalCourseDescription')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Request notes"
                  minRows={3}
                  autosize
                  disabled={!isEditingRequest}
                  {...courseForm.getInputProps('studentNotes')}
                />
              </Grid.Col>
            </RecordPageSection>
          </form>

          <RecordPageSection
            title="Substitutions"
            description="Approved rows become the academic outcome consumed by transcript and requirement logic."
            action={
              <Group gap="sm">
                <Button
                  variant="default"
                  onClick={() => {
                    setPrepopulateModalOpen(true);
                  }}
                  disabled={!primaryCourse}
                >
                  Prepopulate from institution
                </Button>
                <Button
                  variant="light"
                  onClick={handleOpenSubstitutionModal}
                  disabled={!primaryCourse}
                >
                  Add substitution
                </Button>
              </Group>
            }
          >
            <Grid.Col span={12}>
              <Table.ScrollContainer minWidth={860}>
                <Table horizontalSpacing="md" verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>External Course</Table.Th>
                      <Table.Th>MSMU Course / Credit</Table.Th>
                      <Table.Th>Requirement</Table.Th>
                      <Table.Th>Credits</Table.Th>
                      <Table.Th>Outcome</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {displayedOutcomes.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text size="sm" c="dimmed">
                            No outcomes have been added yet.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : (
                      displayedOutcomes.map((outcome) => (
                        <Table.Tr key={outcome.transferRequestOutcomeId}>
                          <Table.Td>{formatCourse(primaryCourse)}</Table.Td>
                          <Table.Td>
                            {outcome.localCourseCode ??
                              (outcome.outcomeType === 'REQUIREMENT_WAIVER'
                                ? 'No course credit awarded'
                                : 'Transfer credit')}
                          </Table.Td>
                          <Table.Td>
                            {[outcome.requirementCode, outcome.requirementName]
                              .filter(Boolean)
                              .join(' ')}
                          </Table.Td>
                          <Table.Td>{displayValue(outcome.acceptedCredits)}</Table.Td>
                          <Table.Td>
                            <Badge variant="light">{formatStatus(outcome.outcomeType)}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs" justify="flex-end">
                              {outcome.transferRequestOutcomeId > 0 ? (
                                <Button
                                  size="xs"
                                  variant="subtle"
                                  onClick={() => {
                                    handleOpenEditOutcomeModal(outcome);
                                  }}
                                >
                                  Edit
                                </Button>
                              ) : (
                                <Badge variant="light">Stubbed</Badge>
                              )}
                              <Button
                                size="xs"
                                variant="subtle"
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => {
                                  void handleDeleteOutcome(outcome);
                                }}
                              >
                                Remove
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="Changes save to the transfer request workflow, course, institution, outcome, waiver, and transcript APIs.">
            <Group justify="flex-end">
              <Button variant="default" onClick={handleBack}>
                Back to requests
              </Button>
            </Group>
          </RecordPageFooter>
        </Stack>
      </RecordPageShell>
    </>
  );
}
