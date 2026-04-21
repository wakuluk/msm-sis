package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CourseVersionDetailResponse;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.mapper.CourseMapper;
import com.msm.sis.api.repository.CourseVersionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CourseVersionService {

    private final CourseVersionRepository courseVersionRepository;
    private final CourseMapper courseMapper;

    public CourseVersionService(
            CourseVersionRepository courseVersionRepository,
            CourseMapper courseMapper
    ) {
        this.courseVersionRepository = courseVersionRepository;
        this.courseMapper = courseMapper;
    }

    @Transactional
    public CourseVersionDetailResponse makeVersionCurrent(Long versionId) {
        if (versionId == null || versionId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Course version id must be a positive number."
            );
        }

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
        return courseMapper.toCourseVersionDetailResponse(savedCourseVersion);
    }
}
