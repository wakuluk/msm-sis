package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.RegistrationGroupPublishGroupResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishValidationIssueResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishValidationResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class RegistrationGroupPublishValidationService {
    private static final String FIELD_GROUPS = "groups";
    private static final String FIELD_REGISTRATION_OPENS_AT = "registrationOpensAt";
    private static final String FIELD_REGISTRATION_CLOSES_AT = "registrationClosesAt";
    private static final String FIELD_REGISTRATION_WINDOW = "registrationWindow";
    private static final String FIELD_STATUS = "status";

    private final RegistrationGroupRepository registrationGroupRepository;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;

    @Transactional(readOnly = true)
    public RegistrationGroupPublishValidationResponse validateForPublish(RegistrationGroupPublishRequest request) {
        RegistrationGroupPublishRequest requiredRequest = requireRequestBody(request);
        return validateForPublish(requiredRequest.academicYearId(), requiredRequest.termId());
    }

    @Transactional(readOnly = true)
    public RegistrationGroupPublishValidationResponse validateForPublish(Long academicYearId, Long termId) {
        Long requiredAcademicYearId = requirePositiveId(academicYearId, "Academic year id");
        Long requiredTermId = requirePositiveId(termId, "Term id");

        List<RegistrationGroup> groups = registrationGroupRepository.searchRegistrationGroups(
                        requiredAcademicYearId,
                        requiredTermId,
                        RegistrationGroupStatusSupport.DRAFT,
                        null
                ).stream()
                .sorted(Comparator
                        .comparing((RegistrationGroup group) -> group.getSortOrder() == null ? Integer.MAX_VALUE : group.getSortOrder())
                        .thenComparing(group -> group.getName() == null ? "" : group.getName().toLowerCase(Locale.ROOT))
                        .thenComparing(RegistrationGroup::getId))
                .toList();

        Map<Long, Long> studentCountsByGroupId = loadStudentCounts(groups);
        List<RegistrationGroupPublishValidationIssueResponse> responseIssues = new ArrayList<>();

        if (groups.isEmpty()) {
            responseIssues.add(new RegistrationGroupPublishValidationIssueResponse(
                    null,
                    null,
                    FIELD_GROUPS,
                    "NO_DRAFT_GROUPS",
                    "There are no draft registration groups for the selected academic year and term."
            ));
        }

        LocalDateTime now = LocalDateTime.now();
        List<RegistrationGroupPublishGroupResponse> groupResponses = groups.stream()
                .map(group -> toGroupResponse(group, studentCountsByGroupId.getOrDefault(group.getId(), 0L), now))
                .toList();

        groupResponses.stream()
                .flatMap(groupResponse -> groupResponse.validationIssues().stream())
                .forEach(responseIssues::add);

        long draftGroupCount = groups.stream()
                .filter(group -> RegistrationGroupStatusSupport.DRAFT.equals(normalizeStatus(group.getStatus())))
                .count();
        long alreadyPublishedGroupCount = 0;
        boolean publishable = responseIssues.isEmpty() && draftGroupCount > 0;

        AcademicYear academicYear = groups.isEmpty() ? null : groups.getFirst().getAcademicYear();
        AcademicTerm term = groups.isEmpty() ? null : groups.getFirst().getTerm();

        return new RegistrationGroupPublishValidationResponse(
                requiredAcademicYearId,
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName(),
                requiredTermId,
                term == null ? null : term.getCode(),
                term == null ? null : term.getName(),
                publishable,
                groupResponses.size(),
                Math.toIntExact(draftGroupCount),
                Math.toIntExact(alreadyPublishedGroupCount),
                responseIssues.size(),
                groupResponses,
                responseIssues
        );
    }

    @Transactional(readOnly = true)
    public RegistrationGroupPublishGroupResponse validateGroupForPublish(Long registrationGroupId) {
        Long requiredRegistrationGroupId = requirePositiveId(registrationGroupId, "Registration group id");
        RegistrationGroup registrationGroup = registrationGroupRepository
                .findRegistrationGroupDetail(requiredRegistrationGroupId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration group was not found."
                ));
        Map<Long, Long> studentCountsByGroupId = loadStudentCounts(List.of(registrationGroup));

        return toGroupResponse(
                registrationGroup,
                studentCountsByGroupId.getOrDefault(registrationGroup.getId(), 0L),
                LocalDateTime.now()
        );
    }

    private RegistrationGroupPublishGroupResponse toGroupResponse(
            RegistrationGroup group,
            long studentCount,
            LocalDateTime now
    ) {
        List<RegistrationGroupPublishValidationIssueResponse> issues = validateGroup(group, now);
        String status = normalizeStatus(group.getStatus());
        boolean hasRegistrationWindow = group.getRegistrationOpensAt() != null
                && group.getRegistrationClosesAt() != null
                && group.getRegistrationOpensAt().isBefore(group.getRegistrationClosesAt());
        boolean publishable = issues.isEmpty()
                && RegistrationGroupStatusSupport.DRAFT.equals(status)
                && hasRegistrationWindow;

        return new RegistrationGroupPublishGroupResponse(
                group.getId(),
                group.getName(),
                status,
                RegistrationGroupStatusSupport.statusName(status),
                group.getRegistrationOpensAt(),
                group.getRegistrationClosesAt(),
                studentCount,
                hasRegistrationWindow,
                publishable,
                issues
        );
    }

    private List<RegistrationGroupPublishValidationIssueResponse> validateGroup(
            RegistrationGroup group,
            LocalDateTime now
    ) {
        List<RegistrationGroupPublishValidationIssueResponse> issues = new ArrayList<>();
        LocalDateTime opensAt = group.getRegistrationOpensAt();
        LocalDateTime closesAt = group.getRegistrationClosesAt();
        String status = normalizeStatus(group.getStatus());

        if (opensAt == null) {
            issues.add(issue(group, FIELD_REGISTRATION_OPENS_AT, "MISSING_REGISTRATION_OPENS_AT",
                    "Registration open time is required."));
        }
        if (closesAt == null) {
            issues.add(issue(group, FIELD_REGISTRATION_CLOSES_AT, "MISSING_REGISTRATION_CLOSES_AT",
                    "Registration close time is required."));
        }
        if (opensAt != null && closesAt != null && !opensAt.isBefore(closesAt)) {
            issues.add(issue(group, FIELD_REGISTRATION_WINDOW, "INVALID_REGISTRATION_WINDOW",
                    "Registration open time must be before registration close time."));
        }
        if (opensAt != null && !opensAt.isAfter(now)) {
            issues.add(issue(group, FIELD_REGISTRATION_OPENS_AT, "REGISTRATION_OPENS_AT_NOT_FUTURE",
                    "Registration open time must be in the future before publishing."));
        }
        if (closesAt != null && !closesAt.isAfter(now)) {
            issues.add(issue(group, FIELD_REGISTRATION_CLOSES_AT, "REGISTRATION_CLOSES_AT_NOT_FUTURE",
                    "Registration close time must be in the future before publishing."));
        }
        if (!RegistrationGroupStatusSupport.DRAFT.equals(status)) {
            issues.add(issue(group, FIELD_STATUS, "INVALID_PUBLISH_STATUS",
                    "Only draft registration groups can be published."));
        }

        return issues;
    }

    private RegistrationGroupPublishValidationIssueResponse issue(
            RegistrationGroup group,
            String field,
            String code,
            String message
    ) {
        return new RegistrationGroupPublishValidationIssueResponse(
                group.getId(),
                group.getName(),
                field,
                code,
                message
        );
    }

    private Map<Long, Long> loadStudentCounts(List<RegistrationGroup> groups) {
        List<Long> groupIds = groups.stream()
                .map(RegistrationGroup::getId)
                .toList();
        if (groupIds.isEmpty()) {
            return Map.of();
        }

        return registrationGroupStudentRepository.countStudentsByRegistrationGroupIds(groupIds).stream()
                .collect(Collectors.toMap(
                        RegistrationGroupStudentRepository.RegistrationGroupStudentCountProjection::getRegistrationGroupId,
                        RegistrationGroupStudentRepository.RegistrationGroupStudentCountProjection::getStudentCount,
                        (first, second) -> first
                ));
    }

    private String normalizeStatus(String status) {
        return status == null ? null : status.trim().toUpperCase(Locale.ROOT);
    }
}
