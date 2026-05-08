package com.msm.sis.api.repository;

import com.msm.sis.api.entity.RequirementCourse;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RequirementCourseRepository extends JpaRepository<RequirementCourse, Long> {
    @EntityGraph(attributePaths = {"requirement", "course", "course.subject"})
    @Query("""
            select requirementCourse
            from RequirementCourse requirementCourse
            where requirementCourse.requirement.id in :requirementIds
            order by requirementCourse.requirement.id asc,
                     requirementCourse.id asc
            """)
    List<RequirementCourse> findCoursesForRequirements(@Param("requirementIds") List<Long> requirementIds);
}
