import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Combobox,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  Pagination,
  Select,
  Stack,
  Stepper,
  Table,
  Text,
  TextInput,
  Title,
  useCombobox,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useNavigate } from 'react-router-dom';
import {
  displayDateTime,
  displayValue,
  normalizeDateInputValue,
  parseDateInputValue,
} from '@/components/academic-year/academicYearDisplay';
import {
  formatTimeInputValue,
  normalizeTimeInput,
} from '@/components/academic-year/courses/courseSectionsWorkspaceUtils';
import {
  getRegistrationGroupStatusColor,
  getRegistrationGroupStatusLabel,
  normalizeRegistrationGroupStatus,
} from '@/components/registration-groups/registrationGroupStatusDisplay';
import {
  addRegistrationGroupStudent,
  bulkAddRegistrationGroupStudents,
  getRegistrationGroupDetail,
  patchRegistrationGroup,
  publishRegistrationGroups,
  removeRegistrationGroupStudent,
  searchRegistrationGroups,
  searchRegistrationGroupStudentOptions,
  searchUnassignedRegistrationGroupStudents,
  validateRegistrationGroupsForPublish,
} from '@/services/registration-group-service';
import type {
  RegistrationGroupAssignedStudentResponse,
  RegistrationGroupDetailResponse,
  RegistrationGroupPublishValidationResponse,
  RegistrationGroupReferenceOptionsResponse,
  RegistrationGroupSavedSearchCriteriaResponse,
  RegistrationGroupSearchResponse,
  RegistrationGroupStudentOptionResponse,
  UnassignedRegistrationGroupStudentResponse,
  UnassignedRegistrationGroupStudentSearchResponse,
} from '@/services/schemas/registration-group-schemas';
import { getErrorMessage } from '@/utils/errors';

type PublishWorkflowProps = {
  initialAcademicYearId: string;
  initialTermId: string;
  referenceOptions: RegistrationGroupReferenceOptionsResponse | null;
  referenceOptionsLoading: boolean;
};

type GroupListState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: RegistrationGroupSearchResponse }
  | { status: 'error'; message: string };

type GroupDetailState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; detail: RegistrationGroupDetailResponse }
  | { status: 'error'; message: string };

type UnassignedReviewState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: UnassignedRegistrationGroupStudentSearchResponse }
  | { status: 'error'; message: string };

type MutationState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

type PublishValidationState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: RegistrationGroupPublishValidationResponse }
  | { status: 'error'; message: string };

type RegistrationGroupEditForm = {
  academicYearId: string;
  registrationClosesDate: string;
  registrationClosesTime: string;
  registrationOpensDate: string;
  registrationOpensTime: string;
  termId: string;
};

type AddStudentSearchStatus = 'idle' | 'loading' | 'success' | 'error';

type AddStudentSearchState = {
  status: AddStudentSearchStatus;
  results: RegistrationGroupStudentOptionResponse[];
  message?: string;
};

type UnassignedReviewPageSize = '10' | '25' | '50' | '100';

const unassignedReviewPageSizeOptions: { value: UnassignedReviewPageSize; label: string }[] = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
];

