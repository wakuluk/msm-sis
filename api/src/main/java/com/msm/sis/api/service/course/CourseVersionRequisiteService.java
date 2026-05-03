package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CourseVersionRequisiteGroupResponse;
import com.msm.sis.api.dto.course.CreateCourseVersionRequisiteCourseRequest;
import com.msm.sis.api.dto.course.CreateCourseVersionRequisiteGroupRequest;
import com.msm.sis.api.mapper.CourseVersionRequisiteMapper;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.CourseVersionRequisiteCourse;
import com.msm.sis.api.entity.CourseVersionRequisiteGroup;
import com.msm.sis.api.repository.CourseRepository;
import com.msm.sis.api.repository.CourseVersionRepository;
import com.msm.sis.api.repository.CourseVersionRequisiteCourseRepository;
import com.msm.sis.api.repository.CourseVersionRequisiteGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
@RequiredArgsConstructor
public class CourseVersionRequisiteService {

    private final CourseVersionRepository courseVersionRepository;
    private final CourseRepository courseRepository;
    private final CourseVersionRequisiteGroupRepository requisiteGroupRepository;
    private final CourseVersionRequisiteCourseRepository requisiteCourseRepository;
    private final CourseVersionRequisiteValidationService validationService;
    private final CourseVersionRequisiteMapper requisiteMapper;

    @Transactional
    public CourseVersionRequisiteGroupResponse createCourseVersionRequisiteGroup(
            Long courseVersionId,
            CreateCourseVersionRequisiteGroupRequest request
    ) {
        validationService.validateCreateRequest(courseVersionId, request);

        CourseVersion courseVersion = courseVersionRepository.findCourseVersionById(courseVersionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String requisiteType = validationService.normalizeRequisiteType(request.requisiteType());
        String conditionType = validationService.normalizeConditionType(request.conditionType());
        List<CreateCourseVersionRequisiteCourseRequest> courseRequests = validationService.validateCourseRequests(
                request.courses()
        );
        Integer minimumRequired = validationService.validateMinimumRequired(
                conditionType,
                request.minimumRequired(),
                courseRequests.size()
        );
        Map<Long, Course> coursesById = findCoursesById(courseRequests, courseVersion);

        CourseVersionRequisiteGroup group = requisiteMapper.toGroup(
                courseVersion,
                requisiteType,
                conditionType,
                minimumRequired,
                request.sortOrder()
        );
        CourseVersionRequisiteGroup savedGroup = requisiteGroupRepository.save(group);
        List<CourseVersionRequisiteCourse> requisiteCourses = courseRequests.stream()
                .map(courseRequest -> requisiteMapper.toCourse(savedGroup, courseRequest, coursesById))
                .toList();

        List<CourseVersionRequisiteCourse> savedCourses = requisiteCourseRepository.saveAll(requisiteCourses);
        return requisiteMapper.toGroupResponse(savedGroup, savedCourses);
    }

    @Transactional
    public List<CourseVersionRequisiteGroupResponse> createCourseVersionRequisiteGroups(
            Long courseVersionId,
            List<CreateCourseVersionRequisiteGroupRequest> requests
    ) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        return requests.stream()
                .map(request -> createCourseVersionRequisiteGroup(courseVersionId, request))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseVersionRequisiteGroupResponse> getRequisitesForCourseVersion(Long courseVersionId) {
        requirePositiveId(courseVersionId, "Course version id");

        List<CourseVersionRequisiteGroup> groups = requisiteGroupRepository.findGroupsForCourseVersion(
                courseVersionId
        );
        return mapGroupsToResponses(groups);
    }

    @Transactional(readOnly = true)
    public Map<Long, List<CourseVersionRequisiteGroupResponse>> getRequisitesForCourseVersions(
            List<Long> courseVersionIds
    ) {
        if (courseVersionIds == null || courseVersionIds.isEmpty()) {
            return Map.of();
        }

        List<CourseVersionRequisiteGroup> groups = requisiteGroupRepository.findGroupsForCourseVersions(
                courseVersionIds
        );
        Map<Long, List<CourseVersionRequisiteGroupResponse>> requisitesByCourseVersionId = new LinkedHashMap<>();
        Map<Long, List<CourseVersionRequisiteCourse>> coursesByGroupId = findCoursesByGroupId(groups);

        groups.forEach(group -> {
            Long courseVersionId = group.getCourseVersion().getId();
            requisitesByCourseVersionId.computeIfAbsent(courseVersionId, ignored -> new ArrayList<>())
                    .add(requisiteMapper.toGroupResponse(
                            group,
                            coursesByGroupId.getOrDefault(group.getId(), List.of())
                    ));
        });

        return requisitesByCourseVersionId;
    }

    private Map<Long, Course> findCoursesById(
            List<CreateCourseVersionRequisiteCourseRequest> courseRequests,
            CourseVersion courseVersion
    ) {
        List<Long> courseIds = courseRequests.stream()
                .map(CreateCourseVersionRequisiteCourseRequest::courseId)
                .toList();

        Map<Long, Course> coursesById = new LinkedHashMap<>();
        courseRepository.findCoursesByIds(courseIds).forEach(course -> coursesById.put(course.getId(), course));

        validationService.validateSelectedCourses(courseIds, coursesById, courseVersion);
        return coursesById;
    }

    private List<CourseVersionRequisiteGroupResponse> mapGroupsToResponses(
            List<CourseVersionRequisiteGroup> groups
    ) {
        if (groups.isEmpty()) {
            return List.of();
        }

        Map<Long, List<CourseVersionRequisiteCourse>> coursesByGroupId = findCoursesByGroupId(groups);

        return groups.stream()
                .map(group -> requisiteMapper.toGroupResponse(
                        group,
                        coursesByGroupId.getOrDefault(group.getId(), List.of())
                ))
                .toList();
    }

    private Map<Long, List<CourseVersionRequisiteCourse>> findCoursesByGroupId(
            List<CourseVersionRequisiteGroup> groups
    ) {
        if (groups.isEmpty()) {
            return Map.of();
        }

        List<Long> groupIds = groups.stream()
                .map(CourseVersionRequisiteGroup::getId)
                .toList();
        List<CourseVersionRequisiteCourse> courses = requisiteCourseRepository.findCoursesForGroups(groupIds);
        Map<Long, List<CourseVersionRequisiteCourse>> coursesByGroupId = new LinkedHashMap<>();
        courses.forEach(course -> coursesByGroupId
                .computeIfAbsent(course.getGroup().getId(), ignored -> new ArrayList<>())
                .add(course));
        return coursesByGroupId;
    }
}
