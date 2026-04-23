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
import { useNavigate } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { usePortalBackNavigation } from '@/portal/usePortalBackNavigation';
import {
  AcademicYearCreateWithTermsError,
  createAcademicYearWithTerms,
} from '@/services/academic-year-service';
import {
  initialAcademicTermFormValues,
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
  const { handleBack } = usePortalBackNavigation({
    fallbackPath: '/academics/academic-years/search',
  });
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
      const createdAcademicYear = await createAcademicYearWithTerms(values);
      navigate(`/academics/academic-years/${createdAcademicYear.academicYearId}`, {
        replace: true,
        state: {
          academicYear: createdAcademicYear,
        },
      });
    } catch (error) {
      if (error instanceof AcademicYearCreateWithTermsError) {
        navigate(`/academics/academic-years/${error.academicYear.academicYearId}`, {
          replace: true,
          state: {
            academicYear: error.academicYear,
            creationNotice: error.message,
          },
        });
        return;
      }

      setSubmitState({
        status: 'error',
        message: getErrorMessage(error, 'Failed to create academic year.'),
      });
    }
  }

  function handleAddTermGroup() {
    form.insertListItem('terms', {
      ...initialAcademicTermFormValues,
      terms: [],
    });
  }

  function handleRemoveTermGroup(index: number) {
    form.removeListItem('terms', index);
  }

  function handleAddGroupTerm(groupIndex: number) {
    form.insertListItem(`terms.${groupIndex}.terms`, {
      ...initialAcademicYearTermFormValues,
    });
  }

  function handleRemoveGroupTerm(groupIndex: number, termIndex: number) {
    form.removeListItem(`terms.${groupIndex}.terms`, termIndex);
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Workflow"
      title="Create Academic Year"
      description="Create an academic year and optionally define terms in one pass. Sub terms on this page are created only inside terms, and each new sub term still begins in Planned status."
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
            title="Terms"
            description="Standalone sub term rows are not available on this page anymore. Add terms here, then place each sub term inside a term before saving."
            action={
              <Button type="button" variant="light" onClick={handleAddTermGroup}>
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

                {form.values.terms.map((termGroup, groupIndex) => (
                  <Paper key={`term-group-${groupIndex}`} withBorder p="md" radius="sm">
                    <Stack gap="md">
                      <Group justify="space-between" align="center" wrap="wrap">
                        <Text fw={600}>Term {groupIndex + 1}</Text>
                        <Button
                          type="button"
                          variant="subtle"
                          color="red"
                          onClick={() => {
                            handleRemoveTermGroup(groupIndex);
                          }}
                        >
                          Remove term
                        </Button>
                      </Group>

                      <Grid gap="md">
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <TextInput
                            withAsterisk
                            label="Code"
                            placeholder="SEMESTER-1"
                            maxLength={20}
                            {...form.getInputProps(`terms.${groupIndex}.code`)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                          <TextInput
                            withAsterisk
                            label="Name"
                            placeholder="Semester 1"
                            maxLength={100}
                            {...form.getInputProps(`terms.${groupIndex}.name`)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                          <DateInput
                            withAsterisk
                            value={parseDateInputValue(termGroup.startDate)}
                            onChange={(value) => {
                              form.setFieldValue(
                                `terms.${groupIndex}.startDate`,
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
                            value={parseDateInputValue(termGroup.endDate)}
                            onChange={(value) => {
                              form.setFieldValue(
                                `terms.${groupIndex}.endDate`,
                                normalizeDateInputValue(value)
                              );
                            }}
                            valueFormat="YYYY-MM-DD"
                            label="End date"
                            placeholder="YYYY-MM-DD"
                            clearable
                          />
                        </Grid.Col>
                      </Grid>

                      <Stack gap="sm">
                        <Group justify="space-between" align="center" wrap="wrap">
                          <Text fw={500}>Sub terms in this term</Text>
                          <Button
                            type="button"
                            variant="light"
                            size="xs"
                            onClick={() => {
                              handleAddGroupTerm(groupIndex);
                            }}
                          >
                            Add sub term
                          </Button>
                        </Group>

                        {termGroup.terms.length === 0 ? (
                          <Alert color="gray" title="No sub terms in this term">
                            This term will be created without sub terms unless you add them here.
                          </Alert>
                        ) : null}

                        {termGroup.terms.map((term, termIndex) => (
                          <Paper
                            key={`term-group-${groupIndex}-term-${termIndex}`}
                            withBorder
                            p="md"
                            radius="sm"
                            bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
                          >
                            <Stack gap="md">
                              <Group justify="space-between" align="center" wrap="wrap">
                                <Text fw={500}>Sub term {termIndex + 1}</Text>
                                <Button
                                  type="button"
                                  variant="subtle"
                                  color="red"
                                  size="xs"
                                  onClick={() => {
                                    handleRemoveGroupTerm(groupIndex, termIndex);
                                  }}
                                >
                                  Remove sub term
                                </Button>
                              </Group>

                              <Grid gap="md">
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                  <TextInput
                                    withAsterisk
                                    label="Code"
                                    placeholder="FALL-2026-A"
                                    maxLength={20}
                                    {...form.getInputProps(
                                      `terms.${groupIndex}.terms.${termIndex}.code`
                                    )}
                                  />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 8 }}>
                                  <TextInput
                                    withAsterisk
                                    label="Name"
                                    placeholder="Fall 2026 Block A"
                                    maxLength={100}
                                    {...form.getInputProps(
                                      `terms.${groupIndex}.terms.${termIndex}.name`
                                    )}
                                  />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                  <DateInput
                                    withAsterisk
                                    value={parseDateInputValue(term.startDate)}
                                    onChange={(value) => {
                                      form.setFieldValue(
                                        `terms.${groupIndex}.terms.${termIndex}.startDate`,
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
                                        `terms.${groupIndex}.terms.${termIndex}.endDate`,
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
                                    {...form.getInputProps(
                                      `terms.${groupIndex}.terms.${termIndex}.sortOrder`
                                    )}
                                  />
                                </Grid.Col>
                              </Grid>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid.Col>
          </RecordPageSection>

          <RecordPageFooter description="New academic years start inactive and unpublished. Use the academic year detail page after save to review the created year, the generated terms, the generated sub terms, and any follow-up work.">
            <Button
              type="button"
              onClick={handleBack}
              variant="default"
              disabled={isSubmitting}
            >
              Back
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
