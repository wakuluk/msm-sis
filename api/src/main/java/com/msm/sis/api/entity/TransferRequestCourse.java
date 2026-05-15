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
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transfer_request_course")
public class TransferRequestCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transfer_request_course_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_request_id", nullable = false)
    private TransferRequest transferRequest;

    @Column(name = "external_subject_code", length = 20)
    private String externalSubjectCode;

    @Column(name = "external_course_number", length = 20)
    private String externalCourseNumber;

    @Column(name = "external_course_title", nullable = false)
    private String externalCourseTitle;

    @Column(name = "external_course_description")
    private String externalCourseDescription;

    @Column(name = "external_term")
    private String externalTerm;

    @Column(name = "requested_credits")
    private BigDecimal requestedCredits;

    @Column(name = "attempted_credits")
    private BigDecimal attemptedCredits;

    @Column(name = "earned_credits")
    private BigDecimal earnedCredits;

    @Column(name = "grade")
    private String grade;

    @Column(name = "reason")
    private String reason;

    @Column(name = "student_notes")
    private String studentNotes;

    @Column(name = "requested_local_course_equivalent")
    private String requestedLocalCourseEquivalent;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posted_student_transfer_credit_id")
    private StudentTransferCredit postedStudentTransferCredit;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
