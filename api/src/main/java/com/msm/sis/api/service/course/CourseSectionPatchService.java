package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CourseSectionDetailResponse;
import com.msm.sis.api.dto.course.CreateCourseSectionInstructorRequest;
import com.msm.sis.api.dto.course.CreateCourseSectionMeetingRequest;
import com.msm.sis.api.dto.course.PatchCourseSectionRequest;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.entity.CourseOfferingSubTermId;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionInstructor;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseSectionStatus;
import com.msm.sis.api.entity.DeliveryMode;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.mapper.CourseSectionMapper;
import com.msm.sis.api.patch.PatchValue;
import com.msm.sis.api.repository.AcademicDivisionRepository;
import com.msm.sis.api.repository.CourseOfferingSubTermRepository;
import com.msm.sis.api.repository.CourseSectionInstructorRepository;
import com.msm.sis.api.repository.CourseSectionRepository;
import com.msm.sis.api.repository.CourseSectionStatusRepository;
import com.msm.sis.api.repository.DeliveryModeRepository;
import com.msm.sis.api.repository.GradingBasisRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.function.Function;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class CourseSectionPatchService {
    private final CourseSectionAssignmentService courseSectionAssignmentService;
    private final CourseOfferingSubTermRepository courseOfferingSubTermRepository;
    private final CourseSectionInstructorRepository courseSectionInstructorRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionStatusRepository courseSectionStatusRepository;
    private final AcademicDivisionRepository academicDivisionRepository;
    private final DeliveryModeRepository deliveryModeRepository;
    private final GradingBasisRepository gradingBasisRepository;
    private final CourseSectionMapper courseSectionMapper;
    private final CourseSectionInstructorConflictService courseSectionInstructorConflictService;
    private final CourseSectionValidationService courseSectionValidationService;

    @Transactional
    public CourseSectionDetailResponse patchCourseSection(
            Long sectionId,
            PatchCourseSectionRequest request
    ) {
        courseSectionValidationService.validatePositiveId(sectionId, "Course section id");

        CourseSection courseSection = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        courseSectionValidationService.validatePatchRequest(request, courseSection);

        CourseOffering courseOffering = courseSection.getCourseOffering();
        Long courseOfferingId = courseOffering.getId();
        Long finalSubTermId = request.getSubTermId().orElse(courseSection.getSubTerm().getId());
        String finalSectionLetter = request.getSectionLetter().isPresent()
                ? courseSectionValidationService.normalizeSectionLetter(request.getSectionLetter().getValue())
                : courseSection.getSectionLetter();
        boolean finalHonors = request.getHonors().orElse(courseSection.isHonors());
        AcademicSubTerm finalSubTerm = courseSection.getSubTerm();

        if (request.getCredits().isPresent()) {
            courseSectionValidationService.validateCredits(courseOffering, request.getCredits().getValue());
        }

        if (sectionIdentityChanged(request)) {
            validateUniqueSectionIdentity(
                    courseOfferingId,
                    finalSubTermId,
                    finalSectionLetter,
                    finalHonors,
                    sectionId
            );
        }

        if (request.getSubTermId().isPresent()) {
            CourseOfferingSubTerm courseOfferingSubTerm = courseOfferingSubTermRepository
                    .findById(new CourseOfferingSubTermId(courseOfferingId, finalSubTermId))
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Course offering is not assigned to the requested academic sub term."
                    ));
            finalSubTerm = courseOfferingSubTerm.getSubTerm();
            courseSection.setSubTerm(finalSubTerm);
        }

        PatchValue<CourseSectionStatus> status = resolveRequiredReferencePatch(
                request.getStatusCode(),
                courseSectionStatusRepository::findByCode,
                "Course section status"
        );
        PatchValue<AcademicDivision> academicDivision = resolveOptionalReferencePatch(
                request.getAcademicDivisionCode(),
                academicDivisionRepository::findByCode,
                "Academic division"
        );
        PatchValue<DeliveryMode> deliveryMode = resolveRequiredReferencePatch(
                request.getDeliveryModeCode(),
                deliveryModeRepository::findByCode,
                "Delivery mode"
        );
        PatchValue<GradingBasis> gradingBasis = resolveRequiredReferencePatch(
                request.getGradingBasisCode(),
                gradingBasisRepository::findByCode,
                "Grading basis"
        );
        if (gradingBasis.isPresent()) {
            courseSectionValidationService.validateSectionGradingBasis(gradingBasis.getValue());
        }

        CourseSectionStatus finalStatus = status.isPresent() ? status.getValue() : courseSection.getStatus();
        List<CreateCourseSectionInstructorRequest> finalInstructors = request.getInstructors().isPresent()
                ? request.getInstructors().getValue()
                : toInstructorRequests(courseSection.getInstructors());
        List<CreateCourseSectionMeetingRequest> finalMeetings = request.getMeetings().isPresent()
                ? request.getMeetings().getValue()
                : toMeetingRequests(courseSection.getMeetings());

        courseSectionMapper.applyPatch(
                courseSection,
                request,
                finalSectionLetter,
                status,
                academicDivision,
                deliveryMode,
                gradingBasis
        );

        if (!isCancelled(finalStatus)) {
            courseSectionInstructorConflictService.assertNoConflicts(
                    sectionId,
                    finalSubTerm,
                    finalInstructors,
                    finalMeetings
            );
        }

        CourseSection savedCourseSection = courseSectionRepository.saveAndFlush(courseSection);

        if (request.getInstructors().isPresent()) {
            List<CourseSectionInstructor> instructors = courseSectionAssignmentService.replaceInstructors(
                    savedCourseSection,
                    request.getInstructors().getValue()
            );
            savedCourseSection.setInstructors(
                    instructors.isEmpty()
                            ? List.of()
                            : courseSectionInstructorRepository.findAllByCourseSectionId(savedCourseSection.getId())
            );
        }

        if (request.getMeetings().isPresent()) {
            List<CourseSectionMeeting> meetings = courseSectionAssignmentService.replaceMeetings(
                    savedCourseSection,
                    request.getMeetings().getValue()
            );
            savedCourseSection.setMeetings(meetings);
        }

        return courseSectionMapper.toCourseSectionDetailResponse(savedCourseSection);
    }

    private void validateUniqueSectionIdentity(
            Long courseOfferingId,
            Long subTermId,
            String sectionLetter,
            boolean honors,
            Long sectionId
    ) {
        if (courseSectionRepository.existsByNaturalKeyExcludingSection(
                courseOfferingId,
                subTermId,
                sectionLetter,
                honors,
                sectionId
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Course section already exists for this offering and sub term."
            );
        }
    }

    private boolean sectionIdentityChanged(PatchCourseSectionRequest request) {
        return request.getSubTermId().isPresent()
                || request.getSectionLetter().isPresent()
                || request.getHonors().isPresent();
    }

    private List<CreateCourseSectionInstructorRequest> toInstructorRequests(List<CourseSectionInstructor> instructors) {
        if (instructors == null || instructors.isEmpty()) {
            return List.of();
        }

        return instructors.stream()
                .filter(instructor -> instructor.getInstructorStaff() != null)
                .map(instructor -> new CreateCourseSectionInstructorRequest(
                        instructor.getInstructorStaff().getId(),
                        instructor.getRole() == null ? null : instructor.getRole().getCode(),
                        instructor.isCanViewGrades(),
                        instructor.isCanManageGrades()
                ))
                .toList();
    }

    private List<CreateCourseSectionMeetingRequest> toMeetingRequests(List<CourseSectionMeeting> meetings) {
        if (meetings == null || meetings.isEmpty()) {
            return List.of();
        }

        return meetings.stream()
                .map(meeting -> new CreateCourseSectionMeetingRequest(
                        meeting.getMeetingType() == null ? null : meeting.getMeetingType().getCode(),
                        meeting.getDayOfWeek(),
                        meeting.getStartTime(),
                        meeting.getEndTime(),
                        meeting.getBuilding(),
                        meeting.getRoom(),
                        meeting.getStartDate(),
                        meeting.getEndDate(),
                        meeting.getSequenceNumber()
                ))
                .toList();
    }

    private boolean isCancelled(CourseSectionStatus status) {
        return status != null && "CANCELLED".equalsIgnoreCase(status.getCode());
    }

    private <T> PatchValue<T> resolveRequiredReferencePatch(
            PatchValue<String> value,
            Function<String, Optional<T>> lookup,
            String label
    ) {
        if (!value.isPresent()) {
            return PatchValue.absent();
        }

        return PatchValue.of(resolveRequiredReference(value.orElse(null), lookup, label));
    }

    private <T> PatchValue<T> resolveOptionalReferencePatch(
            PatchValue<String> value,
            Function<String, Optional<T>> lookup,
            String label
    ) {
        if (!value.isPresent()) {
            return PatchValue.absent();
        }

        return PatchValue.of(resolveOptionalReference(value.orElse(null), lookup, label));
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
}
