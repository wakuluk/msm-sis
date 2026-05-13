package com.msm.sis.api.repository;

import com.msm.sis.api.entity.RegistrationGroupStudent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

public interface RegistrationGroupStudentRepository extends JpaRepository<RegistrationGroupStudent, Long> {

    @Query("""
            select registrationGroupStudent.registrationGroup.id as registrationGroupId,
                   count(registrationGroupStudent.id) as studentCount
            from RegistrationGroupStudent registrationGroupStudent
            where registrationGroupStudent.registrationGroup.id in :registrationGroupIds
            group by registrationGroupStudent.registrationGroup.id
            """)
    List<RegistrationGroupStudentCountProjection> countStudentsByRegistrationGroupIds(
            @Param("registrationGroupIds") List<Long> registrationGroupIds
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            where registrationGroupStudent.registrationGroup.id = :registrationGroupId
            order by registrationGroupStudent.student.lastName asc,
                     registrationGroupStudent.student.firstName asc,
                     registrationGroupStudent.student.email asc,
                     registrationGroupStudent.student.id asc
            """)
    List<RegistrationGroupStudent> findAssignedStudentsForGroup(
            @Param("registrationGroupId") Long registrationGroupId
    );

    @EntityGraph(attributePaths = {
            "student",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            where registrationGroupStudent.registrationGroup.id in :registrationGroupIds
            order by registrationGroupStudent.registrationGroup.id asc,
                     registrationGroupStudent.student.lastName asc,
                     registrationGroupStudent.student.firstName asc,
                     registrationGroupStudent.student.email asc,
                     registrationGroupStudent.student.id asc
            """)
    List<RegistrationGroupStudent> findAssignedStudentsForGroups(
            @Param("registrationGroupIds") List<Long> registrationGroupIds
    );

    @EntityGraph(attributePaths = {
            "student",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            where registrationGroupStudent.student.id in :studentIds
              and registrationGroupStudent.registrationGroup.academicYear.id = :academicYearId
              and registrationGroupStudent.registrationGroup.term.id = :termId
              and upper(registrationGroupStudent.registrationGroup.status) <> 'CANCELLED'
            order by registrationGroupStudent.updatedAt desc,
                     registrationGroupStudent.createdAt desc,
                     registrationGroupStudent.id desc
            """)
    List<RegistrationGroupStudent> findAssignmentsForStudentsInPeriod(
            @Param("studentIds") List<Long> studentIds,
            @Param("academicYearId") Long academicYearId,
            @Param("termId") Long termId
    );

    @EntityGraph(attributePaths = {
            "student",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            where registrationGroupStudent.registrationGroup.id = :registrationGroupId
              and registrationGroupStudent.student.id = :studentId
            """)
    Optional<RegistrationGroupStudent> findByRegistrationGroupIdAndStudentId(
            @Param("registrationGroupId") Long registrationGroupId,
            @Param("studentId") Long studentId
    );

    @EntityGraph(attributePaths = {
            "student",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term",
            "registrationGroup.term.academicSubTerms",
            "registrationGroup.term.academicSubTerms.status"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            join registrationGroupStudent.registrationGroup registrationGroup
            where registrationGroupStudent.registrationGroup.id = :registrationGroupId
              and registrationGroupStudent.student.id = :studentId
              and upper(registrationGroup.status) in ('PUBLISHED', 'CLOSED')
            """)
    Optional<RegistrationGroupStudent> findViewableAssignmentByRegistrationGroupIdAndStudentId(
            @Param("registrationGroupId") Long registrationGroupId,
            @Param("studentId") Long studentId
    );

    @EntityGraph(attributePaths = {
            "student",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term",
            "registrationGroup.term.academicSubTerms",
            "registrationGroup.term.academicSubTerms.status"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            join registrationGroupStudent.registrationGroup registrationGroup
            join registrationGroup.term term
            where registrationGroupStudent.student.id = :studentId
              and upper(registrationGroup.status) = 'PUBLISHED'
              and term.endDate >= :today
            order by
                case
                    when term.startDate <= :today and term.endDate >= :today then 0
                    else 1
                end asc,
                term.startDate asc,
                registrationGroup.registrationOpensAt asc,
                registrationGroup.id asc
            """)
    List<RegistrationGroupStudent> findPublishedCurrentOrUpcomingAssignmentsForStudent(
            @Param("studentId") Long studentId,
            @Param("today") LocalDate today
    );

    @EntityGraph(attributePaths = {
            "student",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            join registrationGroupStudent.registrationGroup registrationGroup
            join registrationGroup.term term
            where registrationGroupStudent.student.id = :studentId
              and upper(registrationGroup.status) in ('PUBLISHED', 'CLOSED')
            """)
    List<RegistrationGroupStudent> findViewableAssignmentsForStudent(
            @Param("studentId") Long studentId
    );

    @EntityGraph(attributePaths = {
            "student",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term",
            "registrationGroup.term.academicSubTerms",
            "registrationGroup.term.academicSubTerms.status"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            join registrationGroupStudent.registrationGroup registrationGroup
            join registrationGroup.term term
            where registrationGroupStudent.student.id = :studentId
              and term.id = :termId
              and upper(registrationGroup.status) in ('PUBLISHED', 'CLOSED')
            """)
    List<RegistrationGroupStudent> findViewableAssignmentsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId
    );

    @EntityGraph(attributePaths = {
            "student",
            "registrationGroup",
            "registrationGroup.academicYear",
            "registrationGroup.term",
            "registrationGroup.term.academicSubTerms"
    })
    @Query("""
            select registrationGroupStudent
            from RegistrationGroupStudent registrationGroupStudent
            join registrationGroupStudent.registrationGroup registrationGroup
            where registrationGroupStudent.student.id = :studentId
              and registrationGroup.term.id = :termId
              and upper(registrationGroup.status) = 'PUBLISHED'
            order by registrationGroup.registrationOpensAt asc,
                     registrationGroup.id asc
            """)
    List<RegistrationGroupStudent> findPublishedAssignmentsForStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("termId") Long termId
    );

    interface RegistrationGroupStudentCountProjection {
        Long getRegistrationGroupId();

        long getStudentCount();
    }
}
