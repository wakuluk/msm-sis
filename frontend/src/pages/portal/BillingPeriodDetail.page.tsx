import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Container,
  Grid,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Stepper,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Link, useParams } from "react-router-dom";
import { normalizeDateInputValue, parseDateInputValue } from "@/components/academic-year/academicYearDisplay";
import { ReadOnlyField } from "@/components/fields/ReadOnlyField";
import {
  getBillingPeriod,
  listBillingPeriodRuns,
  patchBillingPeriod,
  runBillingPeriod,
} from "@/services/billing-service";
import { getRegistrationGroupReferenceOptions } from "@/services/registration-group-service";
import type {
  BillingPeriodDetailResponse,
  BillingPeriodRunResponse,
  BillingPeriodRunStatus,
  BillingPeriodRunTriggerSource,
  BillingPeriodStatus,
  BillingPeriodType,
  PatchBillingPeriodRequest,
} from "@/services/schemas/billing-schemas";
import type { RegistrationGroupReferenceOptionsResponse } from "@/services/schemas/registration-group-schemas";

type BillingBaseDateBasis =
  | "BILLING_PERIOD_START_DATE"
  | "BILLING_PERIOD_END_DATE"
  | "ACTUAL_START_PRELIMINARY_END_DATE";

type BillingPeriodDraft = {
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
  active: boolean;
  allowReBilling: boolean;
  allowArBilling: boolean;
  includeInArStatements: boolean;
  allowBillingInCampusPortal: boolean;
  runPrelimInCampusPortalOnly: boolean;
  academicRecordsMapped: boolean;
  childrenAssigned: boolean;
};

const billingPeriodTypeOptions: Array<{ value: BillingPeriodType; label: string }> = [
  { value: "STANDARD", label: "Standard" },
  { value: "OPEN_ENDED", label: "Open Ended" },
];

const billingBaseDateBasisOptions: Array<{ value: BillingBaseDateBasis; label: string }> = [
  { value: "BILLING_PERIOD_START_DATE", label: "Billing Period Start Date" },
  { value: "BILLING_PERIOD_END_DATE", label: "Billing Period End Date" },
  { value: "ACTUAL_START_PRELIMINARY_END_DATE", label: "Actual Start/Preliminary End Date" },
];

const billingPeriodStatusSteps: BillingPeriodStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const editableFieldStyles = {
  input: {
    borderColor: "var(--mantine-color-blue-5)",
    backgroundColor: "rgba(34, 139, 230, 0.08)",
  },
};

const editableCheckboxStyles = {
  root: {
    border: "1px solid var(--mantine-color-blue-3)",
    borderRadius: "var(--mantine-radius-sm)",
    backgroundColor: "rgba(34, 139, 230, 0.08)",
    padding: "0.55rem 0.65rem",
  },
  input: {
    borderColor: "var(--mantine-color-blue-5)",
  },
};

function statusLabel(status: BillingPeriodStatus) {
  if (status === "PUBLISHED") {
    return "Published";
  }

  if (status === "ARCHIVED") {
    return "Archived";
  }

  return "Draft";
}

function typeLabel(type: BillingPeriodType) {
  return type === "OPEN_ENDED" ? "Open Ended" : "Standard";
}

function baseDateBasisLabel(value: string) {
  return billingBaseDateBasisOptions.find((option) => option.value === value)?.label ?? value;
}

function nullToEmpty(value: string | null) {
  return value ?? "";
}

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function dateToNull(value: string) {
  return value === "" ? null : value;
}

