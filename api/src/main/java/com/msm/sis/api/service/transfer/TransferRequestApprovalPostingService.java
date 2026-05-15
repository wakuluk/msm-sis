package com.msm.sis.api.service.transfer;

import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.StudentTransferCredit;
import com.msm.sis.api.entity.StudentTransferCreditCourse;
import com.msm.sis.api.entity.TransferInstitution;
import com.msm.sis.api.entity.TransferRequest;
import com.msm.sis.api.entity.TransferRequestCourse;
import com.msm.sis.api.entity.TransferRequestOutcome;
import com.msm.sis.api.repository.StudentTransferCreditCourseRepository;
import com.msm.sis.api.repository.StudentTransferCreditRepository;
import com.msm.sis.api.repository.TransferRequestCourseRepository;
import com.msm.sis.api.repository.TransferRequestOutcomeRepository;
import com.msm.sis.api.repository.TransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class TransferRequestApprovalPostingService {

    private static final String APPROVED_STATUS = "APPROVED";
    private static final String OUTCOME_COURSE_SUBSTITUTION = "COURSE_SUBSTITUTION";
    private static final String OUTCOME_TRANSFER_CREDIT = "TRANSFER_CREDIT";

    private final StudentTransferCreditCourseRepository studentTransferCreditCourseRepository;
    private final StudentTransferCreditRepository studentTransferCreditRepository;
    private final TransferRequestCourseRepository transferRequestCourseRepository;
    private final TransferRequestOutcomeRepository transferRequestOutcomeRepository;
    private final TransferRequestRepository transferRequestRepository;

    @Transactional
    public void postApprovedRequest(Long transferRequestId) {
        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));

        if (!APPROVED_STATUS.equals(transferRequest.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only approved transfer requests can be posted to transcript credit."
            );
        }

        List<TransferRequestCourse> requestCourses =
                transferRequestCourseRepository.findByTransferRequestIdOrderBySortOrderAscIdAsc(transferRequestId);

        if (requestCourses.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Approved transfer request must include at least one requested course."
            );
        }

        for (TransferRequestCourse requestCourse : requestCourses) {
            postRequestCourse(transferRequest, requestCourse);
        }
    }

    private void postRequestCourse(
            TransferRequest transferRequest,
            TransferRequestCourse requestCourse
    ) {
        if (requestCourse.getPostedStudentTransferCredit() != null) {
            return;
        }

        validateRequestCourseForPosting(requestCourse);
        List<TransferRequestOutcome> outcomes =
                transferRequestOutcomeRepository.findByTransferRequestCourseIdOrderByIdAsc(requestCourse.getId());

        BigDecimal earnedCredits = resolveEarnedCredits(requestCourse, outcomes);
        BigDecimal attemptedCredits = resolveAttemptedCredits(requestCourse, earnedCredits);

        StudentTransferCredit transferCredit = new StudentTransferCredit();
        transferCredit.setStudent(transferRequest.getStudent());
        transferCredit.setTransferInstitution(transferRequest.getTransferInstitution());
        applyInstitutionSnapshot(transferCredit, transferRequest);
        transferCredit.setExternalTermLabel(resolveExternalTermLabel(transferRequest, requestCourse));
        transferCredit.setTranscriptSortDate(resolveTranscriptSortDate(transferRequest));
        transferCredit.setExternalSubjectCode(requestCourse.getExternalSubjectCode().trim());
        transferCredit.setExternalCourseNumber(requestCourse.getExternalCourseNumber().trim());
        transferCredit.setExternalCourseTitle(requestCourse.getExternalCourseTitle().trim());
        transferCredit.setTransferGradeMark(resolveTransferGradeMark(requestCourse.getGrade()));
        transferCredit.setCreditsAttempted(attemptedCredits);
        transferCredit.setCreditsEarned(earnedCredits);
        transferCredit.setGpaCredits(BigDecimal.ZERO);
        transferCredit.setQualityPoints(BigDecimal.ZERO);
        transferCredit.setIncludeInGpa(false);
        transferCredit.setNotes("Posted from transfer request #" + transferRequest.getId());

        StudentTransferCredit savedTransferCredit = studentTransferCreditRepository.save(transferCredit);
        postCourseSubstitutionMappings(savedTransferCredit, outcomes);

        requestCourse.setPostedStudentTransferCredit(savedTransferCredit);
        transferRequestCourseRepository.save(requestCourse);
    }

    private void applyInstitutionSnapshot(StudentTransferCredit transferCredit, TransferRequest transferRequest) {
        TransferInstitution savedInstitution = transferRequest.getTransferInstitution();
        String institutionName = savedInstitution == null
                ? trimToNull(transferRequest.getOneOffInstitutionName())
                : trimToNull(savedInstitution.getName());
        if (institutionName == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Approved transfer request must include an institution name before transcript posting."
            );
        }

        transferCredit.setTransferInstitutionNameSnapshot(institutionName);
        transferCredit.setTransferInstitutionAddressLine1Snapshot(trimToNull(transferRequest.getOneOffInstitutionAddressLine1()));
        transferCredit.setTransferInstitutionAddressLine2Snapshot(trimToNull(transferRequest.getOneOffInstitutionAddressLine2()));
        transferCredit.setTransferInstitutionCitySnapshot(trimToNull(transferRequest.getOneOffInstitutionCity()));
        transferCredit.setTransferInstitutionStateRegionSnapshot(trimToNull(transferRequest.getOneOffInstitutionStateRegion()));
        transferCredit.setTransferInstitutionPostalCodeSnapshot(trimToNull(transferRequest.getOneOffInstitutionPostalCode()));
        transferCredit.setTransferInstitutionCountryCodeSnapshot(trimToNull(transferRequest.getOneOffInstitutionCountryCode()));
        transferCredit.setTransferInstitutionWebsiteSnapshot(trimToNull(transferRequest.getOneOffInstitutionWebsite()));
        transferCredit.setTransferInstitutionLevelSnapshot(
                savedInstitution == null ? transferRequest.getInstitutionLevel() : savedInstitution.getInstitutionLevel()
        );
    }

    private void validateRequestCourseForPosting(TransferRequestCourse requestCourse) {
        if (trimToNull(requestCourse.getExternalSubjectCode()) == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested course must include an external subject code before approval."
            );
        }

        if (trimToNull(requestCourse.getExternalCourseNumber()) == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested course must include an external course number before approval."
            );
        }

        if (trimToNull(requestCourse.getExternalCourseTitle()) == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested course must include an external course title before approval."
            );
        }
    }

    private BigDecimal resolveEarnedCredits(
            TransferRequestCourse requestCourse,
            List<TransferRequestOutcome> outcomes
    ) {
        if (requestCourse.getEarnedCredits() != null) {
            return requestCourse.getEarnedCredits();
        }

        BigDecimal transferCreditOutcomeCredits = outcomes.stream()
                .filter(outcome -> OUTCOME_TRANSFER_CREDIT.equals(outcome.getOutcomeType()))
                .map(TransferRequestOutcome::getAcceptedCredits)
                .filter(credits -> credits != null)
                .findFirst()
                .orElse(null);

        if (transferCreditOutcomeCredits != null) {
            return transferCreditOutcomeCredits;
        }

        BigDecimal maxOutcomeCredits = outcomes.stream()
                .map(TransferRequestOutcome::getAcceptedCredits)
                .filter(credits -> credits != null)
                .max(BigDecimal::compareTo)
                .orElse(null);

        if (maxOutcomeCredits != null) {
            return maxOutcomeCredits;
        }

        if (requestCourse.getRequestedCredits() != null) {
            return requestCourse.getRequestedCredits();
        }

        if (requestCourse.getAttemptedCredits() != null) {
            return requestCourse.getAttemptedCredits();
        }

        return BigDecimal.ZERO;
    }

    private BigDecimal resolveAttemptedCredits(TransferRequestCourse requestCourse, BigDecimal earnedCredits) {
        BigDecimal attemptedCredits = requestCourse.getAttemptedCredits() == null
                ? requestCourse.getRequestedCredits()
                : requestCourse.getAttemptedCredits();

        if (attemptedCredits == null || attemptedCredits.compareTo(earnedCredits) < 0) {
            return earnedCredits;
        }

        return attemptedCredits;
    }

    private String resolveExternalTermLabel(TransferRequest transferRequest, TransferRequestCourse requestCourse) {
        String externalTerm = trimToNull(requestCourse.getExternalTerm());
        if (externalTerm != null) {
            return externalTerm;
        }

        return "Transfer request #" + transferRequest.getId();
    }

    private LocalDate resolveTranscriptSortDate(TransferRequest transferRequest) {
        return transferRequest.getSubmittedAt() == null ? LocalDate.now() : transferRequest.getSubmittedAt().toLocalDate();
    }

    private String resolveTransferGradeMark(String grade) {
        String normalizedGrade = trimToNull(grade);
        if (normalizedGrade != null && normalizedGrade.equalsIgnoreCase("F")) {
            return "F";
        }

        return "P";
    }

    private void postCourseSubstitutionMappings(
            StudentTransferCredit transferCredit,
            List<TransferRequestOutcome> outcomes
    ) {
        Map<Long, Course> substitutionCoursesById = new LinkedHashMap<>();
        outcomes.stream()
                .filter(outcome -> OUTCOME_COURSE_SUBSTITUTION.equals(outcome.getOutcomeType()))
                .map(TransferRequestOutcome::getLocalCourse)
                .filter(course -> course != null)
                .forEach(course -> substitutionCoursesById.putIfAbsent(course.getId(), course));

        substitutionCoursesById.values().forEach(course -> {
            if (studentTransferCreditCourseRepository.existsByTransferCredit_IdAndCourse_Id(
                    transferCredit.getId(),
                    course.getId()
            )) {
                return;
            }

            StudentTransferCreditCourse transferCreditCourse = new StudentTransferCreditCourse();
            transferCreditCourse.setTransferCredit(transferCredit);
            transferCreditCourse.setCourse(course);
            studentTransferCreditCourseRepository.save(transferCreditCourse);
        });
    }
}
