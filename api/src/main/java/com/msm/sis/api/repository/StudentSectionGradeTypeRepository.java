package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentSectionGradeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentSectionGradeTypeRepository extends JpaRepository<StudentSectionGradeType, Long> {
    Optional<StudentSectionGradeType> findByCode(String code);

    List<StudentSectionGradeType> findAllByActiveTrueOrderBySortOrderAsc();

    List<StudentSectionGradeType> findAllByActiveTrueOrderByNameAsc();
}
