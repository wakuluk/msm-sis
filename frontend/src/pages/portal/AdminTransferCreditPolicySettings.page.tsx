import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { RecordPageFooter } from '@/components/create/RecordPageFooter';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import {
  closeCurrentTransferCreditPolicy,
  getTransferCreditPolicies,
  saveTransferCreditPolicy,
} from '@/services/transfer-credit-policy-service';
import type { TransferCreditPolicyResponse } from '@/services/schemas/transfer-credit-policy-schemas';

const gradeOptions = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'].map((grade) => ({
  value: grade,
  label: grade,
}));

const waiverRows = [
  {
    policy: 'Minimum grade',
    scope: 'Transfer request',
    reviewer: 'Registrar',
    note: 'Document student-specific reason before approval.',
  },
  {
    policy: '75-credit / four-year institution rule',
    scope: 'Transfer request',
    reviewer: 'Registrar',
    note: 'Requires explicit waiver on the request detail.',
  },
];

type SortKey =
  | 'effectiveStartDate'
  | 'effectiveEndDate'
  | 'minimumTransferGrade'
  | 'fourYearInstitutionCreditThreshold'
  | 'requireTranscriptPdf'
  | 'updatedAt';

type SortDirection = 'asc' | 'desc';

function policyDateRange(policy: TransferCreditPolicyResponse) {
  return `${policy.effectiveStartDate} to ${policy.effectiveEndDate ?? 'open-ended'}`;
}

function isOpenEnded(policy: TransferCreditPolicyResponse) {
  return policy.effectiveEndDate === null;
}

function compareValues(left: unknown, right: unknown) {
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }

  return String(left ?? '').localeCompare(String(right ?? ''));
}

