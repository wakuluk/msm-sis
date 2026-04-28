package com.msm.sis.api.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(
        name = "student_section_enrollment",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_student_section_enrollment_student_section",
                        columnNames = {"student_id", "section_id"}
                )
        }
)
public class StudentSectionEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_section_enrollment_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private CourseSection courseSection;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_section_enrollment_status_id", nullable = false)
    private StudentSectionEnrollmentStatus status;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grading_basis_id", nullable = false)
    private GradingBasis gradingBasis;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "enrollment_date", nullable = false)
    private LocalDate enrollmentDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "waitlisted_at")
    private LocalDateTime waitlistedAt;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "drop_date")
    private LocalDate dropDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "withdraw_date")
    private LocalDate withdrawDate;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "status_changed_at")
    private LocalDateTime statusChangedAt;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_changed_by_user_id")
    private SisUser statusChangedByUser;

    @Column(name = "credits_attempted")
    private BigDecimal creditsAttempted;

    @Column(name = "credits_earned")
    private BigDecimal creditsEarned;

    @Column(name = "waitlist_position")
    private Integer waitlistPosition;

    @Column(name = "include_in_gpa", nullable = false)
    private boolean includeInGpa = true;

    @Column(name = "repeat_code", length = 30)
    private String repeatCode;

    @Column(name = "capacity_override", nullable = false)
    private boolean capacityOverride = false;

    @Column(name = "manual_add_reason", length = 500)
    private String manualAddReason;

    @JsonIgnore
    @OneToMany(mappedBy = "studentSectionEnrollment")
    private List<StudentSectionGrade> grades = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "studentSectionEnrollment")
    private List<StudentSectionEnrollmentEvent> events = new ArrayList<>();

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
