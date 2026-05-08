import type {
  StudentAcademicPlanDraftRequest,
  StudentAcademicPlanResponse,
  StudentProgramRequestReviewNoteResponse,
  StudentProgramRequestReviewResponse,
  StudentProgramResponse,
  StudentProgramsResponse,
} from '@/services/schemas/student-program-schemas';
import type {
  ProgramTrackerPlannerCourse,
  ProgramTrackerPlannerTerm,
  ProgramTrackerPlannerYear,
  ProgramTrackerRequestReviewNote,
  RequirementCourseStatus,
  ProgramTrackerProgram,
} from './program-tracker.types';
import { normalizeProgramTrackerBucketCode } from './program-tracker.helpers';

export function mapProgramTrackerResponseToPrograms(
  response: StudentProgramsResponse
): ProgramTrackerProgram[] {
  return response.programs.map(mapProgramTrackerResponseToProgram);
}

export function mapAcademicPlanResponseToProgramTrackerYears(
  academicPlan: StudentAcademicPlanResponse
): ProgramTrackerPlannerYear[] {
  return academicPlan.years.map((year) => ({
    canRemove: year.canRemove,
    label: year.label,
    readOnly: year.readOnly,
    source: year.source ?? undefined,
    sortOrder: year.sortOrder,
    studentAcademicPlanYearId: year.studentAcademicPlanYearId,
    terms: year.terms.map((term) => ({
      code: String(term.studentAcademicPlanTermId),
      courses: term.courses.map(mapAcademicPlanCourseResponseToProgramTrackerCourse),
      isComplete: term.complete,
      label: term.label,
      readOnly: term.readOnly,
      source: term.source ?? undefined,
      sortOrder: term.sortOrder,
      studentAcademicPlanTermId: term.studentAcademicPlanTermId,
    })),
  }));
}

export function mapProgramTrackerYearsToAcademicPlanDraftRequest({
  name,
  studentAcademicPlanId,
  years,
}: {
  name: string;
  studentAcademicPlanId: number | null;
  years: ProgramTrackerPlannerYear[];
}): StudentAcademicPlanDraftRequest {
  return {
    studentAcademicPlanId: persistedIdOrNull(studentAcademicPlanId),
    name,
    years: years
      .filter((year) => !year.readOnly)
      .map((year, yearIndex) => ({
        studentAcademicPlanYearId: persistedIdOrNull(year.studentAcademicPlanYearId),
        label: year.label,
        sortOrder: yearIndex,
        canRemove: year.canRemove ?? true,
        terms: year.terms
          .filter((term) => !term.readOnly)
          .map((term, termIndex) => ({
            studentAcademicPlanTermId: persistedIdOrNull(term.studentAcademicPlanTermId),
            label: term.label,
            sortOrder: termIndex,
            complete: term.isComplete ?? false,
            courses: term.courses
              .filter((course) => !course.readOnly)
              .filter((course) => course.courseId !== undefined || course.placeholderType !== undefined)
              .map((course, courseIndex) => ({
                studentAcademicPlanCourseId: persistedIdOrNull(course.plannerCourseId),
                courseId: course.courseId ?? null,
                studentProgramId: course.studentProgramId ?? null,
                requirementId: course.requirementId ?? null,
                credits: getDraftCourseCredits(course),
                plannerBucketCode: course.plannerBucketCode ?? 'FULL_TERM',
                plannerBucketLabel: course.plannerBucketLabel ?? null,
                placeholderType: course.placeholderType ?? null,
                placeholderLabel: course.placeholderLabel ?? null,
                placeholderSubjectCode: course.placeholderSubjectCode ?? null,
                placeholderDepartmentId: course.placeholderDepartmentId ?? null,
                placeholderMinimumCourseNumber: course.placeholderMinimumCourseNumber ?? null,
                placeholderMaximumCourseNumber: course.placeholderMaximumCourseNumber ?? null,
                sortOrder: courseIndex,
                notes: course.notes ?? null,
              })),
          })),
      })),
  };
}

function persistedIdOrNull(id: number | null | undefined) {
  return id !== undefined && id !== null && id > 0 ? id : null;
}

