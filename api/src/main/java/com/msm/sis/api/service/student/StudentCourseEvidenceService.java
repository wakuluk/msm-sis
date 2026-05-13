package com.msm.sis.api.service.student;

import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentTransferCreditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class StudentCourseEvidenceService {
    private static final Comparator<StudentCourseEvidence> EVIDENCE_COMPARATOR = Comparator
            .comparing(StudentCourseEvidence::completedDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(StudentCourseEvidence::courseCode, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
            .thenComparing(StudentCourseEvidence::source)
            .thenComparing(StudentCourseEvidence::sourceRecordId, Comparator.nullsLast(Comparator.naturalOrder()));

    private final StudentSectionEnrollmentRepository studentSectionEnrollmentRepository;
    private final StudentTransferCreditRepository studentTransferCreditRepository;

    @Transactional(readOnly = true)
    public List<StudentCourseEvidence> findCompletedCourseEvidence(Long studentId) {
        requirePositiveId(studentId, "Student id");

        List<StudentCourseEvidence> evidence = new ArrayList<>();
        evidence.addAll(studentSectionEnrollmentRepository.findCompletedLocalCourses(studentId)
                .stream()
                .map(this::toEvidence)
                .toList());
        evidence.addAll(studentTransferCreditRepository.findCompletedLocalTransferCourses(studentId)
                .stream()
                .map(this::toEvidence)
                .toList());
        evidence.sort(EVIDENCE_COMPARATOR);

        return List.copyOf(evidence);
    }

    private StudentCourseEvidence toEvidence(
            StudentSectionEnrollmentRepository.StudentCompletedLocalCourseProjection projection
    ) {
        return new StudentCourseEvidence(
                projection.getCourseId(),
                projection.getDepartmentId(),
                projection.getSubjectCode(),
                projection.getCourseNumber(),
                courseCode(projection.getSubjectCode(), projection.getCourseNumber()),
                projection.getTitle(),
                projection.getCreditsEarned(),
                projection.getGradeCode(),
                "LOCAL",
                projection.getEnrollmentId(),
                projection.getCompletedDate()
        );
    }

    private StudentCourseEvidence toEvidence(
            StudentTransferCreditRepository.StudentCompletedTransferCourseProjection projection
    ) {
        return new StudentCourseEvidence(
                projection.getCourseId(),
                projection.getDepartmentId(),
                projection.getSubjectCode(),
                projection.getCourseNumber(),
                courseCode(projection.getSubjectCode(), projection.getCourseNumber()),
                projection.getTitle(),
                projection.getCreditsEarned(),
                projection.getGradeCode(),
                "TRANSFER",
                projection.getTransferCreditId(),
                projection.getCompletedDate()
        );
    }

    private String courseCode(String subjectCode, String courseNumber) {
        if (subjectCode == null || courseNumber == null) {
            return null;
        }

        return subjectCode + " " + courseNumber;
    }
}
