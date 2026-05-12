package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CreateCourseSectionRequest;
import com.msm.sis.api.dto.course.CourseSectionDetailResponse;
import com.msm.sis.api.dto.course.CourseSectionListResponse;
import com.msm.sis.api.dto.course.CourseSectionStagingListResponse;
import com.msm.sis.api.dto.course.CourseSectionStagingResultResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.entity.CourseOfferingSubTermId;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.mapper.CourseSectionMapper;
import com.msm.sis.api.repository.AcademicDivisionRepository;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import com.msm.sis.api.repository.CourseOfferingRepository;
import com.msm.sis.api.repository.CourseOfferingSubTermRepository;
import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import com.msm.sis.api.repository.CourseSectionMeetingRepository;
import com.msm.sis.api.repository.CourseSectionRepository;
import com.msm.sis.api.repository.CourseSectionStatusRepository;
import com.msm.sis.api.repository.DeliveryModeRepository;
import com.msm.sis.api.repository.GradingBasisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.TextUtils.containsIgnoreCase;
import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class CourseSectionService {
    //TODO need a better solution
    private static final Map<String, String> SORT_FIELDS = Map.of(
            "sectionLetter", "sectionLetter",
            "title", "title",
            "status", "status.name",
            "deliveryMode", "deliveryMode.name",
            "credits", "credits",
            "capacity", "capacity",
            "startDate", "startDate"
    );

    private static final String DEFAULT_SECTION_STATUS_CODE = "DRAFT";
    private final CourseSectionAssignmentService courseSectionAssignmentService;
    private final CourseOfferingRepository courseOfferingRepository;
    private final CourseOfferingSubTermRepository courseOfferingSubTermRepository;
    private final CourseSectionInstructorRepository courseSectionInstructorRepository;
    private final CourseSectionMeetingRepository courseSectionMeetingRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionStatusRepository courseSectionStatusRepository;
    private final AcademicSubTermRepository academicSubTermRepository;
    private final AcademicDivisionRepository academicDivisionRepository;
    private final DeliveryModeRepository deliveryModeRepository;
    private final GradingBasisRepository gradingBasisRepository;
    private final CourseSectionMapper courseSectionMapper;
    private final CourseSectionAccessService courseSectionAccessService;
    private final CourseSectionInstructorConflictService courseSectionInstructorConflictService;
    private final CourseSectionValidationService courseSectionValidationService;

    @Transactional
    public CourseSectionDetailResponse createCourseSection(
            Long courseOfferingId,
            CreateCourseSectionRequest request
    ) {
        courseSectionValidationService.validatePositiveId(courseOfferingId, "Course offering id");
        courseSectionValidationService.validateCreateRequest(request);

        Long subTermId = request.subTermId();
        CourseOffering courseOffering = courseOfferingRepository.findById(courseOfferingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        CourseOfferingSubTerm courseOfferingSubTerm = courseOfferingSubTermRepository
                .findById(new CourseOfferingSubTermId(courseOfferingId, subTermId))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Course offering is not assigned to the requested academic sub term."
                ));

        String sectionLetter = request.sectionLetter().trim().toUpperCase(Locale.US);
        courseSectionValidationService.validateUniqueSectionIdentity(
                courseOfferingId,
                subTermId,
                sectionLetter,
                request.honors()
        );

        courseSectionValidationService.validateCredits(courseOffering, request.credits());
        courseSectionInstructorConflictService.assertNoConflicts(
                null,
                courseOfferingSubTerm.getSubTerm(),
                request.instructors(),
                request.meetings()
        );

        CourseSection courseSection = new CourseSection();
        courseSection.setCourseOffering(courseOffering);
        courseSection.setSubTerm(courseOfferingSubTerm.getSubTerm());
        courseSection.setAcademicDivision(resolveOptionalReference(
                request.academicDivisionCode(),
                academicDivisionRepository::findByCode,
                "Academic division"
        ));
        courseSection.setSectionLetter(sectionLetter);
        courseSection.setTitle(trimToNull(request.title()));
        courseSection.setHonors(request.honors());
        courseSection.setStatus(resolveRequiredReference(
                Optional.ofNullable(trimToNull(request.statusCode())).orElse(DEFAULT_SECTION_STATUS_CODE),
                courseSectionStatusRepository::findByCode,
                "Course section status"
        ));
        courseSection.setDeliveryMode(resolveRequiredReference(
                request.deliveryModeCode(),
                deliveryModeRepository::findByCode,
                "Delivery mode"
        ));
        GradingBasis gradingBasis = resolveRequiredReference(
                request.gradingBasisCode(),
                gradingBasisRepository::findByCode,
                "Grading basis"
        );
        courseSectionValidationService.validateSectionGradingBasis(gradingBasis);
        courseSection.setGradingBasis(gradingBasis);
        courseSection.setCredits(request.credits());
        courseSection.setCapacity(request.capacity());
        courseSection.setHardCapacity(request.hardCapacity());
        courseSection.setWaitlistAllowed(request.waitlistAllowed());
        courseSection.setStartDate(request.startDate());
        courseSection.setEndDate(request.endDate());
        courseSection.setLinkedGroupCode(trimToNull(request.linkedGroupCode()));
        courseSection.setNotes(trimToNull(request.notes()));

        CourseSection savedCourseSection = courseSectionRepository.saveAndFlush(courseSection);
        List<CourseSectionInstructor> instructors = courseSectionAssignmentService.createInstructors(
                savedCourseSection,
                request.instructors()
        );
        List<CourseSectionMeeting> meetings = courseSectionAssignmentService.createMeetings(
                savedCourseSection,
                request.meetings()
        );
        savedCourseSection.setInstructors(
                instructors.isEmpty()
                        ? List.of()
                        : courseSectionInstructorRepository.findAllByCourseSectionId(savedCourseSection.getId())
        );
        savedCourseSection.setMeetings(meetings);

        return courseSectionMapper.toCourseSectionDetailResponse(savedCourseSection);
    }

    @Transactional(readOnly = true)
    public CourseSectionListResponse getCourseSectionsForOffering(
            Long courseOfferingId,
            Long subTermId,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        courseSectionValidationService.validatePositiveId(courseOfferingId, "Course offering id");
        courseSectionValidationService.validatePageRequest(page, size);

        Pageable pageable = PageRequest.of(page, size, buildSort(sortBy, sortDirection));
        Page<CourseSection> courseSectionsPage = subTermId == null
                ? courseSectionRepository.findAllByCourseOfferingId(courseOfferingId, pageable)
                : getCourseSectionsForOfferingAndSubTerm(courseOfferingId, subTermId, pageable);

        return courseSectionMapper.toCourseSectionListResponse(
                courseOfferingId,
                subTermId,
                courseSectionsPage
        );
    }

    @Transactional(readOnly = true)
    public CourseSectionStagingListResponse getCourseSectionsForSubTermStaging(
            Long subTermId,
            String sourceStatusCode,
            String course,
            String section,
            String instructor,
            String meetingPattern,
            String room,
            String status
    ) {
        courseSectionValidationService.validatePositiveId(subTermId, "Academic sub term id");

        if (!academicSubTermRepository.existsById(subTermId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic sub term was not found.");
        }

        List<CourseSection> sections = courseSectionRepository.findAllForStagingBySubTermId(subTermId);
        attachStagingAssociations(sections);

        List<CourseSectionStagingResultResponse> results = sections.stream()
                .map(courseSectionMapper::toCourseSectionStagingResultResponse)
                .filter(row -> matchesStagingFilters(
                        row,
                        sourceStatusCode,
                        course,
                        section,
                        instructor,
                        meetingPattern,
                        room,
                        status
                ))
                .toList();

        return new CourseSectionStagingListResponse(subTermId, results, results.size());
    }

    @Transactional(readOnly = true)
    public CourseSectionDetailResponse getCourseSectionDetail(
            Long sectionId,
            Long userId,
            List<String> roles
    ) {
        courseSectionValidationService.validatePositiveId(sectionId, "Course section id");

        CourseSection courseSection = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        courseSectionAccessService.assertCanViewSection(sectionId, userId, roles);

        return courseSectionMapper.toCourseSectionDetailResponse(courseSection);
    }

    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction direction = parseSortDirection(sortDirection);
        String normalizedSortBy = sortBy == null ? "sectionLetter" : sortBy.trim();
        String sortPath = SORT_FIELDS.get(normalizedSortBy);

        if (sortPath == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: " + String.join(", ", SORT_FIELDS.keySet()) + "."
            );
        }

        return Sort.by(direction, sortPath).and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Page<CourseSection> getCourseSectionsForOfferingAndSubTerm(
            Long courseOfferingId,
            Long subTermId,
            Pageable pageable
    ) {
        courseSectionValidationService.validatePositiveId(subTermId, "Academic sub term id");

        return courseSectionRepository.findAllByCourseOfferingIdAndSubTermId(
                courseOfferingId,
                subTermId,
                pageable
        );
    }

    private boolean matchesStagingFilters(
            CourseSectionStagingResultResponse row,
            String sourceStatusCode,
            String course,
            String section,
            String instructor,
            String meetingPattern,
            String room,
            String status
    ) {
        return matchesStatus(row, sourceStatusCode)
                && matchesCourse(row, course)
                && matchesSection(row, section)
                && matchesInstructor(row, instructor)
                && containsIgnoreCase(row.meetingSummary(), meetingPattern)
                && containsIgnoreCase(row.roomSummary(), room)
                && matchesStatus(row, status);
    }

    private boolean matchesStatus(CourseSectionStagingResultResponse row, String statusFilter) {
        String normalizedStatusFilter = trimToNull(statusFilter);

        if (normalizedStatusFilter == null) {
            return true;
        }

        return normalizedStatusFilter.equalsIgnoreCase(row.statusCode())
                || normalizedStatusFilter.equalsIgnoreCase(row.statusName())
                || containsIgnoreCase(row.statusCode(), normalizedStatusFilter)
                || containsIgnoreCase(row.statusName(), normalizedStatusFilter);
    }

    private boolean matchesCourse(CourseSectionStagingResultResponse row, String courseFilter) {
        return containsIgnoreCase(row.courseCode(), courseFilter)
                || containsIgnoreCase(row.courseTitle(), courseFilter)
                || containsIgnoreCase(row.title(), courseFilter);
    }

    private boolean matchesSection(CourseSectionStagingResultResponse row, String sectionFilter) {
        return containsIgnoreCase(row.displaySectionCode(), sectionFilter)
                || containsIgnoreCase(row.sectionLetter(), sectionFilter)
                || containsIgnoreCase(row.title(), sectionFilter);
    }

    private boolean matchesInstructor(CourseSectionStagingResultResponse row, String instructorFilter) {
        String normalizedInstructorFilter = trimToNull(instructorFilter);

        if (normalizedInstructorFilter == null) {
            return true;
        }

        return containsIgnoreCase(row.primaryInstructorName(), normalizedInstructorFilter)
                || containsIgnoreCase(row.instructorSummary(), normalizedInstructorFilter)
                || row.instructors().stream().anyMatch(instructor ->
                containsIgnoreCase(instructor.firstName(), normalizedInstructorFilter)
                        || containsIgnoreCase(instructor.lastName(), normalizedInstructorFilter)
                        || containsIgnoreCase(instructor.email(), normalizedInstructorFilter)
                        || containsIgnoreCase(instructor.roleName(), normalizedInstructorFilter)
        );
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

    private <T> T resolveRequiredReference(
            String code,
            Function<String, Optional<T>> lookup,
            String label
    ) {
        String normalizedCode = normalizeCode(code, label);

        return lookup.apply(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        label + " code is invalid."
                ));
    }

    private <T> T resolveOptionalReference(
            String code,
            Function<String, Optional<T>> lookup,
            String label
    ) {
        String trimmedCode = trimToNull(code);

        if (trimmedCode == null) {
            return null;
        }

        return resolveRequiredReference(trimmedCode, lookup, label);
    }

    private String normalizeCode(String code, String label) {
        String trimmedCode = trimToNull(code);

        if (trimmedCode == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    label + " code is required."
            );
        }

        return trimmedCode.toUpperCase(Locale.US);
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        try {
            return Sort.Direction.fromString(sortDirection == null ? "asc" : sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }

}
