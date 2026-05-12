import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Container,
  Combobox,
  Divider,
  Grid,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
  useCombobox,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconUsersGroup } from '@tabler/icons-react';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import {
  displayDateTime,
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
} from '@/components/registration-groups/registrationGroupStatusDisplay';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchResultsPanel, type SearchResultsStatus } from '@/components/search/SearchResultsPanel';
import {
  getRegistrationGroupReferenceOptions,
  previewRegistrationGroups,
  saveGeneratedRegistrationGroups,
  searchRegistrationGroupStudentOptions,
} from '@/services/registration-group-service';
import type {
  RegistrationGroupBuilderPreviewGroupResponse,
  RegistrationGroupBuilderPreviewResponse,
  RegistrationGroupBuilderPreviewStudentResponse,
  RegistrationGroupGenerationCreateRequest,
  RegistrationGroupReferenceOptionsResponse,
  RegistrationGroupStudentOptionResponse,
} from '@/services/schemas/registration-group-schemas';
import { getErrorMessage } from '@/utils/errors';
import { parseOptionalId } from '@/utils/form-values';

type GeneratedGroupSortBy = 'credits' | 'name' | 'studentCount';
type SortDirection = 'asc' | 'desc';
type AddStudentSearchStatus = 'idle' | 'loading' | 'success' | 'error';

type ReferenceOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; response: RegistrationGroupReferenceOptionsResponse }
  | { status: 'error'; message: string };

type PreviewState =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' | 'success'; response: RegistrationGroupBuilderPreviewResponse };

type SaveState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

type RegistrationGroupFilters = {
  academicDivisionId: string;
  academicYearId: string;
  athleteFilter: string;
  athleticSportIds: string[];
  existingGroupFilter: string;
  groupNamePrefix: string;
  honorsFilter: string;
  includeCurrentCredits: boolean;
  includeTransferCredits: boolean;
  maxCredits: string;
  minCredits: string;
  programQuery: string;
  splitCount: number;
  studentQuery: string;
  termId: string;
};

type RegistrationGroupBuilderStudent = {
  academicDivisionName: string;
  athleticSportNames: string[];
  classStandingName: string;
  completedCredits: number;
  currentCredits: number;
  email: string;
  existingAssignment: RegistrationGroupBuilderPreviewStudentResponse['existingAssignment'];
  honors: boolean;
  id: number;
  name: string;
  programNames: string[];
  studentNumber: string;
  totalCredits: number;
  transferCredits: number;
};

type GeneratedRegistrationGroup = {
  academicYearCode: string;
  academicYearId: number;
  academicYearName: string;
  id: string;
  name: string;
  registrationClosesDate: string;
  registrationClosesTime: string;
  registrationOpensDate: string;
  registrationOpensTime: string;
  students: RegistrationGroupBuilderStudent[];
  termCode: string;
  termId: number;
  termName: string;
  totalCredits: number;
};

type GeneratedGroupStudentFilters = {
  athleteStatus: string;
  existingGroupAssignment: string;
  honorsStatus: string;
  program: string;
  query: string;
};

type SelectedGroupStudent = {
  groupId: string;
  studentId: number;
};

type AddStudentSearchState = {
  status: AddStudentSearchStatus;
  results: RegistrationGroupStudentOptionResponse[];
  message?: string;
};

const initialFilters: RegistrationGroupFilters = {
  academicDivisionId: '',
  academicYearId: '',
  athleteFilter: '',
  athleticSportIds: [],
  existingGroupFilter: 'EXCLUDE_ALREADY_GROUPED',
  groupNamePrefix: 'Registration Group',
  honorsFilter: '',
  includeCurrentCredits: true,
  includeTransferCredits: true,
  maxCredits: '',
  minCredits: '',
  programQuery: '',
  splitCount: 3,
  studentQuery: '',
  termId: '',
};

const initialGeneratedGroupStudentFilters: GeneratedGroupStudentFilters = {
  athleteStatus: '',
  existingGroupAssignment: '',
  honorsStatus: '',
  program: '',
  query: '',
};

const generatedGroupColumns: ColumnDef<GeneratedRegistrationGroup>[] = [
  {
    id: 'name',
    header: 'Group',
    size: 320,
    meta: { sortBy: 'name' satisfies GeneratedGroupSortBy },
    cell: ({ row }) => <Text fw={700}>{row.original.name}</Text>,
  },
  {
    id: 'academicYear',
    header: 'Academic Year',
    size: 230,
    cell: ({ row }) => row.original.academicYearName,
  },
  {
    id: 'term',
    header: 'Term',
    size: 180,
    cell: ({ row }) => row.original.termName,
  },
  {
    id: 'opens',
    header: 'Opens',
    size: 240,
    cell: ({ row }) =>
      displayDateTime(
        combineDateTimeParts(row.original.registrationOpensDate, row.original.registrationOpensTime)
      ),
  },
  {
    id: 'closes',
    header: 'Closes',
    size: 240,
    cell: ({ row }) =>
      displayDateTime(
        combineDateTimeParts(row.original.registrationClosesDate, row.original.registrationClosesTime)
      ),
  },
  {
    id: 'studentCount',
    header: 'Students',
    size: 160,
    meta: { sortBy: 'studentCount' satisfies GeneratedGroupSortBy },
    cell: ({ row }) => row.original.students.length,
  },
  {
    id: 'credits',
    header: 'Total Credits',
    size: 190,
    meta: { sortBy: 'credits' satisfies GeneratedGroupSortBy },
    cell: ({ row }) => row.original.totalCredits,
  },
];

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((first, second) =>
    first.localeCompare(second)
  );
}

