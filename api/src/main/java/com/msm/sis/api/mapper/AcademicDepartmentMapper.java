package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.AcademicDepartmentResponse;
import com.msm.sis.api.dto.academic.AcademicDepartmentSubjectResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSubject;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AcademicDepartmentMapper {

    public AcademicDepartmentResponse toAcademicDepartmentResponse(AcademicDepartment department) {
        return toAcademicDepartmentResponse(department, List.of());
    }

    public AcademicDepartmentResponse toAcademicDepartmentResponse(
            AcademicDepartment department,
            List<AcademicSubject> subjects
    ) {
        return new AcademicDepartmentResponse(
                department.getId(),
                department.getCode(),
                department.getName(),
                department.isActive(),
                department.getSchool() == null ? null : department.getSchool().getId(),
                department.getSchool() == null ? null : department.getSchool().getCode(),
                department.getSchool() == null ? null : department.getSchool().getName(),
                (subjects == null ? List.<AcademicSubject>of() : subjects).stream()
                        .map(this::toAcademicDepartmentSubjectResponse)
                        .toList()
        );
    }

    public AcademicDepartmentSubjectResponse toAcademicDepartmentSubjectResponse(
            AcademicSubject subject
    ) {
        return new AcademicDepartmentSubjectResponse(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                subject.isActive()
        );
    }
}
