package com.msm.sis.api.service.student;

import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.CourseVersionRequisiteCourse;
import com.msm.sis.api.entity.CourseVersionRequisiteGroup;
import com.msm.sis.api.entity.StudentAcademicPlan;
import com.msm.sis.api.entity.StudentAcademicPlanCourse;
import com.msm.sis.api.entity.StudentAcademicPlanTerm;
import com.msm.sis.api.entity.StudentAcademicPlanYear;
import com.msm.sis.api.repository.CourseVersionRepository;
import com.msm.sis.api.repository.CourseVersionRequisiteCourseRepository;
import com.msm.sis.api.repository.CourseVersionRequisiteGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentAcademicPlanWarningService {
    private static final String REQUISITE_TYPE_PREREQUISITE = "PREREQUISITE";
    private static final String REQUISITE_TYPE_COREQUISITE = "COREQUISITE";
    private static final String CONDITION_TYPE_ANY = "ANY";
    private static final String PLANNER_BUCKET_FULL_TERM = "FULL_TERM";
    private static final String PLANNER_BUCKET_SESSION_A = "SESSION_A";
    private static final String PLANNER_BUCKET_SESSION_B = "SESSION_B";

    private final CourseVersionRepository courseVersionRepository;
    private final CourseVersionRequisiteGroupRepository requisiteGroupRepository;
    private final CourseVersionRequisiteCourseRepository requisiteCourseRepository;
    private final StudentCourseEvidenceService studentCourseEvidenceService;

    public Map<Long, List<String>> buildWarnings(Long studentId, StudentAcademicPlan academicPlan) {
        List<StudentAcademicPlanCourse> plannedCourses = plannedCourses(academicPlan);
        if (plannedCourses.isEmpty()) {
            return Map.of();
        }

        Map<Long, CourseVersion> latestVersionsByCourseId = latestVersionsByCourseId(plannedCourses);
        Map<Long, List<CourseVersionRequisiteGroup>> requisiteGroupsByVersionId =
                requisiteGroupsByVersionId(latestVersionsByCourseId.values().stream().toList());
        Map<Long, List<CourseVersionRequisiteCourse>> requisiteCoursesByGroupId =
                requisiteCoursesByGroupId(requisiteGroupsByVersionId.values().stream()
                        .flatMap(List::stream)
                        .toList());
        Set<Long> completedCourseIds = completedCourseIds(studentId);
        Map<Long, List<StudentAcademicPlanCourse>> plannedCoursesByCourseId = plannedCourses.stream()
                .filter(planCourse -> planCourse.getCourse() != null)
                .collect(Collectors.groupingBy(planCourse -> planCourse.getCourse().getId()));

        Map<Long, List<String>> warningsByPlanCourseId = new LinkedHashMap<>();
        for (StudentAcademicPlanCourse plannedCourse : plannedCourses) {
            Course course = plannedCourse.getCourse();
            if (course == null) {
                continue;
            }

            CourseVersion latestVersion = latestVersionsByCourseId.get(course.getId());
            if (latestVersion == null) {
                continue;
            }

            List<String> warnings = requisiteGroupsByVersionId.getOrDefault(latestVersion.getId(), List.of())
                    .stream()
                    .map(group -> warningForGroup(
                            plannedCourse,
                            group,
                            requisiteCoursesByGroupId.getOrDefault(group.getId(), List.of()),
                            completedCourseIds,
                            plannedCoursesByCourseId
                    ))
                    .filter(Objects::nonNull)
                    .toList();

            if (!warnings.isEmpty()) {
                warningsByPlanCourseId.put(plannedCourse.getId(), warnings);
            }
        }

        return warningsByPlanCourseId;
    }

    private String warningForGroup(
            StudentAcademicPlanCourse targetCourse,
            CourseVersionRequisiteGroup group,
            List<CourseVersionRequisiteCourse> requisiteCourses,
            Set<Long> completedCourseIds,
            Map<Long, List<StudentAcademicPlanCourse>> plannedCoursesByCourseId
    ) {
        if (requisiteCourses.isEmpty()) {
            return null;
        }

        List<Course> courseOptions = requisiteCourses.stream()
                .map(CourseVersionRequisiteCourse::getCourse)
                .filter(Objects::nonNull)
                .toList();
        boolean corequisite = isCorequisite(group);
        Set<Long> satisfiedCourseIds = courseOptions.stream()
                .map(Course::getId)
                .filter(courseId -> isRequirementSatisfied(
                        courseId,
                        targetCourse,
                        completedCourseIds,
                        plannedCoursesByCourseId,
                        corequisite
                ))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (isAnyCondition(group)) {
            int required = minimumRequired(group);
            if (satisfiedCourseIds.size() >= required) {
                return null;
            }

            return "This course requires at least " + required + " of "
                    + describeCourses(courseOptions)
                    + timingDescription(corequisite) + "; only " + satisfiedCourseIds.size()
                    + " " + pluralize("is", "are", satisfiedCourseIds.size())
                    + satisfiedDescription(corequisite) + ".";
        }

        List<Course> missingCourses = courseOptions.stream()
                .filter(course -> !satisfiedCourseIds.contains(course.getId()))
                .toList();
        if (missingCourses.isEmpty()) {
            return null;
        }

        return "This course has " + requisiteLabel(corequisite) + " of " + describeCourses(missingCourses)
                + ", and " + pluralize("that course is", "those courses are", missingCourses.size())
                + " not " + missingTimingDescription(corequisite) + ".";
    }

    private boolean isRequirementSatisfied(
            Long courseId,
            StudentAcademicPlanCourse targetCourse,
            Set<Long> completedCourseIds,
            Map<Long, List<StudentAcademicPlanCourse>> plannedCoursesByCourseId,
            boolean corequisite
    ) {
        if (corequisite) {
            return isCompletedOrPlannedInSameTerm(
                    courseId,
                    targetCourse,
                    completedCourseIds,
                    plannedCoursesByCourseId
            );
        }

        return isCompletedOrPlannedEarlier(
                courseId,
                targetCourse,
                completedCourseIds,
                plannedCoursesByCourseId
        );
    }

    private boolean isCompletedOrPlannedEarlier(
            Long courseId,
            StudentAcademicPlanCourse targetCourse,
            Set<Long> completedCourseIds,
            Map<Long, List<StudentAcademicPlanCourse>> plannedCoursesByCourseId
    ) {
        if (completedCourseIds.contains(courseId)) {
            return true;
        }

        return plannedCoursesByCourseId.getOrDefault(courseId, List.of()).stream()
                .filter(plannedCourse -> !Objects.equals(plannedCourse.getId(), targetCourse.getId()))
                .anyMatch(plannedCourse -> isPlannedBeforeTarget(plannedCourse, targetCourse));
    }

    private boolean isCompletedOrPlannedInSameTerm(
            Long courseId,
            StudentAcademicPlanCourse targetCourse,
            Set<Long> completedCourseIds,
            Map<Long, List<StudentAcademicPlanCourse>> plannedCoursesByCourseId
    ) {
        if (completedCourseIds.contains(courseId)) {
            return true;
        }

        return plannedCoursesByCourseId.getOrDefault(courseId, List.of()).stream()
                .filter(plannedCourse -> !Objects.equals(plannedCourse.getId(), targetCourse.getId()))
                .anyMatch(plannedCourse -> sameTerm(plannedCourse, targetCourse));
    }

    private boolean sameTerm(
            StudentAcademicPlanCourse first,
            StudentAcademicPlanCourse second
    ) {
        StudentAcademicPlanTerm firstTerm = first.getStudentAcademicPlanTerm();
        StudentAcademicPlanTerm secondTerm = second.getStudentAcademicPlanTerm();
        if (firstTerm == null || secondTerm == null) {
            return false;
        }

        Long firstTermId = firstTerm.getId();
        Long secondTermId = secondTerm.getId();
        if (firstTermId != null && secondTermId != null) {
            return Objects.equals(firstTermId, secondTermId);
        }

        return yearSortOrder(first) == yearSortOrder(second)
                && termSortOrder(first) == termSortOrder(second);
    }

    private boolean isPlannedBeforeTarget(
            StudentAcademicPlanCourse plannedCourse,
            StudentAcademicPlanCourse targetCourse
    ) {
        int yearComparison = Integer.compare(yearSortOrder(plannedCourse), yearSortOrder(targetCourse));
        if (yearComparison != 0) {
            return yearComparison < 0;
        }

        int termComparison = Integer.compare(termSortOrder(plannedCourse), termSortOrder(targetCourse));
        if (termComparison != 0) {
            return termComparison < 0;
        }

        return isEarlierSameTermBucket(plannedCourse, targetCourse);
    }

    private boolean isEarlierSameTermBucket(
            StudentAcademicPlanCourse plannedCourse,
            StudentAcademicPlanCourse targetCourse
    ) {
        String plannedBucketCode = plannerBucketCode(plannedCourse);
        String targetBucketCode = plannerBucketCode(targetCourse);

        return PLANNER_BUCKET_SESSION_A.equals(plannedBucketCode)
                && PLANNER_BUCKET_SESSION_B.equals(targetBucketCode);
    }

    private int yearSortOrder(StudentAcademicPlanCourse planCourse) {
        StudentAcademicPlanTerm term = planCourse.getStudentAcademicPlanTerm();
        StudentAcademicPlanYear year = term == null ? null : term.getStudentAcademicPlanYear();
        return year == null || year.getSortOrder() == null ? 0 : year.getSortOrder();
    }

    private int termSortOrder(StudentAcademicPlanCourse planCourse) {
        StudentAcademicPlanTerm term = planCourse.getStudentAcademicPlanTerm();
        return term == null || term.getSortOrder() == null ? 0 : term.getSortOrder();
    }

    private String plannerBucketCode(StudentAcademicPlanCourse planCourse) {
        String bucketCode = normalize(planCourse.getPlannerBucketCode());
        return bucketCode.isBlank() ? PLANNER_BUCKET_FULL_TERM : bucketCode;
    }

    private List<StudentAcademicPlanCourse> plannedCourses(StudentAcademicPlan academicPlan) {
        if (academicPlan == null) {
            return List.of();
        }

        return academicPlan.getYears().stream()
                .flatMap(year -> year.getTerms().stream())
                .flatMap(term -> term.getCourses().stream())
                .filter(planCourse -> planCourse.getCourse() != null)
                .toList();
    }

    private Map<Long, CourseVersion> latestVersionsByCourseId(List<StudentAcademicPlanCourse> plannedCourses) {
        List<Long> courseIds = plannedCourses.stream()
                .map(StudentAcademicPlanCourse::getCourse)
                .filter(Objects::nonNull)
                .map(Course::getId)
                .distinct()
                .toList();
        if (courseIds.isEmpty()) {
            return Map.of();
        }

        return courseVersionRepository.findLatestCourseVersionsByCourseIds(courseIds)
                .stream()
                .collect(Collectors.toMap(
                        courseVersion -> courseVersion.getCourse().getId(),
                        Function.identity(),
                        (first, ignored) -> first
                ));
    }

    private Map<Long, List<CourseVersionRequisiteGroup>> requisiteGroupsByVersionId(
            List<CourseVersion> courseVersions
    ) {
        List<Long> courseVersionIds = courseVersions.stream()
                .map(CourseVersion::getId)
                .distinct()
                .toList();
        if (courseVersionIds.isEmpty()) {
            return Map.of();
        }

        return requisiteGroupRepository.findGroupsForCourseVersions(courseVersionIds)
                .stream()
                .filter(group -> isPrerequisite(group) || isCorequisite(group))
                .collect(Collectors.groupingBy(
                        group -> group.getCourseVersion().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    private Map<Long, List<CourseVersionRequisiteCourse>> requisiteCoursesByGroupId(
            List<CourseVersionRequisiteGroup> requisiteGroups
    ) {
        List<Long> groupIds = requisiteGroups.stream()
                .map(CourseVersionRequisiteGroup::getId)
                .toList();
        if (groupIds.isEmpty()) {
            return Map.of();
        }

        return requisiteCourseRepository.findCoursesForGroups(groupIds)
                .stream()
                .collect(Collectors.groupingBy(
                        requisiteCourse -> requisiteCourse.getGroup().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    private Set<Long> completedCourseIds(Long studentId) {
        return studentCourseEvidenceService.findCompletedCourseEvidence(studentId)
                .stream()
                .map(StudentCourseEvidence::courseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private boolean isAnyCondition(CourseVersionRequisiteGroup group) {
        return CONDITION_TYPE_ANY.equals(normalize(group.getConditionType()));
    }

    private boolean isPrerequisite(CourseVersionRequisiteGroup group) {
        return REQUISITE_TYPE_PREREQUISITE.equals(normalize(group.getRequisiteType()));
    }

    private boolean isCorequisite(CourseVersionRequisiteGroup group) {
        return REQUISITE_TYPE_COREQUISITE.equals(normalize(group.getRequisiteType()));
    }

    private int minimumRequired(CourseVersionRequisiteGroup group) {
        return group.getMinimumRequired() == null ? 1 : Math.max(group.getMinimumRequired(), 1);
    }

    private String describeCourses(List<Course> courses) {
        List<String> courseCodes = courses.stream()
                .map(this::courseCode)
                .filter(Objects::nonNull)
                .toList();
        if (courseCodes.isEmpty()) {
            return "the listed prerequisite courses";
        }
        if (courseCodes.size() == 1) {
            return courseCodes.get(0);
        }

        List<String> leadingCodes = new ArrayList<>(courseCodes.subList(0, courseCodes.size() - 1));
        return String.join(", ", leadingCodes) + " and " + courseCodes.get(courseCodes.size() - 1);
    }

    private String courseCode(Course course) {
        AcademicSubject subject = course.getSubject();
        if (subject == null) {
            return course.getCourseNumber();
        }

        return subject.getCode() + " " + course.getCourseNumber();
    }

    private String requisiteLabel(boolean corequisite) {
        return corequisite ? "corequisites" : "prerequisites";
    }

    private String timingDescription(boolean corequisite) {
        return corequisite ? " completed or planned in the same term" : " before this course";
    }

    private String satisfiedDescription(boolean corequisite) {
        return corequisite ? " completed or planned in the same term" : " completed or planned earlier";
    }

    private String missingTimingDescription(boolean corequisite) {
        return corequisite ? "completed or planned in the same term" : "completed or planned before this course";
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }

    private String pluralize(String singular, String plural, int count) {
        return count == 1 ? singular : plural;
    }
}
