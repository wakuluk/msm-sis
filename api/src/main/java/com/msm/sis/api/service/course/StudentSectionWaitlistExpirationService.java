package com.msm.sis.api.service.course;

import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.entity.StudentSectionWaitlistOffer;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentSectionWaitlistOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentSectionWaitlistExpirationService {
    private static final String OFFERED_STATUS = "OFFERED";
    private static final String EXPIRED_STATUS = "EXPIRED";
    private static final String WAITLIST_EXPIRED_STATUS_CODE = "WAITLIST_EXPIRED";

    private final StudentSectionWaitlistOfferRepository waitlistOfferRepository;
    private final StudentSectionEnrollmentRepository enrollmentRepository;
    private final StudentSectionEnrollmentReferenceResolver referenceResolver;
    private final StudentSectionEnrollmentStatusService enrollmentStatusService;
    private final StudentSectionEnrollmentEventService enrollmentEventService;
    private final StudentSectionWaitlistActivationService activationService;
    private final StudentSectionWaitlistNotificationService notificationService;

    @Transactional
    public int expireOverdueOffers() {
        List<StudentSectionWaitlistOffer> expiredOffers =
                waitlistOfferRepository.findByStatusAndExpiresAtLessThanEqual(OFFERED_STATUS, LocalDateTime.now());
        expiredOffers.forEach(this::expireOfferAndActivateNext);

        return expiredOffers.size();
    }

    private void expireOfferAndActivateNext(StudentSectionWaitlistOffer offer) {
        CourseSection section = offer.getCourseSection();
        Long sectionId = section == null ? null : section.getId();

        offer.setStatus(EXPIRED_STATUS);
        waitlistOfferRepository.saveAndFlush(offer);

        StudentSectionEnrollment enrollment = offer.getStudentSectionEnrollment();
        if (enrollment != null && isWaitlisted(enrollment.getStatus())) {
            StudentSectionEnrollmentStatus priorStatus = enrollment.getStatus();
            StudentSectionEnrollmentStatus expiredStatus =
                    referenceResolver.resolveEnrollmentStatus(WAITLIST_EXPIRED_STATUS_CODE);

            enrollment.setStatus(expiredStatus);
            enrollmentStatusService.applyStatusDates(enrollment, expiredStatus, null);
            enrollmentStatusService.applyWaitlistState(enrollment, expiredStatus);
            StudentSectionEnrollment savedEnrollment = enrollmentRepository.saveAndFlush(enrollment);

            enrollmentEventService.createEvent(
                    savedEnrollment,
                    WAITLIST_EXPIRED_STATUS_CODE,
                    priorStatus,
                    expiredStatus,
                    null,
                    "Waitlist offer expired."
            );
            if (sectionId != null) {
                enrollmentStatusService.compactWaitlistPositions(sectionId);
            }
        }

        notificationService.sendWaitlistOfferExpiredNotification(offer);

        if (sectionId != null) {
            activationService.activateNextWaitlistedStudent(sectionId);
        }
    }

    private boolean isWaitlisted(StudentSectionEnrollmentStatus status) {
        return status != null && "WAITLISTED".equalsIgnoreCase(status.getCode());
    }
}
