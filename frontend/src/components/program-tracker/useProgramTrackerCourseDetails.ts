import { useState } from 'react';
import type { CourseVersionDetailResponse } from '@/services/schemas/course-schemas';
import type { CourseVersionDetailModalState } from './CourseVersionDetailModal';

export type ProgramTrackerCourseDetailsActions = {
  loadCourseVersion: (request: {
    courseId: number;
    signal?: AbortSignal;
  }) => Promise<CourseVersionDetailResponse>;
};

export function useProgramTrackerCourseDetails({
  actions,
}: {
  actions: ProgramTrackerCourseDetailsActions;
}) {
  const [courseVersionModalState, setCourseVersionModalState] =
    useState<CourseVersionDetailModalState>({ status: 'idle' });

  function closeCourseVersionModal() {
    setCourseVersionModalState({ status: 'idle' });
  }

  async function openCourseVersionModal(courseId: number, courseCode: string) {
    setCourseVersionModalState({ status: 'loading', courseCode });

    try {
      const courseVersion = await actions.loadCourseVersion({ courseId });
      setCourseVersionModalState({ status: 'success', courseVersion });
    } catch (error) {
      setCourseVersionModalState({
        status: 'error',
        courseCode,
        message: error instanceof Error ? error.message : 'Failed to load course details.',
      });
    }
  }

  return {
    closeCourseVersionModal,
    courseVersionModalState,
    openCourseVersionModal,
  };
}
