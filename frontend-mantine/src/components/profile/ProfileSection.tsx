import { SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import classes from './ProfileSection.module.css';

export type ProfileFieldConfig<TProfile, TFormValues extends Record<string, unknown>> = {
  editKey?: Extract<keyof TFormValues, string>;
  inputType?: 'email' | 'tel' | 'text';
  label: string;
  value: (profile: TProfile) => string;
};

type ProfileFieldProps<TProfile, TFormValues extends Record<string, unknown>> = {
  field: ProfileFieldConfig<TProfile, TFormValues>;
  form?: UseFormReturnType<TFormValues>;
  isEditing: boolean;
  profile: TProfile;
};

export type ProfileSectionProps<TProfile, TFormValues extends Record<string, unknown>> = {
  fields: ProfileFieldConfig<TProfile, TFormValues>[];
  form?: UseFormReturnType<TFormValues>;
  isEditing: boolean;
  profile: TProfile;
  title: string;
};

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function ProfileField<TProfile, TFormValues extends Record<string, unknown>>({
  field,
  form,
  isEditing,
  profile,
}: ProfileFieldProps<TProfile, TFormValues>) {
  const input = isEditing && field.editKey && form && (
    <TextInput
      className={classes.fieldInput}
      type={field.inputType ?? 'text'}
      {...form.getInputProps(field.editKey)}
    />
  );

  return (
    <div className={classes.fieldBlock}>
      <Stack gap={6}>
        <Text className={joinClasses(classes.label, 'portal-ui-label-text')}>{field.label}</Text>
        {input ? (
          input
        ) : (
          <Text className={joinClasses(classes.fieldValue, 'portal-ui-value-text')}>
            {field.value(profile)}
          </Text>
        )}
      </Stack>
    </div>
  );
}

export function ProfileSection<TProfile, TFormValues extends Record<string, unknown>>({
  fields,
  form,
  isEditing,
  profile,
  title,
}: ProfileSectionProps<TProfile, TFormValues>) {
  return (
    <Stack gap="lg" className={classes.sectionBlock}>
      <Title order={3} className={classes.sectionTitle}>
        {title}
      </Title>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" verticalSpacing="lg">
        {fields.map((field) => (
          <ProfileField
            key={field.label}
            field={field}
            form={form}
            isEditing={isEditing}
            profile={profile}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