function getDraftCourseCredits(
  course: ProgramTrackerPlannerCourse
): number | null {
  if (course.courseId !== undefined && course.credits <= 0) {
    return null;
  }

  return course.credits;
}

function mapProgramTrackerResponseToProgram(
  program: StudentProgramResponse
): ProgramTrackerProgram {
  return {
    code: program.programCode ?? `program-${program.studentProgramId}`,
    completed: program.completed,
    name: program.programName ?? 'Program',
    planned: program.planned,
    required: program.required,
    requestStatus: program.programRequestStatus ?? undefined,
    requestedAt: program.programRequestedAt ?? undefined,
    requestReview: mapProgramRequestReview(program.programRequestReview),
    status: program.status ?? 'Active',
    studentProgramRequestId: program.studentProgramRequestId ?? undefined,
    type: program.programTypeName ?? program.programTypeCode ?? 'Program',
    version: '',
    requirements: program.requirements.map((requirement) => ({
      completed: requirement.completed,
      courseRules: requirement.courseRules.map((rule) => ({
        departmentCode: rule.departmentCode ?? undefined,
        departmentId: rule.departmentId ?? undefined,
        maximumCourseNumber: rule.maximumCourseNumber ?? undefined,
        minimumCourseNumber: rule.minimumCourseNumber ?? undefined,
        minimumCourses: rule.minimumCourses ?? undefined,
        minimumCredits: rule.minimumCredits ?? undefined,
        requirementCourseRuleId: rule.requirementCourseRuleId,
      })),
      courses: requirement.courses.map((course) => ({
        code: course.courseCode ?? [course.subjectCode, course.courseNumber].filter(Boolean).join(' '),
        courseId: course.courseId ?? undefined,
        credits: course.credits ?? undefined,
        plannedCourseId: course.plannedCourseId ?? undefined,
        status: normalizeRequirementCourseStatus(course.status),
        title: course.title ?? undefined,
      })),
      label: requirement.requirementName ?? requirement.requirementCode ?? 'Requirement',
      matchedCourses: requirement.matchedCourses.map((matchedCourse) => ({
        code: matchedCourse.courseCode ?? `course-${matchedCourse.courseId ?? 'unknown'}`,
        credits: matchedCourse.credits ?? undefined,
        plannedTermLabel: matchedCourse.plannedTermLabel ?? undefined,
        plannedYearLabel: matchedCourse.plannedYearLabel ?? undefined,
        source: matchedCourse.source ?? undefined,
        status: matchedCourse.status === 'planned' ? 'planned' : 'completed',
        title: matchedCourse.title ?? undefined,
      })),
      planned: requirement.planned,
      required: requirement.required,
      requirementId: requirement.requirementId ?? undefined,
      requirementType: requirement.requirementType ?? undefined,
      rules: requirement.rules,
      unit: requirement.progressUnit === 'credits' ? 'credits' : 'courses',
    })),
    completionRequirements: program.completionRequirements.map((completionRequirement) => {
      const options = completionRequirement.options.map((option) => ({
        completedCount: option.completedCount,
        label: formatCompletionRequirementOption(option),
        matchedCount: option.matchedCount,
        plannedCount: option.plannedCount,
        satisfied: option.satisfied,
        status: normalizeCompletionRequirementStatus(option.status),
      }));

      return {
        completedCount: completionRequirement.completedCount,
        label:
          options.length === 0
            ? 'Additional program required'
            : `Complete ${completionRequirement.minimumCount} of: ${options
                .map((option) => option.label)
                .join(', ')}`,
        matchedCount: completionRequirement.matchedCount,
        minimumCount: completionRequirement.minimumCount,
        notes: completionRequirement.notes ?? undefined,
        options,
        plannedCount: completionRequirement.plannedCount,
        satisfied: completionRequirement.satisfied,
        status: normalizeCompletionRequirementStatus(completionRequirement.status),
      };
    }),
    studentProgramId: program.studentProgramId,
  };
}

function mapProgramRequestReview(
  review: StudentProgramRequestReviewResponse | null
): ProgramTrackerProgram['requestReview'] {
  if (review === null) {
    return undefined;
  }

  return {
    adminReview: mapProgramRequestReviewNote(review.adminReview),
    departmentReview: mapProgramRequestReviewNote(review.departmentReview),
    requestedAt: review.requestedAt ?? undefined,
    status: review.status ?? undefined,
    studentProgramRequestId: review.studentProgramRequestId,
  };
}

