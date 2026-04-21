package com.msm.sis.api.dto.course;

import com.msm.sis.api.dto.academic.AcademicDepartmentReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicSubjectReferenceOptionResponse;
import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;

import java.util.List;

public record CoursePickerReferenceOptionsResponse(
        List<CodeNameReferenceOptionResponse> schools,
        List<AcademicDepartmentReferenceOptionResponse> departments,
        List<AcademicSubjectReferenceOptionResponse> subjects,
        List<CourseReferenceOptionResponse> courses
) {
}
