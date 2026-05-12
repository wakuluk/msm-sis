package com.msm.sis.api.service.registration;

import com.msm.sis.api.dto.registration.course.StudentCourseRegistrationScheduleConflictResponse;
import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.repository.CourseSectionMeetingRepository;
import com.msm.sis.api.repository.StudentCourseRegistrationSelectionRepository;
import com.msm.sis.api.repository.StudentSectionEnrollmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentCourseScheduleConflictServiceTest {

    @Mock
    private CourseSectionMeetingRepository meetingRepository;

    @Mock
    private StudentCourseRegistrationSelectionRepository selectionRepository;

    @Mock
    private StudentSectionEnrollmentRepository enrollmentRepository;

    @InjectMocks
    private StudentCourseScheduleConflictService conflictService;

    @Test
    void findRegistrationConflictsBySectionIdDeduplicatesMatchingSameDayMeetings() {
        CourseSection proposedSection = section(10L, "A");
        CourseSection conflictingSection = section(20L, "B");
        RegistrationGroup registrationGroup = registrationGroup(30L);

        CourseSectionMeeting proposedMeeting = meeting(
                proposedSection,
                (short) 2,
                LocalTime.of(9, 0),
                LocalTime.of(10, 15)
        );
        CourseSectionMeeting firstConflictingMeeting = meeting(
                conflictingSection,
                (short) 2,
                LocalTime.of(9, 30),
                LocalTime.of(10, 45)
        );
        CourseSectionMeeting duplicateConflictingMeeting = meeting(
                conflictingSection,
                (short) 2,
                LocalTime.of(9, 30),
                LocalTime.of(10, 45)
        );

        when(enrollmentRepository.findScheduleConflictEnrollmentsForStudentAndTerm(99L, 30L, null))
                .thenReturn(List.of());
        when(meetingRepository.findScheduleConflictMeetingsBySectionIds(List.of(10L, 20L)))
                .thenReturn(List.of(proposedMeeting, firstConflictingMeeting, duplicateConflictingMeeting));

        List<StudentCourseRegistrationScheduleConflictResponse> conflicts = conflictService
                .findRegistrationConflictsBySectionId(
                        99L,
                        registrationGroup,
                        List.of(proposedSection, conflictingSection)
                )
                .get(proposedSection.getId());

        assertThat(conflicts).hasSize(1);
        assertThat(conflicts.getFirst().meetings()).hasSize(1);
    }

    private CourseSection section(Long id, String sectionLetter) {
        CourseSection section = new CourseSection();
        section.setId(id);
        section.setSectionLetter(sectionLetter);
        section.setStartDate(LocalDate.of(2026, 8, 24));
        section.setEndDate(LocalDate.of(2026, 12, 11));
        return section;
    }

    private CourseSectionMeeting meeting(
            CourseSection section,
            Short dayOfWeek,
            LocalTime startTime,
            LocalTime endTime
    ) {
        CourseSectionMeeting meeting = new CourseSectionMeeting();
        meeting.setCourseSection(section);
        meeting.setDayOfWeek(dayOfWeek);
        meeting.setStartTime(startTime);
        meeting.setEndTime(endTime);
        return meeting;
    }

    private RegistrationGroup registrationGroup(Long termId) {
        AcademicTerm term = new AcademicTerm();
        term.setId(termId);

        RegistrationGroup registrationGroup = new RegistrationGroup();
        registrationGroup.setId(40L);
        registrationGroup.setTerm(term);
        return registrationGroup;
    }
}
