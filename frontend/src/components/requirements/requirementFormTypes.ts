import type {
  AcademicDepartmentReferenceOption,
  CourseReferenceOption,
} from '@/services/schemas/reference-schemas';

export type RequirementFormValues = {
  code: string;
  name: string;
  requirementType: string;
  description: string;
  minimumCredits: number | string;
  minimumCourses: number | string;
  courseMatchMode: string;
  minimumGrade: string;
};

export type SpecificCourseDraft = {
  id: number;
  courseId: number | string;
  subjectCode: string;
  courseNumber: string;
  courseCode: string;
  courseTitle: string;
  minimumGrade: string;
  required: boolean;
};

export type DepartmentCourseRuleDraft = {
  id: number;
  departmentId: number | string;
  departmentCode: string;
  departmentName?: string;
  minimumCourseNumber: number | string;
  maximumCourseNumber: number | string;
  minimumCredits: number | string;
  minimumCourses: number | string;
  minimumGrade: string;
};

export type CourseOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; courses: CourseReferenceOption[] }
  | { status: 'error'; message: string };

export type DepartmentOptionsState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; departments: AcademicDepartmentReferenceOption[] }
  | { status: 'error'; message: string };

export const requirementTypeOptions = [
  { value: 'TOTAL_ELECTIVE_CREDITS', label: 'Elective credits' },
  { value: 'SPECIFIC_COURSES', label: 'Specific courses' },
  { value: 'DEPARTMENT_LEVEL_COURSES', label: 'Department courses' },
  { value: 'MANUAL', label: 'Manual review' },
];

export const courseMatchModeOptions = [
  { value: 'ALL', label: 'All listed courses' },
  { value: 'ANY', label: 'Choose from listed courses' },
];

export const initialRequirementFormValues: RequirementFormValues = {
  code: '',
  name: '',
  requirementType: 'TOTAL_ELECTIVE_CREDITS',
  description: '',
  minimumCredits: '',
  minimumCourses: '',
  courseMatchMode: 'ALL',
  minimumGrade: '',
};
