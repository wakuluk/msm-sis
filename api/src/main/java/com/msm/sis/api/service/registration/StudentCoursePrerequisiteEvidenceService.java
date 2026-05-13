package com.msm.sis.api.service.registration;

import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.StudentCourseRegistrationSelection;
import com.msm.sis.api.repository.StudentCourseRegistrationSelectionRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.service.student.StudentCourseEvidence;
import com.msm.sis.api.service.student.StudentCourseEvidenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentCoursePrerequisiteEvidenceService {
    private static final String SOURCE_CURRENT_REGISTRATION = "CURRENT_REGISTRATION";
    private static final String SOURCE_PLANNED_REGISTRATION_SELECTION = "PLANNED_REGISTRATION_SELECTION";

    private static final Comparator<StudentCoursePrerequisiteEvidence> EVIDENCE_COMPARATOR = Comparator
            .comparing(StudentCoursePrerequisiteEvidence::evidenceDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(StudentCoursePrerequisiteEvidence::courseCode, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
            .thenComparing(StudentCoursePrerequisiteEvidence::source, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
            .thenComparing(StudentCoursePrerequisiteEvidence::sourceRecordId, Comparator.nullsLast(Comparator.naturalOrder()));

    private final StudentCourseEvidenceService studentCourseEvidenceService;
    private final StudentSectionEnrollmentRepository studentSectionEnrollmentRepository;
    private final StudentCourseRegistrationSelectionRepository studentCourseRegistrationSelectionRepository;

    @Transactional(readOnly = true)
    public boolean hasSatisfiedCourse(Long studentId, Long courseId) {
        requirePositiveId(courseId, "Course id");

        return findSatisfiedCourseIds(studentId).contains(courseId);
    }

    @Transactional(readOnly = true)
    public Set<Long> findSatisfiedCourseIds(Long studentId) {
        return findPrerequisiteEvidence(studentId).stream()
                .map(StudentCoursePrerequisiteEvidence::courseId)
                .filter(courseId -> courseId != null)
                .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);
    }

    @Transactional(readOnly = true)
    public List<StudentCoursePrerequisiteEvidence> findPrerequisiteEvidence(Long studentId) {
        requirePositiveId(studentId, "Student id");

        List<StudentCoursePrerequisiteEvidence> evidence = new java.util.ArrayList<>();
        evidence.addAll(studentCourseEvidenceService.findCompletedCourseEvidence(studentId)
                .stream()
                .map(this::fromCompletedEvidence)
                .toList());
        evidence.addAll(studentSectionEnrollmentRepository.findCurrentRegisteredOrInProgressCourses(studentId)
                .stream()
                .map(this::fromCurrentRegistration)
                .toList());
        evidence.sort(EVIDENCE_COMPARATOR);

        return List.copyOf(evidence);
    }

    @Transactional(readOnly = true)
    public List<StudentCoursePlannedPrerequisiteEvidence> findPlannedPrerequisiteEvidenceForRegistrationTerm(
            Long studentId,
            Long termId
    ) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(termId, "Term id");

        return studentCourseRegistrationSelectionRepository.findSelectionsForStudentAndTerm(studentId, termId)
                .stream()
                .map(this::fromRegistrationSelection)
                .filter(Objects::nonNull)
                .toList();
    }

    public List<StudentCoursePlannedPrerequisiteEvidence> toPlannedPrerequisiteEvidence(
            List<StudentCourseRegistrationSelection> selections
    ) {
        if (selections == null || selections.isEmpty()) {
            return List.of();
        }

        return selections.stream()
                .map(this::fromRegistrationSelection)
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentCoursePlannedPrerequisiteEvidence> findPlannedPrerequisiteEvidenceForRegistrationGroup(
            Long studentId,
            Long registrationGroupId
    ) {
        requirePositiveId(studentId, "Student id");
        requirePositiveId(registrationGroupId, "Registration group id");

        return studentCourseRegistrationSelectionRepository.findSelectionsForStudentAndGroup(
                        studentId,
                        registrationGroupId
                )
                .stream()
                .map(this::fromRegistrationSelection)
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional(readOnly = true)
    public Set<Long> findChronologicallyEligiblePlannedCourseIdsForRegistrationTerm(
            Long studentId,
            Long termId,
            CourseSection targetSection
    ) {
        return findChronologicallyEligiblePlannedCourseIds(
                findPlannedPrerequisiteEvidenceForRegistrationTerm(studentId, termId),
                targetSection
        );
    }

    public Set<Long> findChronologicallyEligiblePlannedCourseIds(
            List<StudentCoursePlannedPrerequisiteEvidence> plannedEvidence,
            CourseSection targetSection
    ) {
        if (plannedEvidence == null || plannedEvidence.isEmpty()) {
            return Set.of();
        }

        return plannedEvidence.stream()
                .filter(evidence -> isChronologicallyEligiblePlannedPrerequisite(evidence, targetSection))
                .map(StudentCoursePlannedPrerequisiteEvidence::courseId)
                .filter(Objects::nonNull)
                .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);
    }

    public boolean isChronologicallyEligiblePlannedPrerequisite(
            StudentCoursePlannedPrerequisiteEvidence evidence,
            CourseSection targetSection
    ) {
        if (evidence == null || evidence.courseId() == null || targetSection == null) {
            return false;
        }

        AcademicSubTerm targetSubTerm = targetSection.getSubTerm();
        if (targetSubTerm == null || targetSubTerm.getStartDate() == null) {
            return false;
        }

        Long targetSectionId = targetSection.getId();
        if (targetSectionId != null && Objects.equals(targetSectionId, evidence.sectionId())) {
            return false;
        }

        if (evidence.subTermId() == null || evidence.subTermEndDate() == null) {
            return false;
        }

        return evidence.subTermEndDate().isBefore(targetSubTerm.getStartDate());
    }

    private StudentCoursePrerequisiteEvidence fromCompletedEvidence(StudentCourseEvidence evidence) {
        return new StudentCoursePrerequisiteEvidence(
                evidence.courseId(),
                evidence.departmentId(),
                evidence.subjectCode(),
                evidence.courseNumber(),
                evidence.courseCode(),
                evidence.title(),
                evidence.creditsEarned(),
                evidence.gradeCode(),
                evidence.source(),
                evidence.sourceRecordId(),
                "COMPLETED",
                evidence.completedDate(),
                false
        );
    }

    private StudentCoursePrerequisiteEvidence fromCurrentRegistration(
            StudentSectionEnrollmentRepository.StudentCurrentRegisteredCourseProjection projection
    ) {
        return new StudentCoursePrerequisiteEvidence(
                projection.getCourseId(),
                projection.getDepartmentId(),
                projection.getSubjectCode(),
                projection.getCourseNumber(),
                courseCode(projection.getSubjectCode(), projection.getCourseNumber()),
                projection.getTitle(),
                projection.getCreditsAttempted(),
                null,
                SOURCE_CURRENT_REGISTRATION,
                projection.getEnrollmentId(),
                projection.getStatusCode(),
                projection.getTermSortDate(),
                true
        );
    }

    private StudentCoursePlannedPrerequisiteEvidence fromRegistrationSelection(
            StudentCourseRegistrationSelection selection
    ) {
        CourseSection section = selection.getCourseSection();
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();
        Course course = courseVersion == null ? null : courseVersion.getCourse();
        AcademicSubTerm subTerm = section == null ? null : section.getSubTerm();
        if (course == null || course.getId() == null || section == null || section.getId() == null
                || subTerm == null || subTerm.getId() == null) {
            return null;
        }

        return new StudentCoursePlannedPrerequisiteEvidence(
                course.getId(),
                section.getId(),
                subTerm.getId(),
                subTerm.getStartDate(),
                subTerm.getEndDate(),
                SOURCE_PLANNED_REGISTRATION_SELECTION
        );
    }

    private String courseCode(String subjectCode, String courseNumber) {
        if (subjectCode == null || courseNumber == null) {
            return null;
        }

        return subjectCode + " " + courseNumber;
    }
}
