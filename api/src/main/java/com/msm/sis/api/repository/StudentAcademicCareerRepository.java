package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentAcademicCareer;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentAcademicCareerRepository extends JpaRepository<StudentAcademicCareer, Long> {
    @EntityGraph(attributePaths = {"student", "academicCareer", "createdByUser", "updatedByUser"})
    @Query("""
            select studentAcademicCareer
            from StudentAcademicCareer studentAcademicCareer
            where studentAcademicCareer.student.id = :studentId
            order by studentAcademicCareer.effectiveStartDate desc,
                     studentAcademicCareer.id desc
            """)
    List<StudentAcademicCareer> findAllForStudent(@Param("studentId") Long studentId);

    @EntityGraph(attributePaths = {"student", "academicCareer", "createdByUser", "updatedByUser"})
    @Query("""
            select studentAcademicCareer
            from StudentAcademicCareer studentAcademicCareer
            where studentAcademicCareer.id = :studentAcademicCareerId
              and studentAcademicCareer.student.id = :studentId
            """)
    Optional<StudentAcademicCareer> findForStudentById(
            @Param("studentId") Long studentId,
            @Param("studentAcademicCareerId") Long studentAcademicCareerId
    );

    @EntityGraph(attributePaths = {"academicCareer"})
    @Query("""
            select studentAcademicCareer
            from StudentAcademicCareer studentAcademicCareer
            where studentAcademicCareer.student.id = :studentId
              and studentAcademicCareer.status = 'ACTIVE'
              and studentAcademicCareer.effectiveEndDate is null
              and studentAcademicCareer.primaryCareer = true
              and (:excludedId is null or studentAcademicCareer.id <> :excludedId)
            """)
    List<StudentAcademicCareer> findOtherCurrentPrimaryCareers(
            @Param("studentId") Long studentId,
            @Param("excludedId") Long excludedId
    );

    @Query("""
            select count(studentAcademicCareer) > 0
            from StudentAcademicCareer studentAcademicCareer
            where studentAcademicCareer.student.id = :studentId
              and studentAcademicCareer.academicCareer.id = :academicCareerId
              and (:excludedId is null or studentAcademicCareer.id <> :excludedId)
            """)
    boolean existsOtherCareerTypeForStudent(
            @Param("studentId") Long studentId,
            @Param("academicCareerId") Long academicCareerId,
            @Param("excludedId") Long excludedId
    );

    @Query("""
            select studentAcademicCareer.student.id as studentId,
                   registrationDivision.academicDivision as academicDivision
            from StudentAcademicCareer studentAcademicCareer
            join AcademicCareerRegistrationDivision registrationDivision
              on registrationDivision.academicCareer.id = studentAcademicCareer.academicCareer.id
            where studentAcademicCareer.student.id in :studentIds
              and upper(studentAcademicCareer.status) = 'ACTIVE'
              and studentAcademicCareer.effectiveEndDate is null
            order by studentAcademicCareer.student.id asc,
                     registrationDivision.academicDivision.sortOrder asc,
                     registrationDivision.academicDivision.name asc
            """)
    List<StudentAcademicCareerAcademicDivisionProjection> findActiveCareerAcademicDivisionsByStudentIds(
            @Param("studentIds") List<Long> studentIds
    );

    interface StudentAcademicCareerAcademicDivisionProjection {
        Long getStudentId();

        com.msm.sis.api.entity.AcademicDivision getAcademicDivision();
    }
}
