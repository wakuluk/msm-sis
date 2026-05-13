package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionWaitlistOffer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StudentSectionWaitlistOfferRepository extends JpaRepository<StudentSectionWaitlistOffer, Long> {
    @EntityGraph(attributePaths = {
            "student",
            "courseSection",
            "courseSection.subTerm",
            "courseSection.courseOffering",
            "courseSection.courseOffering.academicYear",
            "courseSection.courseOffering.courseVersion",
            "courseSection.courseOffering.courseVersion.course",
            "courseSection.courseOffering.courseVersion.course.subject",
            "studentSectionEnrollment",
            "studentSectionEnrollment.status",
            "studentSectionEnrollment.gradingBasis"
    })
    Optional<StudentSectionWaitlistOffer> findByIdAndStatus(Long id, String status);

    Optional<StudentSectionWaitlistOffer> findByStudentSectionEnrollmentIdAndStatus(Long enrollmentId, String status);

    @EntityGraph(attributePaths = {
            "studentSectionEnrollment"
    })
    List<StudentSectionWaitlistOffer> findByStudentSectionEnrollmentIdInOrderByCreatedAtDesc(List<Long> enrollmentIds);

    List<StudentSectionWaitlistOffer> findByStudentSectionEnrollmentId(Long enrollmentId);

    Optional<StudentSectionWaitlistOffer> findFirstByCourseSectionIdAndStatusOrderByExpiresAtAsc(
            Long sectionId,
            String status
    );

    List<StudentSectionWaitlistOffer> findByStatusAndExpiresAtLessThanEqual(String status, LocalDateTime expiresAt);

    List<StudentSectionWaitlistOffer> findByStudentIdAndStatusOrderByExpiresAtAsc(Long studentId, String status);
}
