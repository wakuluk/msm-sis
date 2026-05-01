import { useEffect, useState } from 'react';
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Container,
  Grid,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import { SearchFormActions } from '@/components/search/SearchFormActions';
import { SearchFormSection } from '@/components/search/SearchFormSection';
import { SearchPaginationFooter } from '@/components/search/SearchPaginationFooter';
import { SearchResultsHeader } from '@/components/search/SearchResultsHeader';
import { SearchResultsStateNotice } from '@/components/search/SearchResultsStateNotice';
import { SearchResultsTable } from '@/components/search/SearchResultsTable';
import type { StringOption } from '@/components/search/SearchQueryControls';
import {
  getCoursePickerReferenceOptions,
  getProgramReferenceOptions,
} from '@/services/reference-service';
import { createRequirement, searchRequirements } from '@/services/requirement-service';
import type {
  AcademicDepartmentReferenceOption,
  CourseReferenceOption,
} from '@/services/schemas/reference-schemas';
import type {
  CreateRequirementRequest,
  RequirementSearchResponse,
  RequirementSearchResultResponse,
} from '@/services/schemas/program-schemas';

type RequirementSearchFilters = {
  code: string;
  name: string;
  requirementType: string;
};

type RequirementCreateFormValues = {
  code: string;
  name: string;
  requirementType: string;
  description: string;
  minimumCredits: number | string;
  minimumCourses: number | string;
  courseMatchMode: string;
  minimumGrade: string;
};

type SpecificCourseDraft = {
  id: number;
  courseId: number | string;
  subjectCode: string;
  courseNumber: string;
  courseCode: string;
  courseTitle: string;
  minimumGrade: string;
  required: boolean;
};

type DepartmentCourseRuleDraft = {
  id: number;
  departmentId: number | string;
  departmentCode: string;
  minimumCourseNumber: number | string;
  maximumCourseNumber: number | string;
  minimumCredits: number | string;
  minimumCourses: number | string;
  minimumGrade: string;
};

type RequirementSearchResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: RequirementSearchResponse }
  | { status: 'success'; response: RequirementSearchResponse };

type DepartmentOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; departments: AcademicDepartmentReferenceOption[] }
  | { status: 'error'; message: string };

type CourseOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; courses: CourseReferenceOption[] }
  | { status: 'error'; message: string };

type CreateRequirementState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type RequirementSearchSize = '25' | '50' | '100';
type RequirementResultsView = 'standard' | 'system';

const initialRequirementSearchFilters: RequirementSearchFilters = {
  code: '',
  name: '',
  requirementType: '',
};
const initialRequirementCreateFormValues: RequirementCreateFormValues = {
  code: '',
  name: '',
  requirementType: 'TOTAL_ELECTIVE_CREDITS',
  description: '',
  minimumCredits: '',
  minimumCourses: '',
  courseMatchMode: 'ALL',
  minimumGrade: '',
};

const emptyRequirementSearchResults: RequirementSearchResultResponse[] = [];
const requirementTypeOptions = [
  { value: 'TOTAL_ELECTIVE_CREDITS', label: 'Elective credits' },
  { value: 'SPECIFIC_COURSES', label: 'Specific courses' },
  { value: 'DEPARTMENT_LEVEL_COURSES', label: 'Department courses' },
  { value: 'MANUAL', label: 'Manual review' },
] satisfies ReadonlyArray<StringOption<string>>;
const courseMatchModeOptions = [
  { value: 'ALL', label: 'All listed courses' },
  { value: 'ANY', label: 'Choose from listed courses' },
] satisfies ReadonlyArray<StringOption<string>>;
const resultsViewOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'system', label: 'System' },
] satisfies ReadonlyArray<{ label: string; value: RequirementResultsView }>;
const sizeOptions = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
] satisfies ReadonlyArray<StringOption<RequirementSearchSize>>;

