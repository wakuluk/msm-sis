package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseOfferingTerm;
import com.msm.sis.api.entity.CourseOfferingTermId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseOfferingTermRepository extends JpaRepository<CourseOfferingTerm, CourseOfferingTermId> {
    void deleteAllByCourseOffering_Id(Long courseOfferingId);
}
