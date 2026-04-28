package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CreateCourseSectionRequest;
import com.msm.sis.api.dto.course.CourseSectionDetailResponse;
import com.msm.sis.api.dto.course.CourseSectionListResponse;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.entity.CourseOfferingSubTermId;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.mapper.CourseSectionMapper;
import com.msm.sis.api.repository.AcademicDivisionRepository;
import com.msm.sis.api.repository.CourseOfferingRepository;
import com.msm.sis.api.repository.CourseOfferingSubTermRepository;
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
    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionStatusRepository courseSectionStatusRepository;
    private final AcademicDivisionRepository academicDivisionRepository;
    private final DeliveryModeRepository deliveryModeRepository;
    private final GradingBasisRepository gradingBasisRepository;
    private final CourseSectionMapper courseSectionMapper;
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
                request.honors(),
                request.lab()
        );

        courseSectionValidationService.validateCredits(courseOffering, request.credits());

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
        courseSection.setLab(request.lab());
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
        courseSection.setGradingBasis(resolveRequiredReference(
                request.gradingBasisCode(),
                gradingBasisRepository::findByCode,
                "Grading basis"
        ));
        courseSection.setCredits(request.credits());
        courseSection.setCapacity(request.capacity());
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
        savedCourseSection.setInstructors(instructors);
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
    public CourseSectionDetailResponse getCourseSectionDetail(Long sectionId) {
        courseSectionValidationService.validatePositiveId(sectionId, "Course section id");

        CourseSection courseSection = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

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
