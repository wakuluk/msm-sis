package com.msm.sis.api.service.transfer;

import com.msm.sis.api.dto.transfer.TransferRequestPolicyCheckResponse;
import com.msm.sis.api.dto.transfer.TransferRequestPolicyEvaluationResponse;
import com.msm.sis.api.entity.TransferCreditPolicy;
import com.msm.sis.api.entity.TransferRequest;
import com.msm.sis.api.entity.TransferRequestCourse;
import com.msm.sis.api.entity.TransferRequestOutcome;
import com.msm.sis.api.entity.TransferRequestPolicyWaiver;
import com.msm.sis.api.repository.StudentTransferCreditRepository;
import com.msm.sis.api.repository.TransferCreditPolicyRepository;
import com.msm.sis.api.repository.TransferRequestAttachmentRepository;
import com.msm.sis.api.repository.TransferRequestCourseRepository;
import com.msm.sis.api.repository.TransferRequestOutcomeRepository;
import com.msm.sis.api.repository.TransferRequestPolicyWaiverRepository;
import com.msm.sis.api.repository.TransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class TransferRequestPolicyEvaluationService {

    private static final String ATTACHMENT_TYPE_TRANSCRIPT = "TRANSCRIPT";
    private static final String CHECK_FOUR_YEAR_INSTITUTION_RULE = "FOUR_YEAR_INSTITUTION_RULE";
    private static final String CHECK_MINIMUM_GRADE = "MINIMUM_GRADE";
    private static final String CHECK_TRANSCRIPT_PDF = "TRANSCRIPT_PDF";
    private static final String INSTITUTION_LEVEL_FOUR_YEAR = "FOUR_YEAR";
    private static final String OUTCOME_TRANSFER_CREDIT = "TRANSFER_CREDIT";

    private final StudentTransferCreditRepository studentTransferCreditRepository;
    private final TransferCreditPolicyRepository transferCreditPolicyRepository;
    private final TransferRequestAttachmentRepository transferRequestAttachmentRepository;
    private final TransferRequestCourseRepository transferRequestCourseRepository;
    private final TransferRequestOutcomeRepository transferRequestOutcomeRepository;
    private final TransferRequestPolicyWaiverRepository transferRequestPolicyWaiverRepository;
    private final TransferRequestRepository transferRequestRepository;

    @Transactional(readOnly = true)
    public TransferRequestPolicyEvaluationResponse evaluate(Long transferRequestId) {
        requirePositiveId(transferRequestId, "Transfer request id");

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));
        TransferCreditPolicy policy = resolvePolicy(transferRequest);
        List<TransferRequestCourse> requestCourses =
                transferRequestCourseRepository.findByTransferRequestIdOrderBySortOrderAscIdAsc(transferRequestId);
        Map<String, TransferRequestPolicyWaiver> waiversByCheckType =
                transferRequestPolicyWaiverRepository.findByTransferRequestIdOrderByPolicyCheckTypeAsc(transferRequestId)
                        .stream()
                        .collect(Collectors.toMap(
                                TransferRequestPolicyWaiver::getPolicyCheckType,
                                waiver -> waiver,
                                (first, ignored) -> first
                        ));

        BigDecimal currentTransferCredits = Objects.requireNonNullElse(
                studentTransferCreditRepository.sumTransferCreditsByStudentId(transferRequest.getStudent().getId()),
                BigDecimal.ZERO
        );
        BigDecimal unpostedRequestCredits = requestCourses.stream()
                .filter(course -> course.getPostedStudentTransferCredit() == null)
                .map(this::resolveRequestCourseCredits)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal requestCredits = requestCourses.stream()
                .map(this::resolveRequestCourseCredits)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal transferCreditsAfterApproved = currentTransferCredits.add(unpostedRequestCredits);
        boolean thresholdApplies = transferCreditsAfterApproved.compareTo(BigDecimal.valueOf(
                policy.getFourYearInstitutionCreditThreshold()
        )) >= 0;
        boolean transcriptPdfAttached = transferRequestAttachmentRepository.existsByTransferRequestIdAndAttachmentType(
                transferRequestId,
                ATTACHMENT_TYPE_TRANSCRIPT
        );

        List<TransferRequestPolicyCheckResponse> checks = List.of(
                minimumGradeCheck(policy, requestCourses, waiversByCheckType),
                fourYearInstitutionCheck(policy, transferRequest, transferCreditsAfterApproved, thresholdApplies, waiversByCheckType),
                transcriptPdfCheck(policy, transcriptPdfAttached)
        );
        boolean hasFailures = checks.stream().anyMatch(check -> !check.passed() && !check.waived());

        return new TransferRequestPolicyEvaluationResponse(
                transferRequest.getId(),
                policy.getId(),
                policy.getEffectiveStartDate(),
                policy.getEffectiveEndDate(),
                policy.getMinimumTransferGrade(),
                policy.getFourYearInstitutionCreditThreshold(),
                policy.isRequireTranscriptPdf(),
                currentTransferCredits,
                requestCredits,
                transferCreditsAfterApproved,
                transferRequest.getInstitutionLevel(),
                thresholdApplies,
                transcriptPdfAttached,
                hasFailures,
                checks
        );
    }

    private TransferCreditPolicy resolvePolicy(TransferRequest transferRequest) {
        LocalDate requestDate = transferRequest.getSubmittedAt() == null
                ? LocalDate.now()
                : transferRequest.getSubmittedAt().toLocalDate();

        return transferCreditPolicyRepository.findEffectivePolicyForDate(requestDate)
                .stream()
                .findFirst()
                .orElseGet(transferRequest::getPolicy);
    }

    private TransferRequestPolicyCheckResponse minimumGradeCheck(
            TransferCreditPolicy policy,
            List<TransferRequestCourse> requestCourses,
            Map<String, TransferRequestPolicyWaiver> waiversByCheckType
    ) {
        boolean passed = !requestCourses.isEmpty() && requestCourses.stream()
                .allMatch(course -> gradeMeetsMinimum(course.getGrade(), policy.getMinimumTransferGrade()));
        String message = passed
                ? "All requested course grades meet the minimum transfer grade."
                : "One or more requested course grades are below the minimum transfer grade or missing.";
        return check(
                CHECK_MINIMUM_GRADE,
                "Minimum grade",
                passed,
                waiversByCheckType.containsKey(CHECK_MINIMUM_GRADE),
                true,
                message
        );
    }

    private TransferRequestPolicyCheckResponse fourYearInstitutionCheck(
            TransferCreditPolicy policy,
            TransferRequest transferRequest,
            BigDecimal transferCreditsAfterApproved,
            boolean thresholdApplies,
            Map<String, TransferRequestPolicyWaiver> waiversByCheckType
    ) {
        boolean passed = !thresholdApplies || INSTITUTION_LEVEL_FOUR_YEAR.equals(transferRequest.getInstitutionLevel());
        String message = thresholdApplies
                ? "Student transfer credits after approval are "
                + transferCreditsAfterApproved
                + "; institution must be four-year at threshold "
                + policy.getFourYearInstitutionCreditThreshold()
                + "."
                : "Student remains below the four-year institution threshold after approval.";
        return check(
                CHECK_FOUR_YEAR_INSTITUTION_RULE,
                "Four-year institution rule",
                passed,
                waiversByCheckType.containsKey(CHECK_FOUR_YEAR_INSTITUTION_RULE),
                true,
                message
        );
    }

    private TransferRequestPolicyCheckResponse transcriptPdfCheck(
            TransferCreditPolicy policy,
            boolean transcriptPdfAttached
    ) {
        boolean passed = !policy.isRequireTranscriptPdf() || transcriptPdfAttached;
        String message = passed
                ? "Transcript PDF requirement is satisfied."
                : "Transcript PDF is required by the active transfer policy.";
        return check(CHECK_TRANSCRIPT_PDF, "Transcript PDF", passed, false, false, message);
    }

    private TransferRequestPolicyCheckResponse check(
            String checkType,
            String label,
            boolean passed,
            boolean waived,
            boolean waivable,
            String message
    ) {
        String status = passed ? "PASSED" : waived ? "WAIVED" : "FAILED";
        return new TransferRequestPolicyCheckResponse(checkType, label, passed, waived, waivable, status, message);
    }

    private BigDecimal resolveRequestCourseCredits(TransferRequestCourse course) {
        if (course.getEarnedCredits() != null) {
            return course.getEarnedCredits();
        }

        List<TransferRequestOutcome> outcomes =
                transferRequestOutcomeRepository.findByTransferRequestCourseIdOrderByIdAsc(course.getId());
        BigDecimal transferCreditOutcomeCredits = outcomes.stream()
                .filter(outcome -> OUTCOME_TRANSFER_CREDIT.equals(outcome.getOutcomeType()))
                .map(TransferRequestOutcome::getAcceptedCredits)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        if (transferCreditOutcomeCredits != null) {
            return transferCreditOutcomeCredits;
        }

        BigDecimal maxOutcomeCredits = outcomes.stream()
                .map(TransferRequestOutcome::getAcceptedCredits)
                .filter(Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(null);
        if (maxOutcomeCredits != null) {
            return maxOutcomeCredits;
        }

        if (course.getRequestedCredits() != null) {
            return course.getRequestedCredits();
        }

        return Objects.requireNonNullElse(course.getAttemptedCredits(), BigDecimal.ZERO);
    }

    private boolean gradeMeetsMinimum(String grade, String minimumGrade) {
        Integer gradeRank = gradeRank(trimToNull(grade));
        Integer minimumRank = gradeRank(trimToNull(minimumGrade));
        return gradeRank != null && minimumRank != null && gradeRank >= minimumRank;
    }

    private Integer gradeRank(String grade) {
        if (grade == null) {
            return null;
        }

        return switch (grade.toUpperCase()) {
            case "F" -> 0;
            case "D" -> 1;
            case "C-" -> 2;
            case "C" -> 3;
            case "C+" -> 4;
            case "B-" -> 5;
            case "B" -> 6;
            case "B+" -> 7;
            case "A-" -> 8;
            case "A" -> 9;
            default -> null;
        };
    }
}
