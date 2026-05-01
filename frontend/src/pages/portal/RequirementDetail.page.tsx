import { useEffect, useState, type ComponentProps } from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Grid,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Table,
  Textarea,
  TextInput,
} from '@mantine/core';
import { Link, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import {
  getCoursePickerReferenceOptions,
  getProgramReferenceOptions,
} from '@/services/reference-service';
import { getRequirementDetail, patchRequirement } from '@/services/requirement-service';
import type {
  AcademicDepartmentReferenceOption,
  CourseReferenceOption,
} from '@/services/schemas/reference-schemas';
import type {
  PatchRequirementRequest,
  RequirementDetailResponse,
} from '@/services/schemas/program-schemas';

type RequirementDetailPageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; requirement: RequirementDetailResponse };

type RequirementEditState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

type RequirementEditFormValues = {
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
  departmentName: string;
  minimumCourseNumber: number | string;
  maximumCourseNumber: number | string;
  minimumCredits: number | string;
  minimumCourses: number | string;
  minimumGrade: string;
};

type CourseOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; courses: CourseReferenceOption[] }
  | { status: 'error'; message: string };

type DepartmentOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; departments: AcademicDepartmentReferenceOption[] }
  | { status: 'error'; message: string };

const requirementTypeOptions = [
  { value: 'TOTAL_ELECTIVE_CREDITS', label: 'Elective credits' },
  { value: 'SPECIFIC_COURSES', label: 'Specific courses' },
  { value: 'DEPARTMENT_LEVEL_COURSES', label: 'Department courses' },
  { value: 'MANUAL', label: 'Manual review' },
];

const courseMatchModeOptions = [
  { value: 'ALL', label: 'All listed courses' },
  { value: 'ANY', label: 'Choose from listed courses' },
];

function displayValue(value: boolean | number | string | null | undefined): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
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

function formatRequirementType(type: string | null): string {
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
      return displayValue(type);
  }
}

function formatCourseDisplay(course: RequirementDetailResponse['requirementCourses'][number]) {
  if (course.subjectCode === null && course.courseNumber === null) {
    return '-';
  }

  return `${course.subjectCode ?? ''}${course.courseNumber ?? ''}`;
}

function formatCourseOptionLabel(course: CourseReferenceOption): string {
  return course.courseCode;
}

function formatCourseRuleRange(rule: RequirementDetailResponse['requirementCourseRules'][number]) {
  if (rule.minimumCourseNumber === null && rule.maximumCourseNumber === null) {
    return 'any level';
  }

  if (rule.minimumCourseNumber !== null && rule.maximumCourseNumber !== null) {
    return `${rule.minimumCourseNumber}-${rule.maximumCourseNumber}`;
  }

  if (rule.minimumCourseNumber !== null) {
    return `${rule.minimumCourseNumber}+`;
  }

  return `up to ${rule.maximumCourseNumber}`;
}

function ReadOnlyField({
  label,
  value,
  span = { base: 12, md: 6 },
}: {
  label: string;
  value: string;
  span?: ComponentProps<typeof Grid.Col>['span'];
}) {
  const isEmptyValue = value === '-';

  return (
    <Grid.Col span={span}>
      <TextInput
        label={label}
        value={isEmptyValue ? '' : value}
        placeholder={isEmptyValue ? '-' : undefined}
        readOnly
      />
    </Grid.Col>
  );
}

