import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { normalizeDateInputValue, parseDateInputValue } from "@/components/academic-year/academicYearDisplay";
import { createBillingPeriod } from "@/services/billing-service";
import { getRegistrationGroupReferenceOptions } from "@/services/registration-group-service";
import type {
  BillingPeriodDetailResponse,
  BillingPeriodStatus,
  BillingPeriodType,
  CreateBillingPeriodRequest,
} from "@/services/schemas/billing-schemas";
import type { RegistrationGroupReferenceOptionsResponse } from "@/services/schemas/registration-group-schemas";

type BillingBaseDateBasis =
  | "BILLING_PERIOD_START_DATE"
  | "BILLING_PERIOD_END_DATE"
  | "ACTUAL_START_PRELIMINARY_END_DATE";

type BillingPeriodCreateModalProps = {
  opened: boolean;
  onClose: () => void;
  onCreate: (billingPeriod: BillingPeriodDetailResponse) => void;
};

type BillingPeriodFormValues = {
  name: string;
  description: string;
  type: BillingPeriodType;
  status: BillingPeriodStatus;
  academicYearId: number | null;
  termId: number | null;
  startDate: string;
  endDate: string;
  actualStartPreliminaryEndDate: string;
  taxAcademicYear: string;
  taxAcademicYearLabel: string;
  taxAcademicTermCode: string;
  taxAcademicTermName: string;
  financialAidPeriodCode: string;
  financialAidPeriodName: string;
  courseBillingBasis: BillingBaseDateBasis;
  nonCourseBillingBasis: BillingBaseDateBasis;
  actualFromToDays: number;
  preliminaryFromToDays: number;
  allowReBilling: boolean;
  allowArBilling: boolean;
  includeInArStatements: boolean;
  allowBillingInCampusPortal: boolean;
  runPrelimInCampusPortalOnly: boolean;
  active: boolean;
  academicRecordsMapped: boolean;
  childrenAssigned: boolean;
};

const initialValues: BillingPeriodFormValues = {
  name: "",
  description: "",
  type: "STANDARD",
  status: "DRAFT",
  academicYearId: null,
  termId: null,
  startDate: "",
  endDate: "",
  actualStartPreliminaryEndDate: "",
  taxAcademicYear: "",
  taxAcademicYearLabel: "",
  taxAcademicTermCode: "",
  taxAcademicTermName: "",
  financialAidPeriodCode: "",
  financialAidPeriodName: "",
  courseBillingBasis: "BILLING_PERIOD_START_DATE",
  nonCourseBillingBasis: "BILLING_PERIOD_START_DATE",
  actualFromToDays: 0,
  preliminaryFromToDays: 0,
  allowReBilling: false,
  allowArBilling: true,
  includeInArStatements: false,
  allowBillingInCampusPortal: false,
  runPrelimInCampusPortalOnly: false,
  active: true,
  academicRecordsMapped: false,
  childrenAssigned: false,
};

const billingPeriodTypeOptions: Array<{ value: BillingPeriodType; label: string }> = [
  { value: "STANDARD", label: "Standard" },
  { value: "OPEN_ENDED", label: "Open Ended" },
];

