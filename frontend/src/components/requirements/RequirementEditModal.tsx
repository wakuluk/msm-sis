import { useEffect, useState } from 'react';
import { Grid, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
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
import type {
  PatchRequirementRequest,
  RequirementDetailResponse,
} from '@/services/schemas/program-schemas';
import type { CourseReferenceOption } from '@/services/schemas/reference-schemas';
import { getErrorMessage } from '@/utils/errors';
import { integerToNull, numberToNull, trimToNull } from '@/utils/form-values';

export type RequirementEditState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

function formatCourseOptionLabel(course: CourseReferenceOption): string {
  return course.courseCode;
}

export function RequirementEditModal({
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
  const [formValues, setFormValues] = useState<RequirementFormValues>({
    ...initialRequirementFormValues,
    courseMatchMode: '',
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
        if (isMounted) {
          setCourseOptionsState({ status: 'success', courses: response.courses });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setCourseOptionsState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load course options.'),
          });
        }
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
        if (isMounted) {
          setDepartmentOptionsState({ status: 'success', departments: response.departments });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setDepartmentOptionsState({
            status: 'error',
            message: getErrorMessage(error, 'Failed to load department options.'),
          });
        }
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
    <FormModalShell
      opened={opened}
      onClose={onClose}
      title="Edit Requirement"
      size="70rem"
      isSaving={isSaving}
      validationMessage={validationMessage}
      validationTitle="Invalid requirement"
      submissionError={editState.status === 'error' ? editState.message : null}
      submissionErrorTitle="Unable to update requirement"
      submitLabel="Save"
      onSubmit={() => void handleSave()}
    >
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
            <SpecificCourseRulesEditor
              courses={specificCourses}
              courseOptions={courseSelectOptions}
              disabled={isSaving}
              loading={courseOptionsLoading}
              error={courseOptionsError}
              titleVariant="badge"
              allowRequiredEdit={false}
              onAddCourse={addSpecificCourse}
              onCourseChange={handleSpecificCourseChange}
              onRemoveCourse={removeSpecificCourse}
              onUpdateCourse={updateSpecificCourse}
            />
          </Grid.Col>
        ) : null}

        {formValues.requirementType === 'DEPARTMENT_LEVEL_COURSES' ? (
          <Grid.Col span={12}>
            <DepartmentCourseRulesEditor
              rules={departmentCourseRules}
              departmentOptions={departmentSelectOptions}
              disabled={isSaving}
              loading={departmentOptionsLoading}
              error={departmentOptionsError}
              titleVariant="badge"
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
