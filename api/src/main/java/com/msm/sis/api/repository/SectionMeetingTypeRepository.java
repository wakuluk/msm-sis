package com.msm.sis.api.repository;

import com.msm.sis.api.entity.SectionMeetingType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SectionMeetingTypeRepository extends JpaRepository<SectionMeetingType, Long> {
    Optional<SectionMeetingType> findByCode(String code);

    List<SectionMeetingType> findAllByActiveTrueOrderBySortOrderAsc();

    List<SectionMeetingType> findAllByActiveTrueOrderByNameAsc();
}
