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

import java.util.List;
import java.util.Map;

import static com.msm.sis.api.util.CourseGroupingUtils.collectCourseIds;
import static com.msm.sis.api.util.CourseGroupingUtils.indexFirstVersionByCourseId;
import static com.msm.sis.api.util.PagingUtils.validatePageRequest;
import static com.msm.sis.api.util.SortUtils.parseDirection;
import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final AcademicSubjectRepository academicSubjectRepository;
    private final CourseRepository courseRepository;
    private final CourseVersionRepository courseVersionRepository;
    private final CourseMapper courseMapper;
    private final CourseVersionRequisiteService courseVersionRequisiteService;
    private final CourseValidationService courseValidationService;

    @Transactional
    public CourseVersionDetailResponse createCourse(CreateCourseRequest request) {
        courseValidationService.validateCreateCourseRequest(request);

        AcademicSubject subject = academicSubjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subject id is invalid."));
        String courseNumber = request.courseNumber().trim();

        courseValidationService.validateCourseNumberAvailable(subject, courseNumber);
        courseValidationService.validateAssociatedLabCourseNumberAvailable(subject, request.associatedLab());

        Course course = courseMapper.toCourse(subject, courseNumber, request);
        Course savedCourse = courseRepository.save(course);
        CourseVersion savedCourseVersion = createInitialCourseVersion(savedCourse, request.initialVersion());
        createCourseVersionRequisites(
                savedCourseVersion,
                request.initialVersion()
        );
        CourseVersion associatedLabVersion = createAssociatedLabCourse(
                subject,
                savedCourse,
                savedCourseVersion,
                request.initialVersion(),
                request.associatedLab()
        );

        List<CourseVersionRequisiteGroupResponse> requisites =
                courseVersionRequisiteService.getRequisitesForCourseVersion(savedCourseVersion.getId());
        CourseVersionDetailResponse associatedLabResponse = toAssociatedLabResponse(associatedLabVersion);

        return courseMapper.toCourseVersionDetailResponse(savedCourseVersion, requisites, associatedLabResponse);
    }

    @Transactional
    public CourseVersionDetailResponse createCourseVersion(
            Long courseId,
            CreateCourseVersionRequest request
    ) {
        requirePositiveId(courseId, "Course id");

        courseValidationService.validateCreateCourseVersionRequest(request);

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
        List<CourseVersionRequisiteGroupResponse> requisites = createCourseVersionRequisites(savedCourseVersion, request);
        return courseMapper.toCourseVersionDetailResponse(savedCourseVersion, requisites);
    }

    private CourseVersion createInitialCourseVersion(Course course, CreateCourseVersionRequest request) {
        return courseVersionRepository.save(courseMapper.toCourseVersion(
                course,
                1,
                request,
                normalizeCatalogDescription(request.catalogDescription())
        ));
    }

    private List<CourseVersionRequisiteGroupResponse> createCourseVersionRequisites(
            CourseVersion courseVersion,
            CreateCourseVersionRequest request
    ) {
        return courseVersionRequisiteService.createCourseVersionRequisiteGroups(
                courseVersion.getId(),
                request.requisites()
        );
    }

    private CourseVersion createAssociatedLabCourse(
            AcademicSubject subject,
            Course mainCourse,
            CourseVersion mainCourseVersion,
            CreateCourseVersionRequest mainCourseVersionRequest,
            CreateAssociatedLabCourseRequest request
    ) {
        if (request == null) {
            return null;
        }

        String labCourseNumber = request.courseNumber().trim();
        Course labCourse = courseMapper.toCourse(subject, labCourseNumber, true, request.active());
        Course savedLabCourse = courseRepository.save(labCourse);
        CourseVersion savedLabVersion = createInitialCourseVersion(savedLabCourse, request.initialVersion());
        createCourseVersionRequisites(savedLabVersion, request.initialVersion());
        createBidirectionalAssociatedLabCorequisites(
                mainCourse,
                mainCourseVersion,
                mainCourseVersionRequest,
                savedLabCourse,
                savedLabVersion,
                request
        );
        return savedLabVersion;
    }

    private CourseVersionDetailResponse toAssociatedLabResponse(CourseVersion associatedLabVersion) {
        if (associatedLabVersion == null) {
            return null;
        }

        List<CourseVersionRequisiteGroupResponse> requisites =
                courseVersionRequisiteService.getRequisitesForCourseVersion(associatedLabVersion.getId());
        return courseMapper.toCourseVersionDetailResponse(associatedLabVersion, requisites);
    }

    private void createBidirectionalAssociatedLabCorequisites(
            Course mainCourse,
            CourseVersion mainCourseVersion,
            CreateCourseVersionRequest mainCourseVersionRequest,
            Course labCourse,
            CourseVersion labCourseVersion,
            CreateAssociatedLabCourseRequest request
    ) {
        if (!request.bidirectionalCorequisite()) {
            return;
        }

        courseVersionRequisiteService.createCourseVersionRequisiteGroup(
                mainCourseVersion.getId(),
                createSingleCourseCorequisiteRequest(labCourse.getId(), nextSortOrder(mainCourseVersionRequest))
        );
        courseVersionRequisiteService.createCourseVersionRequisiteGroup(
                labCourseVersion.getId(),
                createSingleCourseCorequisiteRequest(mainCourse.getId(), nextSortOrder(request.initialVersion()))
        );
    }

    private CreateCourseVersionRequisiteGroupRequest createSingleCourseCorequisiteRequest(
            Long courseId,
            Integer sortOrder
    ) {
        return new CreateCourseVersionRequisiteGroupRequest(
                "COREQUISITE",
                "ALL",
                null,
                sortOrder,
                List.of(new CreateCourseVersionRequisiteCourseRequest(courseId, 0))
        );
    }

    private Integer nextSortOrder(CreateCourseVersionRequest request) {
        return request.requisites() == null ? 0 : request.requisites().size();
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
        List<Long> courseVersionIds = courseVersionsPage.getContent().stream()
                .map(CourseVersion::getId)
                .toList();
        Map<Long, List<CourseVersionRequisiteGroupResponse>> requisitesByCourseVersionId =
                courseVersionRequisiteService.getRequisitesForCourseVersions(courseVersionIds);

        return courseMapper.toCourseVersionSearchResponse(
                courseVersionsPage,
                course,
                requisitesByCourseVersionId
        );
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
