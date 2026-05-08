package com.msm.sis.api.repository;

import com.msm.sis.api.entity.Program;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProgramRepository extends JpaRepository<Program, Long> {
    @Override
    @EntityGraph(attributePaths = {"school", "department", "programType", "degreeType"})
    Optional<Program> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"school", "department", "programType", "degreeType"})
    List<Program> findAll();

    @EntityGraph(attributePaths = {"school", "department", "programType", "degreeType"})
    Optional<Program> findByCode(String code);

    boolean existsByCode(String code);
}
