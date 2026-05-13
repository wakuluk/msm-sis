package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupAcademicYearOptionResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupReferenceOptionsResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupTermOptionResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.AthleticSport;
import com.msm.sis.api.mapper.ReferenceDataMapper;
import com.msm.sis.api.repository.AcademicDivisionRepository;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.repository.AthleticSportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RegistrationGroupReferenceDataService {
    private final AcademicYearRepository academicYearRepository;
    private final AcademicTermRepository academicTermRepository;
    private final AcademicDivisionRepository academicDivisionRepository;
    private final AthleticSportRepository athleticSportRepository;
    private final ReferenceDataMapper referenceDataMapper;

    @Transactional(readOnly = true)
    public RegistrationGroupReferenceOptionsResponse getReferenceOptions() {
        return new RegistrationGroupReferenceOptionsResponse(
                academicYearRepository.findAllAcademicYears().stream()
                        .map(this::toAcademicYearOption)
                        .toList(),
                academicDivisionRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                        .map(referenceDataMapper::toCodeNameReferenceOptionResponse)
                        .toList(),
                athleticSportRepository.findActiveForSelection().stream()
                        .map(this::toAthleticSportOption)
                        .toList(),
                RegistrationGroupStatusSupport.statusOptions()
        );
    }

    private RegistrationGroupAcademicYearOptionResponse toAcademicYearOption(AcademicYear academicYear) {
        return new RegistrationGroupAcademicYearOptionResponse(
                academicYear.getId(),
                academicYear.getCode(),
                academicYear.getName(),
                academicYear.getStartDate(),
                academicYear.getEndDate(),
                academicTermRepository.findAllByAcademicYear_IdOrderByStartDateAsc(academicYear.getId()).stream()
                        .map(this::toTermOption)
                        .toList()
        );
    }

    private RegistrationGroupTermOptionResponse toTermOption(AcademicTerm term) {
        return new RegistrationGroupTermOptionResponse(
                term.getId(),
                term.getCode(),
                term.getName(),
                term.getStartDate(),
                term.getEndDate()
        );
    }

    private CodeNameReferenceOptionResponse toAthleticSportOption(AthleticSport athleticSport) {
        return new CodeNameReferenceOptionResponse(
                athleticSport.getId(),
                athleticSport.getCode(),
                athleticSport.getName()
        );
    }
}