function RequirementCourseSection({
  requirement,
}: {
  requirement: RequirementDetailResponse;
}) {
  if (requirement.requirementCourses.length === 0) {
    return null;
  }

  return (
    <RecordPageSection title="Specific Courses" description="Courses attached to this requirement.">
      <Grid.Col span={12}>
        <Table.ScrollContainer minWidth={720}>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Course ID</Table.Th>
                <Table.Th>Course</Table.Th>
                <Table.Th>Subject</Table.Th>
                <Table.Th>Number</Table.Th>
                <Table.Th>Required</Table.Th>
                <Table.Th>Minimum Grade</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {requirement.requirementCourses.map((course) => (
                <Table.Tr key={course.requirementCourseId}>
                  <Table.Td>{displayValue(course.courseId)}</Table.Td>
                  <Table.Td>{formatCourseDisplay(course)}</Table.Td>
                  <Table.Td>{displayValue(course.subjectCode)}</Table.Td>
                  <Table.Td>{displayValue(course.courseNumber)}</Table.Td>
                  <Table.Td>{displayValue(course.required)}</Table.Td>
                  <Table.Td>{displayValue(course.minimumGrade)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Grid.Col>
    </RecordPageSection>
  );
}

function RequirementCourseRuleSection({
  requirement,
}: {
  requirement: RequirementDetailResponse;
}) {
  if (requirement.requirementCourseRules.length === 0) {
    return null;
  }

  return (
    <RecordPageSection title="Department Course Rules" description="Department and course-number rules.">
      <Grid.Col span={12}>
        <Table.ScrollContainer minWidth={920}>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Rule ID</Table.Th>
                <Table.Th>Department ID</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Course Range</Table.Th>
                <Table.Th>Minimum Credits</Table.Th>
                <Table.Th>Minimum Courses</Table.Th>
                <Table.Th>Minimum Grade</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {requirement.requirementCourseRules.map((rule) => (
                <Table.Tr key={rule.requirementCourseRuleId}>
                  <Table.Td>{displayValue(rule.requirementCourseRuleId)}</Table.Td>
                  <Table.Td>{displayValue(rule.departmentId)}</Table.Td>
                  <Table.Td>{displayValue(rule.departmentName)}</Table.Td>
                  <Table.Td>{displayValue(rule.departmentCode)}</Table.Td>
                  <Table.Td>{formatCourseRuleRange(rule)}</Table.Td>
                  <Table.Td>{displayValue(rule.minimumCredits)}</Table.Td>
                  <Table.Td>{displayValue(rule.minimumCourses)}</Table.Td>
                  <Table.Td>{displayValue(rule.minimumGrade)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Grid.Col>
    </RecordPageSection>
  );
}

function RequirementEditModal({
  editState,
  onClose,
  onSave,
  opened,
  requirement,
}: {
  editState: RequirementEditState;
  onClose: () => void;
  onSave: (request: PatchRequirementRequest) => Promise<void>;
  opened: boolean;
  requirement: RequirementDetailResponse | null;
}) {
  const [formValues, setFormValues] = useState<RequirementEditFormValues>({
    code: '',
    name: '',
    requirementType: 'TOTAL_ELECTIVE_CREDITS',
    description: '',
    minimumCredits: '',
    minimumCourses: '',
    courseMatchMode: '',
    minimumGrade: '',
  });
  const [specificCourses, setSpecificCourses] = useState<SpecificCourseDraft[]>([]);
  const [departmentCourseRules, setDepartmentCourseRules] = useState<DepartmentCourseRuleDraft[]>(
    []
  );
  const [courseOptionsState, setCourseOptionsState] = useState<CourseOptionsState>({
    status: 'idle',
  });
  const [departmentOptionsState, setDepartmentOptionsState] = useState<DepartmentOptionsState>({
    status: 'idle',
  });
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isSaving = editState.status === 'saving';
  const courseOptionsLoading =
    courseOptionsState.status === 'idle' || courseOptionsState.status === 'loading';
  const courseOptionsError =
    courseOptionsState.status === 'error' ? courseOptionsState.message : null;
  const courseSelectOptions = [
    ...specificCourses
      .filter((course) => course.courseId && course.courseCode)
      .map((course) => ({
        value: String(course.courseId),
        label: course.courseCode,
      })),
    ...(courseOptionsState.status === 'success'
      ? courseOptionsState.courses.map((course) => ({
          value: String(course.courseId),
          label: formatCourseOptionLabel(course),
        }))
      : []),
  ].filter(
    (option, index, options) =>
      options.findIndex((candidate) => candidate.value === option.value) === index
  );
  const departmentOptionsLoading =
    departmentOptionsState.status === 'idle' || departmentOptionsState.status === 'loading';
  const departmentOptionsError =
    departmentOptionsState.status === 'error' ? departmentOptionsState.message : null;
  const departmentSelectOptions = [
    ...departmentCourseRules
      .filter((rule) => rule.departmentId && rule.departmentName)
      .map((rule) => ({
        value: String(rule.departmentId),
        label: `${rule.departmentName} (${rule.departmentCode})`,
      })),
    ...(departmentOptionsState.status === 'success'
      ? departmentOptionsState.departments.map((department) => ({
          value: String(department.id),
          label: `${department.name} (${department.code})`,
        }))
      : []),
  ].filter(
    (option, index, options) =>
      options.findIndex((candidate) => candidate.value === option.value) === index
  );

  useEffect(() => {
    if (!opened || requirement === null) {
      return;
    }

    setFormValues({
      code: requirement.code,
      name: requirement.name,
      requirementType: requirement.requirementType,
      description: requirement.description ?? '',
      minimumCredits: requirement.minimumCredits ?? '',
      minimumCourses: requirement.minimumCourses ?? '',
      courseMatchMode: requirement.courseMatchMode ?? '',
      minimumGrade: requirement.minimumGrade ?? '',
    });
    setSpecificCourses(
      requirement.requirementCourses.map((course) => ({
        id: course.requirementCourseId,
        courseId: course.courseId ?? '',
        subjectCode: course.subjectCode ?? '',
        courseNumber: course.courseNumber ?? '',
        courseCode:
          course.subjectCode === null && course.courseNumber === null
            ? ''
            : `${course.subjectCode ?? ''}${course.courseNumber ?? ''}`,
        courseTitle: '',
        minimumGrade: course.minimumGrade ?? '',
        required: course.required,
      }))
    );
    setDepartmentCourseRules(
      requirement.requirementCourseRules.map((rule) => ({
        id: rule.requirementCourseRuleId,
        departmentId: rule.departmentId ?? '',
        departmentCode: rule.departmentCode ?? '',
        departmentName: rule.departmentName ?? '',
        minimumCourseNumber: rule.minimumCourseNumber ?? '',
        maximumCourseNumber: rule.maximumCourseNumber ?? '',
        minimumCredits: rule.minimumCredits ?? '',
        minimumCourses: rule.minimumCourses ?? '',
        minimumGrade: rule.minimumGrade ?? '',
      }))
    );
    setValidationMessage(null);
  }, [opened, requirement]);

  useEffect(() => {
    if (!opened || formValues.requirementType !== 'SPECIFIC_COURSES') {
      return;
    }

    if (courseOptionsState.status === 'success' || courseOptionsState.status === 'loading') {
      return;
    }

    let isMounted = true;
    setCourseOptionsState({ status: 'loading' });

    getCoursePickerReferenceOptions()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCourseOptionsState({ status: 'success', courses: response.courses });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setCourseOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load course options.'),
        });
      });

    return () => {
      isMounted = false;
    };
  }, [formValues.requirementType, opened]);

  useEffect(() => {
    if (!opened || formValues.requirementType !== 'DEPARTMENT_LEVEL_COURSES') {
      return;
    }

    if (
      departmentOptionsState.status === 'success' ||
      departmentOptionsState.status === 'loading'
    ) {
      return;
    }

    let isMounted = true;
    setDepartmentOptionsState({ status: 'loading' });

    getProgramReferenceOptions()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setDepartmentOptionsState({ status: 'success', departments: response.departments });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setDepartmentOptionsState({
          status: 'error',
          message: getErrorMessage(error, 'Failed to load department options.'),
        });
      });

    return () => {
      isMounted = false;
    };
  }, [formValues.requirementType, opened]);

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
        minimumGrade: formValues.minimumGrade,
        required: true,
      },
    ]);
  }

  function updateSpecificCourse(id: number, patch: Partial<Omit<SpecificCourseDraft, 'id'>>) {
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
        departmentName: '',
        minimumCourseNumber: '',
        maximumCourseNumber: '',
        minimumCredits: '',
        minimumCourses: '',
        minimumGrade: formValues.minimumGrade,
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
        departmentName: '',
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
      departmentName: selectedDepartment?.name ?? '',
    });
  }

  async function handleSave() {
    const code = formValues.code.trim();
    const name = formValues.name.trim();

    if (!code) {
      setValidationMessage('Code is required.');
      return;
    }

    if (!name) {
      setValidationMessage('Name is required.');
      return;
    }

    const request: PatchRequirementRequest = {
      code,
      name,
      requirementType: formValues.requirementType,
      description: trimToNull(formValues.description),
      minimumCredits:
        formValues.requirementType === 'TOTAL_ELECTIVE_CREDITS'
          ? numberToNull(formValues.minimumCredits)
          : null,
      minimumCourses:
        formValues.requirementType === 'SPECIFIC_COURSES'
          ? integerToNull(formValues.minimumCourses)
          : null,
      courseMatchMode:
        formValues.requirementType === 'SPECIFIC_COURSES'
          ? trimToNull(formValues.courseMatchMode)
          : null,
      minimumGrade: trimToNull(formValues.minimumGrade),
    };

    if (formValues.requirementType === 'SPECIFIC_COURSES') {
      request.requirementCourses = specificCourses
        .map((course) => ({
          courseId: Number(course.courseId),
          minimumGrade: trimToNull(course.minimumGrade),
        }))
        .filter((course) => Number.isInteger(course.courseId) && course.courseId > 0);

      if (specificCourses.length !== request.requirementCourses.length) {
        setValidationMessage('Select a course for each course row.');
        return;
      }

      if (request.requirementCourses.length === 0) {
        setValidationMessage('Add at least one course for specific course requirements.');
        return;
      }

      if (request.courseMatchMode === 'ANY' && request.minimumCourses === null) {
        setValidationMessage('Minimum courses is required when choosing from a course list.');
        return;
      }
    }

    if (formValues.requirementType === 'DEPARTMENT_LEVEL_COURSES') {
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
        return;
      }

      if (request.requirementCourseRules.length === 0) {
        setValidationMessage('Add at least one department rule.');
        return;
      }

      const ruleWithoutTarget = request.requirementCourseRules.find(
        (rule) => rule.minimumCredits === null && rule.minimumCourses === null
      );

      if (ruleWithoutTarget) {
        setValidationMessage('Each department rule needs minimum credits or minimum courses.');
        return;
      }
    }

    setValidationMessage(null);
    await onSave(request);
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Requirement"
      size="70rem"
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

        {editState.status === 'error' ? (
          <Alert color="red" title="Unable to update requirement">
            {editState.message}
          </Alert>
        ) : null}

        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              label="Code"
              value={formValues.code}
              onChange={(event) => {
                setFormValues((current) => ({ ...current, code: event.currentTarget.value }));
              }}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <TextInput
              label="Name"
              value={formValues.name}
              onChange={(event) => {
                setFormValues((current) => ({ ...current, name: event.currentTarget.value }));
              }}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label="Type"
              data={requirementTypeOptions}
              value={formValues.requirementType}
              onChange={(value) => {
                setFormValues((current) => ({
                  ...current,
                  requirementType: value ?? 'TOTAL_ELECTIVE_CREDITS',
                }));
              }}
              allowDeselect={false}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Minimum Grade"
              value={formValues.minimumGrade}
              onChange={(event) => {
                setFormValues((current) => ({
                  ...current,
                  minimumGrade: event.currentTarget.value,
                }));
              }}
              disabled={isSaving}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Description"
              value={formValues.description}
              minRows={3}
              onChange={(event) => {
                setFormValues((current) => ({
                  ...current,
                  description: event.currentTarget.value,
                }));
              }}
              disabled={isSaving}
            />
          </Grid.Col>

          {formValues.requirementType === 'TOTAL_ELECTIVE_CREDITS' ? (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Minimum Credits"
                min={0}
                value={formValues.minimumCredits}
                onChange={(value) => {
                  setFormValues((current) => ({ ...current, minimumCredits: value }));
                }}
                disabled={isSaving}
              />
            </Grid.Col>
          ) : null}

          {formValues.requirementType === 'SPECIFIC_COURSES' ? (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Minimum Courses"
                min={0}
                value={formValues.minimumCourses}
                onChange={(value) => {
                  setFormValues((current) => ({ ...current, minimumCourses: value }));
                }}
                disabled={isSaving}
              />
            </Grid.Col>
          ) : null}

          {formValues.requirementType === 'SPECIFIC_COURSES' ? (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                clearable
                label="Course Match Mode"
                data={courseMatchModeOptions}
                value={formValues.courseMatchMode || null}
                onChange={(value) => {
                  setFormValues((current) => ({ ...current, courseMatchMode: value ?? '' }));
                }}
                disabled={isSaving}
              />
            </Grid.Col>
          ) : null}

          {formValues.requirementType === 'SPECIFIC_COURSES' ? (
            <Grid.Col span={12}>
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Badge variant="light" size="lg">
                    Specific Courses
                  </Badge>
                  <Button variant="default" onClick={addSpecificCourse} disabled={isSaving}>
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
                                disabled={isSaving}
                              />
                            </Table.Td>
                            <Table.Td>
                              {course.courseCode
                                ? `${course.courseCode}${course.courseTitle ? ` - ${course.courseTitle}` : ''}`
                                : '-'}
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
                                disabled={isSaving}
                              />
                            </Table.Td>
                            <Table.Td>
                              <Checkbox checked={course.required} disabled />
                            </Table.Td>
                            <Table.Td>
                              <Button
                                color="red"
                                variant="light"
                                size="xs"
                                onClick={() => {
                                  removeSpecificCourse(course.id);
                                }}
                                disabled={isSaving}
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
          ) : null}

          {formValues.requirementType === 'DEPARTMENT_LEVEL_COURSES' ? (
            <Grid.Col span={12}>
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Badge variant="light" size="lg">
                    Department Course Rules
                  </Badge>
                  <Button
                    variant="default"
                    onClick={addDepartmentCourseRule}
                    disabled={isSaving}
                  >
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
                                nothingFoundMessage="No departments found."
                                onChange={(value) => {
                                  handleDepartmentRuleDepartmentChange(rule.id, value);
                                }}
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
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
                                disabled={isSaving}
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
          ) : null}
        </Grid>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} loading={isSaving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

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

        <RequirementCourseSection requirement={requirement} />
        <RequirementCourseRuleSection requirement={requirement} />

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
