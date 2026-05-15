package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentTransferCreditCourse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentTransferCreditCourseRepository extends JpaRepository<StudentTransferCreditCourse, Long> {
    boolean existsByTransferCredit_IdAndCourse_Id(Long transferCreditId, Long courseId);
}
