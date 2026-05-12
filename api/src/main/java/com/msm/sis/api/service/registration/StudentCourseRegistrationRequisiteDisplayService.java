package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationRequisiteResponse;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseVersionRequisiteCourse;
import com.msm.sis.api.entity.CourseVersionRequisiteGroup;
import com.msm.sis.api.entity.GradeMark;
import com.msm.sis.api.repository.CourseVersionRequisiteCourseRepository;
import com.msm.sis.api.repository.CourseVersionRequisiteGroupRepository;
import com.msm.sis.api.repository.GradeMarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentCourseRegistrationRequisiteDisplayService {
    private static final String REQUISITE_TYPE_PREREQUISITE = "PREREQUISITE";
    private static final String REQUISITE_TYPE_COREQUISITE = "COREQUISITE";
    private static final Set<String> COMPARABLE_GRADES = Set.of(
            "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-"
    );

    private final CourseVersionRequisiteCourseRepository requisiteCourseRepository;
    private final CourseVersionRequisiteGroupRepository requisiteGroupRepository;
    private final GradeMarkRepository gradeMarkRepository;
    private final StudentCoursePrerequisiteEvidenceService evidenceService;

    @Transactional(readOnly = true)
    public List<StudentCourseRegistrationRequisiteResponse> findRequisitesForStudentCourseVersion(
            Long studentId,
            Long courseVersionId,
            CourseSection targetSection,
            List<StudentCoursePlannedPrerequisiteEvidence> plannedEvidence
    ) {
        if (studentId == null || courseVersionId == null) {
            return List.of();
        }

        List<CourseVersionRequisiteGroup> groups =
                requisiteGroupRepository.findGroupsForCourseVersion(courseVersionId);
        if (groups.isEmpty()) {
            return List.of();
        }

        Map<Long, List<CourseVersionRequisiteCourse>> coursesByGroupId = findCoursesByGroupId(groups);
        List<StudentCoursePrerequisiteEvidence> prerequisiteEvidence =
                evidenceService.findPrerequisiteEvidence(studentId);
        Map<Long, List<StudentCoursePrerequisiteEvidence>> evidenceByCourseId =
                prerequisiteEvidence.stream()
                        .filter(evidence -> evidence.courseId() != null)
                        .collect(Collectors.groupingBy(
                                StudentCoursePrerequisiteEvidence::courseId,
                                LinkedHashMap::new,
                                Collectors.toList()
                        ));
        Set<Long> chronologicallyEligiblePlannedCourseIds =
                evidenceService.findChronologicallyEligiblePlannedCourseIds(plannedEvidence, targetSection);
        Set<Long> plannedCourseIds = plannedEvidence == null
                ? Set.of()
                : plannedEvidence.stream()
                .map(StudentCoursePlannedPrerequisiteEvidence::courseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        Map<String, Integer> gradeSortOrders = gradeSortOrders();

        return groups.stream()
                .flatMap(group -> coursesByGroupId.getOrDefault(group.getId(), List.of()).stream()
                        .map(requisiteCourse -> toResponse(
                                group,
                                requisiteCourse,
                                evidenceByCourseId,
                                chronologicallyEligiblePlannedCourseIds,
                                plannedCourseIds,
                                gradeSortOrders
                        )))
                .toList();
    }

    private Map<Long, List<CourseVersionRequisiteCourse>> findCoursesByGroupId(
            List<CourseVersionRequisiteGroup> groups
    ) {
        List<Long> groupIds = groups.stream()
                .map(CourseVersionRequisiteGroup::getId)
                .filter(Objects::nonNull)
                .toList();
        if (groupIds.isEmpty()) {
            return Map.of();
        }

        return requisiteCourseRepository.findCoursesForGroups(groupIds).stream()
                .collect(Collectors.groupingBy(
                        requisiteCourse -> requisiteCourse.getGroup().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    private StudentCourseRegistrationRequisiteResponse toResponse(
            CourseVersionRequisiteGroup group,
            CourseVersionRequisiteCourse requisiteCourse,
            Map<Long, List<StudentCoursePrerequisiteEvidence>> evidenceByCourseId,
            Set<Long> chronologicallyEligiblePlannedCourseIds,
            Set<Long> plannedCourseIds,
            Map<String, Integer> gradeSortOrders
    ) {
        Course course = requisiteCourse.getCourse();
        Long courseId = course == null ? null : course.getId();
        String requisiteType = normalize(group.getRequisiteType());
        String minimumGrade = normalize(requisiteCourse.getMinimumGrade());
        StudentCourseRequisiteDisplay display = displayForCourse(
                requisiteType,
                minimumGrade,
                courseId,
                evidenceByCourseId.getOrDefault(courseId, List.of()),
                chronologicallyEligiblePlannedCourseIds,
                plannedCourseIds,
                gradeSortOrders
        );

        return new StudentCourseRegistrationRequisiteResponse(
                group.getId(),
                requisiteCourse.getId(),
                group.getRequisiteType(),
                group.getConditionType(),
                group.getMinimumRequired(),
                courseId,
                courseCode(course),
                course != null && course.isLab(),
                requisiteCourse.getMinimumGrade(),
                display.evidence(),
                display.status()
        );
    }

    private StudentCourseRequisiteDisplay displayForCourse(
            String requisiteType,
            String minimumGrade,
            Long courseId,
            List<StudentCoursePrerequisiteEvidence> evidence,
            Set<Long> chronologicallyEligiblePlannedCourseIds,
            Set<Long> plannedCourseIds,
            Map<String, Integer> gradeSortOrders
    ) {
        if (REQUISITE_TYPE_COREQUISITE.equals(requisiteType)) {
            StudentCoursePrerequisiteEvidence currentOrCompleted = bestEvidence(evidence, gradeSortOrders);
            if (currentOrCompleted != null) {
                return displayForEvidence(currentOrCompleted, "MET");
            }

            if (courseId != null && plannedCourseIds.contains(courseId)) {
                return new StudentCourseRequisiteDisplay("Planned with this registration", "PLANNED");
            }

            return missing();
        }

        if (!REQUISITE_TYPE_PREREQUISITE.equals(requisiteType)) {
            return missing();
        }

        StudentCoursePrerequisiteEvidence currentEnrollment = evidence.stream()
                .filter(StudentCoursePrerequisiteEvidence::currentEnrollment)
                .findFirst()
                .orElse(null);
        if (currentEnrollment != null) {
            return displayForEvidence(currentEnrollment, "IN_PROGRESS");
        }

        if (minimumGrade == null) {
            StudentCoursePrerequisiteEvidence completed = bestEvidence(evidence, gradeSortOrders);
            if (completed != null) {
                return displayForEvidence(completed, "MET");
            }

            if (courseId != null && chronologicallyEligiblePlannedCourseIds.contains(courseId)) {
                return new StudentCourseRequisiteDisplay("Planned in an earlier subterm", "PLANNED");
            }

            return missing();
        }

        StudentCoursePrerequisiteEvidence bestCompleted = bestEvidence(evidence, gradeSortOrders);
        if (bestCompleted == null) {
            return missing();
        }

        if (meetsMinimumGrade(bestCompleted.gradeCode(), minimumGrade, gradeSortOrders)) {
            return displayForEvidence(bestCompleted, "MET");
        }

        return displayForEvidence(bestCompleted, "MISSING");
    }

    private StudentCoursePrerequisiteEvidence bestEvidence(
            List<StudentCoursePrerequisiteEvidence> evidence,
            Map<String, Integer> gradeSortOrders
    ) {
        if (evidence == null || evidence.isEmpty()) {
            return null;
        }

        return evidence.stream()
                .max(Comparator
                        .comparing(StudentCoursePrerequisiteEvidence::currentEnrollment)
                        .thenComparing(
                                candidate -> gradeSortOrder(candidate.gradeCode(), gradeSortOrders),
                                Comparator.nullsLast(Comparator.reverseOrder())
                        )
                        .thenComparing(
                                StudentCoursePrerequisiteEvidence::evidenceDate,
                                Comparator.nullsLast(Comparator.naturalOrder())
                        ))
                .orElse(null);
    }

    private StudentCourseRequisiteDisplay displayForEvidence(
            StudentCoursePrerequisiteEvidence evidence,
            String metStatus
    ) {
        if (evidence.currentEnrollment()) {
            String status = normalize(evidence.statusCode());
            return new StudentCourseRequisiteDisplay(
                    "IN_PROGRESS".equals(status) ? "In progress" : "Registered",
                    "IN_PROGRESS".equals(status) ? "IN_PROGRESS" : metStatus
            );
        }

        if (evidence.gradeCode() != null && !evidence.gradeCode().isBlank()) {
            return new StudentCourseRequisiteDisplay("Final grade " + evidence.gradeCode(), metStatus);
        }

        return new StudentCourseRequisiteDisplay("Completed course", metStatus);
    }

    private StudentCourseRequisiteDisplay missing() {
        return new StudentCourseRequisiteDisplay(
                "No matching completed, current, or planned course found",
                "MISSING"
        );
    }

    private boolean meetsMinimumGrade(
            String gradeCode,
            String minimumGrade,
            Map<String, Integer> gradeSortOrders
    ) {
        Integer gradeSortOrder = gradeSortOrders.get(normalize(gradeCode));
        Integer minimumSortOrder = gradeSortOrders.get(normalize(minimumGrade));

        return gradeSortOrder != null && minimumSortOrder != null && gradeSortOrder <= minimumSortOrder;
    }

    private Integer gradeSortOrder(String gradeCode, Map<String, Integer> gradeSortOrders) {
        return gradeSortOrders.get(normalize(gradeCode));
    }

    private Map<String, Integer> gradeSortOrders() {
        return gradeMarkRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                .filter(gradeMark -> COMPARABLE_GRADES.contains(normalize(gradeMark.getCode())))
                .collect(Collectors.toMap(
                        gradeMark -> normalize(gradeMark.getCode()),
                        GradeMark::getSortOrder,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    private String courseCode(Course course) {
        if (course == null) {
            return null;
        }

        AcademicSubject subject = course.getSubject();
        String courseNumber = course.getCourseNumber();
        if (subject == null || subject.getCode() == null) {
            return courseNumber;
        }

        return subject.getCode() + " " + courseNumber;
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim().toUpperCase(Locale.ROOT);
    }

    private record StudentCourseRequisiteDisplay(String evidence, String status) {
    }
}
