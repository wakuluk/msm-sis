package com.msm.sis.api.repository;

import com.msm.sis.api.entity.RequirementCourseRule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RequirementCourseRuleRepository extends JpaRepository<RequirementCourseRule, Long> {
    @EntityGraph(attributePaths = {"requirement", "department"})
    @Query("""
            select requirementCourseRule
            from RequirementCourseRule requirementCourseRule
            where requirementCourseRule.requirement.id in :requirementIds
            order by requirementCourseRule.requirement.id asc,
                     requirementCourseRule.department.name asc,
                     requirementCourseRule.id asc
            """)
    List<RequirementCourseRule> findRulesForRequirements(@Param("requirementIds") List<Long> requirementIds);
}
