package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.AcademicYearCourseOfferingSearchCriteria;
import com.msm.sis.api.dto.course.AcademicYearCourseOfferingSearchResponse;
import com.msm.sis.api.dto.course.AcademicYearCourseOfferingSearchResultResponse;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.repository.CourseOfferingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AcademicYearCourseOfferingSearchService {
    private final CourseMapper courseMapper;
    private final CourseOfferingRepository courseOfferingRepository;

    public AcademicYearCourseOfferingSearchResponse search(
            Long academicYearId,
            AcademicYearCourseOfferingSearchCriteria criteria
    ) {
        int page = criteria == null || criteria.getPage() == null ? 0 : criteria.getPage();
        int size = criteria == null || criteria.getSize() == null ? 25 : criteria.getSize();

        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }

        List<AcademicYearCourseOfferingSearchResultResponse> filteredResults = courseOfferingRepository
                .findAllByAcademicYear_Id(academicYearId, Sort.unsorted())
                .stream()
                .map(courseMapper::toAcademicYearCourseOfferingSearchResultResponse)
                .filter(result -> matchesSubTermId(criteria == null ? null : criteria.getSubTermId(), result))
                .filter(result -> matchesId(criteria == null ? null : criteria.getSchoolId(), result.schoolId()))
                .filter(result -> matchesId(criteria == null ? null : criteria.getDepartmentId(), result.departmentId()))
                .filter(result -> matchesId(criteria == null ? null : criteria.getSubjectId(), result.subjectId()))
                .filter(result -> containsIgnoreCase(result.courseCode(), criteria == null ? null : criteria.getCourseCode()))
                .filter(result -> containsIgnoreCase(result.title(), criteria == null ? null : criteria.getTitle()))
                .sorted(buildComparator(
                        criteria == null ? null : criteria.getSortBy(),
                        criteria == null ? null : criteria.getSortDirection()
                ))
                .toList();

        long totalElements = filteredResults.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, filteredResults.size());
        int toIndex = Math.min(fromIndex + size, filteredResults.size());
        List<AcademicYearCourseOfferingSearchResultResponse> pagedResults = filteredResults.subList(fromIndex, toIndex);

        return courseMapper.toAcademicYearCourseOfferingSearchResponse(
                pagedResults,
                page,
                size,
                totalElements,
                totalPages
        );
    }

    private boolean matchesId(Long expectedId, Long actualId) {
        return expectedId == null || Objects.equals(expectedId, actualId);
    }

    private boolean matchesSubTermId(
            Long expectedSubTermId,
            AcademicYearCourseOfferingSearchResultResponse result
    ) {
        return expectedSubTermId == null
                || result.subTerms().stream().anyMatch(
                        subTerm -> Objects.equals(subTerm.subTermId(), expectedSubTermId)
                );
    }

    private boolean containsIgnoreCase(String value, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }

        if (value == null) {
            return false;
        }

        return value.toLowerCase(java.util.Locale.ROOT)
                .contains(filter.trim().toLowerCase(java.util.Locale.ROOT));
    }

    private Comparator<AcademicYearCourseOfferingSearchResultResponse> buildComparator(
            String sortBy,
            String sortDirection
    ) {
        //TODO find a better solution for case switch
        Comparator<String> stringComparator = Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
        Comparator<AcademicYearCourseOfferingSearchResultResponse> comparator = switch (sortBy == null ? "courseCode" : sortBy) {
            case "schoolName" -> Comparator.comparing(
                    AcademicYearCourseOfferingSearchResultResponse::schoolName,
                    stringComparator
            );
            case "departmentName" -> Comparator.comparing(
                    AcademicYearCourseOfferingSearchResultResponse::departmentName,
                    stringComparator
            );
            case "subjectCode" -> Comparator.comparing(
                    AcademicYearCourseOfferingSearchResultResponse::subjectCode,
                    stringComparator
            );
            case "title" -> Comparator.comparing(
                    AcademicYearCourseOfferingSearchResultResponse::title,
                    stringComparator
            );
            case "courseCode" -> Comparator.comparing(
                    AcademicYearCourseOfferingSearchResultResponse::courseCode,
                    stringComparator
            );
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported sort field: " + sortBy
            );
        };

        if ("desc".equalsIgnoreCase(sortDirection)) {
            comparator = comparator.reversed();
        }

        return comparator.thenComparing(
                AcademicYearCourseOfferingSearchResultResponse::courseCode,
                stringComparator
        ).thenComparing(
                AcademicYearCourseOfferingSearchResultResponse::courseOfferingId,
                Comparator.nullsLast(Long::compareTo)
        );
    }
}
