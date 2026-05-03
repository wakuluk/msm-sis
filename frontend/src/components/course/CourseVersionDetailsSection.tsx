import { Alert, Badge, Button, Grid, Group, Stack, Table, Text, Textarea, TextInput } from '@mantine/core';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { CourseVersionDetailResponse } from '@/services/schemas/course-schemas';
import { displayValue } from '@/utils/form-values';

type MakeCourseVersionCurrentState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string };

function displayTimestamp(value: string | null | undefined): string {
  return displayValue(value);
}

export function CourseVersionDetailsSection({
  courseVersion,
  makeCurrentState,
  onCopyVersion,
  onMakeCurrent,
}: {
  courseVersion: CourseVersionDetailResponse | null;
  makeCurrentState: MakeCourseVersionCurrentState;
  onCopyVersion: (courseVersion: CourseVersionDetailResponse) => void;
  onMakeCurrent: (courseVersion: CourseVersionDetailResponse) => Promise<void>;
}) {
  const isSaving = makeCurrentState.status === 'saving';

  return (
    <RecordPageSection
      title="Version Details"
      description="Select a version above to review its details and requisites."
    >
      <Grid.Col span={12}>
        {!courseVersion ? (
          <Alert color="gray" title="No version selected">
            Click a course version row to view its details.
          </Alert>
        ) : (
          <Stack gap="md">
            {makeCurrentState.status === 'error' ? (
              <Alert color="red" title="Unable to make version current">
                {makeCurrentState.message}
              </Alert>
            ) : null}

            <Grid gap="md">
              <ReadOnlyField
                label="Course Version ID"
                value={displayValue(courseVersion.courseVersionId)}
              />
              <ReadOnlyField label="Course Code" value={displayValue(courseVersion.courseCode)} />
              <ReadOnlyField
                label="Version Number"
                value={displayValue(courseVersion.versionNumber)}
              />
              <ReadOnlyField label="Subject" value={displayValue(courseVersion.subjectCode)} />
              <ReadOnlyField
                label="Course Number"
                value={displayValue(courseVersion.courseNumber)}
              />
              <ReadOnlyField label="Lab course" value={courseVersion.lab ? 'Yes' : 'No'} />
              <ReadOnlyField label="Current" value={courseVersion.current ? 'Yes' : 'No'} />
              <ReadOnlyField
                label="Variable Credit"
                value={courseVersion.variableCredit ? 'Yes' : 'No'}
              />
              <ReadOnlyField label="Min Credits" value={displayValue(courseVersion.minCredits)} />
              <ReadOnlyField label="Max Credits" value={displayValue(courseVersion.maxCredits)} />
              <ReadOnlyField label="Created At" value={displayTimestamp(courseVersion.createdAt)} />
              <ReadOnlyField label="Updated At" value={displayTimestamp(courseVersion.updatedAt)} />
              <Grid.Col span={12}>
                <TextInput label="Title" value={courseVersion.title} readOnly />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea
                  label="Catalog Description"
                  value={courseVersion.catalogDescription ?? ''}
                  placeholder="-"
                  minRows={4}
                  readOnly
                />
              </Grid.Col>
            </Grid>

            <Stack gap="sm">
              <Text fw={600}>Requisites</Text>
              {(courseVersion.requisites ?? []).length === 0 ? (
                <Alert color="gray" title="No requisites">
                  This course version does not list prerequisites or corequisites.
                </Alert>
              ) : (
                <Table.ScrollContainer minWidth={720}>
                  <Table withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Condition</Table.Th>
                        <Table.Th>Courses</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {(courseVersion.requisites ?? []).map((group) => (
                        <Table.Tr key={group.courseVersionRequisiteGroupId}>
                          <Table.Td>{group.requisiteType}</Table.Td>
                          <Table.Td>
                            {group.conditionType === 'ANY'
                              ? `Choose ${group.minimumRequired ?? 1}`
                              : 'All courses'}
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              {group.courses.length === 0
                                ? '-'
                                : group.courses.map((course) => (
                                    <Group key={course.courseVersionRequisiteCourseId} gap={4}>
                                      <Text size="sm">{course.courseCode ?? '-'}</Text>
                                      {course.lab ? (
                                        <Badge size="xs" variant="light" color="indigo">
                                          Lab
                                        </Badge>
                                      ) : null}
                                    </Group>
                                  ))}
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Stack>

            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => onCopyVersion(courseVersion)}
                disabled={isSaving}
              >
                Copy Version
              </Button>
              {!courseVersion.current ? (
                <Button onClick={() => void onMakeCurrent(courseVersion)} loading={isSaving}>
                  Make Current
                </Button>
              ) : null}
            </Group>
          </Stack>
        )}
      </Grid.Col>
    </RecordPageSection>
  );
}
