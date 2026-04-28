package com.msm.sis.api.mapper;

import com.msm.sis.api.dto.course.CourseSectionStudentEnrollmentEventResponse;
import com.msm.sis.api.dto.course.CourseSectionStudentGradeResponse;
import com.msm.sis.api.dto.course.CourseSectionStudentResponse;
import com.msm.sis.api.entity.ClassStanding;
import com.msm.sis.api.entity.GradeMark;
import com.msm.sis.api.entity.GradingBasis;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentEvent;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.entity.StudentSectionGrade;
import com.msm.sis.api.entity.StudentSectionGradeType;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Component
public class StudentSectionEnrollmentMapper {
    public CourseSectionStudentResponse toStudentResponse(
            StudentSectionEnrollment enrollment,
            List<StudentSectionGrade> grades
    ) {
        Student student = enrollment.getStudent();
        ClassStanding classStanding = student == null ? null : student.getClassStanding();
        StudentSectionEnrollmentStatus status = enrollment.getStatus();
        GradingBasis gradingBasis = enrollment.getGradingBasis();
        SisUser statusChangedBy = enrollment.getStatusChangedByUser();
        List<StudentSectionGrade> sortedGrades = grades == null
                ? List.of()
                : grades.stream()
                        .sorted(Comparator.comparing(StudentSectionGrade::isCurrent).reversed()
                                .thenComparing(grade -> grade.getPostedAt(), Comparator.nullsLast(Comparator.reverseOrder()))
                                .thenComparing(StudentSectionGrade::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                        .toList();

        return new CourseSectionStudentResponse(
                enrollment.getId(),
                enrollment.getCourseSection() == null ? null : enrollment.getCourseSection().getId(),
                student == null ? null : student.getId(),
                buildStudentDisplayName(student),
                student == null ? null : student.getFirstName(),
                student == null ? null : student.getLastName(),
                student == null ? null : student.getPreferredName(),
                student == null ? null : student.getEmail(),
                classStanding == null ? null : classStanding.getName(),
                status == null ? null : status.getId(),
                status == null ? null : status.getCode(),
                status == null ? null : status.getName(),
                gradingBasis == null ? null : gradingBasis.getId(),
                gradingBasis == null ? null : gradingBasis.getCode(),
                gradingBasis == null ? null : gradingBasis.getName(),
                enrollment.getEnrollmentDate(),
                enrollment.getRegisteredAt(),
                enrollment.getWaitlistedAt(),
                enrollment.getDropDate(),
                enrollment.getWithdrawDate(),
                enrollment.getStatusChangedAt(),
                statusChangedBy == null ? null : statusChangedBy.getId(),
                statusChangedBy == null ? null : statusChangedBy.getEmail(),
                enrollment.getCreditsAttempted(),
                enrollment.getCreditsEarned(),
                enrollment.getWaitlistPosition(),
                enrollment.isIncludeInGpa(),
                enrollment.isCapacityOverride(),
                enrollment.getManualAddReason(),
                findCurrentGrade(sortedGrades, "MIDTERM"),
                findCurrentGrade(sortedGrades, "FINAL"),
                sortedGrades.stream().map(this::toGradeResponse).toList()
        );
    }

    public CourseSectionStudentGradeResponse toGradeResponse(StudentSectionGrade grade) {
        StudentSectionGradeType gradeType = grade.getGradeType();
        GradeMark gradeMark = grade.getGradeMark();
        SisUser postedBy = grade.getPostedByUser();

        return new CourseSectionStudentGradeResponse(
                grade.getId(),
                gradeType == null ? null : gradeType.getId(),
                gradeType == null ? null : gradeType.getCode(),
                gradeType == null ? null : gradeType.getName(),
                gradeMark == null ? null : gradeMark.getId(),
                gradeMark == null ? null : gradeMark.getCode(),
                gradeMark == null ? null : gradeMark.getName(),
                grade.isCurrent(),
                postedBy == null ? null : postedBy.getId(),
                postedBy == null ? null : postedBy.getEmail(),
                grade.getPostedAt()
        );
    }

    public CourseSectionStudentEnrollmentEventResponse toEventResponse(StudentSectionEnrollmentEvent event) {
        StudentSectionEnrollmentStatus fromStatus = event.getFromStatus();
        StudentSectionEnrollmentStatus toStatus = event.getToStatus();
        SisUser actorUser = event.getActorUser();

        return new CourseSectionStudentEnrollmentEventResponse(
                event.getId(),
                event.getStudentSectionEnrollment() == null ? null : event.getStudentSectionEnrollment().getId(),
                event.getEventType(),
                fromStatus == null ? null : fromStatus.getId(),
                fromStatus == null ? null : fromStatus.getCode(),
                fromStatus == null ? null : fromStatus.getName(),
                toStatus == null ? null : toStatus.getId(),
                toStatus == null ? null : toStatus.getCode(),
                toStatus == null ? null : toStatus.getName(),
                actorUser == null ? null : actorUser.getId(),
                actorUser == null ? null : actorUser.getEmail(),
                event.getReason(),
                event.getCreatedAt()
        );
    }

    private CourseSectionStudentGradeResponse findCurrentGrade(
            List<StudentSectionGrade> grades,
            String gradeTypeCode
    ) {
        return grades.stream()
                .filter(StudentSectionGrade::isCurrent)
                .filter(grade -> grade.getGradeType() != null)
                .filter(grade -> gradeTypeCode.equalsIgnoreCase(grade.getGradeType().getCode()))
                .findFirst()
                .map(this::toGradeResponse)
                .orElse(null);
    }

    private String buildStudentDisplayName(Student student) {
        if (student == null) {
            return null;
        }
        String displayFirstName = Optional.ofNullable(trimToNull(student.getPreferredName()))
                .orElse(student.getFirstName());
        return List.of(displayFirstName, student.getLastName()).stream()
                .filter(value -> trimToNull(value) != null)
                .collect(Collectors.joining(" "));
    }
}
