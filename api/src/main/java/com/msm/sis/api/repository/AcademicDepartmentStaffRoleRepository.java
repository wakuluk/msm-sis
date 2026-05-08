package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicDepartmentStaffRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AcademicDepartmentStaffRoleRepository extends JpaRepository<AcademicDepartmentStaffRole, Long> {

    @Query("""
            select count(role) > 0
            from AcademicDepartmentStaffRole role
            join role.staff staff
            where staff.userId = :userId
              and role.department.id = :departmentId
              and role.roleCode = :roleCode
              and role.active = true
              and (role.startDate is null or role.startDate <= :asOfDate)
              and (role.endDate is null or role.endDate >= :asOfDate)
            """)
    boolean existsActiveRoleForUserAndDepartment(
            @Param("userId") Long userId,
            @Param("departmentId") Long departmentId,
            @Param("roleCode") String roleCode,
            @Param("asOfDate") LocalDate asOfDate
    );

    @Query("""
            select distinct role.department.id
            from AcademicDepartmentStaffRole role
            join role.staff staff
            where staff.userId = :userId
              and role.roleCode = :roleCode
              and role.active = true
              and (role.startDate is null or role.startDate <= :asOfDate)
              and (role.endDate is null or role.endDate >= :asOfDate)
            """)
    List<Long> findActiveDepartmentIdsForUserAndRole(
            @Param("userId") Long userId,
            @Param("roleCode") String roleCode,
            @Param("asOfDate") LocalDate asOfDate
    );

    @EntityGraph(attributePaths = {"department", "department.school"})
    @Query("""
            select distinct role.department
            from AcademicDepartmentStaffRole role
            join role.staff staff
            where staff.userId = :userId
              and role.roleCode = :roleCode
              and role.active = true
              and (role.startDate is null or role.startDate <= :asOfDate)
              and (role.endDate is null or role.endDate >= :asOfDate)
            order by role.department.name asc
            """)
    List<AcademicDepartment> findActiveDepartmentsForUserAndRole(
            @Param("userId") Long userId,
            @Param("roleCode") String roleCode,
            @Param("asOfDate") LocalDate asOfDate
    );
}