function mapAcademicYearOption(option: RegistrationGroupReferenceOptionsResponse['academicYears'][number]) {
  return {
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

function mapTermOption(
  option: RegistrationGroupReferenceOptionsResponse['academicYears'][number]['terms'][number]
) {
  return {
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

function getDateTimeParts(value: string | null) {
  const [datePart = '', timePart = ''] = (value ?? '').split('T');

  return {
    date: datePart,
    time: timePart.slice(0, 5),
  };
}

function combineDateTimeParts(date: string, time: string) {
  return `${date}T${time}:00`;
}

function getInitialEditForm(detail: RegistrationGroupDetailResponse): RegistrationGroupEditForm {
  const opens = getDateTimeParts(detail.registrationWindow.opensAt);
  const closes = getDateTimeParts(detail.registrationWindow.closesAt);

  return {
    academicYearId: detail.summary.academicYearId ? String(detail.summary.academicYearId) : '',
    registrationClosesDate: closes.date,
    registrationClosesTime: closes.time,
    registrationOpensDate: opens.date,
    registrationOpensTime: opens.time,
    termId: detail.summary.termId ? String(detail.summary.termId) : '',
  };
}

function displayFilterValue(value: string | null | undefined, labels: Record<string, string>) {
  if (!value) {
    return 'Any';
  }

  return labels[value] ?? value;
}

function getSearchCriteriaRows(criteria: RegistrationGroupSavedSearchCriteriaResponse | null) {
  if (!criteria) {
    return [];
  }

  return [
    { label: 'Generation', value: criteria.name },
    { label: 'Student', value: criteria.studentSearchText ?? 'Any student' },
    { label: 'Program', value: criteria.programSearchText ?? 'Any program' },
    { label: 'Group Name Prefix', value: criteria.groupNamePrefix ?? 'Registration Group' },
    { label: 'Academic Division', value: criteria.academicDivision?.name ?? 'Any division' },
    {
      label: 'Honors',
      value: displayFilterValue(criteria.honorsFilter, {
        ANY: 'Any honors status',
        HONORS: 'In honors',
        NOT_HONORS: 'Not in honors',
      }),
    },
    {
      label: 'Athlete',
      value: displayFilterValue(criteria.athleteFilter, {
        ANY: 'Any athlete status',
        ATHLETE: 'Athlete',
        NOT_ATHLETE: 'Not an athlete',
      }),
    },
    {
      label: 'Sports',
      value:
        criteria.athleticSports.length > 0
          ? criteria.athleticSports.map((sport) => sport.name).join(', ')
          : 'Any sport',
    },
    {
      label: 'Existing Group',
      value: displayFilterValue(criteria.existingGroupFilter, {
        ANY: 'Include all students',
        EXCLUDE_ALREADY_GROUPED: 'Exclude students already in a group',
        ONLY_ALREADY_GROUPED: 'Only students already in a group',
      }),
    },
    { label: 'Minimum Credits', value: displayValue(criteria.minCredits) },
    { label: 'Maximum Credits', value: displayValue(criteria.maxCredits) },
    { label: 'Include Current Credits', value: criteria.includeCurrentCredits ? 'Yes' : 'No' },
    { label: 'Include Transfer Credits', value: criteria.includeTransferCredits ? 'Yes' : 'No' },
    { label: 'Split Count', value: displayValue(criteria.splitCount) },
    { label: 'Matched Students', value: displayValue(criteria.matchedStudentCount) },
  ];
}

function displayAssignedStudentName(student: RegistrationGroupAssignedStudentResponse) {
  if (student.displayName) {
    return student.displayName;
  }

  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
  return name || student.email || student.studentNumber || `Student ${student.studentId}`;
}

function displayUnassignedStudentName(student: UnassignedRegistrationGroupStudentResponse) {
  if (student.displayName) {
    return student.displayName;
  }

  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
  return name || student.email || student.studentNumber || `Student ${student.studentId}`;
}

function buildStudentOptionLabel(student: RegistrationGroupStudentOptionResponse) {
  if (student.displayName) {
    return student.displayName;
  }

  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
  return name || student.email || student.studentNumber || String(student.studentId);
}

function buildStudentOptionDescription(student: RegistrationGroupStudentOptionResponse) {
  return [student.studentNumber, student.email, student.classStanding].filter(Boolean).join(' · ');
}

export function RegistrationGroupPublishWorkflow({
  initialAcademicYearId,
  initialTermId,
  referenceOptions,
  referenceOptionsLoading,
}: PublishWorkflowProps) {
  const navigate = useNavigate();
  const addStudentCombobox = useCombobox();
  const [activeStep, setActiveStep] = useState(0);
  const [academicYearId, setAcademicYearId] = useState('');
  const [termId, setTermId] = useState('');
  const [groupListState, setGroupListState] = useState<GroupListState>({ status: 'idle' });
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupDetailState, setGroupDetailState] = useState<GroupDetailState>({ status: 'idle' });
  const [unassignedReviewState, setUnassignedReviewState] = useState<UnassignedReviewState>({
    status: 'idle',
  });
  const [publishValidationState, setPublishValidationState] = useState<PublishValidationState>({
    status: 'idle',
  });
  const [mutationState, setMutationState] = useState<MutationState>({ status: 'idle' });
  const [publishState, setPublishState] = useState<MutationState>({ status: 'idle' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<RegistrationGroupEditForm | null>(null);
  const [addStudentQuery, setAddStudentQuery] = useState('');
  const [selectedAddStudent, setSelectedAddStudent] =
    useState<RegistrationGroupStudentOptionResponse | null>(null);
  const [addStudentSearchState, setAddStudentSearchState] = useState<AddStudentSearchState>({
    status: 'idle',
    results: [],
  });
  const [selectedAssignedStudent, setSelectedAssignedStudent] =
    useState<RegistrationGroupAssignedStudentResponse | null>(null);
  const [unassignedTargetGroupId, setUnassignedTargetGroupId] = useState('');
  const [selectedUnassignedStudentIds, setSelectedUnassignedStudentIds] = useState<Set<number>>(
    new Set()
  );
  const [unassignedTableQuery, setUnassignedTableQuery] = useState('');
  const [unassignedPage, setUnassignedPage] = useState(0);
  const [unassignedPageSize, setUnassignedPageSize] = useState<UnassignedReviewPageSize>('10');
  const [bulkAssignState, setBulkAssignState] = useState<MutationState>({ status: 'idle' });

  useEffect(() => {
    const fallbackAcademicYear = referenceOptions?.academicYears[0] ?? null;
    const nextAcademicYearId =
      initialAcademicYearId || (fallbackAcademicYear ? String(fallbackAcademicYear.id) : '');
    const nextAcademicYear =
      referenceOptions?.academicYears.find((academicYear) => String(academicYear.id) === nextAcademicYearId) ??
      fallbackAcademicYear;
    const nextTermId =
      initialTermId || (nextAcademicYear?.terms[0] ? String(nextAcademicYear.terms[0].id) : '');

    setAcademicYearId(nextAcademicYearId);
    setTermId(nextTermId);
    setActiveStep(0);
    setGroupListState({ status: 'idle' });
    setSelectedGroupId('');
    setGroupDetailState({ status: 'idle' });
    setUnassignedReviewState({ status: 'idle' });
    setPublishValidationState({ status: 'idle' });
    setMutationState({ status: 'idle' });
    setPublishState({ status: 'idle' });
    setSelectedAssignedStudent(null);
    setSelectedUnassignedStudentIds(new Set());
    setUnassignedTargetGroupId('');
    setUnassignedTableQuery('');
    setUnassignedPage(0);
    setUnassignedPageSize('10');
    setBulkAssignState({ status: 'idle' });
  }, [initialAcademicYearId, initialTermId, referenceOptions]);

  useEffect(() => {
    if (!academicYearId || !termId) {
      return;
    }

    void loadGroupsForSelectedTerm();
  }, [academicYearId, termId]);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupDetailState({ status: 'idle' });
      return;
    }

    const abortController = new AbortController();
    setGroupDetailState({ status: 'loading' });

    getRegistrationGroupDetail({
      registrationGroupId: Number(selectedGroupId),
      signal: abortController.signal,
    })
      .then((detail) => {
        if (abortController.signal.aborted) {
          return;
        }

        setGroupDetailState({ status: 'success', detail });
        setEditForm(getInitialEditForm(detail));
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setGroupDetailState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load registration group.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [selectedGroupId]);

  useEffect(() => {
    if (activeStep !== 1 || !academicYearId || !termId) {
      return;
    }

    void loadUnassignedStudents();
  }, [academicYearId, activeStep, termId, unassignedPage, unassignedPageSize, unassignedTableQuery]);

  const selectedDetail = groupDetailState.status === 'success' ? groupDetailState.detail : null;

  useEffect(() => {
    if (!isAddStudentModalOpen || selectedAddStudent || addStudentQuery.trim().length < 2) {
      setAddStudentSearchState((currentState) => ({
        status: 'idle',
        results: selectedAddStudent ? currentState.results : [],
      }));
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setAddStudentSearchState((currentState) => ({
        status: 'loading',
        results: currentState.results,
      }));

      void searchRegistrationGroupStudentOptions({
        academicYearId: selectedDetail?.summary.academicYearId ?? Number(academicYearId) ?? null,
        search: addStudentQuery,
        size: 10,
        termId: selectedDetail?.summary.termId ?? Number(termId) ?? null,
        signal: abortController.signal,
      })
        .then((response) => {
          if (!abortController.signal.aborted) {
            setAddStudentSearchState({ status: 'success', results: response.results });
          }
        })
        .catch((error: unknown) => {
          if (!abortController.signal.aborted) {
            setAddStudentSearchState({
              status: 'error',
              results: [],
              message: getErrorMessage(error, 'Failed to search students.'),
            });
          }
        });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [
    academicYearId,
    addStudentQuery,
    isAddStudentModalOpen,
    selectedAddStudent,
    selectedDetail?.summary.academicYearId,
    selectedDetail?.summary.termId,
    termId,
  ]);

  const academicYearOptions = referenceOptions?.academicYears.map(mapAcademicYearOption) ?? [];
  const selectedAcademicYear = referenceOptions?.academicYears.find(
    (academicYear) => String(academicYear.id) === academicYearId
  );
  const termOptions = selectedAcademicYear?.terms.map(mapTermOption) ?? [];
  const selectedTerm = selectedAcademicYear?.terms.find((term) => String(term.id) === termId);
  const groups = groupListState.status === 'success' ? groupListState.response.results : [];
  const draftGroupCount = groups.filter(
    (group) => normalizeRegistrationGroupStatus(group.statusCode) === 'DRAFT'
  ).length;
  const selectedDetailCriteriaRows = getSearchCriteriaRows(selectedDetail?.searchCriteria ?? null);
  const editTermOptions = useMemo(() => {
    const academicYears = referenceOptions?.academicYears ?? [];
    const selectedEditYear = academicYears.find(
      (academicYear) => String(academicYear.id) === editForm?.academicYearId
    );
    const terms = selectedEditYear
      ? selectedEditYear.terms
      : academicYears.flatMap((academicYear) => academicYear.terms);

    return terms.map(mapTermOption);
  }, [editForm?.academicYearId, referenceOptions]);
  const canSaveEdit =
    editForm?.academicYearId &&
    editForm.termId &&
    editForm.registrationOpensDate &&
    editForm.registrationOpensTime &&
    editForm.registrationClosesDate &&
    editForm.registrationClosesTime;
  const unassignedStudentCount =
    unassignedReviewState.status === 'success'
      ? unassignedReviewState.response.unassignedStudentCount
      : null;
  const groupOptions = groups.map((group) => ({
    value: String(group.registrationGroupId),
    label: `${group.name} (${group.studentCount} students)`,
  }));
  const selectedAddStudentAlreadyAssigned =
    selectedAddStudent && selectedDetail
      ? selectedDetail.students.some((student) => student.studentId === selectedAddStudent.studentId)
      : false;
  const selectedAddStudentExistingAssignment = selectedAddStudent?.existingAssignment ?? null;
  const selectedAddStudentAssignedToOtherGroup =
    Boolean(selectedAddStudentExistingAssignment) &&
    selectedAddStudentExistingAssignment?.registrationGroupId !== Number(selectedGroupId);
  const visibleUnassignedStudents =
    unassignedReviewState.status === 'success' ? unassignedReviewState.response.results : [];
  const visibleUnassignedStudentIds = visibleUnassignedStudents.map((student) => student.studentId);
  const visibleSelectedUnassignedStudentIds = visibleUnassignedStudentIds.filter((studentId) =>
    selectedUnassignedStudentIds.has(studentId)
  );
  const allVisibleUnassignedSelected =
    visibleUnassignedStudentIds.length > 0 &&
    visibleSelectedUnassignedStudentIds.length === visibleUnassignedStudentIds.length;
  const someVisibleUnassignedSelected =
    visibleSelectedUnassignedStudentIds.length > 0 && !allVisibleUnassignedSelected;
  const addStudentDropdownContent = useMemo(() => {
    if (addStudentSearchState.status === 'loading') {
      return <Combobox.Empty>Searching...</Combobox.Empty>;
    }

    if (addStudentQuery.trim().length < 2) {
      return <Combobox.Empty>Type at least 2 characters</Combobox.Empty>;
    }

    if (addStudentSearchState.status === 'error') {
      return <Combobox.Empty>{addStudentSearchState.message}</Combobox.Empty>;
    }

    if (addStudentSearchState.results.length === 0) {
      return <Combobox.Empty>No students found</Combobox.Empty>;
    }

    return addStudentSearchState.results.map((student) => (
      <Combobox.Option key={student.studentId} value={String(student.studentId)}>
        <Stack gap={0}>
          <Text size="sm" fw={600}>
            {buildStudentOptionLabel(student)}
          </Text>
          <Text size="xs" c="dimmed">
            {buildStudentOptionDescription(student)}
          </Text>
        </Stack>
      </Combobox.Option>
    ));
  }, [addStudentQuery, addStudentSearchState]);

  async function loadGroupsForSelectedTerm(preferredGroupId?: string) {
    setGroupListState({ status: 'loading' });
    if (!preferredGroupId) {
      setSelectedGroupId('');
      setGroupDetailState({ status: 'idle' });
    }
    setPublishValidationState({ status: 'idle' });
    setMutationState({ status: 'idle' });
    setPublishState({ status: 'idle' });

    try {
      const response = await searchRegistrationGroups({
        academicYearId: Number(academicYearId),
        termId: Number(termId),
        status: 'DRAFT',
        page: 0,
        size: 100,
        sortBy: 'registrationOpensAt',
        sortDirection: 'asc',
      });

      setGroupListState({ status: 'success', response });
      const preferredGroupExists =
        preferredGroupId &&
        response.results.some((group) => String(group.registrationGroupId) === preferredGroupId);
      const nextGroupId = preferredGroupExists
        ? preferredGroupId
        : response.results[0]
          ? String(response.results[0].registrationGroupId)
          : '';
      setSelectedGroupId(nextGroupId);
      setUnassignedTargetGroupId((currentGroupId) => {
        if (currentGroupId && response.results.some((group) => String(group.registrationGroupId) === currentGroupId)) {
          return currentGroupId;
        }

        return response.results[0] ? String(response.results[0].registrationGroupId) : '';
      });
    } catch (error) {
      setGroupListState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to load registration groups for this term.'),
      });
    }
  }

  async function loadUnassignedStudents() {
    setUnassignedReviewState({ status: 'loading' });
    setPublishState({ status: 'idle' });

    try {
      const response = await searchUnassignedRegistrationGroupStudents({
        academicYearId: Number(academicYearId),
        termId: Number(termId),
        searchText: unassignedTableQuery,
        page: unassignedPage,
        size: Number(unassignedPageSize),
        sortBy: 'student',
        sortDirection: 'asc',
      });

      setUnassignedReviewState({ status: 'success', response });
    } catch (error) {
      setUnassignedReviewState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to load unassigned students.'),
      });
    }
  }

  async function handleValidateAndAdvanceFromReview() {
    if (!academicYearId || !termId) {
      setPublishValidationState({
        status: 'error',
        message: 'Choose an academic year and term before continuing.',
      });
      return;
    }

    setPublishValidationState({ status: 'loading' });
    setMutationState({ status: 'idle' });
    setPublishState({ status: 'idle' });

    try {
      const response = await validateRegistrationGroupsForPublish({
        request: {
          academicYearId: Number(academicYearId),
          termId: Number(termId),
        },
      });

      setPublishValidationState({ status: 'success', response });
      if (response.publishable) {
        setUnassignedPage(0);
        setSelectedUnassignedStudentIds(new Set());
        setActiveStep(1);
        return;
      }

      setActiveStep(0);
    } catch (error) {
      setPublishValidationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to validate registration groups for publishing.'),
      });
      setActiveStep(0);
    }
  }

  function handleNextStep() {
    if (activeStep === 0) {
      void handleValidateAndAdvanceFromReview();
      return;
    }

    setActiveStep((current) => Math.min(current + 1, 2));
  }

  function handleStepClick(nextStep: number) {
    if (nextStep === activeStep) {
      return;
    }

    if (nextStep < activeStep) {
      setActiveStep(nextStep);
      return;
    }

    if (activeStep === 0) {
      void handleValidateAndAdvanceFromReview();
      return;
    }

    setActiveStep(nextStep);
  }

  function handleOpenEditModal() {
    if (!selectedDetail) {
      return;
    }

    setEditForm(getInitialEditForm(selectedDetail));
    setMutationState({ status: 'idle' });
    setIsEditModalOpen(true);
  }

  async function handleSaveEdit() {
    if (!editForm || !selectedGroupId) {
      return;
    }

    const normalizedOpensTime = normalizeTimeInput(editForm.registrationOpensTime);
    const normalizedClosesTime = normalizeTimeInput(editForm.registrationClosesTime);

    if (!normalizedOpensTime || !normalizedClosesTime) {
      setMutationState({
        status: 'error',
        message: 'Registration open and close times are required.',
      });
      return;
    }

    setMutationState({ status: 'loading' });

    try {
      const detail = await patchRegistrationGroup({
        registrationGroupId: Number(selectedGroupId),
        request: {
          academicYearId: Number(editForm.academicYearId),
          termId: Number(editForm.termId),
          registrationClosesAt: combineDateTimeParts(
            editForm.registrationClosesDate,
            normalizedClosesTime
          ),
          registrationOpensAt: combineDateTimeParts(
            editForm.registrationOpensDate,
            normalizedOpensTime
          ),
        },
      });

      setGroupDetailState({ status: 'success', detail });
      setEditForm(getInitialEditForm(detail));
      setMutationState({ status: 'success', message: 'Registration group updated.' });
      setIsEditModalOpen(false);
      await loadGroupsForSelectedTerm(String(detail.summary.registrationGroupId));
      setSelectedGroupId(String(detail.summary.registrationGroupId));
    } catch (error) {
      setMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to update registration group.'),
      });
    }
  }

  function handleCloseAddStudentModal() {
    setIsAddStudentModalOpen(false);
    setAddStudentQuery('');
    setSelectedAddStudent(null);
    setAddStudentSearchState({ status: 'idle', results: [] });
  }

  async function handleAddSelectedStudent(moveExistingAssignment = false) {
    if (!selectedAddStudent || selectedAddStudentAlreadyAssigned || !selectedGroupId) {
      return;
    }

    setMutationState({ status: 'loading' });

    try {
      const detail = await addRegistrationGroupStudent({
        registrationGroupId: Number(selectedGroupId),
        request: { studentId: selectedAddStudent.studentId, moveExistingAssignment },
      });

      setGroupDetailState({ status: 'success', detail });
      setEditForm(getInitialEditForm(detail));
      setMutationState({
        status: 'success',
        message: moveExistingAssignment
          ? 'Student moved to this registration group.'
          : 'Student added to registration group.',
      });
      await loadGroupsForSelectedTerm(selectedGroupId);
      handleCloseAddStudentModal();
    } catch (error) {
      setMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to add student to registration group.'),
      });
    }
  }

  async function handleRemoveSelectedStudent() {
    if (!selectedAssignedStudent || !selectedGroupId) {
      return;
    }

    setMutationState({ status: 'loading' });

    try {
      const detail = await removeRegistrationGroupStudent({
        registrationGroupId: Number(selectedGroupId),
        studentId: selectedAssignedStudent.studentId,
      });

      setGroupDetailState({ status: 'success', detail });
      setEditForm(getInitialEditForm(detail));
      setSelectedAssignedStudent(null);
      setMutationState({ status: 'success', message: 'Student removed from registration group.' });
      await loadGroupsForSelectedTerm(selectedGroupId);
    } catch (error) {
      setMutationState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to remove student from registration group.'),
      });
    }
  }

  async function handleBulkAssignUnassignedStudents() {
    if (!unassignedTargetGroupId || selectedUnassignedStudentIds.size === 0) {
      return;
    }

    setBulkAssignState({ status: 'loading' });

    try {
      const response = await bulkAddRegistrationGroupStudents({
        registrationGroupId: Number(unassignedTargetGroupId),
        request: { studentIds: [...selectedUnassignedStudentIds] },
      });

      setBulkAssignState({
        status: 'success',
        message: `Added ${response.assignedStudentCount} student${
          response.assignedStudentCount === 1 ? '' : 's'
        } to ${response.registrationGroupName}.`,
      });
      setSelectedUnassignedStudentIds(new Set());
      await loadGroupsForSelectedTerm(unassignedTargetGroupId);
      await loadUnassignedStudents();
    } catch (error) {
      setBulkAssignState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to add selected students to the registration group.'),
      });
    }
  }

  async function handlePublishRegistrationGroups() {
    if (!academicYearId || !termId) {
      setPublishState({
        status: 'error',
        message: 'Choose an academic year and term before publishing.',
      });
      return;
    }

    setPublishState({ status: 'loading' });

    try {
      await publishRegistrationGroups({
        request: {
          academicYearId: Number(academicYearId),
          termId: Number(termId),
        },
      });

      const queryParams = new URLSearchParams({
        academicYearId,
        termId,
        status: 'PUBLISHED',
      });
      navigate(`/registration/groups?${queryParams.toString()}`);
    } catch (error) {
      setPublishState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to publish registration groups.'),
      });
    }
  }

  return (
    <>
      <Modal
        centered
        opened={isEditModalOpen}
        size="lg"
        title="Edit Registration Group"
        onClose={() => {
          setIsEditModalOpen(false);
        }}
      >
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                clearable={false}
                data={academicYearOptions}
                disabled={referenceOptionsLoading}
                label="Academic Year"
                value={editForm?.academicYearId ?? null}
                onChange={(value) => {
                  if (!value) {
                    return;
                  }

                  const nextAcademicYear = referenceOptions?.academicYears.find(
                    (option) => String(option.id) === value
                  );
                  const nextTerm = nextAcademicYear?.terms[0];

                  setEditForm((current) =>
                    current
                      ? {
                          ...current,
                          academicYearId: value,
                          termId: nextTerm ? String(nextTerm.id) : '',
                        }
                      : current
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                clearable={false}
                data={editTermOptions}
                disabled={!editForm?.academicYearId || referenceOptionsLoading}
                label="Term"
                value={editForm?.termId ?? null}
                onChange={(value) => {
                  if (value) {
                    setEditForm((current) => (current ? { ...current, termId: value } : current));
                  }
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                clearable
                label="Opens Date"
                placeholder="YYYY-MM-DD"
                value={parseDateInputValue(editForm?.registrationOpensDate ?? '')}
                valueFormat="YYYY-MM-DD"
                onChange={(value) => {
                  setEditForm((current) =>
                    current
                      ? { ...current, registrationOpensDate: normalizeDateInputValue(value) }
                      : current
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Opens Time"
                placeholder="8:00 AM"
                value={formatTimeInputValue(editForm?.registrationOpensTime ?? null)}
                onChange={(event) => {
                  setEditForm((current) =>
                    current
                      ? { ...current, registrationOpensTime: event.currentTarget.value }
                      : current
                  );
                }}
                onBlur={(event) => {
                  const value = normalizeTimeInput(event.currentTarget.value);
                  setEditForm((current) =>
                    current ? { ...current, registrationOpensTime: value ?? '' } : current
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                clearable
                label="Closes Date"
                placeholder="YYYY-MM-DD"
                value={parseDateInputValue(editForm?.registrationClosesDate ?? '')}
                valueFormat="YYYY-MM-DD"
                onChange={(value) => {
                  setEditForm((current) =>
                    current
                      ? { ...current, registrationClosesDate: normalizeDateInputValue(value) }
                      : current
                  );
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Closes Time"
                placeholder="5:00 PM"
                value={formatTimeInputValue(editForm?.registrationClosesTime ?? null)}
                onChange={(event) => {
                  setEditForm((current) =>
                    current
                      ? { ...current, registrationClosesTime: event.currentTarget.value }
                      : current
                  );
                }}
                onBlur={(event) => {
                  const value = normalizeTimeInput(event.currentTarget.value);
                  setEditForm((current) =>
                    current ? { ...current, registrationClosesTime: value ?? '' } : current
                  );
                }}
              />
            </Grid.Col>
          </Grid>

          {mutationState.status === 'error' ? (
            <Alert color="red" title="Unable to update registration group">
              {mutationState.message}
            </Alert>
          ) : null}

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setIsEditModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!canSaveEdit}
              loading={mutationState.status === 'loading'}
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        centered
        opened={isAddStudentModalOpen}
        size="xl"
        title={selectedDetail ? `Add Student to ${selectedDetail.summary.name}` : 'Add Student'}
        onClose={handleCloseAddStudentModal}
      >
        <Stack gap="md">
          <Combobox
            store={addStudentCombobox}
            onOptionSubmit={(optionValue) => {
              const student = addStudentSearchState.results.find(
                (candidate) => candidate.studentId === Number(optionValue)
              );

              if (student) {
                setSelectedAddStudent(student);
                setAddStudentQuery(buildStudentOptionLabel(student));
              }

              addStudentCombobox.closeDropdown();
            }}
          >
            <Combobox.Target>
              <TextInput
                label="Search students"
                placeholder="Name, email, or student ID"
                value={addStudentQuery}
                onFocus={() => {
                  addStudentCombobox.openDropdown();
                }}
                onClick={() => {
                  addStudentCombobox.openDropdown();
                }}
                onChange={(event) => {
                  setSelectedAddStudent(null);
                  setAddStudentQuery(event.currentTarget.value);
                  addStudentCombobox.openDropdown();
                }}
              />
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>{addStudentDropdownContent}</Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>

          {selectedAddStudent ? (
            <Paper p="md" withBorder radius="md">
              <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                <Stack gap={2}>
                  <Text fw={700}>{buildStudentOptionLabel(selectedAddStudent)}</Text>
                  <Text size="sm" c="dimmed">
                    {buildStudentOptionDescription(selectedAddStudent)}
                  </Text>
                  <Group gap="xs">
                    <Badge variant="light">{displayValue(selectedAddStudent.classStanding)}</Badge>
                    {selectedAddStudentAlreadyAssigned ? (
                      <Badge color="yellow" variant="light">
                        Already in this group
                      </Badge>
                    ) : selectedAddStudentAssignedToOtherGroup ? (
                      <Badge color="yellow" variant="light">
                        In another group
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light">
                        Not in this group
                      </Badge>
                    )}
                  </Group>
                </Stack>
                {selectedAddStudentAssignedToOtherGroup ? (
                  <Button
                    color="yellow"
                    disabled={Boolean(selectedAddStudentAlreadyAssigned)}
                    loading={mutationState.status === 'loading'}
                    onClick={() => {
                      void handleAddSelectedStudent(true);
                    }}
                  >
                    Move to This Group
                  </Button>
                ) : (
                  <Button
                    disabled={Boolean(selectedAddStudentAlreadyAssigned)}
                    loading={mutationState.status === 'loading'}
                    onClick={() => {
                      void handleAddSelectedStudent(false);
                    }}
                  >
                    Add to Group
                  </Button>
                )}
              </Group>
              {selectedAddStudentAssignedToOtherGroup && selectedAddStudentExistingAssignment ? (
                <Alert color="yellow" title="Student is already grouped" mt="md">
                  {buildStudentOptionLabel(selectedAddStudent)} is already assigned to{' '}
                  <Text span fw={700}>
                    {selectedAddStudentExistingAssignment.groupName}
                  </Text>{' '}
                  for {selectedAddStudentExistingAssignment.termName}. Moving the student will remove
                  that assignment and add them to this group.
                </Alert>
              ) : null}
            </Paper>
          ) : (
            <Text size="sm" c="dimmed">
              Search by student ID, email, or name. Any active student can be added to this group.
            </Text>
          )}
        </Stack>
      </Modal>

      <Modal
        centered
        opened={Boolean(selectedAssignedStudent)}
        size="lg"
        title="Manage Student"
        onClose={() => {
          setSelectedAssignedStudent(null);
        }}
      >
        {selectedAssignedStudent ? (
          <Stack gap="md">
            <Stack gap={2}>
              <Text fw={700}>{displayAssignedStudentName(selectedAssignedStudent)}</Text>
              <Text size="sm" c="dimmed">
                {displayValue(selectedAssignedStudent.studentNumber)}
                {selectedAssignedStudent.email ? ` · ${selectedAssignedStudent.email}` : ''}
              </Text>
            </Stack>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Class</Text>
                  <Text fw={700}>{displayValue(selectedAssignedStudent.classStandingName)}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Assignment Source</Text>
                  <Text fw={700}>{displayValue(selectedAssignedStudent.assignmentSource)}</Text>
                </Stack>
              </Grid.Col>
            </Grid>

            <Group justify="space-between">
              <Button
                color="red"
                variant="light"
                loading={mutationState.status === 'loading'}
                onClick={() => {
                  void handleRemoveSelectedStudent();
                }}
              >
                Remove from Group
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setSelectedAssignedStudent(null);
                }}
              >
                Close
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      <Stack gap="lg">
        {activeStep === 0 ? (
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                clearable={false}
                data={academicYearOptions}
                disabled={referenceOptionsLoading}
                label="Academic Year"
                value={academicYearId}
                onChange={(value) => {
                  if (!value) {
                    return;
                  }

                  const nextAcademicYear = referenceOptions?.academicYears.find(
                    (option) => String(option.id) === value
                  );

                  setAcademicYearId(value);
                  setTermId(nextAcademicYear?.terms[0] ? String(nextAcademicYear.terms[0].id) : '');
                  setActiveStep(0);
                  setUnassignedReviewState({ status: 'idle' });
                  setPublishValidationState({ status: 'idle' });
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                clearable={false}
                data={termOptions}
                disabled={referenceOptionsLoading || termOptions.length === 0}
                label="Term"
                value={termId}
                onChange={(value) => {
                  setTermId(value ?? '');
                  setActiveStep(0);
                  setUnassignedReviewState({ status: 'idle' });
                  setPublishValidationState({ status: 'idle' });
                }}
              />
            </Grid.Col>
          </Grid>
        ) : (
          <Paper p="md" withBorder radius="md">
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Academic Year</Text>
                  <Text fw={700}>{selectedAcademicYear?.name ?? '-'}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap={4}>
                  <Text className="portal-ui-eyebrow-text">Term</Text>
                  <Text fw={700}>{selectedTerm?.name ?? '-'}</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        )}

        <Stepper active={activeStep} onStepClick={handleStepClick}>
          <Stepper.Step label="Review groups" description="Check group setup">
            <Stack gap="md" mt="lg">
              <Group justify="space-between" align="center">
                <Stack gap={2}>
                  <Title order={3}>Groups for {selectedTerm?.name ?? 'selected term'}</Title>
                  <Text size="sm" c="dimmed">
                    Select a draft group to review the group detail underneath. Published, closed,
                    and cancelled groups are not included in this workflow.
                  </Text>
                </Stack>
                <Button
                  variant="default"
                  loading={groupListState.status === 'loading'}
                  onClick={() => {
                    void loadGroupsForSelectedTerm();
                  }}
                >
                  Refresh Groups
                </Button>
              </Group>

              {groupListState.status === 'error' ? (
                <Alert color="red" title="Unable to load groups">
                  {groupListState.message}
                </Alert>
              ) : null}

              <PublishValidationAlert validationState={publishValidationState} />

              <Paper p="md" withBorder radius="md">
                {groupListState.status === 'loading' ? (
                  <Group gap="md">
                    <Loader size="sm" />
                    <Text>Loading registration groups...</Text>
                  </Group>
                ) : (
                  <Table.ScrollContainer minWidth={900}>
                    <Table horizontalSpacing="md" verticalSpacing="sm">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Group</Table.Th>
                          <Table.Th>Window</Table.Th>
                          <Table.Th>Students</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {groups.length > 0 ? (
                          groups.map((group) => {
                            const selected = selectedGroupId === String(group.registrationGroupId);

                            return (
                              <Table.Tr
                                key={group.registrationGroupId}
                                role="button"
                                tabIndex={0}
                                style={{
                                  background: selected ? 'var(--mantine-color-blue-0)' : undefined,
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  setSelectedGroupId(String(group.registrationGroupId));
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setSelectedGroupId(String(group.registrationGroupId));
                                  }
                                }}
                              >
                                <Table.Td>
                                  <Stack gap={2}>
                                    <Text fw={700}>{group.name}</Text>
                                    <Text size="sm" c="dimmed">
                                      {displayValue(group.createdFrom ?? group.generationName)}
                                    </Text>
                                  </Stack>
                                </Table.Td>
                                <Table.Td>
                                  <Stack gap={2}>
                                    <Text>{displayDateTime(group.registrationOpensAt)}</Text>
                                    <Text size="sm" c="dimmed">
                                      closes {displayDateTime(group.registrationClosesAt)}
                                    </Text>
                                  </Stack>
                                </Table.Td>
                                <Table.Td>{group.studentCount}</Table.Td>
                                <Table.Td>
                                  <Badge
                                    color={getRegistrationGroupStatusColor(group.statusCode)}
                                    variant="light"
                                  >
                                    {getRegistrationGroupStatusLabel(group.statusCode, group.statusName)}
                                  </Badge>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })
                        ) : (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Text c="dimmed">No draft registration groups found for this term.</Text>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Paper>

              <RegistrationGroupReviewPanel
                criteriaRows={selectedDetailCriteriaRows}
                detailState={groupDetailState}
                mutationState={mutationState}
                onAddStudent={() => {
                  if (!selectedDetail) {
                    return;
                  }

                  setIsAddStudentModalOpen(true);
                  setMutationState({ status: 'idle' });
                }}
                onEdit={handleOpenEditModal}
                onSelectStudent={(student) => {
                  setSelectedAssignedStudent(student);
                  setMutationState({ status: 'idle' });
                }}
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Unassigned students" description="Fix gaps">
            <Stack gap="md" mt="lg">
              <Group justify="space-between" align="center">
                <Stack gap={2}>
                  <Title order={3}>Unassigned Students</Title>
                  <Text size="sm" c="dimmed">
                    Review unassigned students and optionally assign them before publishing.
                    Remaining unassigned students do not block publishing.
                  </Text>
                </Stack>
                <Button
                  variant="default"
                  disabled={!academicYearId || !termId}
                  onClick={() => {
                    navigate(
                      `/registration/groups/unassigned?academicYearId=${academicYearId}&termId=${termId}`
                    );
                  }}
                >
                  Open Cleanup Page
                </Button>
              </Group>

              {unassignedReviewState.status === 'loading' ? (
                <Paper p="md" withBorder radius="md">
                  <Group gap="md">
                    <Loader size="sm" />
                    <Text>Loading unassigned students...</Text>
                  </Group>
                </Paper>
              ) : null}

              {unassignedReviewState.status === 'error' ? (
                <Alert color="red" title="Unable to load unassigned students">
                  {unassignedReviewState.message} You can still continue to publish after group setup is valid.
                </Alert>
              ) : null}

              {unassignedReviewState.status === 'success' ? (
                <Paper p="md" withBorder radius="md">
                  <Stack gap="md">
                    <Alert
                      color={unassignedReviewState.response.unassignedStudentCount > 0 ? 'yellow' : 'green'}
                      title={
                        unassignedReviewState.response.unassignedStudentCount > 0
                          ? 'Optional cleanup remains'
                          : 'No unassigned students'
                      }
                    >
                      {unassignedReviewState.response.unassignedStudentCount} student
                      {unassignedReviewState.response.unassignedStudentCount === 1 ? '' : 's'} remain
                      unassigned for {unassignedReviewState.response.termName}. You may continue with
                      publishing if the registration groups are ready.
                    </Alert>

                    {bulkAssignState.status === 'success' ? (
                      <Alert color="green" title="Students added">
                        {bulkAssignState.message}
                      </Alert>
                    ) : null}

                    {bulkAssignState.status === 'error' ? (
                      <Alert color="red" title="Unable to add students">
                        {bulkAssignState.message}
                      </Alert>
                    ) : null}

                    <Grid align="flex-end">
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Select
                          clearable={false}
                          data={groupOptions}
                          label="Target Group"
                          placeholder="Choose group"
                          value={unassignedTargetGroupId}
                          onChange={(value) => {
                            setUnassignedTargetGroupId(value ?? '');
                            setBulkAssignState({ status: 'idle' });
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 3 }}>
                        <TextInput
                          label="Search Table"
                          placeholder="Name, ID, email, or program"
                          value={unassignedTableQuery}
                          onChange={(event) => {
                            setUnassignedTableQuery(event.currentTarget.value);
                            setUnassignedPage(0);
                            setSelectedUnassignedStudentIds(new Set());
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 2 }}>
                        <Select
                          clearable={false}
                          data={unassignedReviewPageSizeOptions}
                          label="Page Size"
                          value={unassignedPageSize}
                          onChange={(value) => {
                            if (!value) {
                              return;
                            }

                            setUnassignedPageSize(value as UnassignedReviewPageSize);
                            setUnassignedPage(0);
                            setSelectedUnassignedStudentIds(new Set());
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 3 }}>
                        <Button
                          fullWidth
                          disabled={
                            !unassignedTargetGroupId || selectedUnassignedStudentIds.size === 0
                          }
                          loading={bulkAssignState.status === 'loading'}
                          onClick={() => {
                            void handleBulkAssignUnassignedStudents();
                          }}
                        >
                          Add Selected to Group
                        </Button>
                      </Grid.Col>
                    </Grid>

                    <Table.ScrollContainer minWidth={760}>
                      <Table horizontalSpacing="md" verticalSpacing="sm">
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>
                              <Checkbox
                                aria-label="Select all visible unassigned students"
                                checked={allVisibleUnassignedSelected}
                                indeterminate={someVisibleUnassignedSelected}
                                onChange={(event) => {
                                  const checked = event.currentTarget.checked;
                                  setSelectedUnassignedStudentIds((currentIds) => {
                                    const nextIds = new Set(currentIds);
                                    visibleUnassignedStudentIds.forEach((studentId) => {
                                      if (checked) {
                                        nextIds.add(studentId);
                                      } else {
                                        nextIds.delete(studentId);
                                      }
                                    });
                                    return nextIds;
                                  });
                                }}
                              />
                            </Table.Th>
                            <Table.Th>Student</Table.Th>
                            <Table.Th>Program</Table.Th>
                            <Table.Th>Credits</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {unassignedReviewState.response.results.length > 0 ? (
                            unassignedReviewState.response.results.map((student) => (
                              <Table.Tr key={student.studentId}>
                                <Table.Td>
                                  <Checkbox
                                    aria-label={`Select ${displayUnassignedStudentName(student)}`}
                                    checked={selectedUnassignedStudentIds.has(student.studentId)}
                                    onChange={(event) => {
                                      const checked = event.currentTarget.checked;
                                      setSelectedUnassignedStudentIds((currentIds) => {
                                        const nextIds = new Set(currentIds);
                                        if (checked) {
                                          nextIds.add(student.studentId);
                                        } else {
                                          nextIds.delete(student.studentId);
                                        }
                                        return nextIds;
                                      });
                                    }}
                                  />
                                </Table.Td>
                                <Table.Td>
                                  <Stack gap={2}>
                                    <Text fw={700}>{displayUnassignedStudentName(student)}</Text>
                                    <Text size="sm" c="dimmed">
                                      {displayValue(student.studentNumber)}
                                      {student.email ? ` · ${student.email}` : ''}
                                    </Text>
                                  </Stack>
                                </Table.Td>
                                <Table.Td>
                                  {student.programNames.length > 0
                                    ? student.programNames.join(', ')
                                    : '-'}
                                </Table.Td>
                                <Table.Td>{student.totalCredits}</Table.Td>
                              </Table.Tr>
                            ))
                          ) : (
                            <Table.Tr>
                              <Table.Td colSpan={4}>
                                <Text c="dimmed">No unassigned students found.</Text>
                              </Table.Td>
                            </Table.Tr>
                          )}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>

                    {unassignedReviewState.response.page.totalElements > 0 ? (
                      <Group justify="space-between" align="center" wrap="wrap">
                        <Text size="sm" c="dimmed">
                          Showing{' '}
                          {unassignedReviewState.response.page.page *
                            unassignedReviewState.response.page.size +
                            1}
                          -
                          {unassignedReviewState.response.page.page *
                            unassignedReviewState.response.page.size +
                            unassignedReviewState.response.results.length}{' '}
                          of {unassignedReviewState.response.page.totalElements}
                        </Text>
                        <Pagination
                          total={Math.max(unassignedReviewState.response.page.totalPages, 1)}
                          value={unassignedReviewState.response.page.page + 1}
                          withEdges
                          onChange={(nextPage) => {
                            setUnassignedPage(nextPage - 1);
                            setSelectedUnassignedStudentIds(new Set());
                          }}
                        />
                      </Group>
                    ) : null}
                  </Stack>
                </Paper>
              ) : null}
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Publish" description="Confirm">
            <Stack gap="md" mt="lg">
              <Paper p="md" withBorder radius="md">
                <Stack gap="md">
                  <Title order={3}>Publish Summary</Title>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Stack gap={4}>
                        <Text className="portal-ui-eyebrow-text">Academic Year</Text>
                        <Text fw={700}>{selectedAcademicYear?.name ?? '-'}</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Stack gap={4}>
                        <Text className="portal-ui-eyebrow-text">Term</Text>
                        <Text fw={700}>{selectedTerm?.name ?? '-'}</Text>
                      </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Stack gap={4}>
                        <Text className="portal-ui-eyebrow-text">Draft Groups</Text>
                        <Text fw={700}>{draftGroupCount}</Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                  <Alert
                    color={unassignedStudentCount && unassignedStudentCount > 0 ? 'yellow' : 'green'}
                    title={
                      unassignedStudentCount && unassignedStudentCount > 0
                        ? 'Unassigned students remain'
                        : 'Unassigned-student review is clear'
                    }
                  >
                    {unassignedStudentCount === null
                      ? 'Unassigned-student review was not loaded. This does not block publishing.'
                      : `${unassignedStudentCount} unassigned student${
                          unassignedStudentCount === 1 ? '' : 's'
                        } found. This does not block publishing.`}
                  </Alert>
                  {publishState.status === 'error' ? (
                    <Alert color="red" title="Unable to publish registration groups">
                      {publishState.message}
                    </Alert>
                  ) : null}
                </Stack>
              </Paper>
            </Stack>
          </Stepper.Step>
        </Stepper>

        <Group justify="space-between">
          <Button
            variant="default"
            onClick={() => {
              navigate('/registration/groups');
            }}
          >
            Back to Groups
          </Button>
          <Group gap="sm">
            <Button
              variant="default"
              disabled={activeStep === 0}
              onClick={() => {
                setActiveStep((current) => Math.max(current - 1, 0));
              }}
            >
              Back
            </Button>
            {activeStep < 2 ? (
              <Button
                loading={activeStep === 0 && publishValidationState.status === 'loading'}
                onClick={handleNextStep}
              >
                Next
              </Button>
            ) : (
              <Button
                disabled={draftGroupCount === 0}
                loading={publishState.status === 'loading'}
                onClick={() => {
                  void handlePublishRegistrationGroups();
                }}
              >
                Publish All Draft Groups
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </>
  );
}

function PublishValidationAlert({ validationState }: { validationState: PublishValidationState }) {
  if (validationState.status === 'idle' || validationState.status === 'loading') {
    return null;
  }

  if (validationState.status === 'error') {
    return (
      <Alert color="red" title="Unable to validate registration groups">
        {validationState.message}
      </Alert>
    );
  }

  if (validationState.status !== 'success') {
    return null;
  }

  const { response } = validationState;
  if (response.publishable) {
    return (
      <Alert color="green" title="Groups are ready for unassigned-student review">
        {response.draftGroupCount} draft group{response.draftGroupCount === 1 ? '' : 's'} can move
        forward for publishing.
      </Alert>
    );
  }

  return (
    <Alert color="red" title="Fix registration group setup before continuing">
      <Stack gap="xs">
        {response.issues.length > 0 ? (
          response.issues.map((issue, index) => (
            <Text key={`${issue.registrationGroupId ?? 'global'}-${issue.code}-${index}`} size="sm">
              <Text span fw={700}>
                {issue.groupName ?? 'Registration groups'}:
              </Text>{' '}
              {issue.message}
            </Text>
          ))
        ) : (
          <Text size="sm">There are no draft registration groups to publish for this term.</Text>
        )}
      </Stack>
    </Alert>
  );
}

function RegistrationGroupReviewPanel({
  criteriaRows,
  detailState,
  mutationState,
  onAddStudent,
  onEdit,
  onSelectStudent,
}: {
  criteriaRows: { label: string; value: string | number }[];
  detailState: GroupDetailState;
  mutationState: MutationState;
  onAddStudent: () => void;
  onEdit: () => void;
  onSelectStudent: (student: RegistrationGroupAssignedStudentResponse) => void;
}) {
  if (detailState.status === 'idle') {
    return (
      <Paper p="md" withBorder radius="md">
        <Text c="dimmed">Select a registration group to review its detail.</Text>
      </Paper>
    );
  }

  if (detailState.status === 'loading') {
    return (
      <Paper p="md" withBorder radius="md">
        <Group gap="md">
          <Loader size="sm" />
          <Text>Loading selected group...</Text>
        </Group>
      </Paper>
    );
  }

  if (detailState.status === 'error') {
    return (
      <Alert color="red" title="Unable to load selected group">
        {detailState.message}
      </Alert>
    );
  }

  if (detailState.status !== 'success') {
    return null;
  }

  const { detail } = detailState;

  return (
    <Stack gap="md">
      {mutationState.status === 'success' ? (
        <Alert color="green" title="Registration group updated">
          {mutationState.message}
        </Alert>
      ) : null}

      <Paper p="md" withBorder radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Stack gap={2}>
              <Group gap="sm">
                <Title order={3}>{detail.summary.name}</Title>
                <Badge color={getRegistrationGroupStatusColor(detail.summary.statusCode)} variant="light">
                  {getRegistrationGroupStatusLabel(detail.summary.statusCode, detail.summary.statusName)}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {displayValue(detail.summary.academicYearName)} · {displayValue(detail.summary.termName)}
              </Text>
            </Stack>
            <Button onClick={onEdit}>Edit Group</Button>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={4}>
                <Text className="portal-ui-eyebrow-text">Academic Year</Text>
                <Text fw={700}>{displayValue(detail.summary.academicYearName)}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={4}>
                <Text className="portal-ui-eyebrow-text">Term</Text>
                <Text fw={700}>{displayValue(detail.summary.termName)}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={4}>
                <Text className="portal-ui-eyebrow-text">Opens</Text>
                <Text fw={700}>{displayDateTime(detail.registrationWindow.opensAt)}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={4}>
                <Text className="portal-ui-eyebrow-text">Closes</Text>
                <Text fw={700}>{displayDateTime(detail.registrationWindow.closesAt)}</Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      <Paper p="md" withBorder radius="md">
        <Stack gap="md">
          <Title order={3}>Saved Search Criteria</Title>
          {criteriaRows.length > 0 ? (
            <Grid>
              {criteriaRows.map((criterion) => (
                <Grid.Col key={`${criterion.label}-${criterion.value}`} span={{ base: 12, md: 4 }}>
                  <Stack gap={4}>
                    <Text className="portal-ui-eyebrow-text">{criterion.label}</Text>
                    <Text fw={700}>{criterion.value}</Text>
                  </Stack>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <Text c="dimmed">No saved search criteria exists for this group.</Text>
          )}
        </Stack>
      </Paper>

      <Paper p="md" withBorder radius="md">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3}>Students</Title>
            <Group gap="sm">
              <Badge variant="light">{detail.counts.assignedStudentCount} assigned</Badge>
              <Button onClick={onAddStudent}>Add Student</Button>
            </Group>
          </Group>

          <Table.ScrollContainer minWidth={900}>
            <Table horizontalSpacing="md" verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student</Table.Th>
                  <Table.Th>Class</Table.Th>
                  <Table.Th>Source</Table.Th>
                  <Table.Th>Assigned</Table.Th>
                  <Table.Th>Updated</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {detail.students.length > 0 ? (
                  detail.students.map((student) => (
                    <Table.Tr
                      key={student.registrationGroupStudentId}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        onSelectStudent(student);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectStudent(student);
                        }
                      }}
                    >
                      <Table.Td>
                        <Stack gap={2}>
                          <Text fw={700}>{displayAssignedStudentName(student)}</Text>
                          <Text size="sm" c="dimmed">
                            {displayValue(student.studentNumber)}
                            {student.email ? ` · ${student.email}` : ''}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>{displayValue(student.classStandingName)}</Table.Td>
                      <Table.Td>
                        <Badge variant="light">{displayValue(student.assignmentSource)}</Badge>
                      </Table.Td>
                      <Table.Td>{displayDateTime(student.assignedAt)}</Table.Td>
                      <Table.Td>{displayDateTime(student.updatedAt)}</Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text c="dimmed">No students are assigned to this group.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      </Paper>
    </Stack>
  );
}