function mapBillingPeriodToDraft(period: BillingPeriodDetailResponse): BillingPeriodDraft {
  return {
    name: period.name,
    description: period.description,
    type: period.type,
    status: period.status,
    academicYearId: period.academicYearId,
    termId: period.termId,
    startDate: nullToEmpty(period.startDate),
    endDate: nullToEmpty(period.endDate),
    actualStartPreliminaryEndDate: nullToEmpty(period.actualStartPreliminaryEndDate),
    taxAcademicYear: nullToEmpty(period.taxAcademicYear),
    taxAcademicYearLabel: nullToEmpty(period.taxAcademicYearLabel),
    taxAcademicTermCode: nullToEmpty(period.taxAcademicTermCode),
    taxAcademicTermName: nullToEmpty(period.taxAcademicTermName),
    financialAidPeriodCode: nullToEmpty(period.financialAidPeriodCode),
    financialAidPeriodName: nullToEmpty(period.financialAidPeriodName),
    courseBillingBasis: period.courseBillingBasis as BillingBaseDateBasis,
    nonCourseBillingBasis: period.nonCourseBillingBasis as BillingBaseDateBasis,
    actualFromToDays: period.actualFromToDays,
    preliminaryFromToDays: period.preliminaryFromToDays,
    active: period.active,
    allowReBilling: period.allowReBilling,
    allowArBilling: period.allowArBilling,
    includeInArStatements: period.includeInArStatements,
    allowBillingInCampusPortal: period.allowBillingInCampusPortal,
    runPrelimInCampusPortalOnly: period.runPrelimInCampusPortalOnly,
    academicRecordsMapped: period.academicRecordsMapped,
    childrenAssigned: period.childrenAssigned,
  };
}

function buildPatchRequest(draft: BillingPeriodDraft): PatchBillingPeriodRequest {
  return {
    name: draft.name.trim().toUpperCase(),
    description: draft.description.trim(),
    type: draft.type,
    status: draft.status,
    academicYearId: draft.academicYearId,
    termId: draft.termId,
    startDate: dateToNull(draft.startDate),
    endDate: dateToNull(draft.endDate),
    actualStartPreliminaryEndDate: dateToNull(draft.actualStartPreliminaryEndDate),
    taxAcademicYear: emptyToNull(draft.taxAcademicYear),
    taxAcademicYearLabel: emptyToNull(draft.taxAcademicYearLabel),
    taxAcademicTermCode: emptyToNull(draft.taxAcademicTermCode.toUpperCase()),
    taxAcademicTermName: emptyToNull(draft.taxAcademicTermName),
    financialAidPeriodCode: emptyToNull(draft.financialAidPeriodCode.toUpperCase()),
    financialAidPeriodName: emptyToNull(draft.financialAidPeriodName),
    courseBillingBasis: draft.courseBillingBasis,
    nonCourseBillingBasis: draft.nonCourseBillingBasis,
    actualFromToDays: draft.actualFromToDays,
    preliminaryFromToDays: draft.preliminaryFromToDays,
    active: draft.active,
    allowReBilling: draft.allowReBilling,
    allowArBilling: draft.allowArBilling,
    includeInArStatements: draft.includeInArStatements,
    allowBillingInCampusPortal: draft.allowBillingInCampusPortal,
    runPrelimInCampusPortalOnly: draft.runPrelimInCampusPortalOnly,
    academicRecordsMapped: draft.academicRecordsMapped,
    childrenAssigned: draft.childrenAssigned,
  };
}

function fieldValue(value: string | null) {
  return value && value.trim() !== "" ? value : "Not set";
}

function ReadOnlyCheckbox({ label, checked }: { label: string; checked: boolean }) {
  return <Checkbox label={label} checked={checked} readOnly />;
}

function getBillingPeriodStatusStep(status: BillingPeriodStatus) {
  return Math.max(0, billingPeriodStatusSteps.indexOf(status));
}

function getBillingPeriodStatusAtStep(step: number) {
  return billingPeriodStatusSteps[step] ?? null;
}

function getBillingPeriodRunStatusColor(status: BillingPeriodRunStatus) {
  if (status === "COMPLETED") {
    return "green";
  }

  if (status === "FAILED") {
    return "red";
  }

  if (status === "RUNNING") {
    return "yellow";
  }

  return "blue";
}

function getBillingPeriodRunTriggerColor(triggerSource: BillingPeriodRunTriggerSource) {
  return triggerSource === "SYSTEM" ? "grape" : "indigo";
}

function displayBillingPeriodRunTrigger(run: BillingPeriodRunResponse) {
  return run.triggerSource === "SYSTEM" ? "System" : (run.triggeredByUserEmail ?? "Unknown user");
}

