package com.msm.sis.api.service.transfer;

import com.msm.sis.api.dto.transfer.TransferRequestCourseRequest;
import com.msm.sis.api.dto.transfer.TransferRequestCourseResponse;
import com.msm.sis.api.entity.TransferRequest;
import com.msm.sis.api.entity.TransferRequestCourse;
import com.msm.sis.api.repository.TransferRequestCourseRepository;
import com.msm.sis.api.repository.TransferRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class TransferRequestCourseService {

    private final TransferRequestCourseRepository transferRequestCourseRepository;
    private final TransferRequestRepository transferRequestRepository;

    @Transactional(readOnly = true)
    public List<TransferRequestCourseResponse> listCourses(Long transferRequestId) {
        requirePositiveId(transferRequestId, "Transfer request id");

        return transferRequestCourseRepository.findByTransferRequestIdOrderBySortOrderAscIdAsc(transferRequestId)
                .stream()
                .map(this::mapCourseResponse)
                .toList();
    }

    @Transactional
    public TransferRequestCourseResponse upsertPrimaryCourse(
            Long transferRequestId,
            TransferRequestCourseRequest request
    ) {
        requirePositiveId(transferRequestId, "Transfer request id");
        requireRequestBody(request);

        TransferRequest transferRequest = transferRequestRepository.findById(transferRequestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transfer request was not found."));

        TransferRequestCourse course = transferRequestCourseRepository
                .findByTransferRequestIdOrderBySortOrderAscIdAsc(transferRequestId)
                .stream()
                .findFirst()
                .orElseGet(TransferRequestCourse::new);
        course.setTransferRequest(transferRequest);
        course.setSortOrder(0);
        applyCourseValues(course, request);

        return mapCourseResponse(transferRequestCourseRepository.save(course));
    }

    private void applyCourseValues(TransferRequestCourse course, TransferRequestCourseRequest request) {
        course.setExternalSubjectCode(trimToNull(request.externalSubjectCode()));
        course.setExternalCourseNumber(trimToNull(request.externalCourseNumber()));
        course.setExternalCourseTitle(requireText(request.externalCourseTitle(), "External course title is required."));
        course.setExternalCourseDescription(trimToNull(request.externalCourseDescription()));
        course.setExternalTerm(trimToNull(request.externalTerm()));
        course.setRequestedCredits(request.requestedCredits());
        course.setAttemptedCredits(request.attemptedCredits());
        course.setEarnedCredits(request.earnedCredits());
        course.setGrade(trimToNull(request.grade()));
        course.setReason(trimToNull(request.reason()));
        course.setStudentNotes(trimToNull(request.studentNotes()));
        course.setRequestedLocalCourseEquivalent(trimToNull(request.requestedLocalCourseEquivalent()));
    }

    private String requireText(String value, String message) {
        String normalizedValue = trimToNull(value);
        if (normalizedValue == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return normalizedValue;
    }

    private TransferRequestCourseResponse mapCourseResponse(TransferRequestCourse course) {
        return new TransferRequestCourseResponse(
                course.getId(),
                course.getTransferRequest().getId(),
                course.getExternalSubjectCode(),
                course.getExternalCourseNumber(),
                course.getExternalCourseTitle(),
                course.getExternalCourseDescription(),
                course.getExternalTerm(),
                course.getRequestedCredits(),
                course.getAttemptedCredits(),
                course.getEarnedCredits(),
                course.getGrade(),
                course.getReason(),
                course.getStudentNotes(),
                course.getRequestedLocalCourseEquivalent(),
                course.getSortOrder(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }
}
