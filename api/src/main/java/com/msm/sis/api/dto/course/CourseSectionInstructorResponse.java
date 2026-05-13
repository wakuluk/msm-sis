package com.msm.sis.api.dto.course;

public record CourseSectionInstructorResponse(
        Long sectionInstructorId,
        Long staffId,
        String firstName,
        String lastName,
        String email,
        Long roleId,
        String roleCode,
        String roleName,
        boolean primary,
        boolean canViewGrades,
        boolean canManageGrades
) {
}
