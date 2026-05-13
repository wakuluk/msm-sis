package com.msm.sis.api.service.course;

import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionWaitlistOffer;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import com.msm.sis.api.repository.StudentSectionWaitlistOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentSectionWaitlistActivationService {
    public static final String OFFERED_STATUS = "OFFERED";
    private static final int OFFER_WINDOW_HOURS = 24;

    private final StudentSectionEnrollmentRepository enrollmentRepository;
    private final StudentSectionWaitlistOfferRepository waitlistOfferRepository;
    private final StudentSectionWaitlistNotificationService notificationService;

    @Transactional
    public Optional<StudentSectionWaitlistOffer> activateNextWaitlistedStudent(Long sectionId) {
        Optional<StudentSectionWaitlistOffer> existingOffer =
                waitlistOfferRepository.findFirstByCourseSectionIdAndStatusOrderByExpiresAtAsc(
                        sectionId,
                        OFFERED_STATUS
                );
        if (existingOffer.isPresent()) {
            return existingOffer;
        }

        Optional<StudentSectionEnrollment> nextWaitlistedEnrollment =
                enrollmentRepository.findNextWaitlistedBySectionId(sectionId);
        if (nextWaitlistedEnrollment.isEmpty()) {
            return Optional.empty();
        }

        StudentSectionWaitlistOffer offer = createOffer(nextWaitlistedEnrollment.get());
        StudentSectionWaitlistOffer savedOffer = waitlistOfferRepository.saveAndFlush(offer);
        if (notificationService.sendWaitlistOfferNotification(savedOffer)) {
            savedOffer.setNotificationSentAt(LocalDateTime.now());
            savedOffer = waitlistOfferRepository.saveAndFlush(savedOffer);
        }

        return Optional.of(savedOffer);
    }

    private StudentSectionWaitlistOffer createOffer(StudentSectionEnrollment enrollment) {
        LocalDateTime now = LocalDateTime.now();
        StudentSectionWaitlistOffer offer = new StudentSectionWaitlistOffer();
        offer.setStudentSectionEnrollment(enrollment);
        offer.setStatus(OFFERED_STATUS);
        offer.setOfferedAt(now);
        offer.setExpiresAt(now.plusHours(OFFER_WINDOW_HOURS));

        return offer;
    }
}
