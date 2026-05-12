package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentHonors;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentHonorsRepository extends JpaRepository<StudentHonors, Long> {

    @EntityGraph(attributePaths = {"student", "updatedByUser"})
    @Query("""
            select honors
            from StudentHonors honors
            where honors.student.id = :studentId
            """)
    Optional<StudentHonors> findForStudent(@Param("studentId") Long studentId);

    @EntityGraph(attributePaths = {"student"})
    @Query("""
            select honors
            from StudentHonors honors
            where honors.active = true
              and honors.student.id in :studentIds
            """)
    List<StudentHonors> findActiveByStudentIds(@Param("studentIds") List<Long> studentIds);
}
