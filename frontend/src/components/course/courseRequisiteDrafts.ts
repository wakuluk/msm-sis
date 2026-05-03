import type {
  CourseVersionDetailResponse,
  CourseVersionRequisiteConditionType,
  CourseVersionRequisiteType,
  CreateCourseVersionRequisiteGroupRequest,
} from '@/services/schemas/course-schemas';
import type { CourseReferenceOption } from '@/services/schemas/reference-schemas';

export type CourseRequisiteCourseDraft = {
  id: number;
  departmentId: number | string;
  courseId: number | string;
  courseCode: string;
  courseTitle: string;
  pendingAssociatedLab?: boolean;
};

export type CourseRequisiteGroupDraft = {
  id: number;
  requisiteType: CourseVersionRequisiteType;
  conditionType: CourseVersionRequisiteConditionType;
  minimumRequired: number | string;
  courses: CourseRequisiteCourseDraft[];
};

export type BuildCourseRequisitesResult =
  | { status: 'valid'; requisites: CreateCourseVersionRequisiteGroupRequest[] }
  | { status: 'invalid'; message: string };

export const emptyCourseRequisites: CourseRequisiteGroupDraft[] = [];

const associatedLabCorequisiteGroupId = -9001;
const associatedLabCorequisiteCourseId = -9002;
const associatedLabCourseId = 'associated-lab';

export function createEmptyRequisiteGroup(
  requisiteType: CourseVersionRequisiteType = 'PREREQUISITE'
): CourseRequisiteGroupDraft {
  return {
    id: Date.now(),
    requisiteType,
    conditionType: 'ALL',
    minimumRequired: '',
    courses: [],
  };
}

export function createEmptyRequisiteCourse(): CourseRequisiteCourseDraft {
  return {
    id: Date.now(),
    departmentId: '',
    courseId: '',
    courseCode: '',
    courseTitle: '',
  };
}

export function removeAssociatedLabCorequisiteDraft(
  groups: CourseRequisiteGroupDraft[]
): CourseRequisiteGroupDraft[] {
  return groups.filter((group) => group.id !== associatedLabCorequisiteGroupId);
}

export function upsertAssociatedLabCorequisiteDraft({
  courseCode,
  courseTitle,
  groups,
}: {
  courseCode: string;
  courseTitle: string;
  groups: CourseRequisiteGroupDraft[];
}): CourseRequisiteGroupDraft[] {
  const nextCourse: CourseRequisiteCourseDraft = {
    id: associatedLabCorequisiteCourseId,
    departmentId: '',
    courseId: associatedLabCourseId,
    courseCode: courseCode.trim() || 'Associated lab',
    courseTitle: courseTitle.trim() || 'Pending lab course',
    pendingAssociatedLab: true,
  };
  const nextGroup: CourseRequisiteGroupDraft = {
    id: associatedLabCorequisiteGroupId,
    requisiteType: 'COREQUISITE',
    conditionType: 'ALL',
    minimumRequired: '',
    courses: [nextCourse],
  };
  const existingIndex = groups.findIndex((group) => group.id === associatedLabCorequisiteGroupId);

  if (existingIndex === -1) {
    return [...groups, nextGroup];
  }

  return groups.map((group) => (group.id === associatedLabCorequisiteGroupId ? nextGroup : group));
}

export function courseReferenceToDraft(
  course: CourseReferenceOption
): Omit<CourseRequisiteCourseDraft, 'id'> {
  return {
    departmentId: course.departmentId,
    courseId: course.courseId,
    courseCode: course.courseCode,
    courseTitle: course.currentVersionTitle ?? '',
  };
}

export function buildCourseRequisitesRequest(
  groups: CourseRequisiteGroupDraft[]
): BuildCourseRequisitesResult {
  const requisites: CreateCourseVersionRequisiteGroupRequest[] = [];

  for (const [groupIndex, group] of groups.entries()) {
    const persistedCourses = group.courses.filter((course) => !course.pendingAssociatedLab);

    if (group.courses.length > 0 && persistedCourses.length === 0) {
      continue;
    }

    if (persistedCourses.length === 0) {
      return {
        status: 'invalid',
        message: `Requisite group ${groupIndex + 1} needs at least one course.`,
      };
    }

    const courseIds = new Set<number>();
    const courses = [];

    for (const course of persistedCourses) {
      const courseId = Number(course.courseId);

      if (!Number.isInteger(courseId) || courseId <= 0) {
        return {
          status: 'invalid',
          message: `Requisite group ${groupIndex + 1} has an invalid course.`,
        };
      }

      if (courseIds.has(courseId)) {
        return {
          status: 'invalid',
          message: `Requisite group ${groupIndex + 1} has duplicate courses.`,
        };
      }

      courseIds.add(courseId);
      courses.push({
        courseId,
        sortOrder: courses.length,
      });
    }

    const minimumRequired =
      group.conditionType === 'ANY' ? Number(group.minimumRequired) : null;

    if (group.conditionType === 'ANY') {
      if (
        minimumRequired === null ||
        !Number.isInteger(minimumRequired) ||
        minimumRequired <= 0
      ) {
        return {
          status: 'invalid',
          message: `Requisite group ${groupIndex + 1} needs a minimum required value.`,
        };
      }

      if (minimumRequired > courses.length) {
        return {
          status: 'invalid',
          message: `Requisite group ${groupIndex + 1} minimum required cannot exceed its courses.`,
        };
      }
    }

    requisites.push({
      requisiteType: group.requisiteType,
      conditionType: group.conditionType,
      minimumRequired,
      sortOrder: groupIndex,
      courses,
    });
  }

  return { status: 'valid', requisites };
}

export function courseVersionToRequisiteDrafts(
  courseVersion: CourseVersionDetailResponse
): CourseRequisiteGroupDraft[] {
  return (courseVersion.requisites ?? []).map((group, groupIndex) => ({
    id: Date.now() + groupIndex,
    requisiteType: group.requisiteType,
    departmentId: '',
    conditionType: group.conditionType,
    minimumRequired: group.minimumRequired ?? '',
    courses: group.courses.map((course, courseIndex) => ({
      id: Date.now() + groupIndex * 100 + courseIndex,
      departmentId: '',
      courseId: course.courseId ?? '',
      courseCode: course.courseCode ?? '',
      courseTitle: '',
    })),
  }));
}
