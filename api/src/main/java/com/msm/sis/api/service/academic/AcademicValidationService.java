package com.msm.sis.api.service.academic;


import com.msm.sis.api.dto.academic.term.CreateAcademicTermRequest;
import com.msm.sis.api.dto.academic.year.CreateAcademicYearTermRequest;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicTermGroup;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.repository.AcademicTermGroupRepository;
import com.msm.sis.api.repository.AcademicTermRepository;
import com.msm.sis.api.repository.AcademicYearRepository;
import com.msm.sis.api.validation.ValidationUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
public class AcademicValidationService {

    private final AcademicYearRepository academicYearRepository;
    private final AcademicTermRepository academicTermRepository;
    private final AcademicTermGroupRepository academicTermGroupRepository;

    public AcademicValidationService(
            AcademicYearRepository academicYearRepository,
            AcademicTermRepository academicTermRepository,
            AcademicTermGroupRepository academicTermGroupRepository
    ) {
        this.academicYearRepository = academicYearRepository;
        this.academicTermRepository = academicTermRepository;
        this.academicTermGroupRepository = academicTermGroupRepository;
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

    public void validatePatchAcademicTerm(
            AcademicTerm existingAcademicTerm,
            AcademicTerm candidateAcademicTerm
    ) {
        AcademicYear academicYear = existingAcademicTerm.getAcademicYear();

        validateAcademicTermFieldsWithoutUniqueness(
                academicYear,
                candidateAcademicTerm.getCode(),
                candidateAcademicTerm.getName(),
                candidateAcademicTerm.getStartDate(),
                candidateAcademicTerm.getEndDate(),
                candidateAcademicTerm.getSortOrder()
        );

        if (academicYear == null || academicYear.getId() == null) {
            return;
        }

        Long academicYearId = academicYear.getId();
        String existingCode = trimToNull(existingAcademicTerm.getCode());
        String candidateCode = trimToNull(candidateAcademicTerm.getCode());
        Integer existingSortOrder = existingAcademicTerm.getSortOrder();
        Integer candidateSortOrder = candidateAcademicTerm.getSortOrder();

        if (!Objects.equals(existingCode, candidateCode)
                && academicTermRepository.existsByAcademicYear_IdAndCode(academicYearId, candidateCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term code must be unique within an academic year."
            );
        }

        if (!Objects.equals(existingSortOrder, candidateSortOrder)
                && academicTermRepository.existsByAcademicYear_IdAndSortOrder(academicYearId, candidateSortOrder)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term sort order must be unique within an academic year."
            );
        }
    }

    public void validateCreateAcademicTermGroup(
            AcademicYear academicYear,
            AcademicTermGroup academicTermGroup,
            List<Long> termIds,
            List<AcademicTerm> academicTerms
    ) {
        validateAcademicTermGroupFields(
                academicYear,
                academicTermGroup.getCode(),
                academicTermGroup.getName(),
                academicTermGroup.getStartDate(),
                academicTermGroup.getEndDate()
        );

        if (academicYear.getId() != null
                && academicTermGroupRepository.existsByAcademicYear_IdAndCode(
                        academicYear.getId(),
                        trimToNull(academicTermGroup.getCode())
                )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term group code must be unique within an academic year."
            );
        }

        validateAcademicTermGroupTerms(academicYear, academicTermGroup, termIds, academicTerms, null);
    }

    public void validatePatchAcademicTermGroup(
            AcademicTermGroup existingAcademicTermGroup,
            AcademicTermGroup candidateAcademicTermGroup,
            List<Long> termIds,
            List<AcademicTerm> academicTerms
    ) {
        AcademicYear academicYear = existingAcademicTermGroup.getAcademicYear();

        validateAcademicTermGroupFields(
                academicYear,
                candidateAcademicTermGroup.getCode(),
                candidateAcademicTermGroup.getName(),
                candidateAcademicTermGroup.getStartDate(),
                candidateAcademicTermGroup.getEndDate()
        );

        String existingCode = trimToNull(existingAcademicTermGroup.getCode());
        String candidateCode = trimToNull(candidateAcademicTermGroup.getCode());
        if (!Objects.equals(existingCode, candidateCode)
                && academicTermGroupRepository.existsByAcademicYear_IdAndCode(academicYear.getId(), candidateCode)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term group code must be unique within an academic year."
            );
        }

        validateAcademicTermGroupTerms(
                academicYear,
                candidateAcademicTermGroup,
                termIds,
                academicTerms,
                existingAcademicTermGroup.getId()
        );
    }

    public void validateAcademicTermWithinContainingGroup(
            AcademicTermGroup academicTermGroup,
            AcademicTerm academicTerm
    ) {
        if (academicTermGroup == null || academicTerm == null) {
            return;
        }

        if (academicTerm.getStartDate().isBefore(academicTermGroup.getStartDate())
                || academicTerm.getEndDate().isAfter(academicTermGroup.getEndDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term dates must fall within the academic term group date range."
            );
        }
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
        validateAcademicTermFieldsWithoutUniqueness(
                academicYear,
                code,
                name,
                startDate,
                endDate,
                sortOrder
        );

        if (academicYear.getId() != null) {
            String normalizedCode = trimToNull(code);

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

    private void validateAcademicTermFieldsWithoutUniqueness(
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
    }

    private void validateAcademicTermGroupFields(
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
                    "Academic term group code and name are required."
            );
        }

        ValidationUtils.validateMaxLength(normalizedCode, 20, "Academic term group code");
        ValidationUtils.validateMaxLength(normalizedName, 100, "Academic term group name");
        validateDateRange(startDate, endDate, "Academic term group");

        if (academicYear.getStartDate() == null || academicYear.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Academic year dates are required.");
        }

        if (startDate.isBefore(academicYear.getStartDate()) || endDate.isAfter(academicYear.getEndDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term group dates must fall within the academic year date range."
            );
        }
    }

    private void validateAcademicTermGroupTerms(
            AcademicYear academicYear,
            AcademicTermGroup academicTermGroup,
            List<Long> termIds,
            List<AcademicTerm> academicTerms,
            Long currentTermGroupId
    ) {
        if (termIds == null || termIds.isEmpty()) {
            return;
        }

        Set<Long> uniqueTermIds = new HashSet<>(termIds);
        if (uniqueTermIds.size() != termIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic term IDs must be unique within an academic term group."
            );
        }

        if (academicTerms.size() != termIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "All academic terms in an academic term group must exist."
            );
        }

        for (AcademicTerm academicTerm : academicTerms) {
            if (academicTerm.getAcademicYear() == null
                    || academicTerm.getAcademicYear().getId() == null
                    || !Objects.equals(academicTerm.getAcademicYear().getId(), academicYear.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Academic term group terms must belong to the target academic year."
                );
            }

            validateAcademicTermWithinContainingGroup(academicTermGroup, academicTerm);
        }

        List<AcademicTermGroup> existingAcademicTermGroups = academicTermGroupRepository
                .findDistinctByAcademicTerms_IdIn(termIds);

        boolean assignedToAnotherGroup = existingAcademicTermGroups.stream()
                .anyMatch(group -> !Objects.equals(group.getId(), currentTermGroupId));

        if (assignedToAnotherGroup) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "One or more academic terms are already assigned to another academic term group."
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
