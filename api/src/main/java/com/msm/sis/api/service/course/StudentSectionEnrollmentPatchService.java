package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.PatchCourseSectionStudentEnrollmentRequest;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.patch.PatchValue;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.function.Consumer;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class StudentSectionEnrollmentPatchService {
    private final StudentSectionEnrollmentReferenceResolver referenceResolver;
    private final StudentSectionEnrollmentStatusService enrollmentStatusService;

    public void applyPatch(
            StudentSectionEnrollment enrollment,
            PatchCourseSectionStudentEnrollmentRequest request,
            SisUser actorUser
    ) {
        if (request.getStatusCode().isPresent()) {
            StudentSectionEnrollmentStatus status = referenceResolver.resolveEnrollmentStatus(
                    request.getStatusCode().orElse(null)
            );
            enrollment.setStatus(status);
            enrollmentStatusService.applyStatusDates(enrollment, status, actorUser);
            enrollmentStatusService.applyWaitlistState(enrollment, status);
        }

        applyPatchValue(
                request.getGradingBasisCode(),
                value -> enrollment.setGradingBasis(referenceResolver.resolveGradingBasis(value))
        );
        applyPatchValue(request.getCreditsAttempted(), value -> {
            validateNonNegative(value, "Credits attempted");
            enrollment.setCreditsAttempted(value);
        });
        applyPatchValue(request.getCreditsEarned(), value -> {
            validateNonNegative(value, "Credits earned");
            if (value != null
                    && enrollment.getCreditsAttempted() != null
                    && value.compareTo(enrollment.getCreditsAttempted()) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Credits earned cannot be greater than credits attempted."
                );
            }
            enrollment.setCreditsEarned(value);
        });
        applyPatchValue(request.getWaitlistPosition(), value -> {
            if (value != null && value <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Waitlist position must be greater than zero.");
            }
            enrollment.setWaitlistPosition(value);
        });
        applyPatchValue(request.getIncludeInGpa(), enrollment::setIncludeInGpa);
        applyPatchValue(request.getCapacityOverride(), enrollment::setCapacityOverride);
        applyPatchValue(request.getManualAddReason(), value -> enrollment.setManualAddReason(trimToNull(value)));
    }

    private void validateNonNegative(BigDecimal value, String label) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " must be zero or greater.");
        }
    }

    private <T> void applyPatchValue(PatchValue<T> patchValue, Consumer<T> consumer) {
        if (patchValue.isPresent()) {
            consumer.accept(patchValue.getValue());
        }
    }
}
