package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.RegistrationGroupPublishGroupResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishResultResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishValidationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class RegistrationGroupPublishService {
    private final ApplicationEventPublisher eventPublisher;
    private final RegistrationGroupPublishValidationService publishValidationService;
    private final RegistrationGroupSinglePublishService singlePublishService;

    @Transactional
    public RegistrationGroupPublishResultResponse publishRegistrationGroups(
            RegistrationGroupPublishRequest request,
            Long actorUserId
    ) {
        RegistrationGroupPublishRequest requiredRequest = requireRequestBody(request);
        Long academicYearId = requirePositiveId(requiredRequest.academicYearId(), "Academic year id");
        Long termId = requirePositiveId(requiredRequest.termId(), "Term id");

        RegistrationGroupPublishValidationResponse validation = publishValidationService.validateForPublish(
                academicYearId,
                termId
        );
        if (validation.blockingIssueCount() > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration groups are not ready to publish. Fix blocking issues before publishing."
            );
        }

        List<Long> draftGroupIds = validation.groups().stream()
                .filter(group -> RegistrationGroupStatusSupport.DRAFT.equals(normalizeStatus(group.statusCode())))
                .map(RegistrationGroupPublishGroupResponse::registrationGroupId)
                .toList();
        List<Long> publishedGroupIds = draftGroupIds.stream()
                .map(registrationGroupId -> singlePublishService.publishRegistrationGroupWithoutNotification(
                        registrationGroupId,
                        actorUserId
                ))
                .map(RegistrationGroupPublishGroupResponse::registrationGroupId)
                .toList();
        if (!publishedGroupIds.isEmpty()) {
            eventPublisher.publishEvent(new RegistrationGroupsPublishedEvent(publishedGroupIds));
        }

        return new RegistrationGroupPublishResultResponse(
                validation.academicYearId(),
                validation.academicYearCode(),
                validation.academicYearName(),
                validation.termId(),
                validation.termCode(),
                validation.termName(),
                validation.groupCount(),
                publishedGroupIds.size(),
                validation.groupCount() - publishedGroupIds.size(),
                validation.groups().stream()
                        .map(this::toPublishedResultGroup)
                        .toList()
        );
    }

    private RegistrationGroupPublishGroupResponse toPublishedResultGroup(
            RegistrationGroupPublishGroupResponse validationGroup
    ) {
        if (!RegistrationGroupStatusSupport.DRAFT.equals(normalizeStatus(validationGroup.statusCode()))) {
            return validationGroup;
        }

        return new RegistrationGroupPublishGroupResponse(
                validationGroup.registrationGroupId(),
                validationGroup.name(),
                RegistrationGroupStatusSupport.PUBLISHED,
                RegistrationGroupStatusSupport.statusName(RegistrationGroupStatusSupport.PUBLISHED),
                validationGroup.registrationOpensAt(),
                validationGroup.registrationClosesAt(),
                validationGroup.studentCount(),
                validationGroup.hasRegistrationWindow(),
                false,
                validationGroup.validationIssues()
        );
    }

    private String normalizeStatus(String status) {
        return status == null ? null : status.trim().toUpperCase(Locale.ROOT);
    }
}
