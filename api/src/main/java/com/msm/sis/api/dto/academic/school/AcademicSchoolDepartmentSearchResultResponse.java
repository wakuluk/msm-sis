package com.msm.sis.api.dto.academic.school;

public record AcademicSchoolDepartmentSearchResultResponse(
    Long schoolId,
    String schoolCode,
    String schoolName,
    boolean schoolActive,
    Long departmentId,
    String departmentCode,
    String departmentName,
    boolean departmentActive
){ }

