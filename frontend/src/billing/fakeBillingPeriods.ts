export type BillingPeriodType = "Standard" | "Open Ended";

export type BillingPeriodStatus = "Draft" | "Published" | "Archived";

export type BillingPeriodRunStatus = "Queued" | "Running" | "Completed" | "Failed";

export type BillingPeriodRunTriggerSource = "User" | "System";

export type BillingBaseDateBasis =
  | "Billing Period Start Date"
  | "Billing Period End Date"
  | "Actual Start/Preliminary End Date";

export type BillingPeriod = {
  id: number;
  name: string;
  description: string;
  type: BillingPeriodType;
  status: BillingPeriodStatus;
  academicYearId: number | null;
  academicYearCode: string;
  academicYearName: string;
  termId: number | null;
  termCode: string;
  termName: string;
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

export type BillingPeriodRun = {
  id: number;
  billingPeriodId: number;
  status: BillingPeriodRunStatus;
  billingPeriodStatusAtRun: BillingPeriodStatus;
  startedAt: string | null;
  completedAt: string | null;
  triggerSource: BillingPeriodRunTriggerSource;
  triggeredByUserName: string | null;
  message: string;
};

export const billingPeriodTypeOptions: BillingPeriodType[] = ["Standard", "Open Ended"];

export const billingPeriodStatusOptions: BillingPeriodStatus[] = ["Draft", "Published", "Archived"];

export const billingPeriodRunStatusOptions: BillingPeriodRunStatus[] = [
  "Queued",
  "Running",
  "Completed",
  "Failed",
];

export const billingBaseDateBasisOptions: BillingBaseDateBasis[] = [
  "Billing Period Start Date",
  "Billing Period End Date",
  "Actual Start/Preliminary End Date",
];

export type BillingPeriodAcademicTermOption = {
  id: number;
  code: string;
  name: string;
};

export type BillingPeriodAcademicYearOption = {
  id: number;
  code: string;
  name: string;
  terms: BillingPeriodAcademicTermOption[];
};

export const billingPeriodAcademicYearOptions: BillingPeriodAcademicYearOption[] = [
  {
    id: 2026,
    code: "2025-2026",
    name: "Academic Year 2025-2026",
    terms: [
      { id: 202601, code: "WI", name: "Winter 2026" },
      { id: 202602, code: "SP", name: "Spring 2026" },
      { id: 202603, code: "SU", name: "Summer 2026" },
    ],
  },
  {
    id: 2027,
    code: "2026-2027",
    name: "Academic Year 2026-2027",
    terms: [
      { id: 202701, code: "FA", name: "Fall 2026" },
      { id: 202702, code: "WI", name: "Winter 2027" },
      { id: 202703, code: "SP", name: "Spring 2027" },
    ],
  },
];

export const fakeBillingPeriods: BillingPeriod[] = [
  {
    id: 1,
    name: "2026SP",
    description: "Spring 2026",
    type: "Standard",
    status: "Published",
    academicYearId: 2026,
    academicYearCode: "2025-2026",
    academicYearName: "Academic Year 2025-2026",
    termId: 202602,
    termCode: "SP",
    termName: "Spring 2026",
    startDate: "2025-11-17",
    endDate: "2026-05-20",
    actualStartPreliminaryEndDate: "2026-01-26",
    taxAcademicYear: "2026",
    taxAcademicYearLabel: "2025-2026",
    taxAcademicTermCode: "SP",
    taxAcademicTermName: "Spring",
    financialAidPeriodCode: "SP2026",
    financialAidPeriodName: "Spring 2026",
    courseBillingBasis: "Billing Period Start Date",
    nonCourseBillingBasis: "Billing Period Start Date",
    actualFromToDays: 0,
    preliminaryFromToDays: 0,
    allowReBilling: false,
    allowArBilling: true,
    includeInArStatements: false,
    allowBillingInCampusPortal: false,
    runPrelimInCampusPortalOnly: false,
    active: true,
    academicRecordsMapped: true,
    childrenAssigned: false,
  },
  {
    id: 2,
    name: "2026WI",
    description: "Winter 2026",
    type: "Standard",
    status: "Draft",
    academicYearId: 2026,
    academicYearCode: "2025-2026",
    academicYearName: "Academic Year 2025-2026",
    termId: 202601,
    termCode: "WI",
    termName: "Winter 2026",
    startDate: "2025-11-16",
    endDate: "2026-01-02",
    actualStartPreliminaryEndDate: "2025-11-30",
    taxAcademicYear: "2026",
    taxAcademicYearLabel: "2025-2026",
    taxAcademicTermCode: "WI",
    taxAcademicTermName: "Winter",
    financialAidPeriodCode: "SP2026",
    financialAidPeriodName: "Spring 2026",
    courseBillingBasis: "Billing Period Start Date",
    nonCourseBillingBasis: "Billing Period Start Date",
    actualFromToDays: 0,
    preliminaryFromToDays: 0,
    allowReBilling: false,
    allowArBilling: true,
    includeInArStatements: true,
    allowBillingInCampusPortal: false,
    runPrelimInCampusPortalOnly: false,
    active: true,
    academicRecordsMapped: true,
    childrenAssigned: false,
  },
  {
    id: 3,
    name: "2026FA",
    description: "Fall 2026",
    type: "Standard",
    status: "Archived",
    academicYearId: 2027,
    academicYearCode: "2026-2027",
    academicYearName: "Academic Year 2026-2027",
    termId: 202701,
    termCode: "FA",
    termName: "Fall 2026",
    startDate: "2026-07-01",
    endDate: "2026-12-18",
    actualStartPreliminaryEndDate: "2026-08-24",
    taxAcademicYear: "2027",
    taxAcademicYearLabel: "2026-2027",
    taxAcademicTermCode: "FA",
    taxAcademicTermName: "Fall",
    financialAidPeriodCode: "FA2026",
    financialAidPeriodName: "Fall 2026",
    courseBillingBasis: "Billing Period Start Date",
    nonCourseBillingBasis: "Billing Period Start Date",
    actualFromToDays: 0,
    preliminaryFromToDays: 0,
    allowReBilling: false,
    allowArBilling: true,
    includeInArStatements: true,
    allowBillingInCampusPortal: true,
    runPrelimInCampusPortalOnly: false,
    active: true,
    academicRecordsMapped: false,
    childrenAssigned: false,
  },
];

export const fakeBillingPeriodRuns: BillingPeriodRun[] = [
  {
    id: 1,
    billingPeriodId: 1,
    status: "Completed",
    billingPeriodStatusAtRun: "Published",
    startedAt: "2026-01-26T09:00:00",
    completedAt: "2026-01-26T09:14:00",
    triggerSource: "User",
    triggeredByUserName: "Admin User",
    message: "Generated spring charges for review.",
  },
  {
    id: 2,
    billingPeriodId: 1,
    status: "Failed",
    billingPeriodStatusAtRun: "Draft",
    startedAt: "2026-01-25T15:30:00",
    completedAt: "2026-01-25T15:32:00",
    triggerSource: "User",
    triggeredByUserName: "Admin User",
    message: "Stopped before posting because one tuition code was missing.",
  },
  {
    id: 3,
    billingPeriodId: 2,
    status: "Completed",
    billingPeriodStatusAtRun: "Draft",
    startedAt: "2025-11-30T08:45:00",
    completedAt: "2025-11-30T08:52:00",
    triggerSource: "System",
    triggeredByUserName: null,
    message: "Winter preliminary billing completed.",
  },
];