function getErrorMessage(error: unknown, fallbackMessage = 'Failed to search requirements.'): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function trimToNull(value: string): string | null {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function numberToNull(value: number | string): number | null {
  if (value === '') {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function integerToNull(value: number | string): number | null {
  const numericValue = numberToNull(value);

  return numericValue === null ? null : Math.trunc(numericValue);
}

function formatRequirementType(type: string): string {
  switch (type) {
    case 'TOTAL_ELECTIVE_CREDITS':
      return 'Elective credits';
    case 'SPECIFIC_COURSES':
      return 'Specific courses';
    case 'DEPARTMENT_LEVEL_COURSES':
      return 'Department courses';
    case 'MANUAL':
      return 'Manual review';
    default:
      return type;
  }
}

function formatRequirementTarget(requirement: RequirementSearchResultResponse): string {
  const targets = [];

  if (requirement.minimumCredits !== null) {
    targets.push(`${requirement.minimumCredits} credits`);
  }

  if (requirement.minimumCourses !== null) {
    targets.push(`${requirement.minimumCourses} courses`);
  }

  if (requirement.courseMatchMode === 'ALL' && requirement.requirementCourseCount > 0) {
    targets.push('All listed courses');
  }

  if (requirement.courseMatchMode === 'ANY' && requirement.requirementCourseCount > 0) {
    targets.push(`Choose ${requirement.minimumCourses ?? 'from'} listed courses`);
  }

  if (requirement.minimumGrade !== null) {
    targets.push(`Minimum grade ${requirement.minimumGrade}`);
  }

  return targets.length === 0 ? '—' : targets.join(', ');
}

function getResultsSummary(state: RequirementSearchResultsState): string {
  if (state.status === 'loading') {
    return 'Loading requirement search results...';
  }

  if (state.status === 'error') {
    return 'Requirement search failed.';
  }

  if (state.status === 'success' || state.status === 'empty') {
    if (state.response.totalElements === 0 || state.response.results.length === 0) {
      return 'No requirements matched the current search criteria.';
    }

    const start = state.response.page * state.response.size + 1;
    const end = state.response.page * state.response.size + state.response.results.length;

    return `Showing ${start}-${end} of ${state.response.totalElements} requirements`;
  }

  return 'Requirement search is ready.';
}

const requirementSearchColumns: ColumnDef<RequirementSearchResultResponse>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 170,
    cell: ({ row }) => (
      <Link to={`/academics/requirements/${row.original.requirementId}`}>
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Requirement',
    size: 300,
  },
  {
    accessorKey: 'requirementType',
    header: 'Type',
    size: 180,
    cell: ({ row }) => (
      <Badge variant="light">
        {formatRequirementType(row.original.requirementType)}
      </Badge>
    ),
  },
  {
    id: 'target',
    header: 'Target',
    size: 260,
    cell: ({ row }) => formatRequirementTarget(row.original),
  },
  {
    accessorKey: 'requirementCourseCount',
    header: 'Courses',
    size: 100,
  },
  {
    accessorKey: 'requirementCourseRuleCount',
    header: 'Rules',
    size: 100,
  },
  {
    accessorKey: 'minimumGrade',
    header: 'Minimum Grade',
    size: 140,
    cell: ({ row }) => row.original.minimumGrade ?? '—',
  },
  {
    accessorKey: 'requirementId',
    header: 'ID',
    size: 90,
  },
];

function CreateRequirementModal({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated: (requirement: RequirementSearchResultResponse) => void;
}) {
  const form = useForm<RequirementCreateFormValues>({
    initialValues: initialRequirementCreateFormValues,
  });
  const [specificCourses, setSpecificCourses] = useState<SpecificCourseDraft[]>([]);
  const [departmentCourseRules, setDepartmentCourseRules] = useState<DepartmentCourseRuleDraft[]>(
    []
  );
  const [departmentOptionsState, setDepartmentOptionsState] = useState<DepartmentOptionsState>({
    status: 'idle',
  });
  const [courseOptionsState, setCourseOptionsState] = useState<CourseOptionsState>({
    status: 'idle',
  });
  const [createState, setCreateState] = useState<CreateRequirementState>({ status: 'idle' });
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isSaving = createState.status === 'saving';

  useEffect(() => {
    if (opened) {
      form.setValues(initialRequirementCreateFormValues);
      setSpecificCourses([]);
      setDepartmentCourseRules([]);
      setCreateState({ status: 'idle' });
      setValidationMessage(null);
      setDepartmentOptionsState({ status: 'loading' });
      setCourseOptionsState({ status: 'loading' });

      getProgramReferenceOptions()
        .then((response) => {
          setDepartmentOptionsState({
            status: 'success',
            departments: response.departments,
          });
        })
        .catch((error) => {
          setDepartmentOptionsState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load department options.'),
          });
        });

      getCoursePickerReferenceOptions()
        .then((response) => {
          setCourseOptionsState({
            status: 'success',
            courses: response.courses,
          });
        })
        .catch((error) => {
          setCourseOptionsState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load course options.'),
          });
        });
    }
  }, [opened]);

  const selectedRequirementType = form.values.requirementType;
  const departmentSelectOptions =
    departmentOptionsState.status === 'success'
      ? departmentOptionsState.departments.map((department) => ({
          value: String(department.id),
          label: `${department.name} (${department.code})`,
        }))
      : [];
  const departmentOptionsLoading =
    departmentOptionsState.status === 'idle' || departmentOptionsState.status === 'loading';
  const departmentOptionsError =
    departmentOptionsState.status === 'error' ? departmentOptionsState.message : null;
  const courseSelectOptions =
    courseOptionsState.status === 'success'
      ? courseOptionsState.courses.map((course) => ({
          value: String(course.courseId),
          label: course.courseCode,
        }))
      : [];
  const courseOptionsLoading =
    courseOptionsState.status === 'idle' || courseOptionsState.status === 'loading';
  const courseOptionsError =
    courseOptionsState.status === 'error' ? courseOptionsState.message : null;

  function addSpecificCourse() {
    setSpecificCourses((current) => [
      ...current,
      {
        id: Date.now(),
        courseId: '',
        subjectCode: '',
        courseNumber: '',
        courseCode: '',
        courseTitle: '',
        minimumGrade: form.values.minimumGrade,
        required: true,
      },
    ]);
  }

  function updateSpecificCourse(
    id: number,
    patch: Partial<Omit<SpecificCourseDraft, 'id'>>
  ) {
    setSpecificCourses((current) =>
      current.map((course) => (course.id === id ? { ...course, ...patch } : course))
    );
  }

  function removeSpecificCourse(id: number) {
    setSpecificCourses((current) => current.filter((course) => course.id !== id));
  }

  function handleSpecificCourseChange(rowId: number, courseId: string | null) {
    if (!courseId) {
      updateSpecificCourse(rowId, {
        courseId: '',
        subjectCode: '',
        courseNumber: '',
        courseCode: '',
        courseTitle: '',
      });
      return;
    }

    const selectedCourse =
      courseOptionsState.status === 'success'
        ? courseOptionsState.courses.find((course) => String(course.courseId) === courseId)
        : null;

    updateSpecificCourse(rowId, {
      courseId: Number(courseId),
      subjectCode: selectedCourse?.subjectCode ?? '',
      courseNumber: selectedCourse?.courseNumber ?? '',
      courseCode: selectedCourse?.courseCode ?? '',
      courseTitle: selectedCourse?.currentVersionTitle ?? '',
    });
  }

  function addDepartmentCourseRule() {
    setDepartmentCourseRules((current) => [
      ...current,
      {
        id: Date.now(),
        departmentId: '',
        departmentCode: '',
        minimumCourseNumber: '',
        maximumCourseNumber: '',
        minimumCredits: '',
        minimumCourses: '',
        minimumGrade: form.values.minimumGrade,
      },
    ]);
  }

  function updateDepartmentCourseRule(
    id: number,
    patch: Partial<Omit<DepartmentCourseRuleDraft, 'id'>>
  ) {
    setDepartmentCourseRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule))
    );
  }

  function removeDepartmentCourseRule(id: number) {
    setDepartmentCourseRules((current) => current.filter((rule) => rule.id !== id));
  }

  function handleDepartmentRuleDepartmentChange(ruleId: number, departmentId: string | null) {
    if (!departmentId) {
      updateDepartmentCourseRule(ruleId, {
        departmentId: '',
        departmentCode: '',
      });
      return;
    }

    const selectedDepartment =
      departmentOptionsState.status === 'success'
        ? departmentOptionsState.departments.find(
            (department) => String(department.id) === departmentId
          )
        : null;

    updateDepartmentCourseRule(ruleId, {
      departmentId: Number(departmentId),
      departmentCode: selectedDepartment?.code ?? '',
    });
  }

  function buildCreateRequirementRequest(): CreateRequirementRequest | null {
    const code = form.values.code.trim();
    const name = form.values.name.trim();
    const requirementType = form.values.requirementType.trim();

    if (!code) {
      setValidationMessage('Code is required.');
      return null;
    }

    if (!name) {
      setValidationMessage('Name is required.');
      return null;
    }

    const request: CreateRequirementRequest = {
      code,
      name,
      requirementType,
      description: trimToNull(form.values.description),
      minimumCredits: null,
      minimumCourses: null,
      courseMatchMode: null,
      minimumGrade: trimToNull(form.values.minimumGrade),
      requirementCourses: [],
      requirementCourseRules: [],
    };

    if (requirementType === 'TOTAL_ELECTIVE_CREDITS') {
      request.minimumCredits = numberToNull(form.values.minimumCredits);

      if (request.minimumCredits === null) {
        setValidationMessage('Minimum credits is required for elective credit requirements.');
        return null;
      }
    }

    if (requirementType === 'SPECIFIC_COURSES') {
      request.courseMatchMode = form.values.courseMatchMode;
      request.minimumCourses = integerToNull(form.values.minimumCourses);
      request.requirementCourses = specificCourses
        .map((course) => ({
          courseId: Number(course.courseId),
          minimumGrade: trimToNull(course.minimumGrade),
        }))
        .filter((course) => Number.isInteger(course.courseId) && course.courseId > 0);

      if (request.requirementCourses.length === 0) {
        setValidationMessage('Add at least one course for specific course requirements.');
        return null;
      }

      if (request.courseMatchMode === 'ANY' && request.minimumCourses === null) {
        setValidationMessage('Minimum courses is required when choosing from a course list.');
        return null;
      }
    }

    if (requirementType === 'DEPARTMENT_LEVEL_COURSES') {
      request.requirementCourseRules = departmentCourseRules
        .map((rule) => ({
          departmentId: Number(rule.departmentId),
          minimumCourseNumber: integerToNull(rule.minimumCourseNumber),
          maximumCourseNumber: integerToNull(rule.maximumCourseNumber),
          minimumCredits: numberToNull(rule.minimumCredits),
          minimumCourses: integerToNull(rule.minimumCourses),
          minimumGrade: trimToNull(rule.minimumGrade),
        }))
        .filter((rule) => Number.isInteger(rule.departmentId) && rule.departmentId > 0);

      if (departmentCourseRules.length !== request.requirementCourseRules.length) {
        setValidationMessage('Select a department for each department rule.');
        return null;
      }

      if (request.requirementCourseRules.length === 0) {
        setValidationMessage('Add at least one department rule.');
        return null;
      }

      const ruleWithoutTarget = request.requirementCourseRules.find(
        (rule) => rule.minimumCredits === null && rule.minimumCourses === null
      );

      if (ruleWithoutTarget) {
        setValidationMessage('Each department rule needs minimum credits or minimum courses.');
        return null;
      }
    }

    setValidationMessage(null);
    return request;
  }

  async function handleCreateRequirement() {
    if (isSaving) {
      return;
    }

    const request = buildCreateRequirementRequest();

    if (request === null) {
      return;
    }

    try {
      setCreateState({ status: 'saving' });
      const createdRequirement = await createRequirement({ request });
      setCreateState({ status: 'idle' });
      onCreated(createdRequirement);
    } catch (error) {
      setCreateState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create requirement.'),
      });
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create Requirement"
      size="80rem"
      centered
      closeOnClickOutside={!isSaving}
      closeOnEscape={!isSaving}
    >
      <Stack gap="lg">
        {validationMessage ? (
          <Alert color="red" title="Invalid requirement">
            {validationMessage}
          </Alert>
        ) : null}

        {createState.status === 'error' ? (
          <Alert color="red" title="Unable to create requirement">
            {createState.message}
          </Alert>
        ) : null}

        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput label="Code" placeholder="REQ-HIST-CORE-12" {...form.getInputProps('code')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <TextInput label="Name" placeholder="Requirement name" {...form.getInputProps('name')} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Type"
              data={requirementTypeOptions}
              value={form.values.requirementType}
              onChange={(value) => {
                form.setFieldValue('requirementType', value ?? 'TOTAL_ELECTIVE_CREDITS');
              }}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Minimum Grade"
              placeholder="Optional"
              {...form.getInputProps('minimumGrade')}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Description"
              placeholder="Describe the requirement"
              minRows={3}
              {...form.getInputProps('description')}
            />
          </Grid.Col>

          {selectedRequirementType === 'TOTAL_ELECTIVE_CREDITS' ? (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Minimum Credits"
                min={0}
                value={form.values.minimumCredits}
                onChange={(value) => {
                  form.setFieldValue('minimumCredits', value);
                }}
              />
            </Grid.Col>
          ) : null}

          {selectedRequirementType === 'SPECIFIC_COURSES' ? (
            <>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="Course Match Mode"
                  data={courseMatchModeOptions}
                  value={form.values.courseMatchMode}
                  onChange={(value) => {
                    form.setFieldValue('courseMatchMode', value ?? 'ALL');
                  }}
                  allowDeselect={false}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <NumberInput
                  label="Minimum Courses"
                  min={0}
                  value={form.values.minimumCourses}
                  onChange={(value) => {
                    form.setFieldValue('minimumCourses', value);
                  }}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Title order={3}>Specific Courses</Title>
                    <Button variant="default" onClick={addSpecificCourse}>
                      Add Course
                    </Button>
                  </Group>

                  {specificCourses.length === 0 ? (
                    <Alert color="gray" title="No courses added">
                      Add courses to build the specific-course list for this requirement.
                    </Alert>
                  ) : (
                    <Table.ScrollContainer minWidth={980}>
                      <Table withTableBorder withColumnBorders striped>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Course</Table.Th>
                            <Table.Th>Selected</Table.Th>
                            <Table.Th>Minimum Grade</Table.Th>
                            <Table.Th>Required</Table.Th>
                            <Table.Th>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {specificCourses.map((course) => (
                            <Table.Tr key={course.id}>
                              <Table.Td>
                                <Select
                                  searchable
                                  clearable
                                  placeholder="Select course"
                                  data={courseSelectOptions}
                                  value={course.courseId ? String(course.courseId) : null}
                                  loading={courseOptionsLoading}
                                  error={courseOptionsError ?? undefined}
                                  nothingFoundMessage="No courses found."
                                  onChange={(value) => {
                                    handleSpecificCourseChange(course.id, value);
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                {course.courseCode
                                  ? `${course.courseCode}${course.courseTitle ? ` - ${course.courseTitle}` : ''}`
                                  : '—'}
                              </Table.Td>
                              <Table.Td>
                                <TextInput
                                  placeholder="Optional"
                                  value={course.minimumGrade}
                                  onChange={(event) => {
                                    updateSpecificCourse(course.id, {
                                      minimumGrade: event.currentTarget.value,
                                    });
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <Checkbox
                                  checked={course.required}
                                  onChange={(event) => {
                                    updateSpecificCourse(course.id, {
                                      required: event.currentTarget.checked,
                                    });
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <Button
                                  color="red"
                                  variant="light"
                                  size="xs"
                                  onClick={() => {
                                    removeSpecificCourse(course.id);
                                  }}
                                >
                                  Remove
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  )}
                </Stack>
              </Grid.Col>
            </>
          ) : null}

          {selectedRequirementType === 'DEPARTMENT_LEVEL_COURSES' ? (
            <>
              <Grid.Col span={12}>
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Title order={3}>Department Course Rules</Title>
                    <Button variant="default" onClick={addDepartmentCourseRule}>
                      Add Rule
                    </Button>
                  </Group>

                  {departmentCourseRules.length === 0 ? (
                    <Alert color="gray" title="No department rules added">
                      Add a department course rule such as HIST 300+ or HUM 100-299.
                    </Alert>
                  ) : (
                    <Table.ScrollContainer minWidth={1120}>
                      <Table withTableBorder withColumnBorders striped>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Department</Table.Th>
                            <Table.Th>Minimum Number</Table.Th>
                            <Table.Th>Maximum Number</Table.Th>
                            <Table.Th>Minimum Credits</Table.Th>
                            <Table.Th>Minimum Courses</Table.Th>
                            <Table.Th>Minimum Grade</Table.Th>
                            <Table.Th>Actions</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {departmentCourseRules.map((rule) => (
                            <Table.Tr key={rule.id}>
                              <Table.Td>
                                <Select
                                  searchable
                                  clearable
                                  placeholder="Select department"
                                  data={departmentSelectOptions}
                                  value={rule.departmentId ? String(rule.departmentId) : null}
                                  loading={departmentOptionsLoading}
                                  error={departmentOptionsError ?? undefined}
                                  onChange={(value) => {
                                    handleDepartmentRuleDepartmentChange(rule.id, value);
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  placeholder="300"
                                  min={0}
                                  value={rule.minimumCourseNumber}
                                  onChange={(value) => {
                                    updateDepartmentCourseRule(rule.id, {
                                      minimumCourseNumber: value,
                                    });
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  placeholder="Optional"
                                  min={0}
                                  value={rule.maximumCourseNumber}
                                  onChange={(value) => {
                                    updateDepartmentCourseRule(rule.id, {
                                      maximumCourseNumber: value,
                                    });
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  min={0}
                                  value={rule.minimumCredits}
                                  onChange={(value) => {
                                    updateDepartmentCourseRule(rule.id, {
                                      minimumCredits: value,
                                    });
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <NumberInput
                                  min={0}
                                  value={rule.minimumCourses}
                                  onChange={(value) => {
                                    updateDepartmentCourseRule(rule.id, {
                                      minimumCourses: value,
                                    });
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <TextInput
                                  placeholder="Optional"
                                  value={rule.minimumGrade}
                                  onChange={(event) => {
                                    updateDepartmentCourseRule(rule.id, {
                                      minimumGrade: event.currentTarget.value,
                                    });
                                  }}
                                />
                              </Table.Td>
                              <Table.Td>
                                <Button
                                  color="red"
                                  variant="light"
                                  size="xs"
                                  onClick={() => {
                                    removeDepartmentCourseRule(rule.id);
                                  }}
                                >
                                  Remove
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  )}
                </Stack>
              </Grid.Col>
            </>
          ) : null}
        </Grid>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreateRequirement()} loading={isSaving}>
            Create Requirement
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function RequirementLibraryPage() {
  const navigate = useNavigate();
  const form = useForm<RequirementSearchFilters>({
    initialValues: initialRequirementSearchFilters,
  });
  const [resultsState, setResultsState] = useState<RequirementSearchResultsState>({
    status: 'idle',
  });
  const [submittedFilters, setSubmittedFilters] = useState<RequirementSearchFilters>(
    initialRequirementSearchFilters
  );
  const [hasSearched, setHasSearched] = useState(false);
  const [size, setSize] = useState<RequirementSearchSize>('25');
  const [page, setPage] = useState(0);
  const [resultsView, setResultsView] = useState<RequirementResultsView>('standard');
  const [isCreateRequirementModalOpen, setIsCreateRequirementModalOpen] = useState(false);

  useEffect(() => {
    if (!hasSearched) {
      return;
    }

    const abortController = new AbortController();
    setResultsState({ status: 'loading' });

    searchRequirements({
      code: submittedFilters.code,
      name: submittedFilters.name,
      requirementType: submittedFilters.requirementType || undefined,
      page,
      size: Number(size),
      signal: abortController.signal,
    })
      .then((response) => {
        setResultsState(
          response.results.length === 0
            ? { status: 'empty', response }
            : { status: 'success', response }
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setResultsState({
          status: 'error',
          message: getErrorMessage(error),
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, size, submittedFilters]);

  const tableData =
    resultsState.status === 'success' || resultsState.status === 'empty'
      ? resultsState.response.results
      : emptyRequirementSearchResults;

  const requirementSearchTable = useReactTable({
    columns: requirementSearchColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.requirementId),
    state: {
      columnVisibility: {
        requirementId: resultsView === 'system',
      },
    },
  });

  function handleClear() {
    form.reset();
    setSubmittedFilters(initialRequirementSearchFilters);
    setHasSearched(false);
    setPage(0);
    setResultsState({ status: 'idle' });
  }

  function handleRequirementCreated(requirement: RequirementSearchResultResponse) {
    setIsCreateRequirementModalOpen(false);
    void navigate(`/academics/requirements/${requirement.requirementId}`);
  }

  return (
    <Container size="xl" py="xl">
      <CreateRequirementModal
        opened={isCreateRequirementModalOpen}
        onCreated={handleRequirementCreated}
        onClose={() => {
          setIsCreateRequirementModalOpen(false);
        }}
      />
      <Stack gap="lg">
        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="center" gap="md">
              <Title order={1}>Requirement Library</Title>
              <Button
                onClick={() => {
                  setIsCreateRequirementModalOpen(true);
                }}
              >
                Create Requirement
              </Button>
            </Group>

            <form
              onSubmit={form.onSubmit((values) => {
                setSubmittedFilters({ ...values });
                setHasSearched(true);
                setPage(0);
              })}
            >
              <Stack gap="lg">
                <SearchFormSection legend="Requirement Filters">
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <TextInput label="Requirement Code" {...form.getInputProps('code')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput label="Requirement Name" {...form.getInputProps('name')} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      clearable
                      label="Requirement Type"
                      placeholder="All types"
                      data={requirementTypeOptions}
                      value={form.values.requirementType || null}
                      onChange={(value) => {
                        form.setFieldValue('requirementType', value ?? '');
                      }}
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormActions
                  size={size}
                  sizeOptions={sizeOptions}
                  sortBy="name"
                  sortDirection="asc"
                  sortByOptions={[]}
                  sortDirectionOptions={[]}
                  onSizeChange={(value) => {
                    if (!value) {
                      return;
                    }

                    setSize(value as RequirementSearchSize);
                    setPage(0);
                  }}
                  onSortByChange={() => undefined}
                  onSortDirectionChange={() => undefined}
                  clearLabel="Clear"
                  submitLabel="Search Requirements"
                  isSubmitting={resultsState.status === 'loading'}
                  onClear={handleClear}
                />
              </Stack>
            </form>
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <SearchResultsHeader
              data={resultsViewOptions}
              value={resultsView}
              onChange={setResultsView}
              summary={getResultsSummary(resultsState)}
            />

            {resultsState.status === 'success' ? (
              <>
                <SearchResultsTable
                  table={requirementSearchTable}
                  sortBy="name"
                  sortDirection="asc"
                  onToggleSort={() => undefined}
                />

                <SearchPaginationFooter
                  page={resultsState.response.page}
                  totalPages={Math.max(resultsState.response.totalPages, 1)}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <SearchResultsStateNotice
                status={resultsState.status}
                idleTitle="Requirement search is ready"
                idleMessage="Search reusable requirements by code, name, or type."
                loadingMessage="Loading requirement search results..."
                errorTitle="Unable to load requirement search results"
                errorMessage={resultsState.status === 'error' ? resultsState.message : null}
                emptyTitle="No requirement search results found"
                emptyMessage="Try adjusting the current search filters."
              />
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
