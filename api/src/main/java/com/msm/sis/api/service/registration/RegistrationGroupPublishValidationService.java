package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.RegistrationGroupPublishGroupResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishRequest;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishValidationIssueResponse;
import com.msm.sis.api.dto.registration.RegistrationGroupPublishValidationResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupGenerationAcademicDivision;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.repository.RegistrationGroupGenerationAcademicDivisionRepository;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import com.msm.sis.api.service.student.StudentAcademicCareerEligibilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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
    private static final String FIELD_ACADEMIC_DIVISION = "academicDivision";

    private final StudentAcademicCareerEligibilityService academicCareerEligibilityService;
    private final RegistrationGroupGenerationAcademicDivisionRepository generationAcademicDivisionRepository;
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
        Map<Long, List<RegistrationGroupPublishValidationIssueResponse>> academicCareerIssuesByGroupId =
                validateAssignedStudentAcademicDivisions(groups);
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
                .map(group -> toGroupResponse(
                        group,
                        studentCountsByGroupId.getOrDefault(group.getId(), 0L),
                        now,
                        academicCareerIssuesByGroupId.getOrDefault(group.getId(), List.of())
                ))
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
                LocalDateTime.now(),
                validateAssignedStudentAcademicDivisions(List.of(registrationGroup))
                        .getOrDefault(registrationGroup.getId(), List.of())
        );
    }

    private RegistrationGroupPublishGroupResponse toGroupResponse(
            RegistrationGroup group,
            long studentCount,
            LocalDateTime now,
            List<RegistrationGroupPublishValidationIssueResponse> additionalIssues
    ) {
        List<RegistrationGroupPublishValidationIssueResponse> issues = validateGroup(group, now);
        issues.addAll(additionalIssues);
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

    private Map<Long, List<RegistrationGroupPublishValidationIssueResponse>> validateAssignedStudentAcademicDivisions(
            List<RegistrationGroup> groups
    ) {
        List<RegistrationGroup> groupsWithAcademicDivision = groups.stream()
                .filter(group -> !requiredAcademicDivisions(group).isEmpty())
                .toList();
        if (groupsWithAcademicDivision.isEmpty()) {
            return Map.of();
        }

        Map<Long, RegistrationGroup> groupsById = groupsWithAcademicDivision.stream()
                .collect(Collectors.toMap(RegistrationGroup::getId, group -> group));
        List<Long> groupIds = groupsWithAcademicDivision.stream()
                .map(RegistrationGroup::getId)
                .toList();
        List<RegistrationGroupStudent> assignments = registrationGroupStudentRepository
                .findAssignedStudentsForGroups(groupIds);
        if (assignments.isEmpty()) {
            return Map.of();
        }

        List<Long> studentIds = assignments.stream()
                .map(RegistrationGroupStudent::getStudent)
                .map(Student::getId)
                .filter(studentId -> studentId != null)
                .distinct()
                .toList();
        Map<Long, List<AcademicDivision>> allowedAcademicDivisionsByStudentId =
                academicCareerEligibilityService.getAllowedAcademicDivisionsByStudentId(studentIds);
        Map<Long, Set<Long>> allowedAcademicDivisionIdsByStudentId = allowedAcademicDivisionsByStudentId.entrySet()
                .stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .map(AcademicDivision::getId)
                                .collect(Collectors.toSet())
                ));

        Map<Long, List<RegistrationGroupPublishValidationIssueResponse>> issuesByGroupId = new HashMap<>();
        Set<String> reportedIssueKeys = new HashSet<>();
        for (RegistrationGroupStudent assignment : assignments) {
            RegistrationGroup group = groupsById.get(assignment.getRegistrationGroup().getId());
            if (group == null) {
                continue;
            }

            List<AcademicDivision> requiredAcademicDivisions = requiredAcademicDivisions(group);
            Student student = assignment.getStudent();
            Long studentId = student == null ? null : student.getId();
            Set<Long> requiredAcademicDivisionIds = requiredAcademicDivisions.stream()
                    .map(AcademicDivision::getId)
                    .collect(Collectors.toSet());
            if (studentId == null || requiredAcademicDivisionIds.isEmpty()) {
                continue;
            }

            boolean eligible = allowedAcademicDivisionIdsByStudentId
                    .getOrDefault(studentId, Set.of())
                    .containsAll(requiredAcademicDivisionIds);
            if (eligible) {
                continue;
            }

            String issueKey = group.getId() + ":" + studentId + ":" + requiredAcademicDivisionIds;
            if (!reportedIssueKeys.add(issueKey)) {
                continue;
            }

            issuesByGroupId.computeIfAbsent(group.getId(), ignored -> new ArrayList<>())
                    .add(issue(
                            group,
                            FIELD_ACADEMIC_DIVISION,
                            "STUDENT_ACADEMIC_CAREER_DIVISION_MISMATCH",
                            studentDisplayName(student)
                                    + " no longer has active academic career access for "
                                    + academicDivisionNames(requiredAcademicDivisions)
                                    + "."
                    ));
        }

        return issuesByGroupId;
    }

    private List<AcademicDivision> requiredAcademicDivisions(RegistrationGroup group) {
        if (group == null || group.getRegistrationGroupGeneration() == null) {
            return List.of();
        }

        List<AcademicDivision> academicDivisions =
                generationAcademicDivisionRepository
                        .findAcademicDivisionsForGeneration(group.getRegistrationGroupGeneration().getId())
                        .stream()
                        .map(RegistrationGroupGenerationAcademicDivision::getAcademicDivision)
                        .toList();
        if (!academicDivisions.isEmpty()) {
            return academicDivisions;
        }

        AcademicDivision academicDivision = group.getRegistrationGroupGeneration().getAcademicDivision();
        return academicDivision == null ? List.of() : List.of(academicDivision);
    }

    private String academicDivisionNames(List<AcademicDivision> academicDivisions) {
        return academicDivisions.stream()
                .map(AcademicDivision::getName)
                .filter(name -> name != null && !name.isBlank())
                .collect(Collectors.joining(", "));
    }

    private String studentDisplayName(Student student) {
        if (student == null) {
            return "Assigned student";
        }

        String firstName = student.getFirstName() == null ? "" : student.getFirstName().trim();
        String lastName = student.getLastName() == null ? "" : student.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();
        if (!displayName.isBlank()) {
            return displayName;
        }

        if (student.getAltId() != null && !student.getAltId().isBlank()) {
            return "Student " + student.getAltId();
        }

        return "Student " + student.getId();
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
