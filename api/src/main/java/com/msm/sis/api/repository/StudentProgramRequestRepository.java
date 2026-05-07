package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.StudentProgramRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface StudentProgramRequestRepository extends JpaRepository<StudentProgramRequest, Long> {

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "program",
            "program.programType",
            "program.degreeType",
            "program.school",
            "program.department",
            "requestedProgramVersion",
            "departmentApprovedProgramVersion",
            "studentProgram",
            "departmentReviewedByUser",
            "adminReviewedByUser"
    })
    @Query("""
            select studentProgramRequest
            from StudentProgramRequest studentProgramRequest
            where studentProgramRequest.id = :studentProgramRequestId
            """)
    Optional<StudentProgramRequest> findRequestById(
            @Param("studentProgramRequestId") Long studentProgramRequestId
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "program",
            "program.programType",
            "program.degreeType",
            "program.school",
            "program.department",
            "requestedProgramVersion",
            "departmentApprovedProgramVersion",
            "studentProgram",
            "departmentReviewedByUser",
            "adminReviewedByUser"
    })
    @Query("""
            select studentProgramRequest
            from StudentProgramRequest studentProgramRequest
            join studentProgramRequest.student student
            left join student.classStanding classStanding
            join studentProgramRequest.program program
            left join program.programType programType
            left join program.degreeType degreeType
            left join program.school school
            left join program.department department
            where studentProgramRequest.status in :statuses
              and (:studentQuery is null or lower(concat(
                    coalesce(student.firstName, ''), ' ',
                    coalesce(student.lastName, ''), ' ',
                    coalesce(student.preferredName, ''), ' ',
                    coalesce(student.email, '')
              )) like :studentQuery)
              and (:programQuery is null or lower(concat(coalesce(program.code, ''), ' ', coalesce(program.name, ''))) like :programQuery)
              and (:programTypeId is null or programType.id = :programTypeId)
              and (:degreeTypeId is null or degreeType.id = :degreeTypeId)
              and (:schoolId is null or school.id = :schoolId)
              and (:departmentId is null or department.id = :departmentId)
              and (:classStandingId is null or classStanding.id = :classStandingId)
              and (cast(:requestedFrom as timestamp) is null or studentProgramRequest.requestedAt >= :requestedFrom)
              and (cast(:requestedBefore as timestamp) is null or studentProgramRequest.requestedAt < :requestedBefore)
            """)
    Page<StudentProgramRequest> findProgramRequests(
            @Param("statuses") List<String> statuses,
            @Param("studentQuery") String studentQuery,
            @Param("programQuery") String programQuery,
            @Param("programTypeId") Long programTypeId,
            @Param("degreeTypeId") Long degreeTypeId,
            @Param("schoolId") Long schoolId,
            @Param("departmentId") Long departmentId,
            @Param("classStandingId") Long classStandingId,
            @Param("requestedFrom") LocalDateTime requestedFrom,
            @Param("requestedBefore") LocalDateTime requestedBefore,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "program",
            "program.programType",
            "program.degreeType",
            "program.school",
            "program.department",
            "requestedProgramVersion",
            "departmentApprovedProgramVersion",
            "studentProgram",
            "departmentReviewedByUser",
            "adminReviewedByUser"
    })
    @Query("""
            select studentProgramRequest
            from StudentProgramRequest studentProgramRequest
            join studentProgramRequest.student student
            left join student.classStanding classStanding
            join studentProgramRequest.program program
            left join program.programType programType
            left join program.degreeType degreeType
            left join program.school school
            left join program.department department
            where studentProgramRequest.status in :statuses
              and department.id in :departmentIds
              and (:studentQuery is null or lower(concat(
                    coalesce(student.firstName, ''), ' ',
                    coalesce(student.lastName, ''), ' ',
                    coalesce(student.preferredName, ''), ' ',
                    coalesce(student.email, '')
              )) like :studentQuery)
              and (:programQuery is null or lower(concat(coalesce(program.code, ''), ' ', coalesce(program.name, ''))) like :programQuery)
              and (:programTypeId is null or programType.id = :programTypeId)
              and (:degreeTypeId is null or degreeType.id = :degreeTypeId)
              and (:schoolId is null or school.id = :schoolId)
              and (:departmentId is null or department.id = :departmentId)
              and (:classStandingId is null or classStanding.id = :classStandingId)
              and (cast(:requestedFrom as timestamp) is null or studentProgramRequest.requestedAt >= :requestedFrom)
              and (cast(:requestedBefore as timestamp) is null or studentProgramRequest.requestedAt < :requestedBefore)
            """)
    Page<StudentProgramRequest> findProgramRequestsForDepartments(
            @Param("statuses") List<String> statuses,
            @Param("departmentIds") List<Long> departmentIds,
            @Param("studentQuery") String studentQuery,
            @Param("programQuery") String programQuery,
            @Param("programTypeId") Long programTypeId,
            @Param("degreeTypeId") Long degreeTypeId,
            @Param("schoolId") Long schoolId,
            @Param("departmentId") Long departmentId,
            @Param("classStandingId") Long classStandingId,
            @Param("requestedFrom") LocalDateTime requestedFrom,
            @Param("requestedBefore") LocalDateTime requestedBefore,
            Pageable pageable
    );

    @Query("""
            select count(studentProgramRequest)
            from StudentProgramRequest studentProgramRequest
            join studentProgramRequest.student student
            left join student.classStanding classStanding
            join studentProgramRequest.program program
            left join program.programType programType
            left join program.degreeType degreeType
            left join program.school school
            left join program.department department
            where studentProgramRequest.status in :statuses
              and (:studentQuery is null or lower(concat(
                    coalesce(student.firstName, ''), ' ',
                    coalesce(student.lastName, ''), ' ',
                    coalesce(student.preferredName, ''), ' ',
                    coalesce(student.email, '')
              )) like :studentQuery)
              and (:programQuery is null or lower(concat(coalesce(program.code, ''), ' ', coalesce(program.name, ''))) like :programQuery)
              and (:programTypeId is null or programType.id = :programTypeId)
              and (:degreeTypeId is null or degreeType.id = :degreeTypeId)
              and (:schoolId is null or school.id = :schoolId)
              and (:departmentId is null or department.id = :departmentId)
              and (:classStandingId is null or classStanding.id = :classStandingId)
              and (cast(:requestedFrom as timestamp) is null or studentProgramRequest.requestedAt >= :requestedFrom)
              and (cast(:requestedBefore as timestamp) is null or studentProgramRequest.requestedAt < :requestedBefore)
            """)
    long countProgramRequests(
            @Param("statuses") List<String> statuses,
            @Param("studentQuery") String studentQuery,
            @Param("programQuery") String programQuery,
            @Param("programTypeId") Long programTypeId,
            @Param("degreeTypeId") Long degreeTypeId,
            @Param("schoolId") Long schoolId,
            @Param("departmentId") Long departmentId,
            @Param("classStandingId") Long classStandingId,
            @Param("requestedFrom") LocalDateTime requestedFrom,
            @Param("requestedBefore") LocalDateTime requestedBefore
    );

    @Query("""
            select count(studentProgramRequest)
            from StudentProgramRequest studentProgramRequest
            join studentProgramRequest.student student
            left join student.classStanding classStanding
            join studentProgramRequest.program program
            left join program.programType programType
            left join program.degreeType degreeType
            left join program.school school
            left join program.department department
            where studentProgramRequest.status = :status
              and (:studentQuery is null or lower(concat(
                    coalesce(student.firstName, ''), ' ',
                    coalesce(student.lastName, ''), ' ',
                    coalesce(student.preferredName, ''), ' ',
                    coalesce(student.email, '')
              )) like :studentQuery)
              and (:programQuery is null or lower(concat(coalesce(program.code, ''), ' ', coalesce(program.name, ''))) like :programQuery)
              and (:programTypeId is null or programType.id = :programTypeId)
              and (:degreeTypeId is null or degreeType.id = :degreeTypeId)
              and (:schoolId is null or school.id = :schoolId)
              and (:departmentId is null or department.id = :departmentId)
              and (:classStandingId is null or classStanding.id = :classStandingId)
              and (cast(:requestedFrom as timestamp) is null or studentProgramRequest.requestedAt >= :requestedFrom)
              and (cast(:requestedBefore as timestamp) is null or studentProgramRequest.requestedAt < :requestedBefore)
            """)
    long countProgramRequestsByStatus(
            @Param("status") String status,
            @Param("studentQuery") String studentQuery,
            @Param("programQuery") String programQuery,
            @Param("programTypeId") Long programTypeId,
            @Param("degreeTypeId") Long degreeTypeId,
            @Param("schoolId") Long schoolId,
            @Param("departmentId") Long departmentId,
            @Param("classStandingId") Long classStandingId,
            @Param("requestedFrom") LocalDateTime requestedFrom,
            @Param("requestedBefore") LocalDateTime requestedBefore
    );

    @Query("""
            select count(studentProgramRequest)
            from StudentProgramRequest studentProgramRequest
            join studentProgramRequest.student student
            left join student.classStanding classStanding
            join studentProgramRequest.program program
            left join program.programType programType
            left join program.degreeType degreeType
            left join program.school school
            left join program.department department
            where studentProgramRequest.status in :statuses
              and department.id in :departmentIds
              and (:studentQuery is null or lower(concat(
                    coalesce(student.firstName, ''), ' ',
                    coalesce(student.lastName, ''), ' ',
                    coalesce(student.preferredName, ''), ' ',
                    coalesce(student.email, '')
              )) like :studentQuery)
              and (:programQuery is null or lower(concat(coalesce(program.code, ''), ' ', coalesce(program.name, ''))) like :programQuery)
              and (:programTypeId is null or programType.id = :programTypeId)
              and (:degreeTypeId is null or degreeType.id = :degreeTypeId)
              and (:schoolId is null or school.id = :schoolId)
              and (:departmentId is null or department.id = :departmentId)
              and (:classStandingId is null or classStanding.id = :classStandingId)
              and (cast(:requestedFrom as timestamp) is null or studentProgramRequest.requestedAt >= :requestedFrom)
              and (cast(:requestedBefore as timestamp) is null or studentProgramRequest.requestedAt < :requestedBefore)
            """)
    long countProgramRequestsForDepartments(
            @Param("statuses") List<String> statuses,
            @Param("departmentIds") List<Long> departmentIds,
            @Param("studentQuery") String studentQuery,
            @Param("programQuery") String programQuery,
            @Param("programTypeId") Long programTypeId,
            @Param("degreeTypeId") Long degreeTypeId,
            @Param("schoolId") Long schoolId,
            @Param("departmentId") Long departmentId,
            @Param("classStandingId") Long classStandingId,
            @Param("requestedFrom") LocalDateTime requestedFrom,
            @Param("requestedBefore") LocalDateTime requestedBefore
    );

    @Query("""
            select count(studentProgramRequest)
            from StudentProgramRequest studentProgramRequest
            join studentProgramRequest.student student
            left join student.classStanding classStanding
            join studentProgramRequest.program program
            left join program.programType programType
            left join program.degreeType degreeType
            left join program.school school
            left join program.department department
            where studentProgramRequest.status = :status
              and department.id in :departmentIds
              and (:studentQuery is null or lower(concat(
                    coalesce(student.firstName, ''), ' ',
                    coalesce(student.lastName, ''), ' ',
                    coalesce(student.preferredName, ''), ' ',
                    coalesce(student.email, '')
              )) like :studentQuery)
              and (:programQuery is null or lower(concat(coalesce(program.code, ''), ' ', coalesce(program.name, ''))) like :programQuery)
              and (:programTypeId is null or programType.id = :programTypeId)
              and (:degreeTypeId is null or degreeType.id = :degreeTypeId)
              and (:schoolId is null or school.id = :schoolId)
              and (:departmentId is null or department.id = :departmentId)
              and (:classStandingId is null or classStanding.id = :classStandingId)
              and (cast(:requestedFrom as timestamp) is null or studentProgramRequest.requestedAt >= :requestedFrom)
              and (cast(:requestedBefore as timestamp) is null or studentProgramRequest.requestedAt < :requestedBefore)
            """)
    long countProgramRequestsForDepartmentsByStatus(
            @Param("status") String status,
            @Param("departmentIds") List<Long> departmentIds,
            @Param("studentQuery") String studentQuery,
            @Param("programQuery") String programQuery,
            @Param("programTypeId") Long programTypeId,
            @Param("degreeTypeId") Long degreeTypeId,
            @Param("schoolId") Long schoolId,
            @Param("departmentId") Long departmentId,
            @Param("classStandingId") Long classStandingId,
            @Param("requestedFrom") LocalDateTime requestedFrom,
            @Param("requestedBefore") LocalDateTime requestedBefore
    );

    @Query("""
            select distinct department
            from StudentProgramRequest studentProgramRequest
            join studentProgramRequest.program.department department
            join fetch department.school
            where studentProgramRequest.status in :statuses
              and (:departmentId is null or department.id = :departmentId)
            order by department.name asc
            """)
    List<AcademicDepartment> findProgramRequestDepartments(
            @Param("statuses") List<String> statuses,
            @Param("departmentId") Long departmentId
    );

    @Query("""
            select studentProgramRequest
            from StudentProgramRequest studentProgramRequest
            where studentProgramRequest.student.id = :studentId
              and studentProgramRequest.program.id = :programId
              and studentProgramRequest.status in ('REQUESTED', 'DEPARTMENT_APPROVED')
            order by studentProgramRequest.requestedAt desc, studentProgramRequest.id desc
            """)
    List<StudentProgramRequest> findOpenRequestsForStudentAndProgram(
            @Param("studentId") Long studentId,
            @Param("programId") Long programId
    );

    @EntityGraph(attributePaths = {
            "studentProgram",
            "program",
            "departmentReviewedByUser",
            "adminReviewedByUser"
    })
    @Query("""
            select studentProgramRequest
            from StudentProgramRequest studentProgramRequest
            where studentProgramRequest.studentProgram.id in :studentProgramIds
            order by studentProgramRequest.studentProgram.id asc,
                     studentProgramRequest.requestedAt desc,
                     studentProgramRequest.id desc
            """)
    List<StudentProgramRequest> findRequestsForStudentPrograms(
            @Param("studentProgramIds") List<Long> studentProgramIds
    );

    @EntityGraph(attributePaths = {
            "student",
            "student.classStanding",
            "program",
            "program.programType",
            "program.degreeType",
            "program.school",
            "program.department",
            "requestedProgramVersion",
            "departmentApprovedProgramVersion",
            "studentProgram",
            "departmentReviewedByUser",
            "adminReviewedByUser"
    })
    @Query("""
            select studentProgramRequest
            from StudentProgramRequest studentProgramRequest
            where studentProgramRequest.studentProgram.id = :studentProgramId
            order by studentProgramRequest.requestedAt desc,
                     studentProgramRequest.id desc
            """)
    List<StudentProgramRequest> findRequestsForStudentProgram(
            @Param("studentProgramId") Long studentProgramId
    );

    @EntityGraph(attributePaths = {
            "program",
            "requestedProgramVersion",
            "departmentApprovedProgramVersion",
            "studentProgram"
    })
    @Query("""
            select studentProgramRequest
            from StudentProgramRequest studentProgramRequest
            where studentProgramRequest.student.id = :studentId
              and studentProgramRequest.status in ('REQUESTED', 'DEPARTMENT_APPROVED')
            order by studentProgramRequest.requestedAt desc, studentProgramRequest.id desc
            """)
    List<StudentProgramRequest> findOpenRequestsForStudent(@Param("studentId") Long studentId);
}
