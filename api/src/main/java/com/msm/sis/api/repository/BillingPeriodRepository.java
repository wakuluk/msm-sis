package com.msm.sis.api.repository;

import com.msm.sis.api.entity.BillingPeriod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BillingPeriodRepository extends JpaRepository<BillingPeriod, Long> {
    @Override
    @EntityGraph(attributePaths = {"academicYear", "term", "createdByUser", "updatedByUser"})
    Optional<BillingPeriod> findById(Long id);

    Optional<BillingPeriod> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @EntityGraph(attributePaths = {"academicYear", "term"})
    @Query("""
            select billingPeriod
            from BillingPeriod billingPeriod
            where (:name is null or lower(billingPeriod.name) like :name)
              and (:description is null or lower(billingPeriod.description) like :description)
              and (:status is null or lower(billingPeriod.status) = :status)
              and (
                    :academicTerm is null
                    or lower(billingPeriod.taxAcademicTermCode) like :academicTerm
                    or lower(billingPeriod.taxAcademicTermName) like :academicTerm
                    or lower(billingPeriod.term.code) like :academicTerm
                    or lower(billingPeriod.term.name) like :academicTerm
              )
              and (
                    :financialAidPeriod is null
                    or lower(billingPeriod.financialAidPeriodCode) like :financialAidPeriod
                    or lower(billingPeriod.financialAidPeriodName) like :financialAidPeriod
              )
            """)
    Page<BillingPeriod> searchBillingPeriods(
            @Param("name") String name,
            @Param("description") String description,
            @Param("status") String status,
            @Param("academicTerm") String academicTerm,
            @Param("financialAidPeriod") String financialAidPeriod,
            Pageable pageable
    );
}
