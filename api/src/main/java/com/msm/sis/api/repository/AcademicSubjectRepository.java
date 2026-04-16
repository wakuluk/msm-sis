package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicSubject;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicSubjectRepository extends JpaRepository<AcademicSubject, Long> {
    @EntityGraph(attributePaths = {"department"})
    Optional<AcademicSubject> findByCode(String code);

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = {"department"})
    List<AcademicSubject> findAllByActiveTrueOrderByCodeAsc();

    @EntityGraph(attributePaths = {"department"})
    List<AcademicSubject> findAllByDepartment_CodeAndActiveTrueOrderByCodeAsc(String departmentCode);

    List<AcademicSubject> findAllByDepartment_Id(Long departmentId, org.springframework.data.domain.Sort sort);
}
