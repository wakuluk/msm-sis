package com.msm.sis.api.exception;

import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationScheduleConflictResponse;

import java.util.List;

public class StudentCourseRegistrationScheduleConflictException extends RuntimeException {
    private final List<StudentCourseRegistrationScheduleConflictResponse> conflicts;

    public StudentCourseRegistrationScheduleConflictException(
            String message,
            List<StudentCourseRegistrationScheduleConflictResponse> conflicts
    ) {
        super(message);
        this.conflicts = conflicts == null ? List.of() : List.copyOf(conflicts);
    }

    public List<StudentCourseRegistrationScheduleConflictResponse> getConflicts() {
        return conflicts;
    }
}
