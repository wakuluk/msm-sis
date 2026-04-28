package com.msm.sis.api.service.course;

import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.entity.CourseOfferingSubTermId;
import com.msm.sis.api.repository.AcademicSubTermRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CourseOfferingSubTermService {
    private final AcademicSubTermRepository academicSubTermRepository;

    public List<Long> normalizeSubTermIds(List<Long> subTermIds) {
        if (subTermIds == null) {
            return List.of();
        }

        if (subTermIds.stream().anyMatch(Objects::isNull)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub term ids cannot contain null values."
            );
        }

        return subTermIds.stream().distinct().toList();
    }

    public List<AcademicSubTerm> getAcademicSubTermsForAcademicYear(
            Long academicYearId,
            List<Long> requestedSubTermIds
    ) {
        List<AcademicSubTerm> academicSubTerms =
                academicSubTermRepository.findAllByIdInOrderBySortOrderAsc(requestedSubTermIds);
        Set<Long> foundSubTermIds = academicSubTerms.stream()
                .map(AcademicSubTerm::getId)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        if (foundSubTermIds.size() != new LinkedHashSet<>(requestedSubTermIds).size()) {
            List<Long> missingSubTermIds = requestedSubTermIds.stream()
                    .filter(subTermId -> !foundSubTermIds.contains(subTermId))
                    .toList();
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Academic sub terms not found for ids: " + missingSubTermIds
            );
        }

        boolean hasMismatchedAcademicYear = academicSubTerms.stream()
                .anyMatch(subTerm -> subTerm.getAcademicYear() == null
                        || !Objects.equals(subTerm.getAcademicYear().getId(), academicYearId));

        if (hasMismatchedAcademicYear) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "All academic sub terms must belong to the target academic year."
            );
        }

        return academicSubTerms;
    }

    public CourseOfferingSubTerm buildCourseOfferingSubTerm(
            CourseOffering courseOffering,
            AcademicYear academicYear,
            AcademicSubTerm academicSubTerm
    ) {
        CourseOfferingSubTerm courseOfferingSubTerm = new CourseOfferingSubTerm();
        courseOfferingSubTerm.setId(new CourseOfferingSubTermId(courseOffering.getId(), academicSubTerm.getId()));
        courseOfferingSubTerm.setCourseOffering(courseOffering);
        courseOfferingSubTerm.setAcademicYear(academicYear);
        courseOfferingSubTerm.setSubTerm(academicSubTerm);
        return courseOfferingSubTerm;
    }
}
