package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.CreateCourseVersionRequisiteCourseRequest;
import com.msm.sis.api.dto.course.CreateCourseVersionRequisiteGroupRequest;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseVersion;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.msm.sis.api.util.ValidationUtils.requirePositiveId;
import static com.msm.sis.api.util.ValidationUtils.requireRequestBody;

@Service
public class CourseVersionRequisiteValidationService {

    private static final String REQUISITE_TYPE_PREREQUISITE = "PREREQUISITE";
    private static final String REQUISITE_TYPE_COREQUISITE = "COREQUISITE";
    private static final String CONDITION_TYPE_ALL = "ALL";
    private static final String CONDITION_TYPE_ANY = "ANY";

    public void validateCreateRequest(
            Long courseVersionId,
            CreateCourseVersionRequisiteGroupRequest request
    ) {
        requirePositiveId(courseVersionId, "Course version id");
        requireRequestBody(request);
    }

    public String normalizeRequisiteType(String requisiteType) {
        String normalizedRequisiteType = normalizeRequiredCode(requisiteType, "Requisite type");
        if (!REQUISITE_TYPE_PREREQUISITE.equals(normalizedRequisiteType)
                && !REQUISITE_TYPE_COREQUISITE.equals(normalizedRequisiteType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requisite type must be PREREQUISITE or COREQUISITE."
            );
        }

        return normalizedRequisiteType;
    }

    public String normalizeConditionType(String conditionType) {
        String normalizedConditionType = normalizeRequiredCode(conditionType, "Condition type");
        if (!CONDITION_TYPE_ALL.equals(normalizedConditionType) && !CONDITION_TYPE_ANY.equals(normalizedConditionType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Condition type must be ALL or ANY.");
        }

        return normalizedConditionType;
    }

    public List<CreateCourseVersionRequisiteCourseRequest> validateCourseRequests(
            List<CreateCourseVersionRequisiteCourseRequest> courseRequests
    ) {
        if (courseRequests == null || courseRequests.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one requisite course is required.");
        }

        Set<Long> courseIds = new HashSet<>();
        for (CreateCourseVersionRequisiteCourseRequest courseRequest : courseRequests) {
            if (courseRequest == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requisite course is required.");
            }

            requirePositiveId(courseRequest.courseId(), "Course id");
            if (!courseIds.add(courseRequest.courseId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Requisite courses cannot contain duplicate course ids."
                );
            }
        }

        return courseRequests;
    }

    public Integer validateMinimumRequired(
            String conditionType,
            Integer minimumRequired,
            int courseCount
    ) {
        if (CONDITION_TYPE_ALL.equals(conditionType)) {
            if (minimumRequired != null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Minimum required can only be set when condition type is ANY."
                );
            }

            return null;
        }

        if (minimumRequired == null || minimumRequired <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Minimum required is required when condition type is ANY."
            );
        }

        if (minimumRequired > courseCount) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Minimum required cannot be greater than the number of requisite courses."
            );
        }

        return minimumRequired;
    }

    public void validateSelectedCourses(
            List<Long> courseIds,
            Map<Long, Course> coursesById,
            CourseVersion courseVersion
    ) {
        for (Long courseId : courseIds) {
            if (!coursesById.containsKey(courseId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Course id " + courseId + " is invalid.");
            }
        }

        Long courseVersionCourseId = courseVersion.getCourse() == null ? null : courseVersion.getCourse().getId();
        if (courseVersionCourseId != null && coursesById.containsKey(courseVersionCourseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A course cannot require itself.");
        }
    }

    private String normalizeRequiredCode(String value, String label) {
        if (value == null || value.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is required.");
        }

        return value.trim().toUpperCase(Locale.ROOT);
    }
}
