package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.PatchCourseOfferingRequest;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.repository.CourseOfferingRepository;
import com.msm.sis.api.repository.CourseOfferingSubTermRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

import static com.msm.sis.api.util.TextUtils.trimToNull;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class CourseOfferingPatchService {
    private final CourseOfferingRepository courseOfferingRepository;
    private final CourseOfferingSubTermRepository courseOfferingSubTermRepository;
    private final CourseOfferingSubTermService courseOfferingSubTermService;
    private final EntityManager entityManager;

    public void patchCourseOffering(
            Long courseOfferingId,
            PatchCourseOfferingRequest request
    ) {
        requirePositiveId(courseOfferingId, "Course offering id");
        requireRequestBody(request);

        if (request.getCourseOfferingId() != null
                && !Objects.equals(request.getCourseOfferingId(), courseOfferingId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course offering id in the request does not match the target course offering."
            );
        }

        CourseOffering courseOffering = courseOfferingRepository.findById(courseOfferingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        boolean changed = replaceSubTermsIfPresent(courseOfferingId, courseOffering, request);

        if (request.getNotes().isPresent()) {
            String notes = trimToNull(request.getNotes().getValue());
            if (!Objects.equals(courseOffering.getNotes(), notes)) {
                courseOffering.setNotes(notes);
                changed = true;
            }
        }

        if (!changed) {
            return;
        }

        courseOfferingRepository.save(courseOffering);
        entityManager.flush();
        entityManager.clear();
    }

    private boolean replaceSubTermsIfPresent(
            Long courseOfferingId,
            CourseOffering courseOffering,
            PatchCourseOfferingRequest request
    ) {
        if (!request.getSubTermIds().isPresent()) {
            return false;
        }

        Long academicYearId = courseOffering.getAcademicYear() == null
                ? null
                : courseOffering.getAcademicYear().getId();
        if (academicYearId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        List<Long> requestedSubTermIds = courseOfferingSubTermService.normalizeSubTermIds(
                request.getSubTermIds().getValue()
        );
        if (requestedSubTermIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "At least one academic sub term is required."
            );
        }

        List<AcademicSubTerm> academicSubTerms = courseOfferingSubTermService.getAcademicSubTermsForAcademicYear(
                academicYearId,
                requestedSubTermIds
        );
        List<Long> existingSubTermIds = courseOffering.getCourseOfferingSubTerms().stream()
                .map(CourseOfferingSubTerm::getSubTerm)
                .filter(Objects::nonNull)
                .map(AcademicSubTerm::getId)
                .sorted()
                .toList();
        List<Long> normalizedRequestedSubTermIds = academicSubTerms.stream()
                .map(AcademicSubTerm::getId)
                .sorted()
                .toList();

        if (Objects.equals(existingSubTermIds, normalizedRequestedSubTermIds)) {
            return false;
        }

        courseOfferingSubTermRepository.deleteAllByCourseOffering_Id(courseOfferingId);
        entityManager.flush();

        List<CourseOfferingSubTerm> courseOfferingSubTerms = academicSubTerms.stream()
                .map(academicSubTerm -> courseOfferingSubTermService.buildCourseOfferingSubTerm(
                        courseOffering,
                        courseOffering.getAcademicYear(),
                        academicSubTerm
                ))
                .toList();
        courseOfferingSubTermRepository.saveAll(courseOfferingSubTerms);
        return true;
    }
}
