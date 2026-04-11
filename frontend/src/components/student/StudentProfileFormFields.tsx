import { Grid, Loader, Select, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import type { StudentProfileFormValues } from '@/services/schemas/student-schemas';
import standardInputClasses from '@/styles/StandardInput.module.css';
import createClasses from '@/pages/portal/StudentCreate.module.css';
import type { StudentReferenceSelectOption } from './useStudentReferenceOptions';

type SharedFormProps<TValues extends StudentProfileFormValues> = {
  form: UseFormReturnType<TValues>;
};

type ReferenceFieldProps<TValues extends StudentProfileFormValues> = SharedFormProps<TValues> & {
  classStandingOptions?: StudentReferenceSelectOption[];
  ethnicityOptions?: StudentReferenceSelectOption[];
  genderOptions?: StudentReferenceSelectOption[];
  referenceOptionsLoading?: boolean;
  showRequiredNames?: boolean;
};

const selectClassNames = {
  input: standardInputClasses.input,
  option: createClasses.selectOption,
  section: standardInputClasses.section,
};

function getSelectNothingFoundMessage(referenceOptionsLoading: boolean) {
  return referenceOptionsLoading ? 'Loading options...' : 'No options found';
}

export function StudentIdentityFormFields<TValues extends StudentProfileFormValues>({
  form,
  ethnicityOptions = [],
  genderOptions = [],
  referenceOptionsLoading = false,
  showRequiredNames = false,
}: ReferenceFieldProps<TValues>) {
  return (
    <>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          withAsterisk={showRequiredNames}
          label="Last name"
          placeholder="Enter last name"
          {...form.getInputProps('lastName')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          withAsterisk={showRequiredNames}
          label="First name"
          placeholder="Enter first name"
          {...form.getInputProps('firstName')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Middle name"
          placeholder="Enter middle name"
          {...form.getInputProps('middleName')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Name suffix"
          placeholder="Jr., III, etc."
          {...form.getInputProps('nameSuffix')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Preferred name"
          placeholder="Enter preferred name"
          {...form.getInputProps('preferredName')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Select
          searchable
          clearable
          label="Gender"
          data={genderOptions}
          value={form.values.genderId || null}
          onChange={(value) => {
            form.getInputProps('genderId').onChange(value ?? '');
          }}
          placeholder="Select gender"
          rightSection={referenceOptionsLoading ? <Loader size="xs" /> : undefined}
          nothingFoundMessage={getSelectNothingFoundMessage(referenceOptionsLoading)}
          classNames={selectClassNames}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Select
          searchable
          clearable
          label="Ethnicity"
          data={ethnicityOptions}
          value={form.values.ethnicityId || null}
          onChange={(value) => {
            form.getInputProps('ethnicityId').onChange(value ?? '');
          }}
          placeholder="Select ethnicity"
          rightSection={referenceOptionsLoading ? <Loader size="xs" /> : undefined}
          nothingFoundMessage={getSelectNothingFoundMessage(referenceOptionsLoading)}
          classNames={selectClassNames}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <DateInput
          value={form.values.dateOfBirth || null}
          onChange={(value) => {
            form.getInputProps('dateOfBirth').onChange(value ?? '');
          }}
          valueFormat="YYYY-MM-DD"
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          clearable
        />
      </Grid.Col>
    </>
  );
}

export function StudentRecordFormFields<TValues extends StudentProfileFormValues>({
  form,
  classStandingOptions = [],
  referenceOptionsLoading = false,
}: ReferenceFieldProps<TValues>) {
  return (
    <>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <Select
          searchable
          clearable
          label="Class standing"
          data={classStandingOptions}
          value={form.values.classStandingId || null}
          onChange={(value) => {
            form.getInputProps('classStandingId').onChange(value ?? '');
          }}
          placeholder="Select class standing"
          rightSection={referenceOptionsLoading ? <Loader size="xs" /> : undefined}
          nothingFoundMessage={getSelectNothingFoundMessage(referenceOptionsLoading)}
          classNames={selectClassNames}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <DateInput
          value={form.values.estimatedGradDate || null}
          onChange={(value) => {
            form.getInputProps('estimatedGradDate').onChange(value ?? '');
          }}
          valueFormat="YYYY-MM-DD"
          label="Estimated grad date"
          placeholder="YYYY-MM-DD"
          clearable
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Alt ID"
          placeholder="Enter alternate ID"
          {...form.getInputProps('altId')}
        />
      </Grid.Col>
    </>
  );
}

export function StudentContactFormFields<TValues extends StudentProfileFormValues>({
  form,
}: SharedFormProps<TValues>) {
  return (
    <>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput label="Email" placeholder="name@example.com" {...form.getInputProps('email')} />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="Phone"
          placeholder="Enter phone number"
          {...form.getInputProps('phone')}
        />
      </Grid.Col>
    </>
  );
}

export function StudentAddressFormFields<TValues extends StudentProfileFormValues>({
  form,
}: SharedFormProps<TValues>) {
  return (
    <>
      <Grid.Col span={12}>
        <TextInput
          label="Address line 1"
          placeholder="Street address"
          maxLength={255}
          {...form.getInputProps('addressLine1')}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <TextInput
          label="Address line 2"
          placeholder="Apartment, suite, unit, etc."
          maxLength={255}
          {...form.getInputProps('addressLine2')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="City"
          placeholder="Enter city"
          maxLength={100}
          {...form.getInputProps('city')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          label="State / region"
          placeholder="Enter state or region"
          maxLength={100}
          {...form.getInputProps('stateRegion')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Postal code"
          placeholder="Enter postal code"
          maxLength={20}
          {...form.getInputProps('postalCode')}
        />
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 4 }}>
        <TextInput
          label="Country code"
          placeholder="US"
          maxLength={2}
          {...form.getInputProps('countryCode')}
        />
      </Grid.Col>
    </>
  );
}
