package com.msm.sis.api.repository;

import com.msm.sis.api.entity.TuitionCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TuitionCodeRepository extends JpaRepository<TuitionCode, Long> {
    @Override
    @EntityGraph(attributePaths = {"createdByUser", "updatedByUser"})
    Optional<TuitionCode> findById(Long id);

    @EntityGraph(attributePaths = {"createdByUser", "updatedByUser"})
    Optional<TuitionCode> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    @EntityGraph(attributePaths = {"createdByUser", "updatedByUser"})
    @Query("""
            select tuitionCode
            from TuitionCode tuitionCode
            where (:code is null or lower(tuitionCode.code) like :code)
              and (:name is null or lower(tuitionCode.name) like :name)
            """)
    Page<TuitionCode> searchTuitionCodes(
            @Param("code") String code,
            @Param("name") String name,
            Pageable pageable
    );
}

