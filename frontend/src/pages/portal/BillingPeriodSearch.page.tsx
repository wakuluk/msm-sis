import { useEffect, useState } from "react";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Badge,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { BillingPeriodCreateModal } from "@/components/billing/BillingPeriodCreateModal";
import { SearchFormActions } from "@/components/search/SearchFormActions";
import { SearchFormSection } from "@/components/search/SearchFormSection";
import { SearchResultsPanel } from "@/components/search/SearchResultsPanel";
import { searchBillingPeriods } from "@/services/billing-service";
import type {
  BillingPeriodSearchResultResponse,
  BillingPeriodStatus,
} from "@/services/schemas/billing-schemas";

type BillingPeriodSearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; results: BillingPeriodSearchResultResponse[]; totalElements: number }
  | { status: "success"; results: BillingPeriodSearchResultResponse[]; totalElements: number };

type BillingPeriodSortBy = "name" | "description" | "startDate" | "endDate";
type BillingPeriodSortDirection = "asc" | "desc";

type BillingPeriodFilters = {
  name: string;
  description: string;
  academicTerm: string;
  financialAidPeriodCode: string;
  status: BillingPeriodStatus | "";
};

const initialFilters: BillingPeriodFilters = {
  name: "",
  description: "",
  academicTerm: "",
  financialAidPeriodCode: "",
  status: "",
};

const statusFilterOptions: Array<{ value: BillingPeriodStatus; label: string }> = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

function getStatusBadgeColor(status: BillingPeriodStatus) {
  if (status === "PUBLISHED") {
    return "green";
  }

  if (status === "ARCHIVED") {
    return "gray";
  }

  return "blue";
}

function getStatusLabel(status: BillingPeriodStatus) {
  if (status === "PUBLISHED") {
    return "Published";
  }

  if (status === "ARCHIVED") {
    return "Archived";
  }

  return "Draft";
}

function getCodeAndName(code: string | null, name: string | null) {
  if (code && name) {
    return `${code} - ${name}`;
  }

  return code ?? name ?? "";
}

const billingPeriodColumns: ColumnDef<BillingPeriodSearchResultResponse>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 160,
    cell: ({ row }) => (
      <Link to={`/billing/periods/${row.original.billingPeriodId}`}>{row.original.name}</Link>
    ),
    meta: { sortBy: "name" satisfies BillingPeriodSortBy },
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 260,
    meta: { sortBy: "description" satisfies BillingPeriodSortBy },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    size: 160,
    meta: { sortBy: "startDate" satisfies BillingPeriodSortBy },
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    size: 160,
    meta: { sortBy: "endDate" satisfies BillingPeriodSortBy },
  },
  {
    accessorKey: "taxAcademicTermCode",
    header: "Academic Term",
    size: 180,
    cell: ({ row }) =>
      getCodeAndName(row.original.taxAcademicTermCode, row.original.taxAcademicTermName),
  },
  {
    accessorKey: "financialAidPeriodCode",
    header: "Financial Aid Period",
    size: 210,
    cell: ({ row }) =>
      getCodeAndName(row.original.financialAidPeriodCode, row.original.financialAidPeriodName),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ row }) => (
      <Badge color={getStatusBadgeColor(row.original.status)} variant="light">
        {getStatusLabel(row.original.status)}
      </Badge>
    ),
  },
];

function getResultsSummary(state: BillingPeriodSearchState) {
  if (state.status === "success") {
    return `Showing ${state.results.length} of ${state.totalElements} billing periods`;
  }

  if (state.status === "empty") {
    return "No billing periods matched the current search criteria.";
  }

  if (state.status === "error") {
    return "Billing period search failed.";
  }

  return "Billing period search is ready.";
}

