import { useEffect, useState } from 'react';
import { Grid, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DepartmentCourseRulesEditor } from '@/components/requirements/DepartmentCourseRulesEditor';
import { FormModalShell } from '@/components/modals/FormModalShell';
import { SpecificCourseRulesEditor } from '@/components/requirements/SpecificCourseRulesEditor';
import {
  courseMatchModeOptions,
  initialRequirementFormValues,
  requirementTypeOptions,
  type CourseOptionsState,
  type DepartmentCourseRuleDraft,
  type DepartmentOptionsState,
  type RequirementFormValues,
  type SpecificCourseDraft,
} from '@/components/requirements/requirementFormTypes';
import {
  getCoursePickerReferenceOptions,
  getProgramReferenceOptions,
} from '@/services/reference-service';
import { createRequirement } from '@/services/requirement-service';
import type {
  CreateRequirementRequest,
  RequirementSearchResultResponse,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { integerToNull, numberToNull, trimToNull } from '@/utils/form-values';

type CreateRequirementState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

export function CreateRequirementModal({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated: (requirement: RequirementSearchResultResponse) => void;
}) {
  const form = useForm<RequirementFormValues>({
    initialValues: initialRequirementFormValues,
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
    if (!opened) {
      return;
    }

    form.setValues(initialRequirementFormValues);
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
    <FormModalShell
      opened={opened}
      onClose={onClose}
      title="Create Requirement"
      size="80rem"
      isSaving={isSaving}
      validationMessage={validationMessage}
      validationTitle="Invalid requirement"
      submissionError={createState.status === 'error' ? createState.message : null}
      submissionErrorTitle="Unable to create requirement"
      submitLabel="Create Requirement"
      onSubmit={() => void handleCreateRequirement()}
    >
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
              <SpecificCourseRulesEditor
                courses={specificCourses}
                courseOptions={courseSelectOptions}
                loading={courseOptionsLoading}
                error={courseOptionsError}
                onAddCourse={addSpecificCourse}
                onCourseChange={handleSpecificCourseChange}
                onRemoveCourse={removeSpecificCourse}
                onUpdateCourse={updateSpecificCourse}
              />
            </Grid.Col>
          </>
        ) : null}

        {selectedRequirementType === 'DEPARTMENT_LEVEL_COURSES' ? (
          <Grid.Col span={12}>
            <DepartmentCourseRulesEditor
              rules={departmentCourseRules}
              departmentOptions={departmentSelectOptions}
              loading={departmentOptionsLoading}
              error={departmentOptionsError}
              onAddRule={addDepartmentCourseRule}
              onDepartmentChange={handleDepartmentRuleDepartmentChange}
              onRemoveRule={removeDepartmentCourseRule}
              onUpdateRule={updateDepartmentCourseRule}
            />
          </Grid.Col>
        ) : null}
      </Grid>
    </FormModalShell>
  );
}
