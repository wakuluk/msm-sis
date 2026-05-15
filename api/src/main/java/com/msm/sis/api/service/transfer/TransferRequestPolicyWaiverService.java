package com.msm.sis.api.service.transfer;

import com.msm.sis.api.config.AuthenticatedJwt;
import com.msm.sis.api.dto.transfer.TransferRequestPolicyWaiverRequest;
import com.msm.sis.api.dto.transfer.TransferRequestPolicyWaiverResponse;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.TransferRequest;
import com.msm.sis.api.entity.TransferRequestPolicyWaiver;
import com.msm.sis.api.repository.SisUserRepository;
import com.msm.sis.api.repository.TransferRequestPolicyWaiverRepository;
import com.msm.sis.api.repository.TransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class TransferRequestPolicyWaiverService {

    private static final String POLICY_CHECK_MINIMUM_GRADE = "MINIMUM_GRADE";
    private static final String POLICY_CHECK_FOUR_YEAR_INSTITUTION_RULE = "FOUR_YEAR_INSTITUTION_RULE";

    private static final Set<String> ALLOWED_POLICY_CHECK_TYPES = Set.of(
            POLICY_CHECK_MINIMUM_GRADE,
            POLICY_CHECK_FOUR_YEAR_INSTITUTION_RULE
    );

    private final SisUserRepository sisUserRepository;
    private final TransferRequestPolicyWaiverRepository transferRequestPolicyWaiverRepository;
    private final TransferRequestRepository transferRequestRepository;

    @Transactional(readOnly = true)
    public List<TransferRequestPolicyWaiverResponse> listWaivers(Long transferRequestId) {
        requirePositiveId(transferRequestId, "Transfer request id");

        return transferRequestPolicyWaiverRepository.findByTransferRequestIdOrderByPolicyCheckTypeAsc(transferRequestId)
                .stream()
                .map(this::mapPolicyWaiverResponse)
                .toList();
    }

    @Transactional
    public TransferRequestPolicyWaiverResponse upsertWaiver(
            Long transferRequestId,
            TransferRequestPolicyWaiverRequest request,
            AuthenticatedJwt jwt
    ) {
        requirePositiveId(transferRequestId, "Transfer request id");
        requireRequestBody(request);

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));
        String policyCheckType = normalizePolicyCheckType(request.policyCheckType());

        TransferRequestPolicyWaiver waiver = transferRequestPolicyWaiverRepository
                .findByTransferRequestIdAndPolicyCheckType(transferRequestId, policyCheckType)
                .orElseGet(TransferRequestPolicyWaiver::new);
        waiver.setTransferRequest(transferRequest);
        waiver.setPolicyCheckType(policyCheckType);
        waiver.setWaivedByUser(findCurrentUser(jwt));
        waiver.setWaivedAt(LocalDateTime.now());
        waiver.setReason(requireReason(request.reason()));

        return mapPolicyWaiverResponse(transferRequestPolicyWaiverRepository.save(waiver));
    }

    @Transactional
    public void removeWaiver(Long transferRequestId, String policyCheckType) {
        requirePositiveId(transferRequestId, "Transfer request id");
        String normalizedPolicyCheckType = normalizePolicyCheckType(policyCheckType);

        TransferRequestPolicyWaiver waiver = transferRequestPolicyWaiverRepository
                .findByTransferRequestIdAndPolicyCheckType(transferRequestId, normalizedPolicyCheckType)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Transfer request policy waiver was not found."
                ));

        transferRequestPolicyWaiverRepository.delete(waiver);
    }

    private SisUser findCurrentUser(AuthenticatedJwt jwt) {
        return sisUserRepository.findById(jwt.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user was not found."));
    }

    private String normalizePolicyCheckType(String policyCheckType) {
        String normalizedPolicyCheckType = trimToNull(policyCheckType);
        if (normalizedPolicyCheckType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policy check type is required.");
        }

        normalizedPolicyCheckType = normalizedPolicyCheckType.toUpperCase().replace('-', '_').replace(' ', '_');
        if ("FOUR_YEAR_RULE".equals(normalizedPolicyCheckType)) {
            normalizedPolicyCheckType = POLICY_CHECK_FOUR_YEAR_INSTITUTION_RULE;
        }

        if (!ALLOWED_POLICY_CHECK_TYPES.contains(normalizedPolicyCheckType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Policy check type is invalid.");
        }

        return normalizedPolicyCheckType;
    }

    private String requireReason(String reason) {
        String normalizedReason = trimToNull(reason);
        if (normalizedReason == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Waiver reason is required.");
        }

        return normalizedReason;
    }

    private TransferRequestPolicyWaiverResponse mapPolicyWaiverResponse(TransferRequestPolicyWaiver waiver) {
        SisUser waivedByUser = waiver.getWaivedByUser();

        return new TransferRequestPolicyWaiverResponse(
                waiver.getId(),
                waiver.getTransferRequest().getId(),
                waiver.getPolicyCheckType(),
                waivedByUser.getId(),
                waivedByUser.getEmail(),
                waiver.getWaivedAt(),
                waiver.getReason(),
                waiver.getCreatedAt(),
                waiver.getUpdatedAt()
        );
    }
}