export function BillingPeriodSearchPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<BillingPeriodFilters>(initialFilters);
  const [submittedFilters, setSubmittedFilters] = useState<BillingPeriodFilters>(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<BillingPeriodSortBy>("name");
  const [sortDirection, setSortDirection] = useState<BillingPeriodSortDirection>("asc");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsState, setResultsState] = useState<BillingPeriodSearchState>({ status: "idle" });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!hasSearched) {
      setResultsState({ status: "idle" });
      setTotalPages(0);
      return undefined;
    }

    const abortController = new AbortController();
    setResultsState({ status: "loading" });

    searchBillingPeriods({
      name: submittedFilters.name,
      description: submittedFilters.description,
      academicTerm: submittedFilters.academicTerm,
      financialAidPeriod: submittedFilters.financialAidPeriodCode,
      status: submittedFilters.status,
      page,
      size: 25,
      sortBy,
      sortDirection,
      signal: abortController.signal,
    })
      .then((response) => {
        setTotalPages(response.totalPages);
        setResultsState(
          response.results.length === 0
            ? {
                status: "empty",
                results: response.results,
                totalElements: response.totalElements,
              }
            : {
                status: "success",
                results: response.results,
                totalElements: response.totalElements,
              },
        );
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setResultsState({
          status: "error",
          message: error instanceof Error ? error.message : "Failed to search billing periods.",
        });
      });

    return () => {
      abortController.abort();
    };
  }, [hasSearched, page, sortBy, sortDirection, submittedFilters]);

  const tableData = resultsState.status === "success" ? resultsState.results : [];
  const table = useReactTable({
    columns: billingPeriodColumns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.billingPeriodId),
  });

  function handleToggleSort(nextSortBy: BillingPeriodSortBy) {
    if (sortBy === nextSortBy) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      setPage(0);
      return;
    }

    setSortBy(nextSortBy);
    setSortDirection("asc");
    setPage(0);
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <BillingPeriodCreateModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreate={(billingPeriod) => {
            setCreateModalOpen(false);
            navigate(`/billing/periods/${billingPeriod.billingPeriodId}`);
          }}
        />

        <Paper withBorder radius="md" p="lg">
          <Stack gap="lg">
            <Group justify="space-between" align="center" gap="md" wrap="wrap">
              <Title order={1}>Billing Period Search</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateModalOpen(true)}>
                Create billing period
              </Button>
            </Group>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedFilters(filters);
                setHasSearched(true);
                setPage(0);
              }}
            >
              <Stack gap="lg">
                <SearchFormSection legend="Billing Period Filters">
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <TextInput
                      label="Name"
                      value={filters.name}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, name: event.currentTarget.value }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <TextInput
                      label="Description"
                      value={filters.description}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          description: event.currentTarget.value,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <TextInput
                      label="Academic Term"
                      value={filters.academicTerm}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          academicTerm: event.currentTarget.value,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <TextInput
                      label="Financial Aid Period"
                      value={filters.financialAidPeriodCode}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          financialAidPeriodCode: event.currentTarget.value,
                        }))
                      }
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 2 }}>
                    <Select
                      label="Status"
                      clearable
                      data={statusFilterOptions}
                      value={filters.status}
                      onChange={(value) =>
                        setFilters((current) => ({
                          ...current,
                          status: (value ?? "") as BillingPeriodStatus | "",
                        }))
                      }
                    />
                  </Grid.Col>
                </SearchFormSection>

                <SearchFormActions
                  showQueryControls={false}
                  clearLabel="Clear"
                  submitLabel="Search Billing Periods"
                  onClear={() => {
                    setFilters(initialFilters);
                    setSubmittedFilters(initialFilters);
                    setHasSearched(false);
                    setPage(0);
                  }}
                />
              </Stack>
            </form>
          </Stack>
        </Paper>

        <SearchResultsPanel
          status={resultsState.status}
          summary={getResultsSummary(resultsState)}
          table={table}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onToggleSort={handleToggleSort}
          withBorder
          notice={{
            idleTitle: "Billing period search is ready",
            idleMessage:
              "Search by billing period name, description, academic term, aid period, or status.",
            loadingMessage: "Loading billing periods...",
            errorTitle: "Billing period search failed",
            errorMessage: resultsState.status === "error" ? resultsState.message : null,
            emptyTitle: "No billing period search results found",
            emptyMessage: "Try adjusting the current search filters.",
          }}
          pagination={
            resultsState.status === "success" && totalPages > 1
              ? {
                  page,
                  totalPages,
                  onPageChange: setPage,
                }
              : null
          }
        />
      </Stack>
    </Container>
  );
}
