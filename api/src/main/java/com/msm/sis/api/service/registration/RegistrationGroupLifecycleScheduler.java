package com.msm.sis.api.service.registration;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RegistrationGroupLifecycleScheduler {
    private final RegistrationGroupLifecycleService lifecycleService;

    @Scheduled(fixedDelayString = "${registration-groups.lifecycle.close-expired-delay-ms:300000}")
    public void closeExpiredPublishedGroupsOnSchedule() {
        lifecycleService.closeExpiredPublishedGroups();
    }
}
