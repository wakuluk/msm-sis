package com.msm.sis.api.service.course;

import com.msm.sis.api.dto.course.AddCourseSectionStudentRequest;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class StudentSectionEnrollmentStatusService {
    private static final String REGISTERED_STATUS_CODE = "REGISTERED";
    private static final String WAITLISTED_STATUS_CODE = "WAITLISTED";

    private final StudentSectionEnrollmentRepository enrollmentRepository;

    public String determineStatusCode(CourseSection courseSection, AddCourseSectionStudentRequest request) {
        String requestedStatusCode = trimToNull(request.statusCode());
        if (requestedStatusCode != null) {
            validateHardCapacityForRegisteredStatus(courseSection, requestedStatusCode);
            return requestedStatusCode;
        }

        long registeredCount = enrollmentRepository.countBySectionIdAndStatusCode(
                courseSection.getId(),
                REGISTERED_STATUS_CODE
        );
        validateHardCapacity(courseSection, registeredCount);

        boolean hasCapacity = courseSection.getCapacity() == null || registeredCount < courseSection.getCapacity();
        boolean capacityOverride = Optional.ofNullable(request.capacityOverride()).orElse(false);

        if (hasCapacity || capacityOverride) {
            return REGISTERED_STATUS_CODE;
        }
        if (courseSection.isWaitlistAllowed()) {
            return WAITLISTED_STATUS_CODE;
        }

        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Course section is full and waitlist is not allowed."
        );
    }

    public void applyStatusDates(
            StudentSectionEnrollment enrollment,
            StudentSectionEnrollmentStatus status,
            SisUser actorUser
    ) {
        LocalDateTime now = LocalDateTime.now();
        enrollment.setStatusChangedAt(now);
        enrollment.setStatusChangedByUser(actorUser);

        if (isRegistered(status) && enrollment.getRegisteredAt() == null) {
            enrollment.setRegisteredAt(now);
        }
        if (isWaitlisted(status) && enrollment.getWaitlistedAt() == null) {
            enrollment.setWaitlistedAt(now);
        }
        if ("DROPPED".equalsIgnoreCase(status.getCode()) && enrollment.getDropDate() == null) {
            enrollment.setDropDate(statusEffectiveDate(enrollment));
        }
        if ("WITHDRAWN".equalsIgnoreCase(status.getCode()) && enrollment.getWithdrawDate() == null) {
            enrollment.setWithdrawDate(statusEffectiveDate(enrollment));
        }
    }

    public void applyWaitlistState(StudentSectionEnrollment enrollment, StudentSectionEnrollmentStatus status) {
        if (isWaitlisted(status) && enrollment.getWaitlistPosition() == null) {
            enrollment.setWaitlistPosition(nextWaitlistPosition(enrollment.getCourseSection().getId()));
        }
        if (!isWaitlisted(status)) {
            enrollment.setWaitlistPosition(null);
            enrollment.setWaitlistedAt(null);
        }
    }

    public String statusChangeEventType(
            StudentSectionEnrollmentStatus fromStatus,
            StudentSectionEnrollmentStatus toStatus
    ) {
        if (fromStatus != null && isWaitlisted(fromStatus) && isRegistered(toStatus)) {
            return "MOVED_FROM_WAITLIST";
        }
        if (isRegistered(toStatus)) {
            return "REGISTERED";
        }
        if (isWaitlisted(toStatus)) {
            return "WAITLISTED";
        }
        return toStatus == null ? "STATUS_CHANGED" : toStatus.getCode();
    }

    private void validateHardCapacityForRegisteredStatus(CourseSection courseSection, String statusCode) {
        if (!REGISTERED_STATUS_CODE.equalsIgnoreCase(statusCode)) {
            return;
        }

        long registeredCount = enrollmentRepository.countBySectionIdAndStatusCode(
                courseSection.getId(),
                REGISTERED_STATUS_CODE
        );
        validateHardCapacity(courseSection, registeredCount);
    }

    private void validateHardCapacity(CourseSection courseSection, long registeredCount) {
        Integer hardCapacity = courseSection.getHardCapacity();
        if (hardCapacity != null && registeredCount >= hardCapacity) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Course section has reached its hard capacity."
            );
        }
    }

    private LocalDate statusEffectiveDate(StudentSectionEnrollment enrollment) {
        LocalDate today = LocalDate.now();
        LocalDate enrollmentDate = enrollment.getEnrollmentDate();

        if (enrollmentDate == null || !today.isBefore(enrollmentDate)) {
            return today;
        }

        return enrollmentDate;
    }

    private int nextWaitlistPosition(Long sectionId) {
        return enrollmentRepository.findMaxWaitlistPositionBySectionId(sectionId) + 1;
    }

    private boolean isRegistered(StudentSectionEnrollmentStatus status) {
        return status != null && REGISTERED_STATUS_CODE.equalsIgnoreCase(status.getCode());
    }

    private boolean isWaitlisted(StudentSectionEnrollmentStatus status) {
        return status != null && WAITLISTED_STATUS_CODE.equalsIgnoreCase(status.getCode());
    }
}
