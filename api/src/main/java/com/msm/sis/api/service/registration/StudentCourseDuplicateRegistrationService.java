package com.msm.sis.api.service.registration;

import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.StudentCourseRegistrationSelection;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.repository.StudentCourseRegistrationSelectionRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentCourseDuplicateRegistrationService {
    public static final String SOURCE_ACTIVE_ENROLLMENT = "ACTIVE_ENROLLMENT";
    public static final String SOURCE_PRE_REGISTERED = "PRE_REGISTERED";

    private final StudentCourseRegistrationSelectionRepository selectionRepository;
    private final StudentSectionEnrollmentRepository enrollmentRepository;

    @Transactional(readOnly = true)
    public Optional<StudentCourseDuplicateRegistrationResult> findDuplicateForRegistrationGroup(
            Long studentId,
            RegistrationGroup registrationGroup,
            CourseSection targetSection
    ) {
        Optional<StudentCourseDuplicateRegistrationResult> selectedDuplicate =
                findSelectedDuplicateForRegistrationGroup(studentId, registrationGroup, targetSection);
        if (selectedDuplicate.isPresent()) {
            return selectedDuplicate;
        }

        return findActiveEnrollmentDuplicateForRegistrationGroup(studentId, registrationGroup, targetSection);
    }

    @Transactional(readOnly = true)
    public Optional<StudentCourseDuplicateRegistrationResult> findSelectedDuplicateForRegistrationGroup(
            Long studentId,
            RegistrationGroup registrationGroup,
            CourseSection targetSection
    ) {
        Long registrationGroupId = registrationGroup == null ? null : registrationGroup.getId();
        Long courseId = courseId(targetSection);
        if (studentId == null || registrationGroupId == null || courseId == null) {
            return Optional.empty();
        }

        List<StudentCourseRegistrationSelection> matches =
                selectionRepository.findSameCourseSelectionsForStudentAndGroup(
                        studentId,
                        registrationGroupId,
                        courseId,
                        sectionId(targetSection)
                );

        return matches.stream()
                .findFirst()
                .map(selection -> toSelectionDuplicate(targetSection, selection));
    }

    @Transactional(readOnly = true)
    public Optional<StudentCourseDuplicateRegistrationResult> findSelectedDuplicateForTerm(
            Long studentId,
            Long termId,
            CourseSection targetSection
    ) {
        Long courseId = courseId(targetSection);
        if (studentId == null || termId == null || courseId == null) {
            return Optional.empty();
        }

        List<StudentCourseRegistrationSelection> matches =
                selectionRepository.findSameCourseSelectionsForStudentAndTerm(
                        studentId,
                        termId,
                        courseId,
                        sectionId(targetSection)
                );

        return matches.stream()
                .findFirst()
                .map(selection -> toSelectionDuplicate(targetSection, selection));
    }

    @Transactional(readOnly = true)
    public Optional<StudentCourseDuplicateRegistrationResult> findActiveEnrollmentDuplicateForRegistrationGroup(
            Long studentId,
            RegistrationGroup registrationGroup,
            CourseSection targetSection
    ) {
        AcademicTerm term = registrationGroup == null ? null : registrationGroup.getTerm();
        return findActiveEnrollmentDuplicateForTerm(
                studentId,
                term == null ? null : term.getId(),
                targetSection
        );
    }

    @Transactional(readOnly = true)
    public Optional<StudentCourseDuplicateRegistrationResult> findActiveEnrollmentDuplicateForTerm(
            Long studentId,
            Long termId,
            CourseSection targetSection
    ) {
        Long courseId = courseId(targetSection);
        if (studentId == null || termId == null || courseId == null) {
            return Optional.empty();
        }

        List<StudentSectionEnrollment> matches =
                enrollmentRepository.findActiveSameCourseEnrollmentsForStudentAndTerm(
                        studentId,
                        termId,
                        courseId,
                        sectionId(targetSection)
                );

        return matches.stream()
                .findFirst()
                .map(enrollment -> toEnrollmentDuplicate(targetSection, enrollment));
    }

    private StudentCourseDuplicateRegistrationResult toSelectionDuplicate(
            CourseSection targetSection,
            StudentCourseRegistrationSelection selection
    ) {
        CourseSection existingSection = selection.getCourseSection();

        return new StudentCourseDuplicateRegistrationResult(
                courseId(targetSection),
                courseCode(targetSection),
                sectionId(existingSection),
                displaySectionCode(existingSection),
                SOURCE_PRE_REGISTERED,
                selection.getId(),
                message(existingSection, SOURCE_PRE_REGISTERED)
        );
    }

    private StudentCourseDuplicateRegistrationResult toEnrollmentDuplicate(
            CourseSection targetSection,
            StudentSectionEnrollment enrollment
    ) {
        CourseSection existingSection = enrollment.getCourseSection();

        return new StudentCourseDuplicateRegistrationResult(
                courseId(targetSection),
                courseCode(targetSection),
                sectionId(existingSection),
                displaySectionCode(existingSection),
                SOURCE_ACTIVE_ENROLLMENT,
                enrollment.getId(),
                message(existingSection, SOURCE_ACTIVE_ENROLLMENT)
        );
    }

    private String message(CourseSection existingSection, String source) {
        String sectionCode = displaySectionCode(existingSection);
        if (SOURCE_PRE_REGISTERED.equals(source)) {
            return "Already selected in section " + sectionCode;
        }

        return "Already registered in section " + sectionCode;
    }

    private Long sectionId(CourseSection section) {
        return section == null ? null : section.getId();
    }

    private Long courseId(CourseSection section) {
        Course course = course(section);
        return course == null ? null : course.getId();
    }

    private String courseCode(CourseSection section) {
        Course course = course(section);
        if (course == null) {
            return "Course";
        }

        AcademicSubject subject = course.getSubject();
        if (subject == null || subject.getCode() == null) {
            return course.getCourseNumber() == null ? "Course" : course.getCourseNumber();
        }

        return subject.getCode() + " " + course.getCourseNumber();
    }

    private Course course(CourseSection section) {
        CourseOffering courseOffering = section == null ? null : section.getCourseOffering();
        CourseVersion courseVersion = courseOffering == null ? null : courseOffering.getCourseVersion();

        return courseVersion == null ? null : courseVersion.getCourse();
    }

    private String displaySectionCode(CourseSection section) {
        if (section == null) {
            return "unknown";
        }

        String displayCode = section.getSectionLetter() == null ? "" : section.getSectionLetter().trim();
        if (section.isHonors()) {
            displayCode += "H";
        }

        return displayCode.isBlank() ? "unknown" : displayCode;
    }

    public record StudentCourseDuplicateRegistrationResult(
            Long courseId,
            String courseCode,
            Long existingSectionId,
            String existingSectionCode,
            String source,
            Long sourceRecordId,
            String message
    ) {
    }
}
