import type { CourseResponse } from '@/services/schemas/academic-department-schemas';

export type SubjectCoursesState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; courses: CourseResponse[] };
