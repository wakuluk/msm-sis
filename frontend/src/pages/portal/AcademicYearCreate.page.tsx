import { useState } from 'react';
import { DateInput } from '@mantine/dates';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link, useNavigate } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import {
  buildCreateAcademicYearRequest,
  createAcademicYear,
} from '@/services/academic-years-service';
import {
  initialAcademicYearCreateFormValues,
  initialAcademicYearTermFormValues,
  type AcademicYearCreateFormValues,
} from '@/services/schemas/academic-years-schemas';

type AcademicYearCreateSubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function formatDateForFormValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeDateInputValue(value: string | Date | null): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return formatDateForFormValue(value);
}

function parseDateInputValue(value: string): Date | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedValue);

  if (!dateMatch) {
    return null;
  }

  const [, yearPart, monthPart, dayPart] = dateMatch;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function AcademicYearCreatePage() {
  const navigate = useNavigate();
  const [submitState, setSubmitState] = useState<AcademicYearCreateSubmitState>({ status: 'idle' });

  const form = useForm<AcademicYearCreateFormValues>({
    initialValues: initialAcademicYearCreateFormValues,
    validate: {
      code: (value) => (value.trim() ? null : 'Code is required.'),
      name: (value) => (value.trim() ? null : 'Name is required.'),
      startDate: (value) => (value.trim() ? null : 'Start date is required.'),
      endDate: (value) => (value.trim() ? null : 'End date is required.'),
    },
  });

  const isSubmitting = submitState.status === 'submitting';
  const submitError = submitState.status === 'error' ? submitState.message : null;

  async function handleSubmit(values: AcademicYearCreateFormValues) {
    if (isSubmitting) {
      return;
    }

    try {
      setSubmitState({ status: 'submitting' });
      const request = buildCreateAcademicYearRequest(values);
      const createdAcademicYear = await createAcademicYear(request);
      navigate(`/academics/academic-years/${createdAcademicYear.academicYearId}`, {
        replace: true,
        state: {
          academicYear: createdAcademicYear,
        },
      });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create academic year.'),
      });
    }
  }

  function handleAddTerm() {
    form.insertListItem('terms', initialAcademicYearTermFormValues);
  }

  function handleRemoveTerm(index: number) {
    form.removeListItem('terms', index);
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title="Create Academic Year"
      description="Create an academic year and optionally seed its academic terms in one pass. Published state remains off by default until you explicitly enable it later, and all new terms begin in Planned status."
      badge={
        <Badge variant="light" size="lg">
          Admin only
        </Badge>
      }
      beforeForm={
        <>
          {submitError ? (
            <Alert color="red" title="Unable to create academic year">
              {submitError}
            </Alert>
          ) : null}
        </>
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap={0}>
          <RecordPageSection
            title="Academic Year"
            description="Core academic year identity and date range."
          >
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                withAsterisk
                label="Code"
                placeholder="AY-2026-2027"
                maxLength={20}
                {...form.getInputProps('code')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                withAsterisk
                label="Name"
                placeholder="Academic Year 2026-2027"
                maxLength={100}
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                withAsterisk
                value={parseDateInputValue(form.values.startDate)}
                onChange={(value) => {
                  form.setFieldValue('startDate', normalizeDateInputValue(value));
                }}
                valueFormat="YYYY-MM-DD"
                label="Start date"
                placeholder="YYYY-MM-DD"
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <DateInput
                withAsterisk
                value={parseDateInputValue(form.values.endDate)}
                onChange={(value) => {
                  form.setFieldValue('endDate', normalizeDateInputValue(value));
                }}
                valueFormat="YYYY-MM-DD"
                label="End date"
                placeholder="YYYY-MM-DD"
                clearable
              />
            </Grid.Col>
          </RecordPageSection>

          <RecordPageSection
            title="Academic Terms"
            description="Term rows are optional. Add them now if you want the year and its term structure created together. Every term created here will start in Planned status."
            action={
              <Button type="button" variant="light" onClick={handleAddTerm}>
                Add term
              </Button>
            }
          >
            <Grid.Col span={12}>
              <Stack gap="md">
                {form.values.terms.length === 0 ? (
                  <Alert color="gray" title="No terms added">
                    This academic year will be created without terms unless you add them here.
                  </Alert>
                ) : null}

                {form.values.terms.map((term, index) => (
                  <Paper key={`term-${index}`} withBorder p="md" radius="sm">
                    <Stack gap="md">
                      <Group justify="space-between" align="center" wrap="wrap">
                        <Text fw={600}>Term {index + 1}</Text>
                        <Button
                          type="button"
                          variant="subtle"
                          color="red"
                          onClick={() => {
                            handleRemoveTerm(index);
                          }}
                        >
                          Remove
                        </Button>
                      </Group>

                      <Grid gap="md">
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            withAsterisk
                            label="Code"
                            placeholder="FALL-2026"
                            maxLength={20}
                            {...form.getInputProps(`terms.${index}.code`)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                          <TextInput
                            withAsterisk
                            label="Name"
                            placeholder="Fall 2026"
                            maxLength={100}
                            {...form.getInputProps(`terms.${index}.name`)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <DateInput
                            withAsterisk
                            value={parseDateInputValue(term.startDate)}
                            onChange={(value) => {
                              form.setFieldValue(
                                `terms.${index}.startDate`,
                                normalizeDateInputValue(value)
                              );
                            }}
                            valueFormat="YYYY-MM-DD"
                            label="Start date"
                            placeholder="YYYY-MM-DD"
                            clearable
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <DateInput
                            withAsterisk
                            value={parseDateInputValue(term.endDate)}
                            onChange={(value) => {
                              form.setFieldValue(
                                `terms.${index}.endDate`,
                                normalizeDateInputValue(value)
                              );
                            }}
                            valueFormat="YYYY-MM-DD"
                            label="End date"
                            placeholder="YYYY-MM-DD"
                            clearable
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            withAsterisk
                            label="Sort order"
                            placeholder="202630"
                            inputMode="numeric"
                            {...form.getInputProps(`terms.${index}.sortOrder`)}
                          />
                        </Grid.Col>
                      </Grid>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="New academic years start inactive and unpublished. Use the academic year search page after save to verify the created year and any nested terms.">
            <Button
              component={Link}
              to="/academics/academic-years/search"
              variant="default"
              disabled={isSubmitting}
            >
              Back to search
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create academic year
            </Button>
          </RecordPageFooter>
        </Stack>
      </form>
    </RecordPageShell>
  );
}
