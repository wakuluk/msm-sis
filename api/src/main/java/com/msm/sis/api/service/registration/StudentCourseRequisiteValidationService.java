package com.msm.sis.api.service.registration;

import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.CourseVersionRequisiteCourse;
import com.msm.sis.api.entity.CourseVersionRequisiteGroup;
import com.msm.sis.api.entity.GradeMark;
import com.msm.sis.api.repository.CourseVersionRequisiteCourseRepository;
import com.msm.sis.api.repository.CourseVersionRequisiteGroupRepository;
import com.msm.sis.api.repository.GradeMarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentCourseRequisiteValidationService {
    private static final String REQUISITE_TYPE_PREREQUISITE = "PREREQUISITE";
    private static final String REQUISITE_TYPE_COREQUISITE = "COREQUISITE";
    private static final String CONDITION_TYPE_ANY = "ANY";
    private static final Set<String> MINIMUM_GRADE_CODES = Set.of(
            "A",
            "A-",
            "B+",
            "B",
            "B-",
            "C+",
            "C",
            "C-",
            "D+",
            "D",
            "D-"
    );

    private final CourseVersionRequisiteCourseRepository requisiteCourseRepository;
    private final CourseVersionRequisiteGroupRepository requisiteGroupRepository;
    private final GradeMarkRepository gradeMarkRepository;
    private final StudentCoursePrerequisiteEvidenceService evidenceService;

    @Transactional(readOnly = true, noRollbackFor = ResponseStatusException.class)
    public StudentCourseRequisiteValidationResult validateForPreRegistration(
            Long studentId,
            CourseSection targetSection
    ) {
        CourseVersion courseVersion = resolveCourseVersion(targetSection);
        return validateForPreRegistration(studentId, courseVersion.getId());
    }

    @Transactional(readOnly = true, noRollbackFor = ResponseStatusException.class)
    public StudentCourseRequisiteValidationResult validateForPreRegistration(
            Long studentId,
            CourseSection targetSection,
            List<StudentCoursePlannedPrerequisiteEvidence> selectedSections
    ) {
        requirePositiveId(studentId, "Student id");

        CourseVersion courseVersion = resolveCourseVersion(targetSection);
        List<StudentCoursePrerequisiteEvidence> prerequisiteEvidence = evidenceService.findPrerequisiteEvidence(studentId);
        Set<Long> completedAndRegisteredCourseIds = satisfiedCourseIds(prerequisiteEvidence);
        Set<Long> noMinimumPrerequisiteSatisfiedCourseIds = new LinkedHashSet<>(completedAndRegisteredCourseIds);
        noMinimumPrerequisiteSatisfiedCourseIds.addAll(
                evidenceService.findChronologicallyEligiblePlannedCourseIds(selectedSections, targetSection)
        );

        // Corequisites can be satisfied by courses selected together; prerequisites require chronological evidence.
        Set<Long> corequisiteSatisfiedCourseIds = new LinkedHashSet<>(completedAndRegisteredCourseIds);
        selectedSectionsToCorequisiteCourseIds(selectedSections).forEach(corequisiteSatisfiedCourseIds::add);

        return validateForPreRegistration(
                courseVersion.getId(),
                prerequisiteEvidence,
                noMinimumPrerequisiteSatisfiedCourseIds,
                corequisiteSatisfiedCourseIds
        );
    }

    @Transactional(readOnly = true, noRollbackFor = ResponseStatusException.class)
    public StudentCourseRequisiteValidationResult validateForPreRegistration(
            Long studentId,
            Long courseVersionId
    ) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(courseVersionId, "Course version id");

        List<StudentCoursePrerequisiteEvidence> prerequisiteEvidence = evidenceService.findPrerequisiteEvidence(studentId);
        Set<Long> satisfiedCourseIds = satisfiedCourseIds(prerequisiteEvidence);
        return validateForPreRegistration(courseVersionId, prerequisiteEvidence, satisfiedCourseIds, satisfiedCourseIds);
    }

    @Transactional(readOnly = true, noRollbackFor = ResponseStatusException.class)
    public StudentCourseRequisiteValidationResult validateForPreRegistration(
            Long studentId,
            Long courseVersionId,
            Set<Long> selectedCourseIds
    ) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(courseVersionId, "Course version id");

        List<StudentCoursePrerequisiteEvidence> prerequisiteEvidence = evidenceService.findPrerequisiteEvidence(studentId);
        Set<Long> satisfiedCourseIds = satisfiedCourseIds(prerequisiteEvidence);
        Set<Long> corequisiteSatisfiedCourseIds = new LinkedHashSet<>(satisfiedCourseIds);
        if (selectedCourseIds != null) {
            selectedCourseIds.stream()
                    .filter(Objects::nonNull)
                    .forEach(corequisiteSatisfiedCourseIds::add);
        }

        return validateForPreRegistration(courseVersionId, prerequisiteEvidence, satisfiedCourseIds, corequisiteSatisfiedCourseIds);
    }

    @Transactional(readOnly = true)
    public List<String> findCorequisiteWarnings(
            Long studentId,
            Long courseVersionId,
            Set<Long> selectedCourseIds
    ) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(courseVersionId, "Course version id");

        List<CourseVersionRequisiteGroup> groups = requisiteGroupRepository.findGroupsForCourseVersion(courseVersionId);
        if (groups.isEmpty()) {
            return List.of();
        }

        Map<Long, List<CourseVersionRequisiteCourse>> coursesByGroupId = findCoursesByGroupId(groups);
        Set<Long> satisfiedCourseIds = new LinkedHashSet<>(evidenceService.findSatisfiedCourseIds(studentId));
        if (selectedCourseIds != null) {
            selectedCourseIds.stream()
                    .filter(Objects::nonNull)
                    .forEach(satisfiedCourseIds::add);
        }

        return corequisiteWarnings(groups, coursesByGroupId, satisfiedCourseIds);
    }

    private StudentCourseRequisiteValidationResult validateForPreRegistration(
            Long courseVersionId,
            List<StudentCoursePrerequisiteEvidence> prerequisiteEvidence,
            Set<Long> noMinimumPrerequisiteSatisfiedCourseIds,
            Set<Long> corequisiteSatisfiedCourseIds
    ) {
        requirePositiveId(courseVersionId, "Course version id");

        List<CourseVersionRequisiteGroup> groups = requisiteGroupRepository.findGroupsForCourseVersion(courseVersionId);
        if (groups.isEmpty()) {
            return new StudentCourseRequisiteValidationResult(courseVersionId, List.of());
        }

        Map<Long, List<CourseVersionRequisiteCourse>> coursesByGroupId = findCoursesByGroupId(groups);
        Map<String, Integer> minimumGradeSortOrders = minimumGradeSortOrders();

        List<String> prerequisiteErrors = groups.stream()
                .filter(group -> REQUISITE_TYPE_PREREQUISITE.equals(normalize(group.getRequisiteType())))
                .map(group -> issueForPrerequisiteGroup(
                        group,
                        coursesByGroupId.getOrDefault(group.getId(), List.of()),
                        prerequisiteEvidence,
                        noMinimumPrerequisiteSatisfiedCourseIds,
                        minimumGradeSortOrders
                ))
                .filter(Objects::nonNull)
                .toList();
        if (!prerequisiteErrors.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Prerequisites are not satisfied: " + String.join(" ", prerequisiteErrors)
            );
        }

        List<String> corequisiteWarnings = corequisiteWarnings(
                groups,
                coursesByGroupId,
                corequisiteSatisfiedCourseIds
        );

        return new StudentCourseRequisiteValidationResult(courseVersionId, corequisiteWarnings);
    }

    private Set<Long> selectedSectionsToCorequisiteCourseIds(
            List<StudentCoursePlannedPrerequisiteEvidence> selectedSections
    ) {
        if (selectedSections == null || selectedSections.isEmpty()) {
            return Set.of();
        }

        return selectedSections.stream()
                .map(StudentCoursePlannedPrerequisiteEvidence::courseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<Long> satisfiedCourseIds(List<StudentCoursePrerequisiteEvidence> evidence) {
        if (evidence == null || evidence.isEmpty()) {
            return Set.of();
        }

        return evidence.stream()
                .map(StudentCoursePrerequisiteEvidence::courseId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private List<String> corequisiteWarnings(
            List<CourseVersionRequisiteGroup> groups,
            Map<Long, List<CourseVersionRequisiteCourse>> coursesByGroupId,
            Set<Long> satisfiedCourseIds
    ) {
        return groups.stream()
                .filter(group -> REQUISITE_TYPE_COREQUISITE.equals(normalize(group.getRequisiteType())))
                .map(group -> issueForGroup(
                        group,
                        coursesByGroupId.getOrDefault(group.getId(), List.of()),
                        satisfiedCourseIds,
                        false
                ))
                .filter(Objects::nonNull)
                .toList();
    }

    private CourseVersion resolveCourseVersion(CourseSection targetSection) {
        if (targetSection == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course section is required.");
        }

        CourseOffering courseOffering = targetSection.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        if (courseVersion == null || courseVersion.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course section is not linked to a course version."
            );
        }

        return courseVersion;
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

    private String issueForGroup(
            CourseVersionRequisiteGroup group,
            List<CourseVersionRequisiteCourse> requisiteCourses,
            Set<Long> satisfiedCourseIds,
            boolean prerequisite
    ) {
        List<Course> courseOptions = requisiteCourses.stream()
                .map(CourseVersionRequisiteCourse::getCourse)
                .filter(Objects::nonNull)
                .toList();
        if (courseOptions.isEmpty()) {
            return null;
        }

        Set<Long> matchedCourseIds = courseOptions.stream()
                .map(Course::getId)
                .filter(satisfiedCourseIds::contains)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (isAnyCondition(group)) {
            int required = minimumRequired(group);
            if (matchedCourseIds.size() >= required) {
                return null;
            }

            return "Requires " + required + " of " + describeCourses(courseOptions)
                    + "; " + matchedCourseIds.size() + " currently satisfied.";
        }

        List<Course> missingCourses = courseOptions.stream()
                .filter(course -> !matchedCourseIds.contains(course.getId()))
                .toList();
        if (missingCourses.isEmpty()) {
            return null;
        }

        return "Missing " + requisiteLabel(prerequisite) + ": " + describeCourses(missingCourses) + ".";
    }

    private String issueForPrerequisiteGroup(
            CourseVersionRequisiteGroup group,
            List<CourseVersionRequisiteCourse> requisiteCourses,
            List<StudentCoursePrerequisiteEvidence> evidence,
            Set<Long> noMinimumSatisfiedCourseIds,
            Map<String, Integer> minimumGradeSortOrders
    ) {
        List<CourseVersionRequisiteCourse> courseOptions = requisiteCourses.stream()
                .filter(requisiteCourse -> requisiteCourse.getCourse() != null)
                .toList();
        if (courseOptions.isEmpty()) {
            return null;
        }

        Set<Long> matchedCourseIds = courseOptions.stream()
                .filter(requisiteCourse -> isPrerequisiteCourseSatisfied(
                        requisiteCourse,
                        evidence,
                        noMinimumSatisfiedCourseIds,
                        minimumGradeSortOrders
                ))
                .map(CourseVersionRequisiteCourse::getCourse)
                .map(Course::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (isAnyCondition(group)) {
            int required = minimumRequired(group);
            if (matchedCourseIds.size() >= required) {
                return null;
            }

            return "Requires " + required + " of " + describeRequisiteCourses(courseOptions)
                    + "; " + matchedCourseIds.size() + " currently satisfied.";
        }

        List<Course> missingCourses = courseOptions.stream()
                .filter(requisiteCourse -> {
                    Course course = requisiteCourse.getCourse();
                    return course == null || !matchedCourseIds.contains(course.getId());
                })
                .map(CourseVersionRequisiteCourse::getCourse)
                .filter(Objects::nonNull)
                .toList();
        if (missingCourses.isEmpty()) {
            return null;
        }

        return "Missing prerequisite: " + describeCourses(missingCourses) + ".";
    }

    private boolean isPrerequisiteCourseSatisfied(
            CourseVersionRequisiteCourse requisiteCourse,
            List<StudentCoursePrerequisiteEvidence> evidence,
            Set<Long> noMinimumSatisfiedCourseIds,
            Map<String, Integer> minimumGradeSortOrders
    ) {
        Course course = requisiteCourse.getCourse();
        Long courseId = course == null ? null : course.getId();
        if (courseId == null) {
            return false;
        }

        String minimumGrade = normalize(requisiteCourse.getMinimumGrade());
        if (minimumGrade == null) {
            return noMinimumSatisfiedCourseIds != null && noMinimumSatisfiedCourseIds.contains(courseId);
        }

        if (!minimumGradeSortOrders.containsKey(minimumGrade)) {
            return false;
        }

        return evidence != null && evidence.stream()
                .filter(candidate -> Objects.equals(courseId, candidate.courseId()))
                .anyMatch(candidate -> candidate.currentEnrollment()
                        || gradeMeetsMinimum(candidate.gradeCode(), minimumGrade, minimumGradeSortOrders));
    }

    private boolean gradeMeetsMinimum(
            String gradeCode,
            String minimumGrade,
            Map<String, Integer> minimumGradeSortOrders
    ) {
        Integer gradeSortOrder = minimumGradeSortOrders.get(normalize(gradeCode));
        Integer minimumSortOrder = minimumGradeSortOrders.get(normalize(minimumGrade));
        return gradeSortOrder != null && minimumSortOrder != null && gradeSortOrder <= minimumSortOrder;
    }

    private Map<String, Integer> minimumGradeSortOrders() {
        return gradeMarkRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                .filter(gradeMark -> MINIMUM_GRADE_CODES.contains(normalize(gradeMark.getCode())))
                .filter(gradeMark -> gradeMark.getSortOrder() != null)
                .collect(Collectors.toMap(
                        gradeMark -> normalize(gradeMark.getCode()),
                        GradeMark::getSortOrder,
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));
    }

    private boolean isAnyCondition(CourseVersionRequisiteGroup group) {
        return CONDITION_TYPE_ANY.equals(normalize(group.getConditionType()));
    }

    private int minimumRequired(CourseVersionRequisiteGroup group) {
        Integer minimumRequired = group.getMinimumRequired();
        return minimumRequired == null || minimumRequired < 1 ? 1 : minimumRequired;
    }

    private String requisiteLabel(boolean prerequisite) {
        return prerequisite ? "prerequisite" : "corequisite";
    }

    private String describeCourses(List<Course> courses) {
        return courses.stream()
                .map(this::courseCode)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
    }

    private String describeRequisiteCourses(List<CourseVersionRequisiteCourse> requisiteCourses) {
        return requisiteCourses.stream()
                .map(CourseVersionRequisiteCourse::getCourse)
                .filter(Objects::nonNull)
                .map(this::courseCode)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
    }

    private String courseCode(Course course) {
        AcademicSubject subject = course.getSubject();
        if (subject == null || subject.getCode() == null || course.getCourseNumber() == null) {
            return null;
        }

        return subject.getCode() + " " + course.getCourseNumber();
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim().toUpperCase(Locale.ROOT);
    }
}
