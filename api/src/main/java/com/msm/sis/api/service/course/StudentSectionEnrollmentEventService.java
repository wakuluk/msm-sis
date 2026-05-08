package com.msm.sis.api.service.course;

import com.msm.sis.api.entity.SisUser;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionEnrollmentEvent;
import com.msm.sis.api.entity.StudentSectionEnrollmentStatus;
import com.msm.sis.api.repository.StudentSectionEnrollmentEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class StudentSectionEnrollmentEventService {
    private final StudentSectionEnrollmentEventRepository enrollmentEventRepository;

    public Page<StudentSectionEnrollmentEvent> findPageByEnrollmentId(Long enrollmentId, Pageable pageable) {
        return enrollmentEventRepository.findPageByEnrollmentId(enrollmentId, pageable);
    }

    public void createEvent(
            StudentSectionEnrollment enrollment,
            String eventType,
            StudentSectionEnrollmentStatus fromStatus,
            StudentSectionEnrollmentStatus toStatus,
            SisUser actorUser,
            String reason
    ) {
        StudentSectionEnrollmentEvent event = new StudentSectionEnrollmentEvent();
        event.setStudentSectionEnrollment(enrollment);
        event.setEventType(eventType);
        event.setFromStatus(fromStatus);
        event.setToStatus(toStatus);
        event.setActorUser(actorUser);
        event.setReason(trimToNull(reason));
        enrollmentEventRepository.save(event);
    }
}
