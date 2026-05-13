package com.msm.sis.api.service.registration;

import com.msm.sis.api.entity.AcademicTerm;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.RegistrationGroup;
import com.msm.sis.api.entity.RegistrationGroupStudent;
import com.msm.sis.api.entity.Student;
import com.msm.sis.api.dto.registration.RegistrationGroupEmailNotificationResponse;
import com.msm.sis.api.repository.RegistrationGroupRepository;
import com.msm.sis.api.repository.RegistrationGroupStudentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationGroupNotificationService {
    private static final Logger LOGGER = LoggerFactory.getLogger(RegistrationGroupNotificationService.class);
    private static final DateTimeFormatter REGISTRATION_WINDOW_FORMATTER =
            DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final RegistrationGroupRepository registrationGroupRepository;
    private final RegistrationGroupStudentRepository registrationGroupStudentRepository;

    @Value("${app.email.notifications.enabled:false}")
    private boolean emailNotificationsEnabled;

    @Value("${app.email.notifications.recipient-override:}")
    private String recipientOverride;

    @Value("${app.email.notifications.from:}")
    private String configuredFrom;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Async("registrationGroupEmailExecutor")
    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendPublishedRegistrationGroupNotifications(RegistrationGroupsPublishedEvent event) {
        if (!emailNotificationsEnabled) {
            LOGGER.info("Registration group email notifications are disabled. Skipping published group emails.");
            return;
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            LOGGER.warn("Registration group email notifications are enabled, but no JavaMailSender is configured.");
            return;
        }

        List<Long> registrationGroupIds = event.registrationGroupIds();
        if (registrationGroupIds == null || registrationGroupIds.isEmpty()) {
            return;
        }

        registrationGroupStudentRepository.findAssignedStudentsForGroups(registrationGroupIds)
                .forEach(assignment -> sendNotification(
                        mailSender,
                        assignment.getStudent(),
                        assignment.getRegistrationGroup(),
                        false,
                        false
                ));
    }

    @Transactional(readOnly = true)
    public RegistrationGroupEmailNotificationResponse sendTestNotificationForRegistrationGroup(
            Long registrationGroupId
    ) {
        RegistrationGroup registrationGroup = registrationGroupRepository.findRegistrationGroupDetail(registrationGroupId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registration group was not found."
                ));
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "SMTP mail sender is not configured."
            );
        }

        List<RegistrationGroupStudent> assignments =
                registrationGroupStudentRepository.findAssignedStudentsForGroups(List.of(registrationGroupId));
        Student sampleStudent = assignments.stream()
                .map(RegistrationGroupStudent::getStudent)
                .findFirst()
                .orElse(null);
        String recipient = notificationRecipient(sampleStudent);
        if (recipient == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No email recipient is available. Set APP_EMAIL_NOTIFICATIONS_RECIPIENT_OVERRIDE or add a student email."
            );
        }

        sendNotification(mailSender, sampleStudent, registrationGroup, true, true);

        return new RegistrationGroupEmailNotificationResponse(
                registrationGroup.getId(),
                registrationGroup.getName(),
                assignments.size(),
                1,
                recipient,
                "Test registration email sent."
        );
    }

    private void sendNotification(
            JavaMailSender mailSender,
            Student student,
            RegistrationGroup registrationGroup,
            boolean testNotification,
            boolean rethrowFailures
    ) {
        String recipient = notificationRecipient(student);
        if (recipient == null) {
            String message = "Skipping registration group email because no recipient is available.";
            LOGGER.warn("{} Student id: {}", message, student == null ? null : student.getId());
            if (rethrowFailures) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
            }
            return;
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
            message.setSubject(messageSubject(registrationGroup, testNotification));
            message.setText(messageBody(student, registrationGroup, testNotification));
            mailSender.send(message);
        } catch (MailException exception) {
            LOGGER.error(
                    "Failed to send registration group email for registration group id {} and student id {}.",
                    registrationGroup == null ? null : registrationGroup.getId(),
                    student == null ? null : student.getId(),
                    exception
            );
            if (rethrowFailures) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Failed to send test email. Check SMTP host, username, password, and Google app password settings.",
                        exception
                );
            }
        }
    }

    private String notificationRecipient(Student student) {
        String override = trimToNull(recipientOverride);
        if (override != null) {
            return override;
        }

        return student == null ? null : trimToNull(student.getEmail());
    }

    private String messageSubject(RegistrationGroup registrationGroup, boolean testNotification) {
        String prefix = testNotification ? "Test registration email: " : "Registration time published: ";
        return prefix + registrationGroup.getName();
    }

    private String messageBody(
            Student student,
            RegistrationGroup registrationGroup,
            boolean testNotification
    ) {
        AcademicYear academicYear = registrationGroup.getAcademicYear();
        AcademicTerm term = registrationGroup.getTerm();
        return """
                Hello %s,

                %s

                Registration group: %s
                Academic year: %s
                Term: %s
                Opens: %s
                Closes: %s

                This is an automated test notification from MSM SIS.
                """.formatted(
                studentDisplayName(student),
                testNotification
                        ? "This is a test email for a published registration window."
                        : "Your registration window has been published.",
                registrationGroup.getName(),
                displayAcademicYear(academicYear),
                displayTerm(term),
                formatDateTime(registrationGroup.getRegistrationOpensAt()),
                formatDateTime(registrationGroup.getRegistrationClosesAt())
        );
    }

    private String studentDisplayName(Student student) {
        if (student == null) {
            return "student";
        }

        String preferredName = trimToNull(student.getPreferredName());
        String firstName = preferredName == null ? trimToNull(student.getFirstName()) : preferredName;
        String lastName = trimToNull(student.getLastName());
        String displayName = String.join(" ", nonNull(firstName), nonNull(lastName)).trim();
        if (!displayName.isBlank()) {
            return displayName;
        }

        String email = trimToNull(student.getEmail());
        return email == null ? "student" : email;
    }

    private String displayAcademicYear(AcademicYear academicYear) {
        if (academicYear == null) {
            return "-";
        }

        String name = trimToNull(academicYear.getName());
        if (name != null) {
            return name;
        }

        String code = trimToNull(academicYear.getCode());
        return code == null ? "-" : code;
    }

    private String displayTerm(AcademicTerm term) {
        if (term == null) {
            return "-";
        }

        String name = trimToNull(term.getName());
        if (name != null) {
            return name;
        }

        String code = trimToNull(term.getCode());
        return code == null ? "-" : code;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime == null ? "-" : dateTime.format(REGISTRATION_WINDOW_FORMATTER);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private String nonNull(String value) {
        return value == null ? "" : value;
    }
}
