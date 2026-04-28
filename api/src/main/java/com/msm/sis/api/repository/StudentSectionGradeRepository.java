package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionGrade;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentSectionGradeRepository extends JpaRepository<StudentSectionGrade, Long> {

    @EntityGraph(attributePaths = {"studentSectionEnrollment", "gradeType", "gradeMark", "postedByUser"})
    @Query("""
            select grade
            from StudentSectionGrade grade
            where grade.studentSectionEnrollment.id = :enrollmentId
            order by grade.postedAt desc, grade.id desc
            """)
    List<StudentSectionGrade> findAllByEnrollmentId(
            @Param("enrollmentId") Long enrollmentId
    );

    @EntityGraph(attributePaths = {"studentSectionEnrollment", "gradeType", "gradeMark", "postedByUser"})
    @Query("""
            select grade
            from StudentSectionGrade grade
            where grade.studentSectionEnrollment.id in :enrollmentIds
              and grade.current = true
            order by grade.studentSectionEnrollment.id asc, grade.gradeType.sortOrder asc
            """)
    List<StudentSectionGrade> findCurrentGradesByEnrollmentIds(
            @Param("enrollmentIds") List<Long> enrollmentIds
    );

    @EntityGraph(attributePaths = {"studentSectionEnrollment", "gradeType", "gradeMark", "postedByUser"})
    @Query("""
            select grade
            from StudentSectionGrade grade
            where grade.studentSectionEnrollment.id = :enrollmentId
              and upper(grade.gradeType.code) = upper(:gradeTypeCode)
              and grade.current = true
            """)
    Optional<StudentSectionGrade> findCurrentGradeByEnrollmentIdAndGradeTypeCode(
            @Param("enrollmentId") Long enrollmentId,
            @Param("gradeTypeCode") String gradeTypeCode
    );

    @Modifying
    @Query("""
            update StudentSectionGrade grade
            set grade.current = false
            where grade.studentSectionEnrollment.id = :enrollmentId
              and upper(grade.gradeType.code) = upper(:gradeTypeCode)
              and grade.current = true
            """)
    int expireCurrentGradesByEnrollmentIdAndGradeTypeCode(
            @Param("enrollmentId") Long enrollmentId,
            @Param("gradeTypeCode") String gradeTypeCode
    );
}
