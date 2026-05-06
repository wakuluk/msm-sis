package com.msm.sis.api.dto.student.program;

import com.msm.sis.api.dto.student.program.planner.StudentAcademicPlanResponse;

import java.util.List;

public record StudentProgramsResponse(
        Long studentId,
        boolean showSubtermPlanner,
        List<StudentProgramResponse> programs,
        StudentAcademicPlanResponse academicPlan
) {
}
