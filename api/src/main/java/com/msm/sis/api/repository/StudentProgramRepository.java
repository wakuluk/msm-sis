package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentProgram;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentProgramRepository extends JpaRepository<StudentProgram, Long> {
    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "programVersion",
            "programVersion.program",
            "programVersion.program.programType",
            "programVersion.program.degreeType",
            "programVersion.program.school",
            "programVersion.program.department"
    })
    @Query("""
            select studentProgram
            from StudentProgram studentProgram
            where studentProgram.id = :studentProgramId
            """)
    Optional<StudentProgram> findReviewDetailById(@Param("studentProgramId") Long studentProgramId);

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "programVersion",
            "programVersion.program",
            "programVersion.program.programType",
            "programVersion.program.degreeType",
            "programVersion.program.school",
            "programVersion.program.department"
    })
    @Query("""
            select studentProgram
            from StudentProgram studentProgram
            where studentProgram.student.id = :studentId
              and studentProgram.programVersion.program.id = :programId
            order by studentProgram.updatedAt desc, studentProgram.id desc
            """)
    List<StudentProgram> findForStudentAndProgramIncludingRemoved(
            @Param("studentId") Long studentId,
            @Param("programId") Long programId
    );

    @EntityGraph(attributePaths = {
            "student",
            "programVersion",
            "programVersion.program",
            "programVersion.program.programType",
            "programVersion.program.degreeType",
            "programVersion.program.school",
            "programVersion.program.department"
    })
    @Query("""
            select studentProgram
            from StudentProgram studentProgram
            where studentProgram.student.id = :studentId
              and studentProgram.programVersion.program.id = :programId
              and studentProgram.status <> 'REMOVED'
            order by studentProgram.updatedAt desc, studentProgram.id desc
            """)
    List<StudentProgram> findCurrentForStudentAndProgram(
            @Param("studentId") Long studentId,
            @Param("programId") Long programId
    );

    @EntityGraph(attributePaths = {
            "programVersion",
            "programVersion.program",
            "programVersion.program.programType",
            "programVersion.program.degreeType",
            "programVersion.program.school",
            "programVersion.program.department"
    })
    @Query("""
            select studentProgram
            from StudentProgram studentProgram
            where studentProgram.student.id = :studentId
              and studentProgram.status in :statuses
            order by studentProgram.programVersion.program.name asc
            """)
    List<StudentProgram> findForStudentByStatuses(
            @Param("studentId") Long studentId,
            @Param("statuses") List<String> statuses
    );

    @EntityGraph(attributePaths = {
            "student",
            "programVersion",
            "programVersion.program",
            "programVersion.program.programType",
            "programVersion.program.degreeType"
    })
    @Query("""
            select studentProgram
            from StudentProgram studentProgram
            where studentProgram.student.id in :studentIds
              and upper(studentProgram.status) in ('ACTIVE', 'COMPLETED')
            order by studentProgram.programVersion.program.name asc,
                     studentProgram.id asc
            """)
    List<StudentProgram> findRegistrationPreviewProgramsByStudentIds(
            @Param("studentIds") List<Long> studentIds
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "programVersion",
            "programVersion.program",
            "programVersion.program.programType",
            "programVersion.program.degreeType",
            "programVersion.program.school",
            "programVersion.program.department"
    })
    @Query("""
            select studentProgram
            from StudentProgram studentProgram
            join studentProgram.student student
            join studentProgram.programVersion programVersion
            join programVersion.program program
            left join program.programType programType
            left join program.degreeType degreeType
            left join program.school school
            left join program.department department
            left join student.classStanding classStanding
            where department.id in :departmentIds
              and upper(programType.code) = 'MAJOR'
              and upper(studentProgram.status) <> 'EXPLORING'
              and (:status is null or upper(studentProgram.status) = :status)
              and (:classStandingId is null or classStanding.id = :classStandingId)
              and (:degreeTypeId is null or degreeType.id = :degreeTypeId)
              and (:studentQuery is null or lower(concat(
                    coalesce(student.firstName, ''), ' ',
                    coalesce(student.lastName, ''), ' ',
                    coalesce(student.preferredName, ''), ' ',
                    coalesce(student.email, '')
              )) like :studentQuery)
              and (:programQuery is null or lower(concat(coalesce(program.code, ''), ' ', coalesce(program.name, ''))) like :programQuery)
            """)
    Page<StudentProgram> findMajorAssignmentsForDepartments(
            @Param("departmentIds") List<Long> departmentIds,
            @Param("status") String status,
            @Param("classStandingId") Integer classStandingId,
            @Param("degreeTypeId") Long degreeTypeId,
            @Param("studentQuery") String studentQuery,
            @Param("programQuery") String programQuery,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "programVersion",
            "programVersion.program",
            "programVersion.program.programType",
            "programVersion.program.degreeType",
            "programVersion.program.school",
            "programVersion.program.department"
    })
    @Query("""
            select studentProgram
            from StudentProgram studentProgram
            join studentProgram.student student
            join studentProgram.programVersion programVersion
            join programVersion.program program
            left join program.programType programType
            left join program.degreeType degreeType
            left join program.school school
            left join program.department department
            left join student.classStanding classStanding
            where upper(studentProgram.status) <> 'EXPLORING'
              and (:status is null or upper(studentProgram.status) = :status)
              and (:classStandingId is null or classStanding.id = :classStandingId)
              and (:degreeTypeId is null or degreeType.id = :degreeTypeId)
              and (:departmentId is null or department.id = :departmentId)
              and (:programTypeId is null or programType.id = :programTypeId)
              and (:schoolId is null or school.id = :schoolId)
              and (:studentQuery is null or lower(concat(
                    coalesce(student.firstName, ''), ' ',
                    coalesce(student.lastName, ''), ' ',
                    coalesce(student.preferredName, ''), ' ',
                    coalesce(student.email, '')
              )) like :studentQuery)
              and (:programQuery is null or lower(concat(coalesce(program.code, ''), ' ', coalesce(program.name, ''))) like :programQuery)
            """)
    Page<StudentProgram> findAssignments(
            @Param("status") String status,
            @Param("classStandingId") Integer classStandingId,
            @Param("degreeTypeId") Long degreeTypeId,
            @Param("departmentId") Long departmentId,
            @Param("programTypeId") Long programTypeId,
            @Param("schoolId") Long schoolId,
            @Param("studentQuery") String studentQuery,
            @Param("programQuery") String programQuery,
            Pageable pageable
    );
}
