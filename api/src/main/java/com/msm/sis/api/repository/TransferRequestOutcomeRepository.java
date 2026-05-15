package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferRequestOutcome;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransferRequestOutcomeRepository extends JpaRepository<TransferRequestOutcome, Long> {

    @EntityGraph(attributePaths = {
            "transferRequestCourse",
            "localCourse",
            "localCourse.subject",
            "requirement",
            "programVersionRequirement",
            "programVersionRequirement.requirement",
            "approvedByUser"
    })
    List<TransferRequestOutcome> findByTransferRequestCourseIdOrderByIdAsc(Long transferRequestCourseId);

    @EntityGraph(attributePaths = {
            "transferRequestCourse",
            "localCourse",
            "localCourse.subject",
            "requirement",
            "programVersionRequirement",
            "programVersionRequirement.requirement",
            "approvedByUser"
    })
    List<TransferRequestOutcome> findByTransferRequestCourseIdInOrderByTransferRequestCourseIdAscIdAsc(
            List<Long> transferRequestCourseIds
    );

    @Override
    @EntityGraph(attributePaths = {
            "transferRequestCourse",
            "localCourse",
            "localCourse.subject",
            "requirement",
            "programVersionRequirement",
            "programVersionRequirement.requirement",
            "approvedByUser"
    })
    Optional<TransferRequestOutcome> findById(Long id);

    @Query(value = """
            select
                outcome.transfer_request_outcome_id as transferRequestOutcomeId,
                outcome.requirement_id as requirementId,
                outcome.program_version_requirement_id as programVersionRequirementId,
                outcome.accepted_credits as acceptedCredits,
                outcome.notes as notes,
                outcome.approved_at as approvedAt
            from transfer_request_outcome outcome
            join transfer_request_course request_course
              on request_course.transfer_request_course_id = outcome.transfer_request_course_id
            join transfer_request request
              on request.transfer_request_id = request_course.transfer_request_id
            where request.student_id = :studentId
              and request.status = 'APPROVED'
              and outcome.outcome_type = 'REQUIREMENT_WAIVER'
            order by outcome.approved_at asc, outcome.transfer_request_outcome_id asc
            """, nativeQuery = true)
    List<ApprovedRequirementWaiverProjection> findApprovedRequirementWaiversForStudent(
            @Param("studentId") Long studentId
    );

    interface ApprovedRequirementWaiverProjection {
        Long getTransferRequestOutcomeId();

        Long getRequirementId();

        Long getProgramVersionRequirementId();

        BigDecimal getAcceptedCredits();

        String getNotes();

        LocalDateTime getApprovedAt();
    }
}
