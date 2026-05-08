package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.academic.AcademicDepartmentReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicSubjectReferenceOptionResponse;
import com.msm.sis.api.dto.academic.AcademicSubTermReferenceOptionResponse;
import com.msm.sis.api.dto.catalog.CodeNameReferenceOptionResponse;
import com.msm.sis.api.dto.course.CourseReferenceOptionResponse;
import com.msm.sis.api.dto.reference.GradeMarkReferenceOptionResponse;
import com.msm.sis.api.dto.reference.GradingBasisReferenceOptionResponse;
import com.msm.sis.api.dto.reference.ReferenceOptionResponse;
import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicDivision;
import com.msm.sis.api.entity.AcademicSchool;
import com.msm.sis.api.entity.AcademicSubTerm;
import com.msm.sis.api.entity.AcademicSubTermStatus;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.ClassStanding;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseSectionStatus;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.DegreeType;
import com.msm.sis.api.entity.DeliveryMode;
import com.msm.sis.api.entity.Ethnicity;
import com.msm.sis.api.entity.Gender;
import com.msm.sis.api.entity.GradeMark;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.entity.ProgramType;
import com.msm.sis.api.entity.SectionInstructorRole;
import com.msm.sis.api.entity.SectionMeetingType;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.entity.StudentSectionGradeType;
import org.springframework.stereotype.Component;

@Component
public class ReferenceDataMapper {

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(AcademicDivision reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(AcademicSchool reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(AcademicYear reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(AcademicDepartment reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(AcademicSubTermStatus reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(CourseSectionStatus reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(DeliveryMode reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(GradingBasis reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public GradingBasisReferenceOptionResponse toGradingBasisReferenceOptionResponse(GradingBasis reference) {
        return new GradingBasisReferenceOptionResponse(
                reference.getId(),
                reference.getCode(),
                reference.getName(),
                reference.isAllowedForCourseSections(),
                reference.isAllowedForStudentEnrollments()
        );
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(SectionMeetingType reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(SectionInstructorRole reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            StudentSectionEnrollmentStatus reference
    ) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(StudentSectionGradeType reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(ProgramType reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(DegreeType reference) {
        return toCodeNameReferenceOptionResponse(reference.getId(), reference.getCode(), reference.getName());
    }

    public AcademicDepartmentReferenceOptionResponse toAcademicDepartmentReferenceOptionResponse(
            AcademicDepartment department
    ) {
        AcademicSchool school = department.getSchool();

        return new AcademicDepartmentReferenceOptionResponse(
                department.getId(),
                department.getCode(),
                department.getName(),
                school == null ? null : school.getId()
        );
    }

    public AcademicSubjectReferenceOptionResponse toAcademicSubjectReferenceOptionResponse(AcademicSubject subject) {
        AcademicDepartment department = subject.getDepartment();

        return new AcademicSubjectReferenceOptionResponse(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName()
        );
    }

    public AcademicSubTermReferenceOptionResponse toAcademicSubTermReferenceOptionResponse(AcademicSubTerm subTerm) {
        AcademicYear academicYear = subTerm.getAcademicYear();

        return new AcademicSubTermReferenceOptionResponse(
                subTerm.getId(),
                subTerm.getCode(),
                subTerm.getName(),
                academicYear == null ? null : academicYear.getId(),
                academicYear == null ? null : academicYear.getCode(),
                academicYear == null ? null : academicYear.getName()
        );
    }

    public ReferenceOptionResponse toReferenceOptionResponse(Gender gender) {
        return new ReferenceOptionResponse(gender.getId(), gender.getName());
    }

    public ReferenceOptionResponse toReferenceOptionResponse(Ethnicity ethnicity) {
        return new ReferenceOptionResponse(ethnicity.getId(), ethnicity.getName());
    }

    public ReferenceOptionResponse toReferenceOptionResponse(ClassStanding classStanding) {
        return new ReferenceOptionResponse(classStanding.getId(), classStanding.getName());
    }

    public GradeMarkReferenceOptionResponse toGradeMarkReferenceOptionResponse(GradeMark gradeMark) {
        return new GradeMarkReferenceOptionResponse(
                gradeMark.getId(),
                gradeMark.getCode(),
                gradeMark.getName(),
                gradeMark.getQualityPoints(),
                gradeMark.isEarnsCredit(),
                gradeMark.isCountsInGpa()
        );
    }

    public CourseReferenceOptionResponse toCourseReferenceOptionResponse(
            Course course,
            CourseVersion currentCourseVersion
    ) {
        AcademicSubject subject = course.getSubject();
        AcademicDepartment department = subject == null ? null : subject.getDepartment();
        AcademicSchool school = department == null ? null : department.getSchool();

        return new CourseReferenceOptionResponse(
                course.getId(),
                school == null ? null : school.getId(),
                school == null ? null : school.getCode(),
                school == null ? null : school.getName(),
                department == null ? null : department.getId(),
                department == null ? null : department.getCode(),
                department == null ? null : department.getName(),
                subject == null ? null : subject.getId(),
                subject == null ? null : subject.getCode(),
                subject == null ? null : subject.getName(),
                course.getCourseNumber(),
                buildCourseCode(course),
                course.isLab(),
                currentCourseVersion == null ? null : currentCourseVersion.getId(),
                currentCourseVersion == null ? null : currentCourseVersion.getTitle(),
                currentCourseVersion == null ? null : currentCourseVersion.getMinCredits(),
                currentCourseVersion == null ? null : currentCourseVersion.getMaxCredits(),
                currentCourseVersion != null && currentCourseVersion.isVariableCredit()
        );
    }

    private CodeNameReferenceOptionResponse toCodeNameReferenceOptionResponse(
            Long id,
            String code,
            String name
    ) {
        return new CodeNameReferenceOptionResponse(id, code, name);
    }

    private String buildCourseCode(Course course) {
        return course.getSubject() == null ? null : course.getSubject().getCode() + course.getCourseNumber();
    }
}
