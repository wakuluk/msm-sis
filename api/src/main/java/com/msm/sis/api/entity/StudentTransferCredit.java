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
import jakarta.persistence.Table;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "student_transfer_credit")
public class StudentTransferCredit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_transfer_credit_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_institution_id", nullable = false)
    private TransferInstitution transferInstitution;

    @Column(name = "external_term_label", nullable = false)
    private String externalTermLabel;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "transcript_sort_date", nullable = false)
    private LocalDate transcriptSortDate;

    @Column(name = "external_subject_code", nullable = false)
    private String externalSubjectCode;

    @Column(name = "external_course_number", nullable = false)
    private String externalCourseNumber;

    @Column(name = "external_course_title", nullable = false)
    private String externalCourseTitle;

    @Column(name = "local_subject_code")
    private String localSubjectCode;

    @Column(name = "local_course_number")
    private String localCourseNumber;

    @Column(name = "local_course_title")
    private String localCourseTitle;

    @Column(name = "transfer_grade_mark")
    private String transferGradeMark;

    @Column(name = "credits_attempted", nullable = false)
    private BigDecimal creditsAttempted;

    @Column(name = "credits_earned", nullable = false)
    private BigDecimal creditsEarned;

    @Column(name = "gpa_credits", nullable = false)
    private BigDecimal gpaCredits;

    @Column(name = "quality_points", nullable = false)
    private BigDecimal qualityPoints;

    @Column(name = "include_in_gpa", nullable = false)
    private boolean includeInGpa = false;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "posted_at", insertable = false, updatable = false)
    private LocalDateTime postedAt;

    @Column(name = "notes")
    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