function mapProgramRequestReviewNote(
  reviewNote: StudentProgramRequestReviewNoteResponse | null
): ProgramTrackerRequestReviewNote | undefined {
  if (reviewNote === null) {
    return undefined;
  }

  return {
    comment: reviewNote.comment ?? undefined,
    reviewedAt: reviewNote.reviewedAt ?? undefined,
    reviewedByEmail: reviewNote.reviewedByEmail ?? undefined,
    signatureAt: reviewNote.signatureAt ?? undefined,
    signatureEmail: reviewNote.signatureEmail ?? undefined,
    signatureName: reviewNote.signatureName ?? undefined,
  };
}

function formatCompletionRequirementOption(
  option: StudentProgramResponse['completionRequirements'][number]['options'][number]
) {
  if (option.requiredProgramTypeName !== null) {
    return `Any ${option.requiredProgramTypeName.toLowerCase()}`;
  }

  if (option.requiredProgramName !== null) {
    return option.requiredProgramCode === null
      ? option.requiredProgramName
      : `${option.requiredProgramName} (${option.requiredProgramCode})`;
  }

  if (option.requiredProgramVersionId !== null) {
    return option.requiredProgramVersionProgramName ?? 'Program';
  }

  return 'Program option';
}

function mapAcademicPlanCourseResponseToProgramTrackerCourse(
  course: StudentAcademicPlanResponse['years'][number]['terms'][number]['courses'][number]
): ProgramTrackerPlannerCourse {
  return {
    code: course.courseCode ?? [course.subjectCode, course.courseNumber].filter(Boolean).join(' '),
    courseId: course.courseId ?? undefined,
    credits: course.credits ?? 0,
    notes: course.notes ?? undefined,
    readOnly: course.readOnly,
    source: course.source ?? undefined,
    gradeCode: course.gradeCode ?? undefined,
    completedDate: course.completedDate ?? undefined,
    plannerBucketCode: course.plannerBucketCode ?? normalizeProgramTrackerBucketCode(course.plannerBucketLabel),
    plannerCourseId: course.studentAcademicPlanCourseId,
    plannerClientId:
      course.studentAcademicPlanCourseId > 0
        ? `saved-${course.studentAcademicPlanCourseId}`
        : `draft-${course.studentAcademicPlanCourseId}`,
    plannerBucketLabel: course.plannerBucketLabel ?? undefined,
    placeholderDepartmentCode: course.placeholderDepartmentCode ?? undefined,
    placeholderDepartmentId: course.placeholderDepartmentId ?? undefined,
    placeholderLabel: course.placeholderLabel ?? undefined,
    placeholderMaximumCourseNumber: course.placeholderMaximumCourseNumber ?? undefined,
    placeholderMinimumCourseNumber: course.placeholderMinimumCourseNumber ?? undefined,
    placeholderSubjectCode: course.placeholderSubjectCode ?? undefined,
    placeholderType: course.placeholderType ?? undefined,
    programCode: course.programCode ?? undefined,
    programName: course.programName ?? undefined,
    requirement: course.requirementName ?? 'Requirement',
    requirementId: course.requirementId ?? undefined,
    status: normalizePlannerCourseStatus(course.status),
    studentProgramId: course.studentProgramId ?? undefined,
    title: course.title ?? undefined,
    warnings: course.warnings,
  };
}

function normalizeRequirementCourseStatus(status: string): RequirementCourseStatus {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === 'complete' || normalizedStatus === 'completed') {
    return 'complete';
  }

  return normalizedStatus === 'planned' ? 'planned' : 'needed';
}

function normalizePlannerCourseStatus(status: string): ProgramTrackerPlannerCourse['status'] {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === 'complete' || normalizedStatus === 'completed') {
    return 'complete';
  }

  return normalizedStatus === 'needed' ? 'needed' : 'planned';
}

function normalizeCompletionRequirementStatus(status: string): 'completed' | 'planned' | 'needed' {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === 'completed' || normalizedStatus === 'complete') {
    return 'completed';
  }

  return normalizedStatus === 'planned' ? 'planned' : 'needed';
}
