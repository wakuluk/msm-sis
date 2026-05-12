package com.msm.sis.api.service.course;

import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseSection;
import com.msm.sis.api.entity.CourseSectionMeeting;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.entity.StudentSectionEnrollment;
import com.msm.sis.api.entity.StudentSectionWaitlistOffer;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

import static com.msm.sis.api.util.TextUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class StudentSectionWaitlistNotificationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(StudentSectionWaitlistNotificationService.class);
    private static final DateTimeFormatter DEADLINE_FORMATTER = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.email.notifications.enabled:false}")
    private boolean emailNotificationsEnabled;

    @Value("${app.email.notifications.recipient-override:}")
    private String recipientOverride;

    @Value("${app.email.notifications.from:}")
    private String configuredFrom;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public boolean sendWaitlistOfferNotification(StudentSectionWaitlistOffer offer) {
        if (!emailNotificationsEnabled) {
            LOGGER.info("Email notifications are disabled. Skipping waitlist offer email.");
            return false;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOGGER.warn("Email notifications are enabled, but no JavaMailSender is configured.");
            return false;
        }

        Student student = offer.getStudent();
        String recipient = notificationRecipient(student);
        if (recipient == null) {
            LOGGER.warn("Skipping waitlist offer email because no recipient is available. Student id: {}",
                    student == null ? null : student.getId());
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            String from = trimToNull(configuredFrom);
            if (from == null) {
                from = trimToNull(mailUsername);
            }
            if (from != null) {
                message.setFrom(from);
            }
            message.setTo(recipient);
            message.setSubject("Waitlist seat available: " + courseDisplay(offer.getCourseSection()));
            message.setText(messageBody(offer));
            mailSender.send(message);
            return true;
        } catch (MailException exception) {
            LOGGER.error(
                    "Failed to send waitlist offer email for offer id {}, enrollment id {}, student id {}.",
                    offer.getId(),
                    offer.getStudentSectionEnrollment() == null ? null : offer.getStudentSectionEnrollment().getId(),
                    student == null ? null : student.getId(),
                    exception
            );
            return false;
        }
    }

    public boolean sendWaitlistOfferExpiredNotification(StudentSectionWaitlistOffer offer) {
        if (!emailNotificationsEnabled) {
            LOGGER.info("Email notifications are disabled. Skipping waitlist offer expiration email.");
            return false;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOGGER.warn("Email notifications are enabled, but no JavaMailSender is configured.");
            return false;
        }

        Student student = offer.getStudent();
        String recipient = notificationRecipient(student);
        if (recipient == null) {
            LOGGER.warn("Skipping waitlist offer expiration email because no recipient is available. Student id: {}",
                    student == null ? null : student.getId());
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            String from = trimToNull(configuredFrom);
            if (from == null) {
                from = trimToNull(mailUsername);
            }
            if (from != null) {
                message.setFrom(from);
            }
            message.setTo(recipient);
            message.setSubject("Waitlist offer expired: " + courseDisplay(offer.getCourseSection()));
            message.setText(expiredMessageBody(offer));
            mailSender.send(message);
            return true;
        } catch (MailException exception) {
            LOGGER.error(
                    "Failed to send waitlist offer expiration email for offer id {}, enrollment id {}, student id {}.",
                    offer.getId(),
                    offer.getStudentSectionEnrollment() == null ? null : offer.getStudentSectionEnrollment().getId(),
                    student == null ? null : student.getId(),
                    exception
            );
            return false;
        }
    }

    private String messageBody(StudentSectionWaitlistOffer offer) {
        return """
                Hello %s,

                A seat is available from the waitlist.

                Course: %s
                Section: %s
                Credits: %s
                Meeting: %s
                Deadline: %s

                You have 24 hours from the offer time to accept this seat. To accept, sign in and open this link:

                %s

                After you open the page, accept the waitlist offer to add the course to your registration.

                If you do not add the course before the deadline, your waitlist offer will expire and the seat will be offered to the next student on the waitlist.

                This is an automated notification from MSM SIS.
                """.formatted(
                studentDisplayName(offer.getStudent()),
                courseDisplay(offer.getCourseSection()),
                sectionDisplay(offer.getCourseSection()),
                creditsDisplay(offer),
                meetingDisplay(offer.getCourseSection()),
                offer.getExpiresAt() == null ? "-" : offer.getExpiresAt().format(DEADLINE_FORMATTER),
                acceptLink(offer)
        );
    }

    private String expiredMessageBody(StudentSectionWaitlistOffer offer) {
        return """
                Hello %s,

                Your waitlist offer for %s expired at %s.

                This seat has been released to the next student on the waitlist.

                This is an automated notification from MSM SIS.
                """.formatted(
                studentDisplayName(offer.getStudent()),
                courseDisplay(offer.getCourseSection()),
                offer.getExpiresAt() == null ? "-" : offer.getExpiresAt().format(DEADLINE_FORMATTER)
        );
    }

    private String notificationRecipient(Student student) {
        String override = trimToNull(recipientOverride);
        if (override != null) {
            return override;
        }

        return student == null ? null : trimToNull(student.getEmail());
    }

    private String studentDisplayName(Student student) {
        if (student == null) {
            return "student";
        }

        String preferredName = trimToNull(student.getPreferredName());
        String firstName = preferredName == null ? trimToNull(student.getFirstName()) : preferredName;
        String lastName = trimToNull(student.getLastName());
        String displayName = String.join(" ", firstName == null ? "" : firstName, lastName == null ? "" : lastName).trim();
        if (!displayName.isBlank()) {
            return displayName;
        }

        String email = trimToNull(student.getEmail());
        return email == null ? "student" : email;
    }

    private String courseDisplay(CourseSection section) {
        CourseOffering offering = section == null ? null : section.getCourseOffering();
        CourseVersion version = offering == null ? null : offering.getCourseVersion();
        Course course = version == null ? null : version.getCourse();
        String courseCode = courseCode(course);
        String sectionLetter = section == null ? null : trimToNull(section.getSectionLetter());
        String title = section == null ? null : trimToNull(section.getTitle());
        if (title == null && version != null) {
            title = trimToNull(version.getTitle());
        }

        String display = courseCode == null ? "a course" : courseCode;
        if (sectionLetter != null) {
            display += "-" + sectionLetter;
        }
        if (title != null) {
            display += " " + title;
        }

        return display;
    }

    private String sectionDisplay(CourseSection section) {
        if (section == null) {
            return "-";
        }

        String sectionLetter = trimToNull(section.getSectionLetter());
        String startDate = section.getStartDate() == null ? null : section.getStartDate().toString();
        String endDate = section.getEndDate() == null ? null : section.getEndDate().toString();
        String dates = startDate == null && endDate == null
                ? null
                : String.join(" to ", startDate == null ? "-" : startDate, endDate == null ? "-" : endDate);

        if (sectionLetter == null) {
            return dates == null ? "-" : dates;
        }
        return dates == null ? sectionLetter : sectionLetter + " (" + dates + ")";
    }

    private String creditsDisplay(StudentSectionWaitlistOffer offer) {
        StudentSectionEnrollment enrollment = offer.getStudentSectionEnrollment();
        if (enrollment != null && enrollment.getCreditsAttempted() != null) {
            return enrollment.getCreditsAttempted().stripTrailingZeros().toPlainString();
        }

        CourseSection section = offer.getCourseSection();
        if (section != null && section.getCredits() != null) {
            return section.getCredits().stripTrailingZeros().toPlainString();
        }

        return "-";
    }

    private String meetingDisplay(CourseSection section) {
        if (section == null || section.getMeetings() == null || section.getMeetings().isEmpty()) {
            return "No scheduled meetings";
        }

        List<String> meetings = section.getMeetings().stream()
                .sorted(Comparator
                        .comparing(CourseSectionMeeting::getSequenceNumber, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(CourseSectionMeeting::getDayOfWeek, Comparator.nullsLast(Short::compareTo))
                        .thenComparing(CourseSectionMeeting::getStartTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::meetingDisplay)
                .filter(meeting -> !meeting.isBlank())
                .toList();

        return meetings.isEmpty() ? "No scheduled meetings" : String.join("; ", meetings);
    }

    private String meetingDisplay(CourseSectionMeeting meeting) {
        String day = dayDisplay(meeting.getDayOfWeek());
        String startTime = meeting.getStartTime() == null ? null : meeting.getStartTime().format(TIME_FORMATTER);
        String endTime = meeting.getEndTime() == null ? null : meeting.getEndTime().format(TIME_FORMATTER);
        String time = startTime == null && endTime == null
                ? null
                : String.join("-", startTime == null ? "-" : startTime, endTime == null ? "-" : endTime);
        String location = locationDisplay(meeting);

        return String.join(" ", day, time == null ? "" : time, location == null ? "" : location).trim();
    }

    private String dayDisplay(Short dayOfWeek) {
        if (dayOfWeek == null) {
            return "TBA";
        }

        return switch (dayOfWeek) {
            case 1 -> "Mon";
            case 2 -> "Tue";
            case 3 -> "Wed";
            case 4 -> "Thu";
            case 5 -> "Fri";
            case 6 -> "Sat";
            case 7 -> "Sun";
            default -> "TBA";
        };
    }

    private String locationDisplay(CourseSectionMeeting meeting) {
        String building = trimToNull(meeting.getBuilding());
        String room = trimToNull(meeting.getRoom());
        if (building == null && room == null) {
            return null;
        }
        if (building == null) {
            return room;
        }
        if (room == null) {
            return building;
        }

        return building + " " + room;
    }

    private String acceptLink(StudentSectionWaitlistOffer offer) {
        String baseUrl = trimToNull(frontendBaseUrl);
        if (baseUrl == null) {
            baseUrl = "http://localhost:5173";
        }

        while (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        return baseUrl + "/registration/course-registration";
    }

    private String courseCode(Course course) {
        if (course == null) {
            return null;
        }

        AcademicSubject subject = course.getSubject();
        String subjectCode = subject == null ? null : trimToNull(subject.getCode());
        String courseNumber = trimToNull(course.getCourseNumber());
        return String.join(" ", subjectCode == null ? "" : subjectCode, courseNumber == null ? "" : courseNumber).trim();
    }
}
