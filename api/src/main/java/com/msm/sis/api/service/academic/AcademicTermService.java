package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.service.academic.AcademicYearService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service

public class AcademicTermService {

    private final AcademicValidationService academicValidationService;
    private final AcademicYearRepository academicYearRepository;
    public AcademicTermService(AcademicValidationService academicValidationService,   AcademicYearRepository academicYearRepository) {
        this.academicValidationService = academicValidationService;
        this.academicYearRepository = academicYearRepository;
    }

    public List<AcademicTermResponse> createAcademicTerms(
            Long academicYearId,
            List<CreateAcademicTermRequest> createAcademicTermRequestList)
    {

        //get academic year fo

//        //check yearId
//        List<AcademicTermResponse> academicTermResponseList =
//                createAcademicTermRequestList.stream()
//                        .map(createAcademicTermRequest -> createAcademicTerm(academicYear, createAcademicTermRequest))
//                        .toList();
        return null;
    }

    public List<AcademicTermResponse> createAcademicTerms(
            AcademicYear academicYear,
            List<CreateAcademicYearTermRequest> createAcademicTermRequestList)
    {
        List<AcademicTermResponse> academicTermResponseList =
                createAcademicTermRequestList.stream()
                        .map(createAcademicTermRequest -> createAcademicTerm(academicYear, createAcademicTermRequest))
                        .toList();
        return null;
    }

    public AcademicTermResponse createAcademicTerm(
            AcademicYear academicYear,
            CreateAcademicYearTermRequest createAcademicTermRequest
    ){
        // call academicValidationService using academic year / createAcademicTermRequest
        return null;
    }

    public AcademicTermResponse createAcademicTerm(AcademicYear academicYear, CreateAcademicTermRequest createAcademicTermRequest){
        //call academicValidationService using academic year / createAcademicTermRequest
        return null;
    }
}
