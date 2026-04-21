package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.*;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.mapper.CourseMapper;
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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;
    private final CourseVersionRepository courseVersionRepository;
    private final CourseMapper courseMapper;

    @Transactional
    public CourseVersionDetailResponse createCourseVersion(
            Long courseId,
            CreateCourseVersionRequest request
    ) {
        if (courseId == null || courseId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course id must be a positive number.");
        }

        validateCreateCourseVersionRequest(request);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        courseVersionRepository.findCurrentCourseVersionsByCourseId(courseId)
                .forEach(courseVersion -> courseVersion.setCurrentVersion(false));

        int nextVersionNumber = courseVersionRepository.findLatestCourseVersionByCourseId(courseId)
                .map(courseVersion -> courseVersion.getVersionNumber() + 1)
                .orElse(1);

        CourseVersion courseVersion = new CourseVersion();
        courseVersion.setCourse(course);
        courseVersion.setVersionNumber(nextVersionNumber);
        courseVersion.setTitle(request.title().trim());
        courseVersion.setCatalogDescription(normalizeCatalogDescription(request.catalogDescription()));
        courseVersion.setMinCredits(request.minCredits());
        courseVersion.setMaxCredits(request.maxCredits());
        courseVersion.setVariableCredit(request.variableCredit());
        courseVersion.setCurrentVersion(true);

        CourseVersion savedCourseVersion = courseVersionRepository.save(courseVersion);
        return courseMapper.toCourseVersionDetailResponse(savedCourseVersion);
    }

    @Transactional(readOnly = true)
    public CourseSearchResponse searchCourses(
            CourseSearchCriteria criteria,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }

        CourseSearchCriteria effectiveCriteria = criteria == null ? new CourseSearchCriteria() : criteria;
        List<Course> courses = courseRepository.findAll();
        Map<Long, CourseVersion> currentVersionsByCourseId = buildCurrentVersionsByCourseId(courses);

        List<CourseSearchResultResponse> filteredResults = courses.stream()
                .filter(course -> matchesCourseSearchCriteria(
                        course,
                        currentVersionsByCourseId.get(course.getId()),
                        effectiveCriteria
                ))
                .sorted(buildCourseSearchComparator(
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
        if (courseId == null || courseId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course id must be a positive number.");
        }

        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must be zero or greater.");
        }

        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100.");
        }

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
        try {
            return Sort.Direction.fromString(sortDirection == null ? "desc" : sortDirection);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort direction must be 'asc' or 'desc'."
            );
        }
    }

    private void validateCreateCourseVersionRequest(CreateCourseVersionRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required.");
        }

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

    private String normalizeCatalogDescription(String catalogDescription) {
        if (catalogDescription == null) {
            return null;
        }

        String trimmedCatalogDescription = catalogDescription.trim();
        return trimmedCatalogDescription.isEmpty() ? null : trimmedCatalogDescription;
    }

    private Map<Long, CourseVersion> buildCurrentVersionsByCourseId(List<Course> courses) {
        List<Long> courseIds = courses.stream()
                .map(Course::getId)
                .filter(Objects::nonNull)
                .toList();

        if (courseIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, CourseVersion> currentVersionsByCourseId = new LinkedHashMap<>();
        courseVersionRepository.findCurrentCourseVersionsByCourseIds(courseIds)
                .forEach(courseVersion -> {
                    if (courseVersion.getCourse() == null || courseVersion.getCourse().getId() == null) {
                        return;
                    }

                    currentVersionsByCourseId.putIfAbsent(courseVersion.getCourse().getId(), courseVersion);
                });

        return currentVersionsByCourseId;
    }

    private boolean matchesCourseSearchCriteria(
            Course course,
            CourseVersion currentCourseVersion,
            CourseSearchCriteria criteria
    ) {
        if (course == null || course.getSubject() == null || course.getSubject().getDepartment() == null) {
            return false;
        }

        if (!Boolean.TRUE.equals(criteria.getIncludeInactive()) && !course.isActive()) {
            return false;
        }

        if (criteria.getSchoolId() != null) {
            Long schoolId = course.getSubject().getDepartment().getSchool() == null
                    ? null
                    : course.getSubject().getDepartment().getSchool().getId();
            if (!Objects.equals(criteria.getSchoolId(), schoolId)) {
                return false;
            }
        }

        if (criteria.getDepartmentId() != null && !Objects.equals(criteria.getDepartmentId(), course.getSubject().getDepartment().getId())) {
            return false;
        }

        if (criteria.getSubjectId() != null && !Objects.equals(criteria.getSubjectId(), course.getSubject().getId())) {
            return false;
        }

        if (Boolean.TRUE.equals(criteria.getCurrentVersionOnly()) && currentCourseVersion == null) {
            return false;
        }

        if (!containsIgnoreCase(course.getCourseNumber(), criteria.getCourseNumber())) {
            return false;
        }

        if (!containsIgnoreCase(buildCourseCode(course), criteria.getCourseCode())) {
            return false;
        }

        return containsIgnoreCase(
                currentCourseVersion == null ? null : currentCourseVersion.getTitle(),
                criteria.getTitle()
        );
    }

    private Comparator<Course> buildCourseSearchComparator(
            String sortBy,
            String sortDirection,
            Map<Long, CourseVersion> currentVersionsByCourseId
    ) {
        Sort.Direction direction = parseSortDirection(sortDirection);
        String normalizedSortBy = normalizeSortBy(sortBy, "courseNumber");

        Comparator<Course> primaryComparator = switch (normalizedSortBy) {
            case "schoolCode" -> compareStrings(direction, course -> course.getSubject().getDepartment().getSchool().getCode());
            case "schoolName" -> compareStrings(direction, course -> course.getSubject().getDepartment().getSchool().getName());
            case "departmentCode" -> compareStrings(direction, course -> course.getSubject().getDepartment().getCode());
            case "departmentName" -> compareStrings(direction, course -> course.getSubject().getDepartment().getName());
            case "subjectCode" -> compareStrings(direction, course -> course.getSubject().getCode());
            case "subjectName" -> compareStrings(direction, course -> course.getSubject().getName());
            case "courseNumber" -> compareStrings(direction, Course::getCourseNumber);
            case "courseCode" -> compareStrings(direction, this::buildCourseCode);
            case "title" -> compareStrings(direction, course -> {
                CourseVersion currentCourseVersion = currentVersionsByCourseId.get(course.getId());
                return currentCourseVersion == null ? null : currentCourseVersion.getTitle();
            });
            case "credits" -> compareBigDecimals(direction, course -> {
                CourseVersion currentCourseVersion = currentVersionsByCourseId.get(course.getId());
                return currentCourseVersion == null ? null : currentCourseVersion.getMinCredits();
            });
            case "active" -> Comparator.comparing(
                    Course::isActive,
                    direction == Sort.Direction.ASC ? Comparator.naturalOrder() : Comparator.reverseOrder()
            );
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sort by must be one of: schoolCode, schoolName, departmentCode, departmentName, subjectCode, subjectName, courseNumber, courseCode, title, credits, active."
            );
        };

        return primaryComparator
                .thenComparing(compareStrings(Sort.Direction.ASC, this::buildCourseCode))
                .thenComparing(Comparator.comparing(Course::getId, Comparator.nullsLast(Long::compareTo)));
    }

    private Comparator<Course> compareStrings(
            Sort.Direction direction,
            java.util.function.Function<Course, String> valueExtractor
    ) {
        Comparator<String> stringComparator = Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER);
        if (direction == Sort.Direction.DESC) {
            stringComparator = stringComparator.reversed();
        }

        return Comparator.comparing(valueExtractor, stringComparator);
    }

    private Comparator<Course> compareBigDecimals(
            Sort.Direction direction,
            java.util.function.Function<Course, BigDecimal> valueExtractor
    ) {
        Comparator<BigDecimal> bigDecimalComparator = Comparator.nullsLast(BigDecimal::compareTo);
        if (direction == Sort.Direction.DESC) {
            bigDecimalComparator = bigDecimalComparator.reversed();
        }

        return Comparator.comparing(valueExtractor, bigDecimalComparator);
    }

    private boolean containsIgnoreCase(String value, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }

        if (value == null) {
            return false;
        }

        return value.toLowerCase(Locale.US).contains(filter.trim().toLowerCase(Locale.US));
    }

    private String buildCourseCode(Course course) {
        if (course == null || course.getSubject() == null || course.getSubject().getCode() == null) {
            return null;
        }

        return course.getSubject().getCode() + course.getCourseNumber();
    }

    private String normalizeSortBy(String sortBy, String defaultSortBy) {
        if (sortBy == null) {
            return defaultSortBy;
        }

        String trimmedSortBy = sortBy.trim();
        return trimmedSortBy.isEmpty() ? defaultSortBy : trimmedSortBy;
    }

}
