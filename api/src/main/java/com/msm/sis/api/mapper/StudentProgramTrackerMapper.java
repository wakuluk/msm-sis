package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.student.program.StudentCompletionRequirementResponse;
import com.msm.sis.api.dto.student.program.StudentProgramCompletionRequirementOptionResponse;
import com.msm.sis.api.dto.student.program.StudentProgramCompletionRequirementResponse;
import com.msm.sis.api.dto.student.program.StudentProgramResponse;
import com.msm.sis.api.dto.student.program.StudentProgramsResponse;
import com.msm.sis.api.dto.student.program.StudentRequirementCourseRuleResponse;
import com.msm.sis.api.dto.student.program.StudentRequirementMatchedCourseResponse;
import com.msm.sis.api.dto.student.program.StudentRequirementCourseResponse;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanCourseResponse;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanResponse;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanTermResponse;
import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanYearResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.DegreeType;
import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.ProgramType;
import com.msm.sis.api.entity.ProgramVersion;
import com.msm.sis.api.entity.ProgramVersionCompletionRequirement;
import com.msm.sis.api.entity.ProgramVersionCompletionRequirementOption;
import com.msm.sis.api.entity.ProgramVersionRequirement;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.RequirementCourse;
import com.msm.sis.api.entity.RequirementCourseRule;
import com.msm.sis.api.entity.StudentAcademicPlan;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import com.msm.sis.api.entity.StudentAcademicPlanTerm;
import com.msm.sis.api.entity.StudentAcademicPlanYear;
import com.msm.sis.api.entity.StudentProgram;
import com.msm.sis.api.service.student.StudentRequirementCourseEvaluation;
import com.msm.sis.api.service.student.StudentCompletedCourseTimelineCourse;
import com.msm.sis.api.service.student.StudentCompletedCourseTimelineTerm;
import com.msm.sis.api.service.student.StudentCompletedCourseTimelineYear;
import com.msm.sis.api.service.student.StudentRequirementEvaluationResult;
import com.msm.sis.api.service.student.StudentRequirementMatchedCourse;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class StudentProgramTrackerMapper {
    private static final int DEFAULT_PLANNER_YEAR_COUNT = 4;
    private static final String SOURCE_COMPLETED_HISTORY = "COMPLETED_HISTORY";
    private static final String SOURCE_STUDENT_PLAN = "STUDENT_PLAN";

    public StudentProgramsResponse toStudentProgramsResponse(
            Long studentId,
            boolean showSubtermPlanner,
            List<StudentProgramResponse> programs,
            StudentAcademicPlanResponse academicPlan
    ) {
        return new StudentProgramsResponse(studentId, showSubtermPlanner, programs, academicPlan);
    }

    public StudentProgramResponse toStudentProgramResponse(
            StudentProgram studentProgram,
            List<StudentCompletionRequirementResponse> requirements,
            List<StudentProgramCompletionRequirementResponse> completionRequirements
    ) {
        Program program = studentProgram.getProgram();
        ProgramVersion programVersion = studentProgram.getProgramVersion();
        ProgramType programType = program == null ? null : program.getProgramType();
        DegreeType degreeType = program == null ? null : program.getDegreeType();
        BigDecimal completed = sum(requirements.stream()
                .map(StudentCompletionRequirementResponse::completed)
                .toList());
        BigDecimal planned = sum(requirements.stream()
                .map(StudentCompletionRequirementResponse::planned)
                .toList());
        BigDecimal required = sum(requirements.stream()
                .map(StudentCompletionRequirementResponse::required)
                .toList());

        return new StudentProgramResponse(
                studentProgram.getId(),
                program == null ? null : program.getId(),
                programVersion == null ? null : programVersion.getId(),
                program == null ? null : program.getCode(),
                program == null ? null : program.getName(),
                programType == null ? null : programType.getCode(),
                programType == null ? null : programType.getName(),
                degreeType == null ? null : degreeType.getCode(),
                degreeType == null ? null : degreeType.getName(),
                programVersion == null ? null : programVersion.getVersionNumber(),
                programVersion == null ? null : programVersion.getClassYearStart(),
                programVersion == null ? null : programVersion.getClassYearEnd(),
                studentProgram.getStatus(),
                studentProgram.getDeclaredDate(),
                studentProgram.getCompletedDate(),
                completed,
                planned,
                required,
                "total",
                requirements,
                completionRequirements
        );
    }

    public StudentProgramCompletionRequirementResponse toStudentProgramCompletionRequirementResponse(
            ProgramVersionCompletionRequirement completionRequirement,
            boolean satisfied,
            int matchedCount,
            int completedCount,
            int plannedCount,
            String status,
            Map<Long, Integer> matchedCountsByOptionId,
            Map<Long, Integer> completedCountsByOptionId,
            Map<Long, Integer> plannedCountsByOptionId,
            Map<Long, String> statusesByOptionId
    ) {
        return new StudentProgramCompletionRequirementResponse(
                completionRequirement.getId(),
                completionRequirement.getMinimumCount(),
                completionRequirement.getSortOrder(),
                completionRequirement.getNotes(),
                satisfied,
                matchedCount,
                completedCount,
                plannedCount,
                status,
                completionRequirement.getOptions().stream()
                        .map(option -> toStudentProgramCompletionRequirementOptionResponse(
                                option,
                                matchedCountsByOptionId.getOrDefault(option.getId(), 0),
                                completedCountsByOptionId.getOrDefault(option.getId(), 0),
                                plannedCountsByOptionId.getOrDefault(option.getId(), 0),
                                statusesByOptionId.getOrDefault(option.getId(), "needed")
                        ))
                        .toList()
        );
    }

    private StudentProgramCompletionRequirementOptionResponse toStudentProgramCompletionRequirementOptionResponse(
            ProgramVersionCompletionRequirementOption option,
            int matchedCount,
            int completedCount,
            int plannedCount,
            String status
    ) {
        ProgramType requiredProgramType = option.getRequiredProgramType();
        Program requiredProgram = option.getRequiredProgram();
        ProgramVersion requiredProgramVersion = option.getRequiredProgramVersion();
        Program requiredProgramVersionProgram = requiredProgramVersion == null
                ? null
                : requiredProgramVersion.getProgram();

        return new StudentProgramCompletionRequirementOptionResponse(
                option.getId(),
                requiredProgramType == null ? null : requiredProgramType.getId(),
                requiredProgramType == null ? null : requiredProgramType.getCode(),
                requiredProgramType == null ? null : requiredProgramType.getName(),
                requiredProgram == null ? null : requiredProgram.getId(),
                requiredProgram == null ? null : requiredProgram.getCode(),
                requiredProgram == null ? null : requiredProgram.getName(),
                requiredProgramVersion == null ? null : requiredProgramVersion.getId(),
                requiredProgramVersion == null ? null : requiredProgramVersion.getVersionNumber(),
                requiredProgramVersionProgram == null ? null : requiredProgramVersionProgram.getCode(),
                requiredProgramVersionProgram == null ? null : requiredProgramVersionProgram.getName(),
                completedCount > 0,
                matchedCount,
                completedCount,
                plannedCount,
                status
        );
    }

    public StudentCompletionRequirementResponse toStudentCompletionRequirementResponse(
            ProgramVersionRequirement programVersionRequirement,
            List<RequirementCourse> requirementCourses,
            List<RequirementCourseRule> requirementCourseRules,
            Map<Long, CourseVersion> currentCourseVersionsByCourseId,
            StudentRequirementEvaluationResult evaluationResult
    ) {
        Requirement requirement = programVersionRequirement.getRequirement();

        return new StudentCompletionRequirementResponse(
                programVersionRequirement.getId(),
                requirement == null ? null : requirement.getId(),
                requirement == null ? null : requirement.getCode(),
                requirement == null ? null : requirement.getName(),
                requirement == null ? null : requirement.getRequirementType(),
                requirement == null ? null : requirement.getDescription(),
                evaluationResult.completed(),
                evaluationResult.planned(),
                evaluationResult.required(),
                evaluationResult.progressUnit(),
                requirement == null ? null : requirement.getMinimumCredits(),
                requirement == null ? null : requirement.getMinimumCourses(),
                requirement == null ? null : requirement.getCourseMatchMode(),
                requirement == null ? null : requirement.getMinimumGrade(),
                programVersionRequirement.isRequired(),
                programVersionRequirement.getSortOrder(),
                programVersionRequirement.getCourseReusePolicy(),
                programVersionRequirement.getNotes(),
                buildRequirementRules(requirement, requirementCourseRules),
                requirementCourseRules.stream()
                        .map(this::toStudentRequirementCourseRuleResponse)
                        .toList(),
                evaluationResult.matchedCourses().stream()
                        .map(this::toStudentRequirementMatchedCourseResponse)
                        .toList(),
                requirementCourses.stream()
                        .map(requirementCourse -> toStudentRequirementCourseResponse(
                                requirementCourse,
                                currentCourseVersionsByCourseId.get(courseId(requirementCourse)),
                                evaluationResult.courseEvaluations().getOrDefault(
                                        courseId(requirementCourse),
                                        StudentRequirementCourseEvaluation.needed()
                                )
                        ))
                        .toList()
        );
    }

    private StudentRequirementCourseRuleResponse toStudentRequirementCourseRuleResponse(
            RequirementCourseRule requirementCourseRule
    ) {
        AcademicDepartment department = requirementCourseRule.getDepartment();

        return new StudentRequirementCourseRuleResponse(
                requirementCourseRule.getId(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                requirementCourseRule.getMinimumCourseNumber(),
                requirementCourseRule.getMaximumCourseNumber(),
                requirementCourseRule.getMinimumCredits(),
                requirementCourseRule.getMinimumCourses(),
                requirementCourseRule.getMinimumGrade()
        );
    }

    private StudentRequirementMatchedCourseResponse toStudentRequirementMatchedCourseResponse(
            StudentRequirementMatchedCourse matchedCourse
    ) {
        return new StudentRequirementMatchedCourseResponse(
                matchedCourse.courseId(),
                matchedCourse.courseCode(),
                matchedCourse.title(),
                matchedCourse.credits(),
                matchedCourse.status(),
                matchedCourse.source(),
                matchedCourse.sourceRecordId(),
                matchedCourse.plannedCourseId(),
                matchedCourse.plannedTermLabel(),
                matchedCourse.plannedYearLabel()
        );
    }

    public StudentAcademicPlanResponse toStudentAcademicPlanResponse(StudentAcademicPlan academicPlan) {
        return toStudentAcademicPlanResponse(academicPlan, Map.of());
    }

    public StudentAcademicPlanResponse toStudentAcademicPlanResponse(
            StudentAcademicPlan academicPlan,
            Map<Long, List<String>> warningsByPlanCourseId
    ) {
        return toStudentAcademicPlanResponse(academicPlan, warningsByPlanCourseId, List.of());
    }

    public StudentAcademicPlanResponse toStudentAcademicPlanResponse(
            StudentAcademicPlan academicPlan,
            Map<Long, List<String>> warningsByPlanCourseId,
            List<StudentCompletedCourseTimelineYear> completedCourseTimeline
    ) {
        List<StudentAcademicPlanYearResponse> years = new ArrayList<>();
        years.addAll(completedCourseTimeline.stream()
                .map(this::toCompletedHistoryYearResponse)
                .toList());
        List<StudentAcademicPlanYearResponse> planYears = academicPlan.getYears().stream()
                .map(year -> toStudentAcademicPlanYearResponse(year, warningsByPlanCourseId))
                .toList();
        planYears = relabelPlanYearsAfterCompletedHistory(completedCourseTimeline, planYears);
        years.addAll(limitPlanYearsForDefaultDisplay(years.size(), planYears));

        return new StudentAcademicPlanResponse(
                academicPlan.getId(),
                academicPlan.getName(),
                academicPlan.isActive(),
                List.copyOf(years)
        );
    }

    private List<StudentAcademicPlanYearResponse> relabelPlanYearsAfterCompletedHistory(
            List<StudentCompletedCourseTimelineYear> completedCourseTimeline,
            List<StudentAcademicPlanYearResponse> planYears
    ) {
        Integer nextAcademicYearStart = completedCourseTimeline.stream()
                .map(StudentCompletedCourseTimelineYear::academicYearStartDate)
                .filter(startDate -> startDate != null)
                .map(LocalDate::getYear)
                .max(Integer::compareTo)
                .map(year -> year + 1)
                .orElse(null);
        if (nextAcademicYearStart == null) {
            return planYears;
        }

        List<StudentAcademicPlanYearResponse> relabeledYears = new ArrayList<>();
        for (int index = 0; index < planYears.size(); index++) {
            relabeledYears.add(withYearLabel(
                    planYears.get(index),
                    academicYearLabel(nextAcademicYearStart + index)
            ));
        }

        return relabeledYears;
    }

    private StudentAcademicPlanYearResponse withYearLabel(
            StudentAcademicPlanYearResponse year,
            String label
    ) {
        return new StudentAcademicPlanYearResponse(
                year.studentAcademicPlanYearId(),
                label,
                year.sortOrder(),
                year.canRemove(),
                year.source(),
                year.readOnly(),
                year.plannedCredits(),
                year.terms()
        );
    }

    private String academicYearLabel(int startYear) {
        return "Academic Year " + startYear + "-" + (startYear + 1);
    }

    private List<StudentAcademicPlanYearResponse> limitPlanYearsForDefaultDisplay(
            int completedHistoryYearCount,
            List<StudentAcademicPlanYearResponse> planYears
    ) {
        int remainingDefaultSlots = Math.max(0, DEFAULT_PLANNER_YEAR_COUNT - completedHistoryYearCount);
        List<StudentAcademicPlanYearResponse> visiblePlanYears = new ArrayList<>();

        for (int index = 0; index < planYears.size(); index++) {
            StudentAcademicPlanYearResponse planYear = planYears.get(index);
            if (index < remainingDefaultSlots || planYear.canRemove() || hasPlannedCourses(planYear)) {
                visiblePlanYears.add(planYear);
            }
        }

        return visiblePlanYears;
    }

    private boolean hasPlannedCourses(StudentAcademicPlanYearResponse year) {
        return year.terms().stream()
                .flatMap(term -> term.courses().stream())
                .anyMatch(course -> !course.readOnly());
    }

    private StudentAcademicPlanYearResponse toStudentAcademicPlanYearResponse(
            StudentAcademicPlanYear academicPlanYear,
            Map<Long, List<String>> warningsByPlanCourseId
    ) {
        List<StudentAcademicPlanTermResponse> terms = academicPlanYear.getTerms().stream()
                .map(term -> toStudentAcademicPlanTermResponse(term, warningsByPlanCourseId))
                .toList();

        return new StudentAcademicPlanYearResponse(
                academicPlanYear.getId(),
                academicPlanYear.getLabel(),
                academicPlanYear.getSortOrder(),
                academicPlanYear.isCanRemove(),
                SOURCE_STUDENT_PLAN,
                false,
                sum(terms.stream()
                        .map(StudentAcademicPlanTermResponse::plannedCredits)
                        .toList()),
                terms
        );
    }

    private StudentAcademicPlanTermResponse toStudentAcademicPlanTermResponse(
            StudentAcademicPlanTerm academicPlanTerm,
            Map<Long, List<String>> warningsByPlanCourseId
    ) {
        List<StudentAcademicPlanCourseResponse> courses = academicPlanTerm.getCourses().stream()
                .map(course -> toStudentAcademicPlanCourseResponse(course, warningsByPlanCourseId))
                .toList();

        return new StudentAcademicPlanTermResponse(
                academicPlanTerm.getId(),
                academicPlanTerm.getLabel(),
                academicPlanTerm.getSortOrder(),
                academicPlanTerm.isComplete(),
                SOURCE_STUDENT_PLAN,
                false,
                sum(courses.stream()
                        .map(StudentAcademicPlanCourseResponse::credits)
                        .toList()),
                courses
        );
    }

    private StudentAcademicPlanCourseResponse toStudentAcademicPlanCourseResponse(
            StudentAcademicPlanCourse academicPlanCourse,
            Map<Long, List<String>> warningsByPlanCourseId
    ) {
        Course course = academicPlanCourse.getCourse();
        AcademicSubject subject = course == null ? null : course.getSubject();
        Requirement requirement = academicPlanCourse.getRequirement();
        StudentProgram studentProgram = academicPlanCourse.getStudentProgram();
        Program program = studentProgram == null ? null : studentProgram.getProgram();
        AcademicDepartment placeholderDepartment = academicPlanCourse.getPlaceholderDepartment();

        return new StudentAcademicPlanCourseResponse(
                academicPlanCourse.getId(),
                course == null ? null : course.getId(),
                studentProgram == null ? null : studentProgram.getId(),
                requirement == null ? null : requirement.getId(),
                subject == null ? academicPlanCourse.getPlaceholderSubjectCode() : subject.getCode(),
                course == null ? null : course.getCourseNumber(),
                course == null ? academicPlanCourse.getPlaceholderLabel() : courseCode(course),
                course == null ? academicPlanCourse.getPlaceholderLabel() : null,
                academicPlanCourse.getCredits(),
                academicPlanCourse.getPlannerBucketCode(),
                academicPlanCourse.getPlannerBucketLabel(),
                academicPlanCourse.getPlaceholderType(),
                academicPlanCourse.getPlaceholderLabel(),
                academicPlanCourse.getPlaceholderSubjectCode(),
                placeholderDepartment == null ? null : placeholderDepartment.getId(),
                placeholderDepartment == null ? null : placeholderDepartment.getCode(),
                academicPlanCourse.getPlaceholderMinimumCourseNumber(),
                academicPlanCourse.getPlaceholderMaximumCourseNumber(),
                requirement == null ? null : requirement.getName(),
                program == null ? null : program.getCode(),
                program == null ? null : program.getName(),
                academicPlanCourse.getStatus(),
                academicPlanCourse.getSortOrder(),
                academicPlanCourse.getNotes(),
                SOURCE_STUDENT_PLAN,
                false,
                null,
                null,
                warningsByPlanCourseId.getOrDefault(academicPlanCourse.getId(), List.of())
        );
    }

    private StudentAcademicPlanYearResponse toCompletedHistoryYearResponse(
            StudentCompletedCourseTimelineYear timelineYear
    ) {
        List<StudentAcademicPlanTermResponse> terms = timelineYear.terms().stream()
                .map(this::toCompletedHistoryTermResponse)
                .toList();

        return new StudentAcademicPlanYearResponse(
                generatedHistoryId(timelineYear.academicYearId()),
                timelineYear.academicYearName(),
                timelineYear.sortOrder(),
                false,
                SOURCE_COMPLETED_HISTORY,
                true,
                sum(terms.stream()
                        .map(StudentAcademicPlanTermResponse::plannedCredits)
                        .toList()),
                terms
        );
    }

    private StudentAcademicPlanTermResponse toCompletedHistoryTermResponse(
            StudentCompletedCourseTimelineTerm timelineTerm
    ) {
        List<StudentAcademicPlanCourseResponse> courses = timelineTerm.courses().stream()
                .map(this::toCompletedHistoryCourseResponse)
                .toList();

        return new StudentAcademicPlanTermResponse(
                generatedHistoryId(timelineTerm.termId()),
                timelineTerm.termName(),
                timelineTerm.termSortOrder(),
                true,
                SOURCE_COMPLETED_HISTORY,
                true,
                sum(courses.stream()
                        .map(StudentAcademicPlanCourseResponse::credits)
                        .toList()),
                courses
        );
    }

    private StudentAcademicPlanCourseResponse toCompletedHistoryCourseResponse(
            StudentCompletedCourseTimelineCourse timelineCourse
    ) {
        return new StudentAcademicPlanCourseResponse(
                generatedHistoryId(timelineCourse.enrollmentId()),
                timelineCourse.courseId(),
                null,
                null,
                timelineCourse.subjectCode(),
                timelineCourse.courseNumber(),
                timelineCourse.courseCode(),
                timelineCourse.title(),
                timelineCourse.creditsEarned(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "complete",
                0,
                null,
                SOURCE_COMPLETED_HISTORY,
                true,
                timelineCourse.gradeCode(),
                timelineCourse.completedDate() == null ? null : timelineCourse.completedDate().toString(),
                List.of()
        );
    }

    private Long generatedHistoryId(Long id) {
        return id == null ? null : -Math.abs(id);
    }

    private StudentRequirementCourseResponse toStudentRequirementCourseResponse(
            RequirementCourse requirementCourse,
            CourseVersion currentCourseVersion,
            StudentRequirementCourseEvaluation courseEvaluation
    ) {
        Course course = requirementCourse.getCourse();
        AcademicSubject subject = course == null ? null : course.getSubject();

        return new StudentRequirementCourseResponse(
                course == null ? null : course.getId(),
                subject == null ? null : subject.getCode(),
                course == null ? null : course.getCourseNumber(),
                courseCode(course),
                currentCourseVersion == null ? null : currentCourseVersion.getTitle(),
                currentCourseVersion == null ? null : currentCourseVersion.getMaxCredits(),
                courseEvaluation.status(),
                courseEvaluation.evidenceType(),
                courseEvaluation.evidenceId(),
                courseEvaluation.plannedCourseId(),
                List.of()
        );
    }

    private List<String> buildRequirementRules(
            Requirement requirement,
            List<RequirementCourseRule> requirementCourseRules
    ) {
        if (requirement == null) {
            return List.of();
        }

        if (!requirementCourseRules.isEmpty()) {
            return requirementCourseRules.stream()
                    .map(this::describeRequirementCourseRule)
                    .toList();
        }

        if (requirement.getMinimumCredits() != null) {
            return List.of("Complete " + requirement.getMinimumCredits() + " credits.");
        }

        if (requirement.getMinimumCourses() != null) {
            return List.of("Complete " + requirement.getMinimumCourses() + " courses.");
        }

        return List.of();
    }

    private String describeRequirementCourseRule(RequirementCourseRule requirementCourseRule) {
        String departmentCode = requirementCourseRule.getDepartment() == null
                ? "the selected department"
                : requirementCourseRule.getDepartment().getCode();
        String courseNumberText = requirementCourseRule.getMinimumCourseNumber() == null
                ? ""
                : " at or above " + requirementCourseRule.getMinimumCourseNumber();

        if (requirementCourseRule.getMinimumCredits() != null) {
            return "Complete " + requirementCourseRule.getMinimumCredits()
                    + " credits in " + departmentCode + courseNumberText + ".";
        }

        if (requirementCourseRule.getMinimumCourses() != null) {
            return "Complete " + requirementCourseRule.getMinimumCourses()
                    + " courses in " + departmentCode + courseNumberText + ".";
        }

        return "Complete courses in " + departmentCode + courseNumberText + ".";
    }

    private BigDecimal requiredValue(Requirement requirement) {
        if (requirement == null) {
            return BigDecimal.ZERO;
        }

        if (requirement.getMinimumCredits() != null) {
            return requirement.getMinimumCredits();
        }

        if (requirement.getMinimumCourses() != null) {
            return BigDecimal.valueOf(requirement.getMinimumCourses());
        }

        return BigDecimal.ZERO;
    }

    private String progressUnit(Requirement requirement) {
        if (requirement == null) {
            return "courses";
        }

        return requirement.getMinimumCredits() == null ? "courses" : "credits";
    }

    private Long courseId(RequirementCourse requirementCourse) {
        return requirementCourse.getCourse() == null ? null : requirementCourse.getCourse().getId();
    }

    private String courseCode(Course course) {
        if (course == null || course.getSubject() == null) {
            return null;
        }

        return course.getSubject().getCode() + " " + course.getCourseNumber();
    }

    private BigDecimal sum(List<BigDecimal> values) {
        return values.stream()
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
