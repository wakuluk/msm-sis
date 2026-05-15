package com.msm.sis.api.service.transfer;

import com.msm.sis.api.dto.transfer.TransferCourseEquivalencyDetailResponse;
import com.msm.sis.api.dto.transfer.TransferCourseEquivalencyOutcomeResponse;
import com.msm.sis.api.dto.transfer.TransferCourseEquivalencySummaryResponse;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.TransferCourseEquivalency;
import com.msm.sis.api.entity.TransferCourseEquivalencyOutcome;
import com.msm.sis.api.repository.TransferCourseEquivalencyOutcomeRepository;
import com.msm.sis.api.repository.TransferCourseEquivalencyRepository;
import com.msm.sis.api.repository.TransferInstitutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class TransferCourseEquivalencyService {

    private final TransferCourseEquivalencyOutcomeRepository transferCourseEquivalencyOutcomeRepository;
    private final TransferCourseEquivalencyRepository transferCourseEquivalencyRepository;
    private final TransferInstitutionRepository transferInstitutionRepository;

    @Transactional(readOnly = true)
    public List<TransferCourseEquivalencySummaryResponse> listInstitutionEquivalencies(
            Long transferInstitutionId,
            String search
    ) {
        requirePositiveId(transferInstitutionId, "Transfer institution id");
        if (!transferInstitutionRepository.existsById(transferInstitutionId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer institution was not found.");
        }

        String searchPattern = toSearchPattern(search);

        return transferCourseEquivalencyRepository
                .findActiveByInstitutionAndSearch(transferInstitutionId, searchPattern)
                .stream()
                .map(this::mapSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransferCourseEquivalencyDetailResponse getEquivalency(Long transferCourseEquivalencyId) {
        requirePositiveId(transferCourseEquivalencyId, "Transfer course equivalency id");

        TransferCourseEquivalency equivalency = transferCourseEquivalencyRepository
                .findById(transferCourseEquivalencyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer course equivalency was not found."
                ));

        List<TransferCourseEquivalencyOutcomeResponse> outcomes = transferCourseEquivalencyOutcomeRepository
                .findByEquivalencyIdOrderBySortOrderAscIdAsc(equivalency.getId())
                .stream()
                .map(this::mapOutcomeResponse)
                .toList();

        return new TransferCourseEquivalencyDetailResponse(
                equivalency.getId(),
                equivalency.getTransferInstitution().getId(),
                equivalency.getTransferInstitution().getName(),
                equivalency.getExternalSubjectCode(),
                equivalency.getExternalCourseNumber(),
                equivalency.getExternalCourseTitle(),
                equivalency.getExternalCourseDescription(),
                equivalency.getExternalCredits(),
                equivalency.isActive(),
                equivalency.getNotes(),
                outcomes,
                equivalency.getCreatedAt(),
                equivalency.getUpdatedAt()
        );
    }

    private TransferCourseEquivalencySummaryResponse mapSummaryResponse(TransferCourseEquivalency equivalency) {
        return new TransferCourseEquivalencySummaryResponse(
                equivalency.getId(),
                equivalency.getTransferInstitution().getId(),
                equivalency.getExternalSubjectCode(),
                equivalency.getExternalCourseNumber(),
                equivalency.getExternalCourseTitle(),
                equivalency.getExternalCourseDescription(),
                equivalency.getExternalCredits(),
                equivalency.isActive(),
                equivalency.getNotes(),
                equivalency.getUpdatedAt()
        );
    }

    private String toSearchPattern(String search) {
        String normalizedSearch = trimToNull(search);
        return normalizedSearch == null ? null : "%" + normalizedSearch.toLowerCase() + "%";
    }

    private TransferCourseEquivalencyOutcomeResponse mapOutcomeResponse(TransferCourseEquivalencyOutcome outcome) {
        Course localCourse = outcome.getLocalCourse();
        Requirement effectiveRequirement = outcome.getRequirement() == null
                && outcome.getProgramVersionRequirement() != null
                ? outcome.getProgramVersionRequirement().getRequirement()
                : outcome.getRequirement();

        return new TransferCourseEquivalencyOutcomeResponse(
                outcome.getId(),
                outcome.getEquivalency().getId(),
                outcome.getOutcomeType(),
                localCourse == null ? null : localCourse.getId(),
                localCourse == null ? null : localCourse.getSubject().getCode() + " " + localCourse.getCourseNumber(),
                effectiveRequirement == null ? null : effectiveRequirement.getId(),
                effectiveRequirement == null ? null : effectiveRequirement.getCode(),
                effectiveRequirement == null ? null : effectiveRequirement.getName(),
                outcome.getProgramVersionRequirement() == null ? null : outcome.getProgramVersionRequirement().getId(),
                outcome.getAcceptedCredits(),
                outcome.getNotes(),
                outcome.getSortOrder()
        );
    }
}
