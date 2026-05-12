package com.msm.sis.api.service.registration;

import com.msm.sis.api.repository.RegistrationGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RegistrationGroupLifecycleService {
    private final RegistrationGroupRepository registrationGroupRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int closeExpiredPublishedGroups() {
        return registrationGroupRepository.closeExpiredPublishedGroups(LocalDateTime.now());
    }
}
