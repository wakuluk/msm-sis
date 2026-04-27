package com.msm.sis.api.dto.reference;

import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;

import java.util.List;

public record CourseSectionReferenceOptionsResponse(
        List<CodeNameReferenceOptionResponse> courseSectionStatuses,
        List<CodeNameReferenceOptionResponse> academicDivisions,
        List<CodeNameReferenceOptionResponse> deliveryModes,
        List<CodeNameReferenceOptionResponse> gradingBases,
        List<CodeNameReferenceOptionResponse> sectionMeetingTypes,
        List<CodeNameReferenceOptionResponse> sectionInstructorRoles,
        List<CodeNameReferenceOptionResponse> studentSectionEnrollmentStatuses,
        List<CodeNameReferenceOptionResponse> studentSectionGradeTypes,
        List<GradeMarkReferenceOptionResponse> gradeMarks
) {
}
