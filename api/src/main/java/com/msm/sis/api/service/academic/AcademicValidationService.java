package com.msm.sis.api.service.academic;


import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.validation.ValidationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class AcademicValidationService {

    private final AcademicYearRepository academicYearRepository;
    private final AcademicTermRepository academicTermRepository;

    public AcademicValidationService(
            AcademicYearRepository academicYearRepository,
            AcademicTermRepository academicTermRepository
    ) {
        this.academicYearRepository = academicYearRepository;
        this.academicTermRepository = academicTermRepository;
    }

    public void validateCreateAcademicYear(AcademicYear academicYear) {
        validateAcademicYearFields(academicYear);

        if (academicYearRepository.existsByCode(academicYear.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year code already exists.");
        }
    }

    public void validatePatchAcademicYear(AcademicYear academicYear) {
        validateAcademicYearFields(academicYear);

        academicYearRepository.findByCode(academicYear.getCode())
                .filter(existingAcademicYear -> !existingAcademicYear.getId().equals(academicYear.getId()))
                .ifPresent(existingAcademicYear -> {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year code already exists.");
                });
    }

    public void validatePatchedAcademicTerms(
            AcademicYear academicYear,
            List<AcademicTerm> academicTerms
    ) {
        if (academicTerms == null || academicTerms.isEmpty()) {
            return;
        }

        Set<String> termCodes = new HashSet<>();
        Set<Integer> sortOrders = new HashSet<>();

        for (AcademicTerm academicTerm : academicTerms) {
            validateAcademicTermFields(
                    academicYear,
                    academicTerm.getCode(),
                    academicTerm.getName(),
                    academicTerm.getStartDate(),
                    academicTerm.getEndDate(),
                    academicTerm.getSortOrder()
            );

            String normalizedCode = trimToNull(academicTerm.getCode());
            if (!termCodes.add(normalizedCode)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term code must be unique within an academic year."
                );
            }

            if (!sortOrders.add(academicTerm.getSortOrder())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term sort order must be unique within an academic year."
                );
            }
        }
    }

    private void validateAcademicYearFields(AcademicYear academicYear) {
        if (trimToNull(academicYear.getCode()) == null || trimToNull(academicYear.getName()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year code and name are required.");
        }

        ValidationUtils.validateMaxLength(academicYear.getCode(), 20, "Academic year code");
        ValidationUtils.validateMaxLength(academicYear.getName(), 100, "Academic year name");
        validateDateRange(academicYear.getStartDate(), academicYear.getEndDate(), "Academic year");
    }

    public void validateCreateAcademicTerms(
            AcademicYear academicYear,
            List<CreateAcademicYearTermRequest> createAcademicTermRequestList
    ) {
        if (createAcademicTermRequestList == null || createAcademicTermRequestList.isEmpty()) {
            return;
        }

        Set<String> termCodes = new HashSet<>();
        Set<Integer> sortOrders = new HashSet<>();
        for (CreateAcademicYearTermRequest request : createAcademicTermRequestList) {
            validateCreateAcademicTerm(academicYear, request);

            String code = trimToNull(request.code());
            if (!termCodes.add(code)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term code must be unique within an academic year."
                );
            }

            if (!sortOrders.add(request.sortOrder())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term sort order must be unique within an academic year."
                );
            }
        }
    }

    public void validateCreateAcademicTerms(
            AcademicYear academicYear,
            Long academicYearId,
            List<CreateAcademicTermRequest> createAcademicTermRequestList
    ) {
        if (createAcademicTermRequestList == null || createAcademicTermRequestList.isEmpty()) {
            return;
        }

        Set<String> termCodes = new HashSet<>();
        Set<Integer> sortOrders = new HashSet<>();
        for (CreateAcademicTermRequest request : createAcademicTermRequestList) {
            if (!academicYearId.equals(request.academicYearId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic year ID in the request does not match the target academic year."
                );
            }

            validateCreateAcademicTerm(academicYear, request);

            String code = trimToNull(request.code());
            if (!termCodes.add(code)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term code must be unique within an academic year."
                );
            }

            if (!sortOrders.add(request.sortOrder())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term sort order must be unique within an academic year."
                );
            }
        }
    }

    public void validateCreateAcademicTerm(
            AcademicYear academicYear,
            CreateAcademicYearTermRequest createAcademicTermRequest
    ) {
        validateAcademicTermFields(
                academicYear,
                createAcademicTermRequest.code(),
                createAcademicTermRequest.name(),
                createAcademicTermRequest.startDate(),
                createAcademicTermRequest.endDate(),
                createAcademicTermRequest.sortOrder()
        );
    }

    public void validateCreateAcademicTerm(
            AcademicYear academicYear,
            CreateAcademicTermRequest createAcademicTermRequest
    ) {
        validateAcademicTermFields(
                academicYear,
                createAcademicTermRequest.code(),
                createAcademicTermRequest.name(),
                createAcademicTermRequest.startDate(),
                createAcademicTermRequest.endDate(),
                createAcademicTermRequest.sortOrder()
        );
    }

    private void validateAcademicTermFields(
            AcademicYear academicYear,
            String code,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            Integer sortOrder
    ) {
        String normalizedCode = trimToNull(code);
        String normalizedName = trimToNull(name);

        if (normalizedCode == null || normalizedName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic term code and name are required.");
        }

        if (sortOrder == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic term sort order is required.");
        }

        ValidationUtils.validateMaxLength(normalizedCode, 20, "Academic term code");
        ValidationUtils.validateMaxLength(normalizedName, 100, "Academic term name");
        validateDateRange(startDate, endDate, "Academic term");

        if (academicYear.getStartDate() == null || academicYear.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year dates are required.");
        }

        if (startDate.isBefore(academicYear.getStartDate()) || endDate.isAfter(academicYear.getEndDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term dates must fall within the academic year date range."
            );
        }

        if (academicYear.getId() != null) {
            if (academicTermRepository.existsByAcademicYear_IdAndCode(academicYear.getId(), normalizedCode)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term code must be unique within an academic year."
                );
            }

            if (academicTermRepository.existsByAcademicYear_IdAndSortOrder(academicYear.getId(), sortOrder)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term sort order must be unique within an academic year."
                );
            }
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate, String label) {
        if (startDate == null || endDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " start date and end date are required.");
        }

        if (endDate.isBefore(startDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + " end date must be on or after the start date."
            );
        }
    }
}
