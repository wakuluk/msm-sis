import { DateInput } from '@mantine/dates';
import { type UseFormReturnType } from '@mantine/form';
import {
  Alert,
  Button,
  Grid,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import type {
  AcademicYearAddTermsFormValues,
  AcademicYearCreateResponse,
} from '@/services/schemas/academic-years-schemas';
import { AcademicYearTermGroupsSection } from './AcademicYearTermGroupsSection';
import {
  displayDate,
  displayValue,
  normalizeDateInputValue,
  parseDateInputValue,
} from './academicYearDisplay';

type AcademicYearTermsSectionProps = {
  academicYearId: number;
  hasTermGroups: boolean;
  sortedTermGroups: AcademicYearCreateResponse['terms'];
  sortedLegacyTerms: AcademicYearCreateResponse['subTerms'];
  isEditing: boolean;
  isAddingTerms: boolean;
  addTermsInProgress: boolean;
  addTermsError: string | null;
  addTermsSucceeded: boolean;
  addTermsForm: UseFormReturnType<AcademicYearAddTermsFormValues>;
  saveInProgress: boolean;
  onStartAddingTerms: () => void;
  onAddTermRow: () => void;
  onRemoveTermRow: (index: number) => void;
  onCancelAddingTerms: () => void;
  onSaveNewTerms: () => void;
};

export function AcademicYearTermsSection({
  academicYearId,
  hasTermGroups,
  sortedTermGroups,
  sortedLegacyTerms,
  isEditing,
  isAddingTerms,
  addTermsInProgress,
  addTermsError,
  addTermsSucceeded,
  addTermsForm,
  saveInProgress,
  onStartAddingTerms,
  onAddTermRow,
  onRemoveTermRow,
  onCancelAddingTerms,
  onSaveNewTerms,
}: AcademicYearTermsSectionProps) {
  if (hasTermGroups) {
    return (
      <AcademicYearTermGroupsSection
        academicYearId={academicYearId}
        termGroups={sortedTermGroups}
      />
    );
  }

  function renderAddTermsActions() {
    return (
      <Group gap="sm" wrap="wrap" justify="flex-end">
        <Button type="button" variant="light" onClick={onAddTermRow} disabled={addTermsInProgress}>
          Add row
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={onCancelAddingTerms}
          disabled={addTermsInProgress}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSaveNewTerms}
          loading={addTermsInProgress}
          disabled={addTermsForm.values.terms.length === 0}
        >
          Save sub terms
        </Button>
      </Group>
    );
  }

  return (
    <RecordPageSection
      title="Sub Terms"
      action={
        isEditing ? null : isAddingTerms ? (
          renderAddTermsActions()
        ) : (
          <Group gap="sm" wrap="wrap" justify="flex-end">
            {addTermsSucceeded ? (
              <Text size="sm" c="teal">
                Sub terms added.
              </Text>
            ) : null}
            <Button
              type="button"
              variant="light"
              onClick={onStartAddingTerms}
              disabled={saveInProgress}
            >
              Add sub terms
            </Button>
          </Group>
        )
      }
    >
      <Grid.Col span={12}>
        <Stack gap="md">
          {addTermsError ? (
            <Alert color="red" title="Unable to add sub terms">
              {addTermsError}
            </Alert>
          ) : null}

          {sortedLegacyTerms.length === 0 ? (
            <Alert color="gray" title="No sub terms on this academic year">
              {isAddingTerms
                ? 'This academic year does not have any sub terms yet. Use the rows below to add the first ones.'
                : 'This academic year was created without any sub terms.'}
            </Alert>
          ) : (
            <Table.ScrollContainer minWidth={760}>
              <Table withTableBorder withColumnBorders striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Sort order</Table.Th>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Start date</Table.Th>
                    <Table.Th>End date</Table.Th>
                    <Table.Th>Course Offerings</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedLegacyTerms.map((term) => (
                    <Table.Tr key={term.subTermId}>
                      <Table.Td>{term.sortOrder}</Table.Td>
                      <Table.Td>
                        <Link
                          to={`/academics/academic-sub-term/${term.subTermId}`}
                          state={{ academicYearId }}
                        >
                          {term.code}
                        </Link>
                      </Table.Td>
                      <Table.Td>{term.name}</Table.Td>
                      <Table.Td>{displayDate(term.startDate)}</Table.Td>
                      <Table.Td>{displayDate(term.endDate)}</Table.Td>
                      <Table.Td>{displayValue(term.courseOfferingCount)}</Table.Td>
                      <Table.Td>
                        {displayValue(term.subTermStatusName ?? term.subTermStatusCode)}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}

          {!hasTermGroups && isAddingTerms ? (
            <>
              {addTermsForm.values.terms.length === 0 ? (
                <Alert color="gray" title="No new sub term rows">
                  Add a row before saving new sub terms.
                </Alert>
              ) : null}

              {addTermsForm.values.terms.map((term, index) => (
                <Paper key={`new-term-${index}`} withBorder p="md" radius="sm">
                  <Stack gap="md">
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Text fw={600}>New sub term {index + 1}</Text>
                      <Button
                        type="button"
                        variant="subtle"
                        color="red"
                        onClick={() => {
                          onRemoveTermRow(index);
                        }}
                        disabled={addTermsInProgress}
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
                          {...addTermsForm.getInputProps(`terms.${index}.code`)}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 8 }}>
                        <TextInput
                          withAsterisk
                          label="Name"
                          placeholder="Fall 2026"
                          maxLength={100}
                          {...addTermsForm.getInputProps(`terms.${index}.name`)}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <DateInput
                          withAsterisk
                          value={parseDateInputValue(term.startDate)}
                          onChange={(value) => {
                            addTermsForm.setFieldValue(
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
                            addTermsForm.setFieldValue(
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
                          {...addTermsForm.getInputProps(`terms.${index}.sortOrder`)}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Paper>
              ))}

              {renderAddTermsActions()}
            </>
          ) : null}
        </Stack>
      </Grid.Col>
    </RecordPageSection>
  );
}
