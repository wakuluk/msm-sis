package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {

    @EntityGraph(attributePaths = {"student", "policy", "transferInstitution", "decidedByUser"})
    List<TransferRequest> findAllByOrderBySubmittedAtAscIdAsc();

    @EntityGraph(attributePaths = {"student", "policy", "transferInstitution", "decidedByUser"})
    @Query("""
            select distinct transferRequest
            from TransferRequest transferRequest
            join transferRequest.student student
            where (:studentName is null
                   or lower(concat(coalesce(student.firstName, ''), ' ', coalesce(student.lastName, '')))
                      like concat('%', lower(cast(:studentName as string)), '%')
                   or lower(concat(coalesce(student.lastName, ''), ', ', coalesce(student.firstName, '')))
                      like concat('%', lower(cast(:studentName as string)), '%'))
              and (:studentEmail is null
                   or lower(coalesce(student.email, ''))
                      like concat('%', lower(cast(:studentEmail as string)), '%'))
              and (:studentIdentifier is null
                   or lower(cast(student.id as string))
                      like concat('%', lower(cast(:studentIdentifier as string)), '%')
                   or lower(coalesce(student.altId, ''))
                      like concat('%', lower(cast(:studentIdentifier as string)), '%'))
              and (:classOf is null or extract(year from student.estimatedGradDate) = :classOf)
              and (:status is null or transferRequest.status = :status)
              and (:division is null
                   or exists (
                       select studentAcademicCareer.id
                       from StudentAcademicCareer studentAcademicCareer
                       join AcademicCareerRegistrationDivision registrationDivision
                         on registrationDivision.academicCareer.id = studentAcademicCareer.academicCareer.id
                       join registrationDivision.academicDivision academicDivision
                       where studentAcademicCareer.student.id = student.id
                         and upper(studentAcademicCareer.status) = 'ACTIVE'
                         and studentAcademicCareer.effectiveEndDate is null
                         and (
                             lower(academicDivision.code) = lower(cast(:division as string))
                             or lower(academicDivision.name) = lower(cast(:division as string))
                         )
                   ))
            order by transferRequest.submittedAt asc,
                     transferRequest.id asc
            """)
    List<TransferRequest> searchRequests(
            @Param("studentName") String studentName,
            @Param("studentEmail") String studentEmail,
            @Param("studentIdentifier") String studentIdentifier,
            @Param("classOf") Integer classOf,
            @Param("division") String division,
            @Param("status") String status
    );

    @EntityGraph(attributePaths = {"student", "policy", "transferInstitution", "decidedByUser"})
    List<TransferRequest> findByStudentIdOrderBySubmittedAtDescIdDesc(Long studentId);

    @EntityGraph(attributePaths = {"student", "policy", "transferInstitution", "decidedByUser"})
    List<TransferRequest> findByStudentIdAndStatusOrderByDecidedAtDescIdDesc(Long studentId, String status);
}
