package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CourseSectionStageTransitionRequest;
import com.msm.sis.api.dto.course.CourseSectionStageTransitionIssueResponse;
import com.msm.sis.api.dto.course.CourseSectionStageTransitionResponse;
import com.msm.sis.api.dto.course.CourseSectionStagingResultResponse;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseSectionStatus;
import com.msm.sis.api.mapper.CourseSectionMapper;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import com.msm.sis.api.repository.CourseSectionMeetingRepository;
import com.msm.sis.api.repository.CourseSectionRepository;
import com.msm.sis.api.repository.CourseSectionStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class CourseSectionStageTransitionService {
    private static final String CANCELLED_STATUS_CODE = "CANCELLED";
    private static final Map<String, String> NEXT_STAGE_BY_STATUS_CODE = Map.of(
            "DRAFT", "PLANNED",
            "PLANNED", "IN_PROGRESS",
            "IN_PROGRESS", "COMPLETED"
    );
    private static final String SECTION_NOT_FOUND_ISSUE_CODE = "SECTION_NOT_FOUND";
    private static final String SECTION_NOT_IN_SUB_TERM_ISSUE_CODE = "SECTION_NOT_IN_SUB_TERM";
    private static final String SOURCE_STATUS_CHANGED_ISSUE_CODE = "SOURCE_STATUS_CHANGED";

    private final AcademicSubTermRepository academicSubTermRepository;
    private final CourseSectionInstructorRepository courseSectionInstructorRepository;
    private final CourseSectionMeetingRepository courseSectionMeetingRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionStatusRepository courseSectionStatusRepository;
    private final CourseSectionMapper courseSectionMapper;
    private final CourseSectionValidationService courseSectionValidationService;

    @Transactional
    public CourseSectionStageTransitionResponse transitionSections(CourseSectionStageTransitionRequest request) {
        validateRequest(request);

        Long subTermId = request.subTermId();
        String sourceStatusCode = normalizeStatusCode(request.sourceStatusCode(), "Source status");
        String targetStatusCode = normalizeStatusCode(request.targetStatusCode(), "Target status");
        List<Long> sectionIds = normalizeSectionIds(request.sectionIds());
        List<CourseSectionStageTransitionIssueResponse> blockingIssues = new ArrayList<>();
        CourseSectionStatus targetStatus = resolveTargetStatus(
                sourceStatusCode,
                targetStatusCode,
                blockingIssues
        );

        if (!academicSubTermRepository.existsById(subTermId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic sub term was not found.");
        }

        List<CourseSection> sections = courseSectionRepository.findAllForStagingByIdIn(sectionIds);
        addMissingSectionIssues(sectionIds, sections, blockingIssues);
        addSubTermIssues(subTermId, sections, blockingIssues);
        addSourceStatusIssues(sourceStatusCode, sections, blockingIssues);

        if (!blockingIssues.isEmpty()) {
            return response(subTermId, sourceStatusCode, targetStatusCode, List.of(), blockingIssues);
        }

        sections.forEach(section -> section.setStatus(targetStatus));
        List<CourseSection> savedSections = courseSectionRepository.saveAllAndFlush(sections);
        attachStagingAssociations(savedSections);

        List<CourseSectionStagingResultResponse> movedRows = savedSections.stream()
                .map(courseSectionMapper::toCourseSectionStagingResultResponse)
                .toList();

        return response(subTermId, sourceStatusCode, targetStatusCode, movedRows, List.of());
    }

    private void validateRequest(CourseSectionStageTransitionRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stage transition request is required.");
        }

        courseSectionValidationService.validatePositiveId(request.subTermId(), "Academic sub term id");

        if (request.sectionIds() == null || request.sectionIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one course section is required.");
        }
    }

    private CourseSectionStatus resolveTargetStatus(
            String sourceStatusCode,
            String targetStatusCode,
            List<CourseSectionStageTransitionIssueResponse> blockingIssues
    ) {
        if (CANCELLED_STATUS_CODE.equals(sourceStatusCode)) {
            blockingIssues.add(generalIssue(
                    "SOURCE_STATUS_CANCELLED",
                    "Cancelled course sections cannot be moved through the stage workflow."
            ));
            return null;
        }

        if (CANCELLED_STATUS_CODE.equals(targetStatusCode)) {
            blockingIssues.add(generalIssue(
                    "TARGET_STATUS_CANCELLED",
                    "Use the cancellation workflow to cancel course sections."
            ));
            return null;
        }

        List<CourseSectionStatus> activeStatuses = courseSectionStatusRepository.findAllByActiveTrueOrderBySortOrderAsc();
        CourseSectionStatus sourceStatus = findStatus(activeStatuses, sourceStatusCode);
        CourseSectionStatus requestedTargetStatus = findStatus(activeStatuses, targetStatusCode);

        if (sourceStatus == null) {
            blockingIssues.add(generalIssue(
                    "INVALID_SOURCE_STATUS",
                    "Source status code is invalid."
            ));
            return null;
        }

        if (requestedTargetStatus == null) {
            blockingIssues.add(generalIssue(
                    "INVALID_TARGET_STATUS",
                    "Target status code is invalid."
            ));
            return null;
        }

        if (!sourceStatus.isAllowLinearShift()) {
            blockingIssues.add(generalIssue(
                    "SOURCE_STATUS_TERMINAL",
                    "Course sections in " + sourceStatus.getName() + " status cannot be moved to another stage."
            ));
            return null;
        }

        String expectedTargetStatusCode = NEXT_STAGE_BY_STATUS_CODE.get(sourceStatusCode);

        if (expectedTargetStatusCode == null) {
            blockingIssues.add(generalIssue(
                    "SOURCE_STATUS_HAS_NO_NEXT_STAGE",
                    "Source status has no next stage."
            ));
            return null;
        }

        CourseSectionStatus expectedTargetStatus = findStatus(activeStatuses, expectedTargetStatusCode);

        if (expectedTargetStatus == null) {
            blockingIssues.add(generalIssue(
                    "INVALID_TARGET_STATUS",
                    "Expected target status code is not active."
            ));
            return null;
        }

        if (!expectedTargetStatus.getCode().equalsIgnoreCase(targetStatusCode)) {
            blockingIssues.add(generalIssue(
                    "TARGET_STATUS_NOT_NEXT_STAGE",
                    "Target status must be the next stage after "
                            + sourceStatus.getName()
                            + ": "
                            + expectedTargetStatus.getName()
                            + "."
            ));
            return null;
        }

        return expectedTargetStatus;
    }

    private CourseSectionStatus findStatus(List<CourseSectionStatus> statuses, String statusCode) {
        for (CourseSectionStatus status : statuses) {
            if (status.getCode().equalsIgnoreCase(statusCode)) {
                return status;
            }
        }

        return null;
    }

    private List<Long> normalizeSectionIds(List<Long> sectionIds) {
        Set<Long> uniqueSectionIds = new LinkedHashSet<>();

        for (Long sectionId : sectionIds) {
            courseSectionValidationService.validatePositiveId(sectionId, "Course section id");
            uniqueSectionIds.add(sectionId);
        }

        if (uniqueSectionIds.size() != sectionIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course section ids must be unique.");
        }

        return List.copyOf(uniqueSectionIds);
    }

    private void addMissingSectionIssues(
            List<Long> requestedSectionIds,
            List<CourseSection> sections,
            List<CourseSectionStageTransitionIssueResponse> blockingIssues
    ) {
        Set<Long> foundSectionIds = sections.stream()
                .map(CourseSection::getId)
                .collect(Collectors.toSet());
        requestedSectionIds.stream()
                .filter(sectionId -> !foundSectionIds.contains(sectionId))
                .map(sectionId -> new CourseSectionStageTransitionIssueResponse(
                        sectionId,
                        null,
                        null,
                        null,
                        SECTION_NOT_FOUND_ISSUE_CODE,
                        "Course section was not found."
                ))
                .forEach(blockingIssues::add);
    }

    private void addSubTermIssues(
            Long subTermId,
            List<CourseSection> sections,
            List<CourseSectionStageTransitionIssueResponse> blockingIssues
    ) {
        sections.stream()
                .filter(section -> section.getSubTerm() == null || !subTermId.equals(section.getSubTerm().getId()))
                .map(section -> sectionIssue(
                        section,
                        SECTION_NOT_IN_SUB_TERM_ISSUE_CODE,
                        "Course section does not belong to the requested academic sub term."
                ))
                .forEach(blockingIssues::add);
    }

    private void addSourceStatusIssues(
            String sourceStatusCode,
            List<CourseSection> sections,
            List<CourseSectionStageTransitionIssueResponse> blockingIssues
    ) {
        sections.stream()
                .filter(section -> section.getStatus() == null
                        || !sourceStatusCode.equalsIgnoreCase(section.getStatus().getCode()))
                .map(section -> sectionIssue(
                        section,
                        SOURCE_STATUS_CHANGED_ISSUE_CODE,
                        "Course section is no longer in " + sourceStatusCode + " status."
                ))
                .forEach(blockingIssues::add);
    }

    private void attachStagingAssociations(List<CourseSection> sections) {
        if (sections.isEmpty()) {
            return;
        }

        List<Long> sectionIds = sections.stream()
                .map(CourseSection::getId)
                .toList();
        Map<Long, List<CourseSectionInstructor>> instructorsBySectionId =
                courseSectionInstructorRepository.findAllByCourseSectionIdIn(sectionIds).stream()
                        .collect(Collectors.groupingBy(instructor -> instructor.getCourseSection().getId()));
        Map<Long, List<CourseSectionMeeting>> meetingsBySectionId =
                courseSectionMeetingRepository.findAllByCourseSectionIdIn(sectionIds).stream()
                        .collect(Collectors.groupingBy(meeting -> meeting.getCourseSection().getId()));

        sections.forEach(section -> {
            section.setInstructors(instructorsBySectionId.getOrDefault(section.getId(), List.of()));
            section.setMeetings(meetingsBySectionId.getOrDefault(section.getId(), List.of()));
        });
    }

    private String normalizeStatusCode(String statusCode, String label) {
        String trimmedStatusCode = trimToNull(statusCode);

        if (trimmedStatusCode == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " code is required.");
        }

        return trimmedStatusCode.toUpperCase(Locale.US);
    }

    private CourseSectionStageTransitionIssueResponse generalIssue(String issueCode, String message) {
        return new CourseSectionStageTransitionIssueResponse(
                null,
                null,
                null,
                null,
                issueCode,
                message
        );
    }

    private CourseSectionStageTransitionIssueResponse sectionIssue(
            CourseSection section,
            String issueCode,
            String message
    ) {
        CourseSectionStatus status = section.getStatus();

        return new CourseSectionStageTransitionIssueResponse(
                section.getId(),
                buildSectionCode(section),
                status == null ? null : status.getCode(),
                status == null ? null : status.getName(),
                issueCode,
                message
        );
    }

    private String buildSectionCode(CourseSection section) {
        if (section.getCourseOffering() == null
                || section.getCourseOffering().getCourseVersion() == null
                || section.getCourseOffering().getCourseVersion().getCourse() == null) {
            return section.getSectionLetter();
        }

        String subjectCode = section.getCourseOffering().getCourseVersion().getCourse().getSubject() == null
                ? null
                : section.getCourseOffering().getCourseVersion().getCourse().getSubject().getCode();
        String courseNumber = section.getCourseOffering().getCourseVersion().getCourse().getCourseNumber();

        return List.of(subjectCode, courseNumber, section.getSectionLetter()).stream()
                .map(trimToNullValue -> trimToNull(trimToNullValue))
                .filter(value -> value != null)
                .collect(Collectors.joining(" "));
    }

    private CourseSectionStageTransitionResponse response(
            Long subTermId,
            String sourceStatusCode,
            String targetStatusCode,
            List<CourseSectionStagingResultResponse> movedRows,
            List<CourseSectionStageTransitionIssueResponse> blockingIssues
    ) {
        return new CourseSectionStageTransitionResponse(
                subTermId,
                sourceStatusCode,
                targetStatusCode,
                movedRows,
                blockingIssues,
                movedRows.size(),
                blockingIssues.size()
        );
    }
}
