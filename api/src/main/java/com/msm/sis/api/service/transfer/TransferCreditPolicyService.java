package com.msm.sis.api.service.transfer;

import com.msm.sis.api.dto.transfer.CloseTransferCreditPolicyRequest;
import com.msm.sis.api.dto.transfer.TransferCreditPolicyListResponse;
import com.msm.sis.api.dto.transfer.TransferCreditPolicyResponse;
import com.msm.sis.api.dto.transfer.UpsertTransferCreditPolicyRequest;
import com.msm.sis.api.entity.TransferCreditPolicy;
import com.msm.sis.api.repository.TransferCreditPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class TransferCreditPolicyService {

    private static final LocalDate OPEN_ENDED_RANGE_DATE = LocalDate.of(9999, 12, 31);

    private final TransferCreditPolicyRepository transferCreditPolicyRepository;

    @Transactional(readOnly = true)
    public TransferCreditPolicyListResponse listPolicies() {
        return new TransferCreditPolicyListResponse(
                transferCreditPolicyRepository.findAllByOrderByEffectiveStartDateDesc()
                        .stream()
                        .map(this::mapPolicyResponse)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public TransferCreditPolicyResponse getEffectivePolicy(LocalDate requestDate) {
        LocalDate effectiveRequestDate = requestDate == null ? LocalDate.now() : requestDate;
        return transferCreditPolicyRepository.findEffectivePolicyForDate(effectiveRequestDate)
                .stream()
                .findFirst()
                .map(this::mapPolicyResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer credit policy was not found for the request date."
                ));
    }

    @Transactional
    public TransferCreditPolicyResponse createPolicy(UpsertTransferCreditPolicyRequest request) {
        requireRequestBody(request);
        validateDateRange(null, request);

        TransferCreditPolicy policy = new TransferCreditPolicy();
        applyPolicyValues(policy, request);
        return mapPolicyResponse(transferCreditPolicyRepository.save(policy));
    }

    @Transactional
    public TransferCreditPolicyResponse updatePolicy(Long policyId, UpsertTransferCreditPolicyRequest request) {
        requirePositiveId(policyId, "Policy id");
        requireRequestBody(request);

        TransferCreditPolicy policy = transferCreditPolicyRepository.findById(policyId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer credit policy was not found."
                ));
        validateDateRange(policy.getId(), request);

        applyPolicyValues(policy, request);
        return mapPolicyResponse(transferCreditPolicyRepository.save(policy));
    }

    @Transactional
    public TransferCreditPolicyResponse updateCurrentOpenEndedPolicy(UpsertTransferCreditPolicyRequest request) {
        requireRequestBody(request);

        TransferCreditPolicy policy = findCurrentOpenEndedPolicy();
        validateDateRange(policy.getId(), request);

        applyPolicyValues(policy, request);
        return mapPolicyResponse(transferCreditPolicyRepository.save(policy));
    }

    @Transactional
    public TransferCreditPolicyResponse closeCurrentOpenEndedPolicy(CloseTransferCreditPolicyRequest request) {
        requireRequestBody(request);

        TransferCreditPolicy policy = findCurrentOpenEndedPolicy();
        if (request.effectiveEndDate().isBefore(policy.getEffectiveStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Effective end date cannot be before the effective start date."
            );
        }

        UpsertTransferCreditPolicyRequest updateRequest = new UpsertTransferCreditPolicyRequest(
                policy.getEffectiveStartDate(),
                request.effectiveEndDate(),
                policy.getMinimumTransferGrade(),
                policy.getFourYearInstitutionCreditThreshold(),
                policy.isRequireTranscriptPdf(),
                policy.getNotes()
        );
        validateDateRange(policy.getId(), updateRequest);
        policy.setEffectiveEndDate(request.effectiveEndDate());

        return mapPolicyResponse(transferCreditPolicyRepository.save(policy));
    }

    private TransferCreditPolicy findCurrentOpenEndedPolicy() {
        return transferCreditPolicyRepository.findFirstByEffectiveEndDateIsNullOrderByEffectiveStartDateDesc()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Open-ended transfer credit policy was not found."
                ));
    }

    private void validateDateRange(Long currentPolicyId, UpsertTransferCreditPolicyRequest request) {
        if (request.effectiveEndDate() != null && request.effectiveEndDate().isBefore(request.effectiveStartDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Effective end date cannot be before the effective start date."
            );
        }

        boolean overlapsExistingPolicy = transferCreditPolicyRepository.findAll().stream()
                .filter(existingPolicy -> currentPolicyId == null || !existingPolicy.getId().equals(currentPolicyId))
                .anyMatch(existingPolicy -> dateRangesOverlap(
                        request.effectiveStartDate(),
                        request.effectiveEndDate(),
                        existingPolicy.getEffectiveStartDate(),
                        existingPolicy.getEffectiveEndDate()
                ));

        if (overlapsExistingPolicy) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Transfer credit policy effective date range overlaps an existing policy."
            );
        }
    }

    private boolean dateRangesOverlap(
            LocalDate firstStart,
            LocalDate firstEnd,
            LocalDate secondStart,
            LocalDate secondEnd
    ) {
        LocalDate effectiveFirstEnd = firstEnd == null ? OPEN_ENDED_RANGE_DATE : firstEnd;
        LocalDate effectiveSecondEnd = secondEnd == null ? OPEN_ENDED_RANGE_DATE : secondEnd;

        return !firstStart.isAfter(effectiveSecondEnd) && !effectiveFirstEnd.isBefore(secondStart);
    }

    private void applyPolicyValues(TransferCreditPolicy policy, UpsertTransferCreditPolicyRequest request) {
        policy.setEffectiveStartDate(request.effectiveStartDate());
        policy.setEffectiveEndDate(request.effectiveEndDate());
        policy.setMinimumTransferGrade(request.minimumTransferGrade().trim());
        policy.setFourYearInstitutionCreditThreshold(request.fourYearInstitutionCreditThreshold());
        policy.setRequireTranscriptPdf(request.requireTranscriptPdf());
        policy.setNotes(trimToNull(request.notes()));
    }

    private TransferCreditPolicyResponse mapPolicyResponse(TransferCreditPolicy policy) {
        return new TransferCreditPolicyResponse(
                policy.getId(),
                policy.getEffectiveStartDate(),
                policy.getEffectiveEndDate(),
                policy.getMinimumTransferGrade(),
                policy.getFourYearInstitutionCreditThreshold(),
                policy.isRequireTranscriptPdf(),
                policy.getNotes(),
                policy.getCreatedAt(),
                policy.getUpdatedAt()
        );
    }
}
