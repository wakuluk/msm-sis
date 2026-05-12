package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.RegistrationGroupPublishGroupResponse;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.SisUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class RegistrationGroupSinglePublishService {
    private final ApplicationEventPublisher eventPublisher;
    private final RegistrationGroupPublishValidationService publishValidationService;
    private final RegistrationGroupRepository registrationGroupRepository;
    private final SisUserRepository sisUserRepository;

    @Transactional
    public RegistrationGroupPublishGroupResponse publishRegistrationGroup(
            Long registrationGroupId,
            Long actorUserId
    ) {
        return publishRegistrationGroup(registrationGroupId, actorUserId, true);
    }

    @Transactional
    public RegistrationGroupPublishGroupResponse publishRegistrationGroupWithoutNotification(
            Long registrationGroupId,
            Long actorUserId
    ) {
        return publishRegistrationGroup(registrationGroupId, actorUserId, false);
    }

    private RegistrationGroupPublishGroupResponse publishRegistrationGroup(
            Long registrationGroupId,
            Long actorUserId,
            boolean sendNotification
    ) {
        Long requiredRegistrationGroupId = requirePositiveId(registrationGroupId, "Registration group id");
        RegistrationGroupPublishGroupResponse validation =
                publishValidationService.validateGroupForPublish(requiredRegistrationGroupId);
        if (!validation.publishable()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    publishBlockedMessage(validation)
            );
        }

        RegistrationGroup registrationGroup = registrationGroupRepository
                .findRegistrationGroupDetail(requiredRegistrationGroupId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration group was not found."
                ));
        registrationGroup.setStatus(RegistrationGroupStatusSupport.PUBLISHED);
        registrationGroup.setUpdatedByUser(resolveActorUser(actorUserId));

        RegistrationGroup savedRegistrationGroup = registrationGroupRepository.save(registrationGroup);
        if (sendNotification) {
            eventPublisher.publishEvent(new RegistrationGroupsPublishedEvent(List.of(savedRegistrationGroup.getId())));
        }

        return new RegistrationGroupPublishGroupResponse(
                savedRegistrationGroup.getId(),
                savedRegistrationGroup.getName(),
                RegistrationGroupStatusSupport.PUBLISHED,
                RegistrationGroupStatusSupport.statusName(RegistrationGroupStatusSupport.PUBLISHED),
                savedRegistrationGroup.getRegistrationOpensAt(),
                savedRegistrationGroup.getRegistrationClosesAt(),
                validation.studentCount(),
                true,
                false,
                List.of()
        );
    }

    private SisUser resolveActorUser(Long actorUserId) {
        if (actorUserId == null) {
            return null;
        }

        return sisUserRepository.findById(actorUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User was not found."));
    }

    private String publishBlockedMessage(RegistrationGroupPublishGroupResponse validation) {
        return validation.validationIssues().stream()
                .map(issue -> issue.message() == null ? null : issue.message().trim())
                .filter(message -> message != null && !message.isBlank())
                .findFirst()
                .orElse("Registration group is not ready to publish.");
    }
}