const billingPeriodStatusOptions: Array<{ value: BillingPeriodStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const billingBaseDateBasisOptions: Array<{ value: BillingBaseDateBasis; label: string }> = [
  { value: "BILLING_PERIOD_START_DATE", label: "Billing Period Start Date" },
  { value: "BILLING_PERIOD_END_DATE", label: "Billing Period End Date" },
  { value: "ACTUAL_START_PRELIMINARY_END_DATE", label: "Actual Start/Preliminary End Date" },
];

function trimToNull(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue;
}

function dateToNull(value: string) {
  return value === "" ? null : value;
}

function buildCreateRequest(values: BillingPeriodFormValues): CreateBillingPeriodRequest {
  return {
    name: values.name.trim().toUpperCase(),
    description: values.description.trim(),
    type: values.type,
    status: values.status,
    academicYearId: values.academicYearId,
    termId: values.termId,
    startDate: dateToNull(values.startDate),
    endDate: dateToNull(values.endDate),
    actualStartPreliminaryEndDate: dateToNull(values.actualStartPreliminaryEndDate),
    taxAcademicYear: trimToNull(values.taxAcademicYear),
    taxAcademicYearLabel: trimToNull(values.taxAcademicYearLabel),
    taxAcademicTermCode: trimToNull(values.taxAcademicTermCode.toUpperCase()),
    taxAcademicTermName: trimToNull(values.taxAcademicTermName),
    financialAidPeriodCode: trimToNull(values.financialAidPeriodCode.toUpperCase()),
    financialAidPeriodName: trimToNull(values.financialAidPeriodName),
    courseBillingBasis: values.courseBillingBasis,
    nonCourseBillingBasis: values.nonCourseBillingBasis,
    actualFromToDays: values.actualFromToDays,
    preliminaryFromToDays: values.preliminaryFromToDays,
    active: values.active,
    allowReBilling: values.allowReBilling,
    allowArBilling: values.allowArBilling,
    includeInArStatements: values.includeInArStatements,
    allowBillingInCampusPortal: values.allowBillingInCampusPortal,
    runPrelimInCampusPortalOnly: values.runPrelimInCampusPortalOnly,
    academicRecordsMapped: values.academicRecordsMapped,
    childrenAssigned: values.childrenAssigned,
  };
}

export function BillingPeriodCreateModal({
  opened,
  onClose,
  onCreate,
}: BillingPeriodCreateModalProps) {
  const form = useForm<BillingPeriodFormValues>({ initialValues });
  const [referenceOptions, setReferenceOptions] =
    useState<RegistrationGroupReferenceOptionsResponse | null>(null);
  const [referenceOptionsError, setReferenceOptionsError] = useState<string | null>(null);
  const [referenceOptionsLoading, setReferenceOptionsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!opened) {
      form.setValues(initialValues);
      form.clearErrors();
      setReferenceOptionsError(null);
      setIsSubmitting(false);
      return undefined;
    }

    const abortController = new AbortController();
    setReferenceOptionsLoading(true);
    setReferenceOptionsError(null);

    getRegistrationGroupReferenceOptions({ signal: abortController.signal })
      .then((response) => {
        setReferenceOptions(response);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setReferenceOptionsError(
          error instanceof Error ? error.message : "Failed to load academic mapping options.",
        );
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setReferenceOptionsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [opened]);

  const academicYearSelectOptions =
    referenceOptions?.academicYears.map((academicYear) => ({
      value: String(academicYear.id),
      label: `${academicYear.name} (${academicYear.code})`,
    })) ?? [];

  const selectedAcademicYear = referenceOptions?.academicYears.find(
    (academicYear) => academicYear.id === form.values.academicYearId,
  );

  const termSelectOptions = useMemo(
    () =>
      selectedAcademicYear?.terms.map((term) => ({
        value: String(term.id),
        label: `${term.name} (${term.code})`,
      })) ?? [],
    [selectedAcademicYear],
  );

  async function handleSubmit(values: BillingPeriodFormValues) {
    const request = buildCreateRequest(values);

    if (!request.name) {
      form.setFieldError("name", "Name is required.");
      return;
    }

    if (!request.description) {
      form.setFieldError("description", "Description is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const billingPeriod = await createBillingPeriod({ request });
      onCreate(billingPeriod);
    } catch (error) {
      form.setFieldError(
        "name",
        error instanceof Error ? error.message : "Failed to create billing period.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAcademicYearChange(value: string | null) {
    const nextAcademicYear = referenceOptions?.academicYears.find(
      (academicYear) => String(academicYear.id) === value,
    );
    const nextTerm = nextAcademicYear?.terms[0] ?? null;

    form.setValues({
      ...form.values,
      academicYearId: nextAcademicYear?.id ?? null,
      termId: nextTerm?.id ?? null,
    });
  }

  function handleTermChange(value: string | null) {
    const nextTerm = selectedAcademicYear?.terms.find((term) => String(term.id) === value);
    form.setFieldValue("termId", nextTerm?.id ?? null);
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Create Billing Period" size="90vw" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="xl">
          {referenceOptionsError ? (
            <Alert color="yellow" title="Academic options unavailable">
              {referenceOptionsError}
            </Alert>
          ) : null}

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Stack gap="md">
              <TextInput
                label="Name"
                placeholder="2026SP"
                {...form.getInputProps("name")}
                onChange={(event) => {
                  form.setFieldValue("name", event.currentTarget.value.toUpperCase());
                }}
              />
              <TextInput
                label="Description"
                placeholder="Spring 2026"
                {...form.getInputProps("description")}
              />
              <Select
                label="Type"
                data={billingPeriodTypeOptions}
                {...form.getInputProps("type")}
                onChange={(value) => {
                  form.setFieldValue("type", (value ?? "STANDARD") as BillingPeriodType);
                }}
              />
              <Select
                label="Status"
                data={billingPeriodStatusOptions}
                {...form.getInputProps("status")}
                onChange={(value) => {
                  form.setFieldValue("status", (value ?? "DRAFT") as BillingPeriodStatus);
                }}
              />
            </Stack>

            <Stack gap="md">
              <DateInput
                label="Start Date"
                clearable
                value={parseDateInputValue(form.values.startDate)}
                onChange={(value) => {
                  form.setFieldValue("startDate", normalizeDateInputValue(value));
                }}
              />
              <DateInput
                label="End Date"
                clearable
                value={parseDateInputValue(form.values.endDate)}
                onChange={(value) => {
                  form.setFieldValue("endDate", normalizeDateInputValue(value));
                }}
              />
              <DateInput
                label="Actual Start/Preliminary End Date"
                clearable
                value={parseDateInputValue(form.values.actualStartPreliminaryEndDate)}
                onChange={(value) => {
                  form.setFieldValue(
                    "actualStartPreliminaryEndDate",
                    normalizeDateInputValue(value),
                  );
                }}
              />
            </Stack>

            <Stack gap="md">
              <Group align="flex-end" gap="sm" grow>
                <TextInput
                  label="1098-T Academic Year"
                  {...form.getInputProps("taxAcademicYear")}
                />
                <Checkbox label="Active" {...form.getInputProps("active", { type: "checkbox" })} />
              </Group>
              <TextInput
                label="1098-T Academic Term"
                value={`${form.values.taxAcademicTermCode} ${form.values.taxAcademicTermName}`.trim()}
                onChange={(event) => {
                  const [code, ...nameParts] = event.currentTarget.value.split(" ");
                  form.setFieldValue("taxAcademicTermCode", (code ?? "").toUpperCase());
                  form.setFieldValue("taxAcademicTermName", nameParts.join(" "));
                }}
              />
              <TextInput
                label="Financial Aid Period Code"
                {...form.getInputProps("financialAidPeriodCode")}
                onChange={(event) => {
                  form.setFieldValue(
                    "financialAidPeriodCode",
                    event.currentTarget.value.toUpperCase(),
                  );
                }}
              />
            </Stack>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <strong>Academic Mapping</strong>
                <Select
                  label="Academic Year"
                  placeholder="Choose academic year"
                  clearable
                  data={academicYearSelectOptions}
                  disabled={referenceOptionsLoading}
                  value={form.values.academicYearId ? String(form.values.academicYearId) : null}
                  onChange={handleAcademicYearChange}
                />
                <Select
                  label="Academic Term"
                  placeholder="Choose academic term"
                  clearable
                  data={termSelectOptions}
                  disabled={!form.values.academicYearId || referenceOptionsLoading}
                  value={form.values.termId ? String(form.values.termId) : null}
                  onChange={handleTermChange}
                />
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <strong>Base Billing Dates</strong>
                <Select
                  label="Date for Course Billing"
                  data={billingBaseDateBasisOptions}
                  {...form.getInputProps("courseBillingBasis")}
                  onChange={(value) => {
                    form.setFieldValue(
                      "courseBillingBasis",
                      (value ?? "BILLING_PERIOD_START_DATE") as BillingBaseDateBasis,
                    );
                  }}
                />
                <Select
                  label="Date for Non-Course Billing"
                  data={billingBaseDateBasisOptions}
                  {...form.getInputProps("nonCourseBillingBasis")}
                  onChange={(value) => {
                    form.setFieldValue(
                      "nonCourseBillingBasis",
                      (value ?? "BILLING_PERIOD_START_DATE") as BillingBaseDateBasis,
                    );
                  }}
                />
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <strong>Billing Offset Days</strong>
                <NumberInput
                  label="Actual From/To Days"
                  {...form.getInputProps("actualFromToDays")}
                />
                <NumberInput
                  label="Preliminary From/To Days"
                  {...form.getInputProps("preliminaryFromToDays")}
                />
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <strong>Additional Billing Mapping</strong>
                <TextInput
                  label="1098-T Academic Year Label"
                  placeholder="2025-2026"
                  {...form.getInputProps("taxAcademicYearLabel")}
                />
                <TextInput
                  label="Financial Aid Period Name"
                  placeholder="Spring 2026"
                  {...form.getInputProps("financialAidPeriodName")}
                />
              </Stack>
            </Paper>
          </SimpleGrid>

          <Group gap="md" wrap="wrap">
            <Checkbox
              label="Allow RE Billing"
              {...form.getInputProps("allowReBilling", { type: "checkbox" })}
            />
            <Checkbox
              label="Allow AR Billing"
              {...form.getInputProps("allowArBilling", { type: "checkbox" })}
            />
            <Checkbox
              label="Include in AR Statements"
              {...form.getInputProps("includeInArStatements", { type: "checkbox" })}
            />
            <Checkbox
              label="Allow Billing in Campus Portal"
              {...form.getInputProps("allowBillingInCampusPortal", { type: "checkbox" })}
            />
            <Checkbox
              label="Run Prelim in Campus Portal Only"
              {...form.getInputProps("runPrelimInCampusPortalOnly", { type: "checkbox" })}
            />
            <Checkbox
              label="Academic Records Mapped"
              {...form.getInputProps("academicRecordsMapped", { type: "checkbox" })}
            />
            <Checkbox
              label="Children Assigned"
              {...form.getInputProps("childrenAssigned", { type: "checkbox" })}
            />
          </Group>

          <Group justify="flex-end" gap="sm">
            <Button type="button" variant="default" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create period
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
