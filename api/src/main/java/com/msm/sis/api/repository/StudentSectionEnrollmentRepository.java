package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StudentSectionEnrollmentRepository extends JpaRepository<StudentSectionEnrollment, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "courseSection",
            "status",
            "gradingBasis",
            "statusChangedByUser",
            "grades",
            "grades.gradeType",
            "grades.gradeMark",
            "grades.postedByUser"
    })
    Optional<StudentSectionEnrollment> findById(Long id);

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "status",
            "gradingBasis",
            "statusChangedByUser"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
            """)
    Page<StudentSectionEnrollment> findPageBySectionId(
            @Param("sectionId") Long sectionId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "courseSection",
            "status",
            "gradingBasis",
            "statusChangedByUser",
            "grades",
            "grades.gradeType",
            "grades.gradeMark",
            "grades.postedByUser"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and enrollment.id = :enrollmentId
            """)
    Optional<StudentSectionEnrollment> findBySectionIdAndEnrollmentId(
            @Param("sectionId") Long sectionId,
            @Param("enrollmentId") Long enrollmentId
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "courseSection",
            "status",
            "gradingBasis",
            "statusChangedByUser"
    })
    @Query("""
            select enrollment
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and enrollment.student.id = :studentId
            """)
    Optional<StudentSectionEnrollment> findBySectionIdAndStudentId(
            @Param("sectionId") Long sectionId,
            @Param("studentId") Long studentId
    );

    @Query("""
            select
                case when count(enrollment) > 0 then true else false end
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and enrollment.student.id = :studentId
            """)
    boolean existsBySectionIdAndStudentId(
            @Param("sectionId") Long sectionId,
            @Param("studentId") Long studentId
    );

    @Query("""
            select count(enrollment)
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
              and upper(enrollment.status.code) = upper(:statusCode)
            """)
    long countBySectionIdAndStatusCode(
            @Param("sectionId") Long sectionId,
            @Param("statusCode") String statusCode
    );

    @Query("""
            select coalesce(max(enrollment.waitlistPosition), 0)
            from StudentSectionEnrollment enrollment
            where enrollment.courseSection.id = :sectionId
            """)
    Integer findMaxWaitlistPositionBySectionId(
            @Param("sectionId") Long sectionId
    );
}
