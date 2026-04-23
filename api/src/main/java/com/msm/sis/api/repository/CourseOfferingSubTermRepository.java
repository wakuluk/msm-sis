package com.msm.sis.api.repository;

import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.entity.CourseOfferingSubTermId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseOfferingSubTermRepository extends JpaRepository<CourseOfferingSubTerm, CourseOfferingSubTermId> {
    void deleteAllByCourseOffering_Id(Long courseOfferingId);
}
