package com.msm.sis.api.service.course;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentSectionWaitlistExpirationScheduler {
    private final StudentSectionWaitlistExpirationService expirationService;

    @Scheduled(fixedDelayString = "${course-sections.waitlist.expire-offers-delay-ms:300000}")
    public void expireOverdueWaitlistOffersOnSchedule() {
        expirationService.expireOverdueOffers();
    }
}