function includesText(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

function toNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getGroupNamePrefix(value: string) {
  return value.trim() || initialFilters.groupNamePrefix;
}

function combineDateTimeParts(date: string, time: string) {
  const dateValue = date.trim();
  const normalizedTime = normalizeTimeInput(time);

  if (!dateValue || !normalizedTime || !/^\d{2}:\d{2}$/.test(normalizedTime)) {
    return null;
  }

  return `${dateValue}T${normalizedTime}:00`;
}

function normalizeGroupWindowTime(value: string) {
  return normalizeTimeInput(value) ?? '';
}

function parseCreditLimit(value: string) {
  if (value.trim() === '') {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function buildStudentOptionLabel(student: RegistrationGroupStudentOptionResponse) {
  const displayName = student.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();
  if (name) {
    return name;
  }

  return student.email ?? student.studentNumber ?? `Student ${student.studentId}`;
}

function buildStudentOptionDescription(student: RegistrationGroupStudentOptionResponse) {
  return [student.studentNumber, student.email, student.classStanding].filter(Boolean).join(' · ');
}

function getGroupWindowValidationMessage(groups: GeneratedRegistrationGroup[]) {
  for (const group of groups) {
    const hasPartialOpenWindow =
      Boolean(group.registrationOpensDate.trim()) !== Boolean(group.registrationOpensTime.trim());
    const hasPartialCloseWindow =
      Boolean(group.registrationClosesDate.trim()) !== Boolean(group.registrationClosesTime.trim());

    if (hasPartialOpenWindow) {
      return `${group.name} needs both an opens date and opens time.`;
    }

    if (hasPartialCloseWindow) {
      return `${group.name} needs both a closes date and closes time.`;
    }

    const registrationOpensAt = combineDateTimeParts(
      group.registrationOpensDate,
      group.registrationOpensTime
    );
    const registrationClosesAt = combineDateTimeParts(
      group.registrationClosesDate,
      group.registrationClosesTime
    );

    if (
      group.registrationOpensDate.trim() &&
      group.registrationOpensTime.trim() &&
      !registrationOpensAt
    ) {
      return `${group.name} has an invalid opens time.`;
    }

    if (
      group.registrationClosesDate.trim() &&
      group.registrationClosesTime.trim() &&
      !registrationClosesAt
    ) {
      return `${group.name} has an invalid closes time.`;
    }

    if (
      registrationOpensAt &&
      registrationClosesAt &&
      new Date(registrationOpensAt).getTime() >= new Date(registrationClosesAt).getTime()
    ) {
      return `${group.name} must close after it opens.`;
    }
  }

  return null;
}

function mapPreviewStudent(
  student: RegistrationGroupBuilderPreviewStudentResponse
): RegistrationGroupBuilderStudent {
  const fallbackName = [student.firstName, student.lastName].filter(Boolean).join(' ').trim();

  return {
    academicDivisionName: student.academicDivisionName ?? 'Unknown',
    athleticSportNames: student.athleticSports.map((sport) => sport.name),
    classStandingName: student.classStandingName ?? 'Unknown',
    completedCredits: toNumber(student.completedCredits),
    currentCredits: toNumber(student.currentCredits),
    email: student.email ?? '',
    existingAssignment: student.existingAssignment,
    honors: student.honors,
    id: student.studentId,
    name: student.displayName ?? (fallbackName || student.email) ?? `Student ${student.studentId}`,
    programNames: student.programNames,
    studentNumber: student.studentNumber ?? `ID ${student.studentId}`,
    totalCredits: toNumber(student.totalCredits),
    transferCredits: toNumber(student.transferCredits),
  };
}

function mapPreviewGroup(group: RegistrationGroupBuilderPreviewGroupResponse): GeneratedRegistrationGroup {
  return {
    academicYearCode: group.academicYearCode,
    academicYearId: group.academicYearId,
    academicYearName: group.academicYearName,
    id: group.temporaryGroupId,
    name: group.name,
    registrationClosesDate: '',
    registrationClosesTime: '',
    registrationOpensDate: '',
    registrationOpensTime: '',
    students: group.students.map(mapPreviewStudent),
    termCode: group.termCode,
    termId: group.termId,
    termName: group.termName,
    totalCredits: toNumber(group.totalCredits),
  };
}

function mapStudentOptionToGeneratedStudent(
  option: RegistrationGroupStudentOptionResponse
): RegistrationGroupBuilderStudent {
  return {
    academicDivisionName: 'Unknown',
    athleticSportNames: [],
    classStandingName: option.classStanding ?? 'Unknown',
    completedCredits: 0,
    currentCredits: 0,
    email: option.email ?? '',
    existingAssignment: null,
    honors: false,
    id: option.studentId,
    name: buildStudentOptionLabel(option),
    programNames: [],
    studentNumber: option.studentNumber ?? `ID ${option.studentId}`,
    totalCredits: 0,
    transferCredits: 0,
  };
}

function getStudentCreditTotal(
  student: RegistrationGroupBuilderStudent,
  options: { includeCurrentCredits: boolean; includeTransferCredits: boolean }
) {
  return (
    student.completedCredits +
    (options.includeCurrentCredits ? student.currentCredits : 0) +
    (options.includeTransferCredits ? student.transferCredits : 0)
  );
}

function compareValues(firstValue: string | number, secondValue: string | number) {
  if (typeof firstValue === 'number' && typeof secondValue === 'number') {
    return firstValue - secondValue;
  }

  return String(firstValue).localeCompare(String(secondValue));
}

function getGeneratedGroupSortValue(
  group: GeneratedRegistrationGroup,
  sortBy: GeneratedGroupSortBy
) {
  switch (sortBy) {
    case 'credits':
      return group.totalCredits;
    case 'name':
      return group.name;
    case 'studentCount':
      return group.students.length;
  }
}

function sortGeneratedGroups(
  groups: GeneratedRegistrationGroup[],
  sortBy: GeneratedGroupSortBy,
  sortDirection: SortDirection
) {
  const multiplier = sortDirection === 'asc' ? 1 : -1;

  return [...groups].sort(
    (firstGroup, secondGroup) =>
      compareValues(
        getGeneratedGroupSortValue(firstGroup, sortBy),
        getGeneratedGroupSortValue(secondGroup, sortBy)
      ) * multiplier
  );
}

function recalculateGeneratedGroupTotals(
  groups: GeneratedRegistrationGroup[],
  options: { includeCurrentCredits: boolean; includeTransferCredits: boolean }
) {
  return groups.map((group) => ({
    ...group,
    totalCredits: group.students.reduce(
      (sum, student) => sum + getStudentCreditTotal(student, options),
      0
    ),
  }));
}

function getGeneratedGroupForStudent(groups: GeneratedRegistrationGroup[], studentId: number) {
  return groups.find((group) => group.students.some((student) => student.id === studentId)) ?? null;
}

function filterGeneratedGroupStudents(
  students: RegistrationGroupBuilderStudent[],
  filters: GeneratedGroupStudentFilters
) {
  return students.filter((student) => {
    if (
      filters.query.trim() &&
      !includesText(
        `${student.name} ${student.studentNumber} ${student.email} ${student.programNames.join(' ')}`,
        filters.query
      )
    ) {
      return false;
    }

    if (filters.program && !student.programNames.includes(filters.program)) {
      return false;
    }

    if (filters.honorsStatus === 'honors' && !student.honors) {
      return false;
    }

    if (filters.honorsStatus === 'not_honors' && student.honors) {
      return false;
    }

    if (filters.athleteStatus === 'athlete' && student.athleticSportNames.length === 0) {
      return false;
    }

    if (filters.athleteStatus === 'not_athlete' && student.athleticSportNames.length > 0) {
      return false;
    }

    if (filters.existingGroupAssignment === 'assigned' && !student.existingAssignment) {
      return false;
    }

    if (filters.existingGroupAssignment === 'unassigned' && student.existingAssignment) {
      return false;
    }

    return true;
  });
}

function getResultsStatus(previewState: PreviewState, groups: GeneratedRegistrationGroup[]): SearchResultsStatus {
  if (previewState.status === 'success') {
    return groups.length > 0 ? 'success' : 'empty';
  }

  return previewState.status;
}

function getMatchingStudentCount(previewState: PreviewState) {
  return previewState.status === 'success' || previewState.status === 'empty'
    ? previewState.response.matchingStudentCount
    : 0;
}

function buildPreviewRequest(values: RegistrationGroupFilters) {
  return {
    academicYearId: parseOptionalId(values.academicYearId),
    termId: parseOptionalId(values.termId),
    studentSearchText: values.studentQuery.trim() || null,
    programSearchText: values.programQuery.trim() || null,
    groupNamePrefix: getGroupNamePrefix(values.groupNamePrefix),
    academicDivisionId: parseOptionalId(values.academicDivisionId) ?? null,
    honorsFilter: values.honorsFilter || null,
    athleteFilter: values.athleteFilter || null,
    athleticSportIds: values.athleticSportIds.map(Number).filter(Number.isFinite),
    existingGroupFilter: values.existingGroupFilter || null,
    minCredits: parseCreditLimit(values.minCredits),
    maxCredits: parseCreditLimit(values.maxCredits),
    includeCurrentCredits: values.includeCurrentCredits,
    includeTransferCredits: values.includeTransferCredits,
    splitCount: values.splitCount,
  };
}

function buildSaveRequest(
  values: RegistrationGroupFilters,
  groups: GeneratedRegistrationGroup[],
  matchedStudentCount: number,
  generationName: string
): RegistrationGroupGenerationCreateRequest | null {
  const academicYearId = parseOptionalId(values.academicYearId);
  const termId = parseOptionalId(values.termId);

  if (!academicYearId || !termId || groups.length === 0) {
    return null;
  }

  return {
    ...buildPreviewRequest(values),
    academicYearId,
    termId,
    matchedStudentCount,
    name: generationName,
    groups: groups.map((group, index) => ({
      temporaryGroupId: group.id,
      name: group.name,
      registrationOpensAt: combineDateTimeParts(
        group.registrationOpensDate,
        group.registrationOpensTime
      ),
      registrationClosesAt: combineDateTimeParts(
        group.registrationClosesDate,
        group.registrationClosesTime
      ),
      sortOrder: index,
      studentIds: group.students.map((student) => student.id),
    })),
  };
}

function mapCodeNameOption(option: { code: string; id: number; name: string }) {
  return {
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

export function RegistrationGroupBuilderPage() {
  const navigate = useNavigate();
  const addStudentCombobox = useCombobox({
    onDropdownOpen: () => addStudentCombobox.updateSelectedOptionIndex('active'),
    onDropdownClose: () => addStudentCombobox.resetSelectedOption(),
  });
  const [referenceOptionsState, setReferenceOptionsState] = useState<ReferenceOptionsState>({
    status: 'idle',
  });
  const [previewState, setPreviewState] = useState<PreviewState>({ status: 'idle' });
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const [generatedGroupRows, setGeneratedGroupRows] = useState<GeneratedRegistrationGroup[]>([]);
  const [generatedGroupSortBy, setGeneratedGroupSortBy] =
    useState<GeneratedGroupSortBy>('name');
  const [generatedGroupSortDirection, setGeneratedGroupSortDirection] =
    useState<SortDirection>('asc');
  const [selectedGeneratedGroupId, setSelectedGeneratedGroupId] = useState<string | null>(null);
  const [addStudentGroupId, setAddStudentGroupId] = useState<string | null>(null);
  const [addStudentQuery, setAddStudentQuery] = useState('');
  const [selectedAddStudent, setSelectedAddStudent] =
    useState<RegistrationGroupStudentOptionResponse | null>(null);
  const [addStudentSearchState, setAddStudentSearchState] = useState<AddStudentSearchState>({
    status: 'idle',
    results: [],
  });
  const [selectedGroupStudent, setSelectedGroupStudent] = useState<SelectedGroupStudent | null>(null);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [generatedGroupStudentFilters, setGeneratedGroupStudentFilters] =
    useState<GeneratedGroupStudentFilters>(initialGeneratedGroupStudentFilters);
  const form = useForm<RegistrationGroupFilters>({
    initialValues: initialFilters,
  });

  useEffect(() => {
    const abortController = new AbortController();
    setReferenceOptionsState({ status: 'loading' });

    getRegistrationGroupReferenceOptions({ signal: abortController.signal })
      .then((response) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsState({ status: 'success', response });

        const firstAcademicYear = response.academicYears[0];
        const firstTerm = firstAcademicYear?.terms[0];
        if (firstAcademicYear && !form.values.academicYearId) {
          form.setFieldValue('academicYearId', String(firstAcademicYear.id));
        }
        if (firstTerm && !form.values.termId) {
          form.setFieldValue('termId', String(firstTerm.id));
        }
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load registration group reference options.'),
        });
      });

    return () => {
      abortController.abort();
    };
  }, []);

  const referenceOptions =
    referenceOptionsState.status === 'success' ? referenceOptionsState.response : null;
  const referenceOptionsLoading =
    referenceOptionsState.status === 'idle' || referenceOptionsState.status === 'loading';
  const referenceOptionsError =
    referenceOptionsState.status === 'error' ? referenceOptionsState.message : null;
  const academicYearOptions =
    referenceOptions?.academicYears.map((academicYear) => ({
      value: String(academicYear.id),
      label: `${academicYear.name} (${academicYear.code})`,
    })) ?? [];
  const termOptions = useMemo(() => {
    const academicYears = referenceOptions?.academicYears ?? [];
    const selectedAcademicYear = academicYears.find(
      (academicYear) => String(academicYear.id) === form.values.academicYearId
    );
    const terms = selectedAcademicYear
      ? selectedAcademicYear.terms
      : academicYears.flatMap((academicYear) => academicYear.terms);

    return terms.map((term) => ({
      value: String(term.id),
      label: `${term.name} (${term.code})`,
    }));
  }, [form.values.academicYearId, referenceOptions]);
  const academicDivisionOptions = referenceOptions?.academicDivisions.map(mapCodeNameOption) ?? [];
  const sportOptions = referenceOptions?.athleticSports.map(mapCodeNameOption) ?? [];
  const selectedAcademicYear =
    referenceOptions?.academicYears.find(
      (academicYear) => String(academicYear.id) === form.values.academicYearId
    ) ?? null;
  const selectedTerm =
    selectedAcademicYear?.terms.find((term) => String(term.id) === form.values.termId) ??
    referenceOptions?.academicYears
      .flatMap((academicYear) => academicYear.terms)
      .find((term) => String(term.id) === form.values.termId) ??
    null;
  const generatedGroupPreview = generatedGroupRows;
  const matchingStudentCount = getMatchingStudentCount(previewState);
  const studentsInGeneratedGroups = generatedGroupPreview.flatMap((group) => group.students);
  const alreadyGroupedMatchingStudents = studentsInGeneratedGroups.filter(
    (student) => student.existingAssignment
  );
  const canSearchStudents = Boolean(form.values.academicYearId && form.values.termId);
  const generatedGroupResultsStatus = getResultsStatus(previewState, generatedGroupPreview);
  const addStudentTargetGroup =
    generatedGroupPreview.find((group) => group.id === addStudentGroupId) ?? null;
  const selectedAddStudentForGroup = useMemo(
    () => (selectedAddStudent ? mapStudentOptionToGeneratedStudent(selectedAddStudent) : null),
    [selectedAddStudent]
  );
  const selectedAddStudentCurrentGroup = selectedAddStudentForGroup
    ? getGeneratedGroupForStudent(generatedGroupPreview, selectedAddStudentForGroup.id)
    : null;
  const selectedStudent =
    selectedGroupStudent
      ? (generatedGroupPreview
          .find((group) => group.id === selectedGroupStudent.groupId)
          ?.students.find((student) => student.id === selectedGroupStudent.studentId) ?? null)
      : null;
  const groupOptions = useMemo(
    () => generatedGroupPreview.map((group) => ({ value: group.id, label: group.name })),
    [generatedGroupPreview]
  );
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
  const sortedGeneratedGroups = useMemo(
    () =>
      sortGeneratedGroups(
        generatedGroupPreview,
        generatedGroupSortBy,
        generatedGroupSortDirection
      ),
    [generatedGroupPreview, generatedGroupSortBy, generatedGroupSortDirection]
  );
  const selectedGeneratedGroup =
    generatedGroupPreview.find((group) => group.id === selectedGeneratedGroupId) ?? null;
  const selectedGroupProgramOptions = useMemo(
    () =>
      uniqueSorted(selectedGeneratedGroup?.students.flatMap((student) => student.programNames) ?? []).map(
        (value) => ({ value, label: value })
      ),
    [selectedGeneratedGroup]
  );
  const filteredSelectedGroupStudents = useMemo(
    () =>
      filterGeneratedGroupStudents(
        selectedGeneratedGroup?.students ?? [],
        generatedGroupStudentFilters
      ),
    [generatedGroupStudentFilters, selectedGeneratedGroup]
  );
  const generatedGroupTable = useReactTable({
    columns: generatedGroupColumns,
    data: sortedGeneratedGroups,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  useEffect(() => {
    if (!addStudentTargetGroup || selectedAddStudent || addStudentQuery.trim().length < 2) {
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
        search: addStudentQuery,
        size: 10,
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
  }, [addStudentQuery, addStudentTargetGroup, selectedAddStudent]);

  function handleToggleGeneratedGroupSort(nextSortBy: GeneratedGroupSortBy) {
    if (nextSortBy === generatedGroupSortBy) {
      setGeneratedGroupSortDirection((currentDirection) =>
        currentDirection === 'asc' ? 'desc' : 'asc'
      );
      return;
    }

    setGeneratedGroupSortBy(nextSortBy);
    setGeneratedGroupSortDirection('asc');
  }

  function handleSelectGeneratedGroup(groupId: string) {
    setSelectedGeneratedGroupId(groupId);
    setGeneratedGroupStudentFilters(initialGeneratedGroupStudentFilters);
  }

  function handleUpdateGeneratedGroupWindow(
    groupId: string,
    field:
      | 'registrationClosesDate'
      | 'registrationClosesTime'
      | 'registrationOpensDate'
      | 'registrationOpensTime',
    value: string
  ) {
    updateGeneratedGroups((currentGroups) =>
      currentGroups.map((group) => (group.id === groupId ? { ...group, [field]: value } : group))
    );
  }

  function updateGeneratedGroups(
    updater: (currentGroups: GeneratedRegistrationGroup[]) => GeneratedRegistrationGroup[]
  ) {
    setGeneratedGroupRows((currentGroups) =>
      recalculateGeneratedGroupTotals(updater(currentGroups), {
        includeCurrentCredits: form.values.includeCurrentCredits,
        includeTransferCredits: form.values.includeTransferCredits,
      })
    );
    setSaveState({ status: 'idle' });
  }

  function handleAddStudentToGroup(student: RegistrationGroupBuilderStudent, groupId: string) {
    updateGeneratedGroups((currentGroups) =>
      currentGroups.map((group) => {
        const studentsWithoutSelected = group.students.filter(
          (groupStudent) => groupStudent.id !== student.id
        );

        if (group.id !== groupId) {
          return { ...group, students: studentsWithoutSelected };
        }

        return {
          ...group,
          students: [...studentsWithoutSelected, student].sort((first, second) =>
            first.name.localeCompare(second.name)
          ),
        };
      })
    );
  }

  function handleOpenStudentModal(student: RegistrationGroupBuilderStudent, groupId: string) {
    setSelectedGroupStudent({ groupId, studentId: student.id });
    setTargetGroupId(groupId);
  }

  function handleMoveSelectedStudent() {
    if (!selectedGroupStudent || !targetGroupId) {
      return;
    }

    const student = generatedGroupRows
      .flatMap((group) => group.students)
      .find((candidate) => candidate.id === selectedGroupStudent.studentId);

    if (!student) {
      return;
    }

    handleAddStudentToGroup(student, targetGroupId);
    setSelectedGroupStudent(null);
    setTargetGroupId('');
  }

  function handleRemoveSelectedStudent() {
    if (!selectedGroupStudent) {
      return;
    }

    updateGeneratedGroups((currentGroups) =>
      currentGroups.map((group) => ({
        ...group,
        students: group.students.filter((student) => student.id !== selectedGroupStudent.studentId),
      }))
    );
    setSelectedGroupStudent(null);
    setTargetGroupId('');
  }

  function handleClear() {
    form.setValues({
      ...initialFilters,
      academicYearId: form.values.academicYearId,
      termId: form.values.termId,
    });
    setPreviewState({ status: 'idle' });
    setSaveState({ status: 'idle' });
    setGeneratedGroupRows([]);
    setSelectedGeneratedGroupId(null);
    setGeneratedGroupStudentFilters(initialGeneratedGroupStudentFilters);
  }

  async function handleSubmit(values: RegistrationGroupFilters) {
    const request = buildPreviewRequest(values);
    const academicYearId = request.academicYearId;
    const termId = request.termId;

    if (!academicYearId || !termId) {
      setPreviewState({ status: 'idle' });
      setSaveState({ status: 'idle' });
      setGeneratedGroupRows([]);
      setSelectedGeneratedGroupId(null);
      setGeneratedGroupStudentFilters(initialGeneratedGroupStudentFilters);
      return;
    }

    setPreviewState({ status: 'loading' });
    setSaveState({ status: 'idle' });
    setGeneratedGroupRows([]);
    setSelectedGeneratedGroupId(null);
    setGeneratedGroupStudentFilters(initialGeneratedGroupStudentFilters);

    try {
      const response = await previewRegistrationGroups({
        request: { ...request, academicYearId, termId },
      });
      const nextGroups = response.groups.map(mapPreviewGroup);

      form.setValues(values);
      setGeneratedGroupRows(nextGroups);
      setPreviewState(
        nextGroups.length > 0
          ? { status: 'success', response }
          : { status: 'empty', response }
      );
    } catch (error) {
      setPreviewState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to preview registration groups.'),
      });
    }
  }

  async function handleSaveGeneratedGroups() {
    const windowValidationMessage = getGroupWindowValidationMessage(generatedGroupPreview);
    if (windowValidationMessage) {
      setSaveState({
        status: 'error',
        message: windowValidationMessage,
      });
      return;
    }

    const generationName = `${selectedTerm?.name ?? 'Registration'} Groups`;
    const request = buildSaveRequest(
      form.values,
      generatedGroupPreview,
      matchingStudentCount,
      generationName
    );

    if (!request) {
      setSaveState({
        status: 'error',
        message: 'Search students and generate at least one group before saving.',
      });
      return;
    }

    setSaveState({ status: 'loading' });

    try {
      const response = await saveGeneratedRegistrationGroups({ request });
      const queryParams = new URLSearchParams({
        academicYearId: String(response.academicYearId),
        termId: String(response.termId),
        status: 'DRAFT',
      });
      navigate(`/registration/groups?${queryParams.toString()}`);
    } catch (error) {
      setSaveState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to save generated registration groups.'),
      });
    }
  }

  return (
    <Container size="xl" py="lg">
      <Modal
        centered
        opened={Boolean(addStudentTargetGroup)}
        size="xl"
        title={`Add Students${addStudentTargetGroup ? ` to ${addStudentTargetGroup.name}` : ''}`}
        onClose={() => {
          setAddStudentGroupId(null);
          setAddStudentQuery('');
          setSelectedAddStudent(null);
          setAddStudentSearchState({ status: 'idle', results: [] });
        }}
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

          {selectedAddStudentForGroup ? (
            <Paper p="md" withBorder radius="md">
              <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                <Stack gap={2}>
                  <Text fw={700}>{selectedAddStudentForGroup.name}</Text>
                  <Text size="sm" c="dimmed">
                    {selectedAddStudentForGroup.studentNumber}
                    {selectedAddStudentForGroup.email ? ` · ${selectedAddStudentForGroup.email}` : ''}
                  </Text>
                  <Group gap="xs">
                    <Badge variant="light">{selectedAddStudentForGroup.classStandingName}</Badge>
                    {selectedAddStudentCurrentGroup ? (
                      <Badge color="yellow" variant="light">
                        Currently in {selectedAddStudentCurrentGroup.name}
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light">
                        Not in generated group
                      </Badge>
                    )}
                  </Group>
                </Stack>
                <Button
                  disabled={selectedAddStudentCurrentGroup?.id === addStudentTargetGroup?.id}
                  onClick={() => {
                    if (selectedAddStudentForGroup && addStudentTargetGroup) {
                      handleAddStudentToGroup(selectedAddStudentForGroup, addStudentTargetGroup.id);
                      setSelectedAddStudent(null);
                      setAddStudentQuery('');
                      setAddStudentSearchState({ status: 'idle', results: [] });
                    }
                  }}
                >
                  {selectedAddStudentCurrentGroup ? 'Move to Group' : 'Add to Group'}
                </Button>
              </Group>
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
        opened={Boolean(selectedStudent)}
        size="lg"
        title="Update Student Group"
        onClose={() => {
          setSelectedGroupStudent(null);
          setTargetGroupId('');
        }}
      >
        {selectedStudent ? (
          <Stack gap="md">
            <Stack gap={2}>
              <Text fw={700}>{selectedStudent.name}</Text>
              <Text size="sm" c="dimmed">
                {selectedStudent.studentNumber} · {selectedStudent.email || 'No email'}
              </Text>
              <Text size="sm" c="dimmed">
                {selectedStudent.programNames.length > 0
                  ? selectedStudent.programNames.join(', ')
                  : 'No programs found'}
              </Text>
            </Stack>

            <Select
              clearable={false}
              data={groupOptions}
              label="Generated Group"
              value={targetGroupId}
              onChange={(value) => {
                setTargetGroupId(value ?? '');
              }}
            />

            <Group justify="space-between">
              <Button color="red" variant="light" onClick={handleRemoveSelectedStudent}>
                Remove from Group
              </Button>
              <Group>
                <Button
                  variant="default"
                  onClick={() => {
                    setSelectedGroupStudent(null);
                    setTargetGroupId('');
                  }}
                >
                  Cancel
                </Button>
                <Button disabled={!targetGroupId} onClick={handleMoveSelectedStudent}>
                  Save Group
                </Button>
              </Group>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      <Stack gap="lg">
        <Paper p="lg" withBorder radius="md">
          <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
            <Stack gap="xs">
              <Text className="portal-ui-eyebrow-text">Admin Workflow</Text>
              <Title order={1}>Registration Group Builder</Title>
              <Text size="sm" c="dimmed">
                Search students to get the matching count, then split that result into stable
                registration groups.
              </Text>
            </Stack>
          </Group>
        </Paper>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            <Paper p="lg" withBorder radius="md">
              <Stack gap="lg">
                {referenceOptionsError ? (
                  <Alert color="red" title="Unable to load registration filters">
                    {referenceOptionsError}
                  </Alert>
                ) : null}

                <SearchFormSection legend="Registration Period">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Academic Year"
                      placeholder="Select academic year"
                      data={academicYearOptions}
                      disabled={referenceOptionsLoading}
                      required
                      {...form.getInputProps('academicYearId')}
                      onChange={(value) => {
                        const selectedYear = referenceOptions?.academicYears.find(
                          (academicYear) => String(academicYear.id) === value
                        );
                        form.setFieldValue('academicYearId', value ?? '');
                        form.setFieldValue(
                          'termId',
                          selectedYear?.terms[0] ? String(selectedYear.terms[0].id) : ''
                        );
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Term"
                      placeholder="Select term"
                      data={termOptions}
                      disabled={!form.values.academicYearId || referenceOptionsLoading}
                      required
                      {...form.getInputProps('termId')}
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormSection legend="Student Filters">
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Student"
                      placeholder="Name, email, or ID"
                      {...form.getInputProps('studentQuery')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label="Program"
                      placeholder="Program name"
                      {...form.getInputProps('programQuery')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      label="Existing Group"
                      clearable={false}
                      data={[
                        { value: 'EXCLUDE_ALREADY_GROUPED', label: 'Exclude students already in a group' },
                        { value: 'ANY', label: 'Include all students' },
                        { value: 'ONLY_ALREADY_GROUPED', label: 'Only students already in a group' },
                      ]}
                      {...form.getInputProps('existingGroupFilter')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      label="Academic Division"
                      placeholder="All divisions"
                      clearable
                      data={academicDivisionOptions}
                      disabled={referenceOptionsLoading}
                      {...form.getInputProps('academicDivisionId')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      label="Honors"
                      placeholder="Any honors status"
                      clearable
                      data={[
                        { value: 'HONORS', label: 'In honors' },
                        { value: 'NOT_HONORS', label: 'Not in honors' },
                      ]}
                      {...form.getInputProps('honorsFilter')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Select
                      label="Athlete"
                      placeholder="Any athlete status"
                      clearable
                      data={[
                        { value: 'ATHLETE', label: 'Athlete' },
                        { value: 'NOT_ATHLETE', label: 'Not an athlete' },
                      ]}
                      {...form.getInputProps('athleteFilter')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <MultiSelect
                      label="Sports"
                      placeholder="Any sport"
                      data={sportOptions}
                      disabled={referenceOptionsLoading}
                      {...form.getInputProps('athleticSportIds')}
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormSection legend="Credit Hours">
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <NumberInput
                      label="Minimum credits"
                      min={0}
                      value={form.values.minCredits === '' ? undefined : Number(form.values.minCredits)}
                      onChange={(value) => {
                        form.setFieldValue('minCredits', value === '' ? '' : String(value ?? ''));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <NumberInput
                      label="Maximum credits"
                      min={0}
                      value={form.values.maxCredits === '' ? undefined : Number(form.values.maxCredits)}
                      onChange={(value) => {
                        form.setFieldValue('maxCredits', value === '' ? '' : String(value ?? ''));
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Switch
                      mt="xl"
                      label="Include current registrations"
                      {...form.getInputProps('includeCurrentCredits', { type: 'checkbox' })}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Switch
                      mt="xl"
                      label="Include transfer credits"
                      {...form.getInputProps('includeTransferCredits', { type: 'checkbox' })}
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormSection legend="Split Options">
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <NumberInput
                      label="Number of groups"
                      min={1}
                      max={10}
                      value={form.values.splitCount}
                      onChange={(value) => {
                        form.setFieldValue('splitCount', typeof value === 'number' ? value : 1);
                        setSaveState({ status: 'idle' });
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 9 }}>
                    <TextInput
                      label="Group Name Prefix"
                      value={form.values.groupNamePrefix}
                      onChange={(event) => {
                        form.setFieldValue('groupNamePrefix', event.currentTarget.value);
                        setSaveState({ status: 'idle' });
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="sm" c="dimmed">
                      Generated groups will be named {getGroupNamePrefix(form.values.groupNamePrefix)} 1,{' '}
                      {getGroupNamePrefix(form.values.groupNamePrefix)} 2, and so on after searching.
                    </Text>
                  </Grid.Col>
                </SearchFormSection>

                <Group justify="flex-end">
                  <Button type="button" variant="default" onClick={handleClear}>
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSearchStudents || referenceOptionsLoading}
                    loading={previewState.status === 'loading'}
                  >
                    Search Students
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        </form>

        <Paper p="lg" withBorder radius="md">
          <Stack gap="xs">
            <Text fw={700}>Matching Student Count</Text>
            {previewState.status === 'idle' ? (
              <Text size="sm" c="dimmed">
                Choose an academic year and term, then search students to see how many match the
                selected criteria.
              </Text>
            ) : null}
            {previewState.status === 'loading' ? (
              <Text size="sm" c="dimmed">
                Searching students and splitting registration groups...
              </Text>
            ) : null}
            {previewState.status === 'error' ? (
              <Alert color="red" title="Unable to preview registration groups">
                {previewState.message}
              </Alert>
            ) : null}
            {previewState.status === 'empty' ? (
              <Text size="sm" c="dimmed">
                No students match the selected criteria.
              </Text>
            ) : null}
            {previewState.status === 'success' ? (
              <Stack gap="xs">
                <Group align="baseline" gap="sm">
                  <Text fw={800} fz="2rem" lh={1}>
                    {matchingStudentCount}
                  </Text>
                  <Text c="dimmed">
                    students match this group definition for {selectedTerm?.name}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Badge color={alreadyGroupedMatchingStudents.length > 0 ? 'yellow' : 'green'} variant="light">
                    {alreadyGroupedMatchingStudents.length} already in another group
                  </Badge>
                </Group>
              </Stack>
            ) : null}
          </Stack>
        </Paper>

        <SearchResultsPanel
          status={generatedGroupResultsStatus}
          summary={
            previewState.status === 'idle'
              ? 'No generated groups yet. Search students to preview a split.'
              : `${generatedGroupPreview.length} groups from ${matchingStudentCount} matching students.`
          }
          table={generatedGroupTable}
          sortBy={generatedGroupSortBy}
          sortDirection={generatedGroupSortDirection}
          onToggleSort={handleToggleGeneratedGroupSort}
          withBorder
          notice={{
            idleTitle: 'No generated groups yet',
            idleMessage: 'Search students and set split options to generate groups.',
            loadingMessage: 'Generating registration groups...',
            errorTitle: 'Unable to generate groups',
            errorMessage: previewState.status === 'error' ? previewState.message : null,
            emptyTitle: 'No generated groups',
            emptyMessage: 'Adjust the criteria and preview again.',
          }}
          getRowProps={(row) => ({
            role: 'button',
            tabIndex: 0,
            'aria-selected': selectedGeneratedGroupId === row.original.id,
            onClick: () => {
              handleSelectGeneratedGroup(row.original.id);
            },
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleSelectGeneratedGroup(row.original.id);
              }
            },
          })}
          title="Generated Groups"
        />

        {selectedGeneratedGroup ? (
          <Paper p="lg" withBorder radius="md">
            <Stack gap="md">
              <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
                <Stack gap={2}>
                  <Text fw={700}>{selectedGeneratedGroup.name}</Text>
                  <Text size="sm" c="dimmed">
                    {selectedGeneratedGroup.students.length} students ·{' '}
                    {selectedGeneratedGroup.totalCredits} total credits ·{' '}
                    {selectedGeneratedGroup.academicYearName} · {selectedGeneratedGroup.termName}
                  </Text>
                </Stack>
                <Button
                  size="sm"
                  onClick={() => {
                    setAddStudentGroupId(selectedGeneratedGroup.id);
                    setAddStudentQuery('');
                    setSelectedAddStudent(null);
                    setAddStudentSearchState({ status: 'idle', results: [] });
                  }}
                >
                  Add Students
                </Button>
              </Group>

              <Divider />

              <Grid align="flex-end">
                <Grid.Col span={12}>
                  <Text fw={700}>Registration Window</Text>
                  <Text size="sm" c="dimmed">
                    Set when this specific group can register.
                  </Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <DateInput
                    clearable
                    label="Opens Date"
                    placeholder="YYYY-MM-DD"
                    value={parseDateInputValue(selectedGeneratedGroup.registrationOpensDate)}
                    valueFormat="YYYY-MM-DD"
                    onChange={(value) => {
                      handleUpdateGeneratedGroupWindow(
                        selectedGeneratedGroup.id,
                        'registrationOpensDate',
                        normalizeDateInputValue(value)
                      );
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Opens Time"
                    placeholder="8:00 AM"
                    value={formatTimeInputValue(selectedGeneratedGroup.registrationOpensTime)}
                    onChange={(event) => {
                      handleUpdateGeneratedGroupWindow(
                        selectedGeneratedGroup.id,
                        'registrationOpensTime',
                        event.currentTarget.value
                      );
                    }}
                    onBlur={(event) => {
                      handleUpdateGeneratedGroupWindow(
                        selectedGeneratedGroup.id,
                        'registrationOpensTime',
                        normalizeGroupWindowTime(event.currentTarget.value)
                      );
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <DateInput
                    clearable
                    label="Closes Date"
                    placeholder="YYYY-MM-DD"
                    value={parseDateInputValue(selectedGeneratedGroup.registrationClosesDate)}
                    valueFormat="YYYY-MM-DD"
                    onChange={(value) => {
                      handleUpdateGeneratedGroupWindow(
                        selectedGeneratedGroup.id,
                        'registrationClosesDate',
                        normalizeDateInputValue(value)
                      );
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Closes Time"
                    placeholder="5:00 PM"
                    value={formatTimeInputValue(selectedGeneratedGroup.registrationClosesTime)}
                    onChange={(event) => {
                      handleUpdateGeneratedGroupWindow(
                        selectedGeneratedGroup.id,
                        'registrationClosesTime',
                        event.currentTarget.value
                      );
                    }}
                    onBlur={(event) => {
                      handleUpdateGeneratedGroupWindow(
                        selectedGeneratedGroup.id,
                        'registrationClosesTime',
                        normalizeGroupWindowTime(event.currentTarget.value)
                      );
                    }}
                  />
                </Grid.Col>
              </Grid>

              <Divider />

              <Grid align="flex-end">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Search students in this group"
                    placeholder="Name, email, ID, or program"
                    value={generatedGroupStudentFilters.query}
                    onChange={(event) => {
                      setGeneratedGroupStudentFilters((currentFilters) => ({
                        ...currentFilters,
                        query: event.currentTarget.value,
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Program"
                    placeholder="All programs"
                    clearable
                    data={selectedGroupProgramOptions}
                    value={generatedGroupStudentFilters.program}
                    onChange={(value) => {
                      setGeneratedGroupStudentFilters((currentFilters) => ({
                        ...currentFilters,
                        program: value ?? '',
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Existing Group"
                    placeholder="All students"
                    clearable
                    data={[
                      { value: 'assigned', label: 'Already in a group' },
                      { value: 'unassigned', label: 'Not in a group' },
                    ]}
                    value={generatedGroupStudentFilters.existingGroupAssignment}
                    onChange={(value) => {
                      setGeneratedGroupStudentFilters((currentFilters) => ({
                        ...currentFilters,
                        existingGroupAssignment: value ?? '',
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Honors"
                    placeholder="Any honors status"
                    clearable
                    data={[
                      { value: 'honors', label: 'In honors' },
                      { value: 'not_honors', label: 'Not in honors' },
                    ]}
                    value={generatedGroupStudentFilters.honorsStatus}
                    onChange={(value) => {
                      setGeneratedGroupStudentFilters((currentFilters) => ({
                        ...currentFilters,
                        honorsStatus: value ?? '',
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Athlete"
                    placeholder="Any athlete status"
                    clearable
                    data={[
                      { value: 'athlete', label: 'Athlete' },
                      { value: 'not_athlete', label: 'Not an athlete' },
                    ]}
                    value={generatedGroupStudentFilters.athleteStatus}
                    onChange={(value) => {
                      setGeneratedGroupStudentFilters((currentFilters) => ({
                        ...currentFilters,
                        athleteStatus: value ?? '',
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Group justify="space-between" align="center" gap="sm">
                    <Text size="sm" c="dimmed">
                      Showing {filteredSelectedGroupStudents.length} of{' '}
                      {selectedGeneratedGroup.students.length} students
                    </Text>
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        setGeneratedGroupStudentFilters(initialGeneratedGroupStudentFilters);
                      }}
                    >
                      Clear student filters
                    </Button>
                  </Group>
                </Grid.Col>
              </Grid>

              <Table.ScrollContainer minWidth={900}>
                <Table horizontalSpacing="md" verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Student</Table.Th>
                      <Table.Th>Class</Table.Th>
                      <Table.Th>Programs</Table.Th>
                      <Table.Th>Credits</Table.Th>
                      <Table.Th>Existing Group</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredSelectedGroupStudents.length > 0 ? (
                      filteredSelectedGroupStudents.map((student) => (
                        <Table.Tr
                          key={student.id}
                          role="button"
                          tabIndex={0}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            handleOpenStudentModal(student, selectedGeneratedGroup.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleOpenStudentModal(student, selectedGeneratedGroup.id);
                            }
                          }}
                        >
                          <Table.Td>
                            <Stack gap={2}>
                              <Text fw={700}>{student.name}</Text>
                              <Text size="sm" c="dimmed">
                                {student.studentNumber}
                                {student.email ? ` · ${student.email}` : ''}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text>{student.classStandingName}</Text>
                              <Text size="sm" c="dimmed">
                                {student.academicDivisionName}
                              </Text>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            {student.programNames.length > 0 ? student.programNames.join(', ') : '—'}
                          </Table.Td>
                          <Table.Td>
                            {getStudentCreditTotal(student, {
                              includeCurrentCredits: form.values.includeCurrentCredits,
                              includeTransferCredits: form.values.includeTransferCredits,
                            })}
                          </Table.Td>
                          <Table.Td>
                            {student.existingAssignment ? (
                              <Stack gap={4}>
                                <Text fw={600}>{student.existingAssignment.groupName}</Text>
                                <Badge
                                  color={getRegistrationGroupStatusColor(
                                    student.existingAssignment.statusCode
                                  )}
                                  variant="light"
                                >
                                  {getRegistrationGroupStatusLabel(
                                    student.existingAssignment.statusCode,
                                    student.existingAssignment.statusName
                                  )}
                                </Badge>
                              </Stack>
                            ) : (
                              <Text c="dimmed">Not assigned</Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))
                    ) : (
                      <Table.Tr>
                        <Table.Td colSpan={5}>
                          <Text c="dimmed">No students in this group match those filters.</Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          </Paper>
        ) : null}

        {saveState.status === 'success' ? (
          <Alert color="green" title="Registration groups saved">
            {saveState.message}
          </Alert>
        ) : null}
        {saveState.status === 'error' ? (
          <Alert color="red" title="Unable to save registration groups">
            {saveState.message}
          </Alert>
        ) : null}

        <Group justify="flex-end">
          <Button
            leftSection={<IconUsersGroup size={18} />}
            disabled={generatedGroupPreview.length === 0 || previewState.status === 'loading'}
            loading={saveState.status === 'loading'}
            onClick={handleSaveGeneratedGroups}
          >
            Save Generated Groups
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
