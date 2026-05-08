package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CourseVersionDetailResponse;
import com.msm.sis.api.dto.course.CourseVersionRequisiteGroupResponse;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.repository.CourseVersionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;

@Service
public class CourseVersionService {

    private final CourseVersionRepository courseVersionRepository;
    private final CourseMapper courseMapper;
    private final CourseVersionRequisiteService courseVersionRequisiteService;

    public CourseVersionService(
            CourseVersionRepository courseVersionRepository,
            CourseMapper courseMapper,
            CourseVersionRequisiteService courseVersionRequisiteService
    ) {
        this.courseVersionRepository = courseVersionRepository;
        this.courseMapper = courseMapper;
        this.courseVersionRequisiteService = courseVersionRequisiteService;
    }

    @Transactional
    public CourseVersionDetailResponse makeVersionCurrent(Long versionId) {
        requirePositiveId(versionId, "Course version id");

        CourseVersion courseVersion = courseVersionRepository.findCourseVersionById(versionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        Long courseId = courseVersion.getCourse() == null ? null : courseVersion.getCourse().getId();
        if (courseId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        courseVersionRepository.findCurrentCourseVersionsByCourseId(courseId)
                .forEach(currentCourseVersion -> currentCourseVersion.setCurrentVersion(false));

        courseVersionRepository.flush();

        courseVersion.setCurrentVersion(true);
        CourseVersion savedCourseVersion = courseVersionRepository.saveAndFlush(courseVersion);
        List<CourseVersionRequisiteGroupResponse> requisites =
                courseVersionRequisiteService.getRequisitesForCourseVersion(savedCourseVersion.getId());
        return courseMapper.toCourseVersionDetailResponse(savedCourseVersion, requisites);
    }
}
