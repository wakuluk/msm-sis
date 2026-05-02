package com.msm.sis.api.service.academic;


import com.msm.sis.api.dto.academic.term.CreateAcademicSubTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearSubTermRequest;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.validateMaxLength;

@Service
public class AcademicValidationService {

    private final AcademicYearRepository academicYearRepository;
    private final AcademicSubTermRepository academicSubTermRepository;
    private final AcademicTermRepository academicTermRepository;

    public AcademicValidationService(
            AcademicYearRepository academicYearRepository,
            AcademicSubTermRepository academicSubTermRepository,
            AcademicTermRepository academicTermRepository
    ) {
        this.academicYearRepository = academicYearRepository;
        this.academicSubTermRepository = academicSubTermRepository;
        this.academicTermRepository = academicTermRepository;
    }

    public void validateCreateAcademicYear(AcademicYear academicYear) {
        validateAcademicYearFields(academicYear);

        if (academicYearRepository.existsByCode(academicYear.getCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year code already exists.");
        }
    }

    public void validatePatchAcademicYear(
            AcademicYear existingAcademicYear,
            AcademicYear candidateAcademicYear
    ) {
        validateAcademicYearFields(candidateAcademicYear);

        String existingCode = trimToNull(existingAcademicYear.getCode());
        String candidateCode = trimToNull(candidateAcademicYear.getCode());
        if (!Objects.equals(existingCode, candidateCode)
                && academicYearRepository.existsByCode(candidateCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year code already exists.");
        }
    }

    public void validatePatchAcademicSubTerm(
            AcademicSubTerm existingAcademicSubTerm,
            AcademicSubTerm candidateAcademicSubTerm
    ) {
        AcademicYear academicYear = existingAcademicSubTerm.getAcademicYear();

        validateAcademicSubTermFieldsWithoutUniqueness(
                academicYear,
                candidateAcademicSubTerm.getCode(),
                candidateAcademicSubTerm.getName(),
                candidateAcademicSubTerm.getStartDate(),
                candidateAcademicSubTerm.getEndDate(),
                candidateAcademicSubTerm.getSortOrder()
        );

        if (academicYear == null || academicYear.getId() == null) {
            return;
        }

        Long academicYearId = academicYear.getId();
        String existingCode = trimToNull(existingAcademicSubTerm.getCode());
        String candidateCode = trimToNull(candidateAcademicSubTerm.getCode());
        Integer existingSortOrder = existingAcademicSubTerm.getSortOrder();
        Integer candidateSortOrder = candidateAcademicSubTerm.getSortOrder();

        if (!Objects.equals(existingCode, candidateCode)
                && academicSubTermRepository.existsByAcademicYear_IdAndCode(academicYearId, candidateCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term code must be unique within an academic year."
            );
        }

        if (!Objects.equals(existingSortOrder, candidateSortOrder)
                && academicSubTermRepository.existsByAcademicYear_IdAndSortOrder(
                        academicYearId,
                        candidateSortOrder
                )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term sort order must be unique within an academic year."
            );
        }
    }

    public void validateCreateAcademicTerm(
            AcademicYear academicYear,
            AcademicTerm academicTerm,
            List<Long> subTermIds,
            List<AcademicSubTerm> academicSubTerms
    ) {
        validateAcademicTermFields(
                academicYear,
                academicTerm.getCode(),
                academicTerm.getName(),
                academicTerm.getStartDate(),
                academicTerm.getEndDate()
        );

        if (academicYear.getId() != null
                && academicTermRepository.existsByAcademicYear_IdAndCode(
                        academicYear.getId(),
                        trimToNull(academicTerm.getCode())
                )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term code must be unique within an academic year."
            );
        }

        validateAcademicTermSubTerms(academicYear, academicTerm, subTermIds, academicSubTerms, null);
    }

