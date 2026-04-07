import type { HTMLInputTypeAttribute } from 'react';
import type { UseFormReturnType } from '@mantine/form';
import { Stack, Table, Text, TextInput, Title } from '@mantine/core';
import classes from './DetailsTableSection.module.css';

export type DetailsTableFieldConfig<
  TRecord,
  TFormValues extends Record<string, string> = Record<never, string>,
> = {
  editKey?: Extract<keyof TFormValues, string>;
  inputType?: HTMLInputTypeAttribute;
  label: string;
  placeholder?: string;
  value: (record: TRecord) => string;
};

export type DetailsTableSectionConfig<
  TRecord,
  TFormValues extends Record<string, string> = Record<never, string>,
> = {
  fields: DetailsTableFieldConfig<TRecord, TFormValues>[];
  title: string;
};

type DetailsTableSectionProps<
  TRecord,
  TFormValues extends Record<string, string> = Record<never, string>,
> = {
  className?: string;
  form?: UseFormReturnType<TFormValues>;
  getInputPlaceholder?: (
    field: DetailsTableFieldConfig<TRecord, TFormValues>,
  ) => string | undefined;
  isEditing?: boolean;
  minTableWidth?: number;
  record: TRecord;
  section: DetailsTableSectionConfig<TRecord, TFormValues>;
};

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export function DetailsTableSection<
  TRecord,
  TFormValues extends Record<string, string> = Record<never, string>,
>({
  className,
  form,
  getInputPlaceholder,
  isEditing = false,
  minTableWidth = 360,
  record,
  section,
}: DetailsTableSectionProps<TRecord, TFormValues>) {
  return (
    <div className={joinClasses(classes.sectionCard, className)}>
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={3} className={classes.sectionTitle}>
            {section.title}
          </Title>
        </Stack>

        <Table.ScrollContainer minWidth={minTableWidth} className={classes.tableWrap}>
          <Table
            variant="vertical"
            layout="fixed"
            horizontalSpacing="sm"
            verticalSpacing={4}
            withTableBorder
            withColumnBorders
            classNames={{ table: classes.sectionTable }}
          >
            <Table.Tbody>
              {section.fields.map((field) => {
                const isEditable = Boolean(field.editKey) && Boolean(form);

                return (
                  <Table.Tr key={field.label}>
                    <Table.Th
                      className={joinClasses(
                        classes.rowLabel,
                        isEditing && isEditable && classes.editableLabelCell,
                        isEditing && !isEditable && classes.readOnlyLabelCell,
                      )}
                    >
                      <div className={joinClasses(classes.cellContent, classes.rowLabelContent)}>
                        <Text
                          className={joinClasses(
                            classes.rowLabelText,
                            isEditing && isEditable && 'portal-ui-on-accent-text',
                            'portal-ui-label-text',
                          )}
                        >
                          {field.label}
                        </Text>
                      </div>
                    </Table.Th>
                    <Table.Td
                      className={joinClasses(
                        classes.rowValue,
                        isEditing && isEditable && classes.editableValueCell,
                        isEditing && !isEditable && classes.readOnlyValueCell,
                      )}
                    >
                      <div className={classes.cellContent}>
                        {isEditing && isEditable && field.editKey && form ? (
                          <TextInput
                            variant="unstyled"
                            placeholder={field.placeholder ?? getInputPlaceholder?.(field)}
                            classNames={{
                              input: classes.tableInputField,
                              root: classes.tableInputRoot,
                            }}
                            type={field.inputType ?? 'text'}
                            {...form.getInputProps(field.editKey)}
                          />
                        ) : (
                          <Text className={classes.valueText}>{field.value(record)}</Text>
                        )}
                      </div>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Stack>
    </div>
  );
}
