package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentSectionEnrollmentStatusRepository extends JpaRepository<StudentSectionEnrollmentStatus, Long> {
    Optional<StudentSectionEnrollmentStatus> findByCode(String code);

    List<StudentSectionEnrollmentStatus> findAllByOrderBySortOrderAsc();

    List<StudentSectionEnrollmentStatus> findAllByActiveTrueAndAllowLinearShiftTrueOrderBySortOrderAsc();

    List<StudentSectionEnrollmentStatus> findAllByActiveTrueOrderBySortOrderAsc();

    List<StudentSectionEnrollmentStatus> findAllByActiveTrueOrderByNameAsc();
}
