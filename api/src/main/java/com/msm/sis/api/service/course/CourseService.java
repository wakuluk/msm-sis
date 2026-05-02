package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.*;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.repository.AcademicSubjectRepository;
import com.msm.sis.api.repository.CourseRepository;
import com.msm.sis.api.repository.CourseVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static com.msm.sis.api.util.CourseGroupingUtils.collectCourseIds;
import static com.msm.sis.api.util.CourseGroupingUtils.indexFirstVersionByCourseId;
import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final AcademicSubjectRepository academicSubjectRepository;
    private final CourseRepository courseRepository;
    private final CourseVersionRepository courseVersionRepository;
    private final CourseMapper courseMapper;

    @Transactional
    public CourseVersionDetailResponse createCourse(CreateCourseRequest request) {
        validateCreateCourseRequest(request);
        validateCreateCourseVersionRequest(request.initialVersion());

        AcademicSubject subject = academicSubjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject id is invalid."));
        String courseNumber = request.courseNumber().trim();

        if (courseRepository.existsBySubject_CodeAndCourseNumber(subject.getCode(), courseNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A course with this subject and course number already exists."
            );
        }

        Course course = courseMapper.toCourse(subject, courseNumber, request);
        Course savedCourse = courseRepository.save(course);
        CourseVersion savedCourseVersion = createInitialCourseVersion(savedCourse, request.initialVersion());
        return courseMapper.toCourseVersionDetailResponse(savedCourseVersion);
    }

    @Transactional
    public CourseVersionDetailResponse createCourseVersion(
            Long courseId,
            CreateCourseVersionRequest request
    ) {
        requirePositiveId(courseId, "Course id");

        validateCreateCourseVersionRequest(request);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        courseVersionRepository.findCurrentCourseVersionsByCourseId(courseId)
                .forEach(courseVersion -> courseVersion.setCurrentVersion(false));

        int nextVersionNumber = courseVersionRepository.findLatestCourseVersionByCourseId(courseId)
                .map(courseVersion -> courseVersion.getVersionNumber() + 1)
                .orElse(1);

        CourseVersion courseVersion = courseMapper.toCourseVersion(
                course,
                nextVersionNumber,
                request,
                normalizeCatalogDescription(request.catalogDescription())
        );
        CourseVersion savedCourseVersion = courseVersionRepository.save(courseVersion);
        return courseMapper.toCourseVersionDetailResponse(savedCourseVersion);
    }

    private CourseVersion createInitialCourseVersion(Course course, CreateCourseVersionRequest request) {
        return courseVersionRepository.save(courseMapper.toCourseVersion(
                course,
                1,
                request,
                normalizeCatalogDescription(request.catalogDescription())
        ));
    }

    @Transactional(readOnly = true)
    public CourseSearchResponse searchCourses(
            CourseSearchCriteria criteria,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        validatePageRequest(page, size, 100);

        CourseSearchCriteria effectiveCriteria = criteria == null ? new CourseSearchCriteria() : criteria;
        List<Course> courses = courseRepository.findAll();
        Map<Long, CourseVersion> currentVersionsByCourseId = buildCurrentVersionsByCourseId(courses);

        List<CourseSearchResultResponse> filteredResults = courses.stream()
                .filter(course -> CourseSearchFilter.matches(
                        course,
                        currentVersionsByCourseId.get(course.getId()),
                        effectiveCriteria
                ))
                .sorted(CourseSearchSort.buildComparator(
                        sortBy == null ? effectiveCriteria.getSortBy() : sortBy,
                        sortDirection == null ? effectiveCriteria.getSortDirection() : sortDirection,
                        currentVersionsByCourseId
                ))
                .map(course -> courseMapper.toCourseSearchResultResponse(
                        course,
                        currentVersionsByCourseId.get(course.getId())
                ))
                .toList();

        long totalElements = filteredResults.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, filteredResults.size());
        int toIndex = Math.min(fromIndex + size, filteredResults.size());

        return courseMapper.toCourseSearchResponse(
                filteredResults.subList(fromIndex, toIndex),
                page,
                size,
                totalElements,
                totalPages
        );
    }

    @Transactional(readOnly = true)
    public CourseVersionSearchResponse getCourseVersionsForCourseId(
            Long courseId,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        requirePositiveId(courseId, "Course id");

        validatePageRequest(page, size, 100);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Page<CourseVersion> courseVersionsPage = courseVersionRepository.searchCourseVersionsByCourseId(
                courseId,
                PageRequest.of(page, size, buildCourseVersionSort(sortBy, sortDirection))
        );

        return courseMapper.toCourseVersionSearchResponse(courseVersionsPage, course);
    }

    private Sort buildCourseVersionSort(String sortBy, String sortDirection) {
        Sort.Direction direction = parseSortDirection(sortDirection);
        String normalizedSortBy = sortBy == null ? "versionNumber" : sortBy.trim();

        Sort primarySort = switch (normalizedSortBy) {
            case "versionNumber" -> Sort.by(direction, "versionNumber");
            case "title" -> Sort.by(direction, "title");
            case "credits" -> Sort.by(direction, "minCredits")
                    .and(Sort.by(direction, "maxCredits"))
                    .and(Sort.by(direction, "variableCredit"));
            case "current" -> Sort.by(direction, "currentVersion");
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: versionNumber, title, credits, current."
            );
        };

        return primarySort
                .and(Sort.by(Sort.Direction.DESC, "versionNumber"))
                .and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        return parseDirection(sortDirection, Sort.Direction.DESC);
    }

    private void validateCreateCourseVersionRequest(CreateCourseVersionRequest request) {
        requireRequestBody(request);

        BigDecimal minCredits = request.minCredits();
        BigDecimal maxCredits = request.maxCredits();

        if (request.variableCredit()) {
            if (minCredits.compareTo(maxCredits) > 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Min credits must be less than or equal to max credits for variable-credit courses."
                );
            }
            return;
        }

        if (minCredits.compareTo(maxCredits) != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Min credits and max credits must match for non-variable-credit courses."
            );
        }
    }

    private void validateCreateCourseRequest(CreateCourseRequest request) {
        requireRequestBody(request);

        requirePositiveId(request.subjectId(), "Subject id");

        if (request.courseNumber() == null || request.courseNumber().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course number is required.");
        }
    }

    private String normalizeCatalogDescription(String catalogDescription) {
        if (catalogDescription == null) {
            return null;
        }

        String trimmedCatalogDescription = catalogDescription.trim();
        return trimmedCatalogDescription.isEmpty() ? null : trimmedCatalogDescription;
    }

    private Map<Long, CourseVersion> buildCurrentVersionsByCourseId(List<Course> courses) {
        List<Long> courseIds = collectCourseIds(courses);

        if (courseIds.isEmpty()) {
            return Map.of();
        }

        return indexFirstVersionByCourseId(courseVersionRepository.findCurrentCourseVersionsByCourseIds(courseIds));
    }

}
