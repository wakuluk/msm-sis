package com.msm.sis.api.dto.instructor.schedule;

import com.msm.sis.api.dto.academic.AcademicDepartmentReferenceOptionResponse;
import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;

import java.util.List;

public record InstructorScheduleReferenceOptionsResponse(
        List<InstructorScheduleAcademicYearOptionResponse> academicYears,
        List<CodeNameReferenceOptionResponse> schools,
        List<AcademicDepartmentReferenceOptionResponse> departments,
        List<CodeNameReferenceOptionResponse> sectionStatuses,
        List<CodeNameReferenceOptionResponse> instructorAssignmentRoles,
        List<CodeNameReferenceOptionResponse> deliveryModes
) {
}
