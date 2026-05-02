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
        name = "course_section",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_course_section_offering_sub_term_letter",
                        columnNames = {"course_offering_id", "sub_term_id", "section_letter", "is_honors", "is_lab"}
                )
        }
)
public class CourseSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "section_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_offering_id", nullable = false)
    private CourseOffering courseOffering;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_term_id", nullable = false)
    private AcademicSubTerm subTerm;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_division_id")
    private AcademicDivision academicDivision;

    @Column(name = "section_letter", nullable = false, length = 5)
    private String sectionLetter;

    @Column(name = "title")
    private String title;

    @Column(name = "is_honors", nullable = false)
    private boolean honors = false;

    @Column(name = "is_lab", nullable = false)
    private boolean lab = false;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_section_status_id", nullable = false)
    private CourseSectionStatus status;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_mode_id", nullable = false)
    private DeliveryMode deliveryMode;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grading_basis_id", nullable = false)
    private GradingBasis gradingBasis;

    @Column(name = "credits", nullable = false)
    private BigDecimal credits;

    @Column(name = "capacity", nullable = false)
    private Integer capacity = 0;

    @Column(name = "hard_capacity")
    private Integer hardCapacity;

    @Column(name = "waitlist_allowed", nullable = false)
    private boolean waitlistAllowed = false;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "start_date")
    private LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "end_date")
    private LocalDate endDate;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_section_id")
    private CourseSection parentSection;

    @JsonIgnore
    @OneToMany(mappedBy = "parentSection")
    private List<CourseSection> childSections = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "courseSection")
    private List<CourseSectionInstructor> instructors = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "courseSection")
    private List<CourseSectionMeeting> meetings = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "courseSection")
    private List<StudentSectionEnrollment> enrollments = new ArrayList<>();

    @Column(name = "linked_group_code", length = 50)
    private String linkedGroupCode;

    @Column(name = "notes", length = 500)
    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
