package com.msm.sis.api.exception;

import com.msm.sis.api.dto.course.CourseSectionInstructorConflictResponse;

import java.util.List;

public class CourseSectionInstructorConflictException extends RuntimeException {
    private final List<CourseSectionInstructorConflictResponse> conflicts;

    public CourseSectionInstructorConflictException(
            String message,
            List<CourseSectionInstructorConflictResponse> conflicts
    ) {
        super(message);
        this.conflicts = conflicts == null ? List.of() : List.copyOf(conflicts);
    }

    public List<CourseSectionInstructorConflictResponse> getConflicts() {
        return conflicts;
    }
}
