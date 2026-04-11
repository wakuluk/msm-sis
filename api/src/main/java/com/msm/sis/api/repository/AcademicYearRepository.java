package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    Optional<AcademicYear> findByCode(String code);
    boolean existsByCode(String code);
    @Query("""
            select academicYear
            from AcademicYear academicYear
            order by academicYear.startDate asc
            """)
    List<AcademicYear> findAllAcademicYears();

    @Query("""
            select academicYear
            from AcademicYear academicYear
            where academicYear.active = true
              and academicYear.isPublished = true
            order by academicYear.startDate
            """)
    List<AcademicYear> findAllPublishedActiveOrderByStartDateAsc();
}