export function AdminTransferCreditPolicySettingsPage() {
  const navigate = useNavigate();
  const { policyId } = useParams<{ policyId?: string }>();
  const isNewPolicy = policyId === 'new';
  const parsedPolicyId = policyId && !isNewPolicy ? Number(policyId) : null;
  const isListPage = policyId === undefined;

  const [policies, setPolicies] = useState<TransferCreditPolicyResponse[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('effectiveStartDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [effectiveStartDate, setEffectiveStartDate] = useState('1900-01-01');
  const [effectiveEndDate, setEffectiveEndDate] = useState('');
  const [openEnded, setOpenEnded] = useState(true);
  const [fourYearInstitutionCreditThreshold, setFourYearInstitutionCreditThreshold] = useState<
    number | string
  >(75);
  const [minimumTransferGrade, setMinimumTransferGrade] = useState('C-');
  const [requireOfficialTranscriptPdf, setRequireOfficialTranscriptPdf] = useState(true);
  const [policyNotes, setPolicyNotes] = useState(
    'Students at or above the credit threshold may transfer coursework only from four-year institutions unless the rule is waived for the individual request.'
  );
  const [closeEndDate, setCloseEndDate] = useState('');

  const selectedPolicy = useMemo(
    () => policies.find((policy) => policy.transferCreditPolicyId === parsedPolicyId) ?? null,
    [parsedPolicyId, policies]
  );

  const currentOpenPolicy = useMemo(
    () => policies.find((policy) => policy.effectiveEndDate === null) ?? null,
    [policies]
  );

  const sortedPolicies = useMemo(() => {
    const sorted = [...policies].sort((left, right) => {
      const comparison = compareValues(left[sortBy], right[sortBy]);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [policies, sortBy, sortDirection]);

  const loadPolicies = async (signal?: AbortSignal) => {
    setLoadingPolicies(true);
    setLoadError(null);

    try {
      const response = await getTransferCreditPolicies({ signal });
      setPolicies(response.policies);
    } catch (error: unknown) {
      if (!signal?.aborted) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load policy settings.');
      }
    } finally {
      if (!signal?.aborted) {
        setLoadingPolicies(false);
      }
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    void loadPolicies(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const policy = isNewPolicy ? null : selectedPolicy;

    if (!isNewPolicy && !policy) {
      return;
    }

    setSaveError(null);
    setSaveMessage(null);
    setEffectiveStartDate(policy?.effectiveStartDate ?? '');
    setEffectiveEndDate(policy?.effectiveEndDate ?? '');
    setOpenEnded(policy?.effectiveEndDate === null || isNewPolicy);
    setMinimumTransferGrade(policy?.minimumTransferGrade ?? currentOpenPolicy?.minimumTransferGrade ?? 'C-');
    setFourYearInstitutionCreditThreshold(
      policy?.fourYearInstitutionCreditThreshold ??
        currentOpenPolicy?.fourYearInstitutionCreditThreshold ??
        75
    );
    setRequireOfficialTranscriptPdf(
      policy?.requireTranscriptPdf ?? currentOpenPolicy?.requireTranscriptPdf ?? true
    );
    setPolicyNotes(policy?.notes ?? currentOpenPolicy?.notes ?? '');
    setCloseEndDate(policy?.effectiveEndDate ?? '');
  }, [currentOpenPolicy, isNewPolicy, selectedPolicy]);

  function handleSort(nextSortBy: SortKey) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection('asc');
  }

  function sortLabel(nextSortBy: SortKey) {
    if (sortBy !== nextSortBy) {
      return '';
    }

    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  const handleSavePolicy = async () => {
    const numericThreshold =
      typeof fourYearInstitutionCreditThreshold === 'number'
        ? fourYearInstitutionCreditThreshold
        : Number.parseInt(fourYearInstitutionCreditThreshold, 10);

    if (!Number.isFinite(numericThreshold)) {
      setSaveError('Credit threshold must be a number.');
      return;
    }

    setSavingPolicy(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const savedPolicy = await saveTransferCreditPolicy({
        policyId: isNewPolicy ? undefined : selectedPolicy?.transferCreditPolicyId,
        request: {
          effectiveStartDate,
          effectiveEndDate: openEnded || effectiveEndDate.length === 0 ? null : effectiveEndDate,
          minimumTransferGrade,
          fourYearInstitutionCreditThreshold: numericThreshold,
          requireTranscriptPdf: requireOfficialTranscriptPdf,
          notes: policyNotes.length === 0 ? null : policyNotes,
        },
      });

      setSaveMessage(isNewPolicy ? 'New transfer credit policy version created.' : 'Policy updated.');
      await loadPolicies();
      if (isNewPolicy) {
        navigate(`/admin/settings/transfer-credit-policy/${savedPolicy.transferCreditPolicyId}`);
      }
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save policy settings.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleCloseCurrentPolicy = async () => {
    if (!closeEndDate) {
      setSaveError('Close date is required.');
      return;
    }

    setSavingPolicy(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const closedPolicy = await closeCurrentTransferCreditPolicy({
        request: { effectiveEndDate: closeEndDate },
      });
      setSaveMessage('Current open-ended transfer credit policy closed.');
      await loadPolicies();
      navigate(`/admin/settings/transfer-credit-policy/${closedPolicy.transferCreditPolicyId}`);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : 'Failed to close policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  if (isListPage) {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Settings"
        title="Transfer Credit Policy"
        description="Review global transfer credit policy versions. Click a row to edit policy details."
        badge={
          <Badge size="lg" variant="light" color="green">
            Global Policy
          </Badge>
        }
      >
        <Stack gap={0}>
          <RecordPageSection
            title="Policy Versions"
            description="Only one policy date range can apply to a request date. New requests use the open-ended policy."
            action={
              <Button
                onClick={() => {
                  navigate('/admin/settings/transfer-credit-policy/new');
                }}
              >
                Create new version
              </Button>
            }
          >
            <Grid.Col span={12}>
              {loadError ? (
                <Alert color="red" title="Unable to load policy settings" mb="md">
                  {loadError}
                </Alert>
              ) : null}
              <Table.ScrollContainer minWidth={980}>
                <Table horizontalSpacing="md" verticalSpacing="sm" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        <Button variant="subtle" size="compact-sm" onClick={() => handleSort('effectiveStartDate')}>
                          Effective dates{sortLabel('effectiveStartDate')}
                        </Button>
                      </Table.Th>
                      <Table.Th>
                        <Button variant="subtle" size="compact-sm" onClick={() => handleSort('minimumTransferGrade')}>
                          Minimum grade{sortLabel('minimumTransferGrade')}
                        </Button>
                      </Table.Th>
                      <Table.Th>
                        <Button variant="subtle" size="compact-sm" onClick={() => handleSort('fourYearInstitutionCreditThreshold')}>
                          Four-year threshold{sortLabel('fourYearInstitutionCreditThreshold')}
                        </Button>
                      </Table.Th>
                      <Table.Th>
                        <Button variant="subtle" size="compact-sm" onClick={() => handleSort('requireTranscriptPdf')}>
                          Transcript PDF{sortLabel('requireTranscriptPdf')}
                        </Button>
                      </Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>
                        <Button variant="subtle" size="compact-sm" onClick={() => handleSort('updatedAt')}>
                          Updated{sortLabel('updatedAt')}
                        </Button>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {loadingPolicies ? (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text c="dimmed">Loading policy history...</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : null}
                    {!loadingPolicies && policies.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={6}>
                          <Text c="dimmed">No policies have been saved yet.</Text>
                        </Table.Td>
                      </Table.Tr>
                    ) : null}
                    {sortedPolicies.map((policy) => (
                      <Table.Tr
                        key={policy.transferCreditPolicyId}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          navigate(`/admin/settings/transfer-credit-policy/${policy.transferCreditPolicyId}`);
                        }}
                      >
                        <Table.Td>{policyDateRange(policy)}</Table.Td>
                        <Table.Td>{policy.minimumTransferGrade}</Table.Td>
                        <Table.Td>{policy.fourYearInstitutionCreditThreshold}</Table.Td>
                        <Table.Td>{policy.requireTranscriptPdf ? 'Required' : 'Optional'}</Table.Td>
                        <Table.Td>
                          <Badge variant="light" color={isOpenEnded(policy) ? 'green' : 'gray'}>
                            {isOpenEnded(policy) ? 'Open-ended' : 'Closed'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{policy.updatedAt ?? policy.createdAt ?? '-'}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Grid.Col>
          </RecordPageSection>
        </Stack>
      </RecordPageShell>
    );
  }

  if (!isNewPolicy && !loadingPolicies && !selectedPolicy) {
    return (
      <RecordPageShell
        size="xl"
        eyebrow="Admin Settings"
        title="Transfer Credit Policy"
        description="Policy detail was not found."
      >
        <Stack p="xl">
          <Alert color="red" variant="light">
            Transfer credit policy was not found.
          </Alert>
          <Group>
            <Button variant="default" onClick={() => navigate('/admin/settings/transfer-credit-policy')}>
              Back to policies
            </Button>
          </Group>
        </Stack>
      </RecordPageShell>
    );
  }

  return (
    <RecordPageShell
      size="xl"
      eyebrow="Admin Settings"
      title={isNewPolicy ? 'New Transfer Credit Policy' : 'Transfer Credit Policy Detail'}
      description="Configure date-effective transfer credit policy values. Student exceptions are waived on individual requests."
      badge={
        <Badge size="lg" variant="light" color={selectedPolicy && isOpenEnded(selectedPolicy) ? 'green' : 'gray'}>
          {isNewPolicy ? 'New Version' : selectedPolicy && isOpenEnded(selectedPolicy) ? 'Open-ended' : 'Closed'}
        </Badge>
      }
    >
      <Stack gap={0}>
        <RecordPageSection
          title="Policy Version"
          description="Date-effective policy values are persisted globally and referenced by request review."
          action={
            <Group gap="sm">
              <Button variant="default" onClick={() => navigate('/admin/settings/transfer-credit-policy')}>
                Back to policies
              </Button>
              {!isNewPolicy ? (
                <Button variant="light" onClick={() => navigate('/admin/settings/transfer-credit-policy/new')}>
                  Create new version
                </Button>
              ) : null}
            </Group>
          }
        >
          <ReadOnlyField
            label="Policy ID"
            value={
              isNewPolicy
                ? 'Not saved yet'
                : String(selectedPolicy?.transferCreditPolicyId ?? 'Not found')
            }
          />
          <ReadOnlyField label="Last updated" value={selectedPolicy?.updatedAt ?? selectedPolicy?.createdAt ?? 'Not saved yet'} />
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              type="date"
              label="Effective start date"
              value={effectiveStartDate}
              onChange={(event) => setEffectiveStartDate(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              type="date"
              label="Effective end date"
              description="Leave open-ended for new requests."
              value={effectiveEndDate}
              disabled={openEnded}
              onChange={(event) => setEffectiveEndDate(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Switch
              label="Open-ended policy"
              description="New requests continue to use this policy until an end date is set."
              checked={openEnded}
              onChange={(event) => {
                const nextOpenEnded = event.currentTarget.checked;
                setOpenEnded(nextOpenEnded);
                if (nextOpenEnded) {
                  setEffectiveEndDate('');
                }
              }}
            />
          </Grid.Col>
        </RecordPageSection>

        <RecordPageSection
          title="Global Checks"
          description="These values apply to every transfer request unless an individual request receives a waiver."
        >
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Credit threshold for four-year rule"
              description="Students at or above this credit total must use a four-year institution."
              min={0}
              value={fourYearInstitutionCreditThreshold}
              onChange={setFourYearInstitutionCreditThreshold}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Minimum transferable grade"
              description="Lowest grade allowed without waiver."
              data={gradeOptions}
              value={minimumTransferGrade}
              onChange={(value) => {
                if (value) {
                  setMinimumTransferGrade(value);
                }
              }}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Switch
              label="Require transcript PDF"
              description="A retrievable transcript PDF is required before final approval."
              checked={requireOfficialTranscriptPdf}
              onChange={(event) => setRequireOfficialTranscriptPdf(event.currentTarget.checked)}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Policy notes"
              minRows={4}
              value={policyNotes}
              onChange={(event) => setPolicyNotes(event.currentTarget.value)}
            />
          </Grid.Col>
        </RecordPageSection>

        {!isNewPolicy && selectedPolicy?.effectiveEndDate === null ? (
          <RecordPageSection
            title="Close Policy"
            description="Set an end date on this open-ended policy before creating a future replacement."
          >
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                type="date"
                label="Policy end date"
                value={closeEndDate}
                onChange={(event) => setCloseEndDate(event.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Group h="100%" align="flex-end">
                <Button
                  variant="light"
                  color="red"
                  loading={savingPolicy}
                  onClick={() => void handleCloseCurrentPolicy()}
                >
                  Close policy
                </Button>
              </Group>
            </Grid.Col>
          </RecordPageSection>
        ) : null}

        <RecordPageSection
          title="Waiver Rules"
          description="Waivers are tracked on request records, not by changing global policy values."
        >
          <Grid.Col span={12}>
            <Table.ScrollContainer minWidth={760}>
              <Table horizontalSpacing="md" verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Policy</Table.Th>
                    <Table.Th>Scope</Table.Th>
                    <Table.Th>Reviewer</Table.Th>
                    <Table.Th>Note</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {waiverRows.map((row) => (
                    <Table.Tr key={row.policy}>
                      <Table.Td>{row.policy}</Table.Td>
                      <Table.Td>{row.scope}</Table.Td>
                      <Table.Td>{row.reviewer}</Table.Td>
                      <Table.Td>{row.note}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Grid.Col>
        </RecordPageSection>

        {saveError ? (
          <Alert color="red" variant="light" mx="xl" mb="md" title="Unable to save policy">
            {saveError}
          </Alert>
        ) : null}

        {saveMessage ? (
          <Alert color="green" variant="light" mx="xl" mb="md">
            {saveMessage}
          </Alert>
        ) : null}

        <RecordPageFooter description="Global settings apply by request date. Student-specific exceptions are recorded as waivers on the request.">
          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate('/admin/settings/transfer-credit-policy')}>
              Back
            </Button>
            <Button loading={savingPolicy} disabled={loadingPolicies} onClick={() => void handleSavePolicy()}>
              Save policy
            </Button>
          </Group>
        </RecordPageFooter>
      </Stack>
    </RecordPageShell>
  );
}