    public void validatePatchAcademicTerm(
            AcademicTerm existingAcademicTerm,
            AcademicTerm candidateAcademicTerm,
            List<Long> subTermIds,
            List<AcademicSubTerm> academicSubTerms
    ) {
        AcademicYear academicYear = existingAcademicTerm.getAcademicYear();

        validateAcademicTermFields(
                academicYear,
                candidateAcademicTerm.getCode(),
                candidateAcademicTerm.getName(),
                candidateAcademicTerm.getStartDate(),
                candidateAcademicTerm.getEndDate()
        );

        String existingCode = trimToNull(existingAcademicTerm.getCode());
        String candidateCode = trimToNull(candidateAcademicTerm.getCode());
        if (!Objects.equals(existingCode, candidateCode)
                && academicTermRepository.existsByAcademicYear_IdAndCode(academicYear.getId(), candidateCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term code must be unique within an academic year."
            );
        }

        validateAcademicTermSubTerms(
                academicYear,
                candidateAcademicTerm,
                subTermIds,
                academicSubTerms,
                existingAcademicTerm.getId()
        );
    }

    public void validateAcademicSubTermWithinContainingTerm(
            AcademicTerm academicTerm,
            AcademicSubTerm academicSubTerm
    ) {
        if (academicTerm == null || academicSubTerm == null) {
            return;
        }

        if (academicSubTerm.getStartDate().isBefore(academicTerm.getStartDate())
                || academicSubTerm.getEndDate().isAfter(academicTerm.getEndDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term dates must fall within the academic term date range."
            );
        }
    }

