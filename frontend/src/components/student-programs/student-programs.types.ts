export type RequirementCourseStatus = 'complete' | 'planned' | 'needed';

export type RequirementCoursePreview = {
  code: string;
  status: RequirementCourseStatus;
};

export type StudentProgramRequirementPreview = {
  completed: number;
  courses: RequirementCoursePreview[];
  label: string;
  planned: number;
  required: number;
  rules: string[];
  unit: 'credits' | 'courses';
};

export type StudentProgramPreview = {
  code: string;
  completed: number;
  name: string;
  planned: number;
  required: number;
  status: string;
  type: string;
  version: string;
  requirements: StudentProgramRequirementPreview[];
};

export type PlannerCourseStatus = 'complete' | 'planned' | 'needed';

export type PlannerCoursePreview = {
  code: string;
  credits: number;
  programCode?: string;
  programName?: string;
  requirement: string;
  status: PlannerCourseStatus;
};

export type PlannerTermPreview = {
  code: string;
  courses: PlannerCoursePreview[];
  isComplete?: boolean;
  label: string;
};

export type PlannerYearPreview = {
  canRemove?: boolean;
  label: string;
  terms: PlannerTermPreview[];
};

export type PlannerCourseSelection = {
  courseCode: string;
  programCode: string;
  programName: string;
  requirementLabel: string;
};

export type PlannerCourseMoveSelection = {
  course: PlannerCoursePreview;
  sourceTermCode: string;
};

export type CoursePrerequisitePreview = {
  code: string;
  note: string;
  status: 'satisfied' | 'planned' | 'missing';
};

export type CourseVersionPreview = {
  code: string;
  credits: number;
  description: string;
  effectiveYear: string;
  prerequisites: CoursePrerequisitePreview[];
  title: string;
  version: string;
};
