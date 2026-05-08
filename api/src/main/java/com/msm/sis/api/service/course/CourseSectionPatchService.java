package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CourseSectionDetailResponse;
import com.msm.sis.api.dto.course.PatchCourseSectionRequest;
import com.msm.sis.api.entity.AcademicDivision;
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
    private final CourseSectionRepository courseSectionRepository;
    private final CourseSectionStatusRepository courseSectionStatusRepository;
    private final AcademicDivisionRepository academicDivisionRepository;
    private final DeliveryModeRepository deliveryModeRepository;
    private final GradingBasisRepository gradingBasisRepository;
    private final CourseSectionMapper courseSectionMapper;
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
                ? request.getSectionLetter().getValue().trim().toUpperCase(Locale.US)
                : courseSection.getSectionLetter();
        boolean finalHonors = request.getHonors().orElse(courseSection.isHonors());

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
            courseSection.setSubTerm(courseOfferingSubTerm.getSubTerm());
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

        courseSectionMapper.applyPatch(
                courseSection,
                request,
                finalSectionLetter,
                status,
                academicDivision,
                deliveryMode,
                gradingBasis
        );

        CourseSection savedCourseSection = courseSectionRepository.saveAndFlush(courseSection);

        if (request.getInstructors().isPresent()) {
            List<CourseSectionInstructor> instructors = courseSectionAssignmentService.replaceInstructors(
                    savedCourseSection,
                    request.getInstructors().getValue()
            );
            savedCourseSection.setInstructors(instructors);
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
