package com.msm.sis.api.service.transfer;

import com.msm.sis.api.dto.transfer.TransferRequestMappingComparisonCourseResponse;
import com.msm.sis.api.dto.transfer.TransferRequestMappingComparisonOutcomeResponse;
import com.msm.sis.api.dto.transfer.TransferRequestMappingComparisonResponse;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.Requirement;
import com.msm.sis.api.entity.TransferCourseEquivalency;
import com.msm.sis.api.entity.TransferCourseEquivalencyOutcome;
import com.msm.sis.api.entity.TransferInstitution;
import com.msm.sis.api.entity.TransferRequest;
import com.msm.sis.api.entity.TransferRequestCourse;
import com.msm.sis.api.entity.TransferRequestOutcome;
import com.msm.sis.api.repository.TransferCourseEquivalencyOutcomeRepository;
import com.msm.sis.api.repository.TransferCourseEquivalencyRepository;
import com.msm.sis.api.repository.TransferRequestCourseRepository;
import com.msm.sis.api.repository.TransferRequestOutcomeRepository;
import com.msm.sis.api.repository.TransferRequestRepository;
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
public class TransferRequestMappingComparisonService {

    private final TransferCourseEquivalencyOutcomeRepository transferCourseEquivalencyOutcomeRepository;
    private final TransferCourseEquivalencyRepository transferCourseEquivalencyRepository;
    private final TransferRequestCourseRepository transferRequestCourseRepository;
    private final TransferRequestOutcomeRepository transferRequestOutcomeRepository;
    private final TransferRequestRepository transferRequestRepository;

    @Transactional(readOnly = true)
    public TransferRequestMappingComparisonResponse compare(Long transferRequestId) {
        requirePositiveId(transferRequestId, "Transfer request id");

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));
        TransferRequestCourse requestCourse = transferRequestCourseRepository
                .findByTransferRequestIdOrderBySortOrderAscIdAsc(transferRequestId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer request course was not found."
                ));
        TransferInstitution institution = transferRequest.getTransferInstitution();

        TransferCourseEquivalency previousEquivalency = null;
        List<TransferRequestMappingComparisonOutcomeResponse> previousOutcomes = List.of();
        if (institution != null) {
            String externalSubjectCode = trimToNull(requestCourse.getExternalSubjectCode());
            String externalCourseNumber = trimToNull(requestCourse.getExternalCourseNumber());
            if (externalSubjectCode != null && externalCourseNumber != null) {
                previousEquivalency = transferCourseEquivalencyRepository
                        .findFirstByTransferInstitution_IdAndExternalSubjectCodeAndExternalCourseNumberAndActiveTrueOrderByIdDesc(
                                institution.getId(),
                                externalSubjectCode,
                                externalCourseNumber
                        )
                        .orElse(null);
                if (previousEquivalency != null) {
                    previousOutcomes = transferCourseEquivalencyOutcomeRepository
                            .findByEquivalencyIdOrderBySortOrderAscIdAsc(previousEquivalency.getId())
                            .stream()
                            .map(this::mapSavedOutcome)
                            .toList();
                }
            }
        }

        List<TransferRequestMappingComparisonOutcomeResponse> proposedOutcomes = transferRequestOutcomeRepository
                .findByTransferRequestCourseIdOrderByIdAsc(requestCourse.getId())
                .stream()
                .map(this::mapRequestOutcome)
                .toList();

        return new TransferRequestMappingComparisonResponse(
                transferRequest.getId(),
                institution == null ? null : institution.getId(),
                institution == null ? null : institution.getName(),
                previousEquivalency == null ? null : previousEquivalency.getId(),
                new TransferRequestMappingComparisonCourseResponse(
                        requestCourse.getId(),
                        requestCourse.getExternalSubjectCode(),
                        requestCourse.getExternalCourseNumber(),
                        requestCourse.getExternalCourseTitle(),
                        requestCourse.getExternalCourseDescription(),
                        requestCourse.getRequestedCredits()
                ),
                previousOutcomes,
                proposedOutcomes
        );
    }

    private TransferRequestMappingComparisonOutcomeResponse mapSavedOutcome(TransferCourseEquivalencyOutcome outcome) {
        return mapOutcome(
                outcome.getOutcomeType(),
                outcome.getLocalCourse(),
                outcome.getRequirement(),
                outcome.getProgramVersionRequirement() == null ? null : outcome.getProgramVersionRequirement().getRequirement(),
                outcome.getProgramVersionRequirement() == null ? null : outcome.getProgramVersionRequirement().getId(),
                outcome.getAcceptedCredits(),
                outcome.getNotes()
        );
    }

    private TransferRequestMappingComparisonOutcomeResponse mapRequestOutcome(TransferRequestOutcome outcome) {
        return mapOutcome(
                outcome.getOutcomeType(),
                outcome.getLocalCourse(),
                outcome.getRequirement(),
                outcome.getProgramVersionRequirement() == null ? null : outcome.getProgramVersionRequirement().getRequirement(),
                outcome.getProgramVersionRequirement() == null ? null : outcome.getProgramVersionRequirement().getId(),
                outcome.getAcceptedCredits(),
                outcome.getNotes()
        );
    }

    private TransferRequestMappingComparisonOutcomeResponse mapOutcome(
            String outcomeType,
            Course localCourse,
            Requirement directRequirement,
            Requirement programVersionRequirement,
            Long programVersionRequirementId,
            java.math.BigDecimal acceptedCredits,
            String notes
    ) {
        Requirement effectiveRequirement = directRequirement == null ? programVersionRequirement : directRequirement;

        return new TransferRequestMappingComparisonOutcomeResponse(
                outcomeType,
                localCourse == null ? null : localCourse.getId(),
                localCourse == null ? null : localCourse.getSubject().getCode() + " " + localCourse.getCourseNumber(),
                effectiveRequirement == null ? null : effectiveRequirement.getId(),
                effectiveRequirement == null ? null : effectiveRequirement.getCode(),
                effectiveRequirement == null ? null : effectiveRequirement.getName(),
                programVersionRequirementId,
                acceptedCredits,
                notes
        );
    }
}
