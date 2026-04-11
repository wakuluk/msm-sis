package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.year.AcademicYearResponse;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearRequest;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.repository.AcademicYearRepository;
import org.springframework.stereotype.Service;

@Service
public class AcademicYearService {

    private final AcademicYearRepository academicYearRepository;
    private final AcademicValidationService academicValidationService;

    private final AcademicTermService academicTermService;

    public AcademicYearService(AcademicTermService academicTermService, AcademicYearRepository academicYearRepository, AcademicValidationService academicValidationService) {
        this.academicTermService = academicTermService;
        this.academicYearRepository = academicYearRepository;
        this.academicValidationService = academicValidationService;
    }

    public AcademicYearResponse createAcademicYear(CreateAcademicYearRequest createAcademicYearRequest){
        //validate business logic in academic and create new academic year
        AcademicYear academicYear = new AcademicYear();
        academicTermService.createAcademicTerms(academicYear, createAcademicYearRequest.terms());
        return null;
    }

    public AcademicYear getAcademicYear(Long id){
        return null;
    }
}
