package com.msm.sis.api.service.academic;

import com.msm.sis.api.dto.academic.term.AcademicTermResponse;
import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermStatus;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.mapper.AcademicYearMapper;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicTermStatusRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class AcademicTermService {
    private static final String PLANNED_TERM_STATUS_CODE = "PLANNED";

    private final AcademicValidationService academicValidationService;
    private final AcademicTermRepository academicTermRepository;
    private final AcademicTermStatusRepository academicTermStatusRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AcademicYearMapper academicYearMapper;

    public AcademicTermService(
            AcademicValidationService academicValidationService,
            AcademicTermRepository academicTermRepository,
            AcademicTermStatusRepository academicTermStatusRepository,
            AcademicYearRepository academicYearRepository,
            AcademicYearMapper academicYearMapper
    ) {
        this.academicValidationService = academicValidationService;
        this.academicTermRepository = academicTermRepository;
        this.academicTermStatusRepository = academicTermStatusRepository;
        this.academicYearRepository = academicYearRepository;
        this.academicYearMapper = academicYearMapper;
    }

    @Transactional
    public List<AcademicTermResponse> createAcademicTerms(
            Long academicYearId,
            List<CreateAcademicTermRequest> createAcademicTermRequestList)
    {
        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (createAcademicTermRequestList == null || createAcademicTermRequestList.isEmpty()) {
            return List.of();
        }

        academicValidationService.validateCreateAcademicTerms(
                academicYear,
                academicYearId,
                createAcademicTermRequestList
        );

        return createAcademicTermRequestList.stream()
                .map(createAcademicTermRequest -> saveAcademicTerm(academicYear, createAcademicTermRequest))
                .toList();
    }

    @Transactional
    public List<AcademicTermResponse> createAcademicTerms(
            AcademicYear academicYear,
            List<CreateAcademicYearTermRequest> createAcademicTermRequestList)
    {
        if (createAcademicTermRequestList == null || createAcademicTermRequestList.isEmpty()) {
            return List.of();
        }

        academicValidationService.validateCreateAcademicTerms(academicYear, createAcademicTermRequestList);

        return createAcademicTermRequestList.stream()
                .map(createAcademicTermRequest -> saveAcademicYearTerm(academicYear, createAcademicTermRequest))
                .toList();
    }

    @Transactional
    public AcademicTermResponse createAcademicTerm(
            AcademicYear academicYear,
            CreateAcademicYearTermRequest createAcademicTermRequest
    ){
        academicValidationService.validateCreateAcademicTerm(academicYear, createAcademicTermRequest);
        return saveAcademicYearTerm(academicYear, createAcademicTermRequest);
    }

    @Transactional
    public AcademicTermResponse createAcademicTerm(AcademicYear academicYear, CreateAcademicTermRequest createAcademicTermRequest){
        if (academicYear.getId() == null || !academicYear.getId().equals(createAcademicTermRequest.academicYearId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic year ID in the request does not match the target academic year."
            );
        }

        academicValidationService.validateCreateAcademicTerm(academicYear, createAcademicTermRequest);
        return saveAcademicTerm(academicYear, createAcademicTermRequest);
    }

    private AcademicTermResponse saveAcademicYearTerm(
            AcademicYear academicYear,
            CreateAcademicYearTermRequest createAcademicTermRequest
    ) {
        AcademicTermStatus termStatus = getPlannedTermStatus();
        AcademicTerm academicTerm = academicYearMapper.fromCreateAcademicYearTermRequest(
                academicYear,
                termStatus,
                createAcademicTermRequest
        );
        AcademicTerm savedAcademicTerm = academicTermRepository.save(academicTerm);
        return academicYearMapper.toAcademicTermResponse(savedAcademicTerm);
    }

    private AcademicTermResponse saveAcademicTerm(
            AcademicYear academicYear,
            CreateAcademicTermRequest createAcademicTermRequest
    ) {
        AcademicTermStatus termStatus = getPlannedTermStatus();
        AcademicTerm academicTerm = academicYearMapper.fromCreateAcademicTermRequest(
                academicYear,
                termStatus,
                createAcademicTermRequest
        );
        AcademicTerm savedAcademicTerm = academicTermRepository.save(academicTerm);
        return academicYearMapper.toAcademicTermResponse(savedAcademicTerm);
    }

    private AcademicTermStatus getPlannedTermStatus() {
        return academicTermStatusRepository.findByCode(trimToNull(PLANNED_TERM_STATUS_CODE))
                .filter(AcademicTermStatus::isActive)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term status 'PLANNED' must exist and be active."
                ));
    }
}
