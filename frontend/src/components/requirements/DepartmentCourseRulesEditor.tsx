import { Alert, Button, Group, NumberInput, Select, Stack, Table, TextInput, Title } from '@mantine/core';
import type { DepartmentCourseRuleDraft } from '@/components/requirements/requirementFormTypes';

export type DepartmentSelectOption = {
  value: string;
  label: string;
};

export function DepartmentCourseRulesEditor({
  rules,
  departmentOptions,
  disabled = false,
  loading,
  error,
  titleVariant = 'title',
  onAddRule,
  onDepartmentChange,
  onRemoveRule,
  onUpdateRule,
}: {
  rules: DepartmentCourseRuleDraft[];
  departmentOptions: DepartmentSelectOption[];
  disabled?: boolean;
  loading: boolean;
  error: string | null;
  titleVariant?: 'title' | 'badge';
  onAddRule: () => void;
  onDepartmentChange: (rowId: number, departmentId: string | null) => void;
  onRemoveRule: (rowId: number) => void;
  onUpdateRule: (
    rowId: number,
    patch: Partial<Omit<DepartmentCourseRuleDraft, 'id'>>
  ) => void;
}) {
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        {titleVariant === 'title' ? (
          <Title order={3}>Department Course Rules</Title>
        ) : (
          <Title order={4}>Department Course Rules</Title>
        )}
        <Button variant="default" onClick={onAddRule} disabled={disabled}>
          Add Rule
        </Button>
      </Group>

      {rules.length === 0 ? (
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
              {rules.map((rule) => (
                <Table.Tr key={rule.id}>
                  <Table.Td>
                    <Select
                      searchable
                      clearable
                      placeholder="Select department"
                      data={departmentOptions}
                      value={rule.departmentId ? String(rule.departmentId) : null}
                      loading={loading}
                      error={error ?? undefined}
                      nothingFoundMessage="No departments found."
                      onChange={(value) => {
                        onDepartmentChange(rule.id, value);
                      }}
                      disabled={disabled}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      placeholder="300"
                      min={0}
                      value={rule.minimumCourseNumber}
                      onChange={(value) => {
                        onUpdateRule(rule.id, {
                          minimumCourseNumber: value,
                        });
                      }}
                      disabled={disabled}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      placeholder="Optional"
                      min={0}
                      value={rule.maximumCourseNumber}
                      onChange={(value) => {
                        onUpdateRule(rule.id, {
                          maximumCourseNumber: value,
                        });
                      }}
                      disabled={disabled}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      min={0}
                      value={rule.minimumCredits}
                      onChange={(value) => {
                        onUpdateRule(rule.id, {
                          minimumCredits: value,
                        });
                      }}
                      disabled={disabled}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      min={0}
                      value={rule.minimumCourses}
                      onChange={(value) => {
                        onUpdateRule(rule.id, {
                          minimumCourses: value,
                        });
                      }}
                      disabled={disabled}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      placeholder="Optional"
                      value={rule.minimumGrade}
                      onChange={(event) => {
                        onUpdateRule(rule.id, {
                          minimumGrade: event.currentTarget.value,
                        });
                      }}
                      disabled={disabled}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Button
                      color="red"
                      variant="light"
                      size="xs"
                      onClick={() => {
                        onRemoveRule(rule.id);
                      }}
                      disabled={disabled}
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
  );
}
