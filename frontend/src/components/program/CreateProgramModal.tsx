import { useEffect, useState } from 'react';
import { Alert, Checkbox, Grid, NumberInput, Select, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { FormModalShell } from '@/components/modals/FormModalShell';
import { createProgram } from '@/services/program-service';
import type {
  CreateProgramRequest,
  CreateProgramResponse,
} from '@/services/schemas/program-schemas';
import { getErrorMessage } from '@/utils/errors';
import { integerToNull, parseOptionalId, trimToNull } from '@/utils/form-values';

export type ProgramDepartmentOption = {
  label: string;
  schoolId: number;
  value: string;
};

export type ProgramCatalogOption = {
  code: string;
  label: string;
  value: string;
};

type ProgramCreateFormValues = {
  code: string;
  name: string;
  description: string;
  programTypeId: string;
  degreeTypeId: string;
  schoolId: string;
  departmentId: string;
  versionNumber: number | string;
  published: boolean;
  classYearStart: number | string;
  classYearEnd: number | string;
  versionNotes: string;
};

type ProgramCreateState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

const initialProgramCreateFormValues: ProgramCreateFormValues = {
  code: '',
  name: '',
  description: '',
  programTypeId: '',
  degreeTypeId: '',
  schoolId: '',
  departmentId: '',
  versionNumber: 1,
  published: false,
  classYearStart: '',
  classYearEnd: '',
  versionNotes: '',
};

function getSelectedOption<TOption extends { value: string }>(
  options: TOption[],
  value: string
): TOption | null {
  return options.find((option) => option.value === value) ?? null;
}

type CreateProgramModalProps = {
  departmentOptions: ProgramDepartmentOption[];
  degreeTypeOptions: ProgramCatalogOption[];
  opened: boolean;
  onClose: () => void;
  onCreated: (response: CreateProgramResponse) => void;
  programTypeOptions: ProgramCatalogOption[];
  referenceOptionsError: string | null;
  referenceOptionsLoading: boolean;
  schoolOptions: ProgramCatalogOption[];
};

export function CreateProgramModal({
  departmentOptions,
  degreeTypeOptions,
  opened,
  onClose,
  onCreated,
  programTypeOptions,
  referenceOptionsError,
  referenceOptionsLoading,
  schoolOptions,
}: CreateProgramModalProps) {
  const form = useForm<ProgramCreateFormValues>({
    initialValues: initialProgramCreateFormValues,
  });
  const [createState, setCreateState] = useState<ProgramCreateState>({ status: 'idle' });
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const selectedProgramType = getSelectedOption(programTypeOptions, form.values.programTypeId);
  const isCoreProgram = selectedProgramType?.code === 'CORE';
  const isNonDegreeProgram =
    selectedProgramType?.code === 'MINOR' || selectedProgramType?.code === 'CERTIFICATE';
  const isSaving = createState.status === 'saving';
  const visibleDepartmentOptions = form.values.schoolId
    ? departmentOptions.filter((option) => option.schoolId === Number(form.values.schoolId))
    : departmentOptions;

  useEffect(() => {
    if (opened) {
      form.setValues(initialProgramCreateFormValues);
      form.resetDirty();
      setCreateState({ status: 'idle' });
      setValidationMessage(null);
    }
  }, [opened]);

  function buildCreateProgramRequest(): CreateProgramRequest | null {
    const code = form.values.code.trim();
    const name = form.values.name.trim();
    const programTypeId = parseOptionalId(form.values.programTypeId);
    const schoolId = isCoreProgram ? undefined : parseOptionalId(form.values.schoolId);
    const departmentId = isCoreProgram ? undefined : parseOptionalId(form.values.departmentId);
    const degreeTypeId =
      isNonDegreeProgram || isCoreProgram ? undefined : parseOptionalId(form.values.degreeTypeId);
    const classYearStart = integerToNull(form.values.classYearStart);
    const classYearEnd = integerToNull(form.values.classYearEnd);

    if (!code) {
      setValidationMessage('Program code is required.');
      return null;
    }

    if (!name) {
      setValidationMessage('Program name is required.');
      return null;
    }

    if (programTypeId === undefined) {
      setValidationMessage('Program type is required.');
      return null;
    }

    if (!isCoreProgram && schoolId === undefined) {
      setValidationMessage('School is required for major, minor, and certificate programs.');
      return null;
    }

    if (!isCoreProgram && !isNonDegreeProgram && degreeTypeId === undefined) {
      setValidationMessage('Degree type is required for major and masters programs.');
      return null;
    }

    if (classYearStart === null) {
      setValidationMessage('Start class year is required.');
      return null;
    }

    if (classYearEnd !== null && classYearEnd < classYearStart) {
      setValidationMessage('End class year must be greater than or equal to start class year.');
      return null;
    }

    setValidationMessage(null);
    return {
      schoolId: schoolId ?? null,
      departmentId: departmentId ?? null,
      programTypeId,
      degreeTypeId: degreeTypeId ?? null,
      code,
      name,
      description: trimToNull(form.values.description),
      initialVersion: {
        published: form.values.published,
        classYearStart,
        classYearEnd,
        notes: trimToNull(form.values.versionNotes),
      },
    };
  }

  async function handleCreateProgram() {
    if (isSaving) {
      return;
    }

    const request = buildCreateProgramRequest();

    if (request === null) {
      return;
    }

    try {
      setCreateState({ status: 'saving' });
      const response = await createProgram({ request });
      setCreateState({ status: 'idle' });
      onCreated(response);
    } catch (error) {
      setCreateState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create program.'),
      });
    }
  }

  return (
    <FormModalShell
      opened={opened}
      onClose={onClose}
      title="Create Program"
      size="80rem"
      isSaving={isSaving}
      validationMessage={validationMessage}
      validationTitle="Invalid program"
      submissionError={createState.status === 'error' ? createState.message : null}
      submissionErrorTitle="Unable to create program"
      submitLabel="Create Program"
      onSubmit={() => void handleCreateProgram()}
    >
      {referenceOptionsError ? (
        <Alert color="red" title="Unable to load program options">
          {referenceOptionsError}
        </Alert>
      ) : null}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TextInput label="Program Code" placeholder="HIST-BA" {...form.getInputProps('code')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <TextInput
            label="Program Name"
            placeholder="History BA"
            {...form.getInputProps('name')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            searchable
            label="Program Type"
            placeholder="Select type"
            data={programTypeOptions}
            value={form.values.programTypeId || null}
            loading={referenceOptionsLoading}
            error={referenceOptionsError ?? undefined}
            onChange={(value) => {
              form.setFieldValue('programTypeId', value ?? '');

              const nextProgramType = getSelectedOption(programTypeOptions, value ?? '');
              if (nextProgramType?.code === 'CORE') {
                form.setFieldValue('degreeTypeId', '');
                form.setFieldValue('schoolId', '');
                form.setFieldValue('departmentId', '');
              }

              if (nextProgramType?.code === 'MINOR' || nextProgramType?.code === 'CERTIFICATE') {
                form.setFieldValue('degreeTypeId', '');
              }
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            clearable
            searchable
            label="Degree Type"
            placeholder={isNonDegreeProgram || isCoreProgram ? 'Not required' : 'Select degree'}
            data={degreeTypeOptions}
            value={form.values.degreeTypeId || null}
            loading={referenceOptionsLoading}
            error={referenceOptionsError ?? undefined}
            disabled={isNonDegreeProgram || isCoreProgram}
            onChange={(value) => {
              form.setFieldValue('degreeTypeId', value ?? '');
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Checkbox
            mt="xl"
            label="Publish initial version"
            checked={form.values.published}
            onChange={(event) => {
              form.setFieldValue('published', event.currentTarget.checked);
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            clearable
            searchable
            label="School"
            placeholder={isCoreProgram ? 'Not required' : 'Select school'}
            data={schoolOptions}
            value={form.values.schoolId || null}
            loading={referenceOptionsLoading}
            error={referenceOptionsError ?? undefined}
            disabled={isCoreProgram}
            onChange={(value) => {
              form.setFieldValue('schoolId', value ?? '');

              if (!value) {
                form.setFieldValue('departmentId', '');
                return;
              }

              const departmentStillMatches = departmentOptions.some(
                (option) =>
                  option.value === form.values.departmentId && option.schoolId === Number(value)
              );

              if (!departmentStillMatches) {
                form.setFieldValue('departmentId', '');
              }
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            clearable
            searchable
            label="Department"
            placeholder={isCoreProgram ? 'Not required' : 'Select department'}
            data={visibleDepartmentOptions.map(({ label, value }) => ({ label, value }))}
            value={form.values.departmentId || null}
            loading={referenceOptionsLoading}
            error={referenceOptionsError ?? undefined}
            disabled={isCoreProgram}
            onChange={(value) => {
              form.setFieldValue('departmentId', value ?? '');
            }}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea
            label="Description"
            placeholder="Describe the program"
            minRows={3}
            {...form.getInputProps('description')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput
            label="Initial Version"
            min={1}
            value={form.values.versionNumber}
            onChange={(value) => {
              form.setFieldValue('versionNumber', value);
            }}
            disabled
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput
            label="Start Class Year"
            placeholder="2026"
            min={1900}
            value={form.values.classYearStart}
            onChange={(value) => {
              form.setFieldValue('classYearStart', value);
            }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <NumberInput
            label="End Class Year"
            placeholder="Optional"
            min={1900}
            value={form.values.classYearEnd}
            onChange={(value) => {
              form.setFieldValue('classYearEnd', value);
            }}
          />
        </Grid.Col>
        <Grid.Col span={12}>
          <Textarea
            label="Version Notes"
            placeholder="Notes for the initial version"
            minRows={3}
            {...form.getInputProps('versionNotes')}
          />
        </Grid.Col>
      </Grid>
    </FormModalShell>
  );
}