    public void validatePatchedAcademicSubTerms(
            AcademicYear academicYear,
            List<AcademicSubTerm> academicSubTerms
    ) {
        if (academicSubTerms == null || academicSubTerms.isEmpty()) {
            return;
        }

        Set<String> subTermCodes = new HashSet<>();
        Set<Integer> sortOrders = new HashSet<>();

        for (AcademicSubTerm academicSubTerm : academicSubTerms) {
            validateAcademicSubTermFields(
                    academicYear,
                    academicSubTerm.getCode(),
                    academicSubTerm.getName(),
                    academicSubTerm.getStartDate(),
                    academicSubTerm.getEndDate(),
                    academicSubTerm.getSortOrder()
            );

            String normalizedCode = trimToNull(academicSubTerm.getCode());
            if (!subTermCodes.add(normalizedCode)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term code must be unique within an academic year."
                );
            }

            if (!sortOrders.add(academicSubTerm.getSortOrder())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term sort order must be unique within an academic year."
                );
            }
        }
    }

    private void validateAcademicYearFields(AcademicYear academicYear) {
        if (trimToNull(academicYear.getCode()) == null || trimToNull(academicYear.getName()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year code and name are required.");
        }

        validateMaxLength(academicYear.getCode(), 20, "Academic year code");
        validateMaxLength(academicYear.getName(), 100, "Academic year name");
        validateDateRange(academicYear.getStartDate(), academicYear.getEndDate(), "Academic year");
    }

    public void validateCreateAcademicSubTerms(
            AcademicYear academicYear,
            List<CreateAcademicYearSubTermRequest> createAcademicSubTermRequestList
    ) {
        if (createAcademicSubTermRequestList == null || createAcademicSubTermRequestList.isEmpty()) {
            return;
        }

        Set<String> subTermCodes = new HashSet<>();
        Set<Integer> sortOrders = new HashSet<>();
        for (CreateAcademicYearSubTermRequest request : createAcademicSubTermRequestList) {
            validateCreateAcademicSubTerm(academicYear, request);

            String code = trimToNull(request.code());
            if (!subTermCodes.add(code)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term code must be unique within an academic year."
                );
            }

            if (!sortOrders.add(request.sortOrder())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term sort order must be unique within an academic year."
                );
            }
        }
    }

    public void validateCreateAcademicSubTerms(
            AcademicYear academicYear,
            Long academicYearId,
            List<CreateAcademicSubTermRequest> createAcademicSubTermRequestList
    ) {
        if (createAcademicSubTermRequestList == null || createAcademicSubTermRequestList.isEmpty()) {
            return;
        }

        Set<String> subTermCodes = new HashSet<>();
        Set<Integer> sortOrders = new HashSet<>();
        for (CreateAcademicSubTermRequest request : createAcademicSubTermRequestList) {
            if (!academicYearId.equals(request.academicYearId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic year ID in the request does not match the target academic year."
                );
            }

            validateCreateAcademicSubTerm(academicYear, request);

            String code = trimToNull(request.code());
            if (!subTermCodes.add(code)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term code must be unique within an academic year."
                );
            }

            if (!sortOrders.add(request.sortOrder())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term sort order must be unique within an academic year."
                );
            }
        }
    }

    public void validateCreateAcademicSubTerm(
            AcademicYear academicYear,
            CreateAcademicYearSubTermRequest createAcademicSubTermRequest
    ) {
        validateAcademicSubTermFields(
                academicYear,
                createAcademicSubTermRequest.code(),
                createAcademicSubTermRequest.name(),
                createAcademicSubTermRequest.startDate(),
                createAcademicSubTermRequest.endDate(),
                createAcademicSubTermRequest.sortOrder()
        );
    }

    public void validateCreateAcademicSubTerm(
            AcademicYear academicYear,
            CreateAcademicSubTermRequest createAcademicSubTermRequest
    ) {
        validateAcademicSubTermFields(
                academicYear,
                createAcademicSubTermRequest.code(),
                createAcademicSubTermRequest.name(),
                createAcademicSubTermRequest.startDate(),
                createAcademicSubTermRequest.endDate(),
                createAcademicSubTermRequest.sortOrder()
        );
    }

    private void validateAcademicSubTermFields(
            AcademicYear academicYear,
            String code,
            String name,
            LocalDate startDate,
            LocalDate endDate,
            Integer sortOrder
    ) {
        validateAcademicSubTermFieldsWithoutUniqueness(
                academicYear,
                code,
                name,
                startDate,
                endDate,
                sortOrder
        );

        if (academicYear.getId() != null) {
            String normalizedCode = trimToNull(code);

            if (academicSubTermRepository.existsByAcademicYear_IdAndCode(academicYear.getId(), normalizedCode)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term code must be unique within an academic year."
                );
            }

            if (academicSubTermRepository.existsByAcademicYear_IdAndSortOrder(
                    academicYear.getId(),
                    sortOrder
            )) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic sub term sort order must be unique within an academic year."
                );
            }
        }
    }

    private void validateAcademicSubTermFieldsWithoutUniqueness(
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
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term code and name are required."
            );
        }

        if (sortOrder == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term sort order is required."
            );
        }

        validateMaxLength(normalizedCode, 20, "Academic sub term code");
        validateMaxLength(normalizedName, 100, "Academic sub term name");
        validateDateRange(startDate, endDate, "Academic sub term");

        if (academicYear.getStartDate() == null || academicYear.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year dates are required.");
        }

        if (startDate.isBefore(academicYear.getStartDate()) || endDate.isAfter(academicYear.getEndDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term dates must fall within the academic year date range."
            );
        }
    }

    private void validateAcademicTermFields(
            AcademicYear academicYear,
            String code,
            String name,
            LocalDate startDate,
            LocalDate endDate
    ) {
        String normalizedCode = trimToNull(code);
        String normalizedName = trimToNull(name);

        if (normalizedCode == null || normalizedName == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term code and name are required."
            );
        }

        validateMaxLength(normalizedCode, 20, "Academic term code");
        validateMaxLength(normalizedName, 100, "Academic term name");
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
    }

    private void validateAcademicTermSubTerms(
            AcademicYear academicYear,
            AcademicTerm academicTerm,
            List<Long> subTermIds,
            List<AcademicSubTerm> academicSubTerms,
            Long currentTermId
    ) {
        if (subTermIds == null || subTermIds.isEmpty()) {
            return;
        }

        Set<Long> uniqueSubTermIds = new HashSet<>(subTermIds);
        if (uniqueSubTermIds.size() != subTermIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term IDs must be unique within an academic term."
            );
        }

        if (academicSubTerms.size() != subTermIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "All academic sub terms in an academic term must exist."
            );
        }

        for (AcademicSubTerm academicSubTerm : academicSubTerms) {
            if (academicSubTerm.getAcademicYear() == null
                    || academicSubTerm.getAcademicYear().getId() == null
                    || !Objects.equals(academicSubTerm.getAcademicYear().getId(), academicYear.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term sub terms must belong to the target academic year."
                );
            }

            validateAcademicSubTermWithinContainingTerm(academicTerm, academicSubTerm);
        }

        List<AcademicTerm> existingAcademicTerms = academicTermRepository
                .findDistinctByAcademicSubTerms_IdIn(subTermIds);

        boolean assignedToAnotherTerm = existingAcademicTerms.stream()
                .anyMatch(term -> !Objects.equals(term.getId(), currentTermId));

        if (assignedToAnotherTerm) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "One or more academic sub terms are already assigned to another academic term."
            );
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
