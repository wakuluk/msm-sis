export type RequirementCourseStatus = 'complete' | 'planned' | 'needed' | 'not_required';

export type ProgramTrackerRequirementCourse = {
  code: string;
  courseId?: number;
  credits?: number;
  plannedCourseId?: number;
  status: RequirementCourseStatus;
  title?: string;
};

export type ProgramTrackerMatchedCourse = {
  code: string;
  credits?: number;
  plannedTermLabel?: string;
  plannedYearLabel?: string;
  source?: string;
  status: 'completed' | 'planned';
  title?: string;
};

export type ProgramTrackerRequirement = {
  completed: number;
  courseRules: ProgramTrackerCourseRule[];
  courses: ProgramTrackerRequirementCourse[];
  label: string;
  matchedCourses: ProgramTrackerMatchedCourse[];
  planned: number;
  required: number;
  requirementId?: number;
  requirementType?: string;
  rules: string[];
  unit: 'credits' | 'courses';
};

export type ProgramTrackerCompletionRequirementOption = {
  completedCount: number;
  label: string;
  matchedCount: number;
  plannedCount: number;
  satisfied: boolean;
  status: 'completed' | 'planned' | 'needed';
};

export type ProgramTrackerCompletionRequirement = {
  completedCount: number;
  label: string;
  matchedCount: number;
  minimumCount: number;
  notes?: string;
  options: ProgramTrackerCompletionRequirementOption[];
  plannedCount: number;
  satisfied: boolean;
  status: 'completed' | 'planned' | 'needed';
};

export type ProgramTrackerCourseRule = {
  departmentCode?: string;
  departmentId?: number;
  maximumCourseNumber?: number;
  minimumCourseNumber?: number;
  minimumCourses?: number;
  minimumCredits?: number;
  requirementCourseRuleId: number;
};

export type ProgramTrackerProgram = {
  code: string;
  completed: number;
  name: string;
  planned: number;
  required: number;
  status: string;
  studentProgramId?: number;
  type: string;
  version: string;
  requirements: ProgramTrackerRequirement[];
  completionRequirements: ProgramTrackerCompletionRequirement[];
};

export type PlannerCourseStatus = 'complete' | 'planned' | 'needed';
export type PlannerBucketCode = 'FULL_TERM' | 'SESSION_A' | 'SESSION_B';

export type ProgramTrackerPlannerCourse = {
  code: string;
  courseId?: number;
  credits: number;
  notes?: string;
  plannerCourseId?: number;
  readOnly?: boolean;
  source?: string;
  gradeCode?: string;
  completedDate?: string;
  plannerBucketCode?: PlannerBucketCode;
  plannerBucketLabel?: string;
  programCode?: string;
  programName?: string;
  placeholderDepartmentCode?: string;
  placeholderDepartmentId?: number;
  placeholderLabel?: string;
  placeholderMaximumCourseNumber?: number;
  placeholderMinimumCourseNumber?: number;
  placeholderSubjectCode?: string;
  placeholderType?: string;
  plannerClientId?: string;
  requirement: string;
  requirementId?: number;
  status: PlannerCourseStatus;
  studentProgramId?: number;
  title?: string;
  warnings?: string[];
};

export type ProgramTrackerPlannerBucket = {
  code: PlannerBucketCode;
  courses: ProgramTrackerPlannerCourse[];
  label: string;
  sortOrder: number;
};

export type ProgramTrackerPlannerTerm = {
  code: string;
  courses: ProgramTrackerPlannerCourse[];
  isComplete?: boolean;
  label: string;
  readOnly?: boolean;
  source?: string;
  sortOrder?: number;
  studentAcademicPlanTermId?: number;
};

export type ProgramTrackerPlannerYear = {
  canRemove?: boolean;
  label: string;
  readOnly?: boolean;
  source?: string;
  sortOrder?: number;
  studentAcademicPlanYearId?: number;
  terms: ProgramTrackerPlannerTerm[];
};

export type ProgramTrackerCourseSelection = {
  courseId?: number;
  courseCode: string;
  credits?: number;
  placeholderDepartmentCode?: string;
  placeholderDepartmentId?: number;
  placeholderLabel?: string;
  placeholderMaximumCourseNumber?: number;
  placeholderMinimumCourseNumber?: number;
  placeholderSubjectCode?: string;
  placeholderType?: string;
  programCode: string;
  programName: string;
  requirementId?: number;
  requirementLabel: string;
  studentProgramId?: number;
  title?: string;
};

export type ProgramTrackerCourseMoveSelection = {
  course: ProgramTrackerPlannerCourse;
  sourceBucketCode?: PlannerBucketCode;
  sourceTermCode: string;
};

export type ProgramTrackerPlannerDropTarget = {
  bucketCode: PlannerBucketCode;
  termCode: string;
};
