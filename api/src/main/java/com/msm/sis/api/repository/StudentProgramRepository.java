package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentProgram;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudentProgramRepository extends JpaRepository<StudentProgram, Long> {
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
}