function formatRunDateTime(value: string | null) {
  if (!value) {
    return "Not started";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

export function BillingPeriodDetailPage() {
  const { billingPeriodId } = useParams();
  const parsedBillingPeriodId = Number(billingPeriodId);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriodDetailResponse | null>(null);
  const [draft, setDraft] = useState<BillingPeriodDraft | null>(null);
  const [referenceOptions, setReferenceOptions] =
    useState<RegistrationGroupReferenceOptionsResponse | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusSavingTarget, setStatusSavingTarget] = useState<BillingPeriodStatus | null>(null);
  const [isRunningBilling, setIsRunningBilling] = useState(false);
  const [runHistoryState, setRunHistoryState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [billingRunMessage, setBillingRunMessage] = useState<string | null>(null);
  const [billingRunError, setBillingRunError] = useState<string | null>(null);
  const [runHistoryError, setRunHistoryError] = useState<string | null>(null);
  const [billingRuns, setBillingRuns] = useState<BillingPeriodRunResponse[]>([]);

  useEffect(() => {
    if (!Number.isInteger(parsedBillingPeriodId) || parsedBillingPeriodId <= 0) {
      return undefined;
    }

    const abortController = new AbortController();
    setLoadState("loading");
    setLoadError(null);

    Promise.all([
      getBillingPeriod({
        billingPeriodId: parsedBillingPeriodId,
        signal: abortController.signal,
      }),
      getRegistrationGroupReferenceOptions({ signal: abortController.signal }),
    ])
      .then(([period, options]) => {
        setBillingPeriod(period);
        setDraft(mapBillingPeriodToDraft(period));
        setReferenceOptions(options);
        setLoadState("success");
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : "Failed to load billing period.");
        setLoadState("error");
      });

    return () => {
      abortController.abort();
    };
  }, [parsedBillingPeriodId]);

  useEffect(() => {
    if (!Number.isInteger(parsedBillingPeriodId) || parsedBillingPeriodId <= 0) {
      return undefined;
    }

    const abortController = new AbortController();
    setRunHistoryState("loading");
    setRunHistoryError(null);

    listBillingPeriodRuns({
      billingPeriodId: parsedBillingPeriodId,
      signal: abortController.signal,
    })
      .then((runs) => {
        setBillingRuns(runs);
        setRunHistoryState("success");
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setRunHistoryError(
          error instanceof Error ? error.message : "Failed to load billing run history.",
        );
        setRunHistoryState("error");
      });

    return () => {
      abortController.abort();
    };
  }, [parsedBillingPeriodId]);

  const selectedAcademicYear = referenceOptions?.academicYears.find(
    (academicYear) => academicYear.id === draft?.academicYearId,
  );

  const academicYearSelectOptions =
    referenceOptions?.academicYears.map((academicYear) => ({
      value: String(academicYear.id),
      label: `${academicYear.name} (${academicYear.code})`,
    })) ?? [];

  const termSelectOptions = useMemo(
    () =>
      selectedAcademicYear?.terms.map((term) => ({
        value: String(term.id),
        label: `${term.name} (${term.code})`,
      })) ?? [],
    [selectedAcademicYear],
  );

  const displayedStatus = isEditing
    ? (draft?.status ?? billingPeriod?.status ?? "DRAFT")
    : (billingPeriod?.status ?? "DRAFT");
  const displayedStatusStep = getBillingPeriodStatusStep(displayedStatus);
  const previousStatus = isEditing ? getBillingPeriodStatusAtStep(displayedStatusStep - 1) : null;
  const nextStatus = isEditing ? getBillingPeriodStatusAtStep(displayedStatusStep + 1) : null;

  if (!Number.isInteger(parsedBillingPeriodId) || parsedBillingPeriodId <= 0) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Invalid billing period">
          This billing period route does not include a valid period id.
        </Alert>
      </Container>
    );
  }

  if (loadState === "loading") {
    return (
      <Container size="md" py="xl">
        <Paper withBorder radius="md" p="lg">
          <Group gap="sm">
            <Loader size="sm" />
            <Text>Loading billing period...</Text>
          </Group>
        </Paper>
      </Container>
    );
  }

  if (loadState === "error" || !billingPeriod || !draft) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Billing period not found">
          {loadError ?? "Unable to load this billing period."}
        </Alert>
      </Container>
    );
  }

  function updateDraft<K extends keyof BillingPeriodDraft>(key: K, value: BillingPeriodDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setSaveError(null);
  }

  async function updateBillingPeriodStatus(status: BillingPeriodStatus) {
    setStatusSavingTarget(status);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const updatedPeriod = await patchBillingPeriod({
        billingPeriodId: parsedBillingPeriodId,
        request: { status },
      });
      setBillingPeriod(updatedPeriod);
      setDraft((current) =>
        current ? { ...current, status: updatedPeriod.status } : mapBillingPeriodToDraft(updatedPeriod),
      );
      setSaveMessage(`Billing period moved to ${statusLabel(updatedPeriod.status)}.`);
      setBillingRunMessage(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update billing period status.");
    } finally {
      setStatusSavingTarget(null);
    }
  }

  function updateAcademicYear(value: string | null) {
    const nextAcademicYear = referenceOptions?.academicYears.find(
      (academicYear) => String(academicYear.id) === value,
    );
    const nextTerm = nextAcademicYear?.terms[0] ?? null;

    setDraft((current) =>
      current
        ? {
            ...current,
            academicYearId: nextAcademicYear?.id ?? null,
            termId: nextTerm?.id ?? null,
          }
        : current,
    );
    setSaveError(null);
  }

  function updateAcademicTerm(value: string | null) {
    const nextTerm = selectedAcademicYear?.terms.find((term) => String(term.id) === value);
    updateDraft("termId", nextTerm?.id ?? null);
  }

  async function handleSave() {
    if (!draft) {
      return;
    }

    const request = buildPatchRequest(draft);

    if (!request.name || !request.description) {
      setSaveError("Name and description are required.");
      setSaveMessage(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const updatedPeriod = await patchBillingPeriod({
        billingPeriodId: parsedBillingPeriodId,
        request,
      });
      setBillingPeriod(updatedPeriod);
      setDraft(mapBillingPeriodToDraft(updatedPeriod));
      setIsEditing(false);
      setSaveMessage("Billing period changes saved.");
      setBillingRunMessage(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save billing period.");
      setSaveMessage(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRunBilling() {
    if (!billingPeriod) {
      return;
    }

    setIsRunningBilling(true);
    setBillingRunError(null);
    setBillingRunMessage(null);

    try {
      const response = await runBillingPeriod({
        billingPeriodId: billingPeriod.billingPeriodId,
      });
      setBillingRuns((current) => [
        response.run,
        ...current.filter((run) => run.billingPeriodRunId !== response.run.billingPeriodRunId),
      ]);
      setRunHistoryState("success");
      setRunHistoryError(null);
      setBillingRunMessage(`Billing run queued for ${billingPeriod.name}.`);
    } catch (error) {
      setBillingRunError(error instanceof Error ? error.message : "Failed to queue billing run.");
    } finally {
      setIsRunningBilling(false);
    }
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Stack gap="xs">
            <Text className="portal-ui-eyebrow-text">Billing</Text>
            <Title order={1}>{billingPeriod.name}</Title>
            <Text c="dimmed">{billingPeriod.description}</Text>
          </Stack>
          <Button component={Link} to="/billing/periods" variant="default">
            Back to search
          </Button>
        </Group>

        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Title order={2}>Billing Period Status</Title>
              <Text size="sm" c="dimmed">
                {statusLabel(displayedStatus)}
              </Text>
            </Group>
            <Stepper
              active={displayedStatusStep}
              color="teal"
              size="sm"
              allowNextStepsSelect={false}
            >
              {billingPeriodStatusSteps.map((status) => (
                <Stepper.Step key={status} label={statusLabel(status)} />
              ))}
            </Stepper>
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
              <Stack gap={4}>
                <Title order={2}>Billing Period Detail</Title>
                <Text size="sm" c="dimmed">
                  Fields mirror the legacy setup window so we can decide what to keep later.
                </Text>
              </Stack>
              <Stack gap="xs" align="flex-end">
                <Group gap="sm" justify="flex-end" wrap="wrap">
                  <Button
                    type="button"
                    variant="light"
                    loading={isRunningBilling}
                    onClick={() => {
                      void handleRunBilling();
                    }}
                  >
                    Run Billing
                  </Button>
                  <Button
                    onClick={() => {
                      setSaveMessage(null);
                      setBillingRunMessage(null);
                      setIsEditing((current) => !current);
                      setDraft(mapBillingPeriodToDraft(billingPeriod));
                    }}
                  >
                    {isEditing ? "Stop editing" : "Edit billing period"}
                  </Button>
                </Group>
                {isEditing ? (
                  <Group gap="xs" justify="flex-end" wrap="wrap">
                    <Button
                      type="button"
                      variant="default"
                      size="xs"
                      disabled={!previousStatus || Boolean(statusSavingTarget)}
                      loading={statusSavingTarget === previousStatus}
                      onClick={() => {
                        if (previousStatus) {
                          void updateBillingPeriodStatus(previousStatus);
                        }
                      }}
                    >
                      {previousStatus ? `Move to ${statusLabel(previousStatus)}` : "Previous status"}
                    </Button>
                    <Button
                      type="button"
                      variant="light"
                      size="xs"
                      disabled={!nextStatus || Boolean(statusSavingTarget)}
                      loading={statusSavingTarget === nextStatus}
                      onClick={() => {
                        if (nextStatus) {
                          void updateBillingPeriodStatus(nextStatus);
                        }
                      }}
                    >
                      {nextStatus ? `Move to ${statusLabel(nextStatus)}` : "Next status"}
                    </Button>
                  </Group>
                ) : null}
              </Stack>
            </Group>

            {isEditing ? (
              <Stack gap="xl">
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  <Stack gap="md">
                    <TextInput
                      label="Name"
                      styles={editableFieldStyles}
                      value={draft.name}
                      onChange={(event) =>
                        updateDraft("name", event.currentTarget.value.toUpperCase())
                      }
                    />
                    <TextInput
                      label="Description"
                      styles={editableFieldStyles}
                      value={draft.description}
                      onChange={(event) => updateDraft("description", event.currentTarget.value)}
                    />
                    <Select
                      label="Type"
                      data={billingPeriodTypeOptions}
                      styles={editableFieldStyles}
                      value={draft.type}
                      onChange={(value) =>
                        updateDraft("type", (value ?? "STANDARD") as BillingPeriodType)
                      }
                    />
                  </Stack>

                  <Stack gap="md">
                    <DateInput
                      label="Start Date"
                      clearable
                      styles={editableFieldStyles}
                      value={parseDateInputValue(draft.startDate)}
                      onChange={(value) => updateDraft("startDate", normalizeDateInputValue(value))}
                    />
                    <DateInput
                      label="End Date"
                      clearable
                      styles={editableFieldStyles}
                      value={parseDateInputValue(draft.endDate)}
                      onChange={(value) => updateDraft("endDate", normalizeDateInputValue(value))}
                    />
                    <DateInput
                      label="Actual Start/Preliminary End Date"
                      clearable
                      styles={editableFieldStyles}
                      value={parseDateInputValue(draft.actualStartPreliminaryEndDate)}
                      onChange={(value) =>
                        updateDraft("actualStartPreliminaryEndDate", normalizeDateInputValue(value))
                      }
                    />
                  </Stack>

                  <Stack gap="md">
                    <Group align="flex-end" gap="sm" grow>
                      <TextInput
                        label="1098-T Academic Year"
                        styles={editableFieldStyles}
                        value={draft.taxAcademicYear}
                        onChange={(event) =>
                          updateDraft("taxAcademicYear", event.currentTarget.value)
                        }
                      />
                      <Checkbox
                        label="Active"
                        styles={editableCheckboxStyles}
                        checked={draft.active}
                        onChange={(event) => updateDraft("active", event.currentTarget.checked)}
                      />
                    </Group>
                    <TextInput
                      label="1098-T Academic Term"
                      styles={editableFieldStyles}
                      value={`${draft.taxAcademicTermCode} ${draft.taxAcademicTermName}`.trim()}
                      onChange={(event) => {
                        const [code, ...nameParts] = event.currentTarget.value.split(" ");
                        updateDraft("taxAcademicTermCode", (code ?? "").toUpperCase());
                        updateDraft("taxAcademicTermName", nameParts.join(" "));
                      }}
                    />
                    <TextInput
                      label="Financial Aid Period Code"
                      styles={editableFieldStyles}
                      value={draft.financialAidPeriodCode}
                      onChange={(event) =>
                        updateDraft(
                          "financialAidPeriodCode",
                          event.currentTarget.value.toUpperCase(),
                        )
                      }
                    />
                  </Stack>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                      <Text fw={600}>Academic Mapping</Text>
                      <Select
                        label="Academic Year"
                        placeholder="Choose academic year"
                        clearable
                        data={academicYearSelectOptions}
                        styles={editableFieldStyles}
                        value={draft.academicYearId ? String(draft.academicYearId) : null}
                        onChange={updateAcademicYear}
                      />
                      <Select
                        label="Academic Term"
                        placeholder="Choose academic term"
                        clearable
                        data={termSelectOptions}
                        disabled={!draft.academicYearId}
                        styles={editableFieldStyles}
                        value={draft.termId ? String(draft.termId) : null}
                        onChange={updateAcademicTerm}
                      />
                    </Stack>
                  </Paper>

                  <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                      <Text fw={600}>Base Billing Dates</Text>
                      <Select
                        label="Date for Course Billing"
                        data={billingBaseDateBasisOptions}
                        styles={editableFieldStyles}
                        value={draft.courseBillingBasis}
                        onChange={(value) =>
                          updateDraft(
                            "courseBillingBasis",
                            (value ?? "BILLING_PERIOD_START_DATE") as BillingBaseDateBasis,
                          )
                        }
                      />
                      <Select
                        label="Date for Non-Course Billing"
                        data={billingBaseDateBasisOptions}
                        styles={editableFieldStyles}
                        value={draft.nonCourseBillingBasis}
                        onChange={(value) =>
                          updateDraft(
                            "nonCourseBillingBasis",
                            (value ?? "BILLING_PERIOD_START_DATE") as BillingBaseDateBasis,
                          )
                        }
                      />
                    </Stack>
                  </Paper>

                  <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                      <Text fw={600}>Billing Offset Days</Text>
                      <NumberInput
                        label="Actual From/To Days"
                        styles={editableFieldStyles}
                        value={draft.actualFromToDays}
                        onChange={(value) =>
                          updateDraft("actualFromToDays", typeof value === "number" ? value : 0)
                        }
                      />
                      <NumberInput
                        label="Preliminary From/To Days"
                        styles={editableFieldStyles}
                        value={draft.preliminaryFromToDays}
                        onChange={(value) =>
                          updateDraft(
                            "preliminaryFromToDays",
                            typeof value === "number" ? value : 0,
                          )
                        }
                      />
                    </Stack>
                  </Paper>

                  <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                      <Text fw={600}>Additional Billing Mapping</Text>
                      <TextInput
                        label="1098-T Academic Year Label"
                        styles={editableFieldStyles}
                        value={draft.taxAcademicYearLabel}
                        onChange={(event) =>
                          updateDraft("taxAcademicYearLabel", event.currentTarget.value)
                        }
                      />
                      <TextInput
                        label="Financial Aid Period Name"
                        styles={editableFieldStyles}
                        value={draft.financialAidPeriodName}
                        onChange={(event) =>
                          updateDraft("financialAidPeriodName", event.currentTarget.value)
                        }
                      />
                    </Stack>
                  </Paper>
                </SimpleGrid>

                <Group gap="md" wrap="wrap">
                  <Checkbox
                    label="Allow RE Billing"
                    styles={editableCheckboxStyles}
                    checked={draft.allowReBilling}
                    onChange={(event) => updateDraft("allowReBilling", event.currentTarget.checked)}
                  />
                  <Checkbox
                    label="Allow AR Billing"
                    styles={editableCheckboxStyles}
                    checked={draft.allowArBilling}
                    onChange={(event) => updateDraft("allowArBilling", event.currentTarget.checked)}
                  />
                  <Checkbox
                    label="Include in AR Statements"
                    styles={editableCheckboxStyles}
                    checked={draft.includeInArStatements}
                    onChange={(event) =>
                      updateDraft("includeInArStatements", event.currentTarget.checked)
                    }
                  />
                  <Checkbox
                    label="Allow Billing in Campus Portal"
                    styles={editableCheckboxStyles}
                    checked={draft.allowBillingInCampusPortal}
                    onChange={(event) =>
                      updateDraft("allowBillingInCampusPortal", event.currentTarget.checked)
                    }
                  />
                  <Checkbox
                    label="Run Prelim in Campus Portal Only"
                    styles={editableCheckboxStyles}
                    checked={draft.runPrelimInCampusPortalOnly}
                    onChange={(event) =>
                      updateDraft("runPrelimInCampusPortalOnly", event.currentTarget.checked)
                    }
                  />
                  <Checkbox
                    label="Academic Records Mapped"
                    styles={editableCheckboxStyles}
                    checked={draft.academicRecordsMapped}
                    onChange={(event) =>
                      updateDraft("academicRecordsMapped", event.currentTarget.checked)
                    }
                  />
                  <Checkbox
                    label="Children Assigned"
                    styles={editableCheckboxStyles}
                    checked={draft.childrenAssigned}
                    onChange={(event) =>
                      updateDraft("childrenAssigned", event.currentTarget.checked)
                    }
                  />
                </Group>
              </Stack>
            ) : (
              <Stack gap="xl">
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  <Grid>
                    <ReadOnlyField label="Name" value={fieldValue(billingPeriod.name)} span={12} />
                    <ReadOnlyField
                      label="Description"
                      value={fieldValue(billingPeriod.description)}
                      span={12}
                    />
                    <ReadOnlyField label="Type" value={typeLabel(billingPeriod.type)} span={12} />
                    <ReadOnlyField label="Status" value={statusLabel(billingPeriod.status)} span={12} />
                  </Grid>

                  <Grid>
                    <ReadOnlyField
                      label="Start Date"
                      value={fieldValue(billingPeriod.startDate)}
                      span={12}
                    />
                    <ReadOnlyField
                      label="End Date"
                      value={fieldValue(billingPeriod.endDate)}
                      span={12}
                    />
                    <ReadOnlyField
                      label="Actual Start/Preliminary End Date"
                      value={fieldValue(billingPeriod.actualStartPreliminaryEndDate)}
                      span={12}
                    />
                  </Grid>

                  <Grid>
                    <Grid.Col span={12}>
                      <Grid align="flex-end">
                        <ReadOnlyField
                          label="1098-T Academic Year"
                          value={fieldValue(billingPeriod.taxAcademicYear)}
                          span={{ base: 12, sm: 8 }}
                        />
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                          <ReadOnlyCheckbox label="Active" checked={billingPeriod.active} />
                        </Grid.Col>
                      </Grid>
                    </Grid.Col>
                    <ReadOnlyField
                      label="1098-T Academic Term"
                      value={fieldValue(
                        `${nullToEmpty(billingPeriod.taxAcademicTermCode)} ${nullToEmpty(
                          billingPeriod.taxAcademicTermName,
                        )}`.trim(),
                      )}
                      span={12}
                    />
                    <ReadOnlyField
                      label="Financial Aid Period Code"
                      value={fieldValue(billingPeriod.financialAidPeriodCode)}
                      span={12}
                    />
                  </Grid>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                      <Text fw={600}>Academic Mapping</Text>
                      <Grid>
                        <ReadOnlyField
                          label="Academic Year"
                          value={
                            billingPeriod.academicYearName
                              ? `${billingPeriod.academicYearName} (${billingPeriod.academicYearCode})`
                              : "Not set"
                          }
                          span={12}
                        />
                        <ReadOnlyField
                          label="Academic Term"
                          value={
                            billingPeriod.termName
                              ? `${billingPeriod.termName} (${billingPeriod.termCode})`
                              : "Not set"
                          }
                          span={12}
                        />
                      </Grid>
                    </Stack>
                  </Paper>

                  <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                      <Text fw={600}>Base Billing Dates</Text>
                      <Grid>
                        <ReadOnlyField
                          label="Date for Course Billing"
                          value={baseDateBasisLabel(billingPeriod.courseBillingBasis)}
                          span={12}
                        />
                        <ReadOnlyField
                          label="Date for Non-Course Billing"
                          value={baseDateBasisLabel(billingPeriod.nonCourseBillingBasis)}
                          span={12}
                        />
                      </Grid>
                    </Stack>
                  </Paper>

                  <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                      <Text fw={600}>Billing Offset Days</Text>
                      <Grid>
                        <ReadOnlyField
                          label="Actual From/To Days"
                          value={String(billingPeriod.actualFromToDays)}
                          span={12}
                        />
                        <ReadOnlyField
                          label="Preliminary From/To Days"
                          value={String(billingPeriod.preliminaryFromToDays)}
                          span={12}
                        />
                      </Grid>
                    </Stack>
                  </Paper>

                  <Paper withBorder radius="sm" p="md">
                    <Stack gap="md">
                      <Text fw={600}>Additional Billing Mapping</Text>
                      <Grid>
                        <ReadOnlyField
                          label="1098-T Academic Year Label"
                          value={fieldValue(billingPeriod.taxAcademicYearLabel)}
                          span={12}
                        />
                        <ReadOnlyField
                          label="Financial Aid Period Name"
                          value={fieldValue(billingPeriod.financialAidPeriodName)}
                          span={12}
                        />
                      </Grid>
                    </Stack>
                  </Paper>
                </SimpleGrid>

                <Group gap="md" wrap="wrap">
                  <ReadOnlyCheckbox
                    label="Allow RE Billing"
                    checked={billingPeriod.allowReBilling}
                  />
                  <ReadOnlyCheckbox
                    label="Allow AR Billing"
                    checked={billingPeriod.allowArBilling}
                  />
                  <ReadOnlyCheckbox
                    label="Include in AR Statements"
                    checked={billingPeriod.includeInArStatements}
                  />
                  <ReadOnlyCheckbox
                    label="Allow Billing in Campus Portal"
                    checked={billingPeriod.allowBillingInCampusPortal}
                  />
                  <ReadOnlyCheckbox
                    label="Run Prelim in Campus Portal Only"
                    checked={billingPeriod.runPrelimInCampusPortalOnly}
                  />
                  <ReadOnlyCheckbox
                    label="Academic Records Mapped"
                    checked={billingPeriod.academicRecordsMapped}
                  />
                  <ReadOnlyCheckbox
                    label="Children Assigned"
                    checked={billingPeriod.childrenAssigned}
                  />
                </Group>
              </Stack>
            )}

            {saveError ? (
              <Alert color="red" title="Unable to save billing period">
                {saveError}
              </Alert>
            ) : null}

            {saveMessage ? (
              <Alert color="green" title="Saved">
                {saveMessage}
              </Alert>
            ) : null}

            {billingRunMessage ? (
              <Alert color="blue" title="Billing run">
                {billingRunMessage}
              </Alert>
            ) : null}

            {billingRunError ? (
              <Alert color="red" title="Unable to run billing">
                {billingRunError}
              </Alert>
            ) : null}

            {isEditing ? (
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="default"
                  onClick={() => {
                    setDraft(mapBillingPeriodToDraft(billingPeriod));
                    setIsEditing(false);
                    setSaveError(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={isSaving}>
                  Save changes
                </Button>
              </Group>
            ) : null}
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Stack gap={4}>
                <Title order={2}>Billing Runs</Title>
                <Text size="sm" c="dimmed">
                  Billing run history for this billing period.
                </Text>
              </Stack>
              <Text size="sm" c="dimmed">
                {billingRuns.length} {billingRuns.length === 1 ? "run" : "runs"}
              </Text>
            </Group>

            {runHistoryState === "loading" ? (
              <Alert color="blue" title="Loading billing runs">
                <Group gap="sm">
                  <Loader size="xs" />
                  <Text size="sm">Loading run history...</Text>
                </Group>
              </Alert>
            ) : null}

            {runHistoryState === "error" ? (
              <Alert color="red" title="Unable to load billing runs">
                {runHistoryError ?? "Failed to load billing run history."}
              </Alert>
            ) : null}

            {runHistoryState === "success" && billingRuns.length === 0 ? (
              <Alert color="gray" title="No billing runs yet">
                Run billing to create the first history row.
              </Alert>
            ) : null}

            {billingRuns.length > 0 ? (
              <Table.ScrollContainer minWidth={860}>
                <Table horizontalSpacing="md" verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Period Status</Table.Th>
                      <Table.Th>Started</Table.Th>
                      <Table.Th>Completed</Table.Th>
                      <Table.Th>Triggered By</Table.Th>
                      <Table.Th>Message</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {billingRuns.map((run) => (
                      <Table.Tr key={run.billingPeriodRunId}>
                        <Table.Td>
                          <Badge color={getBillingPeriodRunStatusColor(run.status)} variant="light">
                            {run.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="teal" variant="light">
                            {statusLabel(run.billingPeriodStatusAtRun)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{formatRunDateTime(run.startedAt)}</Table.Td>
                        <Table.Td>{formatRunDateTime(run.completedAt)}</Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Badge
                              color={getBillingPeriodRunTriggerColor(run.triggerSource)}
                              variant="outline"
                            >
                              {run.triggerSource === "SYSTEM" ? "System" : "User"}
                            </Badge>
                            <Text size="sm">{displayBillingPeriodRunTrigger(run)}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>{run.message}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
