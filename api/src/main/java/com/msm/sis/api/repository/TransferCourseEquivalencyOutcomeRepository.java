package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TransferCourseEquivalencyOutcome;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransferCourseEquivalencyOutcomeRepository
        extends JpaRepository<TransferCourseEquivalencyOutcome, Long> {

    @EntityGraph(attributePaths = {
            "localCourse",
            "localCourse.subject",
            "requirement",
            "programVersionRequirement",
            "programVersionRequirement.requirement"
    })
    List<TransferCourseEquivalencyOutcome> findByEquivalencyIdOrderBySortOrderAscIdAsc(Long equivalencyId);

    void deleteByEquivalencyId(Long equivalencyId);
}
